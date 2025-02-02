import { Header } from "@/components/layout/header";
import { TrendChart } from "@/components/analytics/trend-chart";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Music2, Radio, TrendingUp, Globe, Users, Search, Mail } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getSpotifyAnalytics, getSpotifyData } from "@/lib/spotify-store";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { motion } from "framer-motion";
import { SiSpotify } from "react-icons/si";
import { Link } from "wouter";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import 'react-circular-progressbar/dist/styles.css';

// Plan limits
const PLAN_LIMITS = {
  basic: { playlists: 10, emails: 50 },
  pro: { playlists: 50, emails: 250 },
  enterprise: { playlists: Infinity, emails: Infinity }
};

export default function SpotifyPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [songUrl, setSongUrl] = useState("");
  const [targetListeners, setTargetListeners] = useState(10000);
  const [activeTab, setActiveTab] = useState("listeners");
  const [searchQuery, setSearchQuery] = useState("");
  const [emailProgress, setEmailProgress] = useState(0);
  const [playlistProgress, setPlaylistProgress] = useState(0);

  // Mock subscription plan - replace with actual user plan
  const userPlan = "pro"; // This should come from your subscription system
  const limits = PLAN_LIMITS[userPlan];

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

  const currentListeners = analytics?.monthlyListeners ?? 0;
  const progress = Math.min((currentListeners / targetListeners) * 100, 100);

  const startMonthlyListenersTracker = async () => {
    try {
      const response = await fetch('https://api.apify.com/v2/acts/apify~spotify-monthly-listeners/runs?token=apify_api_nrudThRO1hQ9XCTFzUZkRI0VKCcSkv2h3mYq', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          songUrl: songUrl,
          targetListeners: targetListeners
        }),
      });
    
      if (!response.ok) {
        throw new Error('Failed to start monthly listeners tracking');
      }
    
      toast({
        title: "Success",
        description: "Monthly listeners tracking has started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start monthly listeners tracking",
        variant: "destructive"
      });
    }
  };

  const handlePlaylistSearch = async () => {
    if (playlistProgress >= limits.playlists) {
      toast({
        title: "Plan Limit Reached",
        description: `Upgrade your plan to search for more playlists. Current limit: ${limits.playlists}`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setPlaylistProgress(prev => prev + 1);

      toast({
        title: "Success",
        description: "Found matching playlists for your track",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to search playlists",
        variant: "destructive"
      });
    }
  };

  const handleEmailScrape = async () => {
    if (emailProgress >= limits.emails) {
      toast({
        title: "Plan Limit Reached",
        description: `Upgrade your plan to scrape more emails. Current limit: ${limits.emails}`,
        variant: "destructive"
      });
      return;
    }

    try {
      // Mock API call - replace with actual implementation
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEmailProgress(prev => prev + 1);

      toast({
        title: "Success",
        description: "Successfully scraped playlist curator emails",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to scrape emails",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <div className="flex-1 space-y-8 p-8 pt-6 bg-gradient-to-b from-background to-background/80">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <SiSpotify className="w-12 h-12 text-orange-500" />
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                  Spotify Growth Tools
                </h2>
                <p className="text-muted-foreground mt-2">
                  Track, grow, and manage your Spotify presence
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href="/dashboard">
                <Button variant="outline" className="gap-2">
                  <Home className="w-4 h-4" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid grid-cols-3 max-w-[400px]">
              <TabsTrigger value="listeners">Monthly Listeners</TabsTrigger>
              <TabsTrigger value="playlists">Playlist Finder</TabsTrigger>
              <TabsTrigger value="emails">Email Scraper</TabsTrigger>
            </TabsList>

            <TabsContent value="listeners" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                    <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:20px_20px]" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <Radio className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold">Progress Tracker</h3>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="w-32 h-32 relative">
                          <div className="absolute inset-0 bg-orange-500/5 rounded-full animate-pulse" />
                          <CircularProgressbar
                            value={progress}
                            text={`${Math.round(progress)}%`}
                            styles={buildStyles({
                              pathColor: 'hsl(24, 95%, 53%)',
                              textColor: 'hsl(24, 95%, 53%)',
                              trailColor: 'rgba(255,255,255,0.1)',
                              pathTransition: 'stroke-dashoffset 0.5s ease 0s',
                            })}
                          />
                        </div>
                        <div className="flex-1 ml-8">
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground">Current Listeners</p>
                            <motion.div
                              initial={{ scale: 0.8, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              className="text-4xl font-bold tabular-nums bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent"
                            >
                              {currentListeners.toLocaleString()}
                            </motion.div>
                            <p className="text-sm text-orange-500 flex items-center">
                              <TrendingUp className="w-4 h-4 mr-1" />
                              Target: {targetListeners.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
            
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                    <div className="relative">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Song URL</label>
                          <Input
                            placeholder="https://open.spotify.com/track/..."
                            value={songUrl}
                            onChange={(e) => setSongUrl(e.target.value)}
                            className="bg-background/50 border-orange-500/10 focus:border-orange-500"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">Target Monthly Listeners</label>
                          <Input
                            type="number"
                            value={targetListeners}
                            onChange={(e) => setTargetListeners(parseInt(e.target.value))}
                            className="bg-background/50 border-orange-500/10 focus:border-orange-500"
                          />
                        </div>
                        <Button
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={startMonthlyListenersTracker}
                        >
                          Start Tracking
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            <TabsContent value="playlists" className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <Search className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold">Playlist Finder</h3>
                      </div>
                      <div className="space-y-4">
                        <Input
                          placeholder="Enter track or artist name"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-background/50 border-orange-500/10 focus:border-orange-500"
                        />
                        <Button
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={handlePlaylistSearch}
                        >
                          Find Playlists
                        </Button>
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Playlist Search Progress ({playlistProgress}/{limits.playlists})
                          </p>
                          <div className="h-2 bg-orange-500/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 transition-all duration-300"
                              style={{ width: `${(playlistProgress / limits.playlists) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <Mail className="h-5 w-5 text-orange-500" />
                        <h3 className="text-lg font-semibold">Email Scraper</h3>
                      </div>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                          Extract curator emails from found playlists
                        </p>
                        <Button
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                          onClick={handleEmailScrape}
                        >
                          Scrape Emails
                        </Button>
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-2">
                            Email Scraping Progress ({emailProgress}/{limits.emails})
                          </p>
                          <div className="h-2 bg-orange-500/10 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-500 transition-all duration-300"
                              style={{ width: `${(emailProgress / limits.emails) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>
          </Tabs>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <Card className="p-6 backdrop-blur-sm border-orange-500/10">
              <h3 className="text-lg font-semibold mb-4">Growth Analytics</h3>
              <div className="h-[300px]">
                <TrendChart
                  title="Monthly Listeners Growth"
                  data={streamingData}
                  description="Track your monthly listeners growth over time"
                />
              </div>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}