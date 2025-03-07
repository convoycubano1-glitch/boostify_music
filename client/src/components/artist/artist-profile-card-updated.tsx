import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
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
  CalendarRange,
  HeartPulse,
  Users,
  DollarSign,
  Loader2,
  ShoppingBag,
  ShoppingCart,
  Store,
  Ticket,
  TicketCheck,
  MessageCircle,
  MessageSquare,
  Shirt,
  Paintbrush,
  Check,
  X,
  Link as LinkIcon,
  PlusCircle,
  Info,
  Music4,
  DownloadCloud,
  CreditCard
} from "lucide-react";
// Importamos nuestro componente de navegación
import { SectionNavigation, SimpleSectionNavigation } from "@/components/navigation/section-navigation";
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
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useToast } from "@/hooks/use-toast";

export interface ArtistProfileProps {
  artistId: string;
}

interface Song {
  id: string;
  name: string;
  title?: string;
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
  const fullUrl = `${window.location.origin}/profile/${artistUrl}`;
  const { toast } = useToast(); // Añadiendo la referencia al hook de toast

  const shareData = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(fullUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(fullUrl)}&text=Check out ${artistName}'s profile`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`Check out ${artistName}'s profile: ${fullUrl}`)}`,
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
            className="w-full bg-[#1DA1F2] hover:bg-[1A91DA]"
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
              navigator.clipboard.writeText(fullUrl);
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
  // Estados para la reproducción de música
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  
  // Estados para diálogos y navegación
  const [showMessageDialog, setShowMessageDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [activeSection, setActiveSection] = useState<'music' | 'videos' | 'merch' | 'shows'>('music');
  
  // Estado para reproductor de audio
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  
  const { toast } = useToast();

  // Query optimizada para obtener canciones
  const { data: songs = [], isLoading: isLoadingSongs } = useQuery({
    queryKey: ["songs", artistId],
    queryFn: async () => {
      try {
        const songsRef = collection(db, "songs");
        const q = query(songsRef, where("userId", "==", artistId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          return [];
        }

        const songData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name,
            title: data.name,
            audioUrl: data.audioUrl,
            duration: data.duration || "3:45", // Default duration
            userId: data.userId,
            createdAt: data.createdAt?.toDate(),
            storageRef: data.storageRef,
            coverArt: data.coverArt || '/assets/freepik__boostify_music_organe_abstract_icon.png'
          };
        });

        return songData;
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
    enabled: !!artistId
  });

  // Query optimizada para obtener videos
  const { data: videos = [], isLoading: isLoadingVideos } = useQuery({
    queryKey: ["videos", artistId],
    queryFn: async () => {
      try {
        const videosRef = collection(db, "videos");
        const q = query(videosRef, where("userId", "==", artistId));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
          return [];
        }

        const videoData = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const videoId = data.url?.split('v=')?.[1] || data.url?.split('/')?.[3]?.split('?')?.[0];
          return {
            id: doc.id,
            title: data.title,
            url: data.url,
            thumbnail: data.thumbnailUrl || (videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : undefined),
            videoId: videoId,
            createdAt: data.createdAt?.toDate(),
            views: Math.floor(Math.random() * 10000) + 1000, // Datos de muestra para mejorar UX
            likes: Math.floor(Math.random() * 500) + 50,
          };
        });

        return videoData;
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
    enabled: !!artistId
  });

  const togglePlay = (song: Song, index: number) => {
    // Si ya estamos reproduciendo esta canción, la pausamos
    if (isPlaying && currentTrack === index && currentAudio) {
      currentAudio.pause();
      setIsPlaying(false);
      return;
    }
    
    // Si hay un audio reproduciéndose, lo detenemos primero
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.removeEventListener('ended', () => setIsPlaying(false));
      setCurrentAudio(null);
      setIsPlaying(false);
    }

    // Reproducimos la nueva canción
    if (song.audioUrl) {
      const audio = new Audio(song.audioUrl);

      audio.addEventListener('ended', () => {
        setIsPlaying(false);
        setCurrentAudio(null);
      });

      audio.addEventListener('error', (error) => {
        console.error("Error playing audio:", error);
        toast({
          title: "Error",
          description: "No se pudo reproducir el audio. Por favor, intente nuevamente.",
          variant: "destructive",
        });
        setIsPlaying(false);
        setCurrentAudio(null);
      });

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

  // Función auxiliar para obtener el ID del video de YouTube
  const getYoutubeVideoId = (url: string): string => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu.be\/|youtube.com\/embed\/)([^&\n?#]+)/,
      /^[a-zA-Z0-9_-]{11}$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return '';
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

  // Función para formatear el tiempo de reproducción
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' + secs : secs}`;
  };

  // Componente para mostrar el progreso de reproducción
  const AudioProgressBar = () => {
    if (!currentAudio || currentTrack === -1) return null;
    
    return (
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-black/90 to-black/80 backdrop-blur-md p-3 z-50 border-t border-orange-500/20">
        <div className="max-w-7xl mx-auto flex flex-col">
          <div className="flex items-center justify-between w-full mb-2">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isPlaying) {
                    currentAudio?.pause();
                    setIsPlaying(false);
                  } else {
                    currentAudio?.play();
                    setIsPlaying(true);
                  }
                }}
                className={`rounded-full transition-transform duration-300 ${
                  isPlaying
                    ? "bg-orange-500 text-white hover:bg-orange-600"
                    : "hover:bg-orange-500/10"
                }`}
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>
              <div>
                <span className="font-medium text-white">
                  {songs[currentTrack]?.name || songs[currentTrack]?.title}
                </span>
                <span className="text-sm text-white/70 block">
                  {mockArtist.name}
                </span>
              </div>
            </div>
            <div className="text-sm text-white/70">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>
          </div>
          
          <div className="w-full bg-gray-700/30 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-pink-500"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
        </div>
      </div>
    );
  };

  // Utilizamos el componente SectionNavigation importado
  const NavigationHeader = () => (
    <SectionNavigation 
      activeSection={activeSection}
      onSectionChange={setActiveSection}
      onShare={() => setShowShareDialog(true)}
      onMessage={() => setShowMessageDialog(true)}
      showActions={true}
    />
  );

  return (
    <>
      <section className="relative w-full">
        <motion.div
          className="relative z-10 px-4 max-w-7xl mx-auto"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Banner y perfil de artista */}
          <Card className="relative bg-gradient-to-b from-black/60 to-black/40 backdrop-blur-sm overflow-hidden border-orange-500/20 hover:border-orange-500/40 transition-all duration-300">
            <div className="h-48 md:h-64 bg-gradient-to-r from-orange-600/20 to-red-500/20 rounded-t-lg relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/90" />
              <img
                src={mockArtist.bannerImage || 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80'}
                alt="Artist banner"
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="p-6 md:p-8 pb-4 -mt-16 relative">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-4 md:gap-6">
                <div className="w-28 h-28 md:w-32 md:h-32 rounded-full border-4 border-black/80 overflow-hidden flex-shrink-0 bg-orange-500/10 relative group">
                  <img
                    src={mockArtist.profileImage || 'https://images.unsplash.com/photo-1618254394652-ca0bd54ae0f0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1153&q=80'}
                    alt={mockArtist.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-orange-500">
                    {mockArtist.name}
                  </h1>
                  
                  <div className="flex items-center justify-center md:justify-start gap-2 mb-3 flex-wrap">
                    <Badge variant="outline" className="text-orange-400 border-orange-500/30">
                      {mockArtist.genre}
                    </Badge>
                    <Badge variant="outline" className="text-orange-400 border-orange-500/30">
                      {mockArtist.location}
                    </Badge>
                    <Badge variant="secondary" className="bg-orange-500/20 text-orange-200 hover:bg-orange-500/30">
                      <Users className="w-3 h-3 mr-1" />
                      {mockArtist.followers.toLocaleString()} followers
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-center md:justify-start gap-2 text-sm">
                    {mockArtist.verified && (
                      <span className="flex items-center text-green-400 gap-1">
                        <Check className="w-4 h-4" />
                        Verified Artist
                      </span>
                    )}
                    <span className="flex items-center text-white/70 gap-1">
                      <Music2 className="w-4 h-4" />
                      {mockArtist.tracks} tracks
                    </span>
                    <span className="flex items-center text-white/70 gap-1">
                      <VideoIcon className="w-4 h-4" />
                      {mockArtist.videos} videos
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-2 mt-4 md:mt-0">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                        <DollarSign className="mr-2 h-4 w-4" />
                        Support
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Support {mockArtist.name}</DialogTitle>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="flex justify-around">
                          {[5, 10, 20].map((amount) => (
                            <div key={amount} className="text-center">
                              <div className="w-16 h-16 mx-auto mb-2 relative">
                                <CircularProgressbar
                                  value={amount * 5}
                                  text={`$${amount}`}
                                  styles={buildStyles({
                                    textSize: '2rem',
                                    pathColor: `rgba(249, 115, 22, ${amount / 20})`,
                                    textColor: '#f97316',
                                    trailColor: '#334155',
                                  })}
                                />
                              </div>
                              <span className="text-sm text-gray-400">One-time</span>
                            </div>
                          ))}
                        </div>
                        <div className="text-center mt-4">
                          <h3 className="font-semibold mb-2">Monthly Support</h3>
                          <div className="flex justify-around gap-2">
                            {[3, 9, 19].map((amount) => (
                              <Button
                                key={amount}
                                variant="outline"
                                className="flex flex-col h-auto py-2 px-4 border-orange-500/20 hover:bg-orange-500/10"
                              >
                                <span className="text-lg font-bold text-orange-500">${amount}</span>
                                <span className="text-xs text-gray-400">/month</span>
                              </Button>
                            ))}
                          </div>
                        </div>
                        <Button className="mt-4">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Continue to Payment
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Button size="sm" variant="outline" className="rounded-full border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
                    <HeartPulse className="mr-2 h-4 w-4" />
                    Follow
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-6">
                <Card className="bg-black/40 backdrop-blur-sm border-orange-500/20 p-4 hover:border-orange-500/40 transition-all duration-300">
                  <h3 className="font-semibold mb-2 flex items-center text-orange-400">
                    <User className="w-4 h-4 mr-2" />
                    Bio
                  </h3>
                  <ScrollArea className="h-24">
                    <p className="text-sm text-white/70 leading-relaxed">
                      {mockArtist.biography}
                    </p>
                  </ScrollArea>
                </Card>
                
                <Card className="bg-black/40 backdrop-blur-sm border-orange-500/20 p-4 hover:border-orange-500/40 transition-all duration-300">
                  <h3 className="font-semibold mb-2 flex items-center text-orange-400">
                    <TicketCheck className="w-4 h-4 mr-2" />
                    Upcoming Shows
                  </h3>
                  {mockArtist.upcomingShows.length > 0 ? (
                    <div className="space-y-2">
                      {mockArtist.upcomingShows.slice(0, 2).map((show, index) => (
                        <div 
                          key={index}
                          className="flex justify-between items-center p-2 rounded-md bg-black/30 hover:bg-black/50 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-md bg-gradient-to-br from-orange-500/30 to-red-500/30 flex flex-col items-center justify-center text-xs">
                              <span className="font-bold text-orange-300">{new Date(show.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                              <span className="text-white">{new Date(show.date).getDate()}</span>
                            </div>
                            <div>
                              <p className="text-sm font-medium">{show.venue}</p>
                              <p className="text-xs text-white/60">{show.location}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="ghost" className="text-xs h-7 hover:bg-orange-500/10 text-orange-400">
                            Details
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <CalendarRange className="h-8 w-8 text-orange-500/40 mb-2" />
                      <p className="text-sm text-white/60">No upcoming shows</p>
                    </div>
                  )}
                  {mockArtist.upcomingShows.length > 2 && (
                    <Button 
                      variant="link" 
                      className="text-xs text-orange-400 p-0 h-auto mt-2 hover:text-orange-300"
                      onClick={() => setActiveSection('shows')}
                    >
                      View all {mockArtist.upcomingShows.length} shows →
                    </Button>
                  )}
                </Card>
              </div>
              
              <div className="mt-6 flex flex-wrap gap-3 justify-center md:justify-start">
                {mockArtist.socialLinks.map((link, index) => {
                  const Icon = link.type === 'instagram' 
                    ? Instagram 
                    : link.type === 'twitter' 
                      ? Twitter 
                      : link.type === 'youtube' 
                        ? Youtube 
                        : Globe;
                  
                  return (
                    <a 
                      key={index}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-black/30 text-white/80 hover:bg-orange-500/20 hover:text-orange-300 transition-colors border border-orange-500/20"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.type.charAt(0).toUpperCase() + link.type.slice(1)}</span>
                    </a>
                  );
                })}
                
                <a 
                  href={`mailto:${mockArtist.contactEmail}`}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-black/30 text-white/80 hover:bg-orange-500/20 hover:text-orange-300 transition-colors border border-orange-500/20"
                >
                  <Mail className="w-4 h-4" />
                  <span>Email</span>
                </a>
                
                {mockArtist.contactPhone && (
                  <a 
                    href={`tel:${mockArtist.contactPhone}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-black/30 text-white/80 hover:bg-orange-500/20 hover:text-orange-300 transition-colors border border-orange-500/20"
                  >
                    <Phone className="w-4 h-4" />
                    <span>Phone</span>
                  </a>
                )}
              </div>
            </div>
          </Card>
          
          {/* Componente de navegación para secciones */}
          <NavigationHeader />
          
          {/* Contenido de secciones */}
          <div className="space-y-6 mb-20">
            {activeSection === 'music' && <MusicSection />}
            {activeSection === 'videos' && <VideosSection />}
            {activeSection === 'shows' && <ShowsSection />}
            {activeSection === 'merch' && <MerchSection />}
          </div>
        </motion.div>
        
        {/* Background decorativo */}
        <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-orange-950/30 to-transparent pointer-events-none z-0"></div>
        
        {/* Barra de progreso de reproducción */}
        <AudioProgressBar />
      </section>
      
      {/* Diálogo para mensajes */}
      <Dialog open={showMessageDialog} onOpenChange={setShowMessageDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Message Artist</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="subject" className="text-sm font-medium">Subject</label>
              <input
                id="subject"
                className="bg-black/30 border border-orange-500/20 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Enter subject..."
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="message" className="text-sm font-medium">Message</label>
              <textarea
                id="message"
                rows={4}
                className="bg-black/30 border border-orange-500/20 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                placeholder="Write your message here..."
              />
            </div>
            <div className="flex items-center gap-4 mt-4">
              <Button variant="ghost" onClick={() => setShowMessageDialog(false)}>
                Cancel
              </Button>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send Message
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Diálogo para compartir */}
      <ShareDialog 
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        artistName={mockArtist.name}
        artistUrl="artistId"
      />
    </>
  );
}

// Datos de prueba
export const mockArtist = {
  id: "1",
  name: "Luna Eclipse",
  genre: "Electro-Pop",
  location: "Los Angeles, CA",
  profileImage: "https://images.unsplash.com/photo-1618254394652-ca0bd54ae0f0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1153&q=80",
  bannerImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1074&q=80",
  biography: "Luna Eclipse is an electro-pop artist based in Los Angeles. With a distinctive voice and innovative production, Luna creates immersive sonic landscapes that blend electronic elements with pop sensibilities. Luna's journey began in 2017 with the release of the debut EP 'Moonlight Shadows,' which quickly gained attention for its ethereal soundscapes and introspective lyrics. Since then, Luna has performed at major festivals including Coachella and Lollapalooza, and collaborated with renowned producers in the industry. Luna's music explores themes of human connection, technology, and emotional resilience in the modern world.",
  followers: 34582,
  tracks: 24,
  videos: 12,
  verified: true,
  socialLinks: [
    { type: "instagram", url: "https://instagram.com/lunaeclipse" },
    { type: "twitter", url: "https://twitter.com/lunaeclipse" },
    { type: "youtube", url: "https://youtube.com/lunaeclipse" }
  ],
  contactEmail: "booking@lunaeclipse.com",
  contactPhone: "+1 (323) 555-1234",
  upcomingShows: [
    { 
      date: "2023-12-10", 
      venue: "The Echo", 
      location: "Los Angeles, CA",
      ticketLink: "https://tickets.com/lunaeclipse-echo"
    },
    { 
      date: "2023-12-15", 
      venue: "Bottom of the Hill", 
      location: "San Francisco, CA",
      ticketLink: "https://tickets.com/lunaeclipse-bottomhill"
    },
    { 
      date: "2023-12-18", 
      venue: "Doug Fir Lounge", 
      location: "Portland, OR",
      ticketLink: "https://tickets.com/lunaeclipse-dougfir"
    },
    { 
      date: "2023-12-20", 
      venue: "The Crocodile", 
      location: "Seattle, WA",
      ticketLink: "https://tickets.com/lunaeclipse-crocodile"
    }
  ],
  merchandise: [
    {
      id: "merch-1",
      name: "Cosmic Voyage Tee",
      image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80",
      price: 25,
      category: "Apparel"
    },
    {
      id: "merch-2",
      name: "Eclipse Logo Hoodie",
      image: "https://images.unsplash.com/photo-1618517351616-38fb9c5210c6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
      price: 45,
      category: "Apparel"
    },
    {
      id: "merch-3",
      name: "Limited Vinyl Edition",
      image: "https://images.unsplash.com/photo-1603048588665-791ca91d0e80?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=880&q=80",
      price: 30,
      category: "Music"
    },
    {
      id: "merch-4",
      name: "Constellation Poster",
      image: "https://images.unsplash.com/photo-1586348943529-beaae6c28db9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1015&q=80",
      price: 15,
      category: "Accessories"
    },
    {
      id: "merch-5",
      name: "Digital Album",
      image: "https://images.unsplash.com/photo-1561131989-b8112bafbd43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1064&q=80",
      price: 10,
      category: "Music"
    },
    {
      id: "merch-6",
      name: "Luna Tour Cap",
      image: "https://images.unsplash.com/photo-1620231150904-a86b9802656a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=987&q=80",
      price: 22,
      category: "Apparel"
    }
  ]
};

// Sección de música mejorada con diseño de tarjetas
const MusicSection = () => (
  <Card className="p-6 bg-black/40 backdrop-blur-sm border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 overflow-hidden">
    <motion.div variants={itemVariants}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
          <Music2 className="w-6 h-6 mr-2 text-orange-500" />
          Latest Tracks
        </h3>
        <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-400">
          <span>View All</span>
          <ChartBar className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {isLoadingSongs ? (
          <div className="flex items-center justify-center p-8">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <Music2 className="h-4 w-4 text-orange-300" />
              </div>
            </div>
            <p className="ml-3 text-orange-300">Cargando pistas...</p>
          </div>
        ) : songs && songs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {songs.map((song, index) => (
              <motion.div
                key={song.id}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className={`flex items-center p-4 rounded-lg transition-all duration-300 backdrop-blur-sm ${
                  currentTrack === index
                    ? "bg-gradient-to-r from-orange-500/30 to-pink-500/20 border border-orange-500/50"
                    : "bg-black/30 border border-orange-500/10 hover:border-orange-500/30"
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="relative shrink-0">
                    <div className={`w-12 h-12 rounded-md overflow-hidden bg-orange-500/20 ${
                      currentTrack === index && isPlaying ? 'ring-2 ring-orange-500 ring-offset-1 ring-offset-black' : ''
                    }`}>
                      <img 
                        src={song.coverArt} 
                        alt={song.name} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/assets/freepik__boostify_music_organe_abstract_icon.png';
                        }}  
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePlay(song, index)}
                      className={`absolute -bottom-2 -right-2 w-7 h-7 rounded-full transition-transform duration-300 ${
                        currentTrack === index && isPlaying
                          ? "bg-orange-500 text-white hover:bg-orange-600 scale-110"
                          : "bg-black/70 text-white hover:bg-orange-500/80"
                      }`}
                    >
                      {currentTrack === index && isPlaying ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <span className="font-medium truncate">{song.name || song.title}</span>
                      <span className="text-xs text-muted-foreground ml-2 shrink-0">
                        {song.duration || "3:45"}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground block truncate">
                      {song.createdAt ? new Date(song.createdAt).toLocaleDateString() : 'No date'} 
                      {currentTrack === index && isPlaying && <span className="ml-2 text-orange-500">• Reproduciendo</span>}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-black/20 rounded-lg p-8 text-center">
            <Music2 className="h-12 w-12 text-orange-500/40 mx-auto mb-3" />
            <p className="text-orange-100/70">No hay pistas disponibles</p>
            <p className="text-sm text-orange-300/50 mt-2">Las canciones que subas aparecerán aquí</p>
            <Button variant="outline" className="mt-4 border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
              <PlusCircle className="h-4 w-4 mr-2" />
              Subir música
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  </Card>
);

// Implementación del componente VideosSection en el mismo estilo que MusicSection
const VideosSection = () => (
  <Card className="p-6 bg-black/40 backdrop-blur-sm border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 overflow-hidden">
    <motion.div variants={itemVariants}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
          <VideoIcon className="w-6 h-6 mr-2 text-orange-500" />
          Latest Videos
        </h3>
        <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-400">
          <span>View All</span>
          <ChartBar className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {isLoadingVideos ? (
          <div className="flex items-center justify-center p-8">
            <div className="relative">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
              <div className="absolute inset-0 flex items-center justify-center">
                <VideoIcon className="h-4 w-4 text-orange-300" />
              </div>
            </div>
            <p className="ml-3 text-orange-300">Cargando videos...</p>
          </div>
        ) : videos && videos.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.map((video) => {
              const videoId = video.url ? getYoutubeVideoId(video.url) : '';
              return (
                <motion.div
                  key={video.id}
                  className="rounded-xl overflow-hidden bg-gradient-to-br from-black/50 to-black/30 border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300 group"
                  whileHover={{ 
                    scale: 1.03,
                    boxShadow: "0 10px 30px -15px rgba(249, 115, 22, 0.4)"
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="aspect-video relative">
                    <iframe
                      className="w-full h-full rounded-t-lg"
                      src={`https://www.youtube.com/embed/${videoId}?rel=0`}
                      title={video.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    ></iframe>
                    
                    {/* Overlay de gradiente en hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  
                  <div className="p-4">
                    <h4 className="font-medium mb-1 line-clamp-1">{video.title}</h4>
                    <div className="flex justify-between items-center text-xs text-white/60">
                      <span>{video.createdAt ? new Date(video.createdAt).toLocaleDateString() : 'No date'}</span>
                      <div className="flex items-center gap-3">
                        <span className="flex items-center">
                          <Play className="h-3 w-3 mr-1" /> 
                          {video.views?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="bg-black/20 rounded-lg p-8 text-center">
            <VideoIcon className="h-12 w-12 text-orange-500/40 mx-auto mb-3" />
            <p className="text-orange-100/70">No hay videos disponibles</p>
            <p className="text-sm text-orange-300/50 mt-2">Los videos que subas aparecerán aquí</p>
            <Button variant="outline" className="mt-4 border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
              <PlusCircle className="h-4 w-4 mr-2" />
              Subir video
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  </Card>
);

// Implementación del componente ShowsSection
const ShowsSection = () => (
  <Card className="p-6 bg-black/40 backdrop-blur-sm border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 overflow-hidden">
    <motion.div variants={itemVariants}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
          <Ticket className="w-6 h-6 mr-2 text-orange-500" />
          Upcoming Shows
        </h3>
        <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-400">
          <span>Add Event</span>
          <PlusCircle className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {mockArtist.upcomingShows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mockArtist.upcomingShows.map((show, index) => (
              <motion.div
                key={index}
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="p-4 rounded-lg bg-black/30 border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-md bg-gradient-to-br from-orange-500/30 to-red-500/30 flex flex-col items-center justify-center text-sm shrink-0">
                    <span className="font-bold text-orange-300">{new Date(show.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                    <span className="text-white text-lg">{new Date(show.date).getDate()}</span>
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="font-medium mb-1">{show.venue}</h4>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                      <div className="flex flex-col">
                        <span className="text-sm text-white/70 flex items-center">
                          <MapPin className="h-3 w-3 mr-1" /> 
                          {show.location}
                        </span>
                        <span className="text-sm text-white/70 flex items-center">
                          <Calendar className="h-3 w-3 mr-1" /> 
                          {new Date(show.date).toLocaleDateString('en-US', { weekday: 'long', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <a 
                        href={show.ticketLink} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-medium bg-orange-500 text-white hover:bg-orange-600 transition-colors"
                      >
                        <TicketCheck className="h-3 w-3 mr-1" />
                        Buy Tickets
                      </a>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-black/20 rounded-lg p-8 text-center">
            <CalendarRange className="h-12 w-12 text-orange-500/40 mx-auto mb-3" />
            <p className="text-orange-100/70">No upcoming shows</p>
            <p className="text-sm text-orange-300/50 mt-2">Schedule and announce your shows to fans</p>
            <Button variant="outline" className="mt-4 border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Show
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  </Card>
);

// Implementación del componente MerchSection
const MerchSection = () => (
  <Card className="p-6 bg-black/40 backdrop-blur-sm border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 overflow-hidden">
    <motion.div variants={itemVariants}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-semibold flex items-center bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">
          <ShoppingBag className="w-6 h-6 mr-2 text-orange-500" />
          Merchandise
        </h3>
        <Button variant="ghost" size="sm" className="text-orange-500 hover:text-orange-400">
          <span>Manage Store</span>
          <Store className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <div className="space-y-4">
        {mockArtist.merchandise && mockArtist.merchandise.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {mockArtist.merchandise.map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.2 }}
                className="group rounded-lg overflow-hidden bg-black/30 border border-orange-500/10 hover:border-orange-500/30 transition-all duration-300"
              >
                <div className="aspect-square relative overflow-hidden">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  
                  <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600">
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
                
                <div className="p-4">
                  <h4 className="font-medium mb-1">{item.name}</h4>
                  <div className="flex justify-between items-center">
                    <span className="text-orange-400 font-bold">${item.price.toFixed(2)}</span>
                    <Badge variant="outline" className="text-xs border-orange-500/30 text-orange-300">
                      {item.category}
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="bg-black/20 rounded-lg p-8 text-center">
            <Shirt className="h-12 w-12 text-orange-500/40 mx-auto mb-3" />
            <p className="text-orange-100/70">No merchandise available</p>
            <p className="text-sm text-orange-300/50 mt-2">Add merchandise to your store to sell to fans</p>
            <Button variant="outline" className="mt-4 border-orange-500/30 text-orange-400 hover:bg-orange-500/10">
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Merchandise
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  </Card>
);