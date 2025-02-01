import { Button } from "@/components/ui/button";
import { SiSpotify } from "react-icons/si";
import { Card } from "@/components/ui/card";

export function PlaylistManager() {
  return (
    <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/20 via-[#1DB954]/10 to-transparent" />

      {/* Music Wave Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <path d="M0,50 Q25,30 50,50 T100,50" className="stroke-current" fill="none" strokeWidth="0.5" />
          <path d="M0,60 Q25,40 50,60 T100,60" className="stroke-current" fill="none" strokeWidth="0.5" />
          <path d="M0,40 Q25,20 50,40 T100,40" className="stroke-current" fill="none" strokeWidth="0.5" />
        </svg>
      </div>

      <div className="relative text-center py-8">
        <div className="relative w-20 h-20 mx-auto mb-6">
          <div className="absolute inset-0 bg-[#1DB954] rounded-full animate-ping opacity-20"></div>
          <div className="relative flex items-center justify-center w-20 h-20 bg-[#1DB954] rounded-full">
            <SiSpotify className="w-10 h-10 text-white" />
          </div>
        </div>

        <h3 className="text-2xl font-bold mb-3">Connect Spotify</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Link your Spotify account to manage playlists, track performance, and grow your audience reach.
        </p>

        <div className="flex flex-col items-center gap-4">
          <Button 
            className="bg-[#1DB954] hover:bg-[#1ed760] text-white gap-2 px-8"
            size="lg"
          >
            <SiSpotify className="w-5 h-5" />
            Connect Spotify
          </Button>
          <span className="text-xs text-muted-foreground">
            Powered by Spotify Web API
          </span>
        </div>

        {/* Stats Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-sm mx-auto">
          {[
            { label: "Monthly Listeners", value: "0" },
            { label: "Followers", value: "0" },
            { label: "Playlists", value: "0" }
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}