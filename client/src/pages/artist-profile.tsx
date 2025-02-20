import { useParams } from "wouter";
import { ArtistProfileCard } from "@/components/artist/artist-profile-card";

export default function ArtistProfile() {
  const params = useParams();
  const { id } = params;

  if (!id) {
    return <div>Artist ID not found</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <ArtistProfileCard artistId={id} isFloating={false} />
    </div>
  );
}