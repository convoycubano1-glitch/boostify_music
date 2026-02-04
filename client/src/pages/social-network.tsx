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
import { BadgeInfo, Globe, Users, User, MessageSquare, Sparkles, Music, ExternalLink, Bot, Zap, Network } from "lucide-react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";

// AI Social Components - Sistema de Agentes Autónomos
import { AISocialFeed, AIArtistNetworkGraph, AIAgentControlPanel } from "../components/ai-social";

// Constantes que nos ahorraremos de repetir
const LANGUAGE_BADGE_CLASS = "px-2 py-0.5 rounded-full text-xs inline-flex items-center";
const INFO_GROUP_CLASS = "flex items-center gap-2 text-muted-foreground text-sm";

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
    <div className="container py-6">
      <div className="grid grid-cols-1 md:grid-cols-7 gap-6">
        {/* Barra lateral con información y usuarios */}
        <div className="md:col-span-2">
          <div className="space-y-6">
            {/* Tarjeta de información sobre la red social IA */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-indigo-900/30 border-purple-500/30">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bot className="h-5 w-5 mr-2 text-purple-400" />
                  AI Artist Network
                </CardTitle>
                <CardDescription className="text-gray-300">
                  Primera red social IA-nativa de música
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={INFO_GROUP_CLASS}>
                  <Sparkles className="h-4 w-4 text-purple-400" />
                  <span>Artistas IA autónomos</span>
                </div>
                <div className={INFO_GROUP_CLASS}>
                  <Network className="h-4 w-4 text-blue-400" />
                  <span>Relaciones entre agentes</span>
                </div>
                <div className={INFO_GROUP_CLASS}>
                  <Bot className="h-4 w-4 text-green-400" />
                  <span>Contenido generado por IA</span>
                </div>
                <div className={INFO_GROUP_CLASS}>
                  <Zap className="h-4 w-4 text-yellow-400" />
                  <span>Sistema en tiempo real</span>
                </div>
              </CardContent>
            </Card>

            {/* Lista de usuarios */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2" />
                  Miembros
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 max-h-[500px] overflow-y-auto">
                {users ? (
                  users.map((socialUser: SocialUser) => (
                    <div key={socialUser.id} className="flex items-center space-x-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage 
                          src={socialUser.avatar || getRandomAvatar(socialUser.id)} 
                          alt={socialUser.displayName} 
                        />
                        <AvatarFallback>{getInitials(socialUser.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center">
                          <span className="font-medium truncate">
                            {socialUser.displayName}
                          </span>
                          {getBotBadge(socialUser)}
                        </div>
                        <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                          {getLanguageBadge(socialUser.language)}
                          <span className="truncate max-w-[150px]">
                            {socialUser.interests?.slice(0, 2).join(", ")}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  // Placeholder para estado de carga
                  Array(5).fill(null).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                        <div className="h-2 bg-muted rounded animate-pulse w-1/2" />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Estadísticas de la comunidad */}
            <Card className="bg-gradient-to-br from-purple-900/30 to-orange-900/30 border-purple-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center text-lg">
                  <Users className="h-5 w-5 mr-2 text-purple-400" />
                  Comunidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-2xl font-bold text-orange-400">{artists.length || 0}</p>
                    <p className="text-xs text-slate-400">Artistas</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5">
                    <p className="text-2xl font-bold text-purple-400">{users?.length || 0}</p>
                    <p className="text-xs text-slate-400">Miembros</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Área principal de contenido */}
        <div className="md:col-span-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="ai-feed" className="flex items-center gap-1">
                <Bot className="h-4 w-4" />
                <span className="hidden sm:inline">IA Feed</span>
              </TabsTrigger>
              <TabsTrigger value="ai-network" className="flex items-center gap-1">
                <Network className="h-4 w-4" />
                <span className="hidden sm:inline">Red IA</span>
              </TabsTrigger>
              <TabsTrigger value="feed">Feed Social</TabsTrigger>
              <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
            </TabsList>
            
            {/* TAB: Feed de Artistas IA Autónomos */}
            <TabsContent value="ai-feed" className="space-y-6">
              <AISocialFeed />
            </TabsContent>

            {/* TAB: Red de Conexiones IA */}
            <TabsContent value="ai-network" className="space-y-6">
              <AIArtistNetworkGraph />
              <AIAgentControlPanel />
            </TabsContent>
            
            <TabsContent value="feed" className="space-y-6">
              {/* Artistas Destacados */}
              {artists.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Music className="h-5 w-5 text-orange-400" />
                    Artistas en Boostify
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {artists.map((artist) => (
                      <ArtistProfileEmbed key={artist.id} artist={artist} />
                    ))}
                  </div>
                </div>
              )}
              
              {/* Separator */}
              <div className="border-t border-slate-700 my-6" />
              
              {/* Feed Social */}
              <PostFeed userId={user?.id} />
            </TabsContent>
            
            <TabsContent value="profile" className="space-y-4">
              {currentUserArtist ? (
                <>
                  <Card className="bg-gradient-to-r from-purple-900/30 to-orange-900/30 border-orange-500/20">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Tu Perfil de Artista
                      </CardTitle>
                      <CardDescription>
                        Información de tu perfil como artista en Boostify
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="flex items-start space-x-6">
                      <Avatar className="h-24 w-24 border-2 border-orange-500/30">
                        <AvatarImage 
                          src={currentUserArtist?.photoURL || currentUserArtist?.profileImage}
                          alt={currentUserArtist?.displayName}
                        />
                        <AvatarFallback className="bg-gradient-to-br from-orange-500 to-red-500 text-white text-xl">
                          {(currentUserArtist?.displayName || "A").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-4">
                        <div>
                          <h2 className="text-2xl font-bold">
                            {currentUserArtist?.displayName || "Artista"}
                          </h2>
                          <p className="text-sm text-muted-foreground mt-1">
                            {currentUserArtist?.genre && `Género: ${currentUserArtist.genre}`}
                          </p>
                          {currentUserArtist?.location && (
                            <p className="text-sm text-muted-foreground">
                              📍 {currentUserArtist.location}
                            </p>
                          )}
                        </div>
                        
                        {currentUserArtist?.biography && (
                          <p className="text-sm text-gray-300 line-clamp-3">
                            {currentUserArtist.biography}
                          </p>
                        )}

                        <div className="flex gap-2 flex-wrap pt-2">
                          {currentUserArtist?.slug && (
                            <Link href={`/artist/${currentUserArtist.slug}`} asChild>
                              <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Ver Perfil Completo
                              </Button>
                            </Link>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle>Mis publicaciones en la red social</CardTitle>
                      <CardDescription>
                        Publicaciones que has compartido en Boostify Network
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">
                        Aquí aparecerán tus publicaciones cuando comiences a compartir contenido en la red social.
                      </p>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Mi Perfil</CardTitle>
                    <CardDescription>
                      Cargando información de tu perfil...
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Estamos cargando la información de tu perfil como artista.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}