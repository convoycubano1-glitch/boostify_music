import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/marketing/stats-card";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { InstagramConnect } from "@/components/instagram/instagram-connect";
import { TrendChart } from "@/components/analytics/trend-chart";
import { EngagementMetrics } from "@/components/analytics/engagement-metrics";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Music2, TrendingUp } from "lucide-react";
import { SiInstagram } from "react-icons/si";

// Datos de ejemplo para los gráficos
const trendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toLocaleDateString(),
  value: Math.floor(Math.random() * 1000) + 500
}));

const engagementData = [
  {
    platform: "Spotify",
    likes: 1234,
    comments: 321,
    shares: 123
  },
  {
    platform: "Instagram",
    likes: 2345,
    comments: 432,
    shares: 234
  },
  {
    platform: "YouTube",
    likes: 3456,
    comments: 543,
    shares: 345
  }
];

export default function Dashboard() {
  // Datos de ejemplo para desarrollo
  const mockMetrics = {
    spotifyFollowers: 1234,
    instagramFollowers: 5678,
    playlistPlacements: 15,
    monthlyListeners: 9876
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-background/95">
      <Sidebar />
      <main className="flex-1 overflow-hidden w-full">
        <ScrollArea className="h-full">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/70">
                  Dashboard
                </h1>
                <Button className="w-full sm:w-auto bg-primary/10 text-primary hover:bg-primary/20">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Analytics Overview
                </Button>
              </div>

              {/* Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
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
                  title="Instagram Followers"
                  value={mockMetrics.instagramFollowers}
                  change={25}
                  icon={<SiInstagram className="h-4 w-4" />}
                />
                <StatsCard
                  title="Playlist Placements"
                  value={mockMetrics.playlistPlacements}
                  change={3}
                  icon={<Music2 className="h-4 w-4" />}
                />
              </div>

              {/* Analytics Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <TrendChart
                  title="Crecimiento de Seguidores"
                  data={trendData}
                  description="Evolución del número total de seguidores en el último mes"
                  valuePrefix="+"
                />
                <EngagementMetrics data={engagementData} />
              </div>

              {/* Platform Connections */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
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