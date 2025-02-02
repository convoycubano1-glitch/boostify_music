import { TrendChart } from "@/components/analytics/trend-chart";
import { StatsCard } from "@/components/marketing/stats-card";
import { PlaylistManager } from "@/components/spotify/playlist-manager";
import { InstagramConnect } from "@/components/instagram/instagram-connect";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Music2, TrendingUp, Activity, Users, Calendar, Globe, Youtube, FileText, Megaphone } from "lucide-react";
import { SiInstagram, SiSpotify, SiYoutube } from "react-icons/si";
import { useEffect, useState } from "react";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { Card } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Header } from "@/components/layout/header";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

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

  const services = [
    {
      name: "Spotify Growth",
      description: "Impulsa tu presencia en Spotify",
      icon: SiSpotify,
      route: "/spotify",
      stats: metrics.spotifyFollowers,
      statsLabel: "Seguidores",
      color: "text-orange-500"
    },
    {
      name: "Instagram Boost",
      description: "Aumenta tu alcance en Instagram",
      icon: SiInstagram,
      route: "/instagram-boost",
      stats: metrics.instagramFollowers,
      statsLabel: "Seguidores",
      color: "text-orange-500"
    },
    {
      name: "YouTube Views",
      description: "Incrementa tus visualizaciones",
      icon: SiYoutube,
      route: "/youtube-views",
      stats: metrics.youtubeViews,
      statsLabel: "Vistas",
      color: "text-orange-500"
    },
    {
      name: "Contratos",
      description: "Gestiona tus acuerdos profesionales",
      icon: FileText,
      route: "/contracts",
      stats: metrics.contractsCreated,
      statsLabel: "Contratos",
      color: "text-orange-500"
    },
    {
      name: "PR Management",
      description: "Gestiona tu presencia pública",
      icon: Megaphone,
      route: "/pr",
      stats: metrics.prCampaigns,
      statsLabel: "Campañas",
      color: "text-orange-500"
    }
  ];

  useEffect(() => {
    if (!user) return;

    // Subscribe to real-time metrics updates
    const metricsRef = collection(db, 'metrics');
    const metricsQuery = query(metricsRef, where("userId", "==", user.uid));

    const unsubscribeMetrics = onSnapshot(metricsQuery, 
      (snapshot) => {
        const metricsData = {
          spotifyFollowers: 0,
          instagramFollowers: 0,
          youtubeViews: 0,
          contractsCreated: 0,
          prCampaigns: 0,
          totalEngagement: 0
        };

        snapshot.forEach((doc) => {
          const data = doc.data();
          Object.assign(metricsData, data);
        });

        setMetrics(metricsData);
      },
      (error) => {
        console.error('Error al obtener métricas:', error);
        if (error.code === 'permission-denied') {
          // Crear documento inicial de métricas para el usuario
          const initialMetrics = {
            userId: user.uid,
            spotifyFollowers: 0,
            instagramFollowers: 0,
            youtubeViews: 0,
            contractsCreated: 0,
            prCampaigns: 0,
            totalEngagement: 0,
            createdAt: new Date()
          };

          metricsRef.add(initialMetrics)
            .then(() => {
              console.log('Documento de métricas inicializado');
            })
            .catch((error) => {
              console.error('Error al inicializar métricas:', error);
              toast({
                title: "Error al cargar métricas",
                description: "No se pudieron cargar tus métricas. Por favor, intenta recargar la página.",
                variant: "destructive"
              });
            });
        }
      }
    );

    return () => {
      unsubscribeMetrics();
    };
  }, [user]);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Header Section */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Music Marketing Hub
              </h1>
              <p className="text-muted-foreground mt-2">
                Gestiona y potencia tu presencia musical desde un solo lugar
              </p>
            </div>
            <Button className="bg-orange-500 hover:bg-orange-600">
              <Activity className="mr-2 h-4 w-4" />
              Vista en Vivo
            </Button>
          </div>

          {/* Services Grid */}
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

          {/* Activity Chart */}
          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Actividad General</h3>
              <p className="text-sm text-muted-foreground">
                Seguimiento de métricas en todas las plataformas
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
    </div>
  );
}