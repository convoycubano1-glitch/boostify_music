import React, { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageSquare, Heart, Share, Send } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Post, Comment, SocialUser } from "@/lib/social/types";
import { format, formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface PostCardProps {
  post: Post & {
    user: SocialUser;
    comments: (Comment & { user: SocialUser; replies?: (Comment & { user: SocialUser })[] })[];
  };
}

export function PostCard({ post }: PostCardProps) {
  const { user } = useAuth() || {};
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState("");
  const [replyToId, setReplyToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);

  const formatDate = (date: Date) => {
    if (typeof date === 'string') {
      date = new Date(date);
    }
    
    try {
      // Determinar el idioma basado en el usuario del post
      const locale = post.user.language === 'es' ? es : undefined;
      
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / 36e5;
      
      if (diffInHours < 24) {
        return formatDistanceToNow(date, { addSuffix: true, locale });
      } else {
        return format(date, 'PPp', { locale });
      }
    } catch (error) {
      console.error("Error formateando fecha:", error);
      return "Fecha desconocida";
    }
  };

  const likeMutation = useMutation({
    mutationFn: async (postId: string) => {
      const response = await fetch(`/api/social/posts/${postId}/like`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        throw new Error("Error al dar like");
      }
      
      return response.json();
    },
    onSuccess: () => {
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

  const commentMutation = useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const response = await fetch(`/api/social/posts/${postId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content, parentId }),
      });
      
      if (!response.ok) {
        throw new Error("Error al comentar");
      }
      
      return response.json();
    },
    onSuccess: () => {
      setComment("");
      setReplyText("");
      setReplyToId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/social/posts"] });
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

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    
    commentMutation.mutate({
      postId: post.id,
      content: comment,
    });
  };

  const handleSubmitReply = (e: React.FormEvent, commentId: string) => {
    e.preventDefault();
    if (!replyText.trim() || !commentId) return;
    
    commentMutation.mutate({
      postId: post.id,
      content: replyText,
      parentId: commentId,
    });
  };

  const handleLike = () => {
    likeMutation.mutate(post.id);
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const visibleComments = showAllComments ? post.comments : post.comments?.slice(0, 2);

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-start gap-4 space-y-0 pb-2">
        <Avatar>
          <AvatarImage src={post.user.avatar || undefined} alt={post.user.displayName} />
          <AvatarFallback>{getInitials(post.user.displayName)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold">{post.user.displayName}</h4>
              <p className="text-xs text-muted-foreground">
                {formatDate(post.createdAt)}
                {post.user.isBot && (
                  <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded-full">
                    AI
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="py-3">
        <p className="whitespace-pre-wrap">{post.content}</p>
        {post.mediaUrl && (
          <div className="mt-3">
            <img
              src={post.mediaUrl}
              alt="Media adjunta"
              className="rounded-md max-h-96 object-cover w-full"
            />
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col pt-0">
        <div className="flex w-full items-center justify-between py-2 border-t border-b">
          <Button variant="ghost" size="sm" onClick={handleLike}>
            <Heart className="mr-1 h-4 w-4" />
            {post.likes || 0}
          </Button>
          <Button variant="ghost" size="sm">
            <MessageSquare className="mr-1 h-4 w-4" />
            {post.comments?.length || 0}
          </Button>
          <Button variant="ghost" size="sm">
            <Share className="mr-1 h-4 w-4" />
            {post.shares || 0}
          </Button>
        </div>

        {/* Comentarios */}
        <div className="w-full mt-2">
          {visibleComments && visibleComments.length > 0 && (
            <div className="space-y-3">
              {visibleComments.map((comment) => (
                <div key={comment.id} className="pt-2">
                  <div className="flex gap-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={comment.user.avatar || undefined} alt={comment.user.displayName} />
                      <AvatarFallback>{getInitials(comment.user.displayName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-muted rounded-lg px-3 py-2">
                        <div className="flex justify-between items-start">
                          <span className="font-medium text-sm">
                            {comment.user.displayName}
                            {comment.user.isBot && (
                              <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded-full">
                                AI
                              </span>
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">{formatDate(comment.createdAt)}</span>
                        </div>
                        <p className="text-sm mt-1">{comment.content}</p>
                      </div>
                      <div className="flex ml-1 mt-1 gap-2 text-xs text-muted-foreground">
                        <button 
                          className="hover:text-primary transition-colors"
                          onClick={() => setReplyToId(replyToId === comment.id ? null : comment.id)}
                        >
                          Responder
                        </button>
                        <button className="hover:text-primary transition-colors">
                          Me gusta ({comment.likes})
                        </button>
                      </div>

                      {/* Formulario de respuesta */}
                      {replyToId === comment.id && (
                        <form 
                          className="mt-2 flex items-center gap-2"
                          onSubmit={(e) => handleSubmitReply(e, comment.id)}
                        >
                          <Textarea
                            placeholder="Escribe una respuesta..."
                            className="min-h-8 text-sm"
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                          />
                          <Button 
                            type="submit" 
                            size="icon" 
                            className="shrink-0" 
                            disabled={!replyText.trim() || commentMutation.isPending}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </form>
                      )}

                      {/* Respuestas */}
                      {comment.replies && comment.replies.length > 0 && (
                        <div className="ml-4 mt-2 space-y-2">
                          {comment.replies.map((reply) => (
                            <div key={reply.id} className="flex gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={reply.user.avatar || undefined} alt={reply.user.displayName} />
                                <AvatarFallback>{getInitials(reply.user.displayName)}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="bg-muted rounded-lg px-3 py-2">
                                  <div className="flex justify-between items-start">
                                    <span className="font-medium text-sm">
                                      {reply.user.displayName}
                                      {reply.user.isBot && (
                                        <span className="ml-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-1 py-0.5 rounded-full">
                                          AI
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-xs text-muted-foreground">{formatDate(reply.createdAt)}</span>
                                  </div>
                                  <p className="text-sm mt-1">{reply.content}</p>
                                </div>
                                <div className="flex ml-1 mt-1 gap-2 text-xs text-muted-foreground">
                                  <button className="hover:text-primary transition-colors">
                                    Me gusta ({reply.likes})
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {post.comments && post.comments.length > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full text-muted-foreground"
              onClick={() => setShowAllComments(!showAllComments)}
            >
              {showAllComments ? "Mostrar menos comentarios" : `Ver todos los ${post.comments.length} comentarios`}
            </Button>
          )}

          <form onSubmit={handleSubmitComment} className="mt-3 flex items-start gap-2">
            <Textarea
              placeholder="Escribe un comentario..."
              className="min-h-10"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="shrink-0" 
              disabled={!comment.trim() || commentMutation.isPending}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardFooter>
    </Card>
  );
}