import React, { useState, useMemo, useEffect } from "react";
import axios from "axios";
import { Header } from "../components/layout/header";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "../components/ui/tabs";
import { 
  Play, Tv, Film, Music2, Star, Clock, TrendingUp, Search, 
  Share2, Facebook, Twitter, Copy, Instagram, Linkedin, Loader2,
  PlusCircle, Bookmark, BookmarkPlus, ThumbsUp, MessageCircle, Info,
  Mic, Video, Radio, Users, Zap, Sparkles, Calendar, CheckCircle2,
  Pause, Volume2, VolumeX, Maximize, X, SkipForward, SkipBack
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "../components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import { VideoUpload } from "../components/affiliates/video-upload";
import { useAuth } from "../hooks/use-auth";
import { Skeleton } from "../components/ui/skeleton";
import { Badge } from "../components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { Dialog, DialogContent } from "../components/ui/dialog";

interface VideoContent {
  id: string;
  title: string;
  description: string;
  filePath: string;
  thumbnailPath?: string | null;
  duration: string;
  views: number;
  category: "featured" | "live" | "videos" | "music";
}

interface VideoResponse {
  success: boolean;
  videos: VideoContent[];
  message?: string;
  error?: string;
}

interface VideoPlayerProps {
  video: VideoContent;
  isOpen: boolean;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

function VideoPlayer({ video, isOpen, onClose, onNext, onPrevious }: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  
  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };
  
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration);
    }
  };
  
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };
  
  const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-full p-0 bg-black border-0">
        <div 
          className="relative w-full h-[90vh] bg-black group"
          onMouseEnter={() => setShowControls(true)}
          onMouseLeave={() => setShowControls(false)}
        >
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-50 text-white hover:bg-white/20"
            onClick={onClose}
            data-testid="button-close-video"
          >
            <X className="w-6 h-6" />
          </Button>
          
          <video
            ref={videoRef}
            className="w-full h-full object-contain"
            src={video.filePath}
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleTimeUpdate}
            onClick={togglePlay}
            data-testid="video-player"
          />
          
          <AnimatePresence>
            {showControls && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6"
              >
                <div className="mb-4">
                  <input
                    type="range"
                    min="0"
                    max={duration || 0}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, hsl(24, 95%, 53%) 0%, hsl(24, 95%, 53%) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.3) 100%)`
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={togglePlay}
                      className="text-white hover:bg-white/20"
                      data-testid="button-play-pause"
                    >
                      {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                    </Button>
                    
                    {onPrevious && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onPrevious}
                        className="text-white hover:bg-white/20"
                        data-testid="button-previous"
                      >
                        <SkipBack className="w-5 h-5" />
                      </Button>
                    )}
                    
                    {onNext && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={onNext}
                        className="text-white hover:bg-white/20"
                        data-testid="button-next"
                      >
                        <SkipForward className="w-5 h-5" />
                      </Button>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                      data-testid="button-mute"
                    >
                      {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                    </Button>
                    
                    <span className="text-sm">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </span>
                  </div>
                  
                  <div>
                    <h3 className="font-semibold text-lg">{video.title}</h3>
                    <p className="text-sm text-gray-300">{video.views.toLocaleString()} views</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Button
                size="lg"
                onClick={togglePlay}
                className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-20 h-20"
                data-testid="button-play-overlay"
              >
                <Play className="w-10 h-10 ml-1" />
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const DEMO_VIDEOS: VideoContent[] = [
  {
    id: "demo-1",
    title: "Boostify Music Promo - Platform Features",
    description: "Discover how Boostify Music helps artists grow their careers with AI-powered tools, tokenization, and more",
    filePath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    thumbnailPath: null,
    duration: "10:34",
    views: 15420,
    category: "featured"
  },
  {
    id: "demo-2",
    title: "Artist Success Stories - Virtual Label Showcase",
    description: "Real artists sharing their success stories using Boostify's Virtual Record Label platform",
    filePath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
    thumbnailPath: null,
    duration: "8:20",
    views: 12350,
    category: "featured"
  },
  {
    id: "demo-3",
    title: "Music Tokenization Tutorial",
    description: "Learn how to tokenize your music and earn from your fans directly",
    filePath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
    thumbnailPath: null,
    duration: "5:15",
    views: 9840,
    category: "videos"
  },
  {
    id: "demo-4",
    title: "AI Tools for Musicians - Complete Guide",
    description: "Explore all the AI-powered tools available for music promotion and growth",
    filePath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
    thumbnailPath: null,
    duration: "12:45",
    views: 18200,
    category: "videos"
  },
  {
    id: "demo-5",
    title: "Live Performance - Featured Artist",
    description: "Exclusive live performance from one of our featured artists",
    filePath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
    thumbnailPath: null,
    duration: "15:30",
    views: 24500,
    category: "live"
  },
  {
    id: "demo-6",
    title: "Music Production Tips & Tricks",
    description: "Professional music production techniques from industry experts",
    filePath: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    thumbnailPath: null,
    duration: "18:20",
    views: 21000,
    category: "music"
  }
];

export default function BoostifyTvPage() {
  const [selectedTab, setSelectedTab] = useState("featured");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoContent | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const { data, isLoading, isError } = useQuery<VideoResponse>({
    queryKey: ['/api/files/videos/tv'],
    queryFn: async () => {
      const response = await axios.get('/api/files/videos/tv');
      return response.data;
    }
  });

  const processedVideos = useMemo(() => {
    const apiVideos = data?.videos?.filter(v => v.filePath && v.filePath.trim() !== '') || [];
    
    const videosWithCategory = apiVideos.map((video: VideoContent, index: number) => ({
      ...video,
      category: video.category || (index % 2 === 0 ? "featured" : "videos") as "featured" | "live" | "videos" | "music"
    }));
    
    return [...DEMO_VIDEOS, ...videosWithCategory];
  }, [data?.videos]);
  
  const filteredVideos = useMemo(() => {
    if (!processedVideos.length) return [];
    
    return processedVideos.filter((video: VideoContent) => 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      video.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedVideos, searchTerm]);

  const shareVideo = (video: VideoContent, platform: string) => {
    const videoUrl = window.location.origin + video.filePath;
    const text = `Check out this video: ${video.title}`;
    
    switch(platform) {
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(videoUrl)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(videoUrl)}`, '_blank');
        break;
      case 'instagram':
        toast({
          title: "Instagram sharing",
          description: "Copy the link to share on Instagram",
        });
        navigator.clipboard.writeText(videoUrl);
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(videoUrl)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(videoUrl);
        toast({
          title: "Link copied!",
          description: "Video link copied to clipboard",
        });
        break;
    }
  };

  const [featuredVideo, setFeaturedVideo] = useState<VideoContent | null>(null);
  const [savedVideos, setSavedVideos] = useState<string[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  
  useEffect(() => {
    if (processedVideos.length > 0) {
      const featured = processedVideos.filter(v => v.category === "featured");
      if (featured.length > 0) {
        const randomIndex = Math.floor(Math.random() * featured.length);
        setFeaturedVideo(featured[randomIndex]);
      } else {
        setFeaturedVideo(processedVideos[0]);
      }
    }
  }, [processedVideos]);
  
  const toggleSaveVideo = (videoId: string) => {
    if (savedVideos.includes(videoId)) {
      setSavedVideos(savedVideos.filter(id => id !== videoId));
      toast({
        title: "Video removed",
        description: "Video removed from your saved list",
      });
    } else {
      setSavedVideos([...savedVideos, videoId]);
      toast({
        title: "Video saved",
        description: "Video added to your saved list",
      });
    }
  };
  
  const toggleLikeVideo = (videoId: string) => {
    if (likedVideos.includes(videoId)) {
      setLikedVideos(likedVideos.filter(id => id !== videoId));
    } else {
      setLikedVideos([...likedVideos, videoId]);
      toast({
        title: "Liked!",
        description: "We've recorded your like for this video",
      });
    }
  };
  
  const openVideoPlayer = (video: VideoContent) => {
    setSelectedVideo(video);
  };
  
  const currentVideoIndex = selectedVideo ? processedVideos.findIndex(v => v.id === selectedVideo.id) : -1;
  
  const handleNext = () => {
    if (currentVideoIndex < processedVideos.length - 1) {
      setSelectedVideo(processedVideos[currentVideoIndex + 1]);
    }
  };
  
  const handlePrevious = () => {
    if (currentVideoIndex > 0) {
      setSelectedVideo(processedVideos[currentVideoIndex - 1]);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 space-y-8 p-4 md:p-8 pt-20">
        {/* Hero Section - Ultra Atractivo */}
        <div className="relative w-full h-[50vh] md:h-[75vh] overflow-hidden rounded-2xl mb-8 shadow-2xl">
          {/* Video de fondo con overlay mejorado */}
          <div className="absolute inset-0">
            {featuredVideo && (
              <video
                className="absolute inset-0 w-full h-full object-cover scale-105"
                src={featuredVideo.filePath}
                autoPlay
                muted
                loop
                playsInline
                onError={(e) => {
                  console.error('Error loading featured video:', featuredVideo.filePath);
                }}
              />
            )}
            
            {/* Overlay gradiente dramático */}
            <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/30" />
            
            {/* Efecto de brillo animado */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent"
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2 }}
            />
          </div>
          
          {/* Contenido */}
          <div className="relative h-full flex items-center px-4 md:px-16">
            <div className="max-w-3xl z-10">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7 }}
              >
                {/* Badge superior */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mb-4"
                >
                  <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 text-sm font-semibold shadow-lg">
                    <Sparkles className="w-4 h-4 mr-2 inline" />
                    NOW STREAMING
                  </Badge>
                </motion.div>
                
                {/* Título principal */}
                <h1 className="text-4xl md:text-7xl font-bold text-white mb-6 leading-tight">
                  Welcome to{" "}
                  <span className="relative inline-block">
                    <span className="bg-gradient-to-r from-orange-500 via-orange-400 to-yellow-400 bg-clip-text text-transparent">
                      Boostify TV
                    </span>
                    <motion.div
                      className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-orange-500 to-yellow-400 rounded-full"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.8, delay: 0.5 }}
                    />
                  </span>
                </h1>
                
                {/* Subtítulo */}
                <p className="text-lg md:text-2xl text-gray-200 mb-8 font-light">
                  Stream exclusive music content, live performances, and behind-the-scenes footage from the world's best artists
                </p>
                
                {/* Estadísticas rápidas */}
                <div className="flex flex-wrap gap-6 mb-8">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex items-center gap-2 text-white/90"
                  >
                    <div className="w-12 h-12 bg-orange-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Film className="w-6 h-6 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{processedVideos.length}+</div>
                      <div className="text-sm text-gray-300">Videos</div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="flex items-center gap-2 text-white/90"
                  >
                    <div className="w-12 h-12 bg-purple-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Users className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">10K+</div>
                      <div className="text-sm text-gray-300">Artists</div>
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="flex items-center gap-2 text-white/90"
                  >
                    <div className="w-12 h-12 bg-pink-500/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <TrendingUp className="w-6 h-6 text-pink-400" />
                    </div>
                    <div>
                      <div className="text-2xl font-bold">1M+</div>
                      <div className="text-sm text-gray-300">Views</div>
                    </div>
                  </motion.div>
                </div>
                
                {/* Video destacado */}
                {featuredVideo && (
                  <motion.div 
                    className="bg-black/60 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-2xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.7 }}
                  >
                    <div className="flex items-start gap-4">
                      {/* Thumbnail del video */}
                      <div className="relative w-32 h-20 rounded-lg overflow-hidden shrink-0 hidden md:block">
                        <video
                          className="w-full h-full object-cover"
                          src={featuredVideo.filePath}
                          muted
                        />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
                            <Play className="w-5 h-5 text-white ml-0.5" />
                          </div>
                        </div>
                      </div>
                      
                      {/* Info del video */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs">
                            <Star className="w-3 h-3 mr-1" />
                            FEATURED NOW
                          </Badge>
                          <Badge variant="outline" className="border-white/20 text-white text-xs">
                            <Clock className="w-3 h-3 mr-1" />
                            {featuredVideo.duration}
                          </Badge>
                        </div>
                        <h3 className="text-white font-semibold text-lg mb-1 line-clamp-1">{featuredVideo.title}</h3>
                        <p className="text-gray-300 text-sm mb-3 line-clamp-2">{featuredVideo.description}</p>
                        
                        {/* Botones de acción */}
                        <div className="flex gap-3">
                          <Button 
                            size="lg" 
                            className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30"
                            onClick={() => openVideoPlayer(featuredVideo)}
                            data-testid="button-watch-featured"
                          >
                            <Play className="w-5 h-5 mr-2" /> Watch Now
                          </Button>
                          <Button 
                            size="lg" 
                            variant="outline" 
                            className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm"
                          >
                            <Info className="w-5 h-5 mr-2" /> More Info
                          </Button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
          
          {/* Indicador de scroll */}
          <motion.div
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <div className="w-6 h-10 border-2 border-white/30 rounded-full flex items-start justify-center p-2">
              <motion.div
                className="w-1.5 h-1.5 bg-white rounded-full"
                animate={{ y: [0, 16, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
              />
            </div>
          </motion.div>
        </div>

        {/* Search Bar - Repositioned */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <h2 className="text-2xl md:text-3xl font-bold">Video Library</h2>
          
          <div className="flex gap-4 items-center w-full md:w-auto">
            <div className="relative flex-1 md:w-80">
              <Input
                placeholder="Search videos..."
                className="pr-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                data-testid="input-search-videos"
              />
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            
            {user && (
              <Button
                onClick={() => setIsUploadDialogOpen(true)}
                className="bg-orange-500 hover:bg-orange-600 text-white shrink-0"
                size="sm"
                data-testid="button-upload-video"
              >
                <PlusCircle className="w-4 h-4 md:mr-2" />
                <span className="hidden md:inline">Upload</span>
              </Button>
            )}
          </div>
        </div>

        {/* Stats section - Enhanced */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Videos</p>
                  <h3 className="text-3xl font-bold mt-1">
                    {isLoading ? (
                      <Skeleton className="h-10 w-16" />
                    ) : (
                      processedVideos.length
                    )}
                  </h3>
                </div>
                <div className="h-16 w-16 bg-orange-500/20 rounded-full flex items-center justify-center">
                  <Film className="h-8 w-8 text-orange-600 dark:text-orange-400" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                    <span>New this month: {Math.floor(processedVideos.length * 0.4)}</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Views</p>
                  <h3 className="text-3xl font-bold mt-1">
                    {isLoading ? (
                      <Skeleton className="h-10 w-24" />
                    ) : (
                      processedVideos.reduce((sum, video) => sum + video.views, 0).toLocaleString()
                    )}
                  </h3>
                </div>
                <div className="h-16 w-16 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  <div className="flex items-center">
                    <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                    <span>+37% from last month</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
          
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.2 }}>
            <Card className="p-6 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900 border-pink-200 dark:border-pink-800 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-pink-600 dark:text-pink-400">Popular</p>
                  <h3 className="text-2xl font-bold mt-1">
                    {isLoading ? (
                      <Skeleton className="h-10 w-20" />
                    ) : (
                      processedVideos.filter(v => v.category === "featured").length > 0 ? "Featured" : "Music"
                    )}
                  </h3>
                </div>
                <div className="h-16 w-16 bg-pink-500/20 rounded-full flex items-center justify-center">
                  <Star className="h-8 w-8 text-pink-600 dark:text-pink-400" />
                </div>
              </div>
              <div className="mt-4 text-sm text-muted-foreground">
                {isLoading ? (
                  <Skeleton className="h-4 w-full" />
                ) : (
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-1 text-blue-500" />
                    <span>2.5x more engagement</span>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>
        </div>
        
        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-6">
            <div className="flex gap-2">
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-video w-full" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ) : isError ? (
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <Film className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-xl font-semibold mb-2">Error loading videos</p>
              <p className="text-muted-foreground">Please try again later</p>
            </div>
          </div>
        ) : (
          <>
            <Tabs value={selectedTab} onValueChange={setSelectedTab}>
              <TabsList className="flex flex-wrap gap-2 mb-6 bg-muted/50">
                <TabsTrigger value="featured" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-featured">
                  <Star className="w-4 h-4 mr-2" />
                  Featured
                </TabsTrigger>
                <TabsTrigger value="videos" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-videos">
                  <Film className="w-4 h-4 mr-2" />
                  Videos
                </TabsTrigger>
                {processedVideos.some((v: VideoContent) => v.category === "live") && (
                  <TabsTrigger value="live" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-live">
                    <Tv className="w-4 h-4 mr-2" />
                    Live
                  </TabsTrigger>
                )}
                {processedVideos.some((v: VideoContent) => v.category === "music") && (
                  <TabsTrigger value="music" className="data-[state=active]:bg-orange-500 data-[state=active]:text-white" data-testid="tab-music">
                    <Music2 className="w-4 h-4 mr-2" />
                    Music
                  </TabsTrigger>
                )}
              </TabsList>

              {["featured", "videos", "live", "music"].map((category) => (
                <TabsContent key={category} value={category}>
                  {(searchTerm ? filteredVideos : processedVideos).filter((video: VideoContent) => video.category === category).length === 0 && (
                    <div className="text-center py-16 border border-dashed rounded-lg">
                      <Film className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium mb-2">No videos in this category</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        {searchTerm 
                          ? `No results found for "${searchTerm}" in this category.` 
                          : "No videos available in this category yet."}
                      </p>
                      {user && (
                        <Button onClick={() => setIsUploadDialogOpen(true)} data-testid="button-upload-first">
                          <PlusCircle className="w-4 h-4 mr-2" />
                          Upload the first one
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(searchTerm ? filteredVideos : processedVideos)
                      .filter((video: VideoContent) => video.category === category)
                      .map((video: VideoContent) => (
                        <motion.div
                          key={video.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                          whileHover={{ y: -8 }}
                        >
                          <Card 
                            className="overflow-hidden group hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-orange-500/50 bg-card/50 backdrop-blur-sm"
                            id={`video-${video.id}`}
                            data-testid={`video-card-${video.id}`}
                          >
                            <div className="aspect-video relative overflow-hidden bg-gradient-to-br from-orange-500/10 to-purple-500/10">
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center z-20">
                                <Button 
                                  size="lg" 
                                  className="bg-orange-500 hover:bg-orange-600 text-white rounded-full w-16 h-16 shadow-lg"
                                  onClick={() => openVideoPlayer(video)}
                                  data-testid={`button-play-${video.id}`}
                                >
                                  <Play className="w-8 h-8 ml-1" />
                                </Button>
                              </div>
                              
                              <Badge 
                                className="absolute top-3 left-3 z-30 bg-orange-500 text-white shadow-lg"
                              >
                                {category === "featured" && "Featured"}
                                {category === "videos" && "Video"}
                                {category === "live" && "Live"}
                                {category === "music" && "Music"}
                              </Badge>
                              
                              <Badge 
                                className="absolute bottom-3 right-3 z-30 bg-black/80 text-white"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {video.duration || "0:00"}
                              </Badge>

                              <video
                                className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                                src={`${video.filePath}#t=0.5`}
                                preload="metadata"
                                onError={(e) => {
                                  const target = e.target as HTMLVideoElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && !parent.querySelector('.error-placeholder')) {
                                    const placeholder = document.createElement('div');
                                    placeholder.className = 'error-placeholder absolute inset-0 flex items-center justify-center bg-gradient-to-br from-orange-900 to-purple-900';
                                    placeholder.innerHTML = `
                                      <div class="text-center text-white">
                                        <svg class="w-16 h-16 mx-auto mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                                        </svg>
                                        <p class="text-sm">Video Preview</p>
                                      </div>
                                    `;
                                    parent.appendChild(placeholder);
                                  }
                                }}
                              />
                            </div>
                            
                            <div className="p-4 bg-gradient-to-b from-card to-card/50">
                              <div className="flex justify-between items-start mb-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <h3 className="font-semibold text-lg line-clamp-1 cursor-help">{video.title}</h3>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-md">
                                      <div className="p-1">
                                        <p className="font-medium">{video.title}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{video.description}</p>
                                      </div>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" data-testid={`button-share-${video.id}`}>
                                      <Share2 className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => shareVideo(video, 'facebook')}>
                                      <Facebook className="mr-2 h-4 w-4" />
                                      <span>Facebook</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => shareVideo(video, 'twitter')}>
                                      <Twitter className="mr-2 h-4 w-4" />
                                      <span>Twitter</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => shareVideo(video, 'instagram')}>
                                      <Instagram className="mr-2 h-4 w-4" />
                                      <span>Instagram</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => shareVideo(video, 'linkedin')}>
                                      <Linkedin className="mr-2 h-4 w-4" />
                                      <span>LinkedIn</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => shareVideo(video, 'copy')}>
                                      <Copy className="mr-2 h-4 w-4" />
                                      <span>Copy link</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                                {video.description}
                              </p>
                              
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    {video.views.toLocaleString()}
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <motion.div whileTap={{ scale: 0.9 }}>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className={`h-8 w-8 transition-colors ${likedVideos.includes(video.id) ? 'text-orange-500 hover:text-orange-600' : 'hover:text-orange-500'}`}
                                      onClick={() => toggleLikeVideo(video.id)}
                                      data-testid={`button-like-${video.id}`}
                                    >
                                      <ThumbsUp className="h-4 w-4" fill={likedVideos.includes(video.id) ? "currentColor" : "none"} />
                                    </Button>
                                  </motion.div>
                                  <motion.div whileTap={{ scale: 0.9 }}>
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      className={`h-8 w-8 transition-colors ${savedVideos.includes(video.id) ? 'text-orange-500 hover:text-orange-600' : 'hover:text-orange-500'}`}
                                      onClick={() => toggleSaveVideo(video.id)}
                                      data-testid={`button-save-${video.id}`}
                                    >
                                      <Bookmark className="h-4 w-4" fill={savedVideos.includes(video.id) ? "currentColor" : "none"} />
                                    </Button>
                                  </motion.div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
        
        {/* Recommended Section - Enhanced */}
        {!isLoading && !isError && processedVideos.length > 0 && (
          <motion.div 
            className="mt-12 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-6">Recommended for you</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {processedVideos.slice(0, 4).map((video: VideoContent) => (
                <motion.div
                  key={`rec-${video.id}`}
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group" onClick={() => openVideoPlayer(video)} data-testid={`recommended-${video.id}`}>
                    <div className="aspect-video relative bg-gradient-to-br from-orange-500/10 to-purple-500/10">
                      <video
                        className="w-full h-full object-cover"
                        src={`${video.filePath}#t=0.5`}
                        preload="metadata"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="bg-orange-500 rounded-full p-3">
                          <Play className="h-6 w-6 text-white ml-0.5" />
                        </div>
                      </div>
                      <Badge className="absolute bottom-2 right-2 bg-black/80 text-white text-xs">
                        {video.duration || "0:00"}
                      </Badge>
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium text-sm line-clamp-2 mb-1">{video.title}</h4>
                      <p className="text-xs text-muted-foreground">{video.views.toLocaleString()} views</p>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
        
        {/* Coming Soon: Live Podcast Studio */}
        <motion.div 
          className="mt-16 mb-16"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-900 via-orange-900 to-black border border-orange-500/20">
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="relative p-8 md:p-12">
              <div className="flex items-center gap-2 mb-6">
                <Badge className="bg-orange-500 text-white px-4 py-1.5 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 mr-2 inline" />
                  COMING JANUARY 2026
                </Badge>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div>
                  <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
                    Live Podcast Studio
                  </h2>
                  <p className="text-lg text-orange-100 mb-6">
                    Connect, create, and broadcast professional live podcasts with multiple participants. 
                    Edit in real-time with our professional switcher and stream simultaneously 
                    to all your social networks.
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Users className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Up to 3 Live Participants</h4>
                        <p className="text-sm text-orange-200">Connect with co-hosts and guests from anywhere in the world</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Video className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Professional Real-Time Switcher</h4>
                        <p className="text-sm text-orange-200">Control your live output like a pro with our integrated switcher</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-500/20 rounded-lg">
                        <Radio className="w-5 h-5 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Multi-Streaming to Social Media</h4>
                        <p className="text-sm text-orange-200">Stream simultaneously to YouTube, Facebook, Instagram, Twitch and more</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-lg">
                        <Mic className="w-5 h-5 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-white mb-1">Professional HD Audio & Video</h4>
                        <p className="text-sm text-orange-200">Studio quality with noise reduction and automatic enhancement</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4">
                    <Button 
                      size="lg" 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30"
                    >
                      <Calendar className="w-5 h-5 mr-2" />
                      Notify me at launch
                    </Button>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-orange-500/50 text-white hover:bg-orange-500/10"
                    >
                      <Info className="w-5 h-5 mr-2" />
                      More information
                    </Button>
                  </div>
                </div>
                
                <div className="relative">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 shadow-2xl">
                    <div className="absolute inset-0 p-4">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-white font-semibold">LIVE</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="px-3 py-1 bg-white/10 rounded text-xs text-white">1.2K viewers</div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        {[1, 2, 3].map((i) => (
                          <div key={i} className="aspect-video bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-lg border border-white/10 relative">
                            <div className="absolute inset-0 flex items-center justify-center">
                              <Users className="w-8 h-8 text-white/40" />
                            </div>
                            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-xs text-white">
                              Host {i}
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-center gap-3">
                        <div className="p-2 bg-orange-500/80 rounded-full">
                          <Mic className="w-4 h-4 text-white" />
                        </div>
                        <div className="p-2 bg-orange-500/80 rounded-full">
                          <Video className="w-4 h-4 text-white" />
                        </div>
                        <div className="p-2 bg-purple-500/80 rounded-full">
                          <Zap className="w-4 h-4 text-white" />
                        </div>
                        <div className="p-2 bg-red-500/80 rounded-full">
                          <Radio className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <motion.div 
                    className="absolute -top-4 -right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-full shadow-lg"
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    <span className="text-sm font-semibold">Professional Tools</span>
                  </motion.div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* CTA for non-registered users */}
        {!user && !isLoading && !isError && (
          <motion.div 
            className="mt-12 mb-8 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg p-8 text-white"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="mb-6 md:mb-0">
                <h2 className="text-2xl font-bold mb-2">Want to upload your own videos?</h2>
                <p className="text-orange-100 max-w-md">
                  Join the Boostify TV community and share your creations with musicians from around the world.
                </p>
              </div>
              <div className="flex gap-4">
                <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/20">
                  Log in
                </Button>
                <Button size="lg" className="bg-white text-orange-600 hover:bg-orange-50">
                  Sign up free
                </Button>
              </div>
            </div>
          </motion.div>
        )}
        
        {isUploadDialogOpen && (
          <VideoUpload
            isOpen={isUploadDialogOpen}
            onClose={() => setIsUploadDialogOpen(false)}
          />
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-gradient-to-br from-orange-950 to-black text-orange-100 py-12 px-4 md:px-8 border-t border-orange-900">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4 text-orange-400">Boostify TV</h3>
            <p className="text-sm text-orange-300">
              The streaming platform designed specifically for musicians and music lovers.
            </p>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Explore</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-orange-300 transition-colors">Featured Videos</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">Live</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">Tutorials</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">Music</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><a href="#" className="hover:text-orange-300 transition-colors">Terms and Conditions</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">Copyright</a></li>
              <li><a href="#" className="hover:text-orange-300 transition-colors">Cookies</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center">
                <a href="#" className="hover:text-orange-300 transition-colors">Support</a>
              </li>
              <li className="flex items-center">
                <a href="#" className="hover:text-orange-300 transition-colors">Partnerships</a>
              </li>
              <li className="flex items-center">
                <a href="#" className="hover:text-orange-300 transition-colors">Help</a>
              </li>
            </ul>
            <div className="mt-4 flex gap-4">
              <a href="#" className="text-orange-300 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-orange-300 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-orange-300 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto border-t border-orange-800 mt-8 pt-8 text-sm text-orange-400 text-center">
          © {new Date().getFullYear()} Boostify TV. All rights reserved.
        </div>
      </footer>
      
      {selectedVideo && (
        <VideoPlayer
          video={selectedVideo}
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          onNext={currentVideoIndex < processedVideos.length - 1 ? handleNext : undefined}
          onPrevious={currentVideoIndex > 0 ? handlePrevious : undefined}
        />
      )}
    </div>
  );
}
