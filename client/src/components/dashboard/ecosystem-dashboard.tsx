import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { SubscriptionLink } from "./subscription-link";
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
  orbitSpeed?: number; // Velocidad de la órbita
  animationOffset?: number; // Desplazamiento de la animación
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
      angle: orbitIndex * angleStep,
      orbitSpeed: tool.orbit === 'inner' ? 120 : tool.orbit === 'middle' ? 180 : 240, // Velocidad más lenta (120, 180, 240 segundos)
      animationOffset: 0 // Añadir para evitar errores
    };
  });

  // Estado para el seguimiento de la posición de cada herramienta (para efectos de tamaño)
  const [toolPositions, setToolPositions] = useState<{[key: string]: {angle: number, distanceFromCenter: number}}>({}); 

  // Función para calcular la posición en la órbita
  const getPositionInOrbit = (orbit: string, angle: number) => {
    // Radios ajustados para coincidir con los nuevos tamaños de órbitas
    const radius = orbit === 'inner' ? 110 : orbit === 'middle' ? 180 : 250;
    const x = Math.cos((angle - 90) * Math.PI / 180) * radius;
    const y = Math.sin((angle - 90) * Math.PI / 180) * radius;
    return { x, y, radius };
  };
  
  // Función para calcular si una herramienta está en la posición "cercana al centro"
  const isApproachingCenter = (toolId: string, currentAngle: number) => {
    // Consideramos "cercano al centro" cuando está en el rango de -45 a +45 grados
    // (es decir, en la parte frontal de la órbita, más cerca del usuario)
    const normalizedAngle = ((currentAngle % 360) + 360) % 360;
    return (normalizedAngle >= 315 || normalizedAngle <= 45);
  };

  // Función para determinar el nivel de suscripción requerido para una herramienta
  const getRequiredPlan = (toolId: string) => {
    if (toolId === "ai-agents" || toolId === "music-videos" || toolId === "record-label") {
      return "premium";
    } else if (toolId === "music-generator" || toolId === "artist-image" || toolId === "instagram" || toolId === "youtube" || toolId === "analytics") {
      return "pro";
    } else {
      return "basic";
    }
  };

  // Mensajes motivacionales para artistas
  const motivationalMessages = [
    "Unleash your creativity",
    "Your sound matters",
    "Turn passion into success",
    "Connect with your audience",
    "Elevate your music career",
    "Transform your vision into reality",
    "Reach new audiences globally",
    "Create without limits",
    "Your art, amplified"
  ];

  // Estado para el mensaje actual
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [messageVisible, setMessageVisible] = useState(true);

  // Efecto para rotar los mensajes
  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageVisible(false);
      
      setTimeout(() => {
        setCurrentMessageIndex((prev) => (prev + 1) % motivationalMessages.length);
        setMessageVisible(true);
      }, 1000); // Tiempo para el fade out antes de cambiar mensaje
      
    }, 6000); // Cambia cada 6 segundos
    
    return () => clearInterval(messageInterval);
  }, []);

  return (
    <div className="ecosystem-container">
      {/* Fondo con degradado */}
      <div className="ecosystem-bg-gradient" />
      
      {/* Efecto de partículas o brillo */}
      <div className="ecosystem-bg-texture" style={{ backgroundImage: "url('/assets/noise.svg')" }} />
      
      {/* Textos motivacionales */}
      <div className="motivational-text-container">
        <motion.div 
          className="boostify-brand"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
        >
          <span className="text-orange-500 font-bold">Boostify</span>
        </motion.div>
        
        <motion.div 
          className="motivational-text"
          initial={{ opacity: 0 }}
          animate={{ opacity: messageVisible ? 1 : 0 }}
          transition={{ duration: 1 }}
        >
          {motivationalMessages[currentMessageIndex]}
        </motion.div>
      </div>
      
      {/* Centro - Video en loop difuminado con resplandor mejorado */}
      <motion.div 
        className="ecosystem-avatar"
        animate={{ 
          boxShadow: [
            "0 0 25px rgba(249, 115, 22, 0.3)", 
            "0 0 40px rgba(249, 115, 22, 0.5)", 
            "0 0 25px rgba(249, 115, 22, 0.3)"
          ],
          border: [
            "2px solid rgba(249, 115, 22, 0.4)",
            "2px solid rgba(249, 115, 22, 0.7)",
            "2px solid rgba(249, 115, 22, 0.4)"
          ]
        }}
        transition={{ 
          boxShadow: { duration: 4, repeat: Infinity, ease: "easeInOut" },
          border: { duration: 4, repeat: Infinity, ease: "easeInOut" }
        }}
      >
        <video 
          autoPlay 
          loop 
          muted 
          playsInline
          poster={user?.photoURL || undefined}
        >
          <source src="/assets/Standard_Mode_Generated_Video (9).mp4" type="video/mp4" />
        </video>
      </motion.div>
      
      {/* Órbita interna */}
      <div className="orbit inner-orbit">
        {toolsWithAngles
          .filter(tool => tool.orbit === 'inner')
          .map((tool, index) => {
            // Calcular la posición exacta en la órbita
            const angle = (index * (360 / toolsWithAngles.filter(t => t.orbit === 'inner').length)) * (Math.PI / 180);
            const radius = 110; // Radio reducido para coincidir con el nuevo tamaño de órbita
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            return (
              <motion.div
                key={tool.id}
                className="orbit-item"
                style={{
                  position: 'absolute',
                  x, y,
                  transformOrigin: "center center" // Para asegurar rotación desde el centro
                }}
                initial={{ rotate: index * (360 / toolsWithAngles.filter(t => t.orbit === 'inner').length) }}
                animate={{
                  rotate: [index * (360 / toolsWithAngles.filter(t => t.orbit === 'inner').length), 
                          index * (360 / toolsWithAngles.filter(t => t.orbit === 'inner').length) + 360]
                }}
                transition={{
                  duration: 40, // Mucho más lento para que parezca respiración
                  repeat: Infinity,
                  ease: "easeInOut" // Cambio a easeInOut para un movimiento más natural
                }}
              >
                <motion.div 
                  className="ecosystem-tool-icon"
                  // Este elemento NO debe rotar para mantener la orientación correcta
                  animate={{ 
                    // Contra-rotación para mantener el icono siempre derecho
                    rotate: [-index * (360 / toolsWithAngles.filter(t => t.orbit === 'inner').length), 
                            -index * (360 / toolsWithAngles.filter(t => t.orbit === 'inner').length) - 360]
                  }}
                  transition={{ duration: 40, repeat: Infinity, ease: "easeInOut" }}
                >
                  <SubscriptionLink 
                    href={tool.route}
                    requiredPlan={getRequiredPlan(tool.id)}
                  >
                    <div 
                      className="h-14 w-14 rounded-full bg-background/40 backdrop-blur-md border border-orange-500/30 shadow-lg flex flex-col items-center justify-center cursor-pointer tool-icon-wrapper"
                      onClick={() => setSelectedTool(tool.id)}
                    >
                      <tool.icon className={`h-6 w-6 ${tool.color}`} />
                      
                      <div className="ecosystem-tool-label">
                        {tool.name}
                      </div>
                    </div>
                  </SubscriptionLink>
                </motion.div>
              </motion.div>
            );
          })}
      </div>
      
      {/* Órbita media */}
      <div className="orbit middle-orbit">
        {toolsWithAngles
          .filter(tool => tool.orbit === 'middle')
          .map((tool, index) => {
            // Calcular la posición exacta en la órbita
            const angle = (index * (360 / toolsWithAngles.filter(t => t.orbit === 'middle').length)) * (Math.PI / 180);
            const radius = 180; // Radio reducido para coincidir con el nuevo tamaño de órbita
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            return (
              <motion.div
                key={tool.id}
                className="orbit-item"
                style={{
                  position: 'absolute',
                  x, y,
                  transformOrigin: "center center" // Para asegurar rotación desde el centro
                }}
                initial={{ rotate: index * (360 / toolsWithAngles.filter(t => t.orbit === 'middle').length) }}
                animate={{
                  rotate: [index * (360 / toolsWithAngles.filter(t => t.orbit === 'middle').length), 
                          index * (360 / toolsWithAngles.filter(t => t.orbit === 'middle').length) + 360]
                }}
                transition={{
                  duration: 60, // Más lento que la órbita interna
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div 
                  className="ecosystem-tool-icon"
                  animate={{ 
                    rotate: [-index * (360 / toolsWithAngles.filter(t => t.orbit === 'middle').length), 
                            -index * (360 / toolsWithAngles.filter(t => t.orbit === 'middle').length) - 360]
                  }}
                  transition={{ duration: 60, repeat: Infinity, ease: "easeInOut" }}
                >
                  <SubscriptionLink 
                    href={tool.route}
                    requiredPlan={getRequiredPlan(tool.id)}
                  >
                    <div 
                      className="h-14 w-14 rounded-full bg-background/40 backdrop-blur-md border border-orange-500/30 shadow-lg flex flex-col items-center justify-center cursor-pointer tool-icon-wrapper"
                      onClick={() => setSelectedTool(tool.id)}
                    >
                      {typeof tool.icon === 'function' ? (
                        <tool.icon className={`h-6 w-6 ${tool.color}`} />
                      ) : (
                        <div className={`h-6 w-6 ${tool.color}`}>{tool.icon}</div>
                      )}
                      
                      <div className="ecosystem-tool-label">
                        {tool.name}
                      </div>
                    </div>
                  </SubscriptionLink>
                </motion.div>
              </motion.div>
            );
          })}
      </div>
      
      {/* Órbita externa */}
      <div className="orbit outer-orbit">
        {toolsWithAngles
          .filter(tool => tool.orbit === 'outer')
          .map((tool, index) => {
            // Calcular la posición exacta en la órbita
            const angle = (index * (360 / toolsWithAngles.filter(t => t.orbit === 'outer').length)) * (Math.PI / 180);
            const radius = 250; // Radio reducido para coincidir con el nuevo tamaño de órbita
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);
            
            return (
              <motion.div
                key={tool.id}
                className="orbit-item"
                style={{
                  position: 'absolute',
                  x, y,
                  transformOrigin: "center center" // Para asegurar rotación desde el centro
                }}
                initial={{ rotate: index * (360 / toolsWithAngles.filter(t => t.orbit === 'outer').length) }}
                animate={{
                  rotate: [index * (360 / toolsWithAngles.filter(t => t.orbit === 'outer').length), 
                          index * (360 / toolsWithAngles.filter(t => t.orbit === 'outer').length) + 360]
                }}
                transition={{
                  duration: 80, // Más lento que las órbitas internas
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
              >
                <motion.div 
                  className="ecosystem-tool-icon"
                  animate={{ 
                    rotate: [-index * (360 / toolsWithAngles.filter(t => t.orbit === 'outer').length), 
                            -index * (360 / toolsWithAngles.filter(t => t.orbit === 'outer').length) - 360]
                  }}
                  transition={{ duration: 80, repeat: Infinity, ease: "easeInOut" }}
                >
                  <SubscriptionLink 
                    href={tool.route}
                    requiredPlan={getRequiredPlan(tool.id)}
                  >
                    <div 
                      className="h-12 w-12 rounded-full bg-background/40 backdrop-blur-md border border-orange-500/30 shadow-lg flex flex-col items-center justify-center cursor-pointer tool-icon-wrapper smaller"
                      onClick={() => setSelectedTool(tool.id)}
                    >
                      <tool.icon className={`h-5 w-5 ${tool.color}`} />
                      
                      <div className="ecosystem-tool-label">
                        {tool.name}
                      </div>
                    </div>
                  </SubscriptionLink>
                </motion.div>
              </motion.div>
            );
          })}
      </div>
      
      {/* Resplandor central */}
      <div className="central-glow"></div>
    </div>
  );
}