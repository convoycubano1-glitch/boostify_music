import { ScoreCreator } from "../components/manager/score-creator";
import { SoundDesigner } from "../components/manager/sound-designer";
import { TimelineEditor } from "../components/manager/timeline-editor";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { useState } from "react";
import { Header } from "../components/layout/header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ServiceDialog } from "../components/record-label/service-dialog";
import {
  Music2, Wand2, Video, Building2, ArrowRight, Shield, Banknote,
  Radio, Tv, Film, FileText, Brain, Play, Volume2, Pen, Clock,
  Mic2, Music4, Database, FilmIcon, TrendingUp, Calculator,
  Badge, MapPin, Calendar, ChartBar, Users, Sparkles, Star, 
  Music, Check, DollarSign, Globe, Award, BarChart, Zap
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { recordLabelService } from "../lib/services/record-label-service";
import { useAuth } from "../hooks/use-auth";
import { useToast } from "../hooks/use-toast";
import { RadioNetworksDialog } from "../components/record-label/radio-networks-dialog";
import { TVNetworksDialog } from "../components/record-label/tv-networks-dialog";
import { MovieNetworksDialog } from "../components/record-label/movie-networks-dialog";
import { VenuesCatalog } from "../components/manager/venues-catalog";
import { VenuesBooking } from "../components/manager/venues-booking";
import { VenuesReports } from "../components/manager/venues-reports";
import { motion } from "framer-motion";
import { 
  fadeIn, 
  slideInFromLeft, 
  slideInFromRight 
} from "../components/ui/motion";
import { ArtistRoster } from "../components/manager/artist-roster";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "../components/ui/accordion";

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

        {/* Key Benefits Section */}
        <section className="bg-gradient-to-b from-orange-500/5 to-background py-12 md:py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-10">
              <h2 className="text-2xl md:text-3xl font-bold">
                Why Choose Boostify <span className="text-orange-500">Record Label Services</span>
              </h2>
              <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">
                Maximize your music's potential with our comprehensive suite of publishing and licensing services
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  icon: <Globe className="h-10 w-10 text-orange-500" />,
                  title: "Global Distribution",
                  description: "Reach audiences in over 150 countries with our extensive distribution network"
                },
                {
                  icon: <BarChart className="h-10 w-10 text-orange-500" />,
                  title: "Real-time Analytics",
                  description: "Track your music's performance with detailed analytics and audience insights"
                },
                {
                  icon: <Shield className="h-10 w-10 text-orange-500" />,
                  title: "Rights Protection",
                  description: "Safeguard your intellectual property with our advanced rights management system"
                },
                {
                  icon: <DollarSign className="h-10 w-10 text-orange-500" />,
                  title: "Transparent Royalties",
                  description: "Receive clear, timely payments with our transparent royalty tracking system"
                },
                {
                  icon: <Zap className="h-10 w-10 text-orange-500" />,
                  title: "AI-Powered Matching",
                  description: "Match your music to the perfect licensing opportunities using our AI technology"
                },
                {
                  icon: <Award className="h-10 w-10 text-orange-500" />,
                  title: "Premium Placements",
                  description: "Get featured in high-profile media outlets, films, and TV productions"
                }
              ].map((benefit, index) => (
                <motion.div
                  key={benefit.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="flex flex-col items-center text-center p-6 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all"
                >
                  <div className="p-4 rounded-full bg-orange-500/10 mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

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
                  <CardHeader className="px-0 pt-0">
                    <div className="flex items-center gap-4">
                      <div className="p-4 bg-orange-500/10 rounded-2xl">
                        <Brain className="h-8 w-8 text-orange-500" />
                      </div>
                      <div>
                        <CardTitle className="text-xl sm:text-2xl">Publishing AI Assistant</CardTitle>
                        <CardDescription>
                          Get AI-powered insights for your music publishing strategy
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <div className="p-5 rounded-xl border border-orange-500/20 hover:border-orange-500/40 hover:bg-orange-500/5 transition-all">
                          <h4 className="font-medium mb-2 flex items-center">
                            <Wand2 className="mr-2 h-4 w-4 text-orange-500" />
                            Ask AI Assistant
                          </h4>
                          <Textarea
                            className="mb-4 min-h-[120px] resize-none focus-visible:ring-orange-500"
                            placeholder="How can I maximize my publishing revenue? What licensing strategies work best for indie artists?"
                            rows={4}
                          />
                          <div className="flex items-center gap-3">
                            <Button className="flex-1 bg-orange-500 hover:bg-orange-600">
                              Get Insights <Zap className="ml-2 h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon">
                              <Mic2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="p-5 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all">
                          <h4 className="font-medium mb-4 flex items-center">
                            <TrendingUp className="mr-2 h-4 w-4 text-orange-500" />
                            Quick Actions
                          </h4>
                          <div className="grid grid-cols-2 gap-4 sm:gap-6">
                            {[
                              { icon: FileText, text: "Analyze Contract" },
                              { icon: TrendingUp, text: "Market Analysis" },
                              { icon: Calculator, text: "Royalty Estimator" },
                              { icon: Sparkles, text: "Opportunity Finder" }
                            ].map((action, index) => (
                              <Button 
                                key={index} 
                                variant="outline" 
                                className="justify-start hover:bg-orange-500/10 border-orange-500/20 hover:border-orange-500/40 h-auto py-3"
                              >
                                <action.icon className="mr-2 h-4 w-4 text-orange-500" />
                                {action.text}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-6">
                        <div className="p-5 rounded-xl border border-orange-500/20 bg-orange-500/5">
                          <h4 className="font-medium mb-3 flex items-center">
                            <Star className="mr-2 h-4 w-4 text-orange-500" />
                            AI Insights & Recommendations
                          </h4>
                          <div className="space-y-4 text-sm">
                            <Accordion type="single" collapsible className="w-full">
                              <AccordionItem value="opportunities" className="border-orange-500/20">
                                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                                  <div className="flex items-center">
                                    <Sparkles className="mr-2 h-4 w-4 text-orange-500" />
                                    Publishing Opportunities
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <div className="space-y-4">
                                    <div className="p-3 rounded-lg bg-orange-500/10">
                                      <p className="font-medium">TV Commercial Licensing</p>
                                      <p className="text-muted-foreground text-xs">
                                        Your catalog shows strong potential for TV commercial licensing based on recent trends.
                                      </p>
                                    </div>
                                    <div className="p-3 rounded-lg bg-orange-500/10">
                                      <p className="font-medium">Documentary Film Scoring</p>
                                      <p className="text-muted-foreground text-xs">
                                        Consider focusing on documentary film scoring based on your recent success rates.
                                      </p>
                                    </div>
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                              
                              <AccordionItem value="strategies" className="border-orange-500/20">
                                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                                  <div className="flex items-center">
                                    <TrendingUp className="mr-2 h-4 w-4 text-orange-500" />
                                    Market Strategies
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <p className="mb-2">Based on current industry trends:</p>
                                  <ul className="list-disc pl-5 space-y-1">
                                    <li>Focus on sync licensing opportunities</li>
                                    <li>Target podcast and streaming platforms</li>
                                    <li>Utilize AI-matched placement services</li>
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                              
                              <AccordionItem value="revenue" className="border-orange-500/20">
                                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                                  <div className="flex items-center">
                                    <Banknote className="mr-2 h-4 w-4 text-orange-500" />
                                    Revenue Optimization
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent>
                                  <p className="mb-2">To maximize your income:</p>
                                  <ul className="list-disc pl-5 space-y-1">
                                    <li>Register with multiple PROs globally</li>
                                    <li>Leverage micro-licensing for social media</li>
                                    <li>Consider bundle deals for commercial use</li>
                                  </ul>
                                </AccordionContent>
                              </AccordionItem>
                            </Accordion>
                          </div>
                        </div>
                        
                        <Button className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 h-auto py-3">
                          <div>
                            <div className="font-medium">Generate Custom Publishing Plan</div>
                            <div className="text-xs opacity-80">Tailored to your music catalog</div>
                          </div>
                          <FileText className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
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
        <div className="bg-gradient-to-b from-background to-orange-500/5 py-16 md:py-24 -mx-4 px-4">
          <div className="container mx-auto">
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-12">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5 }}
                >
                  <Building2 className="h-12 md:h-16 w-12 md:w-16 text-orange-500 mx-auto mb-4" />
                  <h2 className="text-2xl md:text-4xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
                    Record Label Registration
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
                    Join our network of forward-thinking record labels and get exclusive access to our suite of AI-powered music revival tools
                  </p>
                </motion.div>
              </div>

              <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
                {/* Left Column - Benefits */}
                <motion.div 
                  className="lg:col-span-2 space-y-6"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div className="rounded-xl border border-orange-500/20 p-6 bg-gradient-to-br from-background to-orange-500/5">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Check className="mr-2 h-5 w-5 text-orange-500" />
                      Membership Benefits
                    </h3>
                    <ul className="space-y-3">
                      {[
                        "Early access to new AI tools and features",
                        "Dedicated account manager for your label",
                        "Priority processing for AI-generated content",
                        "Exclusive industry insights and reports",
                        "Networking opportunities with other labels"
                      ].map((benefit, i) => (
                        <li key={i} className="flex items-start">
                          <Check className="mr-2 h-4 w-4 text-orange-500 mt-1 shrink-0" />
                          <span className="text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="rounded-xl border border-orange-500/20 p-6 bg-gradient-to-br from-background to-orange-500/5">
                    <h3 className="text-xl font-semibold mb-4 flex items-center">
                      <Star className="mr-2 h-5 w-5 text-orange-500" />
                      Success Stories
                    </h3>
                    <div className="space-y-4">
                      {[
                        {
                          name: "Horizon Records",
                          quote: "Increased our catalog value by 65% in just 6 months using AI revival tools.",
                        },
                        {
                          name: "Pulse Entertainment",
                          quote: "Generated over $180k in additional revenue from reviving our classic recordings.",
                        }
                      ].map((testimonial, i) => (
                        <div key={i} className="p-3 rounded-lg bg-orange-500/10">
                          <p className="text-xs italic mb-1">{testimonial.quote}</p>
                          <p className="text-xs font-semibold">— {testimonial.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Right Column - Registration Form */}
                <motion.div 
                  className="lg:col-span-3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  <Card className="p-6 md:p-8 border-orange-500/20 hover:border-orange-500/40 transition-all shadow-lg">
                    <CardHeader className="p-0 pb-6">
                      <CardTitle className="text-xl font-semibold">Create Your Account</CardTitle>
                      <CardDescription>
                        Fill in your details below to register your record label
                      </CardDescription>
                    </CardHeader>
                    <form className="space-y-5">
                      {/* Registration Form */}
                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="companyName" className="text-sm font-medium">
                            Company Name <span className="text-orange-500">*</span>
                          </Label>
                          <Input
                            id="companyName"
                            type="text"
                            required
                            className="bg-background focus-visible:ring-orange-500"
                            placeholder="Your label name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="contactName" className="text-sm font-medium">
                            Contact Name <span className="text-orange-500">*</span>
                          </Label>
                          <Input
                            id="contactName"
                            type="text"
                            required
                            className="bg-background focus-visible:ring-orange-500"
                            placeholder="Full name"
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-5">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="text-sm font-medium">
                            Business Email <span className="text-orange-500">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            required
                            className="bg-background focus-visible:ring-orange-500"
                            placeholder="email@yourlabel.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone" className="text-sm font-medium">
                            Phone Number
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            className="bg-background focus-visible:ring-orange-500"
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website" className="text-sm font-medium">
                          Company Website
                        </Label>
                        <Input
                          id="website"
                          type="url"
                          className="bg-background focus-visible:ring-orange-500"
                          placeholder="https://www.yourlabel.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="labelType" className="text-sm font-medium">
                          Label Type <span className="text-orange-500">*</span>
                        </Label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {["Independent", "Major", "Distribution", "Publishing"].map((type) => (
                            <div 
                              key={type}
                              className="flex items-center space-x-2 rounded-lg border border-orange-500/20 p-3 cursor-pointer hover:bg-orange-500/5 hover:border-orange-500/40 transition-all"
                            >
                              <input 
                                type="radio" 
                                id={`type-${type}`} 
                                name="labelType" 
                                className="text-orange-500 focus:ring-orange-500" 
                              />
                              <Label 
                                htmlFor={`type-${type}`} 
                                className="text-sm cursor-pointer"
                              >
                                {type}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message" className="text-sm font-medium">
                          Tell us about your catalog and goals
                        </Label>
                        <Textarea
                          id="message"
                          placeholder="Share details about your music catalog, artists, and what you hope to achieve with our platform..."
                          className="bg-background min-h-[100px] focus-visible:ring-orange-500"
                          rows={4}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 pt-2">
                        <input 
                          type="checkbox" 
                          id="terms" 
                          className="rounded text-orange-500 focus:ring-orange-500" 
                          required
                        />
                        <Label htmlFor="terms" className="text-xs">
                          I agree to the <span className="text-orange-500 underline cursor-pointer">Terms of Service</span> and <span className="text-orange-500 underline cursor-pointer">Privacy Policy</span>
                        </Label>
                      </div>
                      
                      <Button type="submit" className="w-full bg-gradient-to-r from-orange-500 to-purple-600 hover:from-orange-600 hover:to-purple-700 h-12 mt-4">
                        <div>
                          <div className="font-medium">Submit Registration</div>
                          <div className="text-xs opacity-80">Get started in minutes</div>
                        </div>
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>

                      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Shield className="h-4 w-4 text-orange-500" />
                        <span>Your information is secure and will never be shared</span>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}