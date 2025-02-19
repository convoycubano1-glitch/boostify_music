import { useState, useEffect } from "react";
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
import { db } from "@/lib/firebase";
import { collection, addDoc, deleteDoc, updateDoc, doc, Timestamp, query, where, orderBy, getDocs } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from 'axios';

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

  const [videoForm, setVideoForm] = useState<Partial<Video>>({
    title: '',
    description: '',
    youtubeId: '',
    thumbnail: '',
  });

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

  const fetchYouTubeMetadata = async (youtubeId: string) => {
    try {
      // Validate YouTube ID format
      if (!youtubeId.match(/^[a-zA-Z0-9_-]{11}$/)) {
        toast({
          title: "Error",
          description: "El ID de YouTube debe tener 11 caracteres y solo puede contener letras, números, guiones y guiones bajos",
          variant: "destructive"
        });
        return;
      }

      const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY;
      if (!apiKey) {
        toast({
          title: "Error",
          description: "No se encontró la clave de API de YouTube",
          variant: "destructive"
        });
        return;
      }

      const response = await axios.get(
        `https://www.googleapis.com/youtube/v3/videos`,
        {
          params: {
            part: 'snippet',
            id: youtubeId,
            key: apiKey
          }
        }
      );

      if (response.data.items && response.data.items.length > 0) {
        const videoData = response.data.items[0].snippet;
        setVideoForm(prev => ({
          ...prev,
          title: videoData.title,
          description: videoData.description,
          youtubeId,
          thumbnail: `https://img.youtube.com/vi/${youtubeId}/maxresdefault.jpg`,
        }));
      } else {
        toast({
          title: "Error",
          description: "No se encontró el video con ese ID",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error fetching YouTube metadata:', error);
      let errorMessage = "Error al obtener la información del video";

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          errorMessage = "Error en la petición a YouTube API. Verifica que el ID del video sea válido.";
        } else if (error.response?.status === 403) {
          errorMessage = "Error de autenticación con YouTube API. Verifica la clave API.";
        }
      }

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const handleYouTubeIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const youtubeId = e.target.value.trim();
    setVideoForm(prev => ({ ...prev, youtubeId }));

    if (youtubeId.match(/^[a-zA-Z0-9_-]{11}$/)) {
      fetchYouTubeMetadata(youtubeId);
    }
  };

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
                    <p className="text-sm text-muted-foreground">
                      Add or edit your video details below. Enter a YouTube video ID to automatically fetch its information.
                    </p>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>YouTube Video ID</Label>
                      <Input
                        value={videoForm.youtubeId}
                        onChange={handleYouTubeIdChange}
                        placeholder="e.g. dQw4w9WgXcQ"
                      />
                      <p className="text-sm text-muted-foreground">
                        Ingresa el ID del video de YouTube para auto-completar los detalles
                      </p>
                    </div>

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
                        className="min-h-[100px]"
                      />
                    </div>

                    {videoForm.thumbnail && (
                      <div className="space-y-2">
                        <Label>Preview</Label>
                        <div className="relative aspect-video rounded-lg overflow-hidden">
                          <img
                            src={videoForm.thumbnail}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => {
                        if (editingVideo) {
                          editVideoMutation.mutate(videoForm);
                        } else {
                          createVideoMutation.mutate(videoForm);
                        }
                      }}
                      disabled={!videoForm.youtubeId || !videoForm.title}
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
                        {video.youtubeId ? (
                          <>
                            <img
                              src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                              alt={video.title}
                              className="absolute inset-0 w-full h-full object-cover transition-opacity group-hover:opacity-0"
                            />
                            <iframe
                              src={`https://www.youtube.com/embed/${video.youtubeId}?autoplay=0&controls=1`}
                              className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity"
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-100 group-hover:opacity-0 transition-opacity">
                              <PlaySquare className="h-12 w-12 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="w-full h-full bg-muted flex items-center justify-center">
                            <PlaySquare className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
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