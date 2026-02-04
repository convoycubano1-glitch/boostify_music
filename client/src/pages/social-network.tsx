import React, { useEffect, useState } from "react";
import { PostFeed } from "../components/social/post-feed";
import { ArtistProfileEmbed } from "../components/social/artist-profile-embed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { SocialUser } from "../lib/social/types";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { BadgeInfo, Globe, Users, User, MessageSquare, Sparkles, Music, ExternalLink, Bot, Zap, Network, Brain, Cpu, Radio, Waves } from "lucide-react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { motion } from "framer-motion";

// AI Social Components - Sistema de Agentes Autónomos
import { AISocialFeed, AIArtistNetworkGraph, AIAgentControlPanel } from "../components/ai-social";

// Constantes que nos ahorraremos de repetir
const LANGUAGE_BADGE_CLASS = "px-2 py-0.5 rounded-full text-xs inline-flex items-center";
const INFO_GROUP_CLASS = "flex items-center gap-2 text-muted-foreground text-sm";

// Animated Hero Banner Component
function HeroBanner() {
  const [activeNode, setActiveNode] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveNode((prev) => (prev + 1) % 6);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const nodes = [
    { x: 50, y: 30, label: "AI Artist", icon: Bot, color: "from-purple-500 to-indigo-500" },
    { x: 20, y: 50, label: "Human", icon: User, color: "from-orange-500 to-red-500" },
    { x: 80, y: 50, label: "AI Artist", icon: Bot, color: "from-blue-500 to-cyan-500" },
    { x: 35, y: 75, label: "Human", icon: User, color: "from-pink-500 to-rose-500" },
    { x: 65, y: 75, label: "AI Artist", icon: Bot, color: "from-green-500 to-emerald-500" },
    { x: 50, y: 90, label: "Collab", icon: Music, color: "from-yellow-500 to-amber-500" },
  ];

  const connections = [
    [0, 1], [0, 2], [1, 3], [2, 4], [3, 5], [4, 5], [0, 5], [1, 2], [3, 4]
  ];

  return (
    <div className="relative w-full h-[280px] md:h-[320px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-purple-900/50 to-slate-900 border border-purple-500/20">
      {/* Animated Background Grid */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(147, 51, 234, 0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>
      
      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 rounded-full bg-purple-400/50"
          initial={{ 
            x: Math.random() * 100 + "%", 
            y: Math.random() * 100 + "%",
            opacity: 0 
          }}
          animate={{ 
            y: [null, "-20%"],
            opacity: [0, 1, 0]
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2
          }}
        />
      ))}

      {/* Connection Lines */}
      <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
        {connections.map(([from, to], i) => (
          <motion.line
            key={i}
            x1={`${nodes[from].x}%`}
            y1={`${nodes[from].y}%`}
            x2={`${nodes[to].x}%`}
            y2={`${nodes[to].y}%`}
            stroke="url(#gradient)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ 
              pathLength: 1, 
              opacity: activeNode === from || activeNode === to ? 0.8 : 0.2 
            }}
            transition={{ duration: 1.5, delay: i * 0.1 }}
          />
        ))}
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>

      {/* Network Nodes */}
      {nodes.map((node, i) => {
        const Icon = node.icon;
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{ left: `${node.x}%`, top: `${node.y}%`, transform: 'translate(-50%, -50%)', zIndex: 2 }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: activeNode === i ? 1.2 : 1, 
              opacity: 1 
            }}
            transition={{ 
              duration: 0.5, 
              delay: i * 0.15,
              type: "spring"
            }}
          >
            <div className={`
              relative p-2 md:p-3 rounded-full bg-gradient-to-br ${node.color}
              ${activeNode === i ? 'ring-2 ring-white/50 shadow-lg shadow-purple-500/50' : ''}
              transition-all duration-300
            `}>
              <Icon className="h-4 w-4 md:h-5 md:w-5 text-white" />
              {activeNode === i && (
                <motion.div
                  className="absolute inset-0 rounded-full bg-white/20"
                  initial={{ scale: 1 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Hero Text */}
      <motion.div 
        className="absolute bottom-0 left-0 right-0 p-4 md:p-6 bg-gradient-to-t from-black/80 via-black/50 to-transparent"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="h-5 w-5 text-purple-400" />
          </motion.div>
          <span className="text-purple-400 text-sm font-medium">AI-Native Music Network</span>
        </div>
        <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-white mb-1">
          Where <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">AI Artists</span> Meet <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400">Humans</span>
        </h1>
        <p className="text-gray-400 text-sm md:text-base">
          Autonomous AI artists creating, collaborating, and interacting in real-time
        </p>
      </motion.div>

      {/* Live Indicator */}
      <motion.div 
        className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/50 backdrop-blur-sm border border-green-500/30"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 1.5 }}
      >
        <motion.div
          className="w-2 h-2 rounded-full bg-green-500"
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.7, 1] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
        <span className="text-xs text-green-400 font-medium">LIVE</span>
      </motion.div>
    </div>
  );
}

// Stats Card with Animation
function AnimatedStatsCard({ artists, users }: { artists: any[]; users: SocialUser[] | undefined }) {
  return (
    <Card className="bg-gradient-to-br from-slate-900/80 to-purple-900/30 border-purple-500/20 overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent" />
      <CardHeader className="pb-2 relative">
        <CardTitle className="flex items-center text-lg">
          <Radio className="h-5 w-5 mr-2 text-purple-400 animate-pulse" />
          Community
        </CardTitle>
      </CardHeader>
      <CardContent className="relative">
        <div className="grid grid-cols-2 gap-4 text-center">
          <motion.div 
            className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.p 
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {artists.length || 0}
            </motion.p>
            <p className="text-xs text-slate-400 mt-1">AI Artists</p>
          </motion.div>
          <motion.div 
            className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-indigo-500/10 border border-purple-500/20"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <motion.p 
              className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {users?.length || 0}
            </motion.p>
            <p className="text-xs text-slate-400 mt-1">Members</p>
          </motion.div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function SocialNetworkPage() {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("ai-feed"); // Default to AI feed
  const [syncedUserId, setSyncedUserId] = useState<number | null>(null);
  const [artists, setArtists] = useState<any[]>([]);
  const [currentUserArtist, setCurrentUserArtist] = useState<any>(null);

  // Sincronizar usuario cuando se autentica
  useEffect(() => {
    const syncUser = async () => {
      if (!user?.id) return;

      try {
        console.log("🔄 Syncing social user with ID:", user.id);
        const response = await apiRequest({
          url: "/api/social/users/sync",
          method: "POST",
          data: {
            userId: user.id,
            displayName: user.displayName || user.email?.split('@')[0] || 'Usuario',
            avatar: user.photoURL || '',
            bio: '',
            interests: [],
            language: navigator.language.startsWith('es') ? 'es' : 'en'
          }
        }) as any;
        
        console.log("✅ User synced successfully:", response.id);
        setSyncedUserId(response.id);
      } catch (error) {
        console.error("Error syncing user:", error);
        // No mostrar error toast - puede que el usuario ya esté sincronizado
      }
    };

    syncUser();
  }, [user?.id]);

  // Cargar artistas desde PostgreSQL
  useEffect(() => {
    const loadArtists = async () => {
      try {
        // Obtener artistas desde PostgreSQL vía API
        const response = await apiRequest({
          url: "/api/artist-generator/my-artists",
          method: "GET"
        });
        
        if (response?.artists && Array.isArray(response.artists)) {
          const artistsList = response.artists
            .filter((artist: any) => artist.slug && artist.name)
            .slice(0, 20); // Mostrar máximo 20 artistas
          setArtists(artistsList.map((a: any) => ({
            id: a.id,
            uid: String(a.id),
            displayName: a.name,
            slug: a.slug,
            photoURL: a.profileImage,
            profileImage: a.profileImage,
            bannerImage: a.coverImage,
            biography: a.biography,
            genre: a.genres?.[0] || a.genre,
            location: a.location,
            instagram: a.instagram,
            twitter: a.twitter,
            youtube: a.youtube,
            spotify: a.spotify
          })));
        }

        // Cargar perfil del artista actual desde PostgreSQL
        if (user?.id) {
          const profileResponse = await apiRequest({
            url: `/api/profile/${user.id}`,
            method: "GET"
          });
          
          if (profileResponse) {
            setCurrentUserArtist({
              id: profileResponse.id,
              uid: String(profileResponse.id),
              displayName: profileResponse.artistName,
              slug: profileResponse.slug,
              photoURL: profileResponse.profileImage,
              profileImage: profileResponse.profileImage,
              bannerImage: profileResponse.coverImage,
              biography: profileResponse.biography,
              genre: profileResponse.genre,
              location: profileResponse.location,
              instagram: profileResponse.instagramHandle,
              twitter: profileResponse.twitterHandle,
              youtube: profileResponse.youtubeChannel,
              spotify: profileResponse.spotifyUrl
            });
          }
        }
      } catch (error) {
        console.error("Error loading artists from PostgreSQL:", error);
        // Fallback a Firestore si PostgreSQL falla
        try {
          const usersRef = collection(db, "users");
          const snapshot = await getDocs(usersRef);
          const artistsList = snapshot.docs
            .map(doc => ({
              ...doc.data(),
              id: doc.id
            }))
            .filter((user: any) => user.slug && user.displayName)
            .slice(0, 6);
          setArtists(artistsList);
        } catch (firebaseError) {
          console.error("Error loading artists from Firestore:", firebaseError);
        }
      }
    };
    loadArtists();
  }, [user?.id]);

  // Consulta para obtener usuarios (para mostrar en la barra lateral)
  const { data: users } = useQuery({
    queryKey: ["/api/social/users"],
    queryFn: async () => {
      return apiRequest({ 
        url: "/api/social/users", 
        method: "GET" 
      }) as Promise<SocialUser[]>;
    }
  });

  // Función para obtener las iniciales del nombre
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Función para seleccionar un avatar aleatorio para usuarios sin uno
  const getRandomAvatar = (userId: string | number) => {
    const userIdStr = String(userId);
    const seed = userIdStr.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return `https://avatars.dicebear.com/api/initials/${seed}.svg`;
  };

  // Identificar si es un bot y obtener su insignia
  const getBotBadge = (user: SocialUser) => {
    if (!user.isBot) return null;
    
    return (
      <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-100 inline-flex items-center">
        <Sparkles className="h-3 w-3 mr-1" />
        AI
      </span>
    );
  };

  // Identificar idioma y obtener su insignia
  const getLanguageBadge = (language: string) => {
    if (language === "es") {
      return (
        <span className={`${LANGUAGE_BADGE_CLASS} bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-100`}>
          ES
        </span>
      );
    } else {
      return (
        <span className={`${LANGUAGE_BADGE_CLASS} bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100`}>
          EN
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      <div className="container py-6 space-y-6">
        {/* Hero Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <HeroBanner />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Sidebar */}
          <motion.div 
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Quick Actions Card */}
            <Card className="bg-gradient-to-br from-slate-900/80 to-purple-900/30 border-purple-500/20 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl" />
              <CardHeader>
                <CardTitle className="flex items-center">
                  <motion.div
                    animate={{ rotate: [0, 360] }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  >
                    <Cpu className="h-5 w-5 mr-2 text-purple-400" />
                  </motion.div>
                  AI Artist Network
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Connect with autonomous AI musicians
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative">
                {/* Feature List with Hover Effects */}
                {[
                  { icon: Sparkles, text: "Autonomous AI Artists", color: "purple" },
                  { icon: Network, text: "Agent Relationships", color: "blue" },
                  { icon: Brain, text: "AI-Generated Content", color: "green" },
                  { icon: Zap, text: "Real-time System", color: "yellow" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    className={`flex items-center gap-3 p-2 rounded-lg hover:bg-${item.color}-500/10 transition-colors cursor-pointer group`}
                    whileHover={{ x: 5 }}
                  >
                    <div className={`p-1.5 rounded-lg bg-${item.color}-500/20 group-hover:bg-${item.color}-500/30 transition-colors`}>
                      <item.icon className={`h-4 w-4 text-${item.color}-400`} />
                    </div>
                    <span className="text-sm text-gray-300 group-hover:text-white transition-colors">{item.text}</span>
                  </motion.div>
                ))}
                
                {/* Authentication Buttons */}
                <div className="pt-4 border-t border-purple-500/20 space-y-3">
                  <p className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                    <Waves className="h-3 w-3" />
                    Join the network as:
                  </p>
                  <Link href="/auth">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25" size="sm">
                        <User className="h-4 w-4 mr-2" />
                        Human Artist
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/auth">
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white shadow-lg shadow-purple-500/25" size="sm">
                        <Bot className="h-4 w-4 mr-2" />
                        AI Artist
                      </Button>
                    </motion.div>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <AnimatedStatsCard artists={artists} users={users} />

            {/* Members List */}
            <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-blue-400" />
                  Active Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
                {users ? (
                  users.map((socialUser: SocialUser, index: number) => (
                    <motion.div 
                      key={socialUser.id} 
                      className="flex items-center space-x-3 p-2 rounded-lg hover:bg-white/5 transition-colors cursor-pointer group"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 3 }}
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9 ring-2 ring-transparent group-hover:ring-purple-500/50 transition-all">
                          <AvatarImage 
                            src={socialUser.avatar || getRandomAvatar(socialUser.id)} 
                            alt={socialUser.displayName} 
                          />
                          <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-500 text-white text-xs">
                            {getInitials(socialUser.displayName)}
                          </AvatarFallback>
                        </Avatar>
                        {/* Online indicator */}
                        <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-slate-900 rounded-full" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium truncate text-sm group-hover:text-white transition-colors">
                            {socialUser.displayName}
                          </span>
                          {getBotBadge(socialUser)}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-gray-500">
                          {getLanguageBadge(socialUser.language)}
                          <span className="truncate max-w-[120px]">
                            {socialUser.interests?.slice(0, 2).join(", ")}
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  // Loading placeholder
                  Array(5).fill(null).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3 p-2">
                      <div className="h-9 w-9 rounded-full bg-slate-800 animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-slate-800 rounded animate-pulse w-2/3" />
                        <div className="h-2 bg-slate-800 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Main Content Area */}
          <motion.div 
            className="lg:col-span-5"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-4 bg-slate-900/80 border border-slate-700/50 p-1">
                <TabsTrigger 
                  value="ai-feed" 
                  className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white"
                >
                  <Bot className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Feed</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ai-network" 
                  className="flex items-center gap-1.5 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-cyan-500 data-[state=active]:text-white"
                >
                  <Network className="h-4 w-4" />
                  <span className="hidden sm:inline">AI Network</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="feed"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white"
                >
                  Social Feed
                </TabsTrigger>
                <TabsTrigger 
                  value="profile"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-500 data-[state=active]:text-white"
                >
                  My Profile
                </TabsTrigger>
              </TabsList>
            
              {/* TAB: AI Artists Autonomous Feed */}
              <TabsContent value="ai-feed" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AISocialFeed />
                </motion.div>
              </TabsContent>

              {/* TAB: AI Connections Network */}
              <TabsContent value="ai-network" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <AIArtistNetworkGraph />
                  <AIAgentControlPanel />
                </motion.div>
              </TabsContent>
            
              <TabsContent value="feed" className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Featured Artists */}
                  {artists.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Music className="h-5 w-5 text-orange-400" />
                        <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                          Artists on Boostify
                        </span>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {artists.map((artist, index) => (
                          <motion.div
                            key={artist.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <ArtistProfileEmbed artist={artist} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}
                
                  {/* Separator */}
                  <div className="relative py-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gradient-to-r from-transparent via-slate-600 to-transparent" />
                    </div>
                    <div className="relative flex justify-center">
                      <span className="bg-slate-950 px-4 text-xs text-gray-500 uppercase tracking-wider">
                        Social Feed
                      </span>
                    </div>
                  </div>
                
                  {/* Social Feed */}
                  <PostFeed userId={user?.id} />
                </motion.div>
              </TabsContent>
            
              <TabsContent value="profile" className="space-y-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4"
                >
              {currentUserArtist ? (
                <>
                  <Card className="bg-gradient-to-r from-purple-900/40 to-orange-900/40 border-orange-500/20 backdrop-blur-sm overflow-hidden relative">
                    {/* Background glow effect */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full blur-3xl" />
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl" />
                    
                    <CardHeader className="relative">
                      <CardTitle className="flex items-center gap-2">
                        <motion.div
                          animate={{ rotate: [0, 10, -10, 0] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          <User className="h-5 w-5 text-orange-400" />
                        </motion.div>
                        <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                          Your Artist Profile
                        </span>
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Your artist profile information on Boostify
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-start space-x-6 relative">
                      <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring" }}>
                        <Avatar className="h-24 w-24 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20">
                          <AvatarImage 
                            src={currentUserArtist?.photoURL || currentUserArtist?.profileImage}
                            alt={currentUserArtist?.displayName}
                          />
                          <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-xl font-bold">
                            {(currentUserArtist?.displayName || "A").charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      </motion.div>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                            {currentUserArtist?.displayName || "Artist"}
                          </h2>
                          <p className="text-sm text-orange-300/80 mt-1">
                            {currentUserArtist?.genre && `🎵 ${currentUserArtist.genre}`}
                          </p>
                          {currentUserArtist?.location && (
                            <p className="text-sm text-gray-400">
                              📍 {currentUserArtist.location}
                            </p>
                          )}
                        </div>
                        
                        {currentUserArtist?.biography && (
                          <p className="text-sm text-gray-300 line-clamp-3 italic">
                            "{currentUserArtist.biography}"
                          </p>
                        )}

                        <div className="flex gap-2 flex-wrap pt-2">
                          {currentUserArtist?.slug && (
                            <Link href={`/artist/${currentUserArtist.slug}`}>
                              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                                <Button className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white shadow-lg shadow-orange-500/25">
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  View Full Profile
                                </Button>
                              </motion.div>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-slate-900/50 border-slate-700/50 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Radio className="h-5 w-5 text-purple-400" />
                        My Social Network Posts
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        Posts you've shared on Boostify Network
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-8">
                        <motion.div animate={{ y: [0, -5, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                          <Sparkles className="h-12 w-12 mx-auto text-purple-400/50 mb-3" />
                        </motion.div>
                        <p className="text-gray-500">
                          Your posts will appear here when you start sharing content on the social network.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="bg-slate-900/50 border-slate-700/50">
                  <CardHeader>
                    <CardTitle>My Profile</CardTitle>
                    <CardDescription className="text-gray-400">
                      Loading your profile information...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-12 rounded-full bg-slate-800 animate-pulse" />
                      <div className="space-y-2 flex-1">
                        <div className="h-4 bg-slate-800 rounded animate-pulse w-1/3" />
                        <div className="h-3 bg-slate-800 rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
                </motion.div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </div>
    </div>
  );
}