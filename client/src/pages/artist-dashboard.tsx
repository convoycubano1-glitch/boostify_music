import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { motion } from "framer-motion";
import { 
  Video,
  Music2,
  BarChart2,
  DollarSign,
  Users,
  Plus,
  PlayCircle,
  Mic2,
  Upload,
  Loader2,
  X,
  Grid,
  Info,
  ChevronRight
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { db, auth, storage } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, orderBy, limit } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject, uploadBytesResumable } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StrategyDialog } from "@/components/strategy/strategy-dialog";

interface Video {
  id: string;
  url: string;
  title: string;
  createdAt: Date;
  thumbnailUrl?: string;
  videoId?: string;
}

interface Song {
  id: string;
  name: string;
  audioUrl: string;
  storageRef: string;
  createdAt: Date;
}

interface Strategy {
  focus: string[];
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

function getYouTubeVideoId(url: string) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

function getYouTubeThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

const ArtistDashboardPage: React.FC = () => {
  const { toast } = useToast();
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [isVideoGalleryOpen, setIsVideoGalleryOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [isSubmittingSong, setIsSubmittingSong] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isStrategyDialogOpen, setIsStrategyDialogOpen] = useState(false);

  // Query for songs
  const { data: songs = [], isLoading: isLoadingSongs, refetch: refetchSongs } = useQuery({
    queryKey: ["songs", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];

      try {
        const songsRef = collection(db, "songs");
        const q = query(
          songsRef,
          where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        })) as Song[];
      } catch (error) {
        console.error("Error fetching songs:", error);
        toast({
          title: "Error",
          description: "Could not load songs. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!auth.currentUser?.uid,
  });

    // Query for videos
  const { data: videos = [], isLoading: isLoadingVideos, refetch: refetchVideos } = useQuery({
    queryKey: ["videos", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];

      try {
        const videosRef = collection(db, "videos");
        const q = query(
          videosRef,
          where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
          const data = doc.data();
          const videoId = getYouTubeVideoId(data.url);
          return {
            id: doc.id,
            ...data,
            videoId,
            thumbnailUrl: videoId ? getYouTubeThumbnailUrl(videoId) : undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        }) as Video[];
      } catch (error) {
        console.error("Error fetching videos:", error);
        toast({
          title: "Error",
          description: "Could not load videos. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!auth.currentUser?.uid,
  });

  // Query for strategies
  const { data: currentStrategy = [], isLoading: isLoadingStrategy, refetch: refetchStrategy } = useQuery({
    queryKey: ["strategies", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];

      try {
        const strategiesRef = collection(db, "strategies");
        const q = query(
          strategiesRef,
          where("userId", "==", auth.currentUser.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return [];

        const strategyDoc = querySnapshot.docs[0];
        return strategyDoc.data().focus;
      } catch (error) {
        console.error("Error fetching strategy:", error);
        toast({
          title: "Error",
          description: "Could not load strategy. Please try again.",
          variant: "destructive",
        });
        return [];
      }
    },
    enabled: !!auth.currentUser?.uid,
  });


  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Verificar el tamaño del archivo (máximo 10MB)
      const maxSize = 10 * 1024 * 1024; // 10MB en bytes
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

      // Verificar el tipo de archivo
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "Error",
          description: "Please upload a valid audio file (MP3 or WAV)",
          variant: "destructive",
        });
        return;
      }

      try {
        setSelectedFile(file);
        const audio = new Audio(URL.createObjectURL(file));
        setCurrentAudio(audio);
        setIsPlaying(false);
      } catch (error) {
        console.error("Error reading file:", error);
        toast({
          title: "Error",
          description: "Failed to read audio file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSongUpload = async () => {
    if (!auth.currentUser?.uid || !selectedFile) return;

    try {
      setIsSubmittingSong(true);
      setUploadProgress(0);

      // Crear una referencia única para el archivo en Storage
      const storageRef = ref(storage, `songs/${auth.currentUser.uid}/${Date.now()}_${selectedFile.name}`);

      // Crear una tarea de subida para monitorear el progreso
      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

      // Monitorear el progreso de la subida
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload progress:", progress);
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload error:", error);
          toast({
            title: "Error",
            description: "Failed to upload song. Please try again.",
            variant: "destructive",
          });
          setIsSubmittingSong(false);
        },
        async () => {
          try {
            console.log("Upload completed, getting download URL...");
            // Obtener la URL de descarga
            const downloadURL = await getDownloadURL(storageRef);

            console.log("Got download URL, saving to Firestore...");
            const songData = {
              name: selectedFile.name,
              audioUrl: downloadURL,
              storageRef: storageRef.fullPath,
              userId: auth.currentUser.uid,
              createdAt: serverTimestamp()
            };

            const songsRef = collection(db, "songs");
            await addDoc(songsRef, songData);

            console.log("Song saved successfully");
            toast({
              title: "Success",
              description: "Song added successfully",
            });

            setIsSongDialogOpen(false);
            if (currentAudio) {
              currentAudio.pause();
              URL.revokeObjectURL(currentAudio.src);
              setCurrentAudio(null);
            }
            setSelectedFile(null);
            setIsPlaying(false);
            setUploadProgress(0);
            refetchSongs();
          } catch (error) {
            console.error("Error saving song data:", error);
            toast({
              title: "Error",
              description: "Failed to save song data. Please try again.",
              variant: "destructive",
            });
          } finally {
            setIsSubmittingSong(false);
          }
        }
      );

    } catch (error) {
      console.error("Error initiating upload:", error);
      toast({
        title: "Error",
        description: "Failed to start upload. Please try again.",
        variant: "destructive",
      });
      setIsSubmittingSong(false);
    }
  };

    const handleVideoSubmit = async () => {
    if (!auth.currentUser?.uid || !videoUrl) return;

    try {
      setIsSubmittingVideo(true);
      const videoId = getYouTubeVideoId(videoUrl);

      if (!videoId) {
        toast({
          title: "Error",
          description: "Invalid YouTube URL. Please check the URL and try again.",
          variant: "destructive",
        });
        return;
      }

      const videoData = {
        url: videoUrl,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        title: "YouTube Video",
        thumbnailUrl: getYouTubeThumbnailUrl(videoId)
      };

      const videosRef = collection(db, "videos");
      await addDoc(videosRef, videoData);

      toast({
        title: "Success",
        description: "Video added successfully",
      });

      setIsVideoDialogOpen(false);
      setVideoUrl("");
      refetchVideos();

    } catch (error) {
      console.error("Error adding video:", error);
      toast({
        title: "Error",
        description: "Failed to add video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingVideo(false);
    }
  };

  const togglePlay = (audioUrl?: string) => {
    if (audioUrl && (!currentAudio || currentAudio.src !== audioUrl)) {
      if (currentAudio) {
        currentAudio.pause();
      }
      const audio = new Audio(audioUrl);
      setCurrentAudio(audio);
      audio.play();
      setIsPlaying(true);
    } else if (currentAudio) {
      if (isPlaying) {
        currentAudio.pause();
      } else {
        currentAudio.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleDeleteSong = async (songId: string, storageRef: string) => {
    if (!auth.currentUser?.uid) return;

    try {
      // Primero eliminamos el archivo de Storage
      const fileRef = ref(storage, storageRef);
      await deleteObject(fileRef);

      // Luego eliminamos el documento de Firestore
      await deleteDoc(doc(db, "songs", songId));

      toast({
        title: "Success",
        description: "Song deleted successfully",
      });

      refetchSongs();
    } catch (error) {
      console.error("Error deleting song:", error);
      toast({
        title: "Error",
        description: "Failed to delete song. Please try again.",
        variant: "destructive",
      });
    }
  };

    const handleDeleteVideo = async (videoId: string) => {
    if (!auth.currentUser?.uid) return;

    try {
      await deleteDoc(doc(db, "videos", videoId));
      toast({
        title: "Success",
        description: "Video deleted successfully",
      });
      refetchVideos();
    } catch (error) {
      console.error("Error deleting video:", error);
      toast({
        title: "Error",
        description: "Failed to delete video. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section with Video Background */}
      <div className="relative w-full h-[300px] overflow-hidden">
        <video 
          autoPlay 
          loop 
          muted 
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/assets/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Bienvenido a tu Centro Creativo
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            Gestiona tu contenido, estrategia y crecimiento desde un solo lugar. 
            Aprovecha nuestras herramientas de IA para optimizar tu presencia artística.
          </p>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-8">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Videos Publicados</p>
                  <h3 className="text-2xl font-bold mt-1">{videos.length}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Video className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </Card>
            <Card className="p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Canciones Subidas</p>
                  <h3 className="text-2xl font-bold mt-1">{songs.length}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Music2 className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </Card>
            <Card className="p-6 border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Estrategias Activas</p>
                  <h3 className="text-2xl font-bold mt-1">{currentStrategy.length}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <BarChart2 className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Tips Section */}
          <div className="bg-orange-500/5 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Consejos para Optimizar tu Dashboard</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-orange-500" />
                    Mantén tu contenido actualizado subiendo videos y música regularmente
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-orange-500" />
                    Revisa y actualiza tu estrategia mensualmente para mantener el enfoque
                  </li>
                  <li className="flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-orange-500" />
                    Utiliza nuestras herramientas de IA para generar ideas y optimizar tu contenido
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Videos Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Video className="h-6 w-6 text-orange-500" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold">Mis Videos</h2>
                      <p className="text-sm text-muted-foreground">Gestiona tu contenido visual</p>
                    </div>
                  </div>
                  {videos.length > 0 && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setIsVideoGalleryOpen(true)}
                    >
                      <Grid className="h-4 w-4" />
                    </Button>
                  )}
                </div>
                <div className="space-y-4">
                  {isLoadingVideos ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    </div>
                  ) : videos.length > 0 ? (
                    <div className="space-y-3">
                      {videos.slice(0, 3).map((video) => (
                        <div key={video.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            {video.thumbnailUrl ? (
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title}
                                className="w-16 h-12 object-cover rounded"
                              />
                            ) : (
                              <PlayCircle className="h-5 w-5 text-orange-500" />
                            )}
                            <div>
                              <p className="font-medium">{video.title}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(video.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => window.open(video.url, '_blank')}
                            >
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVideo(video.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No videos added yet
                    </div>
                  )}

                  {/* Video Gallery Dialog */}
                  <Dialog open={isVideoGalleryOpen} onOpenChange={setIsVideoGalleryOpen}>
                    <DialogContent className="max-w-4xl">
                      <DialogHeader>
                        <DialogTitle>Video Gallery</DialogTitle>
                        <DialogDescription>
                          Browse all your uploaded videos
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 py-4">
                        {videos.map((video) => (
                          <div 
                            key={video.id} 
                            className="group relative aspect-video rounded-lg overflow-hidden"
                          >
                            {video.thumbnailUrl ? (
                              <img 
                                src={video.thumbnailUrl} 
                                alt={video.title}
                                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <PlayCircle className="h-8 w-8 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                              <div className="absolute top-2 right-2 flex gap-2">
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => window.open(video.url, '_blank')}
                                >
                                  <PlayCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  onClick={() => handleDeleteVideo(video.id)}
                                  className="text-destructive hover:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-2 bg-black/80 text-white text-sm">
                              <p className="truncate">{video.title}</p>
                              <p className="text-xs text-gray-300">
                                {new Date(video.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Video
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Video</DialogTitle>
                        <DialogDescription>
                          Add your YouTube video link below
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="video-url">YouTube URL</Label>
                          <div className="flex gap-2">
                            <Input
                              id="video-url"
                              placeholder="https://youtube.com/watch?v=..."
                              value={videoUrl}
                              onChange={(e) => setVideoUrl(e.target.value)}
                              className="flex-1"
                            />
                          </div>
                        </div>
                        {videoUrl && (
                          <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                            <iframe
                              width="100%"
                              height="100%"
                              src={`https://www.youtube.com/embed/${videoUrl.split("v=")[1]}`}
                              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                              allowFullScreen
                            ></iframe>
                          </div>
                        )}
                        <div className="flex justify-end gap-4">
                          <Button
                            variant="outline"
                            onClick={() => setIsVideoDialogOpen(false)}
                          >
                            <X className="mr-2 h-4 w-4" />
                            Cancel
                          </Button>
                          <Button 
                            onClick={handleVideoSubmit}
                            disabled={isSubmittingVideo || !videoUrl}
                          >
                            {isSubmittingVideo ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <Plus className="mr-2 h-4 w-4" />
                            )}
                            {isSubmittingVideo ? "Adding..." : "Add Video"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            </motion.div>

            {/* Songs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Music2 className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Mi Música</h2>
                    <p className="text-sm text-muted-foreground">Administra tu portafolio musical</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {isLoadingSongs ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    </div>
                  ) : songs.length > 0 ? (
                    
                    <div className="space-y-3">
                      {songs.map((song) => (
                        <div key={song.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <Mic2 className="h-5 w-5 text-orange-500" />
                            <div>
                              <p className="font-medium">{song.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(song.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => togglePlay(song.audioUrl)}
                            >
                              {currentAudio?.src === song.audioUrl && isPlaying ? "Pause" : "Play"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSong(song.id, song.storageRef)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No songs added yet
                    </div>
                  )}
                  <Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full gap-2">
                        <Plus className="h-4 w-4" />
                        Add New Song
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add New Song</DialogTitle>
                        <DialogDescription>
                          Upload your MP3 or WAV file (max 10MB)
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="song-file">Audio File (MP3/WAV)</Label>
                          <div className="flex gap-2">
                            <Input
                              id="song-file"
                              type="file"
                              accept=".mp3,.wav"
                              onChange={handleAudioUpload}
                              className="flex-1"
                              disabled={isSubmittingSong}
                            />
                          </div>
                        </div>
                        {currentAudio && (
                          <div className="p-4 bg-muted rounded-lg">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => togglePlay()}
                                  className="h-8 w-8 p-0"
                                  disabled={isSubmittingSong}
                                >
                                  {isPlaying ? (
                                    <span className="sr-only">Pause</span>
                                  ) : (
                                    <span className="sr-only">Play</span>
                                  )}
                                  {isPlaying ? "⏸️" : "▶️"}
                                </Button>
                                <div className="space-y-1">
                                  <p className="text-sm font-medium leading-none">
                                    Preview
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                     {selectedFile?.name}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        {isSubmittingSong && (
                          <div className="space-y-2">
                            <div className="h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-500 transition-all duration-300"
                                style={{ width: `${uploadProgress}%` }}
                              />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                              Uploading... {Math.round(uploadProgress)}%
                            </p>
                          </div>
                        )}
                        <Button 
                          className="w-full"
                          disabled={isSubmittingSong || !currentAudio}
                          onClick={handleSongUpload}
                        >
                          {isSubmittingSong ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Upload Song
                            </>
                          )}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </Card>
            </motion.div>

            {/* Strategy Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <BarChart2 className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">Mi Estrategia</h2>
                    <p className="text-sm text-muted-foreground">Planifica tu crecimiento</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {isLoadingStrategy ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
                    </div>
                  ) : currentStrategy.length > 0 ? (
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <h3 className="font-medium mb-2">Current Focus</h3>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        {currentStrategy.map((point: string, index: number) => (
                          <li key={index} className="flex items-start gap-2">
                            <span className="mt-1">•</span>
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      No strategy set. Create one to get started.
                    </div>
                  )}
                  <Button 
                    className="w-full" 
                    onClick={() => setIsStrategyDialogOpen(true)}
                  >
                    Update Strategy
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </ScrollArea>

      <StrategyDialog 
        open={isStrategyDialogOpen}
        onOpenChange={setIsStrategyDialogOpen}
        onStrategyUpdate={refetchStrategy}
      />
    </div>
  );
};

export default ArtistDashboardPage;