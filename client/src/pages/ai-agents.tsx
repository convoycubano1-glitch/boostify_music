import { useState, useEffect } from "react";
import { logger } from "../lib/logger";
import { Header } from "../components/layout/header";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "../firebase";
import { PlanTierGuard } from "../components/youtube-views/plan-tier-guard";
import { isAdminEmail } from "../../../shared/constants";
import { useUser } from "@clerk/clerk-react";
import { 
  Brain, 
  Database, 
  Music2, 
  Video, 
  BarChart2, 
  ShoppingBag, 
  Users, 
  Briefcase,
  Camera,
  Search,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Star,
  History,
  Bookmark,
  Info,
  Lightbulb,
  TrendingUp,
  Calendar,
  Clock,
  Award,
  CheckCircle2
} from "lucide-react";
import { agentUsageService } from "../lib/services/agent-usage-service";
import { ComposerAgent } from "../components/ai/composer-agent";
import { VideoDirectorAgent } from "../components/ai/video-director-agent";
import { MarketingAgent } from "../components/ai/marketing-agent";
import { SocialMediaAgent } from "../components/ai/social-media-agent";
import { MerchandiseAgent } from "../components/ai/merchandise-agent";
import { ManagerAgent } from "../components/ai/manager-agent";
import { PhotographerAgent } from "../components/ai/photographer-agent";
import { AIDataManager } from "../components/ai/ai-data-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "../components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../components/ui/tooltip";
import { Badge } from "../components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";
import { Link } from "wouter";
import { useAuth } from "../hooks/use-auth";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Agentes con información mejorada y metadatos adicionales
const agentInfo = [
  {
    id: "composer",
    name: "AI Music Composer",
    description: "Your creative companion for musical composition",
    icon: Music2,
    color: "from-purple-600 to-blue-600",
    category: "creative",
    component: ComposerAgent,
    trending: true,
    useCases: [
      "Create original songs matching your style",
      "Generate lyrics for specific themes",
      "Experiment with new music genres"
    ],
    quickTip: "Include references to similar artists for better results",
    benefits: [
      "Save time in creative processes",
      "Overcome writer's block",
      "Explore new musical possibilities"
    ],
    recommendedWith: ["video-director", "marketing"]
  },
  {
    id: "video-director",
    name: "Video Director AI",
    description: "Create stunning music videos with AI assistance",
    icon: Video,
    color: "from-rose-500 to-pink-600",
    category: "visual",
    component: VideoDirectorAgent,
    trending: true,
    useCases: [
      "Conceptualize innovative music videos",
      "Create detailed scene-by-scene scripts",
      "Get visual ideas that complement your music"
    ],
    quickTip: "Include the emotional tone you want to convey for better concepts",
    benefits: [
      "Reduce pre-production planning time",
      "Find unique visual concepts",
      "Better align visuals with your music"
    ],
    recommendedWith: ["composer", "social-media"]
  },
  {
    id: "photographer",
    name: "AI Photographer",
    description: "Generate professional album covers and promotional images",
    icon: Camera,
    color: "from-cyan-500 to-blue-600",
    category: "visual",
    component: PhotographerAgent,
    trending: true,
    useCases: [
      "Create stunning album/single cover art",
      "Generate promotional images with different styles",
      "Use reference images to inspire AI-generated photos"
    ],
    quickTip: "Upload reference images for better style matching",
    benefits: [
      "Professional studio-quality images",
      "Multiple artistic styles available",
      "Save time and costs on photoshoots"
    ],
    recommendedWith: ["composer", "video-director"]
  },
  {
    id: "marketing",
    name: "Strategic Marketing AI",
    description: "Develop effective marketing strategies for your music",
    icon: BarChart2,
    color: "from-blue-500 to-indigo-600",
    category: "marketing",
    component: MarketingAgent,
    trending: false,
    useCases: [
      "Create launch plans for singles and albums",
      "Develop optimized social media campaigns",
      "Analyze metrics and improve existing strategies"
    ],
    quickTip: "Clearly define your target audience for more effective strategies",
    benefits: [
      "Increase audience reach",
      "Optimize marketing budget",
      "Personalize promotion for different platforms"
    ],
    recommendedWith: ["social-media", "manager"]
  },
  {
    id: "social-media",
    name: "Social Media Agent",
    description: "Optimize your presence across social platforms",
    icon: Users,
    color: "from-green-500 to-emerald-600",
    category: "marketing",
    component: SocialMediaAgent,
    trending: true,
    useCases: [
      "Develop optimized content calendars",
      "Generate post ideas to increase engagement",
      "Create platform-specific strategies"
    ],
    quickTip: "Share examples of successful previous posts for better recommendations",
    benefits: [
      "Save time on content planning",
      "Maintain consistent posting schedule",
      "Increase follower engagement"
    ],
    recommendedWith: ["marketing", "video-director"]
  },
  {
    id: "merchandise",
    name: "Merchandise Designer",
    description: "Create custom merch designs for your brand",
    icon: ShoppingBag,
    color: "from-amber-500 to-orange-600",
    category: "visual",
    component: MerchandiseAgent,
    trending: false,
    useCases: [
      "Design unique merch based on your artistic identity",
      "Create themed collections for events and releases",
      "Get suggestions to maximize revenue with merchandise"
    ],
    quickTip: "Provide visual elements of your brand for consistent designs",
    benefits: [
      "Create multiple design concepts quickly",
      "Align merchandise with your brand identity",
      "Expand revenue streams beyond music"
    ],
    recommendedWith: ["marketing", "manager"]
  },
  {
    id: "manager",
    name: "Career Manager AI",
    description: "Strategic career planning and management assistance",
    icon: Briefcase,
    color: "from-cyan-500 to-blue-600",
    category: "business",
    component: ManagerAgent,
    trending: false,
    useCases: [
      "Plan and optimize your music career path",
      "Receive guidance on strategic decisions",
      "Get help with contracts and negotiations"
    ],
    quickTip: "Be specific about your short and long-term goals for better advice",
    benefits: [
      "Make more informed business decisions",
      "Develop a structured career plan",
      "Optimize resources and opportunities"
    ],
    recommendedWith: ["marketing", "social-media"]
  }
];

// Definir las categorías de agentes
const agentCategories = [
  { id: "all", name: "Todos los agentes", icon: Brain },
  { id: "creative", name: "Creatividad", icon: Music2 },
  { id: "marketing", name: "Marketing", icon: BarChart2 },
  { id: "visual", name: "Visual", icon: Video },
  { id: "business", name: "Negocios", icon: Briefcase }
];

export default function AIAgentsPage() {
  const { user } = useAuth();
  const { user: clerkUser } = useUser();
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [recentAgents, setRecentAgents] = useState<string[]>([]);
  const [bookmarkedAgents, setBookmarkedAgents] = useState<string[]>([]);

  // Check if user is admin
  const userEmail = clerkUser?.primaryEmailAddress?.emailAddress || "";
  const isAdmin = isAdminEmail(userEmail);
  
  // Cargar historial reciente y agentes favoritos
  useEffect(() => {
    const loadUserPreferences = async () => {
      try {
        // Usar el servicio de agentes para obtener los datos del usuario
        const userId = user?.uid || 'anonymous';
        logger.info(`Loading user data for ${userId}`);
        
        // Obtener agentes favoritos usando el servicio
        const savedBookmarks = await agentUsageService.getBookmarkedAgents(userId);
        
        // Verificar si tenemos datos válidos
        if (savedBookmarks && Array.isArray(savedBookmarks) && savedBookmarks.length > 0) {
          setBookmarkedAgents(savedBookmarks);
          logger.info("Bookmarked agents loaded from service:", savedBookmarks);
        } else {
          // Si no hay datos en el servicio, intentar con localStorage como fallback
          try {
            const storedBookmarked = localStorage.getItem('bookmarkedAgents');
            const parsedBookmarked = storedBookmarked ? JSON.parse(storedBookmarked) : null;
            
            if (Array.isArray(parsedBookmarked) && parsedBookmarked.length > 0) {
              setBookmarkedAgents(parsedBookmarked);
              logger.info("Bookmarked agents loaded from localStorage:", parsedBookmarked);
            } else {
              // Si no hay datos en localStorage, usar valores predeterminados
              setBookmarkedAgents(["composer", "manager"]);
              logger.info("Using default bookmarked agents");
            }
          } catch (localError) {
            logger.error("Error loading bookmarks from localStorage:", localError);
            setBookmarkedAgents(["composer", "manager"]);
          }
        }
        
        // Obtener agentes recientes usando el servicio
        const savedRecentAgents = await agentUsageService.getRecentAgents(userId);
        
        // Verificar si tenemos datos válidos
        if (savedRecentAgents && Array.isArray(savedRecentAgents) && savedRecentAgents.length > 0) {
          setRecentAgents(savedRecentAgents);
          logger.info("Recent agents loaded from service:", savedRecentAgents);
          return; // Si ya tenemos datos válidos, no es necesario seguir
        } 
        
        // Si no hay datos en el servicio, intentar con localStorage como fallback
        try {
          const storedRecent = localStorage.getItem('recentAgents');
          const parsedRecent = storedRecent ? JSON.parse(storedRecent) : null;
          
          if (Array.isArray(parsedRecent) && parsedRecent.length > 0) {
            setRecentAgents(parsedRecent);
            logger.info("Recent agents loaded from localStorage:", parsedRecent);
            return; // Si ya obtuvimos datos, no es necesario seguir
          }
        } catch (localError) {
          logger.error("Error loading recent agents from localStorage:", localError);
        }
        
        // Si todavía no tenemos datos, buscar en las colecciones
        logger.info("No stored interactions found, checking collections...");
        
        try {
          // Importamos las funciones de Firebase aquí para evitar problemas 
          const { db } = await import("../firebase");
          const { collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
          const { AGENT_COLLECTIONS } = await import("../lib/api/openrouteraiagents");
          
          // Consultar historial reciente basado en las últimas interacciones
          const recentAgentTypes = new Set<string>();
          
          // Consulta en todas las colecciones de agentes
          for (const agentType of Object.keys(AGENT_COLLECTIONS)) {
            try {
              const collectionName = AGENT_COLLECTIONS[agentType];
              const recentQuery = query(
                collection(db, collectionName), 
                where('userId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(3)
              );
              
              const querySnapshot = await getDocs(recentQuery);
              if (!querySnapshot.empty) {
                recentAgentTypes.add(agentType);
                logger.info(`Found recent interactions with ${agentType} agent`);
              }
            } catch (error) {
              logger.error(`Error querying collection for ${agentType}:`, error);
            }
          }
          
          if (recentAgentTypes.size > 0) {
            // Convertir el Set a un Array compatible con TypeScript
            const recentAgentsArray = Array.from(recentAgentTypes);
            logger.info("Setting recent agents from Firestore:", recentAgentsArray);
            setRecentAgents(recentAgentsArray);
          } else {
            // Usar valores predeterminados si no hay interacciones recientes
            logger.info("No recent agent interactions found, using defaults");
            setRecentAgents(["composer", "marketing", "video-director"]);
          }
        } catch (firebaseError) {
          logger.error("Error querying Firestore collections:", firebaseError);
          // Usar valores predeterminados en caso de error
          setRecentAgents(["composer", "marketing", "video-director"]);
        }
        
      } catch (error) {
        logger.error("Error loading user preferences:", error);
        // Usar valores predeterminados en caso de error
        setRecentAgents(["composer", "marketing", "video-director"]);
        setBookmarkedAgents(["composer", "manager"]);
      }
    };
    
    loadUserPreferences();
  }, [user]);

  // Filtrar agentes según búsqueda y categoría
  const filteredAgents = agentInfo.filter(agent => {
    const matchesSearch = searchQuery === "" || 
      agent.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || agent.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Función para alternar un agente en favoritos
  const toggleBookmark = async (agentId: string) => {
    // Asegurarse de que el agentId sea válido
    if (!agentId || typeof agentId !== 'string') {
      logger.error('Invalid agent ID provided to toggleBookmark');
      return;
    }

    try {
      // Primero intentamos usar el servicio de agentes que maneja
      // tanto Firestore como localStorage de manera centralizada
      const userId = user?.uid || 'anonymous';
      logger.info(`Toggling bookmark for agent ${agentId} for user ${userId}`);
      
      // El servicio devuelve true si se añadió, false si se quitó
      const isNowBookmarked = await agentUsageService.toggleBookmark(agentId, userId);
      
      // Luego obtenemos la lista actualizada 
      const updatedBookmarks = await agentUsageService.getBookmarkedAgents(userId);
      
      // Si el servicio nos devuelve datos válidos, actualizamos la UI
      if (updatedBookmarks) {
        setBookmarkedAgents(updatedBookmarks);
        logger.info(`Agent ${agentId} ${isNowBookmarked ? 'added to' : 'removed from'} bookmarks via service`);
        return;
      }
    } catch (error) {
      logger.error('Error using agent usage service for bookmarks:', error);
    }
    
    // Si el servicio falló o devolvió datos vacíos, usamos el enfoque anterior
    logger.info("Using fallback method for bookmarks");
    
    let newBookmarked: string[] = [];
    
    if (bookmarkedAgents.includes(agentId)) {
      // Quitar de favoritos
      newBookmarked = bookmarkedAgents.filter(id => id !== agentId);
      logger.info(`Removing ${agentId} from bookmarks (fallback)`);
    } else {
      // Añadir a favoritos
      newBookmarked = [...bookmarkedAgents, agentId];
      logger.info(`Adding ${agentId} to bookmarks (fallback)`);
    }
    
    // Actualizar estado local inmediatamente para mejor UX
    setBookmarkedAgents(newBookmarked);
    
    // Guardar siempre en localStorage como respaldo
    try {
      localStorage.setItem('bookmarkedAgents', JSON.stringify(newBookmarked));
      logger.info('Bookmarks saved to localStorage:', newBookmarked);
    } catch (error) {
      logger.error('Error saving bookmarks to localStorage:', error);
    }
    
    // Si no hay usuario autenticado, terminamos aquí
    if (!user) return;
    
    try {
      // Guardar en Firestore para usuarios autenticados
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import("../firebase");
      
      const userPrefsRef = doc(db, 'userPreferences', user.uid);
      
      // Verificar si el documento existe
      const userPrefsSnap = await getDoc(userPrefsRef);
      
      if (userPrefsSnap.exists()) {
        // Actualizar documento existente
        await setDoc(userPrefsRef, {
          ...userPrefsSnap.data(),
          bookmarkedAgents: newBookmarked,
          updatedAt: serverTimestamp()
        }, { merge: true });
        logger.info('Bookmarks updated in existing Firestore document');
      } else {
        // Crear nuevo documento
        await setDoc(userPrefsRef, {
          userId: user.uid,
          recentAgents: recentAgents, // Guardar también los agentes recientes actuales
          bookmarkedAgents: newBookmarked,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        logger.info('New preferences document created in Firestore with bookmarks');
      }
    } catch (error) {
      logger.error('Error saving bookmarks to Firestore:', error);
    }
  };

  // Función para actualizar el historial de agentes recientes cuando se selecciona uno
  const updateRecentAgents = async (agentId: string) => {
    // Asegurarse de que el agentId sea válido
    if (!agentId || typeof agentId !== 'string') {
      logger.error('Invalid agent ID provided to updateRecentAgents');
      return;
    }
    
    try {
      // Primero, registrar el uso del agente en nuestro servicio
      // Esto manejará tanto usuarios autenticados como anónimos
      const userId = user?.uid || 'anonymous';
      logger.info(`Recording usage of agent ${agentId} for user ${userId}`);
      
      await agentUsageService.recordAgentUsage(agentId, userId);
      
      // Luego obtener la lista actualizada de agentes recientes
      const updatedRecentAgents = await agentUsageService.getRecentAgents(userId);
      
      // Actualizar el estado local para la UI
      if (updatedRecentAgents && updatedRecentAgents.length > 0) {
        setRecentAgents(updatedRecentAgents);
        logger.info('Recent agents updated from service:', updatedRecentAgents);
        return;
      }
    } catch (error) {
      logger.error('Error using agent usage service:', error);
    }
    
    // Si llegamos aquí, el servicio falló o devolvió datos vacíos
    // Usamos el enfoque anterior como respaldo
    logger.info("Using fallback method for recent agents");
    
    // Evitar duplicados moviendo el agentId al principio si ya existe
    let updatedRecentAgents: string[] = [];
    if (recentAgents.includes(agentId)) {
      updatedRecentAgents = [
        agentId,
        ...recentAgents.filter(id => id !== agentId)
      ];
      logger.info(`Repositioning ${agentId} at the top of recent agents`);
    } else {
      // Agregar al principio, manteniendo sólo los 3 más recientes
      updatedRecentAgents = [
        agentId,
        ...recentAgents.slice(0, 2)
      ];
      logger.info(`Adding ${agentId} to recent agents`);
    }
    
    // Actualizar estado local inmediatamente para mejor UX
    setRecentAgents(updatedRecentAgents);
    
    // Guardar en localStorage para usuarios no autenticados
    if (!user) {
      try {
        localStorage.setItem('recentAgents', JSON.stringify(updatedRecentAgents));
        logger.info('Recent agents saved to localStorage:', updatedRecentAgents);
      } catch (error) {
        logger.error('Error saving recent agents to localStorage:', error);
      }
      return;
    }
    
    try {
      // Guardar en Firestore para usuarios autenticados
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import("../firebase");
      
      // Asegurarnos de tener un ID de usuario válido, usando 'anonymous' como fallback
      const userId = user?.uid || 'anonymous';
      logger.info(`Saving recent agents for user ${userId}`);
      
      const userPrefsRef = doc(db, 'userPreferences', userId);
      
      // Verificar si el documento existe
      const userPrefsSnap = await getDoc(userPrefsRef);
      
      if (userPrefsSnap.exists()) {
        // Actualizar documento existente
        await setDoc(userPrefsRef, {
          ...userPrefsSnap.data(),
          recentAgents: updatedRecentAgents,
          updatedAt: serverTimestamp()
        }, { merge: true });
        logger.info('Recent agents updated in existing Firestore document');
      } else {
        // Crear nuevo documento
        await setDoc(userPrefsRef, {
          userId: userId,
          recentAgents: updatedRecentAgents,
          bookmarkedAgents: bookmarkedAgents, // Guardar también los favoritos actuales
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        logger.info('New preferences document created in Firestore with recent agents');
      }
      
      logger.info('Recent agents saved to Firestore:', updatedRecentAgents);
    } catch (error) {
      logger.error('Error saving recent agents to Firestore:', error);
      
      // Guardar en localStorage como fallback si falla Firestore
      try {
        localStorage.setItem('recentAgents', JSON.stringify(updatedRecentAgents));
        logger.info('Recent agents saved to localStorage as fallback');
      } catch (localError) {
        logger.error('Error saving recent agents to localStorage:', localError);
      }
    }
  };

  // Obtener el componente del agente seleccionado
  const SelectedAgentComponent = selectedAgent 
    ? agentInfo.find(a => a.id === selectedAgent)?.component
    : null;
    
  // Actualizar historial reciente cuando se selecciona un agente
  useEffect(() => {
    if (selectedAgent) {
      updateRecentAgents(selectedAgent);
    }
  }, [selectedAgent]);

  const pageContent = (
    <div className="min-h-screen flex flex-col bg-[#0F0F13]">
      <Header />
      <main className="flex-1 pt-16">
        {/* Floating particles as background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-orange-500/30"
              style={{
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`
              }}
            />
          ))}
        </div>
        
        <div className="container mx-auto px-4 py-6 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row items-center md:items-start md:justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-orange-500 to-purple-600">
                  <Brain className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-purple-500 to-blue-600">
                    AI Agents Orchestra
                  </h1>
                  <p className="text-lg text-gray-400 mt-1">
                    Potencia tu música con nuestro equipo de agentes especializados
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Link href="/ai-advisors">
                  <Button variant="outline" className="border-orange-500/30 text-orange-500 hover:bg-orange-500/10">
                    <HelpCircle className="h-4 w-4 mr-2" />
                    <span>AI Advisors</span>
                  </Button>
                </Link>
                <Button 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:opacity-90"
                  onClick={() => setActiveTab("data")}
                >
                  <Database className="h-4 w-4 mr-2" />
                  <span>Ver Analytics</span>
                </Button>
              </div>
            </div>
          </motion.div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
            <TabsList className="grid grid-cols-3 w-full gap-2 p-1 bg-[#1C1C24] rounded-xl border border-[#27272A]">
              <TabsTrigger 
                value="overview" 
                className="gap-2 text-base py-3 transition-all duration-300 data-[state=active]:bg-gradient-to-r from-orange-500 to-orange-600 data-[state=active]:text-white"
              >
                <Sparkles className="h-4 w-4" />
                <span>Explorar</span>
              </TabsTrigger>
              <TabsTrigger 
                value="agents" 
                className="gap-2 text-base py-3 transition-all duration-300 data-[state=active]:bg-gradient-to-r from-orange-500 to-orange-600 data-[state=active]:text-white"
              >
                <Brain className="h-4 w-4" />
                <span>Agentes</span>
              </TabsTrigger>
              <TabsTrigger 
                value="data" 
                className="gap-2 text-base py-3 transition-all duration-300 data-[state=active]:bg-gradient-to-r from-orange-500 to-orange-600 data-[state=active]:text-white"
              >
                <Database className="h-4 w-4" />
                <span>Analytics</span>
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab - New dashboard style view */}
            <TabsContent value="overview">
              <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
              >
                {/* Search and filters */}
                <motion.div 
                  variants={item}
                  className="flex flex-col md:flex-row gap-4"
                >
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input 
                      type="text"
                      placeholder="Buscar agentes por nombre o función..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-[#1C1C24] border-[#27272A] h-11 placeholder:text-gray-500"
                    />
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
                    {agentCategories.map(category => (
                      <Button
                        key={category.id}
                        size="sm"
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        className={
                          selectedCategory === category.id 
                            ? "bg-orange-500 hover:bg-orange-600 text-white h-11" 
                            : "border-[#27272A] text-gray-300 hover:bg-[#27272A] hover:text-white h-11"
                        }
                        onClick={() => setSelectedCategory(category.id)}
                      >
                        <category.icon className="h-4 w-4 mr-2" />
                        {category.name}
                      </Button>
                    ))}
                  </div>
                </motion.div>
                
                {/* Recently used */}
                {recentAgents.length > 0 && (
                  <motion.div variants={item} className="space-y-4">
                    <div className="flex items-center">
                      <History className="h-5 w-5 text-orange-500 mr-2" />
                      <h2 className="text-xl font-semibold text-white">Usados recientemente</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recentAgents.map(agentId => {
                        const agent = agentInfo.find(a => a.id === agentId);
                        if (!agent) return null;
                        return (
                          <Card 
                            key={agent.id}
                            className="bg-[#1C1C24] border-[#27272A] hover:border-orange-500/50 transition-all duration-300 cursor-pointer group"
                            onClick={() => {
                              setSelectedAgent(agent.id);
                              setActiveTab("agents");
                            }}
                          >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${agent.color}`}>
                                  <agent.icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg text-white">{agent.name}</CardTitle>
                                    {agent.trending && (
                                      <Badge className="bg-orange-500 text-white hover:bg-orange-600 text-xs flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>Trending</span>
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="text-gray-400 mt-1">
                                    {agent.description}
                                  </CardDescription>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(agent.id);
                                }}
                              >
                                <Star className={`h-4 w-4 ${bookmarkedAgents.includes(agent.id) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                              </Button>
                            </CardHeader>
                            <CardContent className="py-2">
                              <CardDescription className="text-gray-400">
                                {agent.description}
                              </CardDescription>
                            </CardContent>
                            <CardFooter>
                              <Button 
                                variant="ghost" 
                                className="text-orange-500 hover:bg-orange-500/10 p-0 gap-1 text-sm font-medium"
                              >
                                <span>Usar agente</span>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
                
                {/* Recommended based on history */}
                {recentAgents.length > 0 && (
                  <motion.div variants={item} className="space-y-4 mt-8">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Award className="h-5 w-5 text-orange-500 mr-2" />
                        <h2 className="text-xl font-semibold text-white">Recomendaciones personalizadas</h2>
                      </div>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="bg-orange-500/10 p-2 rounded-full">
                              <Info className="h-4 w-4 text-orange-500" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="left" className="max-w-xs">
                            <p>Sugerencias basadas en tus interacciones previas y preferencias personales.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {recentAgents.slice(0, 1).map(recentAgentId => {
                        const recentAgent = agentInfo.find(a => a.id === recentAgentId);
                        if (!recentAgent || !recentAgent.recommendedWith) return null;
                        
                        // Mostrar agentes recomendados basados en el agente usado recientemente
                        return recentAgent.recommendedWith.map(recommendedId => {
                          const recommendedAgent = agentInfo.find(a => a.id === recommendedId);
                          if (!recommendedAgent) return null;
                          return (
                            <Card 
                              key={`recommendation-${recommendedAgent.id}`}
                              className="bg-[#1C1C24] border-[#27272A] border-orange-500/30 hover:border-orange-500 transition-all duration-300 cursor-pointer group"
                              onClick={() => {
                                setSelectedAgent(recommendedAgent.id);
                                setActiveTab("agents");
                              }}
                            >
                              <div className="h-2 w-full bg-gradient-to-r rounded-t-lg" style={{ backgroundImage: `linear-gradient(to right, var(--${recommendedAgent.color}))` }}></div>
                              <CardHeader className="flex flex-row items-start justify-between pb-2">
                                <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-3">
                                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${recommendedAgent.color}`}>
                                      <recommendedAgent.icon className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                      <CardTitle className="text-lg text-white">{recommendedAgent.name}</CardTitle>
                                      <p className="text-xs text-orange-500 mt-1">
                                        Recomendado porque usaste <span className="font-medium">{recentAgent.name}</span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-8 w-8"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleBookmark(recommendedAgent.id);
                                  }}
                                >
                                  <Star className={`h-4 w-4 ${bookmarkedAgents.includes(recommendedAgent.id) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                                </Button>
                              </CardHeader>
                              <CardContent className="py-2">
                                <CardDescription className="text-gray-400">
                                  {recommendedAgent.description}
                                </CardDescription>
                              </CardContent>
                              <CardFooter className="border-t border-[#27272A]/50 pt-3 mt-2">
                                <Button 
                                  variant="ghost" 
                                  className="gap-1 text-sm font-medium text-orange-500 hover:bg-orange-500/10"
                                >
                                  <span>Usar agente</span>
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </CardFooter>
                            </Card>
                          )
                        })
                      })}
                    </div>
                  </motion.div>
                )}
                
                {/* All agents grid or filtered results */}
                <motion.div variants={item} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Brain className="h-5 w-5 text-orange-500 mr-2" />
                      <h2 className="text-xl font-semibold text-white">
                        {searchQuery || selectedCategory !== "all" 
                          ? `Resultados (${filteredAgents.length})` 
                          : "Todos los agentes"}
                      </h2>
                    </div>
                    
                    {(searchQuery || selectedCategory !== "all") && (
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("all");
                        }}
                        className="text-sm text-gray-400 hover:text-white"
                      >
                        Limpiar filtros
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredAgents.map(agent => (
                      <motion.div
                        key={agent.id}
                        variants={item}
                        whileHover={{ y: -5 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Card 
                          className="h-full bg-[#1C1C24] border-[#27272A] hover:border-orange-500/50 transition-all duration-300 cursor-pointer group"
                          onClick={() => {
                            setSelectedAgent(agent.id);
                            setActiveTab("agents");
                          }}
                        >
                          <div className="h-2 w-full bg-gradient-to-r rounded-t-lg" style={{ backgroundImage: `linear-gradient(to right, var(--${agent.color}))` }}></div>
                          <CardHeader className="flex flex-row items-start justify-between pb-2">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl bg-gradient-to-br ${agent.color}`}>
                                  <agent.icon className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <CardTitle className="text-lg text-white">{agent.name}</CardTitle>
                                    {agent.trending && (
                                      <Badge className="bg-orange-500 text-white hover:bg-orange-600 text-xs flex items-center gap-1">
                                        <TrendingUp className="h-3 w-3" />
                                        <span>Trending</span>
                                      </Badge>
                                    )}
                                  </div>
                                  <CardDescription className="text-gray-400 mt-1">
                                    {agent.description}
                                  </CardDescription>
                                </div>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBookmark(agent.id);
                              }}
                            >
                              <Star className={`h-4 w-4 ${bookmarkedAgents.includes(agent.id) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-400'}`} />
                            </Button>
                          </CardHeader>
                          <CardContent className="py-2 space-y-3">
                            {agent.quickTip && (
                              <div className="space-y-1">
                                <div className="flex items-center gap-1 text-orange-500 text-sm">
                                  <Lightbulb className="h-4 w-4" />
                                  <span className="font-medium">Consejo rápido:</span>
                                </div>
                                <p className="text-gray-400 text-sm">
                                  {agent.quickTip}
                                </p>
                              </div>
                            )}
                            
                            {agent.useCases && (
                              <Accordion type="single" collapsible className="w-full">
                                <AccordionItem value="use-cases" className="border-[#27272A]">
                                  <AccordionTrigger className="text-sm py-2 text-gray-300 hover:text-white">
                                    <div className="flex items-center gap-1">
                                      <CheckCircle2 className="h-4 w-4 text-orange-500" />
                                      <span>Casos de uso</span>
                                    </div>
                                  </AccordionTrigger>
                                  <AccordionContent className="text-xs text-gray-400">
                                    <ul className="space-y-1 list-disc list-inside">
                                      {agent.useCases.map((useCase, index) => (
                                        <li key={index}>{useCase}</li>
                                      ))}
                                    </ul>
                                  </AccordionContent>
                                </AccordionItem>
                              </Accordion>
                            )}
                          </CardContent>
                          <CardFooter className="border-t border-[#27272A]/50 pt-3 mt-2 flex justify-between">
                            <Button 
                              variant="ghost" 
                              className="gap-1 text-sm font-medium text-orange-500 hover:bg-orange-500/10"
                            >
                              <span>Usar agente</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="text-xs text-gray-500 px-2 py-1 rounded-full border border-gray-700">
                                    {agent.category === "creative" ? "Creatividad" : 
                                     agent.category === "marketing" ? "Marketing" :
                                     agent.category === "visual" ? "Visual" : "Negocios"}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent side="top">
                                  <p>Categoría del agente</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </CardFooter>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
                
                {/* Bookmarked agents */}
                {bookmarkedAgents.length > 0 && (
                  <motion.div variants={item} className="space-y-4">
                    <div className="flex items-center">
                      <Bookmark className="h-5 w-5 text-orange-500 mr-2" />
                      <h2 className="text-xl font-semibold text-white">Agentes favoritos</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {bookmarkedAgents.map(agentId => {
                        const agent = agentInfo.find(a => a.id === agentId);
                        if (!agent) return null;
                        return (
                          <Card 
                            key={agent.id}
                            className="bg-[#1C1C24] border-[#27272A] hover:border-orange-500/50 transition-all duration-300 cursor-pointer group"
                            onClick={() => {
                              setSelectedAgent(agent.id);
                              setActiveTab("agents");
                            }}
                          >
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                              <div className="flex flex-col gap-1">
                                <div className="flex items-center gap-2">
                                  <div className={`p-2 rounded-lg bg-gradient-to-br ${agent.color}`}>
                                    <agent.icon className="h-5 w-5 text-white" />
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <CardTitle className="text-lg text-white">{agent.name}</CardTitle>
                                      {agent.trending && (
                                        <Badge className="bg-orange-500 text-white hover:bg-orange-600 text-xs flex items-center gap-1">
                                          <TrendingUp className="h-3 w-3" />
                                          <span>Trending</span>
                                        </Badge>
                                      )}
                                    </div>
                                    <CardDescription className="text-gray-400 mt-1">
                                      {agent.description}
                                    </CardDescription>
                                  </div>
                                </div>
                              </div>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleBookmark(agent.id);
                                }}
                              >
                                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                              </Button>
                            </CardHeader>
                            <CardContent className="py-2">
                              {agent.quickTip && (
                                <div className="space-y-1 mb-2">
                                  <div className="flex items-center gap-1 text-orange-500 text-sm">
                                    <Lightbulb className="h-4 w-4" />
                                    <span className="font-medium">Consejo rápido:</span>
                                  </div>
                                  <p className="text-gray-400 text-sm">
                                    {agent.quickTip}
                                  </p>
                                </div>
                              )}
                            </CardContent>
                            <CardFooter className="border-t border-[#27272A]/50 pt-3 mt-2 flex justify-between">
                              <Button 
                                variant="ghost" 
                                className="gap-1 text-sm font-medium text-orange-500 hover:bg-orange-500/10"
                              >
                                <span>Usar agente</span>
                                <ChevronRight className="h-4 w-4" />
                              </Button>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="text-xs text-gray-500 px-2 py-1 rounded-full border border-gray-700">
                                      {agent.category === "creative" ? "Creatividad" : 
                                       agent.category === "marketing" ? "Marketing" :
                                       agent.category === "visual" ? "Visual" : "Negocios"}
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    <p>Categoría del agente</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </CardFooter>
                          </Card>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>

            {/* Main Agents Tab Content */}
            <TabsContent value="agents">
              <AnimatePresence mode="wait">
                {selectedAgent ? (
                  <motion.div
                    key="agent-details"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <Button
                      variant="ghost"
                      className="absolute top-0 left-0 text-sm text-gray-400 hover:text-white z-10 mb-4"
                      onClick={() => setSelectedAgent(null)}
                    >
                      ← Volver a todos los agentes
                    </Button>
                    
                    <div className="pt-12 max-w-7xl mx-auto">
                      {SelectedAgentComponent && <SelectedAgentComponent />}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="agents-grid"
                    variants={container}
                    initial="hidden"
                    animate="show"
                    exit={{ opacity: 0 }}
                    className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-7xl mx-auto"
                  >
                    <motion.div variants={item}><ComposerAgent /></motion.div>
                    <motion.div variants={item}><VideoDirectorAgent /></motion.div>
                    <motion.div variants={item}><MarketingAgent /></motion.div>
                    <motion.div variants={item}><SocialMediaAgent /></motion.div>
                    <motion.div variants={item}><MerchandiseAgent /></motion.div>
                    <motion.div variants={item}><ManagerAgent /></motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Data & Analytics Tab */}
            <TabsContent value="data">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <AIDataManager />
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );

  // If admin, return content directly; otherwise wrap with PlanTierGuard
  if (isAdmin) {
    return pageContent;
  }

  return (
    <PlanTierGuard requiredPlan="Premium">
      {pageContent}
    </PlanTierGuard>
  );
}