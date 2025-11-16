import { ArtistProfileCard } from "../components/artist/artist-profile-card";
import { useParams, Link } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Head } from "../components/ui/head";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { Plus, Users, Loader2 } from "lucide-react";
import { useState } from "react";

interface ArtistData {
  name: string;
  biography: string;
  profileImage: string;
  genre?: string;
  location?: string;
  socialLinks?: {
    spotify?: string;
    instagram?: string;
    youtube?: string;
  };
}

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Use the URL id or fallback to the authenticated user's id
  const artistId = id || (user?.id ? String(user.id) : null);
  
  // Check if this is the user's own profile
  const isOwnProfile = !id && !!user;

  // Query para obtener datos del artista
  const { data: artistData, isLoading } = useQuery<ArtistData>({
    queryKey: ["/api/artist", artistId],
    enabled: !!artistId
  });
  
  // Mutation para crear un nuevo artista
  const createArtistMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest<any>("/api/artist-generator/generate-artist/secure", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      return response;
    },
    onSuccess: (data) => {
      toast({
        title: "¡Artista creado!",
        description: `${data.name} ha sido creado exitosamente. Ve a "My Artists" para verlo.`,
      });
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

  if (!artistId || isLoading) {
    return (
      <div className="min-h-screen bg-black pt-4 flex items-center justify-center">
        <p className="text-white">Loading profile...</p>
      </div>
    );
  }

  const fullUrl = window.location.origin + '/profile/' + artistId;

  // Usar imagen Open Graph dinámica generada por el servidor
  // Esta imagen incluye: nombre del artista, género, biografía, imagen de perfil, badge AI si aplica
  const ogImageUrl = `${window.location.origin}/api/og-image/artist/${artistId}`;
  
  // Fallback a imagen de perfil si la OG image falla
  const getAbsoluteImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return `${window.location.origin}/assets/freepik__boostify_music_organe_abstract_icon.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${window.location.origin}${imageUrl}`;
  };

  const profileImage = getAbsoluteImageUrl(artistData?.profileImage);

  // Valores por defecto para meta tags
  const title = artistData?.name 
    ? `${artistData.name} - Music Artist Profile | Boostify Music`
    : "Discover Amazing Musicians on Boostify Music";

  const description = artistData?.biography 
    ? `Check out ${artistData.name}'s music profile on Boostify Music. ${artistData.biography.slice(0, 150)}${artistData.biography.length > 150 ? '...' : ''}`
    : `Discover and connect with talented musicians on Boostify Music. Join our community of artists, producers, and music enthusiasts.`;

  return (
    <>
      {/* Solo renderizar Head cuando tenemos los datos necesarios */}
      {artistData && (
        <Head
          title={title}
          description={description}
          url={fullUrl}
          image={ogImageUrl}
          type="profile"
          siteName="Boostify Music"
        />
      )}
      <div className="min-h-screen bg-black pt-4">
        {/* My Artists Section - Only show for own profile */}
        {isOwnProfile && (
          <div className="container mx-auto px-4 mb-6">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 border border-orange-500/20 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-xl">
                    <Users className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white mb-1">
                      My Artists
                    </h2>
                    <p className="text-sm text-gray-400">
                      Administra tus artistas generados con IA
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button
                    onClick={handleCreateArtist}
                    disabled={isGenerating}
                    className="flex-1 sm:flex-none bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
                    data-testid="button-create-artist-quick"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Generando...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Crear Artista
                      </>
                    )}
                  </Button>
                  <Link href="/my-artists">
                    <Button
                      variant="outline"
                      className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white"
                      data-testid="button-view-my-artists"
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Ver Todos
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
        
        <ArtistProfileCard artistId={artistId} />
      </div>
    </>
  );
}