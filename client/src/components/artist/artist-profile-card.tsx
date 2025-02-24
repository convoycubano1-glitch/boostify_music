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
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export interface ArtistProfileProps {
  artistId: string;
}

interface Song {
  id: string;
  name: string;
  duration?: string;
  audioUrl: string;
  userId: string; // Cambiado de uid a userId
  createdAt?: any;
  storageRef?: string;
}

interface Video {
  id: string;
  title: string;
  thumbnailUrl?: string;
  url: string;
  userId: string; // Cambiado de uid a userId
  createdAt?: any;
}

export function ArtistProfileCard({ artistId }: ArtistProfileProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [showMessageDialog, setShowMessageDialog] = useState(false);
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
        const filteredSongs = songData.filter(song => {
          console.log(`Comparing song.userId: ${song.userId} with artistId: ${artistId}`);
          return song.userId === artistId;
        });
        console.log("Filtered songs:", filteredSongs);
        return filteredSongs;
      } catch (error) {
        console.error("Error fetching songs:", error);
        throw error;
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
        const filteredVideos = videoData.filter(video => {
          console.log(`Comparing video.userId: ${video.userId} with artistId: ${artistId}`);
          return video.userId === artistId;
        });
        console.log("Filtered videos:", filteredVideos);
        return filteredVideos;
      } catch (error) {
        console.error("Error fetching videos:", error);
        throw error;
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
    <Card className="p-6">
      <motion.div variants={itemVariants}>
        <h3 className="text-2xl font-semibold mb-6 flex items-center">
          <Music2 className="w-6 h-6 mr-2 text-orange-500" />
          Latest Tracks
        </h3>
        <div className="space-y-4">
          {isLoadingSongs ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
            </div>
          ) : isSongsError ? (
            <div className="text-center text-red-500">
              Error al cargar las canciones
            </div>
          ) : songs.length === 0 ? (
            <p className="text-center text-muted-foreground">No tracks available</p>
          ) : (
            songs.map((song, index) => (
              <div
                key={song.id}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  currentTrack === index ? "bg-orange-500/10" : "hover:bg-muted/50"
                }`}
              >
                <div className="flex items-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => togglePlay(song, index)}
                    className="mr-2"
                  >
                    {currentTrack === index && isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>
                  <span className="font-medium">{song.name}</span>
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
      ) : isVideosError ? (
        <div className="col-span-full text-center text-red-500">
          Error al cargar los videos
        </div>
      ) : videos.length === 0 ? (
        <p className="col-span-full text-center text-muted-foreground">No videos available</p>
      ) : (
        videos.map((video) => (
          <motion.div
            key={video.id}
            className="aspect-video relative group rounded-lg overflow-hidden"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <img
              src={video.thumbnailUrl || "https://via.placeholder.com/150"}
              alt={video.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h4 className="text-white font-medium truncate">{video.title}</h4>
                <Button
                  onClick={() => window.open(video.url, "_blank")}
                  className="mt-2 w-full bg-orange-500 hover:bg-orange-600"
                >
                  Watch Now
                </Button>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="container mx-auto px-4 py-8"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <MusicSection />
          <VideosSection />
        </div>
        <div className="space-y-8">
          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <Share2 className="w-6 h-6 mr-2 text-orange-500" />
                Connect & Follow
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Button
                  className="w-full bg-[#E1306C] hover:bg-[#C13584]"
                  onClick={() => window.open(mockArtist.socialMedia.instagram, "_blank")}
                >
                  <Instagram className="mr-2 h-5 w-5" />
                  Instagram
                </Button>
                <Button
                  className="w-full bg-[#1DA1F2] hover:bg-[#1A91DA]"
                  onClick={() => window.open(mockArtist.socialMedia.twitter, "_blank")}
                >
                  <Twitter className="mr-2 h-5 w-5" />
                  Twitter
                </Button>
                <Button
                  className="w-full bg-[#FF0000] hover:bg-[#CC0000]"
                  onClick={() => window.open(mockArtist.socialMedia.youtube, "_blank")}
                >
                  <Youtube className="mr-2 h-5 w-5" />
                  YouTube
                </Button>
                <Button
                  className="w-full bg-gradient-to-r from-orange-500 to-pink-500 hover:from-orange-600 hover:to-pink-600"
                  onClick={() => setShowMessageDialog(true)}
                >
                  <Share2 className="mr-2 h-5 w-5" />
                  Share
                </Button>
              </div>
            </motion.div>
          </Card>

          <Card className="p-6">
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl font-semibold mb-6 flex items-center">
                <User className="w-6 h-6 mr-2 text-orange-500" />
                Contact
              </h3>
              <div className="space-y-4">
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
            <Button className="bg-orange-500 hover:bg-orange-600">
              Send Message
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export const mockArtist = {
  name: "Redwine",
  location: "Miami, FL",
  email: "booking@redwinemusic.com",
  phone: "+1 (305) 555-0123",
  website: "https://redwinemusic.com",
  socialMedia: {
    instagram: "https://instagram.com/redwinemusic",
    twitter: "https://twitter.com/redwinemusic",
    youtube: "https://youtube.com/redwinemusic",
  },
};