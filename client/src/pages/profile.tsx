import { ArtistProfileCard } from "@/components/artist/artist-profile-card";
import { useAuth } from "@/hooks/use-auth";

export default function ProfilePage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black pt-4">
      <ArtistProfileCard artistId={user?.id || 'default'} />
    </div>
  );
}
