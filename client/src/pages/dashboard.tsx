import { Sidebar } from "@/components/layout/sidebar";
import { StatsCard } from "@/components/marketing/stats-card";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { InstagramConnect } from "@/components/instagram/instagram-connect";
import { TrendChart } from "@/components/analytics/trend-chart";
import { EngagementMetrics } from "@/components/analytics/engagement-metrics";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Music2, TrendingUp, Activity, Users, Calendar, Globe } from "lucide-react";
import { SiInstagram, SiSpotify, SiYoutube } from "react-icons/si";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// Datos de ejemplo para los gráficos
const trendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toLocaleDateString(),
  spotify: Math.floor(Math.random() * 1000) + 500,
  youtube: Math.floor(Math.random() * 800) + 300,
  instagram: Math.floor(Math.random() * 600) + 200,
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
  const { user } = useAuth();
  const [metrics, setMetrics] = useState({
    spotifyFollowers: 0,
    instagramFollowers: 0,
    playlistPlacements: 0,
    monthlyListeners: 0,
    totalEngagement: 0,
    reachGrowth: 0
  });

  useEffect(() => {
    if (!user) return;

    // Suscribirse a actualizaciones en tiempo real de las métricas
    const metricsRef = collection(db, 'metrics');
    const q = query(metricsRef, where("userId", "==", user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        setMetrics(prev => ({
          ...prev,
          ...data
        }));
      });
    });

    return () => unsubscribe();
  }, [user]);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-background to-background/95">
      <Sidebar />
      <main className="flex-1 overflow-hidden w-full">
        <ScrollArea className="h-full">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="mx-auto max-w-7xl space-y-6 md:space-y-8">
              {/* Header with Actions */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-1">
                    Welcome back! Here's your music performance overview.
                  </p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  <Button className="w-full sm:w-auto bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">
                    <Activity className="mr-2 h-4 w-4" />
                    Live Analytics
                  </Button>
                  <Button variant="outline" className="w-full sm:w-auto">
                    <Calendar className="mr-2 h-4 w-4" />
                    This Month
                  </Button>
                </div>
              </div>

              {/* Platform Quick Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <Card className="p-4 bg-[#1DB954]/10 border-[#1DB954]/20">
                  <SiSpotify className="h-5 w-5 text-[#1DB954] mb-2" />
                  <p className="text-sm text-muted-foreground">Spotify</p>
                  <p className="text-lg font-semibold">Connected</p>
                </Card>
                <Card className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
                  <SiInstagram className="h-5 w-5 text-purple-500 mb-2" />
                  <p className="text-sm text-muted-foreground">Instagram</p>
                  <p className="text-lg font-semibold">Active</p>
                </Card>
                <Card className="p-4 bg-red-500/10 border-red-500/20">
                  <SiYoutube className="h-5 w-5 text-red-500 mb-2" />
                  <p className="text-sm text-muted-foreground">YouTube</p>
                  <p className="text-lg font-semibold">Growing</p>
                </Card>
              </div>

              {/* Main Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatsCard
                  title="Spotify Followers"
                  value={metrics.spotifyFollowers}
                  change={12}
                  icon={<Music2 className="h-4 w-4" />}
                  trend="up"
                  className="bg-gradient-to-br from-orange-500/10 to-orange-600/5"
                />
                <StatsCard
                  title="Monthly Listeners"
                  value={metrics.monthlyListeners}
                  change={-5}
                  icon={<Users className="h-4 w-4" />}
                  trend="down"
                  className="bg-gradient-to-br from-orange-500/10 to-orange-600/5"
                />
                <StatsCard
                  title="Total Engagement"
                  value={metrics.totalEngagement}
                  change={25}
                  icon={<Activity className="h-4 w-4" />}
                  trend="up"
                  className="bg-gradient-to-br from-orange-500/10 to-orange-600/5"
                />
                <StatsCard
                  title="Reach Growth"
                  value={metrics.reachGrowth}
                  change={8}
                  icon={<Globe className="h-4 w-4" />}
                  trend="up"
                  className="bg-gradient-to-br from-orange-500/10 to-orange-600/5"
                />
              </div>

              {/* Growth Chart */}
              <Card className="p-6">
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-2">Platform Growth Overview</h3>
                  <p className="text-sm text-muted-foreground">30-day performance across platforms</p>
                </div>
                <div className="h-[300px] mt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="spotify" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1DB954" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#1DB954" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="youtube" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF0000" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#FF0000" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="instagram" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#E1306C" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#E1306C" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px'
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="spotify"
                        stroke="#1DB954"
                        fillOpacity={1}
                        fill="url(#spotify)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="youtube"
                        stroke="#FF0000"
                        fillOpacity={1}
                        fill="url(#youtube)"
                        strokeWidth={2}
                      />
                      <Area
                        type="monotone"
                        dataKey="instagram"
                        stroke="#E1306C"
                        fillOpacity={1}
                        fill="url(#instagram)"
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              {/* Platform Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
                <PlaylistManager />
                <InstagramConnect />
              </div>

              {/* Engagement Metrics */}
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-6">Engagement Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {engagementData.map((platform, index) => (
                    <div key={index} className="space-y-4">
                      <div className="flex items-center gap-2">
                        {platform.platform === "Spotify" && <SiSpotify className="h-5 w-5 text-[#1DB954]" />}
                        {platform.platform === "Instagram" && <SiInstagram className="h-5 w-5 text-purple-500" />}
                        {platform.platform === "YouTube" && <SiYoutube className="h-5 w-5 text-red-500" />}
                        <h4 className="font-medium">{platform.platform}</h4>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Likes</p>
                          <p className="text-lg font-semibold">{platform.likes}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Comments</p>
                          <p className="text-lg font-semibold">{platform.comments}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Shares</p>
                          <p className="text-lg font-semibold">{platform.shares}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}