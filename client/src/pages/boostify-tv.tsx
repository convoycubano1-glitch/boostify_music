import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TabsList, TabsTrigger, Tabs, TabsContent } from "@/components/ui/tabs";
import { Play, Tv, Film, Music2, Star, Clock, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";

export default function BoostifyTvPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 space-y-8 p-4 md:p-8 pt-20">
        {/* Hero Section */}
        <div className="relative w-full h-[50vh] overflow-hidden rounded-xl mb-8">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('/assets/tv-hero-background.jpg')"
            }}
          />
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
                <Button
                  size="lg"
                  className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Watching
                </Button>
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
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <Card key={item} className="overflow-hidden">
                  <div className="aspect-video relative">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <img
                      src={`/assets/featured-${item}.jpg`}
                      alt={`Featured content ${item}`}
                      className="w-full h-full object-cover"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      className="absolute inset-0 m-auto bg-white/20 hover:bg-white/30 text-white"
                    >
                      <Play className="w-8 h-8" />
                    </Button>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold mb-2">Featured Title {item}</h3>
                    <p className="text-sm text-muted-foreground">
                      Description of the featured content goes here
                    </p>
                    <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        10:30
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        10k views
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Placeholder for other tabs */}
          <TabsContent value="live">
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold mb-4">Live Streams Coming Soon</h3>
              <p className="text-muted-foreground">
                We're preparing amazing live content for you. Stay tuned!
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="videos">
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold mb-4">Video Library</h3>
              <p className="text-muted-foreground">
                Our video library is being updated. Check back soon!
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="music">
            <div className="text-center py-12">
              <h3 className="text-2xl font-semibold mb-4">Music Channel</h3>
              <p className="text-muted-foreground">
                Get ready for exclusive music content!
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
