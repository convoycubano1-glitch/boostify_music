import { TrendChart } from "@/components/analytics/trend-chart";
import { StatsCard } from "@/components/marketing/stats-card";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { InstagramConnect } from "@/components/instagram/instagram-connect";
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

// Example data for charts
const trendData = Array.from({ length: 30 }, (_, i) => ({
  date: new Date(2024, 0, i + 1).toLocaleDateString(),
  spotify: Math.floor(Math.random() * 1000) + 500,
  youtube: Math.floor(Math.random() * 800) + 300,
  instagram: Math.floor(Math.random() * 600) + 200,
}));

type EngagementMetric = {
  platform: string;
  likes: number;
  comments: number;
  shares: number;
}

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
  const [engagementMetrics, setEngagementMetrics] = useState<EngagementMetric[]>([]);

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time metrics updates
    const metricsRef = collection(db, 'metrics');
    const metricsQuery = query(metricsRef, where("userId", "==", user.uid));

    const unsubscribeMetrics = onSnapshot(metricsQuery, (snapshot) => {
      snapshot.forEach((doc) => {
        const data = doc.data();
        setMetrics(prev => ({
          ...prev,
          ...data
        }));
      });
    });

    // Subscribe to real-time engagement updates
    const engagementRef = collection(db, 'engagement');
    const engagementQuery = query(engagementRef, where("userId", "==", user.uid));

    const unsubscribeEngagement = onSnapshot(engagementQuery, (snapshot) => {
      const engagementData: EngagementMetric[] = [];
      snapshot.forEach((doc) => {
        engagementData.push(doc.data() as EngagementMetric);
      });
      setEngagementMetrics(engagementData);
    });

    return () => {
      unsubscribeMetrics();
      unsubscribeEngagement();
    };
  }, [user]);

  return (
    <div className="min-h-screen bg-background">
      <ScrollArea className="h-[100vh]">
        <div className="container mx-auto px-6 py-8">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Welcome back! Here's your music performance overview.
              </p>
            </div>
            <div className="flex gap-3">
              <Button className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">
                <Activity className="mr-2 h-4 w-4" />
                Live Analytics
              </Button>
              <Button variant="outline">
                <Calendar className="mr-2 h-4 w-4" />
                This Month
              </Button>
            </div>
          </div>

          {/* Quick Stats Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatsCard
              title="Spotify Followers"
              value={metrics.spotifyFollowers}
              change={12}
              icon={<Music2 className="h-4 w-4" />}
              className="bg-gradient-to-br from-orange-500/10 to-orange-600/5"
            />
            <StatsCard
              title="Monthly Listeners"
              value={metrics.monthlyListeners}
              change={-5}
              icon={<Users className="h-4 w-4" />}
              className="bg-gradient-to-br from-orange-500/10 to-orange-600/5"
            />
            <StatsCard
              title="Total Engagement"
              value={metrics.totalEngagement}
              change={25}
              icon={<Activity className="h-4 w-4" />}
              className="bg-gradient-to-br from-orange-500/10 to-orange-600/5"
            />
            <StatsCard
              title="Reach Growth"
              value={metrics.reachGrowth}
              change={8}
              icon={<Globe className="h-4 w-4" />}
              className="bg-gradient-to-br from-orange-500/10 to-orange-600/5"
            />
          </div>

          {/* Platform Quick Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 bg-orange-500/10 border-orange-500/20">
              <SiSpotify className="h-6 w-6 text-orange-500 mb-4" />
              <p className="text-sm text-muted-foreground">Spotify</p>
              <p className="text-lg font-semibold">Connected</p>
            </Card>
            <Card className="p-6 bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
              <SiInstagram className="h-6 w-6 text-orange-500 mb-4" />
              <p className="text-sm text-muted-foreground">Instagram</p>
              <p className="text-lg font-semibold">Active</p>
            </Card>
            <Card className="p-6 bg-orange-500/10 border-orange-500/20">
              <SiYoutube className="h-6 w-6 text-orange-500 mb-4" />
              <p className="text-sm text-muted-foreground">YouTube</p>
              <p className="text-lg font-semibold">Growing</p>
            </Card>
          </div>

          {/* Growth Chart */}
          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Platform Growth Overview</h3>
              <p className="text-sm text-muted-foreground">30-day performance across platforms</p>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="spotify" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0}/>
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
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={1}
                    fill="url(#spotify)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Platform Details */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <PlaylistManager />
            <InstagramConnect />
          </div>

          {/* Engagement Metrics */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-6">Engagement Breakdown</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {engagementMetrics.map((platform, index) => (
                <div key={index} className="space-y-4">
                  <div className="flex items-center gap-2">
                    {platform.platform === "Spotify" && <SiSpotify className="h-5 w-5 text-orange-500" />}
                    {platform.platform === "Instagram" && <SiInstagram className="h-5 w-5 text-orange-500" />}
                    {platform.platform === "YouTube" && <SiYoutube className="h-5 w-5 text-orange-500" />}
                    <h4 className="font-medium">{platform.platform}</h4>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Likes</p>
                      <p className="text-lg font-semibold">{platform.likes.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Comments</p>
                      <p className="text-lg font-semibold">{platform.comments.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Shares</p>
                      <p className="text-lg font-semibold">{platform.shares.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </ScrollArea>
    </div>
  );
}