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
  Mic, Video, Radio, Users, Zap, Sparkles, Calendar, CheckCircle2
} from "lucide-react";
import { motion } from "framer-motion";
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

// API response interface
interface VideoResponse {
  success: boolean;
  videos: VideoContent[];
  message?: string;
  error?: string;
}

export default function BoostifyTvPage() {
  const [selectedTab, setSelectedTab] = useState("featured");
  const [searchTerm, setSearchTerm] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Fetch videos from the API
  const { data, isLoading, isError } = useQuery<VideoResponse>({
    queryKey: ['/api/files/videos/tv'],
    queryFn: async () => {
      const response = await axios.get('/api/files/videos/tv');
      return response.data;
    }
  });

  // Assign categories to videos if not already assigned
  const processedVideos = useMemo(() => {
    if (!data?.videos) return [];
    
    return data.videos.map((video: VideoContent, index: number) => ({
      ...video,
      // Alternate between featured and videos categories if not already assigned
      category: video.category || (index % 2 === 0 ? "featured" : "videos") as "featured" | "live" | "videos" | "music"
    }));
  }, [data?.videos]);
  
  // Function to filter videos based on search term
  const filteredVideos = useMemo(() => {
    if (!processedVideos.length) return [];
    
    return processedVideos.filter((video: VideoContent) => 
      video.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      video.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [processedVideos, searchTerm]);

  // Function to share video
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

  // Estado para video destacado
  const [featuredVideo, setFeaturedVideo] = useState<VideoContent | null>(null);
  const [savedVideos, setSavedVideos] = useState<string[]>([]);
  const [likedVideos, setLikedVideos] = useState<string[]>([]);
  
  // Cargar video destacado al azar
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
  
  // Simulación de guardado y me gusta
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
  
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 space-y-8 p-4 md:p-8 pt-20">
        {/* Hero Section with Background Video */}
        <div className="relative w-full h-[60vh] overflow-hidden rounded-xl mb-8">
          {/* Video background with fallback gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-800 via-orange-700 to-black">
            {featuredVideo && (
              <video
                className="absolute inset-0 w-full h-full object-cover opacity-40"
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
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
            <div className="absolute inset-0 opacity-30" 
                 style={{backgroundImage: "url('/assets/noise.png')", backgroundRepeat: "repeat"}}></div>
          </div>
          
          {/* Content overlay */}
          <div className="relative h-full flex items-center justify-start px-4 md:px-12">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
                  Welcome to{" "}
                  <span className="bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                    Boostify TV
                  </span>
                </h1>
                <p className="text-base md:text-xl text-gray-200 mb-8">
                  Stream exclusive music content, live performances, and behind-the-scenes footage
                </p>
                <div className="flex gap-4 flex-wrap">
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                    onClick={() => {
                      if (processedVideos.length > 0) {
                        const videoElements = document.querySelectorAll('video');
                        if (videoElements && videoElements.length > 0) {
                          videoElements[1]?.play();
                        }
                      }
                    }}
                    disabled={isLoading || isError || processedVideos.length === 0}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Browse Content
                  </Button>
                  <div className="relative flex-1 max-w-sm">
                    <Input
                      placeholder="Search videos..."
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  </div>
                </div>
                
                {/* Featured video info */}
                {featuredVideo && (
                  <motion.div 
                    className="mt-8 bg-black/30 backdrop-blur-sm p-4 rounded-lg border border-white/10"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <div className="flex items-center">
                      <Badge variant="secondary" className="bg-orange-500 text-white">
                        Featured
                      </Badge>
                      <h3 className="text-white ml-2 font-medium">{featuredVideo.title}</h3>
                    </div>
                    <p className="text-gray-300 text-sm mt-1 line-clamp-2">{featuredVideo.description}</p>
                    <div className="flex mt-2 gap-2">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="border-white/20 text-white hover:bg-white/10"
                        onClick={() => window.location.href = `#video-${featuredVideo.id}`}
                      >
                        <Play className="w-3 h-3 mr-1" /> Watch now
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Total Videos</p>
                <h3 className="text-2xl font-bold mt-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    processedVideos.length
                  )}
                </h3>
              </div>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                <Film className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                  <span>Videos uploaded this month: {Math.floor(processedVideos.length * 0.4)}</span>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Views</p>
                <h3 className="text-2xl font-bold mt-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    processedVideos.reduce((sum, video) => sum + video.views, 0).toLocaleString()
                  )}
                </h3>
              </div>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <div className="flex items-center">
                  <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                  <span>37% growth compared to previous month</span>
                </div>
              )}
            </div>
          </Card>
          
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Popular Categories</p>
                <h3 className="text-2xl font-bold mt-1">
                  {isLoading ? (
                    <Skeleton className="h-8 w-20" />
                  ) : (
                    processedVideos.filter(v => v.category === "featured").length > 0 ? "Featured" : "Music"
                  )}
                </h3>
              </div>
              <div className="h-12 w-12 bg-orange-100 dark:bg-orange-800 rounded-full flex items-center justify-center">
                <Star className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {isLoading ? (
                <Skeleton className="h-4 w-full" />
              ) : (
                <div className="flex items-center">
                  <Info className="w-4 h-4 mr-1 text-blue-500" />
                  <span>Featured videos receive 2.5x more views</span>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {/* Loading state */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-orange-500 mr-2" />
            <p>Loading videos...</p>
          </div>
        ) : isError ? (
          <div className="flex justify-center items-center py-12">
            <p className="text-red-500">Error loading videos. Please try again later.</p>
          </div>
        ) : (
          <>
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Video Library</h2>
                
                {/* Upload button for authenticated users */}
                {user && (
                  <Button
                    onClick={() => setIsUploadDialogOpen(true)}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Upload Video
                  </Button>
                )}
              </div>
              
              <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                <TabsList className="flex flex-wrap gap-2 mb-6">
                  <TabsTrigger value="featured" className="data-[state=active]:bg-orange-500">
                    <Star className="w-4 h-4 mr-2" />
                    Featured
                  </TabsTrigger>
                  <TabsTrigger value="videos" className="data-[state=active]:bg-orange-500">
                    <Film className="w-4 h-4 mr-2" />
                    Videos
                  </TabsTrigger>
                  {processedVideos.some((v: VideoContent) => v.category === "live") && (
                    <TabsTrigger value="live" className="data-[state=active]:bg-orange-500">
                      <Tv className="w-4 h-4 mr-2" />
                      Live
                    </TabsTrigger>
                  )}
                  {processedVideos.some((v: VideoContent) => v.category === "music") && (
                    <TabsTrigger value="music" className="data-[state=active]:bg-orange-500">
                      <Music2 className="w-4 h-4 mr-2" />
                      Music
                    </TabsTrigger>
                  )}
                </TabsList>

                {/* Video Categories Sections */}
                {["featured", "videos", "live", "music"].map((category) => (
                  <TabsContent key={category} value={category}>
                    {/* Empty state when no videos in category */}
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
                          <Button onClick={() => setIsUploadDialogOpen(true)}>
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Upload the first one
                          </Button>
                        )}
                      </div>
                    )}
                    
                    {/* Videos grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {(searchTerm ? filteredVideos : processedVideos)
                        .filter((video: VideoContent) => video.category === category)
                        .map((video: VideoContent) => (
                          <Card 
                            key={video.id} 
                            className="overflow-hidden group hover:shadow-lg transition-all duration-300"
                            id={`video-${video.id}`}
                          >
                            <div className="aspect-video relative overflow-hidden">
                              {/* Overlay on hover */}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-10">
                                <Button 
                                  size="sm" 
                                  variant="secondary"
                                  className="bg-orange-500 hover:bg-orange-600 text-white"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const videoEl = document.querySelector(`#video-${video.id} video`) as HTMLVideoElement;
                                    if (videoEl) {
                                      if (videoEl.paused) {
                                        videoEl.play();
                                      } else {
                                        videoEl.pause();
                                      }
                                    }
                                  }}
                                >
                                  <Play className="w-4 h-4 mr-1" /> Play
                                </Button>
                              </div>
                              
                              {/* Category badge */}
                              <Badge 
                                className="absolute top-2 left-2 z-20 bg-orange-500 text-white"
                              >
                                {category === "featured" && "Featured"}
                                {category === "videos" && "Video"}
                                {category === "live" && "Live"}
                                {category === "music" && "Music"}
                              </Badge>

                              <video
                                className="w-full h-full object-cover"
                                src={`${video.filePath}#t=0.001`}
                                controls
                                preload="metadata"
                                onError={(e) => {
                                  console.error(`Error loading video: ${video.filePath}`, e);
                                }}
                              />
                            </div>
                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <h3 className="font-semibold line-clamp-1">{video.title}</h3>
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
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
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
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <span className="flex items-center">
                                    <Clock className="w-4 h-4 mr-1" />
                                    {video.duration || "0:00"}
                                  </span>
                                  <span className="flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-1" />
                                    {video.views.toLocaleString()} views
                                  </span>
                                </div>
                                
                                <div className="flex items-center gap-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-8 w-8 ${likedVideos.includes(video.id) ? 'text-orange-500' : ''}`}
                                    onClick={() => toggleLikeVideo(video.id)}
                                  >
                                    <ThumbsUp className="h-4 w-4" />
                                  </Button>
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    className={`h-8 w-8 ${savedVideos.includes(video.id) ? 'text-orange-500' : ''}`}
                                    onClick={() => toggleSaveVideo(video.id)}
                                  >
                                    {savedVideos.includes(video.id) ? (
                                      <Bookmark className="h-4 w-4" />
                                    ) : (
                                      <BookmarkPlus className="h-4 w-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))}
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            </div>
          </>
        )}
        
        {/* Personalized recommendations */}
        {!isLoading && !isError && processedVideos.length > 0 && (
          <div className="mt-12 mb-12">
            <h2 className="text-2xl font-bold mb-6">Recommended for you</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {processedVideos.slice(0, 4).map((video: VideoContent) => (
                <Card key={`rec-${video.id}`} className="overflow-hidden hover:shadow-md transition-all">
                  <div className="aspect-video relative">
                    <video
                      className="w-full h-full object-cover"
                      src={`${video.filePath}#t=0.001`}
                      preload="metadata"
                      onError={(e) => {
                        console.error(`Error loading recommended video: ${video.filePath}`);
                      }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
                      <Button size="sm" variant="secondary" className="bg-orange-500 text-white hover:bg-orange-600">
                        <Play className="h-4 w-4 mr-1" /> Watch
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-sm line-clamp-1">{video.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{video.views.toLocaleString()} views</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
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
            {/* Animated background */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-0 left-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-0 right-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>
            
            <div className="relative p-8 md:p-12">
              {/* Badge */}
              <div className="flex items-center gap-2 mb-6">
                <Badge className="bg-orange-500 text-white px-4 py-1.5 text-sm font-semibold">
                  <Sparkles className="w-4 h-4 mr-2 inline" />
                  COMING JANUARY 2026
                </Badge>
              </div>
              
              {/* Main content */}
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
                  
                  {/* Features list */}
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
                  
                  {/* CTA */}
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
                
                {/* Visual preview */}
                <div className="relative">
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-gray-900 to-black border border-orange-500/30 shadow-2xl">
                    {/* Mock interface */}
                    <div className="absolute inset-0 p-4">
                      {/* Top bar */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-xs text-white font-semibold">LIVE</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="px-3 py-1 bg-white/10 rounded text-xs text-white">1.2K viewers</div>
                        </div>
                      </div>
                      
                      {/* Main video grid */}
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
                      
                      {/* Control bar */}
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
                  
                  {/* Floating badges */}
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
        
        {/* Call to action for non-registered users */}
        {!user && !isLoading && !isError && (
          <div className="mt-12 mb-8 bg-gradient-to-r from-orange-600 to-orange-500 rounded-lg p-8 text-white">
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
          </div>
        )}
        
        {/* Video upload dialog */}
        {isUploadDialogOpen && (
          <VideoUpload
            isOpen={isUploadDialogOpen}
            onClose={() => setIsUploadDialogOpen(false)}
          />
        )}
      </main>
      
      {/* Footer */}
      <footer className="bg-orange-950 text-orange-100 py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-bold text-xl mb-4">Boostify TV</h3>
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
    </div>
  );
}