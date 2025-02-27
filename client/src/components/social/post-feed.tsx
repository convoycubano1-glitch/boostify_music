import React, { useState } from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send } from "lucide-react";
import { PostCard } from "./post-card";
import { MusicLoadingSpinner } from "@/components/ui/music-loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useQuery, useMutation } from "@tanstack/react-query";

export function PostFeed() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPostContent, setNewPostContent] = useState("");

  // Consulta de posts
  const postsQuery = useQuery({
    queryKey: ["/api/social/posts"],
    queryFn: async () => {
      const response = await fetch("/api/social/posts");
      if (!response.ok) {
        throw new Error("Error al cargar las publicaciones");
      }
      return response.json();
    },
  });

  // Mutación para crear nuevo post
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch("/api/social/posts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error("Error al crear la publicación");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setNewPostContent("");
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({
        title: "¡Publicación creada!",
        description: "Tu publicación se ha creado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo crear la publicación",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    
    createPostMutation.mutate(newPostContent);
  };

  if (postsQuery.isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <MusicLoadingSpinner />
      </div>
    );
  }

  if (postsQuery.isError) {
    return (
      <Card className="p-6 text-center">
        <p className="text-destructive mb-4">
          Error al cargar las publicaciones. Por favor, intenta de nuevo más tarde.
        </p>
        <Button onClick={() => postsQuery.refetch()}>
          Reintentar
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Formulario para crear nueva publicación */}
      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmitPost}>
            <Textarea
              placeholder="Comparte tus pensamientos sobre música, arte o lo que te inspire..."
              className="min-h-24 resize-none mb-3"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
            />
            <CardFooter className="px-0 pt-0 pb-0 flex justify-between">
              <div className="text-xs text-muted-foreground">
                Las respuestas utilizan IA para generar interacciones similares a la vida real
              </div>
              <Button
                type="submit"
                disabled={!newPostContent.trim() || createPostMutation.isPending}
                className="ml-auto"
              >
                {createPostMutation.isPending ? (
                  <MusicLoadingSpinner size="sm" className="mr-2" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                Publicar
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>

      {/* Lista de publicaciones */}
      <div className="space-y-4">
        {postsQuery.data && postsQuery.data.length > 0 ? (
          postsQuery.data.map((post: any) => (
            <PostCard key={post.id} post={post} />
          ))
        ) : (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground">
              No hay publicaciones disponibles. ¡Sé el primero en publicar algo!
            </p>
          </Card>
        )}
      </div>

      {/* Botón para cargar más posts (simulación) */}
      <div className="text-center mt-6">
        <Button variant="outline" className="w-full">
          Cargar más publicaciones
        </Button>
      </div>
    </div>
  );
}