import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/marketing/stats-card";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Music2, Users2, TrendingUp } from "lucide-react";

export default function Dashboard() {
  // Datos de ejemplo para desarrollo
  const mockMetrics = {
    spotifyFollowers: 1234,
    instagramFollowers: 5678,
    playlistPlacements: 15,
    monthlyListeners: 9876
  };

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
                  value={mockMetrics.spotifyFollowers}
                  change={12}
                  icon={<Music2 className="h-4 w-4" />}
                />
                <StatsCard
                  title="Monthly Listeners"
                  value={mockMetrics.monthlyListeners}
                  change={-5}
                  icon={<Music2 className="h-4 w-4" />}
                />
                <StatsCard
                  title="Playlist Placements"
                  value={mockMetrics.playlistPlacements}
                  change={3}
                  icon={<Music2 className="h-4 w-4" />}
                />
                <StatsCard
                  title="Instagram Followers"
                  value={mockMetrics.instagramFollowers}
                  change={25}
                  icon={<Users2 className="h-4 w-4" />}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <Music2 className="h-5 w-5 text-primary" />
                    Spotify Integration
                  </h2>
                  <PlaylistManager />
                </Card>

                <Card className="p-6 bg-card/50 backdrop-blur-sm border-primary/10">
                  <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Recent Activity
                  </h2>
                  <div className="space-y-4">
                    <p className="text-muted-foreground">No recent activity</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}
