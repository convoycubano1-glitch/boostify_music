import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { Activity, PlaySquare, Plus, Edit2, Trash2, MessageSquare, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useState } from "react";
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, updateDoc, doc, Timestamp, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface Comment {
  id?: string;
  userId: string;
  userName: string;
  text: string;
  createdAt: Timestamp;
}

interface Video {
  id?: string;
  title: string;
  description: string;
  thumbnail: string;
  views: number;
  likes: number;
  comments: Comment[];
  date: Timestamp;
  youtubeId?: string;
  userId: string;
}

export default function VideosPage() {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [editingVideo, setEditingVideo] = useState<Video | null>(null);
  const [commentText, setCommentText] = useState<string>("");
  const [showComments, setShowComments] = useState<{ [key: string]: boolean }>({});
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Estado del formulario de video
  const [videoForm, setVideoForm] = useState<Partial<Video>>({
    title: '',
    description: '',
    youtubeId: '',
    thumbnail: '',
  });

  // Query para obtener videos
  const { data: videos = [], isLoading } = useQuery({
    queryKey: ['videos'],
    queryFn: async () => {
      if (!user) throw new Error("Usuario no autenticado");

      const videosRef = collection(db, "videos");
      const q = query(videosRef, orderBy("date", "desc"));
      const snapshot = await getDocs(q);

      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Video[];
    },
    enabled: !!user
  });

  // Mutation para crear videos
  const createVideoMutation = useMutation({
    mutationFn: async (newVideo: Partial<Video>) => {
      if (!user) throw new Error("Usuario no autenticado");

      const videoData = {
        ...newVideo,
        views: 0,
        likes: 0,
        comments: [],
        date: Timestamp.now(),
        userId: user.uid,
        thumbnail: `https://img.youtube.com/vi/${newVideo.youtubeId}/maxresdefault.jpg`
      };

      await addDoc(collection(db, "videos"), videoData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast({
        title: "Éxito",
        description: "Video añadido exitosamente",
      });
      setShowVideoDialog(false);
      setVideoForm({
        title: '',
        description: '',
        youtubeId: '',
        thumbnail: '',
      });
    }
  });

  // Mutation para editar videos
  const editVideoMutation = useMutation({
    mutationFn: async (updatedVideo: Partial<Video>) => {
      if (!user || !editingVideo?.id) throw new Error("No se puede editar el video");

      const videoRef = doc(db, "videos", editingVideo.id);
      await updateDoc(videoRef, {
        ...updatedVideo,
        updatedAt: Timestamp.now(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast({
        title: "Éxito",
        description: "Video actualizado exitosamente",
      });
      setShowVideoDialog(false);
      setEditingVideo(null);
    }
  });

  // Mutation para eliminar videos
  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: string) => {
      if (!user) throw new Error("Usuario no autenticado");
      await deleteDoc(doc(db, "videos", videoId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      toast({
        title: "Éxito",
        description: "Video eliminado exitosamente",
      });
    }
  });

  // Mutation para añadir comentarios
  const addCommentMutation = useMutation({
    mutationFn: async ({ videoId, text }: { videoId: string, text: string }) => {
      if (!user) throw new Error("Usuario no autenticado");

      const videoRef = doc(db, "videos", videoId);
      const comment: Comment = {
        userId: user.uid,
        userName: user.displayName || 'Anonymous',
        text,
        createdAt: Timestamp.now()
      };

      await updateDoc(videoRef, {
        comments: [...(videos.find(v => v.id === videoId)?.comments || []), comment]
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['videos'] });
      setCommentText("");
      toast({
        title: "Éxito",
        description: "Comentario añadido exitosamente",
      });
    }
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 pt-24">
        <ScrollArea className="h-[calc(100vh-6rem)]">
          <div className="container mx-auto px-4">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                  Video Content Hub
                </h1>
                <p className="text-muted-foreground mt-2">
                  Manage and analyze your video content across platforms
                </p>
              </div>
              <Dialog open={showVideoDialog} onOpenChange={(open) => {
                if (!open) {
                  setEditingVideo(null);
                  setVideoForm({
                    title: '',
                    description: '',
                    youtubeId: '',
                    thumbnail: '',
                  });
                }
                setShowVideoDialog(open);
              }}>
                <DialogTrigger asChild>
                  <Button className="bg-orange-500 hover:bg-orange-600">
                    <Plus className="mr-2 h-4 w-4" />
                    Upload Video
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingVideo ? 'Edit Video' : 'Upload New Video'}
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={videoForm.title}
                        onChange={(e) => setVideoForm({ ...videoForm, title: e.target.value })}
                        placeholder="Enter video title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={videoForm.description}
                        onChange={(e) => setVideoForm({ ...videoForm, description: e.target.value })}
                        placeholder="Enter video description"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>YouTube Video ID</Label>
                      <Input
                        value={videoForm.youtubeId}
                        onChange={(e) => setVideoForm({ ...videoForm, youtubeId: e.target.value })}
                        placeholder="e.g. dQw4w9WgXcQ"
                      />
                    </div>
                    <Button
                      className="w-full"
                      onClick={() => {
                        if (editingVideo) {
                          editVideoMutation.mutate(videoForm);
                        } else {
                          createVideoMutation.mutate(videoForm);
                        }
                      }}
                    >
                      {editingVideo ? 'Update Video' : 'Upload Video'}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-6">
              {videos.map((video) => (
                <Card key={video.id} className="p-6 hover:bg-muted/50 transition-colors">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="w-full md:w-1/3">
                      <div className="relative aspect-video rounded-lg overflow-hidden group">
                        <iframe
                          src={`https://www.youtube.com/embed/${video.youtubeId}`}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{video.title}</h3>
                          <p className="text-muted-foreground mb-4">{video.description}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setEditingVideo(video);
                              setVideoForm({
                                title: video.title,
                                description: video.description,
                                youtubeId: video.youtubeId,
                              });
                              setShowVideoDialog(true);
                            }}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="icon">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta acción no se puede deshacer. El video será eliminado permanentemente.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => video.id && deleteVideoMutation.mutate(video.id)}
                                  className="bg-red-500 hover:bg-red-600"
                                >
                                  Eliminar
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground mb-4">
                        <div>
                          <span className="font-semibold">{video.views.toLocaleString()}</span> views
                        </div>
                        <div>
                          <span className="font-semibold">{video.likes.toLocaleString()}</span> likes
                        </div>
                        <div>
                          <span className="font-semibold">
                            {(video.comments || []).length}
                          </span> comments
                        </div>
                        <div>
                          <span className="font-semibold">
                            {video.date instanceof Timestamp
                              ? video.date.toDate().toLocaleDateString()
                              : new Date(video.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {/* Sección de comentarios */}
                      <div className="mt-4">
                        <Button
                          variant="outline"
                          className="mb-4"
                          onClick={() => setShowComments({
                            ...showComments,
                            [video.id!]: !showComments[video.id!]
                          })}
                        >
                          <MessageSquare className="h-4 w-4 mr-2" />
                          {showComments[video.id!] ? 'Hide Comments' : 'Show Comments'}
                        </Button>

                        {showComments[video.id!] && (
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <Input
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Write a comment..."
                                className="flex-1"
                              />
                              <Button
                                onClick={() => {
                                  if (video.id && commentText.trim()) {
                                    addCommentMutation.mutate({
                                      videoId: video.id,
                                      text: commentText
                                    });
                                  }
                                }}
                                disabled={!commentText.trim()}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </div>

                            <div className="space-y-2">
                              {(video.comments || []).map((comment, index) => (
                                <div
                                  key={index}
                                  className="bg-muted/50 p-3 rounded-lg"
                                >
                                  <div className="flex justify-between items-start">
                                    <p className="font-semibold text-sm">
                                      {comment.userName}
                                    </p>
                                    <span className="text-xs text-muted-foreground">
                                      {comment.createdAt instanceof Timestamp
                                        ? comment.createdAt.toDate().toLocaleString()
                                        : new Date(comment.createdAt).toLocaleString()}
                                    </span>
                                  </div>
                                  <p className="text-sm mt-1">{comment.text}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}