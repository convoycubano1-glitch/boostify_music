import { ArtistProfileCard } from "@/components/artist/artist-profile-card";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user } = useAuth();

  console.log("Current user:", user); // Debug log
  console.log("User UID:", user?.uid); // Debug log for UID specifically

  return (
    <div className="min-h-screen bg-black pt-4">
      <ArtistProfileCard artistId={user?.uid || 'default'} />
    </div>
  );
}