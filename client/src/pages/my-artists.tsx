import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { PlanTierGuard } from "../components/youtube-views/plan-tier-guard";
import { Link, useLocation } from "wouter";
import {
  Plus,
  User,
  Music,
  MapPin,
  ExternalLink,
  Loader2,
  Sparkles,
  Bot,
  UserPlus,
  Wrench,
  Trash2
} from "lucide-react";
import { fixGeneratedByForUserArtists } from "../lib/api/artist-profile-service";
import { Head } from "../components/ui/head";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { AIGenerationModal } from "../components/artist/ai-generation-modal";

interface Artist {
  id: number;
  firestoreId: string;
  name: string;
  slug: string;
  biography?: string;
  profileImage?: string;
  coverImage?: string;
  genres?: string[];
  country?: string;
  isAIGenerated: boolean;
  createdAt?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  spotify?: string;
}

export default function MyArtistsPage() {
  const { user, isLoading: authLoading, userSubscription } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Detectar si el usuario es admin
  const isAdmin = user?.email === 'convoycubano@gmail.com';
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAIGenerationModal, setShowAIGenerationModal] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [deletingArtistId, setDeletingArtistId] = useState<number | null>(null);
  
  // Form state for manual artist creation
  const [manualArtistForm, setManualArtistForm] = useState({
    name: "",
    biography: "",
    genre: "",
    location: "",
  });

  // Query para obtener los artistas del usuario
  const { data: artistsData, isLoading: artistsLoading, refetch } = useQuery<{
    success: boolean;
    count: number;
    artists: Artist[];
  }>({
    queryKey: ["/api/artist-generator/my-artists"],
    enabled: !!user
  });

  // Mutation para crear un nuevo artista
  const createArtistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest({
        url: "/api/artist-generator/generate-artist/secure",
        method: "POST"
      });
      return response;
    },
    onSuccess: (data) => {
      // El modal se cierra automáticamente cuando detecta isGenerating = false
      toast({
        title: "¡Artista creado!",
        description: `${data.name} ha sido creado exitosamente`,
      });
      refetch();
      setIsGenerating(false);
    },
    onError: (error: any) => {
      // Cerrar modal inmediatamente en caso de error
      setShowAIGenerationModal(false);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el artista",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  // Mutation para eliminar un artista
  const deleteArtistMutation = useMutation({
    mutationFn: async (artistId: number) => {
      setDeletingArtistId(artistId);
      const response = await apiRequest({
        url: `/api/artist-generator/delete-artist/${artistId}`,
        method: "DELETE"
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Artista eliminado",
        description: "El artista ha sido eliminado exitosamente",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/artist-generator/my-artists"] });
      setDeletingArtistId(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo eliminar el artista",
        variant: "destructive",
      });
      setDeletingArtistId(null);
    },
  });

  // Mutation para actualizar artistas AI existentes
  const fixArtistsMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id || !user?.email) {
        throw new Error('Usuario no válido');
      }
      return await fixGeneratedByForUserArtists(user.id, user.email);
    },
    onSuccess: (data) => {
      if (data.success) {
        toast({
          title: "✅ Artistas Actualizados",
          description: data.message || `${data.updated} perfiles actualizados correctamente`,
        });
        refetch();
      } else {
        toast({
          title: "Información",
          description: data.message || "No se encontraron artistas para actualizar",
        });
      }
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudieron actualizar los artistas",
        variant: "destructive",
      });
    },
  });

  const handleCreateArtist = async () => {
    setIsGenerating(true);
    setShowAIGenerationModal(true);
    createArtistMutation.mutate();
  };

  const handleCreateManualArtist = async () => {
    if (!manualArtistForm.name.trim()) {
      toast({
        title: "Nombre requerido",
        description: "Por favor ingresa un nombre para el artista",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Create slug from name
      const slug = manualArtistForm.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const response = await apiRequest({
        url: "/api/artist-generator/create-manual",
        method: "POST",
        data: {
          name: manualArtistForm.name,
          biography: manualArtistForm.biography,
          genre: manualArtistForm.genre,
          location: manualArtistForm.location,
          slug
        }
      });

      toast({
        title: "¡Artista creado!",
        description: `${manualArtistForm.name} ha sido creado exitosamente`,
      });

      // Reset form
      setManualArtistForm({
        name: "",
        biography: "",
        genre: "",
        location: "",
      });
      
      setIsDialogOpen(false);
      refetch();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el artista",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteArtist = (artistId: number, artistName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar a ${artistName}? Esta acción no se puede deshacer.`)) {
      deleteArtistMutation.mutate(artistId);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Acceso Restringido</h1>
          <p className="text-gray-400 mb-6">
            Debes iniciar sesión para ver tus artistas
          </p>
          <Link href="/auth">
            <Button>Iniciar Sesión</Button>
          </Link>
        </div>
      </div>
    );
  }

  const artists = artistsData?.artists || [];

  return (
    <PlanTierGuard 
      requiredPlan="premium" 
      userSubscription={userSubscription} 
      featureName="Artist Generation"
      isAdmin={isAdmin}
    >
      <>
        <Head
          title="My Artists | Boostify Music"
          description="Administra todos tus artistas generados con IA en Boostify Music"
          url={window.location.href}
        />
        <div className="min-h-screen bg-black text-white py-8">
          <div className="container mx-auto px-4 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2 bg-gradient-to-r from-orange-500 to-orange-600 bg-clip-text text-transparent">
                My Artists
              </h1>
              <p className="text-gray-400">
                Administra todos tus artistas
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {/* Botón para arreglar artistas AI existentes */}
              {artists.some(a => a.isAIGenerated) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fixArtistsMutation.mutate()}
                  disabled={fixArtistsMutation.isPending}
                  className="border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white"
                  data-testid="button-fix-ai-artists"
                >
                  {fixArtistsMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Actualizando...
                    </>
                  ) : (
                    <>
                      <Wrench className="h-4 w-4 mr-2" />
                      Arreglar Artistas AI
                    </>
                  )}
                </Button>
              )}
              
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                    data-testid="button-create-manual-artist"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Crear Manualmente
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-gray-800 text-white">
                  <DialogHeader>
                    <DialogTitle>Crear Nuevo Artista</DialogTitle>
                    <DialogDescription className="text-gray-400">
                      Ingresa la información básica del artista
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nombre del Artista *</Label>
                      <Input
                        id="name"
                        placeholder="Ej: John Doe"
                        value={manualArtistForm.name}
                        onChange={(e) => setManualArtistForm({ ...manualArtistForm, name: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="genre">Género Musical</Label>
                      <Input
                        id="genre"
                        placeholder="Ej: Pop, Rock, Hip-Hop"
                        value={manualArtistForm.genre}
                        onChange={(e) => setManualArtistForm({ ...manualArtistForm, genre: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Ubicación</Label>
                      <Input
                        id="location"
                        placeholder="Ej: Miami, FL"
                        value={manualArtistForm.location}
                        onChange={(e) => setManualArtistForm({ ...manualArtistForm, location: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="biography">Biografía</Label>
                      <Textarea
                        id="biography"
                        placeholder="Cuéntanos sobre el artista..."
                        rows={4}
                        value={manualArtistForm.biography}
                        onChange={(e) => setManualArtistForm({ ...manualArtistForm, biography: e.target.value })}
                        className="bg-gray-800 border-gray-700"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      disabled={isCreating}
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateManualArtist}
                      disabled={isCreating}
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    >
                      {isCreating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Creando...
                        </>
                      ) : (
                        "Crear Artista"
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Button
                onClick={handleCreateArtist}
                disabled={isGenerating}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                data-testid="button-create-ai-artist"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Bot className="h-4 w-4 mr-2" />
                    Generar con IA
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <Card className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-500/10 rounded-lg">
                  <User className="h-6 w-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Total Artistas</p>
                  <p className="text-2xl font-bold">{artists.length}</p>
                </div>
              </div>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <Bot className="h-6 w-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Generados con IA</p>
                  <p className="text-2xl font-bold">
                    {artists.filter(a => a.isAIGenerated).length}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="bg-gray-900 border-gray-800 p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <Music className="h-6 w-6 text-green-500" />
                </div>
                <div>
                  <p className="text-gray-400 text-sm">Géneros Únicos</p>
                  <p className="text-2xl font-bold">
                    {new Set(artists.flatMap(a => a.genres || [])).size}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Artists Grid */}
          {artistsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
            </div>
          ) : artists.length === 0 ? (
            <Card className="bg-gray-900 border-gray-800 p-12 text-center">
              <Sparkles className="h-16 w-16 text-orange-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No tienes artistas aún</h3>
              <p className="text-gray-400 mb-6">
                Crea tu primer artista con IA para comenzar
              </p>
              <Button
                onClick={handleCreateArtist}
                disabled={isGenerating}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Generando...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Mi Primer Artista
                  </>
                )}
              </Button>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {artists.map((artist) => (
                <Card
                  key={artist.id}
                  className="bg-gray-900 border-gray-800 overflow-hidden hover:border-orange-500 transition-all duration-300 group"
                  data-testid={`card-artist-${artist.id}`}
                >
                  {/* Cover Image */}
                  <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900">
                    {artist.coverImage || artist.profileImage ? (
                      <img
                        src={artist.coverImage || artist.profileImage}
                        alt={artist.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Music className="h-16 w-16 text-gray-700" />
                      </div>
                    )}
                    {artist.isAIGenerated && (
                      <div className="absolute top-3 right-3">
                        <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                          <Bot className="h-3 w-3" />
                          AI Generated
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-2 truncate">{artist.name}</h3>
                    
                    {artist.genres && artist.genres.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {artist.genres.slice(0, 2).map((genre, idx) => (
                          <span
                            key={idx}
                            className="text-xs px-2 py-1 bg-orange-500/10 text-orange-500 rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    )}

                    {artist.country && (
                      <div className="flex items-center gap-2 text-sm text-gray-400 mb-3">
                        <MapPin className="h-4 w-4" />
                        {artist.country}
                      </div>
                    )}

                    {artist.biography && (
                      <p className="text-sm text-gray-400 line-clamp-3 mb-4">
                        {artist.biography}
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/artist/${artist.slug}`} className="flex-1">
                        <Button
                          variant="outline"
                          className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                          data-testid={`button-view-artist-${artist.id}`}
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Ver Perfil
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="icon"
                        className="border-red-500 text-red-500 hover:bg-red-500 hover:text-white"
                        onClick={() => handleDeleteArtist(artist.id, artist.name)}
                        disabled={deletingArtistId === artist.id}
                        data-testid={`button-delete-artist-${artist.id}`}
                      >
                        {deletingArtistId === artist.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
          </div>
        </div>

        {/* Modal de Generación con IA */}
        <AIGenerationModal 
          isOpen={showAIGenerationModal}
          isGenerating={createArtistMutation.isPending}
          onClose={() => setShowAIGenerationModal(false)}
        />
      </>
    </PlanTierGuard>
  );
}
