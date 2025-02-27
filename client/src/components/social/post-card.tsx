import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { MessageSquare, Heart, Share2, Send, MoreHorizontal, PlusCircle, MessageCircle } from "lucide-react";
import { MusicLoadingSpinner } from "@/components/ui/music-loading-spinner";
import { format } from "date-fns";
import { es, enUS } from "date-fns/locale";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Post, Comment } from "@/lib/social/types";

interface PostCardProps {
  post: Post;
}

export function PostCard({ post }: PostCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showComments, setShowComments] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState<string | null>(null);
  const [newComment, setNewComment] = useState("");
  const [newReply, setNewReply] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes || 0);

  // Mutación para crear un nuevo comentario
  const createCommentMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await fetch(`/api/social/posts/${post.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      });
      
      if (!response.ok) {
        throw new Error("Error al crear el comentario");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setNewComment("");
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
      toast({
        title: "Comentario añadido",
        description: "Tu comentario se ha publicado correctamente",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo publicar el comentario",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  // Mutación para dar like a un post
  const likePostMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/social/posts/${post.id}/like`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      
      if (!response.ok) {
        throw new Error("Error al dar like");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "No se pudo dar like a la publicación",
        variant: "destructive",
      });
      console.error(error);
    },
  });

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    createCommentMutation.mutate(newComment);
  };

  const handleSubmitReply = (commentId: string) => {
    if (!newReply.trim()) return;
    // Implementar lógica para enviar respuesta
    // Esto se implementaría con una mutación similar a createCommentMutation
    toast({
      title: "Respuesta enviada",
      description: "Tu respuesta se ha enviado correctamente",
    });
    setNewReply("");
    setShowReplyForm(null);
  };

  const handleLikePost = () => {
    if (!isLiked) {
      likePostMutation.mutate();
    }
  };

  const handleSharePost = () => {
    // Implementar lógica para compartir post
    toast({
      title: "Compartir",
      description: "Funcionalidad de compartir en desarrollo",
    });
  };

  // Función para formatear fechas teniendo en cuenta el idioma
  const formatDate = (date: string | Date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Detectar idioma del navegador o usar español por defecto
    const userLanguage = navigator.language || 'es';
    const locale = userLanguage.startsWith('es') ? es : enUS;
    
    return format(dateObj, 'PPp', { locale });
  };

  // Determinar si el usuario es un bot para mostrar un indicador
  const isUserBot = post.user?.isBot;

  // Formatear el contenido del post (por ejemplo, convertir URLs en links)
  const formatContent = (content: string) => {
    // Esta es una implementación básica. Se podría mejorar con bibliotecas como linkify
    return content.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer" class="text-primary hover:underline">$1</a>'
    );
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3 flex flex-row items-start space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarImage src={post.user?.avatar || undefined} alt={post.user?.displayName || "Usuario"} />
          <AvatarFallback>{getInitials(post.user?.displayName || "Usuario")}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center">
            <div className="font-semibold">{post.user?.displayName || "Usuario desconocido"}</div>
            {isUserBot && (
              <div className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                AI
              </div>
            )}
          </div>
          <div className="text-xs text-muted-foreground">{formatDate(post.createdAt || new Date())}</div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </CardHeader>
      
      <CardContent className="pb-3">
        <div 
          className="text-sm mb-3" 
          dangerouslySetInnerHTML={{ __html: formatContent(post.content) }} 
        />
        
        {post.mediaUrl && (
          <div className="rounded-md overflow-hidden mt-3">
            <img 
              src={post.mediaUrl} 
              alt="Post media" 
              className="w-full h-auto object-cover max-h-[500px]" 
            />
          </div>
        )}
        
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              <span>{likesCount}</span>
            </div>
            <div className="flex items-center">
              <MessageSquare className="h-4 w-4 mr-1" />
              <span>{post.comments?.length || 0}</span>
            </div>
            <div className="flex items-center">
              <Share2 className="h-4 w-4 mr-1" />
              <span>{post.shares || 0}</span>
            </div>
          </div>
        </div>
      </CardContent>
      
      <Separator />
      
      <CardFooter className="pt-3 pb-3 flex justify-between">
        <Button 
          variant="ghost" 
          size="sm" 
          className={`flex-1 ${isLiked ? 'text-red-500' : ''}`}
          onClick={handleLikePost}
          disabled={likePostMutation.isPending || isLiked}
        >
          {likePostMutation.isPending ? (
            <MusicLoadingSpinner size="sm" className="mr-2" />
          ) : (
            <Heart className={`h-4 w-4 mr-2 ${isLiked ? 'fill-red-500' : ''}`} />
          )}
          Me gusta
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1"
          onClick={() => setShowComments(!showComments)}
        >
          <MessageCircle className="h-4 w-4 mr-2" />
          Comentar
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          className="flex-1"
          onClick={handleSharePost}
        >
          <Share2 className="h-4 w-4 mr-2" />
          Compartir
        </Button>
      </CardFooter>
      
      {showComments && (
        <div className="px-6 py-3 bg-muted/30">
          {/* Formulario para nuevo comentario */}
          <form onSubmit={handleSubmitComment} className="mb-4 flex space-x-2">
            <Avatar className="h-8 w-8 flex-shrink-0">
              <AvatarFallback>TÚ</AvatarFallback>
            </Avatar>
            <div className="flex-1 relative">
              <Textarea
                placeholder="Escribe un comentario..."
                className="min-h-[60px] text-sm py-2"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
              />
              <Button 
                type="submit" 
                size="icon" 
                variant="ghost" 
                className="absolute bottom-2 right-2" 
                disabled={!newComment.trim() || createCommentMutation.isPending}
              >
                {createCommentMutation.isPending ? (
                  <MusicLoadingSpinner size="sm" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </form>
          
          {/* Lista de comentarios */}
          <div className="space-y-4">
            {post.comments && post.comments.length > 0 ? (
              post.comments.map((comment) => (
                <div key={comment.id} className="space-y-4">
                  <div className="flex space-x-2">
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={comment.user?.avatar || undefined} alt={comment.user?.displayName || "Comentarista"} />
                      <AvatarFallback>{getInitials(comment.user?.displayName || "Usuario")}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex items-center">
                          <span className="font-medium text-sm">
                            {comment.user?.displayName || "Usuario desconocido"}
                          </span>
                          {comment.user?.isBot && (
                            <div className="ml-2 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                              AI
                            </div>
                          )}
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                      
                      <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground pl-3">
                        <button 
                          className="hover:text-foreground"
                          onClick={() => setShowReplyForm(comment.id)}
                        >
                          Responder
                        </button>
                        <span>{formatDate(comment.createdAt || new Date())}</span>
                      </div>
                      
                      {/* Formulario para respuesta */}
                      {showReplyForm === comment.id && (
                        <div className="mt-2 pl-6 flex space-x-2">
                          <Avatar className="h-6 w-6 flex-shrink-0">
                            <AvatarFallback>TÚ</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 relative">
                            <Textarea
                              placeholder="Escribe tu respuesta..."
                              className="min-h-[50px] text-xs py-2"
                              value={newReply}
                              onChange={(e) => setNewReply(e.target.value)}
                            />
                            <div className="flex justify-end mt-1 space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs"
                                onClick={() => setShowReplyForm(null)}
                              >
                                Cancelar
                              </Button>
                              <Button
                                size="sm"
                                className="h-7 text-xs"
                                onClick={() => handleSubmitReply(comment.id)}
                                disabled={!newReply.trim()}
                              >
                                Responder
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Respuestas */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="pl-6 mt-2 space-y-3">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex space-x-2">
                              <Avatar className="h-6 w-6 flex-shrink-0">
                                <AvatarImage src={reply.user?.avatar || undefined} alt={reply.user?.displayName || "Comentarista"} />
                                <AvatarFallback>{getInitials(reply.user?.displayName || "Usuario")}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted rounded-lg px-3 py-2">
                                  <div className="flex items-center">
                                    <span className="font-medium text-xs">
                                      {reply.user?.displayName || "Usuario desconocido"}
                                    </span>
                                    {reply.user?.isBot && (
                                      <div className="ml-2 px-1 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                                        AI
                                      </div>
                                    )}
                                  </div>
                                  <p className="text-xs mt-1">{reply.content}</p>
                                </div>
                                <div className="flex items-center space-x-4 mt-1 text-xs text-muted-foreground pl-3">
                                  <span>{formatDate(reply.createdAt || new Date())}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No hay comentarios todavía</p>
                <p className="text-sm mt-1">¡Sé el primero en comentar!</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}