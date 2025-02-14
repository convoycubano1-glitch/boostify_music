import { TrendChart } from "@/components/analytics/trend-chart";
import { StatsCard } from "@/components/marketing/stats-card";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { InstagramConnect } from "@/components/instagram/instagram-connect";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Music2, TrendingUp, Activity, Users, Calendar, Globe, Youtube, FileText, Megaphone, Building2 } from "lucide-react";
import { SiInstagram, SiSpotify, SiYoutube } from "react-icons/si";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from "@/components/layout/header";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import { ChevronRight, Users2 } from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState({
    spotifyFollowers: 0,
    instagramFollowers: 0,
    youtubeViews: 0,
    contractsCreated: 0,
    prCampaigns: 0,
    totalEngagement: 0
  });

  useEffect(() => {
    if (!user) return;

    const fetchMetrics = async () => {
      try {
        const userMetricsRef = doc(db, `users/${user.uid}/metrics/current`);
        const metricsDoc = await getDoc(userMetricsRef);

        if (!metricsDoc.exists()) {
          const initialMetrics = {
            spotifyFollowers: 0,
            instagramFollowers: 0,
            youtubeViews: 0,
            contractsCreated: 0,
            prCampaigns: 0,
            totalEngagement: 0,
            updatedAt: new Date()
          };

          await setDoc(userMetricsRef, initialMetrics);
          setMetrics(initialMetrics);
        } else {
          const data = metricsDoc.data();
          setMetrics({
            spotifyFollowers: data.spotifyFollowers || 0,
            instagramFollowers: data.instagramFollowers || 0,
            youtubeViews: data.youtubeViews || 0,
            contractsCreated: data.contractsCreated || 0,
            prCampaigns: data.prCampaigns || 0,
            totalEngagement: data.totalEngagement || 0
          });
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
        toast({
          title: "Error Loading Metrics",
          description: "Please try refreshing the page.",
          variant: "destructive"
        });
      }
    };

    fetchMetrics();
  }, [user, toast]);

  const services = [
    {
      name: "Spotify Growth",
      description: "Boost your Spotify presence",
      icon: SiSpotify,
      route: "/spotify",
      stats: metrics.spotifyFollowers,
      statsLabel: "Followers",
      color: "text-orange-500"
    },
    {
      name: "Artist Image Advisor",
      description: "Get personalized style recommendations",
      icon: Users,
      route: "/artist-image-advisor",
      stats: metrics.totalEngagement,
      statsLabel: "Style Sessions",
      color: "text-orange-500"
    },
    {
      name: "Record Label Services",
      description: "Revive and monetize classic music",
      icon: Building2,
      route: "/record-label-services",
      stats: metrics.totalEngagement,
      statsLabel: "Total Engagement",
      color: "text-orange-500"
    },
    {
      name: "Instagram Boost",
      description: "Increase your Instagram reach",
      icon: SiInstagram,
      route: "/instagram-boost",
      stats: metrics.instagramFollowers,
      statsLabel: "Followers",
      color: "text-orange-500"
    },
    {
      name: "YouTube Views",
      description: "Grow your video views",
      icon: SiYoutube,
      route: "/youtube-views",
      stats: metrics.youtubeViews,
      statsLabel: "Views",
      color: "text-orange-500"
    },
    {
      name: "Contracts",
      description: "Manage professional agreements",
      icon: FileText,
      route: "/contracts",
      stats: metrics.contractsCreated,
      statsLabel: "Contracts",
      color: "text-orange-500"
    },
    {
      name: "PR Management",
      description: "Manage public presence",
      icon: Megaphone,
      route: "/pr",
      stats: metrics.prCampaigns,
      statsLabel: "Campaigns",
      color: "text-orange-500"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-20">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                  Dashboard
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage and enhance your musical presence from one place
                </p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 w-full md:w-auto">
                <Activity className="mr-2 h-4 w-4" />
                Live View
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {services.map((service) => (
                <Link key={service.name} href={service.route}>
                  <Card className="p-6 cursor-pointer hover:bg-orange-500/5 transition-colors border-orange-500/10 hover:border-orange-500/30">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <service.icon className={`h-5 w-5 ${service.color}`} />
                        </div>
                        <div>
                          <h3 className="font-semibold">{service.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {service.description}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 flex items-baseline">
                      <span className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-orange-500/70 bg-clip-text text-transparent">
                        {service.stats.toLocaleString()}
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {service.statsLabel}
                      </span>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>

            {/* Manager and Producer Tools Section */}
            <section className="relative overflow-hidden my-8">
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
                src="/assets/Standard_Mode_Generated_Video (9).mp4"
              />
              <div className="absolute inset-0 bg-black/60" />
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background" />

              <div className="container mx-auto px-4 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-12">
                  {/* Manager Tools */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <Link href="/manager-tools">
                      <Card className="p-6 cursor-pointer hover:bg-background/10 transition-colors border-orange-500/20 backdrop-blur-sm bg-background/5">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Users2 className="h-6 w-6 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Manager Tools</h3>
                            <p className="text-white/80">Advanced tools for music management</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-white/90">
                            <ChevronRight className="h-4 w-4 text-orange-500" />
                            <span>Artist Portfolio Management</span>
                          </div>
                          <div className="flex items-center gap-3 text-white/90">
                            <ChevronRight className="h-4 w-4 text-orange-500" />
                            <span>Contract Templates</span>
                          </div>
                          <div className="flex items-center gap-3 text-white/90">
                            <ChevronRight className="h-4 w-4 text-orange-500" />
                            <span>Performance Analytics</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>

                  {/* Producer Tools */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Link href="/producer-tools">
                      <Card className="p-6 cursor-pointer hover:bg-background/10 transition-colors border-orange-500/20 backdrop-blur-sm bg-background/5">
                        <div className="flex items-center gap-4 mb-4">
                          <div className="h-12 w-12 rounded-lg bg-orange-500/20 flex items-center justify-center">
                            <Music2 className="h-6 w-6 text-orange-500" />
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">Producer Tools</h3>
                            <p className="text-white/80">AI-powered music production suite</p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3 text-white/90">
                            <ChevronRight className="h-4 w-4 text-orange-500" />
                            <span>AI Music Generation</span>
                          </div>
                          <div className="flex items-center gap-3 text-white/90">
                            <ChevronRight className="h-4 w-4 text-orange-500" />
                            <span>Virtual Studio</span>
                          </div>
                          <div className="flex items-center gap-3 text-white/90">
                            <ChevronRight className="h-4 w-4 text-orange-500" />
                            <span>Collaboration Tools</span>
                          </div>
                        </div>
                      </Card>
                    </Link>
                  </motion.div>
                </div>
              </div>
            </section>

            <Card className="p-6 mb-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Overall Activity</h3>
                <p className="text-sm text-muted-foreground">
                  Track metrics across all platforms
                </p>
              </div>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                    date: new Date(2024, 0, i + 1).toLocaleDateString(),
                    spotify: Math.floor(Math.random() * 1000) + 500,
                    youtube: Math.floor(Math.random() * 800) + 300,
                    instagram: Math.floor(Math.random() * 600) + 200,
                  }))}>
                    <defs>
                      <linearGradient id="colorSpotify" x1="0" y1="0" x2="0" y2="1">
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
                      name="Spotify"
                      stroke="hsl(24, 95%, 53%)"
                      fillOpacity={1}
                      fill="url(#colorSpotify)"
                    />
                    <Area
                      type="monotone"
                      dataKey="youtube"
                      name="YouTube"
                      stroke="hsl(24, 95%, 53%)"
                      fillOpacity={0.5}
                      fill="url(#colorSpotify)"
                    />
                    <Area
                      type="monotone"
                      dataKey="instagram"
                      name="Instagram"
                      stroke="hsl(24, 95%, 53%)"
                      fillOpacity={0.3}
                      fill="url(#colorSpotify)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}