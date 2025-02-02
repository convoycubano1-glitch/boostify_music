import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { 
  Video,
  Music2,
  BarChart2,
  DollarSign,
  Users,
  Plus,
  PlayCircle,
  Mic2,
  Link as LinkIcon,
  Upload,
  Loader2,
  X,
  Grid,
  ArrowLeft,
  Trash2
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc } from "firebase/firestore";
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
  audio: string;
  createdAt: Date;
}

function getYouTubeVideoId(url: string) {
  const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[7].length === 11) ? match[7] : null;
}

function getYouTubeThumbnailUrl(videoId: string) {
  return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`;
}

export default function ArtistDashboardPage() {
  const { toast } = useToast();
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isSongDialogOpen, setIsSongDialogOpen] = useState(false);
  const [isVideoGalleryOpen, setIsVideoGalleryOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [isSubmittingVideo, setIsSubmittingVideo] = useState(false);
  const [isSubmittingSong, setIsSubmittingSong] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

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

  const handleAudioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        // Convertir el archivo a base64
        const reader = new FileReader();
        reader.onload = async (e) => {
          if (e.target?.result) {
            const audio = new Audio();
            audio.src = e.target.result as string;
            setCurrentAudio(audio);
            setIsPlaying(false);
          }
        };
        reader.readAsDataURL(file);
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

  const togglePlay = (audioData?: string) => {
    if (audioData && (!currentAudio || currentAudio.src !== audioData)) {
      if (currentAudio) {
        currentAudio.pause();
      }
      const audio = new Audio(audioData);
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

  const handleSongUpload = async () => {
    if (!auth.currentUser?.uid || !currentAudio) return;

    try {
      setIsSubmittingSong(true);

      // Extraer el nombre del archivo
      const fileName = currentAudio.src.split("/").pop()?.split(";")[0] || "Untitled Song";

      const songData = {
        name: fileName,
        audio: currentAudio.src, // Guardamos el audio en base64
        userId: auth.currentUser.uid,
        createdAt: serverTimestamp()
      };

      const songsRef = collection(db, "songs");
      await addDoc(songsRef, songData);

      toast({
        title: "Success",
        description: "Song added successfully",
      });

      setIsSongDialogOpen(false);
      if (currentAudio) {
        currentAudio.pause();
        setCurrentAudio(null);
        setIsPlaying(false);
      }
      refetchSongs();

    } catch (error) {
      console.error("Error adding song:", error);
      toast({
        title: "Error",
        description: "Failed to add song. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmittingSong(false);
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

  const handleDeleteSong = async (songId: string) => {
    if (!auth.currentUser?.uid) return;

    try {
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Artist Dashboard
              </h1>
              <p className="text-muted-foreground mt-2">
                Manage your content, strategy, and growth
              </p>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* My Videos Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
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

            {/* My Songs Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Music2 className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">My Songs</h2>
                    <p className="text-sm text-muted-foreground">Track your music portfolio</p>
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
                              onClick={() => togglePlay(song.audio)}
                            >
                              {currentAudio?.src === song.audio && isPlaying ? "Pause" : "Play"}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteSong(song.id)}
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
                          Upload your MP3 or WAV file
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
                                    {currentAudio.src.split("/").pop()}
                                  </p>
                                </div>
                              </div>
                            </div>
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

            {/* My Strategy Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <BarChart2 className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">My Strategy</h2>
                    <p className="text-sm text-muted-foreground">Plan your growth</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Current Focus</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li>• Increase social media presence</li>
                      <li>• Launch new EP campaign</li>
                      <li>• Collaborate with other artists</li>
                    </ul>
                  </div>
                  <Button className="w-full">Update Strategy</Button>
                </div>
              </Card>
            </motion.div>

            {/* My Budget Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <DollarSign className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">My Budget</h2>
                    <p className="text-sm text-muted-foreground">Track your finances</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Monthly Budget</p>
                      <p className="text-lg font-semibold">$2,500</p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">Spent</p>
                      <p className="text-lg font-semibold">$1,200</p>
                    </div>
                  </div>
                  <Button className="w-full">Manage Budget</Button>
                </div>
              </Card>
            </motion.div>

            {/* My Contacts Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Card className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold">My Contacts</h2>
                    <p className="text-sm text-muted-foreground">Manage your network</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <p className="font-medium">Recent Contacts</p>
                      <span className="text-sm text-muted-foreground">Total: 24</span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        • Sarah Johnson - Producer
                      </div>
                      <div className="text-sm text-muted-foreground">
                        • Mike Smith - Studio Manager
                      </div>
                    </div>
                  </div>
                  <Link href="/contacts">
                    <Button className="w-full">View All Contacts</Button>
                  </Link>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}