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
  youtubeId: string;
  duration: string;
  views: number;
  category: "featured" | "live" | "videos" | "music";
}

const videoContent: VideoContent[] = [
  {
    id: 1,
    title: "NPR Music Tiny Desk Concert - Anderson .Paak & The Free Nationals",
    description: "Experience an intimate performance showcasing raw talent and musicianship",
    youtubeId: "ferZnZ0_rSM",
    duration: "15:32",
    views: 45000000,
    category: "featured"
  },
  {
    id: 2,
    title: "Inside the Recording Studio - The Making of a Hit Song",
    description: "Behind the scenes look at professional music production",
    youtubeId: "VqOgJrvnJvg",
    duration: "8:45",
    views: 2800000,
    category: "featured"
  },
  {
    id: 3,
    title: "Live from Madison Square Garden - Concert Highlights",
    description: "Experience the energy of a sold-out arena performance",
    youtubeId: "8e5TlqxhQ0k",
    duration: "12:20",
    views: 1500000,
    category: "live"
  },
  {
    id: 4,
    title: "Artist Interview: Creative Process & Inspiration",
    description: "In-depth conversation about music creation and artistry",
    youtubeId: "gY7kEGrpYnY",
    duration: "25:15",
    views: 980000,
    category: "videos"
  },
  {
    id: 5,
    title: "Official Music Video - 'Dynamite' by BTS",
    description: "Watch the record-breaking music video that captivated millions",
    youtubeId: "gdZLi9oWNZg",
    duration: "3:43",
    views: 1800000000,
    category: "music"
  },
  {
    id: 6,
    title: "Studio Sessions: The Art of Mixing",
    description: "Professional audio engineer reveals mixing techniques",
    youtubeId: "TEjOdqZFvhY",
    duration: "18:30",
    views: 750000,
    category: "featured"
  },
  {
    id: 7,
    title: "Acoustic Performance - MTV Unplugged",
    description: "Stripped-down versions of popular hits",
    youtubeId: "BHiu-c_kq8U",
    duration: "22:15",
    views: 2500000,
    category: "live"
  },
  {
    id: 8,
    title: "Documentary: A Day in the Life of a Music Producer",
    description: "Follow a top producer's creative process",
    youtubeId: "q8e6TrT5x54",
    duration: "32:10",
    views: 1200000,
    category: "videos"
  },
  {
    id: 9,
    title: "Live Looping Performance - Ed Sheeran",
    description: "Watch how live looping creates a full band sound",
    youtubeId: "DV0TJZ7Kp40",
    duration: "14:25",
    views: 3500000,
    category: "featured"
  },
  {
    id: 10,
    title: "Songwriting Workshop with Industry Pros",
    description: "Learn from successful songwriters about their craft",
    youtubeId: "UJrSUHK9Luw",
    duration: "45:00",
    views: 890000,
    category: "videos"
  }
];

export default function BoostifyTvPage() {
  const [selectedTab, setSelectedTab] = useState("featured");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 space-y-8 p-4 md:p-8 pt-20">
        {/* Hero Section with Featured Video */}
        <div className="relative w-full h-[50vh] overflow-hidden rounded-xl mb-8">
          <iframe
            className="absolute inset-0 w-full h-full"
            src={`https://www.youtube.com/embed/${videoContent[0].youtubeId}?autoplay=1&mute=1&loop=1&playlist=${videoContent[0].youtubeId}&controls=0`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          ></iframe>
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
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
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

          {/* Content Sections */}
          {["featured", "live", "videos", "music"].map((category) => (
            <TabsContent key={category} value={category}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videoContent
                  .filter((video) => video.category === category)
                  .map((video) => (
                    <Card key={video.id} className="overflow-hidden group">
                      <div className="aspect-video relative">
                        <iframe
                          className="w-full h-full"
                          src={`https://www.youtube.com/embed/${video.youtubeId}`}
                          title={video.title}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
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
          ))}
        </Tabs>
      </main>
    </div>
  );
}