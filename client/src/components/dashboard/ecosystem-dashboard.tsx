import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import {
  Music2,
  Bot,
  GraduationCap,
  ShoppingBag,
  Palette,
  Video,
  Building2,
  Phone,
  User,
  TrendingUp,
  Activity,
  FileText,
  Tv,
  Music,
  CreditCard,
  Puzzle,
  PlusCircle,
  Zap,
  Sparkles
} from "lucide-react";
import { SiInstagram, SiSpotify, SiYoutube } from "react-icons/si";
import "./ecosystem-dashboard.css";

// Tipo para las métricas del usuario
interface UserMetrics {
  spotifyFollowers: number;
  instagramFollowers: number;
  youtubeViews: number;
  contractsCreated: number;
  prCampaigns: number;
  totalEngagement: number;
  musicVideos: number;
  aiVideos: number;
  contacts: number;
  styleRecommendations: number;
  coursesEnrolled: number;
  merchandiseSold: number;
  aiAgentsUsed: number;
  musicGenerated: number;
}

// Tipo para las herramientas del ecosistema
interface EcosystemTool {
  id: string;
  name: string;
  description: string;
  icon: any;
  route: string;
  stats: number;
  statsLabel: string;
  color: string;
  orbit: 'inner' | 'middle' | 'outer';
  angle?: number; // Ángulo para posicionar en la órbita
}

export default function EcosystemDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  // Estado para las métricas del usuario
  const [metrics, setMetrics] = useState<UserMetrics>({
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

  // Estado para la herramienta seleccionada
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  // Efecto para cargar las métricas del usuario
  useEffect(() => {
    if (!user) return;

    const fetchMetrics = async () => {
      try {
        const userMetricsRef = doc(db, `users/${user.uid}/metrics/current`);
        const metricsDoc = await getDoc(userMetricsRef);

        if (metricsDoc.exists()) {
          const data = metricsDoc.data() as UserMetrics;
          setMetrics(data);
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

  // Definir las herramientas para cada órbita con sus ángulos (calculados automáticamente más abajo)
  const toolsData: EcosystemTool[] = [
    // Órbita interna - Herramientas esenciales
    {
      id: "music-generator",
      name: "Music Generator",
      description: "Create AI-powered music",
      icon: Music2,
      route: "/music-generator",
      stats: metrics.musicGenerated,
      statsLabel: "Tracks",
      color: "text-orange-500",
      orbit: 'inner'
    },
    {
      id: "music-videos",
      name: "Music Videos",
      description: "Create and manage music videos",
      icon: Video,
      route: "/music-video-creator",
      stats: metrics.musicVideos,
      statsLabel: "Videos",
      color: "text-purple-600",
      orbit: 'inner'
    },
    {
      id: "ai-agents",
      name: "AI Agents",
      description: "Smart AI assistants",
      icon: Bot,
      route: "/ai-agents",
      stats: metrics.aiAgentsUsed,
      statsLabel: "Active Agents",
      color: "text-purple-500",
      orbit: 'inner'
    },
    {
      id: "artist-image",
      name: "Artist Image",
      description: "Style recommendations",
      icon: Palette,
      route: "/artist-image-advisor",
      stats: metrics.styleRecommendations,
      statsLabel: "Styles",
      color: "text-pink-500",
      orbit: 'inner'
    },

    // Órbita media - Herramientas de distribución
    {
      id: "store",
      name: "Merchandise",
      description: "Create custom merchandise",
      icon: ShoppingBag,
      route: "/merchandise",
      stats: metrics.merchandiseSold,
      statsLabel: "Products",
      color: "text-green-500",
      orbit: 'middle'
    },
    {
      id: "youtube",
      name: "YouTube Boost",
      description: "Grow your channel",
      icon: SiYoutube,
      route: "/youtube-views",
      stats: metrics.youtubeViews,
      statsLabel: "Views",
      color: "text-red-500",
      orbit: 'middle'
    },
    {
      id: "instagram",
      name: "Instagram Boost",
      description: "Increase Instagram reach",
      icon: SiInstagram,
      route: "/instagram-boost",
      stats: metrics.instagramFollowers,
      statsLabel: "Followers",
      color: "text-pink-500",
      orbit: 'middle'
    },
    {
      id: "spotify",
      name: "Spotify Boost",
      description: "Increase streams",
      icon: SiSpotify,
      route: "/spotify",
      stats: metrics.spotifyFollowers,
      statsLabel: "Followers",
      color: "text-green-500",
      orbit: 'middle'
    },
    {
      id: "tv",
      name: "Boostify TV",
      description: "Watch content",
      icon: Tv,
      route: "/boostify-tv",
      stats: 24,
      statsLabel: "Videos",
      color: "text-red-500",
      orbit: 'middle'
    },

    // Órbita externa - Herramientas analíticas y educativas
    {
      id: "education",
      name: "Education Hub",
      description: "Learn music industry skills",
      icon: GraduationCap,
      route: "/education",
      stats: metrics.coursesEnrolled,
      statsLabel: "Courses",
      color: "text-blue-500",
      orbit: 'outer'
    },
    {
      id: "analytics",
      name: "Analytics",
      description: "Track your performance",
      icon: TrendingUp,
      route: "/analytics",
      stats: metrics.totalEngagement,
      statsLabel: "Engagement",
      color: "text-blue-600",
      orbit: 'outer'
    },
    {
      id: "contracts",
      name: "Contracts",
      description: "Legal documents",
      icon: FileText,
      route: "/contracts",
      stats: metrics.contractsCreated,
      statsLabel: "Documents",
      color: "text-indigo-500",
      orbit: 'outer'
    },
    {
      id: "record-label",
      name: "Record Label",
      description: "Professional music services",
      icon: Building2,
      route: "/record-label-services",
      stats: metrics.totalEngagement,
      statsLabel: "Services",
      color: "text-amber-500",
      orbit: 'outer'
    },
    {
      id: "contacts",
      name: "Contacts",
      description: "Manage your network",
      icon: Phone,
      route: "/contacts",
      stats: metrics.contacts,
      statsLabel: "Contacts",
      color: "text-emerald-500",
      orbit: 'outer'
    },
    {
      id: "profile",
      name: "Profile",
      description: "Manage your profile",
      icon: User,
      route: "/profile",
      stats: 1,
      statsLabel: "Profile",
      color: "text-violet-500",
      orbit: 'outer'
    }
  ];

  // Asignar ángulos a cada herramienta basado en su posición en la órbita
  const toolsWithAngles = [...toolsData].map((tool, i, arr) => {
    // Encontrar todas las herramientas en la misma órbita
    const orbitTools = arr.filter(t => t.orbit === tool.orbit);
    const orbitIndex = orbitTools.findIndex(t => t.id === tool.id);
    const angleStep = 360 / orbitTools.length;
    
    return {
      ...tool,
      angle: orbitIndex * angleStep
    };
  });

  // Función para calcular la posición en la órbita
  const getPositionInOrbit = (orbit: string, angle: number) => {
    const radius = orbit === 'inner' ? 130 : orbit === 'middle' ? 220 : 310;
    const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
    const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
    return { x, y };
  };

  return (
    <div className="ecosystem-container">
      {/* Fondo con degradado */}
      <div className="ecosystem-bg-gradient" />
      
      {/* Efecto de partículas o brillo */}
      <div className="ecosystem-bg-texture" style={{ backgroundImage: "url('/assets/noise.svg')" }} />
      
      {/* Círculos que representan las órbitas */}
      <motion.div 
        className="ecosystem-orbit"
        style={{ width: 260, height: 260 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 200, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="ecosystem-orbit"
        style={{ width: 440, height: 440 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 300, repeat: Infinity, ease: "linear" }}
      />
      <motion.div 
        className="ecosystem-orbit"
        style={{ width: 620, height: 620 }}
        animate={{ rotate: 360 }}
        transition={{ duration: 400, repeat: Infinity, ease: "linear" }}
      />
      
      {/* Centro - Logo/Avatar del artista */}
      <motion.div 
        className="ecosystem-avatar"
        whileHover={{ scale: 1.05 }}
        animate={{ 
          boxShadow: ["0 0 20px rgba(249, 115, 22, 0.2)", "0 0 30px rgba(249, 115, 22, 0.4)", "0 0 20px rgba(249, 115, 22, 0.2)"]
        }}
        transition={{ 
          boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        {user?.photoURL ? (
          <img src={user.photoURL} alt={user.displayName || "Artist"} className="w-full h-full object-cover" />
        ) : (
          <div className="text-white text-5xl font-bold">
            {user?.displayName ? user.displayName.charAt(0) : "A"}
          </div>
        )}
      </motion.div>
      
      {/* Herramientas en órbitas */}
      {toolsWithAngles.map((tool) => {
        const position = getPositionInOrbit(tool.orbit, tool.angle || 0);
        return (
          <motion.div
            key={tool.id}
            className={`ecosystem-tool ${selectedTool === tool.id ? 'z-30' : ''}`}
            style={{ 
              left: "50%",
              top: "50%",
              x: position.x,
              y: position.y
            }}
            whileHover={{ scale: 1.1 }}
            animate={{ 
              boxShadow: selectedTool === tool.id ? 
                ["0 0 10px rgba(249, 115, 22, 0.2)", "0 0 20px rgba(249, 115, 22, 0.4)", "0 0 10px rgba(249, 115, 22, 0.2)"] : 
                "none" 
            }}
            transition={{ boxShadow: { duration: 2, repeat: Infinity } }}
          >
            <Link href={tool.route}>
              <motion.div 
                className="h-16 w-16 rounded-full bg-background/80 backdrop-blur-md border border-orange-500/20 shadow-md flex flex-col items-center justify-center cursor-pointer relative group"
                whileHover={{ scale: 1.1 }}
                onClick={() => setSelectedTool(tool.id)}
              >
                <tool.icon className={`h-6 w-6 ${tool.color}`} />
                
                {/* Tooltip que muestra al hacer hover */}
                <div className="ecosystem-tooltip">
                  <div className="text-sm font-semibold">{tool.name}</div>
                  <div className="text-xs text-muted-foreground">{tool.description}</div>
                  <div className="mt-1 flex items-center text-xs">
                    <span className={`font-semibold ${tool.color}`}>{tool.stats}</span>
                    <span className="ml-1 text-muted-foreground">{tool.statsLabel}</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        );
      })}
      
      {/* Añadir nueva herramienta - botón en la parte inferior */}
      <motion.div 
        className="ecosystem-add-button"
        whileHover={{ scale: 1.1, backgroundColor: "#f97316" }}
        whileTap={{ scale: 0.95 }}
      >
        <PlusCircle className="h-6 w-6 text-white" />
      </motion.div>
      
      {/* Panel de información (aparece cuando se selecciona una herramienta) */}
      <AnimatePresence>
        {selectedTool && (
          <motion.div 
            className="ecosystem-info-panel"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            {/* Contenido del panel basado en la herramienta seleccionada */}
            {(() => {
              const tool = toolsWithAngles.find(t => t.id === selectedTool);
              if (!tool) return null;
              
              return (
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0`}>
                    <tool.icon className={`h-6 w-6 ${tool.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                    <div className="mt-2 flex items-baseline">
                      <span className={`text-2xl font-bold ${tool.color}`}>
                        {tool.stats.toLocaleString()}
                      </span>
                      <span className="ml-2 text-sm text-muted-foreground">
                        {tool.statsLabel}
                      </span>
                    </div>
                  </div>
                  <Link href={tool.route}>
                    <motion.button 
                      className="px-4 py-2 bg-orange-500 text-white rounded-md flex items-center gap-2"
                      whileHover={{ scale: 1.05, backgroundColor: "#f97316" }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Zap className="h-4 w-4" />
                      <span>Launch</span>
                    </motion.button>
                  </Link>
                  <motion.button 
                    className="ml-2 p-2 rounded-full border border-orange-500/20"
                    whileHover={{ scale: 1.05, borderColor: "rgba(249, 115, 22, 0.5)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedTool(null)}
                  >
                    <Sparkles className="h-4 w-4 text-orange-500" />
                  </motion.button>
                </div>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}