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
  
  // Consulta para obtener posts guardados
  const { data: savedPosts, refetch: refetchSavedPosts } = useQuery({
    queryKey: ["/api/firestore-social/user/saved-posts"],
    queryFn: async () => {
      return apiRequest({ 
        url: "/api/firestore-social/user/saved-posts", 
        method: "GET",
        data: { userId: user?.uid || "1" }
      }) as Promise<Post[]>;
    },
    enabled: activeTab === "saved" // Solo se ejecuta cuando la pestaña "saved" está activa
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
        title: "Post created",
        description: "Your post has been published successfully",
      });
      setNewPostContent("");
      refetchPosts();
    },
    onError: (error) => {
      toast({
        title: "Error creating post",
        description: "An error occurred while publishing your post. Please try again.",
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
        method: "POST",
        data: { userId: user?.uid || "1" }
      }) as Promise<Post>;
    },
    onSuccess: () => {
      refetchPosts();
      toast({
        description: "Post liked successfully",
        duration: 2000
      });
    },
    onError: (error) => {
      toast({
        title: "Error liking post",
        description: "An error occurred while liking the post. Please try again.",
        variant: "destructive",
      });
      console.error("Error liking post:", error);
    }
  });
  
  // Mutación para guardar un post
  const savePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      return apiRequest({
        url: `/api/firestore-social/posts/${postId}/save`,
        method: "POST",
        data: { userId: user?.uid || "1" }
      }) as Promise<{ success: boolean }>;
    },
    onSuccess: () => {
      // Actualizar tanto la lista principal como la de posts guardados
      refetchPosts();
      
      // Solo refrescar la lista de posts guardados si estamos en esa pestaña
      if (activeTab === "saved") {
        refetchSavedPosts();
      }
      
      toast({
        description: "Post saved successfully",
        duration: 2000
      });
    },
    onError: (error) => {
      toast({
        title: "Error saving post",
        description: "An error occurred while saving the post. Please try again.",
        variant: "destructive",
      });
      console.error("Error saving post:", error);
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
  
  // Función para generar un color de avatar consistente basado en el nombre
  const getAvatarColor = (name: string) => {
    // Lista de colores para avatares
    const colors = [
      "bg-red-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-indigo-500",
      "bg-teal-500", 
      "bg-orange-500",
      "bg-cyan-500"
    ];
    
    // Convertir el nombre a un número usando la suma de los códigos de carácter
    const sum = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Usar el módulo para elegir un color del array
    const colorIndex = sum % colors.length;
    return colors[colorIndex];
  };

  // Identificar si es un bot y obtener su insignia
  const getBotBadge = (user?: SocialUser | null) => {
    // Verificar que el usuario exista y sea un bot
    if (!user || !user.isBot) return null;
    
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

    const handleSave = () => {
      if (post.id) {
        savePostMutation.mutate(post.id);
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

    // Formatear la fecha en un formato más amigable
    const formatDate = (date: Date) => {
      const now = new Date();
      const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
      
      if (diffInHours < 24) {
        return diffInHours === 0 
          ? 'Today' 
          : `${diffInHours} ${diffInHours === 1 ? 'hour' : 'hours'} ago`;
      } else {
        return date.toLocaleDateString();
      }
    };

    return (
      <Card className="mb-4 shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <Avatar className="mr-2 ring-2 ring-primary/10">
              <AvatarImage src={post.user?.avatar} />
              <AvatarFallback className={getAvatarColor(post.user?.displayName || "Usuario")}>{getInitials(post.user?.displayName || "Usuario")}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center">
                <span className="font-medium">{post.user?.displayName}</span>
                {getBotBadge(post.user as SocialUser)}
              </div>
              <div className="text-xs text-muted-foreground">
                {formatDate(new Date(post.createdAt))}
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
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
          <p className="mb-4 text-base">{post.content}</p>
          <div className="flex items-center justify-between text-sm mb-4 border-t border-b py-2">
            <div className="flex items-center gap-4">
              <button 
                className={`${INFO_GROUP_CLASS} ${post.isLiked ? 'text-red-500 font-medium' : ''} transition-colors hover:text-red-400`}
                onClick={handleLike}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  viewBox="0 0 24 24" 
                  fill={post.isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  className="w-5 h-5"
                  strokeWidth={post.isLiked ? "0" : "2"}
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span>{post.likes} Likes</span>
              </button>
              <button 
                className={`${INFO_GROUP_CLASS} hover:text-primary/80 transition-colors`}
                onClick={() => setShowCommentInput(!showCommentInput)}
              >
                <MessageSquare className="w-5 h-5" />
                <span>{post.comments?.length || 0} Comments</span>
              </button>
            </div>
            <button 
              className={`${INFO_GROUP_CLASS} ${post.isSaved ? 'text-primary font-medium' : ''} hover:text-primary/80 transition-colors`}
              onClick={handleSave}
            >
              <BookMarked className="w-5 h-5" />
              <span>{post.isSaved ? 'Saved' : 'Save'}</span>
            </button>
          </div>

          {showCommentInput && (
            <div className="mb-4">
              <Textarea
                value={newCommentContent}
                onChange={(e) => setNewCommentContent(e.target.value)}
                placeholder="Write a comment..."
                className="mb-2 focus-visible:ring-primary/50"
              />
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowCommentInput(false)}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleComment} disabled={!newCommentContent.trim()}>
                  Comment
                </Button>
              </div>
            </div>
          )}

          {post.comments && post.comments.length > 0 && (
            <div className="space-y-3 mt-4 pt-1">
              {post.comments.map((comment) => (
                <div key={comment.id} className="flex items-start gap-2 animate-in fade-in-50 duration-300">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user?.avatar} />
                    <AvatarFallback className={getAvatarColor(comment.user?.displayName || "Usuario")}>{getInitials(comment.user?.displayName || "Usuario")}</AvatarFallback>
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
                      <span>{formatDate(new Date(comment.createdAt))}</span>
                      <button className="hover:text-primary transition-colors">{comment.likes} Likes</button>
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
                Community
              </CardTitle>
              <CardDescription>Social network members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {users ? (
                  users.map((socialUser: SocialUser) => (
                    <div key={socialUser.id} className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={socialUser.avatar} />
                        <AvatarFallback className={getAvatarColor(socialUser.displayName)}>{getInitials(socialUser.displayName)}</AvatarFallback>
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
                  <div className="text-muted-foreground text-sm">Loading users...</div>
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
                  My Profile
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center gap-1">
                  <BookMarked className="w-4 h-4" />
                  Saved
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
              {/* Create new post */}
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="text-lg">Create new post</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="What are you thinking about music today?"
                    className="mb-3"
                  />
                  <div className="flex justify-end">
                    <Button onClick={handleCreatePost} disabled={!newPostContent.trim()}>
                      Post
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Posts list */}
              {posts ? (
                posts.length > 0 ? (
                  posts.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <div className="text-center py-10">
                    <p className="text-muted-foreground">No posts available. Be the first to post!</p>
                  </div>
                )
              ) : (
                <div className="text-center py-10">
                  <p className="text-muted-foreground">Loading posts...</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="personal">
              <Card>
                <CardHeader>
                  <CardTitle>My Profile</CardTitle>
                  <CardDescription>Manage your profile and posts</CardDescription>
                </CardHeader>
                <CardContent>
                  <p>Profile functionality in development.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="saved">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookMarked className="w-5 h-5" />
                    Saved Posts
                  </CardTitle>
                  <CardDescription>Posts you've saved for later reference</CardDescription>
                </CardHeader>
              </Card>

              {/* Lista de posts guardados */}
              {savedPosts ? (
                savedPosts.length > 0 ? (
                  savedPosts.map((post) => <PostCard key={post.id} post={post} />)
                ) : (
                  <div className="text-center py-10 bg-muted/20 rounded-lg">
                    <BookMarked className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">No saved posts yet.</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Start saving posts you'd like to refer back to later.
                    </p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-4"
                      onClick={() => setActiveTab("feed")}
                    >
                      Browse feed
                    </Button>
                  </div>
                )
              ) : (
                <div className="flex flex-col items-center justify-center py-10 bg-muted/20 rounded-lg">
                  <div className="animate-pulse h-8 w-8 rounded-full bg-muted mb-4"></div>
                  <p className="text-muted-foreground">Loading saved posts...</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}