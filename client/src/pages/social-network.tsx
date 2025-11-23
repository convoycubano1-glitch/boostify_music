import React, { useEffect } from "react";
import { PostFeed } from "../components/social/post-feed";
import { ArtistProfileEmbed } from "../components/social/artist-profile-embed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "../lib/queryClient";
import { useAuth } from "../hooks/use-auth";
import { SocialUser } from "../lib/social/types";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { BadgeInfo, Globe, Users, User, MessageSquare, Sparkles, BookMarked, Music, ExternalLink, Star, DollarSign, Send, X } from "lucide-react";
import { Link } from "wouter";
import { Button } from "../components/ui/button";
import { useToast } from "../hooks/use-toast";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import { Badge } from "../components/ui/badge";
import { BookingDialog } from "../components/booking/booking-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { ScrollArea } from "../components/ui/scroll-area";
import { apiRequest } from "../lib/queryClient";
import { ServiceRequestForm, ServiceRequestList } from "../components/services/ServiceRequestForm";
import { Briefcase } from "lucide-react";

// Constantes que nos ahorraremos de repetir
const LANGUAGE_BADGE_CLASS = "px-2 py-0.5 rounded-full text-xs inline-flex items-center";
const INFO_GROUP_CLASS = "flex items-center gap-2 text-muted-foreground text-sm";

interface Musician {
  id: string;
  title: string;
  photo: string;
  instrument: string;
  category: string;
  description: string;
  price: number;
  rating: number;
  totalReviews: number;
  genres?: string[];
}

interface DirectMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  isRead: boolean;
  createdAt: string;
}

interface Conversation {
  userId: number;
  user: any;
  lastMessage: DirectMessage;
  unreadCount: number;
  messageCount: number;
}

export default function SocialNetworkPage() {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  const [activeTab, setActiveTab] = React.useState("feed");
  const [syncedUserId, setSyncedUserId] = React.useState<number | null>(null);
  const [artists, setArtists] = React.useState<any[]>([]);
  const [currentUserArtist, setCurrentUserArtist] = React.useState<any>(null);
  const [musicians, setMusicians] = React.useState<Musician[]>([]);
  const [isLoadingMusicians, setIsLoadingMusicians] = React.useState(false);
  const [showMessagesModal, setShowMessagesModal] = React.useState(false);
  const [conversations, setConversations] = React.useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = React.useState<number | null>(null);
  const [messages, setMessages] = React.useState<DirectMessage[]>([]);
  const [messageInput, setMessageInput] = React.useState("");
  const [isLoadingMessages, setIsLoadingMessages] = React.useState(false);

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

  // Cargar artistas desde Firestore y datos del artista actual
  useEffect(() => {
    const loadArtists = async () => {
      try {
        const usersRef = collection(db, "users");
        const snapshot = await getDocs(usersRef);
        const artistsList = snapshot.docs
          .map(doc => ({
            ...doc.data(),
            id: doc.id
          }))
          .filter((user: any) => user.slug && user.displayName)
          .slice(0, 6); // Mostrar máximo 6 artistas
        setArtists(artistsList);

        // Buscar el perfil del artista del usuario actual
        if (user?.id) {
          const q = query(usersRef, where("uid", "==", String(user.id)));
          const userSnapshot = await getDocs(q);
          if (userSnapshot.docs.length > 0) {
            setCurrentUserArtist({
              ...userSnapshot.docs[0].data(),
              id: userSnapshot.docs[0].id
            });
          }
        }
      } catch (error) {
        console.error("Error loading artists:", error);
      }
    };
    loadArtists();
  }, [user?.id]);

  // Cargar músicos desde Firestore
  useEffect(() => {
    const loadMusicians = async () => {
      try {
        setIsLoadingMusicians(true);
        const musiciansRef = collection(db, "musicians");
        const snapshot = await getDocs(musiciansRef);
        const musiciansList: Musician[] = [];

        snapshot.forEach(doc => {
          const data = doc.data();
          musiciansList.push({
            id: `firestore-${doc.id}`,
            title: data.name || data.title,
            photo: data.photo || data.photoURL,
            instrument: data.instrument,
            category: data.category,
            description: data.description,
            price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
            rating: typeof data.rating === 'string' ? parseFloat(data.rating) : data.rating,
            totalReviews: data.totalReviews || 0,
            genres: data.genres || []
          });
        });

        // Also load from musician_images collection
        const imagesRef = collection(db, "musician_images");
        const imagesSnapshot = await getDocs(imagesRef);
        imagesSnapshot.forEach(doc => {
          const data = doc.data();
          musiciansList.push({
            id: `firestore-img-${doc.id}`,
            title: data.category || "Reference Musician",
            photo: data.url,
            instrument: data.category || "Various",
            category: data.category || "Other",
            description: data.prompt || "Reference musician from Firestore",
            price: 150,
            rating: 4.5,
            totalReviews: 10,
            genres: [data.category || "Various"]
          });
        });

        setMusicians(musiciansList);
      } catch (error) {
        console.error("Error loading musicians:", error);
      } finally {
        setIsLoadingMusicians(false);
      }
    };

    loadMusicians();
  }, []);

  // Cargar conversaciones cuando se abre modal de mensajes
  const loadConversations = React.useCallback(async () => {
    if (!syncedUserId) return;
    try {
      const data = await apiRequest({
        url: `/api/social/messages/${syncedUserId}`,
        method: "GET"
      }) as Conversation[];
      setConversations(data);
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, [syncedUserId]);

  // Cargar mensajes de una conversación
  const loadMessages = React.useCallback(async (otherUserId: number) => {
    if (!syncedUserId) return;
    try {
      setIsLoadingMessages(true);
      const data = await apiRequest({
        url: `/api/social/messages/${syncedUserId}/${otherUserId}`,
        method: "GET"
      }) as DirectMessage[];
      setMessages(data);
      
      // Marcar como leídos
      await apiRequest({
        url: `/api/social/messages/${syncedUserId}/read`,
        method: "PUT",
        data: { otherUserId }
      });
    } catch (error) {
      console.error("Error loading messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [syncedUserId]);

  // Enviar mensaje
  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedConversation || !syncedUserId) return;
    
    try {
      await apiRequest({
        url: "/api/social/messages",
        method: "POST",
        data: {
          senderId: syncedUserId,
          receiverId: selectedConversation,
          content: messageInput
        }
      });
      setMessageInput("");
      await loadMessages(selectedConversation);
      await loadConversations();
    } catch (error) {
      toast({ title: "Error", description: "Failed to send message", variant: "destructive" });
    }
  };

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
            {/* Tarjeta de información sobre la red social */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Globe className="h-5 w-5 mr-2" />
                  BoostifyNetwork
                </CardTitle>
                <CardDescription>
                  Red social bilingüe para profesionales de la música
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={INFO_GROUP_CLASS}>
                  <Users className="h-4 w-4" />
                  <span>{users?.length || 0} Miembros activos</span>
                </div>
                <div className={INFO_GROUP_CLASS}>
                  <MessageSquare className="h-4 w-4" />
                  <span>Soporte para español e inglés</span>
                </div>
                <div className={INFO_GROUP_CLASS}>
                  <Sparkles className="h-4 w-4" />
                  <span>Asistentes IA integrados</span>
                </div>
                <div className={INFO_GROUP_CLASS}>
                  <BadgeInfo className="h-4 w-4" />
                  <span>Conversaciones contextualizadas</span>
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

            {/* Enlaces útiles */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <BookMarked className="h-5 w-5 mr-2" />
                  Enlaces
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link href="/education">Cursos educativos</Link>
                </Button>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link href="/record-label-services">Servicios de producción</Link>
                </Button>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link href="/artist-dashboard">Dashboard de artista</Link>
                </Button>
                <Button variant="link" className="p-0 h-auto" asChild>
                  <Link href="/manager-tools">Herramientas de management</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Área principal de contenido */}
        <div className="md:col-span-5">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="feed">Feed Social</TabsTrigger>
              <TabsTrigger value="profile">Mi Perfil</TabsTrigger>
            </TabsList>
            
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

              {/* Músicos Disponibles */}
              {musicians.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Music className="h-5 w-5 text-orange-400" />
                    Músicos para Colaborar
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {musicians.slice(0, 4).map((musician) => (
                      <Card key={musician.id} className="overflow-hidden backdrop-blur-sm bg-background/80 border border-orange-500/10 shadow-lg hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 group">
                        <div className="h-40 bg-orange-500/10 relative overflow-hidden">
                          <img
                            src={musician.photo || "/assets/musician-placeholder.jpg"}
                            alt={musician.title}
                            className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                          />
                          <div className="absolute top-3 right-3 z-10">
                            <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-orange-500/20 text-white px-2.5 py-1">
                              {musician.instrument}
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold group-hover:text-orange-500 transition-colors line-clamp-1">{musician.title}</h3>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 text-orange-500 fill-orange-500" />
                              <span className="text-xs font-medium">{musician.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <p className="text-muted-foreground mb-2 line-clamp-2 text-xs">{musician.description}</p>
                          <div className="flex justify-between items-center mb-3 text-xs">
                            <div className="text-muted-foreground">
                              {musician.totalReviews} reseñas
                            </div>
                            <div className="flex items-center gap-1 font-semibold text-orange-500">
                              <DollarSign className="h-3 w-3" />
                              ${musician.price}
                            </div>
                          </div>
                          <Button
                            className="w-full bg-orange-500 hover:bg-orange-600 shadow-md hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300 h-8 text-xs"
                            asChild
                          >
                            <BookingDialog musician={musician as any} />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                  {musicians.length > 4 && (
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/producer-tools">Ver todos los músicos →</Link>
                    </Button>
                  )}
                </div>
              )}
              
              {/* Separator */}
              <div className="border-t border-slate-700 my-6" />

              {/* Service Requests */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-orange-400" />
                    Solicitudes de Servicios
                  </h3>
                  {syncedUserId && (
                    <ServiceRequestForm 
                      clientId={syncedUserId}
                      onRequestCreated={() => {}}
                    />
                  )}
                </div>
                <ServiceRequestList filter="open" />
              </div>

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