import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, Plus, Eye, MessageSquare, ThumbsUp, Clock, ImageIcon } from "lucide-react";
import { collection, query, where, orderBy, getDocs, addDoc, Timestamp, updateDoc, doc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface BlogPost {
  id?: string;
  title: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  date: Timestamp;
  views: number;
  likes: number;
  comments: number;
  tags: string[];
  userId: string;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

export default function BlogPage() {
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Asegurarse de que la colección existe al cargar la página
  useEffect(() => {
    const initializeCollection = async () => {
      if (!user) return;

      try {
        const postsRef = collection(db, "blog-posts");
        const q = query(postsRef, where("userId", "==", user.uid), limit(1));
        const snapshot = await getDocs(q);

        // Si no hay documentos, crear uno inicial
        if (snapshot.empty) {
          console.log("Creando post inicial para inicializar la colección");
          const now = Timestamp.now();
          await addDoc(postsRef, {
            title: "Mi primer post",
            excerpt: "Bienvenido a mi blog",
            content: "Este es un post inicial para comenzar tu blog.",
            image: "https://via.placeholder.com/800x600",
            author: user.displayName || 'Anonymous',
            date: now,
            views: 0,
            likes: 0,
            comments: 0,
            tags: ["bienvenida"],
            userId: user.uid,
            createdAt: now,
            updatedAt: now,
          });
          console.log("Post inicial creado exitosamente");
        }
      } catch (error) {
        console.error("Error al inicializar la colección:", error);
      }
    };

    initializeCollection();
  }, [user]);

  const [newPost, setNewPost] = useState<Partial<BlogPost>>({
    title: '',
    excerpt: '',
    content: '',
    tags: [],
    image: '',
  });

  // Query para obtener posts
  const { data: blogPosts = [], isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: async () => {
      if (!user) return [];

      try {
        console.log("Intentando obtener posts para usuario:", user.uid);
        const postsRef = collection(db, "blog-posts");

        // Primero intentar sin ordenamiento para debug
        const q = query(
          postsRef,
          where("userId", "==", user.uid)
        );

        console.log("Ejecutando consulta de Firestore");
        const querySnapshot = await getDocs(q);
        console.log("Resultado de la consulta:", querySnapshot.size, "documentos");

        const results = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as BlogPost[];

        console.log("Posts recuperados:", results);
        return results;
      } catch (error) {
        console.error("Error detallado al obtener posts:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los posts. Por favor, intenta de nuevo.",
          variant: "destructive"
        });
        return [];
      }
    },
    enabled: !!user
  });

  // Mutation para crear posts
  const createPostMutation = useMutation({
    mutationFn: async (newBlogPost: Partial<BlogPost>) => {
      if (!user) throw new Error("Usuario no autenticado");

      console.log("Intentando crear nuevo post:", newBlogPost);
      const postsRef = collection(db, "blog-posts");
      try {
        const now = Timestamp.now();
        const docRef = await addDoc(postsRef, {
          ...newBlogPost,
          userId: user.uid,
          author: user.displayName || 'Anonymous',
          date: now,
          views: 0,
          likes: 0,
          comments: 0,
          createdAt: now,
          updatedAt: now,
        });
        console.log("Post creado exitosamente con ID:", docRef.id);
        return docRef;
      } catch (error) {
        console.error("Error al crear post:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["blog-posts"] });
      toast({
        title: "Éxito",
        description: "Post creado exitosamente",
      });
      setShowNewPostDialog(false);
      setNewPost({
        title: '',
        excerpt: '',
        content: '',
        tags: [],
        image: '',
      });
    },
    onError: (error) => {
      console.error("Error en mutation al crear post:", error);
      toast({
        title: "Error",
        description: "No se pudo crear el post. Por favor, intenta de nuevo.",
        variant: "destructive"
      });
    }
  });

  const handleCreatePost = () => {
    if (!newPost.title || !newPost.content) {
      toast({
        title: "Error",
        description: "Por favor completa los campos requeridos",
        variant: "destructive"
      });
      return;
    }

    createPostMutation.mutate(newPost);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6 pt-20">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Blog & Content Hub
              </h1>
              <p className="text-muted-foreground mt-2">
                Share your insights and connect with your audience
              </p>
            </div>
            <Dialog open={showNewPostDialog} onOpenChange={setShowNewPostDialog}>
              <DialogTrigger asChild>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="mr-2 h-4 w-4" />
                  New Post
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create New Blog Post</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      value={newPost.title}
                      onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                      placeholder="Enter post title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="excerpt">Excerpt</Label>
                    <Input
                      id="excerpt"
                      value={newPost.excerpt}
                      onChange={(e) => setNewPost({ ...newPost, excerpt: e.target.value })}
                      placeholder="Brief description of your post"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">Content</Label>
                    <Textarea
                      id="content"
                      value={newPost.content}
                      onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                      placeholder="Write your blog post content here..."
                      className="min-h-[200px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="image">Featured Image URL</Label>
                    <div className="flex gap-2">
                      <Input
                        id="image"
                        value={newPost.image}
                        onChange={(e) => setNewPost({ ...newPost, image: e.target.value })}
                        placeholder="Enter image URL"
                      />
                      <Button variant="outline" size="icon">
                        <ImageIcon className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={newPost.tags?.join(', ')}
                      onChange={(e) => setNewPost({
                        ...newPost,
                        tags: e.target.value.split(',').map(tag => tag.trim())
                      })}
                      placeholder="Enter tags separated by commas"
                    />
                  </div>

                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={handleCreatePost}
                    disabled={createPostMutation.isPending}
                  >
                    {createPostMutation.isPending ? 'Creating...' : 'Publish Post'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="marketing">Marketing</SelectItem>
                <SelectItem value="technology">Technology</SelectItem>
                <SelectItem value="industry">Industry News</SelectItem>
                <SelectItem value="tutorials">Tutorials</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card className="p-6 mb-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-2">Content Performance</h3>
              <p className="text-sm text-muted-foreground">
                Track your blog metrics and engagement
              </p>
            </div>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={Array.from({ length: 30 }, (_, i) => ({
                  date: new Date(2024, 0, i + 1).toLocaleDateString(),
                  views: Math.floor(Math.random() * 1000) + 500,
                  engagement: Math.floor(Math.random() * 800) + 300,
                  shares: Math.floor(Math.random() * 600) + 200,
                }))}>
                  <defs>
                    <linearGradient id="colorBlog" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="date" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name="Views"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={1}
                    fill="url(#colorBlog)"
                  />
                  <Area
                    type="monotone"
                    dataKey="engagement"
                    name="Engagement"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.5}
                    fill="url(#colorBlog)"
                  />
                  <Area
                    type="monotone"
                    dataKey="shares"
                    name="Shares"
                    stroke="hsl(24, 95%, 53%)"
                    fillOpacity={0.3}
                    fill="url(#colorBlog)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <div className="grid gap-6">
            {isLoading ? (
              <Card className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </Card>
            ) : blogPosts.map((post) => (
              <Card key={post.id} className="p-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <div className="w-full md:w-1/3">
                    <div className="relative aspect-video rounded-lg overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="object-cover w-full h-full"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-semibold mb-2">{post.title}</h3>
                        <p className="text-muted-foreground mb-4">{post.excerpt}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-orange-500/10 text-orange-500 rounded-full text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <Button variant="outline">Edit</Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {post.date instanceof Timestamp
                          ? post.date.toDate().toLocaleDateString()
                          : new Date(post.date).toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        {post.views}
                      </div>
                      <div className="flex items-center gap-1">
                        <ThumbsUp className="h-4 w-4" />
                        {post.likes}
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        {post.comments}
                      </div>
                      <div className="text-orange-500">
                        By {post.author}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}