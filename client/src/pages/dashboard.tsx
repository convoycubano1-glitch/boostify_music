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
  Sparkles
} from "lucide-react";
import { SiInstagram, SiSpotify, SiYoutube } from "react-icons/si";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/layout/header";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { motion } from 'framer-motion';

interface ServiceLinkProps {
  title: string;
  description: string;
  link: string;
  icon: string;
}

function ServiceLink({ title, description, link, icon }: ServiceLinkProps) {
  return (
    <Link href={link}>
      <a className="block h-full">
        <div className="bg-orange-500/5 hover:bg-orange-500/10 transition-colors duration-300 p-4 rounded-lg border border-orange-500/20 h-full flex flex-col">
          <div className="text-2xl mb-2">{icon}</div>
          <h3 className="font-medium text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        </div>
      </a>
    </Link>
  );
}

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
    aiAgentsUsed: 0
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
            aiAgentsUsed: data.aiAgentsUsed || 0
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
      highlight: true
    },
    {
      name: "Music Videos",
      description: "Create and manage music videos",
      icon: Video,
      route: "/music-video-creator",
      stats: metrics.musicVideos,
      statsLabel: "Videos",
      color: "text-orange-500"
    },
    {
      name: "Record Label Services",
      description: "Professional music services",
      icon: Building2,
      route: "/record-label-services",
      stats: metrics.totalEngagement,
      statsLabel: "Engagement",
      color: "text-orange-500"
    },
    {
      name: "Contacts",
      description: "Manage your network",
      icon: Phone,
      route: "/contacts",
      stats: metrics.contacts,
      statsLabel: "Contacts",
      color: "text-orange-500"
    },
    {
      name: "Instagram Boost",
      description: "Increase Instagram reach",
      icon: SiInstagram,
      route: "/instagram-boost",
      stats: metrics.instagramFollowers,
      statsLabel: "Followers",
      color: "text-orange-500"
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        <ScrollArea className="flex-1 h-[calc(100vh-5rem)]">
          <div className="container mx-auto px-4 py-4">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
              <div className="text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                  Welcome Back{user?.displayName ? `, ${user.displayName}` : ''}
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage your music presence and create engaging content
                </p>
              </div>
              <Button className="bg-orange-500 hover:bg-orange-600 w-full md:w-auto">
                <Activity className="mr-2 h-4 w-4" />
                View Analytics
              </Button>
            </div>

            {/* Featured Services Section */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold mb-4">Featured Services</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {services.filter(s => s.highlight).map((service) => (
                  <Link key={service.name} href={service.route}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300 }}
                    >
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
                    </motion.div>
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
                    <Card className="p-6 cursor-pointer hover:bg-orange-500/5 transition-colors border-orange-500/10 hover:border-orange-500/30">
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
            </div>

            {/* Main Services Grid */}
            <Card className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-2">Key Services</h3>
                <p className="text-sm text-muted-foreground">
                  Access your favorite tools and services
                </p>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <ServiceLink title="Education" description="Learn music skills" link="/education" icon="🎓" />
                <ServiceLink title="Store" description="Sell merchandise" link="/store" icon="🛍️" />
                <ServiceLink title="Boostify TV" description="Watch content" link="/boostify-tv" icon="📺" />
                <ServiceLink title="YouTube Boost" description="Grow your channel" link="/youtube-views" icon="📈" />
                <ServiceLink title="Spotify Boost" description="Increase streams" link="/spotify" icon="🎵" />
                <ServiceLink title="Contracts" description="Legal documents" link="/contracts" icon="📝" />
                <ServiceLink title="Profile" description="Artist profile" link="/profile" icon="👤" />
                <ServiceLink title="Smart Cards" description="Digital cards" link="/smart-cards" icon="💳" />
              </div>
            </Card>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}