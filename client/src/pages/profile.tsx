import { ArtistProfileCard } from "@/components/artist/artist-profile-card";
import { useParams } from "wouter";

export default function ProfilePage() {
  const { id } = useParams();

  // Log for debugging
  console.log("Profile ID from URL:", id);

  return (
    <div className="min-h-screen bg-black pt-4">
      <ArtistProfileCard artistId={id || 'default'} />
    </div>
  );
}