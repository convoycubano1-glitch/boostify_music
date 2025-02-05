import { useState, useEffect } from "react";
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
  ChevronRight,
  Trash2,
  CheckCircle2
} from "lucide-react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { db, auth, storage } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, orderBy } from "firebase/firestore";
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
import { ActivityFeed } from "@/components/activity/activity-feed";
import { RightsManagementCard } from "@/components/rights/rights-management-card";
import { DistributionCard } from "@/components/distribution/distribution-card";

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
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

function getYouTubeThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export default function ArtistDashboard() {
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
  const [isStrategyGalleryOpen, setIsStrategyGalleryOpen] = useState(false);
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [selectedStrategy, setSelectedStrategy] = useState<Strategy | null>(null);


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

  // Fetch strategies
  const { data: currentStrategy = [], isLoading: isLoadingStrategy, refetch: refetchStrategy } = useQuery({
    queryKey: ["strategies", auth.currentUser?.uid],
    queryFn: async () => {
      if (!auth.currentUser?.uid) return [];

      try {
        const strategiesRef = collection(db, "strategies");
        const q = query(
          strategiesRef,
          where("userId", "==", auth.currentUser.uid)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
          console.log("No strategies found");
          return [];
        }

        const strategies = querySnapshot.docs.map(doc => ({
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date()
        }));

        strategies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        const latestStrategy = strategies[0];
        console.log("Latest strategy:", latestStrategy);
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

  const fetchStrategies = async () => {
    if (!auth.currentUser?.uid) return;

    try {
      const strategiesRef = collection(db, "strategies");
      // Simplificar la consulta para evitar el error de índice
      const q = query(
        strategiesRef,
        where("userId", "==", auth.currentUser.uid)
      );

      const querySnapshot = await getDocs(q);
      const fetchedStrategies = querySnapshot.docs.map(doc => {
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
          userId: data.userId
        } as Strategy;
      });

      // Ordenar en memoria
      fetchedStrategies.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      console.log("Fetched strategies:", fetchedStrategies);
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


  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024; 
      if (file.size > maxSize) {
        toast({
          title: "Error",
          description: "File size must be less than 10MB",
          variant: "destructive",
        });
        return;
      }

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

      const storageRef = ref(storage, `songs/${auth.currentUser.uid}/${Date.now()}_${selectedFile.name}`);

      const uploadTask = uploadBytesResumable(storageRef, selectedFile);

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
            const downloadURL = await getDownloadURL(storageRef);

            const songData = {
              name: selectedFile.name,
              audioUrl: downloadURL,
              storageRef: storageRef.fullPath,
              userId: auth.currentUser.uid,
              createdAt: serverTimestamp()
            };

            const songsRef = collection(db, "songs");
            await addDoc(songsRef, songData);

            const activityData = {
                type: 'song',
                action: 'Uploaded new song',
                title: selectedFile.name,
                userId: auth.currentUser.uid,
                createdAt: serverTimestamp()
            };
            await addDoc(collection(db, "activities"), activityData);

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
      const activityData = {
          type: 'video',
          action: 'Added new video',
          title: videoUrl,
          userId: auth.currentUser.uid,
          createdAt: serverTimestamp()
      };
      await addDoc(collection(db, "activities"), activityData);


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
      const fileRef = ref(storage, storageRef);
      await deleteObject(fileRef);

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

      <div className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden mt-[80px] md:mt-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/assets/Standard_Mode_Generated_Video (7).mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background" />

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end md:justify-end pb-12 md:pb-12 pt-48 md:pt-96">
          <div className="text-center md:text-left mb-12">
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
              Welcome to Your Creative Hub
            </h1>
            <p className="text-muted-foreground mt-2">
              Manage and enhance your musical presence from one place
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Published Videos</p>
                  <h3 className="text-2xl font-bold mt-1">{videos.length}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Video className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </Card>
            <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Uploaded Songs</p>
                  <h3 className="text-2xl font-bold mt-1">{songs.length}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <Music2 className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </Card>
            <Card className="p-6 border-l-4 border-orange-500 bg-background/80 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Strategies</p>
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

      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-orange-500/5 rounded-lg p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center flex-shrink-0">
                <Info className="h-5 w-5 text-orange-500" />
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-2">Tips to Optimize Your Dashboard</h3>
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
                        <h2 className="text-xl font-semibold">My Videos</h2>
                        <p className="text-sm text-muted-foreground">Manage your video content</p>
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
                      <h2 className="text-xl font-semibold">My Music</h2>
                      <p className="text-sm text-muted-foreground">Manage your music portfolio</p>
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
                                    <p className="text-sm font-medium">
                                      {selectedFile?.name}
                                    </p>
                                    {uploadProgress > 0 && uploadProgress < 100 && (
                                      <div className="h-1 w-full bg-muted-foreground/20 rounded-full overflow-hidden">
                                        <div
                                          className="h-full bg-orange-500 transition-all duration-300"
                                          style={{ width: `${uploadProgress}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (currentAudio) {
                                          currentAudio.currentTime = Math.max(0, currentAudio.currentTime - 10);
                                        }
                                      }}
                                    >
                                      -10s
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        if (currentAudio) {
                                          currentAudio.currentTime = Math.min(
                                            currentAudio.duration,
                                            currentAudio.currentTime + 10
                                          );
                                        }
                                      }}
                                    >
                                      +10s
                                    </Button>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      if (currentAudio) {
                                        currentAudio.pause();
                                        currentAudio.currentTime = 0;
                                        setIsPlaying(false);
                                      }
                                    }}
                                  >
                                    Reset
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                          <div className="flex justify-end gap-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setIsSongDialogOpen(false);
                                if (currentAudio) {
                                  currentAudio.pause();
                                  URL.revokeObjectURL(currentAudio.src);
                                  setCurrentAudio(null);
                                }
                                setSelectedFile(null);
                                setIsPlaying(false);
                                setUploadProgress(0);
                              }}
                            >
                              <X className="mr-2 h-4 w-4" />
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSongUpload}
                              disabled={isSubmittingSong || !selectedFile}
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
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </Card>
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

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <Card className="p-6 h-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <BarChart2 className="h-6 w-6 text-orange-500" />
                      </div>
                      <div>
                        <h2 className="text-xl font-semibold">My Strategy</h2>
                        <p className="text-sm text-muted-foreground">Plan your growth and success</p>
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

                  <Dialog open={isStrategyGalleryOpen} onOpenChange={setIsStrategyGalleryOpen}>
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
                                    Created on {strategy.createdAt.toLocaleDateString()}
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
                              <li key={index} className="flex items-start gap-2 text-sm">
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
      </ScrollArea>

      <StrategyDialog
        open={isStrategyDialogOpen}
        onOpenChange={setIsStrategyDialogOpen}
        selectedStrategy={selectedStrategy}
        onStrategyUpdate={fetchStrategies}
      />
    </div>
  );
}