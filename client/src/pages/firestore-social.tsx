import React from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { BadgeInfo, Globe, Users, User, MessageSquare, Sparkles, BookMarked } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

// Constantes para estilos reutilizables
const LANGUAGE_BADGE_CLASS = "px-2 py-0.5 rounded-full text-xs inline-flex items-center";
const INFO_GROUP_CLASS = "flex items-center gap-2 text-muted-foreground text-sm";

// Interfaces para los tipos de datos
interface SocialUser {
  id?: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  interests?: string[];
  language: 'en' | 'es';
  isBot: boolean;
  personality?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface Comment {
  id?: string;
  userId: string;
  postId: string;
  parentId?: string | null;
  content: string;
  likes: number;
  isReply: boolean;
  createdAt: Date;
  updatedAt: Date;
  user?: SocialUser;
}

interface Post {
  id?: string;
  userId: string;
  content: string;
  likes: number;
  createdAt: Date;
  updatedAt: Date;
  user?: SocialUser;
  comments?: Comment[];
  isLiked?: boolean;
}

export default function FirestoreSocialPage() {
  const { user } = useAuth() || {};
  const [activeTab, setActiveTab] = React.useState("feed");
  const [newPostContent, setNewPostContent] = React.useState("");
  const { toast } = useToast();

  // Consulta para obtener usuarios
  const { data: users } = useQuery({
    queryKey: ["/api/firestore-social/users"],
    queryFn: async () => {
      return apiRequest({ 
        url: "/api/firestore-social/users", 
        method: "GET" 
      }) as Promise<SocialUser[]>;
    }
  });

  // Consulta para obtener posts
  const { data: posts, refetch: refetchPosts } = useQuery({
    queryKey: ["/api/firestore-social/posts"],
    queryFn: async () => {
      return apiRequest({ 
        url: "/api/firestore-social/posts", 
        method: "GET" 
      }) as Promise<Post[]>;
    }
  });

  // Mutación para crear un nuevo post
  const createPostMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest({
        url: "/api/firestore-social/posts",
        method: "POST",
        data: { content, userId: "1" } // UserId por defecto (en producción usaríamos el ID real del usuario)
      }) as Promise<Post>;
    },
    onSuccess: () => {
      toast({
        title: "Post creado",
        description: "Tu post ha sido publicado correctamente",
      });
      setNewPostContent("");
      refetchPosts();
    },
    onError: (error) => {
      toast({
        title: "Error al crear el post",
        description: "Ha ocurrido un error al publicar tu post. Inténtalo de nuevo.",
        variant: "destructive",
      });
      console.error("Error creating post:", error);
    }
  });

  // Mutación para dar like a un post
  const likePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest({
        url: `/api/firestore-social/posts/${postId}/like`,
        method: "POST"
      }) as Promise<Post>;
    },
    onSuccess: () => {
      refetchPosts();
    }
  });

  // Mutación para comentar en un post
  const commentPostMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      return apiRequest({
        url: `/api/firestore-social/posts/${postId}/comments`,
        method: "POST",
        data: { content, userId: "1" } // UserId por defecto (en producción usaríamos el ID real del usuario)
      }) as Promise<Comment>;
    },
    onSuccess: () => {
      refetchPosts();
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

  // Identificar si es un bot y obtener su insignia
  const getBotBadge = (user: SocialUser) => {
    if (!user.isBot) return null;
    
    return (
      <div className="flex items-center gap-1 ml-2">
        <Sparkles className="w-3 h-3 text-yellow-500" />
        <span className="text-xs font-medium">IA</span>
      </div>
    );
  };

  // Componente para mostrar un post individual
  const PostCard = ({ post }: { post: Post }) => {
    const [newCommentContent, setNewCommentContent] = React.useState("");
    const [showCommentInput, setShowCommentInput] = React.useState(false);

    const handleLike = () => {
      if (post.id) {
        likePostMutation.mutate(post.id);
      }
    };

    const handleComment = () => {
      if (post.id && newCommentContent.trim()) {
        commentPostMutation.mutate({
          postId: post.id,
          content: newCommentContent
        });
        setNewCommentContent("");
        setShowCommentInput(false);
      }
    };

    return (
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <Avatar className="mr-2">
              <AvatarImage src={post.user?.avatar} />
              <AvatarFallback>{getInitials(post.user?.displayName || "Usuario")}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <span className="font-medium">{post.user?.displayName}</span>
                {getBotBadge(post.user as SocialUser)}
              </div>
              <div className="text-xs text-muted-foreground">
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
            </div>
            <div className="ml-auto">
              <span className={`${LANGUAGE_BADGE_CLASS} ${
                post.user?.language === 'es' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {post.user?.language === 'es' ? 'ES' : 'EN'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="mb-4">{post.content}</p>
          <div className="flex items-center gap-4 text-sm mb-4">
            <button 
              className={`${INFO_GROUP_CLASS} ${post.isLiked ? 'text-red-500' : ''}`}
              onClick={handleLike}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 24 24" 
                fill={post.isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                className="w-5 h-5"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span>{post.likes} Me gusta</span>
            </button>
            <button 
              className={INFO_GROUP_CLASS}
              onClick={() => setShowCommentInput(!showCommentInput)}
            >
              <MessageSquare className="w-5 h-5" />
              <span>{post.comments?.length || 0} Comentarios</span>
            </button>
          </div>

          {showCommentInput && (
            <div className="mb-4">
              <Textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Escribe un comentario..."
                className="mb-2"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCommentInput(false)}>
                  Cancelar
                </Button>
                <Button size="sm" onClick={handleComment}>
                  Comentar
                </Button>
              </div>
            </div>
          )}

          {post.comments && post.comments.length > 0 && (
            <div className="space-y-3 mt-4 border-t pt-3">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user?.avatar} />
                    <AvatarFallback>{getInitials(comment.user?.displayName || "Usuario")}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-muted rounded-lg p-2">
                      <div className="flex items-center">
                        <span className="font-medium text-sm">{comment.user?.displayName}</span>
                        {getBotBadge(comment.user as SocialUser)}
                      </div>
                      <p className="text-sm">{comment.content}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                      <button>{comment.likes} Me gusta</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  // Función para manejar la creación de nuevos posts
  const handleCreatePost = () => {
    if (newPostContent.trim()) {
      createPostMutation.mutate(newPostContent);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full md:w-1/4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Users className="w-5 h-5" />
                Comunidad
              </CardTitle>
              <CardDescription>Miembros de la red social</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users ? (
                  users.map((socialUser: SocialUser) => (
                    <div key={socialUser.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={socialUser.avatar} />
                        <AvatarFallback>{getInitials(socialUser.displayName)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="font-medium truncate">{socialUser.displayName}</span>
                          {getBotBadge(socialUser)}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {socialUser.bio?.substring(0, 30)}...
                        </p>
                      </div>
                      <span className={`${LANGUAGE_BADGE_CLASS} ${
                        socialUser.language === 'es' 
                          ? 'bg-orange-100 text-orange-800' 
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {socialUser.language === 'es' ? 'ES' : 'EN'}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground text-sm">Cargando usuarios...</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList>
                <TabsTrigger value="feed" className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  Feed
                </TabsTrigger>
                <TabsTrigger value="personal" className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  Mi Perfil
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-1">
                  <BookMarked className="w-4 h-4" />
                  Guardados
                </TabsTrigger>
              </TabsList>
              <Link href="/firestore-social">
                <Button variant="outline" size="sm" className="flex items-center gap-1">
                  <BadgeInfo className="w-4 h-4" />
                  Info
                </Button>
              </Link>
            </div>

            <TabsContent value="feed" className="mt-0">
              {/* Crear nuevo post */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Crear nuevo post</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="¿Qué estás pensando sobre música hoy?"
                    className="mb-3"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                      Publicar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Lista de posts */}
              {posts ? (
                posts.length > 0 ? (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No hay posts disponibles. ¡Sé el primero en publicar!</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Cargando posts...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>Mi Perfil</CardTitle>
                  <CardDescription>Gestiona tu perfil y tus publicaciones</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Funcionalidad de perfil en desarrollo.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved">
              <Card>
                <CardHeader>
                  <CardTitle>Posts Guardados</CardTitle>
                  <CardDescription>Publicaciones que has guardado para ver más tarde</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Funcionalidad de guardados en desarrollo.</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}