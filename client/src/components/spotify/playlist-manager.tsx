import { Button } from "@/components/ui/button";
import { SiSpotify } from "react-icons/si";
import { useAuth } from "@/hooks/use-auth";

export function PlaylistManager() {
  const { user } = useAuth();
  
  if (!user?.spotifyToken) {
    return (
      <div className="text-center py-8">
        <SiSpotify className="w-12 h-12 mx-auto mb-4 text-[#1DB954]" />
        <h3 className="text-lg font-medium mb-2">Connect Your Spotify Account</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Link your Spotify account to manage playlists and track performance
        </p>
        <Button className="bg-[#1DB954] hover:bg-[#1ed760]">
          Connect Spotify
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground">
        Your Spotify account is connected. Manage your playlists below.
      </p>
      {/* Playlist management UI will go here */}
    </div>
  );
}
