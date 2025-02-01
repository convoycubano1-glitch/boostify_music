import { TrendChart } from "@/components/analytics/trend-chart";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music2, Radio, ListMusic, TrendingUp } from "lucide-react";

// Datos de ejemplo para los gráficos
const streamingData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toLocaleDateString(),
  value: Math.floor(Math.random() * 10000) + 5000
}));

const playlistData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toLocaleDateString(),
  value: Math.floor(Math.random() * 50) + 20
}));

export default function SpotifyPage() {
  return (
    <div className="flex-1 space-y-8 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Spotify Analytics</h2>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="streaming" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Streaming
          </TabsTrigger>
          <TabsTrigger value="playlists" className="flex items-center gap-2">
            <ListMusic className="h-4 w-4" />
            Playlists
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium">Total Streams</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">247,892</p>
              <p className="text-sm text-muted-foreground">+12.3% from last month</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2">
                <ListMusic className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium">Playlist Adds</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">1,234</p>
              <p className="text-sm text-muted-foreground">+5.2% from last month</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Radio className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium">Radio Plays</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">892</p>
              <p className="text-sm text-muted-foreground">+8.7% from last month</p>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TrendChart
              title="Daily Streams"
              data={streamingData}
              description="Number of daily streams across all tracks"
            />
            <TrendChart
              title="Playlist Additions"
              data={playlistData}
              description="Number of new playlist additions per day"
            />
          </div>

          <PlaylistManager />
        </TabsContent>

        <TabsContent value="streaming" className="space-y-6">
          {/* Detailed streaming analytics will go here */}
        </TabsContent>

        <TabsContent value="playlists" className="space-y-6">
          {/* Detailed playlist analytics will go here */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
