import { ArtistProfileCard } from "@/components/artist/artist-profile-card";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Head } from "@/components/ui/head";
import { useQuery } from "@tanstack/react-query";

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();

  // Use the URL id or fallback to the authenticated user's id
  const artistId = id || user?.uid || null;

  // Query para obtener datos del artista
  const { data: artistData } = useQuery({
    queryKey: ["/api/artist", artistId],
    enabled: !!artistId
  });

  // Log for debugging
  console.log("Profile ID from URL:", id);
  console.log("Using artistId:", artistId);

  if (!artistId) {
    return (
      <div className="min-h-screen bg-black pt-4 flex items-center justify-center">
        <p className="text-white">Loading profile...</p>
      </div>
    );
  }

  const fullUrl = `${window.location.origin}/profile/${artistId}`;
  const title = artistData?.name ? `${artistData.name} | Boostify` : "Artist Profile | Boostify";
  const description = artistData?.biography || "Check out this artist's profile on Boostify";

  return (
    <>
      <Head
        title={title}
        description={description}
        url={fullUrl}
        image={artistData?.profileImage}
      />
      <div className="min-h-screen bg-black pt-4">
        <ArtistProfileCard artistId={artistId} />
      </div>
    </>
  );
}