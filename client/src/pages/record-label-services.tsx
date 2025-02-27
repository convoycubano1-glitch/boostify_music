import { ScoreCreator } from "@/components/manager/score-creator";
import { SoundDesigner } from "@/components/manager/sound-designer";
import { TimelineEditor } from "@/components/manager/timeline-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ServiceDialog } from "@/components/record-label/service-dialog";
import {
  Music2, Wand2, Video, Building2, ArrowRight, Shield, Banknote,
  Radio, Tv, Film, FileText, Brain, Play, Volume2, Pen, Clock,
  Mic2, Music4, Database, FilmIcon, TrendingUp, Calculator, Search,
  Badge, MapPin, Calendar, ChartBar, Users, Sparkles
} from "lucide-react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordLabelService } from "@/lib/services/record-label-service";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { RadioNetworksDialog } from "@/components/record-label/radio-networks-dialog";
import { TVNetworksDialog } from "@/components/record-label/tv-networks-dialog";
import { MovieNetworksDialog } from "@/components/record-label/movie-networks-dialog";
import CreativeContactSearch from "@/components/record-label/creative-contact-search";
import { VenuesCatalog } from "@/components/manager/venues-catalog";
import { VenuesBooking } from "@/components/manager/venues-booking";
import { VenuesReports } from "@/components/manager/venues-reports";
import { ArtistRoster } from "@/components/manager/artist-roster";

export default function RecordLabelServices() {
  const [selectedTab, setSelectedTab] = useState("radio-tv");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: services = [] } = useQuery({
    queryKey: ['record-label-services', user?.uid],
    queryFn: async () => {
      if (!user?.uid) return [];
      return recordLabelService.getServices(user.uid);
    },
    enabled: !!user
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section with Enhanced Video Background */}
        <div className="relative w-full min-h-[60vh] sm:min-h-[70vh] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-50"
            src="/assets/Standard_Mode_Generated_Video (9).mp4"
          />
          {/* Gradient overlay removed as requested */}
          <div className="absolute inset-0 bg-[url('/assets/noise.png')] opacity-20" />
          <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-1 text-xs sm:text-sm font-medium text-orange-500 ring-1 ring-inset ring-orange-500/20 mb-4">
                <Sparkles className="mr-1 h-3 w-3" /> New Features Available
              </span>
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                Publishing & Licensing <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-purple-400">
                  Reimagined
                </span>
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-white/90 mb-6 sm:mb-8 font-medium max-w-xl">
                Transform your music rights management with our AI-powered platform. Explore new opportunities across multiple media channels.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="w-full sm:w-auto bg-orange-500 hover:bg-orange-600">
                  Start Publishing
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline" className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10">
                  Watch Demo
                  <Play className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          </div>

          {/* Floating Stats - Only visible on desktop */}
          <div className="absolute bottom-8 left-0 right-0 z-20 hidden lg:block">
            <div className="container mx-auto px-4">
              <div className="grid grid-cols-4 gap-6">
                {[
                  { label: "Active Artists", value: "2,500+" },
                  { label: "Songs Published", value: "10,000+" },
                  { label: "Revenue Generated", value: "$5M+" },
                  { label: "Global Reach", value: "150+ Countries" }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
                  >
                    <p className="text-2xl font-bold text-white mb-2">{stat.value}</p>
                    <p className="text-sm text-white/70">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Stats Section */}
        <div className="lg:hidden bg-gradient-to-b from-background to-orange-500/5 py-4">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {[
                { label: "Active Artists", value: "2,500+" },
                { label: "Songs Published", value: "10,000+" },
                { label: "Revenue Generated", value: "$5M+" },
                { label: "Global Reach", value: "150+ Countries" }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 border border-white/20"
                >
                  <p className="text-lg sm:text-xl md:text-2xl font-bold text-white mb-1 sm:mb-2">{stat.value}</p>
                  <p className="text-xs sm:text-sm text-white/70">{stat.label}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Services Tabs with Modern Design */}
        <div className="container mx-auto px-4 py-6">
          <Tabs
            defaultValue={selectedTab}
            value={selectedTab}
            onValueChange={setSelectedTab}
            className="space-y-6 sm:space-y-8"
          >
            <div className="flex justify-start sm:justify-center overflow-x-auto pb-2 sm:pb-0">
              <TabsList className="inline-flex p-1 bg-background/50 backdrop-blur-sm rounded-full border border-orange-500/20">
                <TabsTrigger
                  value="radio-tv"
                  className="rounded-full px-3 sm:px-6 py-2 data-[state=active]:bg-orange-500 whitespace-nowrap text-sm"
                >
                  <Radio className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Radio & TV</span>
                  <span className="sm:hidden">Radio</span>
                </TabsTrigger>
                <TabsTrigger
                  value="movies"
                  className="rounded-full px-3 sm:px-6 py-2 data-[state=active]:bg-orange-500 whitespace-nowrap text-sm"
                >
                  <Film className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Movies</span>
                  <span className="sm:hidden">Movies</span>
                </TabsTrigger>
                <TabsTrigger
                  value="creator"
                  className="rounded-full px-3 sm:px-6 py-2 data-[state=active]:bg-orange-500 whitespace-nowrap text-sm"
                >
                  <Music4 className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Creator Tools</span>
                  <span className="sm:hidden">Tools</span>
                </TabsTrigger>
                <TabsTrigger
                  value="contracts"
                  className="rounded-full px-3 sm:px-6 py-2 data-[state=active]:bg-orange-500 whitespace-nowrap text-sm"
                >
                  <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Contracts</span>
                  <span className="sm:hidden">Contracts</span>
                </TabsTrigger>
                <TabsTrigger
                  value="ai"
                  className="rounded-full px-3 sm:px-6 py-2 data-[state=active]:bg-orange-500 whitespace-nowrap text-sm"
                >
                  <Brain className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">AI Assistant</span>
                  <span className="sm:hidden">AI</span>
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Radio & TV Content */}
            <TabsContent value="radio-tv">
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2 mb-8">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-4 sm:p-8 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-orange-500/10 rounded-2xl">
                        <Radio className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold">Radio Publishing</h3>
                        <p className="text-sm text-muted-foreground">
                          Expand your reach through radio networks
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {['National Networks', 'Local Stations', 'Internet Radio'].map((network) => (
                        <motion.div
                          key={network}
                          whileHover={{ x: 5 }}
                          className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{network}</span>
                            <RadioNetworksDialog>
                              <Button variant="ghost" size="sm" className="hover:bg-orange-500/10">
                                Explore <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </RadioNetworksDialog>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="p-4 sm:p-8 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-orange-500/10 rounded-2xl">
                        <Tv className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold">TV Licensing</h3>
                        <p className="text-sm text-muted-foreground">
                          License your music for television
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {['Shows & Series', 'Commercials', 'Network Promos'].map((type) => (
                        <motion.div
                          key={type}
                          whileHover={{ x: 5 }}
                          className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{type}</span>
                            <TVNetworksDialog>
                              <Button variant="ghost" size="sm" className="hover:bg-orange-500/10">
                                View Details <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </TVNetworksDialog>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>
              
              {/* Nueva sección de búsqueda creativa de contactos */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-br from-background to-orange-500/5 rounded-xl p-4 sm:p-6 shadow-md border border-orange-500/20 mb-8"
              >
                <div className="flex items-center gap-4 mb-6">
                  <div className="p-4 bg-orange-500/10 rounded-2xl">
                    <Search className="h-8 w-8 text-orange-500" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-semibold">Búsqueda Creativa de Contactos</h3>
                    <p className="text-sm text-muted-foreground">
                      Encuentra y conecta con contactos en la industria para promocionar tu música
                    </p>
                  </div>
                </div>
                
                <CreativeContactSearch />
              </motion.div>
            </TabsContent>

            {/* Movies Tab Content */}
            <TabsContent value="movies">
              <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-4 sm:p-8 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-orange-500/10 rounded-2xl">
                        <FilmIcon className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold">Movie Sync Licensing</h3>
                        <p className="text-sm text-muted-foreground">
                          Place your music in films and documentaries
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {['Feature Films', 'Independent Movies', 'Documentaries'].map((category) => (
                        <motion.div
                          key={category}
                          whileHover={{ x: 5 }}
                          className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{category}</span>
                            <MovieNetworksDialog>
                              <Button variant="ghost" size="sm" className="hover:bg-orange-500/10">
                                Browse <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            </MovieNetworksDialog>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="p-4 sm:p-8 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-orange-500/10 rounded-2xl">
                        <Database className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold">Music Library</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage your movie-ready tracks
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <motion.div
                        whileHover={{ y: 5 }}
                        className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">Movie-Ready Tracks</span>
                          <Button variant="ghost" size="sm" className="hover:bg-orange-500/10">
                            Upload Tracks <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </motion.div>
                    </div>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>


            {/* Creator Tools Tab Content */}
            <TabsContent value="creator">
              <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <ScoreCreator />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  <SoundDesigner />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <TimelineEditor />
                </motion.div>
              </div>
            </TabsContent>

            {/* Contracts Tab Content */}
            <TabsContent value="contracts">
              <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Card className="p-4 sm:p-8 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-orange-500/10 rounded-2xl">
                        <FileText className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold">Publishing Contracts</h3>
                        <p className="text-sm text-muted-foreground">
                          Manage your publishing agreements
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {['TV Licensing', 'Movie Sync', 'Radio Broadcasting'].map((type) => (
                        <motion.div
                          key={type}
                          whileHover={{ x: 5 }}
                          className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{type} Agreement</span>
                            <Badge>Template</Badge>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <Card className="p-4 sm:p-8 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="p-4 bg-orange-500/10 rounded-2xl">
                        <Pen className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-semibold">Active Contracts</h3>
                        <p className="text-sm text-muted-foreground">
                          Monitor your active agreements
                        </p>
                      </div>
                    </div>
                    <div className="space-y-4">
                      {['Netflix Series License', 'Universal Pictures Sync', 'BBC Radio License'].map((contract) => (
                        <motion.div
                          key={contract}
                          whileHover={{ x: 5 }}
                          className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{contract}</span>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Clock className="h-4 w-4" />
                              <span>Expires in 8 months</span>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </Card>
                </motion.div>
              </div>
            </TabsContent>

            {/* AI Assistant Tab Content */}
            <TabsContent value="ai">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="p-4 sm:p-8 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 bg-orange-500/10 rounded-2xl">
                      <Brain className="h-8 w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl sm:text-2xl font-semibold">Publishing AI Assistant</h3>
                      <p className="text-sm text-muted-foreground">
                        Get AI-powered insights and recommendations
                      </p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
                        <h4 className="font-medium mb-4">Ask AI Assistant</h4>
                        <Textarea
                          className="mb-4"
                          placeholder="Ask about publishing strategies..."
                          rows={4}
                        />
                        <Button className="w-full bg-orange-500 hover:bg-orange-600">
                          Get AI Response
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                      <div className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
                        <h4 className="font-medium mb-4">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-4 sm:gap-6">
                          {[
                            { icon: FileText, text: "Analyze Contract" },
                            { icon: TrendingUp, text: "Market Analysis" },
                            { icon: Calculator, text: "Royalty Estimator" },
                            { icon: Search, text: "Opportunity Finder" }
                          ].map((action, index) => (
                            <Button key={index} variant="ghost" className="justify-start hover:bg-orange-500/10">
                              <action.icon className="mr-2 h-4 w-4" />
                              {action.text}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="p-4 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
                        <h4 className="font-medium mb-4">AI Insights</h4>
                        <div className="space-y-3">
                          {[
                            { title: "Publishing Opportunity", description: "Your catalog shows strong potential for TV commercial licensing based on recent trends." },
                            { title: "Market Strategy", description: "Consider focusing on documentary film scoring based on your recent success rates." }
                          ].map((insight, index) => (
                            <div className="flex gap-3" key={index}>
                              <Brain className="h-5 w-5 text-orange-500 mt-0.5" />
                              <div>
                                <p className="font-medium">{insight.title}</p>
                                <p className="text-sm text-muted-foreground">
                                  {insight.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Royalty Importance Section */}
        <div className="bg-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <Banknote className="h-10 md:h-12 w-10 md:w-12 text-orange-500 mx-auto mb-6" />
              <h2 className="text-2xl md:text-3xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
                The Power of Perpetual Royalties
              </h2>
              <div className="prose prose-lg mx-auto dark:prose-invert">
                <p className="text-sm md:text-base text-muted-foreground/90 leading-relaxed">
                  In today's digital age, classic music represents an untapped goldmine of potential revenue.
                  Many timeless tracks have stopped generating royalties simply because they haven't been
                  adapted for modern audiences and platforms.
                </p>
                <p className="text-sm md:text-base text-muted-foreground/90 leading-relaxed">
                  By reviving these classics through AI-powered remixes, modern mastering, and compelling
                  video content, we can:
                </p>
                <ul className="text-left list-disc pl-6 space-y-2 mb-6 text-sm md:text-base text-muted-foreground/90">
                  <li>Introduce iconic music to new generations</li>
                  <li>Create additional revenue streams from existing catalogs</li>
                  <li>Preserve musical heritage while making it relevant for today's market</li>
                  <li>Enable continuous monetization across multiple platforms</li>
                  <li>Generate new licensing and sync opportunities</li>
                </ul>
                <p className="text-sm md:text-base text-muted-foreground/90 leading-relaxed">
                  Our platform provides the tools and technology needed to transform your dormant catalog
                  into an active revenue-generating asset, ensuring your music continues to earn and
                  resonate with audiences for years to come.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Features Grid with Modern Cards */}
        <div className="container mx-auto px-4 py-16 bg-gradient-to-b from-background via-orange-500/5 to-background">
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h2 className="text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
                Comprehensive Revival Tools
              </h2>
              <p className="text-lg text-muted-foreground">
                Everything you need to bring your music into the modern era
              </p>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Music2,
                title: "AI Music Generation",
                description: "Create modern remixes while preserving the original essence",
                type: "remix" as const,
                dialogTitle: "Generate AI Remix",
                dialogDescription: "Create a modern remix of your track using AI"
              },
              {
                icon: Wand2,
                title: "Professional Mastering",
                description: "State-of-the-art AI mastering for perfect sound",
                type: "mastering" as const,
                dialogTitle: "AI Mastering",
                dialogDescription: "Master your track using AI technology"
              },
              {
                icon: Video,
                title: "Video Generation",
                description: "Create compelling music videos with AI",
                type: "video" as const,
                dialogTitle: "Generate Music Video",
                dialogDescription: "Create an AI-generated music video concept"
              }
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card className="p-4 sm:p-6 hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-background to-orange-500/5 border-orange-500/20 hover:border-orange-500/40">
                  <feature.icon className="h-12 w-12 text-orange-500 mb-4" />
                  <h3 className="text-lg sm:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {feature.description}
                  </p>
                  <ServiceDialog
                    type={feature.type}
                    title={feature.dialogTitle}
                    description={feature.dialogDescription}
                  >
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Try Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </ServiceDialog>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Manager Tools Section */}
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
              Manager Tools
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Essential tools for managing your artists and venues
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:gap-8 md:grid-cols-2 lg:grid-cols-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <VenuesCatalog />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <VenuesBooking />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <VenuesReports />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <ArtistRoster />
            </motion.div>
          </div>
        </div>

        {/* Record Label Registration */}
        <div className="bg-muted py-12 md:py-16 -mx-4 px-4">
          <div className="container mx-auto">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-8">
                <Building2 className="h-10 md:h-12 w-10 md:w-12 text-orange-500 mx-auto mb-4" />
                <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
                  Record Label Registration
                </h2>
                <p className="text-sm md:text-base text-muted-foreground">
                  Get access to our suite of AI-powered music revival tools
                </p>
              </div>

              <Card className="p-4 md:p-8">
                <form className="space-y-4 md:space-y-6">
                  {/* Registration Form */}
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        type="text"
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        type="text"
                        required
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Company Website</Label>
                    <Input
                      id="website"
                      type="url"
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Additional Information</Label>
                    <Textarea
                      id="message"
                      placeholder="Tell us about your catalog and what you're looking to achieve"
                      className="min-h-[100px] bg-background"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                    Submit Registration
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="mt-4 md:mt-6 flex items-center justify-center gap-2 text-xs md:text-sm text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Your information is secure and will never be shared</span>
                  </div>
                </form>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}