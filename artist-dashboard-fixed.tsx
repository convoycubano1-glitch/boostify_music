import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { motion, AnimatePresence } from "framer-motion";
import {
  Video,
  Music2,
  BarChart2,
  DollarSign,
  Users,
  Plus,
  PlayCircle,
  PauseCircle,
  Mic2,
  Upload,
  Loader2,
  X,
  Grid,
  TrendingUp,
  Award,
  RefreshCw,
  Info,
  ChevronRight,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Clock,
  Calendar,
  Zap,
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { db, auth, storage } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
  deleteDoc,
  doc,
  orderBy,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  uploadBytesResumable,
} from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { StrategyDialog } from "@/components/strategy/strategy-dialog";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { RightsManagementCard } from "@/components/rights/rights-management-card";
import { DistributionCard } from "@/components/distribution/distribution-card";

interface VideoData {
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
  userId: string;
}

interface Strategy {
  id: string;
  focus: string[];
  phases: Phase[];
  targetAudience: string;
  priority: string;
  timeline: string;
  status: string;
  createdAt: Date;
  userId: string;
}

interface Phase {
  id: string;
  name: string;
  description: string;
  completed: boolean;
}

const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

function getYouTubeVideoId(url: string | undefined) {
  if (!url) return null;
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7]?.length === 11 ? match[7] : null;
}

function getYouTubeThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export default function ArtistDashboard() {
  const { toast } = useToast();

  // State de diálogos y formularios
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
  const [isStrategyGalleryOpen, setIsStrategyGalleryOpen] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);

  // Query de canciones
  const {
    data: songs = [],
    isLoading: isLoadingSongs,
    refetch: refetchSongs,
  } = useQuery({
    queryKey: ["songs", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];
      try {
        const songsRef = collection(db, "songs");
        const q = query(songsRef, where("userId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => ({
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

  // Query de videos
  const {
    data: videos = [],
    isLoading: isLoadingVideos,
    refetch: refetchVideos,
  } = useQuery({
    queryKey: ["videos", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];
      try {
        const videosRef = collection(db, "videos");
        const q = query(videosRef, where("userId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const videoId = getYouTubeVideoId(data.url);
          return {
            id: doc.id,
            ...data,
            videoId,
            thumbnailUrl: videoId ? getYouTubeThumbnailUrl(videoId) : undefined,
            createdAt: data.createdAt?.toDate() || new Date(),
          };
        }) as VideoData[];
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

  // Query de estrategia actual
  const {
    data: currentStrategy = [],
    isLoading: isLoadingStrategy,
    refetch: refetchStrategy,
  } = useQuery({
    queryKey: ["strategies", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];
      try {
        const strategiesRef = collection(db, "strategies");
        const q = query(strategiesRef, where("userId", "==", auth.currentUser.uid));
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) return [];
        const strategies = querySnapshot.docs.map((doc) => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
        }));
        strategies.sort(
          (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
        );
        const latestStrategy = strategies[0];
        return latestStrategy?.focus || [];
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

  // Función para traer todas las estrategias (para la galería)
  const fetchStrategies = async () => {
    if (!auth.currentUser?.uid) return;
    try {
      const strategiesRef = collection(db, "strategies");
      const q = query(strategiesRef, where("userId", "==", auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const fetchedStrategies = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          focus: data.focus || [],
          phases: data.phases || [],
          targetAudience: data.targetAudience || "",
          priority: data.priority || "",
          timeline: data.timeline || "",
          status: data.status || "active",
          createdAt: data.createdAt?.toDate() || new Date(),
          userId: data.userId,
        } as Strategy;
      });
      fetchedStrategies.sort(
        (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
      );
      setStrategies(fetchedStrategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      toast({
        title: "Error",
        description: "Could not load strategies. Please try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (auth.currentUser?.uid) {
      fetchStrategies();
    }
  }, [auth.currentUser?.uid]);

  // Manejo de audio y subida de canción
  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "File size must be less than 50MB",
          variant: "destructive",
        });
        return;
      }

      // Validate file type specifically for MP3 and WAV
      if (!file.type.match(/^audio\/(mpeg|wav|x-wav)$/)) {
        toast({
          title: "Error",
          description: "Please upload a valid MP3 or WAV file",
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

      // Create a reference in Firebase Storage
      const storageRefPath = `artist_music/${auth.currentUser.uid}/${Date.now()}_${selectedFile.name}`;
      const storageRefObj = ref(storage, storageRefPath);

      // Start upload with progress monitoring
      const uploadTask = uploadBytesResumable(storageRefObj, selectedFile);

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

            // Save song data to Firestore
            const songData = {
              name: selectedFile.name,
              audioUrl: downloadURL,
              storageRef: storageRefObj.fullPath,
              userId: auth.currentUser.uid,
              createdAt: serverTimestamp(),
            };

            await addDoc(collection(db, "songs"), songData);

            // Log activity
            await addDoc(collection(db, "activities"), {
              type: "song",
              action: "Uploaded new song",
              title: selectedFile.name,
              userId: auth.currentUser.uid,
              createdAt: serverTimestamp(),
            });

            toast({
              title: "Success",
              description: "Song added successfully",
            });

            // Clean up and reset state
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
          description:
            "Invalid YouTube URL. Please check the URL and try again.",
          variant: "destructive",
        });
        return;
      }
      const videoData = {
        url: videoUrl,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        title: "YouTube Video",
        thumbnailUrl: getYouTubeThumbnailUrl(videoId),
      };
      await addDoc(collection(db, "videos"), videoData);
      await addDoc(collection(db, "activities"), {
        type: "video",
        action: "Added new video",
        title: videoUrl,
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });
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
      if (currentAudio) currentAudio.pause();
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

  const handleDeleteSong = async (songId: string, storageRefPath: string) => {
    if (!auth.currentUser?.uid) return;
    try {
      await deleteObject(ref(storage, storageRefPath));
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
    <div className="min-h-screen flex flex-col bg-background text-gray-100">
      {/* Se eliminó el Header para esta página específica */}
      <main className="flex-1 pt-0">
        {/* Sección Hero con video de fondo y overlay mejorado */}
        <div className="relative w-full h-[65vh] md:h-[75vh] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source
              src="/src/images/videos/Standard_Mode_Generated_Video.mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-background" />
          
          <div className="absolute inset-0 z-10 flex flex-col justify-center md:justify-end">
            <div className="container mx-auto px-4 md:px-8 pb-8 md:pb-16">
              <div className="text-center md:text-left mb-8 mt-auto">
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-600 drop-shadow-lg"
                >
                  Welcome to Your Creative Hub
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mt-2 text-base sm:text-lg md:text-xl text-white shadow-sm"
                >
                  Manage and enhance your musical presence from one place
                </motion.p>
              </div>

              {/* Estadísticas en tarjetas mejoradas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Published Videos
                        </p>
                        <h3 className="text-2xl font-bold mt-1">{videos.length}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Video className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Uploaded Songs
                        </p>
                        <h3 className="text-2xl font-bold mt-1">{songs.length}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <Music2 className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-lg hover:shadow-xl transition-all duration-300">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">
                          Active Strategies
                        </p>
                        <h3 className="text-2xl font-bold mt-1">{currentStrategy.length}</h3>
                      </div>
                      <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                        <BarChart2 className="h-6 w-6 text-orange-500" />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido principal con ScrollArea */}
        <ScrollArea className="flex-1">
          <div className="container mx-auto px-4 py-10 space-y-10">
            {/* Sección de Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-gradient-to-r from-orange-500/10 to-orange-500/5 rounded-xl p-6 border border-orange-500/20"
            >
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-6">
                <div className="flex items-center gap-4">
                  <Zap className="h-8 w-8 text-orange-500" />
                  <div>
                    <h2 className="text-xl font-bold text-white">Quick Actions</h2>
                    <p className="text-muted-foreground">Manage your content and promotion</p>
                  </div>
                </div>
                
                <div className="flex flex-wrap gap-3 mt-4 md:mt-0 md:ml-auto">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20"
                    onClick={() => setIsVideoDialogOpen(true)}
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Add Video
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20"
                    onClick={() => setIsSongDialogOpen(true)}
                  >
                    <Music2 className="mr-2 h-4 w-4" />
                    Add Song
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20"
                    onClick={() => setIsStrategyDialogOpen(true)}
                  >
                    <BarChart2 className="mr-2 h-4 w-4" />
                    Create Strategy
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border border-orange-500/20 bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Video className="mr-2 h-5 w-5 text-orange-500" />
                      Videos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {isLoadingVideos ? (
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : videos.length > 0 ? (
                      <div className="space-y-2">
                        {videos.slice(0, 3).map((video) => (
                          <div
                            key={video.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-orange-500/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              {video.thumbnailUrl ? (
                                <img
                                  src={video.thumbnailUrl}
                                  alt={video.title}
                                  className="h-10 w-16 object-cover rounded"
                                />
                              ) : (
                                <div className="h-10 w-16 bg-orange-500/10 flex items-center justify-center rounded">
                                  <Video className="h-5 w-5 text-orange-500" />
                                </div>
                              )}
                              <div className="truncate max-w-[150px]">
                                <p className="text-sm font-medium truncate">
                                  {video.title || "YouTube Video"}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(video.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                    onClick={() => handleDeleteVideo(video.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Video</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No videos yet</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                          onClick={() => setIsVideoDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add your first video
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                      onClick={() => setIsVideoGalleryOpen(!isVideoGalleryOpen)}
                    >
                      View All Videos
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border border-orange-500/20 bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Music2 className="mr-2 h-5 w-5 text-orange-500" />
                      Songs
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {isLoadingSongs ? (
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : songs.length > 0 ? (
                      <div className="space-y-2">
                        {songs.slice(0, 3).map((song) => (
                          <div
                            key={song.id}
                            className="flex items-center justify-between p-2 rounded-md hover:bg-orange-500/10 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-10 w-10 rounded-full bg-orange-500/10 text-orange-500 hover:text-orange-600 hover:bg-orange-500/20"
                                onClick={() => togglePlay(song.audioUrl)}
                              >
                                {currentAudio?.src === song.audioUrl && isPlaying ? (
                                  <PauseCircle className="h-5 w-5" />
                                ) : (
                                  <PlayCircle className="h-5 w-5" />
                                )}
                              </Button>
                              <div className="truncate max-w-[150px]">
                                <p className="text-sm font-medium truncate">
                                  {song.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(song.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                    onClick={() => handleDeleteSong(song.id, song.storageRef)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Delete Song</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No songs yet</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                          onClick={() => setIsSongDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add your first song
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                    >
                      View All Songs
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>

                <Card className="border border-orange-500/20 bg-background/60 backdrop-blur-sm hover:bg-background/80 transition-all">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <BarChart2 className="mr-2 h-5 w-5 text-orange-500" />
                      Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pb-4">
                    {isLoadingStrategy ? (
                      <div className="space-y-3">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : strategies.length > 0 ? (
                      <div className="space-y-3">
                        <div className="p-4 rounded-lg bg-orange-500/5">
                          <h3 className="font-medium flex items-center">
                            <TrendingUp className="mr-2 h-4 w-4 text-orange-500" />
                            Current Focus Areas
                          </h3>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {strategies[0]?.focus?.map((area, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="bg-orange-500/10 text-orange-400 border-orange-500/20"
                              >
                                {area}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex justify-between">
                          <div className="text-sm">
                            <p className="text-muted-foreground">Priority</p>
                            <p className="font-medium">{strategies[0]?.priority || "Medium"}</p>
                          </div>
                          <div className="text-sm">
                            <p className="text-muted-foreground">Timeline</p>
                            <p className="font-medium">{strategies[0]?.timeline || "3 months"}</p>
                          </div>
                          <div className="text-sm">
                            <p className="text-muted-foreground">Status</p>
                            <Badge
                              variant={strategies[0]?.status === "active" ? "default" : "secondary"}
                              className={
                                strategies[0]?.status === "active"
                                  ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                  : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                              }
                            >
                              {strategies[0]?.status || "active"}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-muted-foreground">No strategy set</p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="mt-2 text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                          onClick={() => setIsStrategyDialogOpen(true)}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Create your first strategy
                        </Button>
                      </div>
                    )}
                  </CardContent>
                  <CardFooter>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full justify-center text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                      onClick={() => {
                        fetchStrategies();
                        setIsStrategyGalleryOpen(!isStrategyGalleryOpen);
                      }}
                    >
                      View All Strategies
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              </div>
            </motion.div>

            {/* Dialogs */}
            <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Video</DialogTitle>
                  <DialogDescription>
                    Add a YouTube video to your profile. Paste a valid YouTube URL.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="videoUrl">YouTube URL</Label>
                    <Input
                      id="videoUrl"
                      placeholder="https://www.youtube.com/watch?v=..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleVideoSubmit} 
                    disabled={isSubmittingVideo || !videoUrl}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isSubmittingVideo && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Video
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isSongDialogOpen} onOpenChange={setIsSongDialogOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Add Song</DialogTitle>
                  <DialogDescription>
                    Upload an audio file (MP3 or WAV) to your profile.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="songFile">Audio File</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id="songFile"
                        type="file"
                        onChange={handleAudioUpload}
                        accept="audio/mpeg,audio/wav"
                        className="flex-1"
                      />
                      {currentAudio && (
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={() => togglePlay()}
                          className="flex-shrink-0"
                        >
                          {isPlaying ? (
                            <PauseCircle className="h-4 w-4" />
                          ) : (
                            <PlayCircle className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                    {selectedFile && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {selectedFile.name} ({(selectedFile.size / (1024 * 1024)).toFixed(2)} MB)
                      </p>
                    )}
                    {isSubmittingSong && (
                      <div className="mt-2">
                        <p className="text-xs text-muted-foreground mb-1">
                          Uploading: {uploadProgress.toFixed(0)}%
                        </p>
                        <Progress value={uploadProgress} className="h-2" />
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsSongDialogOpen(false);
                    if (currentAudio) {
                      currentAudio.pause();
                      URL.revokeObjectURL(currentAudio.src);
                    }
                    setCurrentAudio(null);
                    setSelectedFile(null);
                    setIsPlaying(false);
                  }}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSongUpload} 
                    disabled={isSubmittingSong || !selectedFile}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    {isSubmittingSong && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Upload Song
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isStrategyGalleryOpen} onOpenChange={setIsStrategyGalleryOpen}>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Your Strategies</DialogTitle>
                  <DialogDescription>
                    View and manage all your marketing strategies.
                  </DialogDescription>
                </DialogHeader>
                <div className="mt-2">
                  {strategies.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-muted-foreground">No strategies yet</p>
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => {
                          setIsStrategyGalleryOpen(false);
                          setIsStrategyDialogOpen(true);
                        }}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create your first strategy
                      </Button>
                    </div>
                  ) : (
                    <ScrollArea className="flex-grow pr-4">
                      <div className="space-y-4 py-4">
                        {strategies.map((strategy) => (
                          <motion.div
                            key={strategy.id}
                            className="p-4 rounded-lg border hover:bg-orange-500/5 transition-colors cursor-pointer"
                            whileHover={{ scale: 1.01 }}
                            onClick={() => {
                              setSelectedStrategy(strategy);
                              setIsStrategyDialogOpen(true);
                            }}
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">Marketing Strategy</h3>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(strategy.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge
                                variant={strategy.status === "active" ? "default" : "secondary"}
                                className={
                                  strategy.status === "active"
                                    ? "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                    : "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                                }
                              >
                                {strategy.status}
                              </Badge>
                            </div>
                            <div className="mt-2">
                              <p className="text-sm font-medium mt-2">Focus Areas:</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {strategy.focus.map((focus, index) => (
                                  <Badge
                                    key={index}
                                    variant="outline"
                                    className="bg-orange-500/10 text-orange-400 border-orange-500/20"
                                  >
                                    {focus}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </ScrollArea>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsStrategyGalleryOpen(false)}
                  >
                    Close
                  </Button>
                  <Button
                    onClick={() => {
                      setIsStrategyGalleryOpen(false);
                      setSelectedStrategy(null);
                      setIsStrategyDialogOpen(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    New Strategy
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Sección Analytics y Performance */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2"
              >
                <ActivityFeed />
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <RightsManagementCard />
              </motion.div>
            </div>
            
            {/* Sección Distribution */}
            <div className="grid grid-cols-1 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <DistributionCard />
              </motion.div>
            </div>
          </div>
        </ScrollArea>

        <StrategyDialog
          open={isStrategyDialogOpen}
          onOpenChange={setIsStrategyDialogOpen}
          selectedStrategy={selectedStrategy}
          onStrategyUpdate={fetchStrategies}
        />
      </main>
    </div>
  );
}