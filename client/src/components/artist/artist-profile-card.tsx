import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Play,
  Pause,
  Music2,
  Video as VideoIcon,
  FileText,
  ChartBar,
  User,
  MapPin,
  Mail,
  Phone,
  Globe,
  Instagram,
  Twitter,
  Youtube,
  Share2,
  Calendar,
  HeartPulse,
  Users,
  DollarSign,
  Loader2,
  ShoppingBag,
  Ticket,
  MessageCircle,
  Shirt,
  Paintbrush,
  Check,
  X,
  Link as LinkIcon
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
import "react-circular-progressbar/dist/styles.css";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";
import { CreditCard } from "lucide-react";

export interface ArtistProfileProps {
  artistId: string;
}

interface Song {
  id: string;
  name: string;
  duration?: string;
  audioUrl: string;
  userId: string;
  createdAt?: any;
  storageRef?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnailUrl?: string;
  url: string;
  userId: string;
  createdAt?: any;
}

// Add ShareDialog component
const ShareDialog = ({ isOpen, onClose, artistName, artistUrl }: { isOpen: boolean; onClose: (value?: boolean | undefined) => void; artistName: string; artistUrl: string }) => {
  const shareData = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(artistUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(artistUrl)}&text=Check out ${artistName}'s profile`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out ${artistName}'s profile: ${artistUrl}`)}`,
    instagram: `instagram://camera`, // Instagram doesn't support direct sharing, opens the app
    tiktok: `https://www.tiktok.com/upload/`, // TikTok doesn't support direct sharing, opens upload page
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Share Profile</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            className="w-full bg-[#1877F2] hover:bg-[#166FE5]"
            onClick={() => window.open(shareData.facebook, '_blank')}
          >
            Share on Facebook
          </Button>
          <Button
            className="w-full bg-[#1DA1F2] hover:bg-[#1A91DA]"
            onClick={() => window.open(shareData.twitter, '_blank')}
          >
            Share on Twitter/X
          </Button>
          <Button
            className="w-full bg-[#25D366] hover:bg-[#128C7E]"
            onClick={() => window.open(shareData.whatsapp, '_blank')}
          >
            Share on WhatsApp
          </Button>
          <Button
            className="w-full bg-[#E4405F] hover:bg-[#D93248]"
            onClick={() => window.open(shareData.instagram, '_blank')}
          >
            Share on Instagram
          </Button>
          <Button
            className="w-full bg-[#000000] hover:bg-[#333333]"
            onClick={() => window.open(shareData.tiktok, '_blank')}
          >
            Share on TikTok
          </Button>
          <Button
            className="w-full"
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(artistUrl);
              toast({
                title: "Link copied!",
                description: "Profile link has been copied to your clipboard.",
              });
            }}
          >
            <LinkIcon className="mr-2 h-4 w-4" />
            Copy Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export function ArtistProfileCard({ artistId }: ArtistProfileProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const { toast } = useToast();

  // Query para obtener canciones
  const { data: songs = [], isLoading: isLoadingSongs, isError: isSongsError } = useQuery({
    queryKey: ["songs", artistId],
    queryFn: async () => {
      try {
        console.log("Fetching songs for artistId:", artistId);
        const songsRef = collection(db, "songs");
        const q = query(songsRef);
        const querySnapshot = await getDocs(q);
        const songData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Raw song data:", data);
          return {
            id: doc.id,
            name: data.name || "Untitled",
            duration: "3:45", // Duración por defecto
            audioUrl: data.audioUrl || "",
            userId: data.userId || "",
            createdAt: data.createdAt,
            storageRef: data.storageRef
          };
        });

        // Filtramos por userId
        const filteredSongs = songData.filter(song => song.userId === artistId);
        console.log("Filtered songs:", filteredSongs);
        return filteredSongs;
      } catch (error) {
        console.error("Error fetching songs:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar las canciones",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  // Query para obtener videos
  const { data: videos = [], isLoading: isLoadingVideos, isError: isVideosError } = useQuery({
    queryKey: ["videos", artistId],
    queryFn: async () => {
      try {
        console.log("Fetching videos for artistId:", artistId);
        const videosRef = collection(db, "videos");
        const q = query(videosRef);
        const querySnapshot = await getDocs(q);
        const videoData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          console.log("Raw video data:", data);
          const videoId = data.url?.split('v=')?.[1] || data.url?.split('/')?.[3]?.split('?')?.[0];
          return {
            id: doc.id,
            title: data.title || "Untitled",
            url: data.url || "",
            userId: data.userId || "",
            thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined,
            createdAt: data.createdAt
          };
        });

        // Filtramos por userId
        const filteredVideos = videoData.filter(video => video.userId === artistId);
        console.log("Filtered videos:", filteredVideos);
        return filteredVideos;
      } catch (error) {
        console.error("Error fetching videos:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los videos",
          variant: "destructive",
        });
        return [];
      }
    },
  });

  const togglePlay = (song: Song, index: number) => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setIsPlaying(false);
    }

    if (song.audioUrl) {
      const audio = new Audio(song.audioUrl);
      audio.play().catch((error) => {
        console.error("Error playing audio:", error);
        toast({
          title: "Error",
          description: "No se pudo reproducir el audio",
          variant: "destructive",
        });
      });
      setCurrentAudio(audio);
      setCurrentTrack(index);
      setIsPlaying(true);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.3 },
    },
  };

  const MusicSection = () => (
    <Card className="p-6 bg-black/30 backdrop-blur-sm border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
      <motion.div variants={itemVariants}>
        <h3 className="text-2xl font-semibold mb-6 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
          <Music2 className="w-6 h-6 mr-2 text-orange-500" />
          Latest Tracks
        </h3>
        <div className="space-y-4">
          {isLoadingSongs ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : songs.length === 0 ? (
            <p className="text-center text-muted-foreground">No tracks available</p>
          ) : (
            songs.map((song, index) => (
              <div
                key={song.id}
                className={`flex items-center justify-between p-4 rounded-lg transition-all duration-300 ${
                  currentTrack === index
                    ? "bg-orange-500/20 scale-102"
                    : "hover:bg-orange-500/10 hover:scale-101"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePlay(song, index)}
                    className={`rounded-full transition-transform duration-300 ${
                      currentTrack === index && isPlaying
                        ? "bg-orange-500 text-white hover:bg-orange-600 scale-110"
                        : "hover:bg-orange-500/10"
                    }`}
                  >
                    {currentTrack === index && isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <div>
                    <span className="font-medium">{song.name}</span>
                    <span className="text-sm text-muted-foreground block">
                      {new Date(song.createdAt?.seconds * 1000).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-muted-foreground">
                  {song.duration || "3:45"}
                </span>
              </div>
            ))
          )}
        </div>
      </motion.div>
    </Card>
  );

  const VideosSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {isLoadingVideos ? (
        <div className="col-span-full flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      ) : videos.length === 0 ? (
        <p className="col-span-full text-center text-muted-foreground">No videos available</p>
      ) : (
        videos.map((video) => {
          // Extraer el ID del video correctamente de diferentes formatos de URL
          const videoId = video.url?.split('v=')?.[1]?.split('&')?.[0] ||
            video.url?.split('/')?.[3]?.split('?')?.[0] ||
            video.url?.split('youtu.be/')?.[1]?.split('?')?.[0];

          return (
            <motion.div
              key={video.id}
              className="aspect-video relative group rounded-lg overflow-hidden transform transition-all duration-300 hover:scale-105"
              whileHover={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-full h-full">
                <iframe
                  className="w-full h-full rounded-lg"
                  src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                ></iframe>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/30 to-transparent">
                <h4 className="text-white font-medium truncate mb-2">{video.title}</h4>
                <p className="text-sm text-white/70">
                  {new Date(video.createdAt?.seconds * 1000).toLocaleDateString()}
                </p>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="w-full max-w-7xl mx-auto"
    >
      <div className="relative h-[90vh] w-screen -mx-[calc(50vw-50%)] overflow-hidden mb-8">
        <div className="relative h-full w-full">
          {/* Video container with responsive design */}
          <div className="absolute inset-0 w-full h-full">
            {videos && videos[0] ? (
              <iframe
                className="w-full h-full object-cover"
                src={`https://www.youtube.com/embed/${
                  videos[0].url?.split('v=')?.[1]?.split('&')?.[0] || 
                  videos[0].url?.split('/')?.[3]?.split('?')?.[0] ||
                  videos[0].url?.split('youtu.be/')?.[1]?.split('?')?.[0]
                }?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&playlist=${
                  videos[0].url?.split('v=')?.[1]?.split('&')?.[0] ||
                  videos[0].url?.split('/')?.[3]?.split('?')?.[0] ||
                  videos[0].url?.split('youtu.be/')?.[1]?.split('?')?.[0]
                }`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                <VideoIcon className="w-16 h-16 text-orange-500/50" />
              </div>
            )}
          </div>
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />

          <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
            <motion.div variants={itemVariants} className="max-w-4xl mx-auto">
              <motion.h1
                className="text-4xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 via-orange-300 to-yellow-500"
                variants={itemVariants}
              >
                {mockArtist.name}
              </motion.h1>
              <motion.p
                className="text-xl md:text-2xl font-semibold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400"
                variants={itemVariants}
              >
                {mockArtist.genre}
              </motion.p>
              <div className="prose prose-invert max-w-2xl mb-8">
                <motion.p
                  className="text-base md:text-lg text-white/90 leading-relaxed"
                  variants={itemVariants}
                >
                  Un virtuoso del Blues Latin fusion que ha revolucionado la escena musical de Miami. Con más de una década fusionando los ritmos ardientes del Caribe con el alma profunda del Blues, Redwine ha creado un sonido único que refleja la diversidad cultural de Miami. Sus actuaciones en vivo son una experiencia inmersiva donde la pasión latina se encuentra con la autenticidad del Blues.
                </motion.p>
              </div>
              <motion.div className="flex flex-wrap gap-4" variants={itemVariants}>
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 text-white shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => setShowMessageDialog(true)}
                >
                  <MessageCircle className="mr-2 h-5 w-5" />
                  Contact Me
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all duration-300"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Share Profile
                </Button>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* New Release Section */}
          <Card className="p-8 mb-8 bg-gradient-to-r from-orange-500/10 via-orange-500/5 to-transparent border-orange-500/20">
            <motion.div variants={itemVariants} className="flex items-center gap-8">
              <div className="relative group">
                {songs && songs[0] ? (
                  <>
                    <div className="w-48 h-48 rounded-lg shadow-lg transition-transform group-hover:scale-105 duration-300 bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center overflow-hidden">
                      <Music2 className="w-16 h-16 text-orange-500/50" />
                      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-xl" />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <div className="absolute bottom-4 left-4">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePlay(songs[0], 0)}
                          className="rounded-full bg-orange-500 text-white hover:bg-orange-600 hover:scale-110 transition-all duration-300"
                        >
                          {currentTrack === 0 && isPlaying ? (
                            <Pause className="h-8 w-8" />
                          ) : (
                            <Play className="h-8 w-8" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="w-48 h-48 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-pink-500">
                  {songs && songs[0] ? songs[0].name : "Loading..."}
                </h3>
                <p className="text-lg text-muted-foreground mb-4">
                  Added {songs && songs[0] ? new Date(songs[0].createdAt?.seconds * 1000).toLocaleDateString() : "..."}
                </p>
                <Button
                  className="bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300"
                  onClick={() => songs && songs[0] && togglePlay(songs[0], 0)}
                >
                  <Music2 className="mr-2 h-5 w-5" />
                  Play Now
                </Button>
              </div>
            </motion.div>
          </Card>

          <MusicSection />
          <VideosSection />

          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                <Calendar className="w-6 h-6 mr-2 text-orange-500" />
                Upcoming Shows
              </h3>
              <div className="space-y-4">
                {mockArtist.upcomingShows.map((show) => (
                  <div
                    key={show.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div>
                      <p className="font-medium">{show.venue}</p>
                      <p className="text-sm text-muted-foreground">{show.city}</p>
                      <p className="text-sm text-orange-500">
                        {new Date(show.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      className="bg-orange-500 hover:bg-orange-600 transition-all duration-300 hover:scale-105"
                      onClick={() => window.open(show.ticketUrl, "_blank")}
                    >
                      <Ticket className="mr-2 h-4 w-4" />
                      Get Tickets
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          </Card>

          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                <ShoppingBag className="w-6 h-6 mr-2 text-orange-500" />
                Official Merchandise
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {mockArtist.merchandise.map((item) => (
                  <motion.div
                    key={item.id}
                    className="group relative rounded-lg overflow-hidden bg-gradient-to-br from-orange-500/5 to-transparent"
                    whileHover={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="aspect-square overflow-hidden relative">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="absolute bottom-0 left-0 right-0 p-4 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                          <div className="space-y-2">
                            <p className="text-white font-medium text-lg">{item.name}</p>
                            <p className="text-orange-400 font-bold text-xl">{item.price}</p>
                            <p className="text-white/80 text-sm line-clamp-2">{item.description}</p>
                            {item.sizes && (
                              <div className="flex gap-2 mt-2">
                                {item.sizes.map((size) => (
                                  <span key={size} className="px-2 py-1 text-xs bg-white/10 rounded-md text-white/90">
                                    {size}
                                  </span>
                                ))}
                              </div>
                            )}
                            <div className="flex items-center gap-2 pt-2">
                              <Button
                                className="flex-1 bg-orange-500 hover:bg-orange-600 transition-all duration-300"
                                onClick={() => window.open(item.url, "_blank")}
                              >
                                {item.category === "Music" ? (
                                  <Music2 className="mr-2 h-4 w-4" />
                                ) : item.category === "Apparel" ? (
                                  <Shirt className="mr-2 h-4 w-4" />
                                ) : (
                                  <Paintbrush className="mr-2 h-4 w-4" />
                                )}
                                Buy Now
                              </Button>
                              <Button
                                variant="outline"
                                size="icon"
                                className="border-orange-500/50 hover:bg-orange-500/20"
                              >
                                <Share2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="p-4 bg-black/40 backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center text-sm font-medium text-orange-500">
                          {item.category === "Music" ? (
                            <Music2 className="mr-1 h-4 w-4" />
                          ) : item.category === "Apparel" ? (
                            <Shirt className="mr-1 h-4 w-4" />
                          ) : (
                            <Paintbrush className="mr-1 h-4 w-4" />
                          )}
                          {item.category}
                        </span>
                        {item.inStock ? (
                          <span className="text-xs px-2 py-1 bg-green-500/10 text-green-500 rounded-full flex items-center">
                            <Check className="mr-1 h-3 w-3" />
                            In Stock
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 bg-red-500/10 text-red-500 rounded-full flex items-center">
                            <X className="mr-1 h-3 w-3" />
                            Out of Stock
                          </span>
                        )}
                      </div>
                      <h4 className="font-semibold truncate">{item.name}</h4>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{item.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </Card>

        </div>

        <div className="space-y-8">
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                <ChartBar className="w-6 h-6 mr-2 text-orange-500" />
                Statistics
              </h3>
              <div className="grid grid-cols-3 gap-6">
                <div className="flex flex-col items-center">
                  <CircularProgressbar
                    value={mockArtist.statistics.monthlyListeners}
                    strokeWidth={10}
                    styles={buildStyles({
                      pathColor: "#E1306C",
                      textColor: "#E1306C",
                      trailColor: "#f5f5f5",
                    })}
                  />
                  <p className="text-lg font-medium mt-2">Monthly Listeners</p>
                </div>
                <div className="flex flex-col items-center">
                  <CircularProgressbar
                    value={mockArtist.statistics.totalStreams}
                    strokeWidth={10}
                    styles={buildStyles({
                      pathColor: "#1DA1F2",
                      textColor: "#1DA1F2",
                      trailColor: "#f5f5f5",
                    })}
                  />
                  <p className="text-lg font-medium mt-2">Total Streams</p>
                </div>
                <div className="flex flex-col items-center">
                  <CircularProgressbar
                    value={mockArtist.statistics.followers}
                    strokeWidth={10}
                    styles={buildStyles({
                      pathColor: "#FF0000",
                      textColor: "#FF0000",
                      trailColor: "#f5f5f5",
                    })}
                  />
                  <p className="text-lg font-medium mt-2">Followers</p>
                </div>
              </div>
            </motion.div>
          </Card>

          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                <Share2 className="w-6 h-6 mr-2 text-orange-500" />
                Connect & Follow
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="w-full bg-[#E1306C] hover:bg-[#C13584] transition-all duration-300 hover:scale-105"
                  onClick={() => window.open(mockArtist.socialMedia.instagram, "_blank")}
                >
                  <Instagram className="mr-2 h-5 w-5" />
                  Instagram
                </Button>
                <Button
                  className="w-full bg-[#1DA1F2] hover:bg-[#1A91DA] transition-all duration-300 hover:scale-105"
                  onClick={() => window.open(mockArtist.socialMedia.twitter, "_blank")}
                >
                  <Twitter className="mr-2 h-5 w-5" />
                  Twitter
                </Button>
                <Button
                  className="w-full bg-[#FF0000] hover:bg-[#CC0000] transition-all duration-300 hover:scale-105"
                  onClick={() => window.open(mockArtist.socialMedia.youtube, "_blank")}
                >
                  <Youtube className="mr-2 h-5 w-5" />
                  YouTube
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600 transition-all duration-300 hover:scale-105"
                  onClick={() => setShowShareDialog(true)}
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
              </div>
            </motion.div>
          </Card>

          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
                <User className="w-6 h-6 mr-2 text-orange-500" />
                Contact
              </h3>              <div className="space-y-4">
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 text-orange-500 mr-3" />
                  <span>{mockArtist.location}</span>
                </div>
                <div className="flex items-center">
                  <Mail className="w-5 h-5 text-orange-500 mr-3" />
                  <span>{mockArtist.email}</span>
                </div>
                <div className="flex items-center">
                  <Phone className="w-5 h-5 text-orange-500 mr-3" />
                  <span>{mockArtist.phone}</span>
                </div>
                <div className="flex items-center">
                  <Globe className="w-5 h-5 text-orange-500 mr-3" />
                  <a
                    href={mockArtist.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-orange-500"
                  >
                    {mockArtist.website}
                  </a>
                </div>
              </div>
            </motion.div>
          </Card>
        </div>
      </div>

      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Send Message to {mockArtist.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <textarea
                className="col-span-4 h-32 p-2 rounded-md border"
                placeholder="Write your message here..."
              />
            </div>
          </div>
          <div className="flex justify-end gap-4">
            <Button variant="ghost" onClick={() => setShowMessageDialog(false)}>
              Cancel
            </Button>
            <Button className="bg-orange-500 hover:bg-orange-600 hover:bg-orange-600 transition-all duration-300 hover:scale-105">
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        artistName={mockArtist.name}
        artistUrl={`https://boostify.com/${mockArtist.name.toLowerCase()}`}
      />
    </motion.div>
  );
}

export const mockArtist = {
  name: "Redwine",
  genre: "Blues Latin Fusion",
  location: "Miami, FL",
  email: "booking@redwinemusic.com",
  phone: "+1 (305) 555-0123",
  website: "https://redwinemusic.com",
  socialMedia: {
    instagram: "https://instagram.com/redwinemusic",
    twitter: "https://twitter.com/redwinemusic",
    youtube: "https://youtube.com/redwinemusic",
  },
  newRelease: {
    title: "New Release Title",
    coverArt: "/path/to/cover/art.jpg",
    releaseDate: new Date().toISOString(),
  },
  upcomingShows: [
    {
      id: "1",
      venue: "Venue Name",
      city: "City, State",
      date: new Date().toISOString(),
      ticketUrl: "https://example.com/tickets",
    },
  ],
  merchandise: [
    {
      id: "1",
      name: "La Vida Es de los Que Saben - Vinyl Edition",
      price: "$29.99",
      imageUrl: "/assets/Merchandise/vinil.jpeg",
      description: "Edición especial en vinilo con portada artística y notas exclusivas firmadas por Redwine",
      inStock: true,
      category: "Music",
      url: "#",
    },
    {
      id: "2",
      name: "Latin Blues Tour 2024 - Official Merch",
      price: "$24.99",
      imageUrl: "/assets/Merchandise/camiseta.jpeg",
      description: "Camiseta oficial del tour con diseño inspirado en 'Ella o el alcohol'",
      inStock: true,
      category: "Apparel",
      sizes: ["S", "M", "L", "XL"],
      url: "#",
    },
    {
      id: "3",
      name: "Colección Arte Latino Blues",
      price: "$19.99",
      imageUrl: "/assets/Merchandise/print.jpeg",
      description: "Set de prints artísticos firmados inspirados en la fusión del Blues Latino de Redwine",
      inStock: true,
      category: "Art",
      url: "#",
    },
  ],
  statistics: {
    monthlyListeners: 75,
    totalStreams: 100000,
    followers: 5000,
  },
};