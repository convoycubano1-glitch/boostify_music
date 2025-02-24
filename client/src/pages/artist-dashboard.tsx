import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { ArtistProfileCard } from "@/components/artist/artist-profile-card";
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
  ChevronRight,
  Trash2,
  CheckCircle2,
  Share2,
  Calendar,
  Download,
  User
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { StrategyDialog } from "@/components/strategy/strategy-dialog";
import { ActivityFeed } from "@/components/activity/activity-feed";
import { RightsManagementCard } from "@/components/rights/rights-management-card";
import { DistributionCard } from "@/components/distribution/distribution-card";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell
} from 'recharts';
import { MusicManager } from "@/components/music/music-manager";

const COLORS = ['#f97316', '#fb923c', '#fdba74', '#fed7aa'];

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

function getYouTubeVideoId(url: string) {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
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
  const [selectedPeriod, setSelectedPeriod] = useState("7d");
  const [showProfileCard, setShowProfileCard] = useState(false);

  // Datos de ejemplo para las métricas
  const musicMetrics = {
    totalStreams: 1234567,
    monthlyListeners: 234567,
    topCountries: [
      { name: "United States", value: 40 },
      { name: "United Kingdom", value: 25 },
      { name: "Germany", value: 20 },
      { name: "France", value: 15 }
    ],
    revenueGrowth: 23.5
  };

  const generateTimeData = (days: number) => {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(2024, 0, i + 1).toLocaleDateString(),
      streams: Math.floor(Math.random() * 1000) + 500,
      engagement: Math.floor(Math.random() * 800) + 300,
      revenue: Math.floor(Math.random() * 600) + 200,
    }));
  };

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
  const handleAudioUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }
      if (!file.type.startsWith("audio/")) {
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
      const storageRefPath = `songs/${auth.currentUser.uid}/${Date.now()}_${selectedFile.name}`;
      const storageRefObj = ref(storage, storageRefPath);
      const uploadTask = uploadBytesResumable(storageRefObj, selectedFile);
      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
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
            const downloadURL = await getDownloadURL(storageRefObj);
            const songData = {
              name: selectedFile.name,
              audioUrl: downloadURL,
              storageRef: storageRefObj.fullPath,
              userId: auth.currentUser.uid,
              createdAt: serverTimestamp(),
            };
            await addDoc(collection(db, "songs"), songData);
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
      <Header />
      <main className="flex-1 pt-20">
        {/* Sección Hero con video de fondo y overlay */}
        <div className="relative w-full h-[80vh] md:h-[90vh] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source
              src="/assets/Standard_Mode_Generated_Video (7).mp4"
              type="video/mp4"
            />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/30 to-background" />

          {/* Profile Card Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 right-4 z-20"
          >
            <Button
              size="lg"
              className="bg-orange-500 hover:bg-orange-600 text-white"
              onClick={() => setShowProfileCard(true)}
            >
              <User className="mr-2 h-5 w-5" />
              View Artist Profile
            </Button>
          </motion.div>

          {/* Profile Card Dialog */}
          <Dialog open={showProfileCard} onOpenChange={setShowProfileCard}>
            <DialogContent className="max-w-7xl h-[90vh] overflow-hidden p-0">
              <DialogHeader className="px-6 pt-6">
                <DialogTitle className="text-2xl font-bold">Artist Profile</DialogTitle>
              </DialogHeader>
              <ScrollArea className="h-full px-6 pb-6">
                <ArtistProfileCard artistId={auth.currentUser?.uid || "1"} />
              </ScrollArea>
            </DialogContent>
          </Dialog>

          <div className="relative z-10 container mx-auto h-full flex flex-col justify-end items-center md:items-start px-4 md:px-8 py-8">
            <div className="text-center md:text-left mb-12">
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl sm:text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70 drop-shadow-lg"
              >
                Welcome to Your Creative Hub
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-2 text-base sm:text-lg md:text-xl text-muted-foreground"
              >
                Manage and enhance your musical presence from one place
              </motion.p>
            </div>

            {/* Estadísticas en tarjetas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
              <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-sm">
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
              <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-sm">
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
              <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm shadow-sm">
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
            </div>
          </div>
        </div>

        {/* Contenido principal con ScrollArea */}
        <ScrollArea className="flex-1">
          <div className="container mx-auto px-4 py-8 space-y-8">
            {/* Sección de Tips */}
            <div className="bg-orange-500/5 rounded-lg p-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Info className="h-5 w-5 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Tips to Optimize Your Dashboard
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-orange-500" />
                      Keep your content fresh by regularly uploading videos and music
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-orange-500" />
                      Review and update your strategy monthly to maintain focus
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-orange-500" />
                      Use our AI tools to generate ideas and optimize your content
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                {/* Sección de Videos */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <Card className="p-6 h-full shadow-md rounded-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <Video className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">My Videos</h2>
                          <p className="text-sm text-muted-foreground">
                            Manage your video content
                          </p>
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
                            <div
                              key={video.id}
                              className="flex justify-between items-center p-3 bg-muted/50 rounded-lg transition-all hover:shadow-lg"
                            >
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
                                  onClick={() =>
                                    window.open(video.url, "_blank")
                                  }
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
                      <Dialog
                        open={isVideoGalleryOpen}
                        onOpenChange={setIsVideoGalleryOpen}
                      >
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
                                      onClick={() =>
                                        window.open(video.url, "_blank")
                                      }
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

                      {/* Add New Video Dialog */}
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
                                  title="YouTube Preview"
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
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />                                    Adding...
                                  </>
                                ) : (
                                  <>
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Video
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </Card>
                </motion.div>

                {/* Sección de Música */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <motion.div variants={item}>
                    <Card className="relative overflow-hidden">
                      <div className="p-6">
                        <div className="flex items-center gap-4 mb-6">
                          <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                            <Music2 className="h-6 w-6 text-orange-500" />
                          </div>
                          <div>
                            <h2 className="text-xl font-semibold">My Music</h2>
                            <p className="text-sm text-muted-foreground">
                              Manage your music portfolio
                            </p>
                          </div>
                        </div>
                        <MusicManager />
                      </div>
                    </Card>
                  </motion.div>
                </motion.div>
              </div>

              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <ActivityFeed />
                </motion.div>

                {/* Sección de Estrategia */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="p-6 h-full shadow-md rounded-lg">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                          <BarChart2 className="h-6 w-6 text-orange-500" />
                        </div>
                        <div>
                          <h2 className="text-xl font-semibold">My Strategy</h2>
                          <p className="text-sm text-muted-foreground">
                            Plan your growth and success
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsStrategyGalleryOpen(true)}
                          className="hidden sm:flex"
                        >
                          View All Strategies
                        </Button>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setIsStrategyDialogOpen(true)}
                        >
                          Create Strategy
                        </Button>
                      </div>
                    </div>

                    <Dialog
                      open={isStrategyGalleryOpen}
                      onOpenChange={setIsStrategyGalleryOpen}
                    >
                      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
                        <DialogHeader>
                          <div className="flex items-center justify-between">
                            <div>
                              <DialogTitle>Strategy Gallery</DialogTitle>
                              <DialogDescription>
                                View and manage all your growth strategies
                              </DialogDescription>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setIsStrategyGalleryOpen(false)}
                              className="h-8 w-8 p-0"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </DialogHeader>
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
                                <div className="flex items-center justify-between">
                                  <div>
                                    <p className="font-medium">
                                      {strategy.targetAudience} - {strategy.timeline}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      Created on{" "}
                                      {strategy.createdAt.toLocaleDateString()}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <div className="px-2 py-1 rounded-full text-xs bg-orange-500/10 text-orange-500">
                                      {strategy.priority} Priority
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                                <div className="mt-2">
                                  <p className="text-sm text-muted-foreground line-clamp-2">
                                    {strategy.focus[0]}
                                  </p>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </ScrollArea>
                      </DialogContent>
                    </Dialog>

                    <div className="space-y-4">
                      {currentStrategy.length > 0 ? (
                        <div className="space-y-3">
                          <div className="p-4 rounded-lg bg-orange-500/5">
                            <h3 className="font-medium mb-2">Current Focus</h3>
                            <ul className="space-y-2">
                              {currentStrategy.slice(0, 3).map((item, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-orange-500 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                            {currentStrategy.length > 3 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => setIsStrategyDialogOpen(true)}
                              >
                                View More
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No active strategy</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2"
                            onClick={() => setIsStrategyDialogOpen(true)}
                          >
                            Create Your First Strategy
                          </Button>
                        </div>
                      )}
                    </div>
                  </Card>
                </motion.div>

                {/* Otros módulos de gestión */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <RightsManagementCard />
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <DistributionCard />
                </motion.div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Dashboard Analytics Section */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <Card className="p-6 backdrop-blur-sm border-orange-500/10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <BarChart2 className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">Performance Analytics</h2>
                        <p className="text-sm text-muted-foreground">
                          Track your music performance metrics
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" className="gap-2" onClick={() => setSelectedPeriod("7d")}>
                        <Calendar className="h-4 w-4" />
                        7 días
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => setSelectedPeriod("30d")}>
                        <Calendar className="h-4 w-4" />
                        30 días
                      </Button>
                      <Button variant="outline" className="gap-2" onClick={() => setSelectedPeriod("12m")}>
                        <Calendar className="h-4 w-4" />
                        12 meses
                      </Button>
                      <Button className="bg-orange-500 hover:bg-orange-600 gap-2">
                        <Download className="h-4 w-4" />
                        Export Report
                      </Button>
                    </div>
                  </div>

                  {/* KPI Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Card className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Music2 className="h-4 w-4 text-orange-500" />
                          <h3 className="text-sm font-medium">Total Streams</h3>
                        </div>
                        <p className="text-2xl font-bold">{musicMetrics.totalStreams.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-green-500">↑ 12.5%</span> vs last period
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Users className="h-4 w-4 text-orange-500" />
                          <h3 className="text-sm font-medium">Monthly Listeners</h3>
                        </div>
                        <p className="text-2xl font-bold">{musicMetrics.monthlyListeners.toLocaleString()}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-green-500">↑ 8.3%</span> vs last month
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <DollarSign className="h-4 w-4 text-orange-500" />
                          <h3 className="text-sm font-medium">Revenue Growth</h3>
                        </div>
                        <p className="text-2xl font-bold">+{musicMetrics.revenueGrowth}%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Monthly growth
                        </p>
                      </div>
                    </Card>

                    <Card className="p-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-orange-500/5 to-transparent" />
                      <div className="relative">
                        <div className="flex items-center gap-2 mb-2">
                          <Share2 className="h-4 w-4 text-orange-500" />
                          <h3 className="text-sm font-medium">Social Engagement</h3>
                        </div>
                        <p className="text-2xl font-bold">87.2%</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          <span className="text-green-500">↑ 5.2%</span> engagement rate
                        </p>
                      </div>
                    </Card>
                  </div>

                  {/* Performance Charts */}
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Performance Overview</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={generateTimeData(30)}>
                            <defs>
                              <linearGradient id="colorPerformance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0.1}/>
                                <stop offset="95%" stopColor="hsl(24, 95%, 53%)" stopOpacity={0}/>
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
                              dataKey="streams"
                              name="Streams"
                              stroke="hsl(24, 95%, 53%)"
                              fillOpacity={1}
                              fill="url(#colorPerformance)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold mb-4">Geographic Distribution</h3>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RePieChart>
                            <Pie
                              data={musicMetrics.topCountries}
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                            >
                              {musicMetrics.topCountries.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                          </RePieChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        {musicMetrics.topCountries.map((country, index) => (
                          <div key={country.name} className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="text-sm">{country.name}</span>
                            <span className="text-sm text-muted-foreground ml-auto">
                              {country.value}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
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