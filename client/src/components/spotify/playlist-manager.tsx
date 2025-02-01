import { Button } from "@/components/ui/button";
import { SiSpotify } from "react-icons/si";

export function PlaylistManager() {
  return (
    <div className="text-center py-8">
      <div className="relative w-16 h-16 mx-auto mb-4">
        <div className="absolute inset-0 bg-[#1DB954] rounded-full animate-ping opacity-20"></div>
        <div className="relative flex items-center justify-center w-16 h-16 bg-[#1DB954] rounded-full">
          <SiSpotify className="w-8 h-8 text-white" />
        </div>
      </div>
      <h3 className="text-lg font-medium mb-2">Connect Your Spotify Account</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Link your Spotify account to manage playlists and track performance
      </p>
      <Button 
        className="bg-[#1DB954] hover:bg-[#1ed760] text-white gap-2"
        size="lg"
      >
        <SiSpotify className="w-5 h-5" />
        Connect Spotify
      </Button>
    </div>
  );
}