import { TrendChart } from "@/components/analytics/trend-chart";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { 
  Music2, 
  Video, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Play, 
  Plus,
  Loader2
} from "lucide-react";
import { SiSpotify, SiYoutube, SiInstagram } from "react-icons/si";
import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface ContentStats {
  totalVideos: number;
  totalTracks: number;
  activeStrategies: number;
  monthlyBudget: number;
  budgetSpent: number;
}

interface Campaign {
  id: string;
  name: string;
  status: string;
  budget: number;
  platform: string;
  startDate: Date;
  endDate: Date;
}

interface Track {
  id: string;
  title: string;
  platform: string;
  url: string;
  streams: number;
  createdAt: Date;
}

interface Video {
  id: string;
  title: string;
  platform: string;
  url: string;
  views: number;
  createdAt: Date;
}

export default function ArtistDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentTab, setCurrentTab] = useState("overview");

  // Query for content stats
  const { data: stats, isLoading: isLoadingStats } = useQuery({
    queryKey: ["content-stats", user?.uid],
    queryFn: async () => {
      if (!user) return null;

      try {
        // Get counts from different collections
        const videosRef = collection(db, "video_content");
        const tracksRef = collection(db, "music_content");
        const campaignsRef = collection(db, "marketing_campaigns");
        const budgetRef = collection(db, "marketing_budget");

        const videoQuery = query(videosRef, where("userId", "==", user.uid));
        const trackQuery = query(tracksRef, where("userId", "==", user.uid));
        const campaignQuery = query(
          campaignsRef, 
          where("userId", "==", user.uid),
          where("status", "==", "active")
        );
        const budgetQuery = query(
          budgetRef,
          where("userId", "==", user.uid),
          where("month", "==", new Date().getMonth()),
          where("year", "==", new Date().getFullYear())
        );

        const [videoSnap, trackSnap, campaignSnap, budgetSnap] = await Promise.all([
          getDocs(videoQuery),
          getDocs(trackQuery),
          getDocs(campaignQuery),
          getDocs(budgetQuery)
        ]);

        const budgetDoc = budgetSnap.docs[0]?.data();

        return {
          totalVideos: videoSnap.size,
          totalTracks: trackSnap.size,
          activeStrategies: campaignSnap.size,
          monthlyBudget: budgetDoc?.amount || 0,
          budgetSpent: budgetDoc?.spent || 0,
        } as ContentStats;
      } catch (error) {
        console.error("Error fetching stats:", error);
        toast({
          title: "Error",
          description: "Could not load dashboard statistics",
          variant: "destructive"
        });
        return null;
      }
    },
    enabled: !!user
  });

  // Query for latest tracks
  const { data: tracks = [], isLoading: isLoadingTracks } = useQuery({
    queryKey: ["latest-tracks", user?.uid],
    queryFn: async () => {
      if (!user) return [];

      try {
        const tracksRef = collection(db, "music_content");
        const q = query(
          tracksRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Track[];
      } catch (error) {
        console.error("Error fetching tracks:", error);
        return [];
      }
    },
    enabled: !!user
  });

  // Query for latest videos
  const { data: videos = [], isLoading: isLoadingVideos } = useQuery({
    queryKey: ["latest-videos", user?.uid],
    queryFn: async () => {
      if (!user) return [];

      try {
        const videosRef = collection(db, "video_content");
        const q = query(
          videosRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        })) as Video[];
      } catch (error) {
        console.error("Error fetching videos:", error);
        return [];
      }
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Artist Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your content, campaigns, and marketing strategies
              </p>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </div>

          {isLoadingStats ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <Music2 className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Tracks</p>
                    <h3 className="text-2xl font-bold">{stats?.totalTracks}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <Video className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Videos</p>
                    <h3 className="text-2xl font-bold">{stats?.totalVideos}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Strategies</p>
                    <h3 className="text-2xl font-bold">{stats?.activeStrategies}</h3>
                  </div>
                </div>
              </Card>
              <Card className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-orange-500/10 rounded-lg">
                    <DollarSign className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Budget Spent</p>
                    <h3 className="text-2xl font-bold">
                      ${stats?.budgetSpent}/{stats?.monthlyBudget}
                    </h3>
                  </div>
                </div>
              </Card>
            </div>
          )}

          <Tabs value={currentTab} onValueChange={setCurrentTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="music">Music</TabsTrigger>
              <TabsTrigger value="videos">Videos</TabsTrigger>
              <TabsTrigger value="marketing">Marketing</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                <div className="space-y-4">
                  {/* Activity items will go here */}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="music" className="space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Latest Tracks</h3>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Track
                  </Button>
                </div>
                {isLoadingTracks ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {tracks.map((track) => (
                      <Card key={track.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Play className="h-4 w-4 text-orange-500" />
                            <div>
                              <h4 className="font-medium">{track.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {track.streams.toLocaleString()} streams
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="videos" className="space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Latest Videos</h3>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Video
                  </Button>
                </div>
                {isLoadingVideos ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    {videos.map((video) => (
                      <Card key={video.id} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Play className="h-4 w-4 text-orange-500" />
                            <div>
                              <h4 className="font-medium">{video.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {video.views.toLocaleString()} views
                              </p>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            View Details
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </TabsContent>

            <TabsContent value="marketing" className="space-y-6">
              <Card className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold">Marketing Campaigns</h3>
                  <Button variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    New Campaign
                  </Button>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <Card className="p-4 border-orange-500/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h4 className="font-medium">Budget Overview</h4>
                        <p className="text-sm text-muted-foreground">Monthly marketing spend</p>
                      </div>
                      <DollarSign className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold">
                      ${stats?.budgetSpent}/{stats?.monthlyBudget}
                    </div>
                  </Card>

                  <Card className="p-4 border-orange-500/10">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h4 className="font-medium">Active Strategies</h4>
                        <p className="text-sm text-muted-foreground">Current running campaigns</p>
                      </div>
                      <TrendingUp className="h-4 w-4 text-orange-500" />
                    </div>
                    <div className="text-2xl font-bold">{stats?.activeStrategies}</div>
                  </Card>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
}