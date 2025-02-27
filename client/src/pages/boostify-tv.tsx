import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { 
  Play, Tv, Film, Music2, Star, Clock, TrendingUp, Search, 
  Share2, Facebook, Twitter, Copy, Instagram, Linkedin, Loader2
} from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";

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
  const { toast } = useToast();
  
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 space-y-8 p-4 md:p-8 pt-20">
        {/* Hero Section without Video Background */}
        <div className="relative w-full h-[50vh] overflow-hidden rounded-xl mb-8 bg-gradient-to-r from-orange-900 to-gray-900">
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
                        window.location.href = `#video-${processedVideos[0].id}`;
                      }
                    }}
                    disabled={isLoading || isError || processedVideos.length === 0}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Watching
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
              </motion.div>
            </div>
          </div>
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
            {/* Content Navigation */}
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
              <TabsList className="flex flex-wrap gap-2">
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

              {/* Content Sections */}
              {["featured", "videos", "live", "music"].map((category) => (
                <TabsContent key={category} value={category}>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {(searchTerm ? filteredVideos : processedVideos)
                      .filter((video: VideoContent) => video.category === category)
                      .map((video: VideoContent) => (
                        <Card key={video.id} className="overflow-hidden group">
                          <div className="aspect-video relative">
                            <video
                              className="w-full h-full object-cover"
                              src={video.filePath}
                              controls
                              preload="metadata"
                            />
                          </div>
                          <div className="p-4">
                            <div className="flex justify-between items-start mb-2">
                              <h3 className="font-semibold">{video.title}</h3>
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
                                  <DropdownMenuItem onClick={() => shareVideo(video, 'copy')}>
                                    <Copy className="mr-2 h-4 w-4" />
                                    <span>Copy Link</span>
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4">
                              {video.description}
                            </p>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center">
                                <Clock className="w-4 h-4 mr-1" />
                                {video.duration}
                              </span>
                              <span className="flex items-center">
                                <TrendingUp className="w-4 h-4 mr-1" />
                                {video.views.toLocaleString()} views
                              </span>
                            </div>
                          </div>
                        </Card>
                      ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </>
        )}
      </main>
    </div>
  );
}