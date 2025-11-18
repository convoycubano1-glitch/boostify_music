import React, { useState } from "react";
import { logger } from "@/lib/logger";
import { PostCard } from "./post-card";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Card, CardContent, CardHeader } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { CircularProgress } from "../ui/circular-progress";
import { Skeleton } from "../ui/skeleton";
import { useToast } from "../../hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../hooks/use-auth";
import { apiRequest } from "../../lib/queryClient";
import { Post, CreatePostRequest } from "../../lib/social/types";

export function PostFeed() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { user } = useAuth() || {};
  const [newPostContent, setNewPostContent] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  // Consulta para obtener los posts
  const { data: posts, isLoading, error } = useQuery({
    queryKey: ["/api/social/posts"],
    queryFn: async () => {
      return apiRequest({ 
        url: "/api/social/posts", 
        method: "GET" 
      }) as Promise<Post[]>;
    }
  });

  // Mutación para crear un nuevo post
  const createPostMutation = useMutation({
    mutationFn: async (newPost: CreatePostRequest) => {
      return apiRequest({ 
        url: "/api/social/posts", 
        method: "POST", 
        data: newPost 
      }) as Promise<Post>;
    },
    onSuccess: () => {
      setNewPostContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({
        title: "Publicación creada",
        description: "Tu publicación se ha compartido correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la publicación",
        variant: "destructive",
      });
      logger.error(error);
    },
  });

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    
    createPostMutation.mutate({
      content: newPostContent
    });
  };

  // Filtrar posts según la pestaña activa
  const filteredPosts = React.useMemo(() => {
    if (!posts) return [];
    
    switch (activeTab) {
      case "spanish":
        // Filtrar posts en español (simple heurística)
        return posts.filter(post => {
          const content = post.content.toLowerCase();
          return content.includes("¿") || 
                 content.includes("á") || 
                 content.includes("é") || 
                 content.includes("í") || 
                 content.includes("ó") || 
                 content.includes("ú") || 
                 content.startsWith("¡");
        });
      case "english":
        // Filtrar posts que probablemente estén en inglés
        return posts.filter(post => {
          const content = post.content.toLowerCase();
          return !content.includes("¿") && 
                 !content.includes("á") && 
                 !content.includes("é") && 
                 !content.includes("í") && 
                 !content.includes("ó") && 
                 !content.includes("ú") && 
                 !content.startsWith("¡");
        });
      case "ai":
        // Filtrar posts creados por bots de IA
        return posts.filter(post => post.user?.isBot);
      case "trending":
        // Posts con más likes o comentarios
        return [...posts].sort((a, b) => {
          const aScore = (a.likes || 0) + (a.comments?.length || 0);
          const bScore = (b.likes || 0) + (b.comments?.length || 0);
          return bScore - aScore;
        }).slice(0, 5);
      default:
        return posts;
    }
  }, [posts, activeTab]);

  if (error) {
    return (
      <Card className="border-red-300 dark:border-red-800">
        <CardContent className="p-6 text-center">
          <p className="text-red-500 mb-4">Error al cargar las publicaciones</p>
          <Button 
            onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] })}
            variant="outline"
          >
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Formulario para nueva publicación */}
      <Card>
        <CardHeader className="pb-3">
          <h3 className="text-lg font-semibold">Crear nueva publicación</h3>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmitPost} className="space-y-4">
            <div className="flex space-x-3">
              <Avatar className="h-10 w-10">
                <AvatarFallback>
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <Textarea
                placeholder="¿Qué estás pensando? / What are you thinking about?"
                className="flex-1 resize-none"
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
              />
            </div>
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={!newPostContent.trim() || createPostMutation.isPending}
              >
                {createPostMutation.isPending ? "Publicando..." : "Publicar"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tabs para filtrar publicaciones */}
      <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-5 mb-4">
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="spanish">Español</TabsTrigger>
          <TabsTrigger value="english">English</TabsTrigger>
          <TabsTrigger value="ai">AI</TabsTrigger>
          <TabsTrigger value="trending">Trending</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-6">
          {isLoading ? (
            // Esqueletos para estado de carga
            Array(3).fill(null).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-3 flex space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </CardContent>
              </Card>
            ))
          ) : filteredPosts.length > 0 ? (
            filteredPosts.map((post) => <PostCard key={post.id} post={post} />)
          ) : (
            <Card className="overflow-hidden">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No hay publicaciones disponibles</p>
                <p className="text-sm mt-2">¡Sé el primero en publicar algo!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Indicador de carga de posts */}
      {posts && posts.length > 0 && (
        <div className="text-center text-sm text-muted-foreground py-2">
          Mostrando {filteredPosts.length} de {posts.length} publicaciones
        </div>
      )}
    </div>
  );
}