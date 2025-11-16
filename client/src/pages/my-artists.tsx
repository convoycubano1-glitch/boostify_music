import { useState } from "react";
import { useAuth } from "../hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { useToast } from "../hooks/use-toast";
import { Link } from "wouter";
import {
  Plus,
  User,
  Music,
  MapPin,
  ExternalLink,
  Loader2,
  Sparkles,
  Bot
} from "lucide-react";
import { Head } from "../components/ui/head";

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
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

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
      const response = await apiRequest<Artist>("/api/artist-generator/generate-artist/secure", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "¡Artista creado!",
        description: `${data.name} ha sido creado exitosamente`,
      });
      refetch();
      setIsGenerating(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "No se pudo crear el artista",
        variant: "destructive",
      });
      setIsGenerating(false);
    },
  });

  const handleCreateArtist = async () => {
    setIsGenerating(true);
    createArtistMutation.mutate();
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
                Administra tus artistas generados con IA
              </p>
            </div>
            <Button
              onClick={handleCreateArtist}
              disabled={isGenerating}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
              data-testid="button-create-artist"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generando...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Nuevo Artista
                </>
              )}
            </Button>
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

                    <Link href={`/artist/${artist.slug}`}>
                      <Button
                        variant="outline"
                        className="w-full border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                        data-testid={`button-view-artist-${artist.id}`}
                      >
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Ver Perfil
                      </Button>
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
