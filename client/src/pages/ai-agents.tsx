import { useState, useEffect } from "react";
import { Header } from "@/components/layout/header";
import { motion, AnimatePresence } from "framer-motion";
import { db } from "@/lib/firebase";
import { 
  Brain, 
  Database, 
  Music2, 
  Video, 
  BarChart2, 
  ShoppingBag, 
  Users, 
  Briefcase,
  Search,
  HelpCircle,
  ChevronRight,
  Sparkles,
  Star,
  History,
  Bookmark
} from "lucide-react";
import { ComposerAgent } from "@/components/ai/composer-agent";
import { VideoDirectorAgent } from "@/components/ai/video-director-agent";
import { MarketingAgent } from "@/components/ai/marketing-agent";
import { SocialMediaAgent } from "@/components/ai/social-media-agent";
import { MerchandiseAgent } from "@/components/ai/merchandise-agent";
import { ManagerAgent } from "@/components/ai/manager-agent";
import { AIDataManager } from "@/components/ai/ai-data-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.2 } }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

// Agentes con información mejorada
const agentInfo = [
  {
    id: "composer",
    name: "AI Music Composer",
    description: "Your creative companion for musical composition",
    icon: Music2,
    color: "from-purple-600 to-blue-600",
    category: "creative",
    component: ComposerAgent,
  },
  {
    id: "video-director",
    name: "Video Director AI",
    description: "Create stunning music videos with AI assistance",
    icon: Video,
    color: "from-rose-500 to-pink-600",
    category: "visual",
    component: VideoDirectorAgent,
  },
  {
    id: "marketing",
    name: "Strategic Marketing AI",
    description: "Develop effective marketing strategies for your music",
    icon: BarChart2,
    color: "from-blue-500 to-indigo-600",
    category: "marketing",
    component: MarketingAgent,
  },
  {
    id: "social-media",
    name: "Social Media Agent",
    description: "Optimize your presence across social platforms",
    icon: Users,
    color: "from-green-500 to-emerald-600",
    category: "marketing",
    component: SocialMediaAgent,
  },
  {
    id: "merchandise",
    name: "Merchandise Designer",
    description: "Create custom merch designs for your brand",
    icon: ShoppingBag,
    color: "from-amber-500 to-orange-600",
    category: "visual",
    component: MerchandiseAgent,
  },
  {
    id: "manager",
    name: "Career Manager AI",
    description: "Strategic career planning and management assistance",
    icon: Briefcase,
    color: "from-cyan-500 to-blue-600",
    category: "business",
    component: ManagerAgent,
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
  const [activeTab, setActiveTab] = useState("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [recentAgents, setRecentAgents] = useState<string[]>([]);
  const [bookmarkedAgents, setBookmarkedAgents] = useState<string[]>([]);
  
  // Cargar historial reciente y agentes favoritos de Firestore
  useEffect(() => {
    // Si no hay usuario, usar datos de localStorage
    if (!user) {
      try {
        const storedRecent = localStorage.getItem('recentAgents');
        const storedBookmarked = localStorage.getItem('bookmarkedAgents');
        
        // Verificar que los datos de localStorage sean arrays válidos
        const parsedRecent = storedRecent ? JSON.parse(storedRecent) : null;
        const parsedBookmarked = storedBookmarked ? JSON.parse(storedBookmarked) : null;
        
        setRecentAgents(
          Array.isArray(parsedRecent) && parsedRecent.length > 0 
            ? parsedRecent 
            : ["composer", "marketing", "video-director"]
        );
        
        setBookmarkedAgents(
          Array.isArray(parsedBookmarked) && parsedBookmarked.length > 0 
            ? parsedBookmarked 
            : ["composer", "manager"]
        );
      } catch (parseError) {
        console.error("Error parsing localStorage data:", parseError);
        // Fallback seguro usando valores predeterminados
        setRecentAgents(["composer", "marketing", "video-director"]);
        setBookmarkedAgents(["composer", "manager"]);
      }
      return;
    }
    
    const loadUserData = async () => {
      try {
        // Importamos las funciones de Firebase aquí para evitar problemas si no hay conexión a Firebase
        const { db } = await import('@/lib/firebase');
        const { doc, getDoc, collection, query, where, orderBy, limit, getDocs } = await import('firebase/firestore');
        
        // Asegurarnos de tener un ID de usuario válido, usando 'anonymous' como fallback
        const userId = user?.uid || 'anonymous';
        console.log(`Loading user data for ${userId}`);
        
        // Consultar preferencias del usuario para favoritos
        const userPrefsRef = doc(db, 'userPreferences', userId);
        const userPrefsSnap = await getDoc(userPrefsRef);
        
        if (userPrefsSnap.exists()) {
          const userData = userPrefsSnap.data();
          console.log("User preferences found:", userData);
          
          // Cargar agentes favoritos (con validación de tipo)
          if (userData.bookmarkedAgents && Array.isArray(userData.bookmarkedAgents)) {
            setBookmarkedAgents(userData.bookmarkedAgents);
          } else {
            console.log("No valid bookmarked agents found in user data, using defaults");
            setBookmarkedAgents(["composer", "manager"]);
          }
          
          // Cargar agentes recientes guardados (con validación de tipo)
          if (userData.recentAgents && Array.isArray(userData.recentAgents)) {
            setRecentAgents(userData.recentAgents);
            // Si hay agentes recientes guardados, no necesitamos consultar el historial
            return;
          }
        } else {
          console.log("No user preferences document found, creating new preferences");
          // Si no hay documento de preferencias, crearlo con valores predeterminados
          // Pero lo haremos más adelante cuando el usuario interactúe con la app
        }
        
        // Consultar historial reciente basado en las últimas interacciones
        const recentAgentTypes = new Set<string>();
        
        // Importar explícitamente AGENT_COLLECTIONS para asegurar su disponibilidad
        const { AGENT_COLLECTIONS } = await import('@/lib/api/openrouteraiagents');
        
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
              console.log(`Found recent interactions with ${agentType} agent`);
            }
          } catch (error) {
            console.error(`Error querying collection for ${agentType}:`, error);
          }
        }
        
        if (recentAgentTypes.size > 0) {
          // Convertir el Set a un Array compatible con TypeScript
          const recentAgentsArray = Array.from(recentAgentTypes);
          console.log("Setting recent agents from Firestore:", recentAgentsArray);
          setRecentAgents(recentAgentsArray);
        } else {
          console.log("No recent agent interactions found, using defaults");
          // Usar valores predeterminados si no hay interacciones recientes
          setRecentAgents(["composer", "marketing", "video-director"]);
        }
        
      } catch (error) {
        console.error("Error loading user data from Firestore:", error);
        // Usar valores predeterminados en caso de error
        setRecentAgents(["composer", "marketing", "video-director"]);
        setBookmarkedAgents(["composer", "manager"]);
      }
    };
    
    loadUserData();
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
      console.error('Invalid agent ID provided to toggleBookmark');
      return;
    }
    
    let newBookmarked: string[] = [];
    
    if (bookmarkedAgents.includes(agentId)) {
      // Quitar de favoritos
      newBookmarked = bookmarkedAgents.filter(id => id !== agentId);
      console.log(`Removing ${agentId} from bookmarks`);
    } else {
      // Añadir a favoritos
      newBookmarked = [...bookmarkedAgents, agentId];
      console.log(`Adding ${agentId} to bookmarks`);
    }
    
    // Actualizar estado local inmediatamente para mejor UX
    setBookmarkedAgents(newBookmarked);
    
    // Guardar en localStorage para usuarios no autenticados
    if (!user) {
      try {
        localStorage.setItem('bookmarkedAgents', JSON.stringify(newBookmarked));
        console.log('Bookmarks saved to localStorage:', newBookmarked);
      } catch (error) {
        console.error('Error saving bookmarks to localStorage:', error);
      }
      return;
    }
    
    try {
      // Guardar en Firestore para usuarios autenticados
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Asegurarnos de tener un ID de usuario válido, usando 'anonymous' como fallback
      const userId = user?.uid || 'anonymous';
      console.log(`Saving bookmarks for user ${userId}`);
      
      const userPrefsRef = doc(db, 'userPreferences', userId);
      
      // Verificar si el documento existe
      const userPrefsSnap = await getDoc(userPrefsRef);
      
      if (userPrefsSnap.exists()) {
        // Actualizar documento existente
        await setDoc(userPrefsRef, {
          ...userPrefsSnap.data(),
          bookmarkedAgents: newBookmarked,
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log('Bookmarks updated in existing Firestore document');
      } else {
        // Crear nuevo documento
        await setDoc(userPrefsRef, {
          userId: userId,
          bookmarkedAgents: newBookmarked,
          recentAgents: recentAgents, // Guardar también los agentes recientes actuales
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('New preferences document created in Firestore with bookmarks');
      }
      
      console.log('Bookmarks saved to Firestore:', newBookmarked);
    } catch (error) {
      console.error('Error saving bookmarks to Firestore:', error);
      // Si hay error, revertir al estado anterior para mantener consistencia
      setBookmarkedAgents(bookmarkedAgents);
      
      // Guardar en localStorage como fallback si falla Firestore
      try {
        localStorage.setItem('bookmarkedAgents', JSON.stringify(newBookmarked));
        console.log('Bookmarks saved to localStorage as fallback');
      } catch (localError) {
        console.error('Error saving bookmarks to localStorage:', localError);
      }
    }
  };

  // Función para actualizar el historial de agentes recientes cuando se selecciona uno
  const updateRecentAgents = async (agentId: string) => {
    // Asegurarse de que el agentId sea válido
    if (!agentId || typeof agentId !== 'string') {
      console.error('Invalid agent ID provided to updateRecentAgents');
      return;
    }
    
    // Evitar duplicados moviendo el agentId al principio si ya existe
    let updatedRecentAgents: string[] = [];
    if (recentAgents.includes(agentId)) {
      updatedRecentAgents = [
        agentId,
        ...recentAgents.filter(id => id !== agentId)
      ];
      console.log(`Repositioning ${agentId} at the top of recent agents`);
    } else {
      // Agregar al principio, manteniendo sólo los 3 más recientes
      updatedRecentAgents = [
        agentId,
        ...recentAgents.slice(0, 2)
      ];
      console.log(`Adding ${agentId} to recent agents`);
    }
    
    // Actualizar estado local inmediatamente para mejor UX
    setRecentAgents(updatedRecentAgents);
    
    // Guardar en localStorage para usuarios no autenticados
    if (!user) {
      try {
        localStorage.setItem('recentAgents', JSON.stringify(updatedRecentAgents));
        console.log('Recent agents saved to localStorage:', updatedRecentAgents);
      } catch (error) {
        console.error('Error saving recent agents to localStorage:', error);
      }
      return;
    }
    
    try {
      // Guardar en Firestore para usuarios autenticados
      const { doc, setDoc, getDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      
      // Asegurarnos de tener un ID de usuario válido, usando 'anonymous' como fallback
      const userId = user?.uid || 'anonymous';
      console.log(`Saving recent agents for user ${userId}`);
      
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
        console.log('Recent agents updated in existing Firestore document');
      } else {
        // Crear nuevo documento
        await setDoc(userPrefsRef, {
          userId: userId,
          recentAgents: updatedRecentAgents,
          bookmarkedAgents: bookmarkedAgents, // Guardar también los favoritos actuales
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        console.log('New preferences document created in Firestore with recent agents');
      }
      
      console.log('Recent agents saved to Firestore:', updatedRecentAgents);
    } catch (error) {
      console.error('Error saving recent agents to Firestore:', error);
      
      // Guardar en localStorage como fallback si falla Firestore
      try {
        localStorage.setItem('recentAgents', JSON.stringify(updatedRecentAgents));
        console.log('Recent agents saved to localStorage as fallback');
      } catch (localError) {
        console.error('Error saving recent agents to localStorage:', localError);
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

  return (
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
                                <CardTitle className="text-lg">{agent.name}</CardTitle>
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
                            <div className="flex items-center gap-3">
                              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${agent.color}`}>
                                <agent.icon className="h-5 w-5 text-white" />
                              </div>
                              <CardTitle className="text-lg text-white">{agent.name}</CardTitle>
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
                              <div className="flex items-center gap-2">
                                <div className={`p-2 rounded-lg bg-gradient-to-br ${agent.color}`}>
                                  <agent.icon className="h-5 w-5 text-white" />
                                </div>
                                <CardTitle className="text-lg">{agent.name}</CardTitle>
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
}