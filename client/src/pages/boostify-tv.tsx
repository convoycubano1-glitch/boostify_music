import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { Play, Tv, Film, Music2, Star, Clock, TrendingUp, Search } from "lucide-react";
import { motion } from "framer-motion";

interface VideoContent {
  id: number;
  title: string;
  description: string;
  source: string;
  thumbnail: string;
  duration: string;
  views: number;
  category: "featured" | "live" | "videos" | "music";
}

const videoContent: VideoContent[] = [
  {
    id: 1,
    title: "AI Generated Music Video Sample",
    description: "Experience the future of music video creation with our AI technology",
    source: "/Standard_Mode_Generated_Video (7).mp4",
    thumbnail: "/video-thumbnail-1.jpg",
    duration: "3:45",
    views: 12500,
    category: "featured"
  },
  {
    id: 2,
    title: "Behind the Scenes - Studio Session",
    description: "Watch how our artists create magic in the studio",
    source: "/Standard_Mode_Generated_Video (2).mp4",
    thumbnail: "/video-thumbnail-2.jpg",
    duration: "5:20",
    views: 8300,
    category: "featured"
  },
  {
    id: 3,
    title: "Live Performance Highlights",
    description: "Best moments from our latest live performances",
    source: "/Standard_Mode_Generated_Video (3).mp4",
    thumbnail: "/video-thumbnail-3.jpg",
    duration: "4:15",
    views: 15700,
    category: "live"
  }
];

export default function BoostifyTvPage() {
  const [playingVideo, setPlayingVideo] = useState<number | null>(null);

  const handlePlayVideo = (videoId: number) => {
    setPlayingVideo(videoId);
    const video = document.getElementById(`video-${videoId}`) as HTMLVideoElement;
    if (video) {
      video.play();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 space-y-8 p-4 md:p-8 pt-20">
        {/* Hero Section with Video Background */}
        <div className="relative w-full h-[50vh] overflow-hidden rounded-xl mb-8">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/Standard_Mode_Generated_Video (7).mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40" />
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
                <div className="flex gap-4">
                  <Button
                    size="lg"
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Watching
                  </Button>
                  <div className="relative flex-1 max-w-sm">
                    <Input
                      placeholder="Search videos..."
                      className="w-full bg-white/10 border-white/20 text-white placeholder:text-white/60"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Content Navigation */}
        <Tabs defaultValue="featured" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2">
            <TabsTrigger value="featured" className="data-[state=active]:bg-orange-500">
              <Star className="w-4 h-4 mr-2" />
              Featured
            </TabsTrigger>
            <TabsTrigger value="live" className="data-[state=active]:bg-orange-500">
              <Tv className="w-4 h-4 mr-2" />
              Live
            </TabsTrigger>
            <TabsTrigger value="videos" className="data-[state=active]:bg-orange-500">
              <Film className="w-4 h-4 mr-2" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="music" className="data-[state=active]:bg-orange-500">
              <Music2 className="w-4 h-4 mr-2" />
              Music
            </TabsTrigger>
          </TabsList>

          {/* Featured Content */}
          <TabsContent value="featured">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoContent
                .filter(video => video.category === "featured")
                .map((video) => (
                  <Card key={video.id} className="overflow-hidden group">
                    <div className="aspect-video relative">
                      <video
                        id={`video-${video.id}`}
                        className="w-full h-full object-cover"
                        poster={video.thumbnail}
                        controls={playingVideo === video.id}
                      >
                        <source src={video.source} type="video/mp4" />
                      </video>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      {playingVideo !== video.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlayVideo(video.id)}
                          className="absolute inset-0 m-auto bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Play className="w-8 h-8" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{video.title}</h3>
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

          {/* Live Content */}
          <TabsContent value="live">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videoContent
                .filter(video => video.category === "live")
                .map((video) => (
                  <Card key={video.id} className="overflow-hidden group">
                    <div className="aspect-video relative">
                      <video
                        id={`video-${video.id}`}
                        className="w-full h-full object-cover"
                        poster={video.thumbnail}
                        controls={playingVideo === video.id}
                      >
                        <source src={video.source} type="video/mp4" />
                      </video>
                      <div className="absolute top-2 left-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                        LIVE
                      </div>
                      {playingVideo !== video.id && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handlePlayVideo(video.id)}
                          className="absolute inset-0 m-auto bg-white/20 hover:bg-white/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Play className="w-8 h-8" />
                        </Button>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold mb-2">{video.title}</h3>
                      <p className="text-sm text-muted-foreground">
                        {video.description}
                      </p>
                    </div>
                  </Card>
                ))}
            </div>
          </TabsContent>

          {/* Videos and Music Content placeholders with proper styling */}
          <TabsContent value="videos">
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold mb-4">Video Library</h3>
              <p className="text-muted-foreground">
                Our video library is being updated with the latest content. Check back soon!
              </p>
            </div>
          </TabsContent>

          <TabsContent value="music">
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold mb-4">Music Channel</h3>
              <p className="text-muted-foreground">
                Get ready for exclusive music content and artist performances!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}