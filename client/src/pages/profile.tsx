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

  // Mejorar el título y la descripción para que sean más atractivos
  const title = artistData?.name 
    ? `${artistData.name} - Artist Profile | Boostify Music`
    : "Discover Amazing Artists on Boostify Music";

  const description = artistData?.biography 
    ? `${artistData.biography.slice(0, 150)}${artistData.biography.length > 150 ? '...' : ''}`
    : "Discover and connect with talented artists on Boostify Music. Join our community of musicians, producers, and music enthusiasts.";

  // Mejorar el tipo de OG para perfiles
  const type = "profile";

  return (
    <>
      <Head
        title={title}
        description={description}
        url={fullUrl}
        image={artistData?.profileImage}
        type={type}
        siteName="Boostify Music - Music Marketing Platform"
      />
      <div className="min-h-screen bg-black pt-4">
        <ArtistProfileCard artistId={artistId} />
      </div>
    </>
  );
}