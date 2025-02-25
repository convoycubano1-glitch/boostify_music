import { ArtistProfileCard } from "@/components/artist/artist-profile-card";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Head } from "@/components/ui/head";
import { useQuery } from "@tanstack/react-query";

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

  // Use the URL id or fallback to the authenticated user's id
  const artistId = id || user?.uid || null;

  // Query para obtener datos del artista
  const { data: artistData, isLoading } = useQuery<ArtistData>({
    queryKey: ["/api/artist", artistId],
    enabled: !!artistId
  });

  if (!artistId || isLoading) {
    return (
      <div className="min-h-screen bg-black pt-4 flex items-center justify-center">
        <p className="text-white">Loading profile...</p>
      </div>
    );
  }

  const fullUrl = `${window.location.origin}/profile/${artistId}`;

  // Asegurar que la imagen sea una URL absoluta
  const getAbsoluteImageUrl = (imageUrl?: string) => {
    if (!imageUrl) return `${window.location.origin}/assets/freepik__boostify-music___orange.png`;
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${window.location.origin}${imageUrl}`;
  };

  const profileImage = getAbsoluteImageUrl(artistData?.profileImage);

  // Mejorar el título para SEO y compartir
  const title = artistData?.name 
    ? `${artistData.name} - Music Artist Profile | Boostify Music`
    : "Discover Amazing Musicians on Boostify Music";

  // Crear una descripción más atractiva y específica
  const description = artistData?.biography 
    ? `Check out ${artistData.name}'s music profile on Boostify Music. ${artistData.biography.slice(0, 150)}${artistData.biography.length > 150 ? '...' : ''}`
    : `Discover and connect with talented musicians on Boostify Music. Join our community of artists, producers, and music enthusiasts. Start your musical journey today!`;

  // Usar el tipo correcto para perfiles de músicos
  const type = "profile";

  // Mejorar el nombre del sitio para mejor reconocimiento
  const siteName = "Boostify Music - Your Music Marketing Platform";

  return (
    <>
      <Head
        title={title}
        description={description}
        url={fullUrl}
        image={profileImage}
        type={type}
        siteName={siteName}
      />
      <div className="min-h-screen bg-black pt-4">
        <ArtistProfileCard artistId={artistId} />
      </div>
    </>
  );
}