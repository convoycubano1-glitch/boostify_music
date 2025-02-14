import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { SiInstagram } from "react-icons/si";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, addDoc } from "firebase/firestore";
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import { Home, Users, TrendingUp, MessageCircle, UserPlus, UserMinus, Activity } from "lucide-react";
import 'react-circular-progressbar/dist/styles.css';

interface InstagramStats {
  followers: number;
  following: number;
  engagement: number;
  automationStatus: 'active' | 'paused' | 'stopped';
}

export default function InstagramBoostPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [targetUsername, setTargetUsername] = useState("");
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [followLimit, setFollowLimit] = useState(100);
  const [commentTemplate, setCommentTemplate] = useState("");

  const [stats, setStats] = useState<InstagramStats>({
    followers: 0,
    following: 0,
    engagement: 0,
    automationStatus: 'stopped'
  });

  // Firestore listener for stats
  useQuery({
    queryKey: ["instagram-stats", user?.uid],
    queryFn: async () => {
      if (!user) return null;
      const statsRef = collection(db, 'instagram_stats');
      const statsQuery = query(statsRef, where("userId", "==", user.uid));
      
      return new Promise((resolve) => {
        const unsubscribe = onSnapshot(statsQuery, (snapshot) => {
          snapshot.forEach((doc) => {
            setStats(doc.data() as InstagramStats);
          });
        });
        
        return () => unsubscribe();
      });
    },
    enabled: !!user
  });

  const startFollowerScraper = async () => {
    try {
      const response = await fetch('https://api.apify.com/v2/acts/zuzka~instagram-followers-scraper/runs?token=apify_api_key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: targetUsername,
          resultsLimit: followLimit
        }),
      });

      if (!response.ok) throw new Error('Failed to start follower scraper');

      const docRef = await addDoc(collection(db, 'instagram_tasks'), {
        userId: user?.uid,
        type: 'follower_scraper',
        targetUsername,
        status: 'running',
        startedAt: new Date()
      });

      toast({
        title: "Success",
        description: "Follower scraping has started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start follower scraping",
        variant: "destructive"
      });
    }
  };

  const toggleAutomation = async () => {
    try {
      const newStatus = !automationEnabled;
      setAutomationEnabled(newStatus);
      
      await addDoc(collection(db, 'instagram_automation'), {
        userId: user?.uid,
        status: newStatus ? 'active' : 'stopped',
        settings: {
          followLimit,
          commentTemplate
        },
        updatedAt: new Date()
      });

      toast({
        title: newStatus ? "Automation Started" : "Automation Stopped",
        description: `Instagram automation has been ${newStatus ? 'activated' : 'deactivated'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to toggle automation",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <div className="flex-1 space-y-8 p-8 pt-6 bg-gradient-to-b from-background to-background/80">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-between"
          >
            <div className="flex items-center gap-4">
              <SiInstagram className="w-12 h-12 text-orange-500" />
              <div>
                <h2 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                  Instagram Boost
                </h2>
                <p className="text-muted-foreground mt-2">
                  Enhance your Instagram presence and engagement
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

          {/* Stats Cards */}
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-medium">Followers</h3>
                </div>
                <p className="text-3xl font-bold">{stats.followers.toLocaleString()}</p>
              </div>
            </Card>

            <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-medium">Engagement Rate</h3>
                </div>
                <p className="text-3xl font-bold">{stats.engagement}%</p>
              </div>
            </Card>

            <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <MessageCircle className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-medium">Automation Status</h3>
                </div>
                <p className="text-xl font-medium capitalize">{stats.automationStatus}</p>
              </div>
            </Card>

            <Card className="p-6 relative overflow-hidden backdrop-blur-sm border-orange-500/10">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
              <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-5 w-5 text-orange-500" />
                  <h3 className="text-lg font-medium">Growth Rate</h3>
                </div>
                <p className="text-3xl font-bold">+12%</p>
              </div>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="follower-scraper" className="space-y-6">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <TabsTrigger value="follower-scraper" className="gap-2">
                <Users className="h-4 w-4" />
                Follower Scraper
              </TabsTrigger>
              <TabsTrigger value="automation" className="gap-2">
                <Activity className="h-4 w-4" />
                Automation
              </TabsTrigger>
              <TabsTrigger value="auto-follow" className="gap-2">
                <UserPlus className="h-4 w-4" />
                Auto Follow
              </TabsTrigger>
              <TabsTrigger value="comments" className="gap-2">
                <MessageCircle className="h-4 w-4" />
                Auto Comments
              </TabsTrigger>
            </TabsList>

            <TabsContent value="follower-scraper">
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Follower Scraper</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Target Username</label>
                    <Input
                      placeholder="@username"
                      value={targetUsername}
                      onChange={(e) => setTargetUsername(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Follow Limit</label>
                    <Input
                      type="number"
                      value={followLimit}
                      onChange={(e) => setFollowLimit(parseInt(e.target.value))}
                    />
                  </div>
                  <Button onClick={startFollowerScraper} className="w-full">
                    Start Scraping
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="automation">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Automation Settings</h3>
                    <Button
                      onClick={toggleAutomation}
                      variant={automationEnabled ? "destructive" : "default"}
                    >
                      {automationEnabled ? "Stop Automation" : "Start Automation"}
                    </Button>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Daily Follow Limit</label>
                      <Input
                        type="number"
                        value={followLimit}
                        onChange={(e) => setFollowLimit(parseInt(e.target.value))}
                      />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="auto-follow">
              <Card className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Auto Follow/Unfollow</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" className="gap-2">
                        <UserPlus className="h-4 w-4" />
                        Follow
                      </Button>
                      <Button variant="outline" className="gap-2">
                        <UserMinus className="h-4 w-4" />
                        Unfollow
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Target Hashtags</label>
                      <Input placeholder="#fashion, #music, #art" />
                    </div>
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card className="p-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Auto Comments</h3>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Comment Template</label>
                    <Input
                      placeholder="Great content! 🔥"
                      value={commentTemplate}
                      onChange={(e) => setCommentTemplate(e.target.value)}
                    />
                    <p className="text-sm text-muted-foreground">
                      Use {'{username}'} to mention the post author
                    </p>
                  </div>
                  <Button className="w-full">Save Template</Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}