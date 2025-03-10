import { TrendChart } from "@/components/analytics/trend-chart";
import { StatsCard } from "@/components/marketing/stats-card";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { InstagramConnect } from "@/components/instagram/instagram-connect";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  Music2,
  TrendingUp,
  Activity,
  Users,
  Calendar,
  Globe,
  Youtube,
  FileText,
  Megaphone,
  Building2,
  Store,
  Video,
  Bot,
  Phone,
  Palette,
  GraduationCap,
  ShoppingBag,
  Sparkles,
  Tv,
  Music,
  User,
  CreditCard,
  Puzzle
} from "lucide-react";
import { SiInstagram, SiSpotify, SiYoutube } from "react-icons/si";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';
import EcosystemDashboard from "@/components/dashboard/ecosystem-dashboard";
import EcosystemDashboardImproved from "@/components/dashboard/ecosystem-dashboard-improved";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


export default function Dashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [metrics, setMetrics] = useState({
    spotifyFollowers: 0,
    instagramFollowers: 0,
    youtubeViews: 0,
    contractsCreated: 0,
    prCampaigns: 0,
    totalEngagement: 0,
    musicVideos: 0,
    aiVideos: 0,
    contacts: 0,
    styleRecommendations: 0,
    coursesEnrolled: 0,
    merchandiseSold: 0,
    aiAgentsUsed: 0,
    musicGenerated: 0
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
            musicVideos: 0,
            aiVideos: 0,
            contacts: 0,
            styleRecommendations: 0,
            coursesEnrolled: 0,
            merchandiseSold: 0,
            aiAgentsUsed: 0,
            musicGenerated: 0,
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
            totalEngagement: data.totalEngagement || 0,
            musicVideos: data.musicVideos || 0,
            aiVideos: data.aiVideos || 0,
            contacts: data.contacts || 0,
            styleRecommendations: data.styleRecommendations || 0,
            coursesEnrolled: data.coursesEnrolled || 0,
            merchandiseSold: data.merchandiseSold || 0,
            aiAgentsUsed: data.aiAgentsUsed || 0,
            musicGenerated: data.musicGenerated || 0
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
      name: "AI Agents",
      description: "Smart AI assistants",
      icon: Bot,
      route: "/ai-agents",
      stats: metrics.aiAgentsUsed,
      statsLabel: "Active Agents",
      color: "text-purple-500",
      highlight: true
    },
    {
      name: "Education Hub",
      description: "Learn music industry skills",
      icon: GraduationCap,
      route: "/education",
      stats: metrics.coursesEnrolled,
      statsLabel: "Courses",
      color: "text-blue-500",
      highlight: true
    },
    {
      name: "Music Generator",
      description: "Create AI-powered music",
      icon: Music2,
      route: "/music-generator",
      stats: metrics.musicGenerated,
      statsLabel: "Tracks",
      color: "text-orange-500",
      highlight: true
    },
    {
      name: "Merchandise Store",
      description: "Create custom merchandise",
      icon: ShoppingBag,
      route: "/merchandise",
      stats: metrics.merchandiseSold,
      statsLabel: "Products",
      color: "text-green-500",
      highlight: true
    },
    {
      name: "Artist Image",
      description: "Style recommendations",
      icon: Palette,
      route: "/artist-image-advisor",
      stats: metrics.styleRecommendations,
      statsLabel: "Styles",
      color: "text-pink-500",
      highlight: false
    },
    {
      name: "Music Videos",
      description: "Create and manage music videos",
      icon: Video,
      route: "/music-video-creator",
      stats: metrics.musicVideos,
      statsLabel: "Videos",
      color: "text-purple-600"
    },
    {
      name: "Record Label Services",
      description: "Professional music services",
      icon: Building2,
      route: "/record-label-services",
      stats: metrics.totalEngagement,
      statsLabel: "Engagement",
      color: "text-indigo-500"
    },
    {
      name: "Contacts",
      description: "Manage your network",
      icon: Phone,
      route: "/contacts",
      stats: metrics.contacts,
      statsLabel: "Contacts",
      color: "text-emerald-500"
    },
    {
      name: "Instagram Boost",
      description: "Increase Instagram reach",
      icon: SiInstagram,
      route: "/instagram-boost",
      stats: metrics.instagramFollowers,
      statsLabel: "Followers",
      color: "text-pink-500"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Se eliminó el Header para esta página específica */}
      <main className="flex-1">
        <div className="container mx-auto px-4 py-4">
          <div className="mb-6">
            <div className="relative w-full rounded-xl overflow-hidden shadow-xl" style={{ minHeight: "300px" }}>
              {/* Video background */}
              <video 
                src="/assets/Standard_Mode_Generated_Video (2).mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-cover absolute top-0 left-0 z-0"
                style={{ 
                  minHeight: "300px",
                  objectFit: "cover",
                  display: "block"
                }}
              />
              
              {/* Dark overlay for better text readability */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 to-black/40 z-10"></div>
              
              {/* Text content over video */}
              <div className="relative z-20 p-8 md:p-12 flex flex-col h-full justify-center">
                <div className="max-w-md">
                  <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-200 mb-3">
                    Welcome Back{user?.displayName ? `, ${user.displayName}` : ''}
                  </h1>
                  <p className="text-white/90 text-md md:text-lg mb-6">
                    Manage your music presence and create engaging content
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/analytics">
                      <Button className="bg-orange-500 hover:bg-orange-600 w-full md:w-auto">
                        <Activity className="mr-2 h-4 w-4" />
                        View Analytics
                      </Button>
                    </Link>
                    <Link href="/profile">
                      <Button className="bg-purple-500 hover:bg-purple-600 w-full md:w-auto">
                        <User className="mr-2 h-4 w-4" />
                        My Profile
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs para elegir entre vista clásica y vista de ecosistema */}
          <div className="mb-6">
            <Tabs defaultValue="ecosystem" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="ecosystem" className="text-lg">
                  <Sparkles className="mr-2 h-4 w-4" />
                  Ecosistema
                </TabsTrigger>
                <TabsTrigger value="classic" className="text-lg">
                  <Activity className="mr-2 h-4 w-4" />
                  Vista Clásica
                </TabsTrigger>
              </TabsList>
              
              {/* Vista de Ecosistema Mejorada */}
              <TabsContent value="ecosystem" className="mt-0">
                <EcosystemDashboardImproved />
              </TabsContent>
              
              {/* Vista Clásica */}
              <TabsContent value="classic" className="mt-0">
                <ScrollArea className="flex-1 h-[calc(100vh-22rem)]">
                  <div>
                    {/* Featured Services Section */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">Featured Services</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {services.filter(s => s.highlight).map((service) => (
                          <Link key={service.name} href={service.route}>
                            <div>
                              <Card className="p-6 cursor-pointer bg-gradient-to-br from-background to-orange-500/5 hover:from-orange-500/10 hover:to-background border-orange-500/20 hover:border-orange-500/40 transition-all">
                                <div className="flex items-center gap-4">
                                  <div className={`h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center`}>
                                    <service.icon className={`h-6 w-6 ${service.color}`} />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{service.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {service.description}
                                    </p>
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
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Other Services Grid */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">Other Services</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {services.filter(s => !s.highlight).map((service) => (
                          <Link key={service.name} href={service.route}>
                            <div>
                              <Card className="p-6 cursor-pointer bg-gradient-to-br from-background to-orange-500/5 hover:from-orange-500/10 hover:to-background border-orange-500/20 hover:border-orange-500/40 transition-all">
                                <div className="flex items-center gap-3">
                                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                                    <service.icon className={`h-5 w-5 ${service.color}`} />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{service.name}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {service.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-baseline">
                                  <span className={`text-2xl font-bold ${service.color}`}>
                                    {service.stats.toLocaleString()}
                                  </span>
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    {service.statsLabel}
                                  </span>
                                </div>
                              </Card>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>

                    {/* Main Services Grid */}
                    <div className="mb-8">
                      <h2 className="text-xl font-semibold mb-4">Key Services</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                          { title: "Education", description: "Learn music skills", link: "/education", icon: GraduationCap, statsValue: metrics.coursesEnrolled, statsLabel: "Courses", color: "text-blue-500" },
                          { title: "Store", description: "Sell merchandise", link: "/store", icon: ShoppingBag, statsValue: metrics.merchandiseSold, statsLabel: "Products", color: "text-green-500" },
                          { title: "Boostify TV", description: "Watch content", link: "/boostify-tv", icon: Tv, statsValue: 24, statsLabel: "Videos", color: "text-red-500" },
                          { title: "YouTube Boost", description: "Grow your channel", link: "/youtube-views", icon: Video, statsValue: metrics.youtubeViews, statsLabel: "Views", color: "text-rose-500" },
                          { title: "Spotify Boost", description: "Increase streams", link: "/spotify", icon: Music, statsValue: metrics.spotifyFollowers, statsLabel: "Followers", color: "text-emerald-500" },
                          { title: "Plugins", description: "Content extensions", link: "/plugins", icon: Puzzle, statsValue: 8, statsLabel: "Plugins", color: "text-cyan-500" },
                          { title: "Contracts", description: "Legal documents", link: "/contracts", icon: FileText, statsValue: metrics.contractsCreated, statsLabel: "Documents", color: "text-indigo-500" },
                          { title: "Profile", description: "Artist profile", link: "/profile", icon: User, statsValue: 1, statsLabel: "Profile", color: "text-purple-500" },
                          { title: "Smart Cards", description: "Digital cards", link: "/smart-cards", icon: CreditCard, statsValue: 3, statsLabel: "Cards", color: "text-amber-500" }
                        ].map((service) => (
                          <Link key={service.title} href={service.link}>
                            <div>
                              <Card className="p-6 cursor-pointer bg-gradient-to-br from-background to-orange-500/5 hover:from-orange-500/10 hover:to-background border-orange-500/20 hover:border-orange-500/40 transition-all">
                                <div className="flex items-center gap-4">
                                  <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                                    <service.icon className={`h-6 w-6 ${service.color}`} />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold">{service.title}</h3>
                                    <p className="text-sm text-muted-foreground">
                                      {service.description}
                                    </p>
                                  </div>
                                </div>
                                <div className="mt-4 flex items-baseline">
                                  <span className={`text-2xl font-bold ${service.color}`}>
                                    {service.statsValue.toLocaleString()}
                                  </span>
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    {service.statsLabel}
                                  </span>
                                </div>
                              </Card>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
}