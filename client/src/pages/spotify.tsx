import { TrendChart } from "@/components/analytics/trend-chart";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music2, Radio, ListMusic, TrendingUp, Globe, Users } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { getSpotifyAnalytics } from "@/lib/spotify-store";

export default function SpotifyPage() {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["spotify-analytics", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      return getSpotifyAnalytics(user);
    },
    enabled: !!user
  });

  const streamingData = analytics?.dailyStats.map(stat => ({
    date: stat.date,
    value: stat.streams
  })) ?? [];

  const followersData = analytics?.dailyStats.map(stat => ({
    date: stat.date,
    value: stat.followers
  })) ?? [];

  const playlistData = analytics?.dailyStats.map(stat => ({
    date: stat.date,
    value: stat.playlistAdds
  })) ?? [];

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
          <TabsTrigger value="audience" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Audiencia
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Music2 className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium">Total Streams</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {analytics?.dailyStats.reduce((acc, curr) => acc + curr.streams, 0).toLocaleString() ?? '0'}
              </p>
              <p className="text-sm text-muted-foreground">Últimos 30 días</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2">
                <ListMusic className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium">Playlist Adds</h3>
              </div>
              <p className="mt-2 text-3xl font-bold">
                {analytics?.dailyStats.reduce((acc, curr) => acc + curr.playlistAdds, 0).toLocaleString() ?? '0'}
              </p>
              <p className="text-sm text-muted-foreground">Últimos 30 días</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-muted-foreground" />
                <h3 className="text-lg font-medium">Top Countries</h3>
              </div>
              <div className="mt-2 space-y-2">
                {analytics?.demographics.countries.slice(0, 3).map(country => (
                  <div key={country.name} className="flex justify-between items-center">
                    <span>{country.name}</span>
                    <span className="font-medium">{country.listeners.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <TrendChart
              title="Daily Streams"
              data={streamingData}
              description="Number of daily streams across all tracks"
            />
            <TrendChart
              title="Followers Growth"
              data={followersData}
              description="Daily follower count growth"
            />
          </div>

          <PlaylistManager />
        </TabsContent>

        <TabsContent value="streaming" className="space-y-6">
          <div className="grid gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Tracks</h3>
              <div className="space-y-4">
                {analytics?.topTracks.map((track, index) => (
                  <div key={track.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-lg font-medium text-muted-foreground">#{index + 1}</span>
                      <div>
                        <p className="font-medium">{track.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {track.streams.toLocaleString()} streams
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {track.playlistAdds} playlist adds
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audience" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Demographics</h3>
              <div className="space-y-4">
                {analytics?.demographics.ageRanges.map(range => (
                  <div key={range.range} className="flex justify-between items-center">
                    <span>{range.range}</span>
                    <span className="font-medium">{range.percentage}%</span>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Top Countries</h3>
              <div className="space-y-4">
                {analytics?.demographics.countries.map(country => (
                  <div key={country.name} className="flex justify-between items-center">
                    <span>{country.name}</span>
                    <span className="font-medium">{country.listeners.toLocaleString()} listeners</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}