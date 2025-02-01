import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/marketing/stats-card";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { InstagramConnect } from "@/components/instagram/instagram-connect";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Music2, Users2, TrendingUp, FileText } from "lucide-react";
import { SiInstagram } from "react-icons/si";

export default function Dashboard() {
  const { data: metrics } = useQuery({
    queryKey: ["/api/metrics"],
  });

  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-background/95">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <ScrollArea className="h-full">
          <div className="p-8">
            <div className="mx-auto max-w-7xl space-y-8">
              <div className="flex justify-between items-center">
                <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  Dashboard
                </h1>
                <Button className="bg-primary/10 text-primary hover:bg-primary/20">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics Overview
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsCard
                  title="Spotify Followers"
                  value={metrics?.spotifyFollowers ?? 0}
                  change={12}
                  icon={<Music2 className="h-4 w-4" />}
                />
                <StatsCard
                  title="Monthly Listeners"
                  value={metrics?.monthlyListeners ?? 0}
                  change={-5}
                  icon={<Music2 className="h-4 w-4" />}
                />
                <StatsCard
                  title="Instagram Followers"
                  value={metrics?.instagramFollowers ?? 0}
                  change={25}
                  icon={<SiInstagram className="h-4 w-4" />}
                />
                <StatsCard
                  title="Playlist Placements"
                  value={metrics?.playlistPlacements ?? 0}
                  change={3}
                  icon={<Music2 className="h-4 w-4" />}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <PlaylistManager />
                <InstagramConnect />
              </div>
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}