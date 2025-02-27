import React, { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Users, Music, Globe, Settings, Bell, MessageSquare, TrendingUp } from "lucide-react";
import { PostFeed } from "@/components/social/post-feed";
import { useQuery } from "@tanstack/react-query";

export default function SocialNetworkPage() {
  const [activeTab, setActiveTab] = useState("feed");

  // Consulta para obtener usuarios
  const usersQuery = useQuery({
    queryKey: ["/api/social/users"],
    queryFn: async () => {
      const response = await fetch("/api/social/users");
      if (!response.ok) {
        throw new Error("Error al cargar usuarios");
      }
      return response.json();
    },
  });

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="container py-8">
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-y-0 lg:space-x-8">
        {/* Sidebar */}
        <div className="lg:w-1/4">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Tu Comunidad</CardTitle>
              <CardDescription>Conecta con otros artistas y profesionales de la música</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-sm font-medium mb-3">Navegación</h3>
                <div className="space-y-2">
                  <Button 
                    variant={activeTab === "feed" ? "default" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("feed")}
                  >
                    <Globe className="mr-2 h-4 w-4" />
                    Feed Principal
                  </Button>
                  <Button 
                    variant={activeTab === "trending" ? "default" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("trending")}
                  >
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Tendencias
                  </Button>
                  <Button 
                    variant={activeTab === "artists" ? "default" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("artists")}
                  >
                    <Music className="mr-2 h-4 w-4" />
                    Artistas
                  </Button>
                  <Button 
                    variant={activeTab === "messages" ? "default" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("messages")}
                  >
                    <MessageSquare className="mr-2 h-4 w-4" />
                    Mensajes
                  </Button>
                  <Button 
                    variant={activeTab === "notifications" ? "default" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("notifications")}
                  >
                    <Bell className="mr-2 h-4 w-4" />
                    Notificaciones
                  </Button>
                  <Button 
                    variant={activeTab === "settings" ? "default" : "ghost"} 
                    className="w-full justify-start"
                    onClick={() => setActiveTab("settings")}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Configuración
                  </Button>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3 flex items-center">
                  <Users className="mr-2 h-4 w-4" />
                  Usuarios Sugeridos
                </h3>
                
                <div className="space-y-3">
                  {usersQuery.isLoading ? (
                    <p className="text-muted-foreground text-sm">Cargando usuarios...</p>
                  ) : usersQuery.isError ? (
                    <p className="text-muted-foreground text-sm">Error al cargar usuarios</p>
                  ) : (
                    usersQuery.data?.slice(0, 5).map((user: any) => (
                      <div key={user.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar || undefined} alt={user.displayName} />
                            <AvatarFallback>{getInitials(user.displayName)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{user.displayName}</p>
                            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
                              {user.isBot ? "Asistente AI" : "Usuario"}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          Seguir
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-sm font-medium mb-3">Temas Populares</h3>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary">#MúsicaIndependiente</Badge>
                  <Badge variant="secondary">#ProducciónMusical</Badge>
                  <Badge variant="secondary">#Boostify</Badge>
                  <Badge variant="secondary">#ÉxitoMusical</Badge>
                  <Badge variant="secondary">#MarketingMusical</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:w-1/2">
          {activeTab === "feed" && (
            <div>
              <Card className="mb-6">
                <CardHeader className="pb-3">
                  <CardTitle>Feed Social de Boostify</CardTitle>
                  <CardDescription>
                    Conéctate con otros artistas, productores y profesionales de la industria musical
                  </CardDescription>
                </CardHeader>
              </Card>
              
              <PostFeed />
            </div>
          )}

          {activeTab === "trending" && (
            <Card>
              <CardHeader>
                <CardTitle>Tendencias</CardTitle>
                <CardDescription>Descubre lo que está siendo tendencia en la comunidad musical</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Próximamente: Contenido de tendencias</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "artists" && (
            <Card>
              <CardHeader>
                <CardTitle>Artistas</CardTitle>
                <CardDescription>Descubre y conecta con artistas de tu género musical</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Próximamente: Directorio de artistas</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "messages" && (
            <Card>
              <CardHeader>
                <CardTitle>Mensajes</CardTitle>
                <CardDescription>Tus conversaciones con otros usuarios</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Próximamente: Sistema de mensajería</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "notifications" && (
            <Card>
              <CardHeader>
                <CardTitle>Notificaciones</CardTitle>
                <CardDescription>Mantente al día con la actividad de tu red</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Próximamente: Centro de notificaciones</p>
              </CardContent>
            </Card>
          )}

          {activeTab === "settings" && (
            <Card>
              <CardHeader>
                <CardTitle>Configuración</CardTitle>
                <CardDescription>Personaliza tu experiencia en la red social</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Próximamente: Ajustes de la red social</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="lg:w-1/4">
          <Card className="sticky top-20">
            <CardHeader>
              <CardTitle>Recursos Musicales</CardTitle>
              <CardDescription>Herramientas y recursos para artistas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Boostify Pro Tools</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Accede a herramientas profesionales de producción y marketing musical
                </p>
                <Button variant="default" className="w-full">
                  Explorar Herramientas
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Conecta tu Spotify</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Comparte tu música y obtén análisis avanzados
                </p>
                <Button variant="outline" className="w-full">
                  Conectar Cuenta
                </Button>
              </div>
              
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Cursos de Educación Musical</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Mejora tus habilidades con cursos certificados
                </p>
                <Button variant="outline" className="w-full">
                  Ver Cursos
                </Button>
              </div>
              
              <div className="text-xs text-center text-muted-foreground pt-4">
                <p>© 2025 Boostify Social Network</p>
                <p className="mt-1">Todos los derechos reservados</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}