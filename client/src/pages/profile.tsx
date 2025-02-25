import { ArtistProfileCard } from "@/components/artist/artist-profile-card";
import { useParams } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { id } = useParams();
  const { user } = useAuth();

  // Use the URL id or fallback to the authenticated user's id
  const artistId = id || user?.uid || null;

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

  return (
    <div className="min-h-screen bg-black pt-4">
      <ArtistProfileCard artistId={artistId} />
    </div>
  );
}