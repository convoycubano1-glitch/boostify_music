import React from "react";
import { PostFeed } from "@/components/social/post-feed";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { SocialUser } from "@/lib/social/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeInfo, Globe, Users, User, MessageSquare, Sparkles, BookMarked } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

// Constantes que nos ahorraremos de repetir
const LANGUAGE_BADGE_CLASS = "px-2 py-0.5 rounded-full text-xs inline-flex items-center";
const INFO_GROUP_CLASS = "flex items-center gap-2 text-muted-foreground text-sm";

export default function SocialNetworkPage() {
  const { user } = useAuth() || {};
  const [activeTab, setActiveTab] = React.useState("feed");

  // Consulta para obtener usuarios (para mostrar en la barra lateral)
  const { data: users } = useQuery({
    queryKey: ["/api/social/users"],
    queryFn: async () => {
      return apiRequest<SocialUser[]>({ 
        url: "/api/social/users", 
        method: "GET" 
      });
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
  const getRandomAvatar = (userId: string) => {
    const seed = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
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
                  users.map((socialUser) => (
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
              <PostFeed />
            </TabsContent>
            
            <TabsContent value="profile" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <User className="h-5 w-5 mr-2" />
                    Mi Perfil
                  </CardTitle>
                  <CardDescription>
                    Información de tu perfil en la red social
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-lg">
                      {user?.email?.charAt(0).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="space-y-3">
                    <div>
                      <h3 className="text-lg font-semibold">
                        {user?.email?.split('@')[0] || "Usuario"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {user?.email || "usuario@ejemplo.com"}
                      </p>
                    </div>
                    <Button variant="outline" size="sm">Editar perfil</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mis publicaciones</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Aquí verás tus publicaciones cuando comiences a compartir contenido.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}