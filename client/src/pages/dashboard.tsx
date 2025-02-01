import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/marketing/stats-card";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery({
    queryKey: ["/api/metrics"]
  });

  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 overflow-y-auto bg-background p-8">
        <div className="mx-auto max-w-7xl">
          <h1 className="text-4xl font-bold mb-8">Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {isLoading ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </Card>
              ))
            ) : (
              <>
                <StatsCard
                  title="Spotify Followers"
                  value={metrics?.spotifyFollowers}
                  change={12}
                />
                <StatsCard
                  title="Monthly Listeners"
                  value={metrics?.monthlyListeners}
                  change={-5}
                />
                <StatsCard
                  title="Playlist Placements"
                  value={metrics?.playlistPlacements}
                  change={3}
                />
                <StatsCard
                  title="Instagram Followers"
                  value={metrics?.instagramFollowers}
                  change={25}
                />
              </>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Spotify Integration</h2>
              <PlaylistManager />
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {isLoading ? (
                  Array(3).fill(0).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))
                ) : (
                  <p className="text-muted-foreground">No recent activity</p>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
