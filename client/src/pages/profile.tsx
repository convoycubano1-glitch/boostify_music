import { ArtistProfileCard } from "../components/artist/artist-profile-card";
import { useParams } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Head } from "../components/ui/head";
import { useQuery } from "@tanstack/react-query";
import { SignIn } from "@clerk/clerk-react";

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
  const { user, isLoading: isAuthLoading } = useAuth();

  // Use the URL id or fallback to the authenticated user's id
  // Use user.id > 0 check to ensure we have a valid ID from the database
  const artistId = id || (user?.id && user.id > 0 ? String(user.id) : null);
  
  // Check if this is the user's own profile
  const isOwnProfile = !id && !!user && user.id > 0;

  // Query para obtener datos del artista
  const { data: artistData, isLoading: isArtistLoading } = useQuery<ArtistData>({
    queryKey: ["/api/artist", artistId],
    enabled: !!artistId && (!isOwnProfile || user?.id !== 0)
  });

  // Show loading only while auth is initially loading (brief moment)
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-black pt-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm">Cargando...</p>
        </div>
      </div>
    );
  }

  // If no user and no id in URL, show sign in component
  if (!artistId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black pt-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-8 max-w-md w-full px-4">
          {/* Logo y título */}
          <div className="text-center space-y-4">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/20">
              <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                Boostify Music
              </h1>
              <p className="text-gray-400 mt-2">Inicia sesión para acceder a tu perfil de artista</p>
            </div>
          </div>
          
          {/* SignIn Component con estilos mejorados */}
          <SignIn 
            appearance={{
              elements: {
                rootBox: "mx-auto w-full",
                card: "bg-zinc-900/80 backdrop-blur-xl border border-zinc-700/50 shadow-2xl shadow-black/50 rounded-2xl",
                headerTitle: "text-white text-xl font-bold",
                headerSubtitle: "text-gray-400",
                formFieldLabel: "text-gray-300 font-medium",
                formFieldInput: "bg-zinc-800/80 border-zinc-600 text-white placeholder:text-gray-500 focus:border-orange-500 focus:ring-orange-500/20 rounded-lg",
                formButtonPrimary: "bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-semibold shadow-lg shadow-orange-500/25 rounded-lg",
                footerActionLink: "text-orange-400 hover:text-orange-300 font-medium",
                socialButtonsBlockButton: "bg-zinc-800 border-zinc-600 text-white hover:bg-zinc-700 rounded-lg",
                socialButtonsBlockButtonText: "text-white font-medium",
                socialButtonsProviderIcon: "brightness-0 invert",
                dividerLine: "bg-zinc-700",
                dividerText: "text-gray-500",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-orange-400 hover:text-orange-300",
                formFieldInputShowPasswordButton: "text-gray-400 hover:text-white",
                otpCodeFieldInput: "bg-zinc-800 border-zinc-600 text-white",
                footer: "hidden",
              },
              layout: {
                socialButtonsPlacement: "top",
                showOptionalFields: false,
              }
            }}
            routing="hash"
            afterSignInUrl="/profile"
          />
          
          {/* Footer decorativo */}
          <p className="text-gray-500 text-sm text-center">
            ¿No tienes cuenta? El registro es automático al iniciar sesión
          </p>
        </div>
      </div>
    );
  }

  if (isArtistLoading) {
    return (
      <div className="min-h-screen bg-black pt-4 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white text-sm">Cargando perfil...</p>
        </div>
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
        <ArtistProfileCard artistId={artistId} />
      </div>
    </>
  );
}