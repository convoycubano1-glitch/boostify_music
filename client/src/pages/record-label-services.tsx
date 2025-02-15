import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Music2, Wand2, Video, Building2, ArrowRight, Shield, Banknote,
  Radio, Tv, Film, FileText, Brain, Play, Volume2, Pen, Clock,
  Mic2, Music4, Database, FilmIcon, TrendingUp, Calculator, Search,
  Badge, MapPin, Calendar, ChartBar, Users
} from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

export default function RecordLabelServices() {
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    email: "",
    phone: "",
    website: "",
    message: ""
  });

  const [selectedTab, setSelectedTab] = useState("radio-tv");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log(formData);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1">
        {/* Hero Section with Video Background */}
        <div className="relative w-full min-h-[50vh] md:min-h-[60vh] overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover mix-blend-overlay"
            src="/assets/Standard_Mode_Generated_Video (9).mp4"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900 to-orange-600 opacity-90" />
          <div className="absolute inset-0 bg-black/60" />
          <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-2xl"
            >
              <h1 className="text-3xl md:text-6xl font-bold text-white mb-4 md:mb-6 text-shadow-lg">
                Publishing & Licensing Hub
              </h1>
              <p className="text-lg md:text-xl text-white/90 mb-6 md:mb-8 text-shadow-sm font-medium">
                Manage your music rights and explore publishing opportunities across multiple media channels
              </p>
              <Button size="lg" className="w-full md:w-auto bg-orange-500 hover:bg-orange-600">
                Explore Opportunities
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Publishing Sections with Improved Spacing */}
        <div className="container mx-auto px-4 py-12 md:py-24">
          <Tabs defaultValue={selectedTab} value={selectedTab} onValueChange={setSelectedTab} className="space-y-8 md:space-y-12">
            <TabsList className="flex flex-wrap justify-center gap-3 md:gap-6 p-2 bg-background/50 backdrop-blur-sm rounded-lg border border-orange-500/20 overflow-x-auto">
              <TabsTrigger
                value="radio-tv"
                className="data-[state=active]:bg-orange-500 px-4 md:px-8 py-2 md:py-3 transition-all duration-300 whitespace-nowrap"
              >
                <Radio className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Radio & TV</span>
                <span className="md:hidden">Radio/TV</span>
              </TabsTrigger>
              <TabsTrigger
                value="movies"
                className="data-[state=active]:bg-orange-500 px-4 md:px-8 py-2 md:py-3 transition-all duration-300 whitespace-nowrap"
              >
                <Film className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Movie Publishing</span>
                <span className="md:hidden">Movies</span>
              </TabsTrigger>
              <TabsTrigger
                value="creator"
                className="data-[state=active]:bg-orange-500 px-4 md:px-8 py-2 md:py-3 transition-all duration-300 whitespace-nowrap"
              >
                <Music4 className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Movie Music Tools</span>
                <span className="md:hidden">Tools</span>
              </TabsTrigger>
              <TabsTrigger
                value="contracts"
                className="data-[state=active]:bg-orange-500 px-4 md:px-8 py-2 md:py-3 transition-all duration-300 whitespace-nowrap"
              >
                <FileText className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">Contracts</span>
                <span className="md:hidden">Legal</span>
              </TabsTrigger>
              <TabsTrigger
                value="ai"
                className="data-[state=active]:bg-orange-500 px-4 md:px-8 py-2 md:py-3 transition-all duration-300 whitespace-nowrap"
              >
                <Brain className="w-4 h-4 mr-2" />
                <span className="hidden md:inline">AI Assistant</span>
                <span className="md:hidden">AI</span>
              </TabsTrigger>
            </TabsList>

            {/* Tab Content with Improved Spacing */}
            <div className="mt-8 md:mt-12 space-y-8 md:space-y-12">
              {/* Radio & TV Tab */}
              <TabsContent value="radio-tv">
                <div className="grid gap-6 md:gap-8 md:grid-cols-2">
                  <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <Radio className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">Radio Publishing</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Expand your music reach through radio networks
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      <div className="p-4 md:p-6 border rounded-lg bg-background/50">
                        <h4 className="font-medium mb-4">Radio Networks</h4>
                        <div className="space-y-3 md:space-y-4">
                          {['National Networks', 'Local Stations', 'Internet Radio'].map((network) => (
                            <div key={network} className="flex items-center justify-between p-3 md:p-4 hover:bg-orange-500/5 rounded-lg transition-colors">
                              <span className="font-medium text-sm md:text-base">{network}</span>
                              <Button variant="outline" size="sm" className="min-w-[100px]">
                                Connect
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <Tv className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">TV Licensing</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          License your music for television programs
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      <div className="p-4 md:p-6 border rounded-lg bg-background/50">
                        <h4 className="font-medium mb-4">TV Opportunities</h4>
                        <div className="space-y-3 md:space-y-4">
                          {['Shows & Series', 'Commercials', 'Network Promos'].map((type) => (
                            <div key={type} className="flex items-center justify-between p-3 md:p-4 hover:bg-orange-500/5 rounded-lg transition-colors">
                              <span className="font-medium text-sm md:text-base">{type}</span>
                              <Button variant="outline" size="sm" className="min-w-[100px]">
                                View Details
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Movie Publishing Tab */}
              <TabsContent value="movies">
                <div className="grid gap-6 md:gap-8 md:grid-cols-2">
                  <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <FilmIcon className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">Movie Sync Licensing</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Place your music in films and documentaries
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      {['Feature Films', 'Independent Movies', 'Documentaries'].map((category) => (
                        <div key={category} className="p-4 md:p-6 border rounded-lg bg-background/50">
                          <h4 className="font-medium mb-3 md:mb-4">{category}</h4>
                          <p className="text-xs md:text-sm text-muted-foreground mb-4">
                            Explore opportunities and submit your music
                          </p>
                          <Button variant="outline" className="w-full md:w-auto">Browse Opportunities</Button>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <Database className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">Music Library</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Manage your movie-ready tracks
                        </p>
                      </div>
                    </div>

                    <div className="p-4 md:p-6 border rounded-lg bg-background/50 mb-4">
                      <div className="flex items-center gap-4 mb-4">
                        <Music2 className="h-5 w-5 text-orange-500" />
                        <div>
                          <h4 className="font-medium">Movie-Ready Tracks</h4>
                          <p className="text-xs md:text-sm text-muted-foreground">Organize and submit your music</p>
                        </div>
                      </div>
                      <Button className="w-full bg-orange-500 hover:bg-orange-600">
                        Upload Tracks
                      </Button>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              {/* Movie Music Creator Tools Tab */}
              <TabsContent value="creator">
                <div className="grid gap-6 md:gap-8 md:grid-cols-3">
                  <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <Music4 className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">Score Creator</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Create and edit movie scores
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Launch Score Creator
                    </Button>
                  </Card>

                  <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <Volume2 className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">Sound Design</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Create custom sound effects
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Open Sound Designer
                    </Button>
                  </Card>

                  <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <Clock className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">Timeline Editor</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Sync music to video timeline
                        </p>
                      </div>
                    </div>
                    <Button className="w-full bg-orange-500 hover:bg-orange-600">
                      Open Timeline Editor
                    </Button>
                  </Card>
                </div>
              </TabsContent>

              {/* Contracts Tab */}
              <TabsContent value="contracts">
                <div className="grid gap-6 md:gap-8 md:grid-cols-2">
                  <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <FileText className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">Publishing Contracts</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Manage your publishing agreements
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      {['TV Licensing', 'Movie Sync', 'Radio Broadcasting'].map((type) => (
                        <div key={type} className="p-4 md:p-6 border rounded-lg bg-background/50">
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="font-medium text-sm md:text-base">{type} Agreement</h4>
                            <Badge>Template</Badge>
                          </div>
                          <div className="flex gap-4 mt-4">
                            <Button variant="outline" size="sm">Preview</Button>
                            <Button variant="outline" size="sm">Use Template</Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center gap-4 mb-6 md:mb-8">
                      <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                        <Pen className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                      </div>
                      <div>
                        <h3 className="text-xl md:text-2xl font-semibold">Active Contracts</h3>
                        <p className="text-sm md:text-base text-muted-foreground">
                          Monitor your active agreements
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      {['Netflix Series License', 'Universal Pictures Sync', 'BBC Radio License'].map((contract) => (
                        <div key={contract} className="p-4 md:p-6 border rounded-lg bg-background/50">
                          <h4 className="font-medium mb-3 md:mb-4">{contract}</h4>
                          <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground mb-4">
                            <Clock className="h-4 w-4" />
                            <span>Expires in 8 months</span>
                          </div>
                          <Button variant="outline" size="sm">View Details</Button>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              </TabsContent>
              {/* AI Assistant Tab */}
              <TabsContent value="ai">
                <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-center gap-4 mb-6 md:mb-8">
                    <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                      <Brain className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                    </div>
                    <div>
                      <h3 className="text-xl md:text-2xl font-semibold">Publishing AI Assistant</h3>
                      <p className="text-sm md:text-base text-muted-foreground">
                        Get AI-powered insights and recommendations for your publishing strategy
                      </p>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                    <div className="space-y-4 md:space-y-6">
                      <div className="p-4 md:p-6 border rounded-lg bg-background/50">
                        <h4 className="font-medium mb-4">Ask AI Assistant</h4>
                        <Textarea
                          className="mb-4"
                          placeholder="Ask about publishing strategies, contract terms, or market insights..."
                          rows={4}
                        />
                        <Button className="w-full bg-orange-500 hover:bg-orange-600">
                          Get AI Response
                        </Button>
                      </div>

                      <div className="p-4 md:p-6 border rounded-lg bg-background/50">
                        <h4 className="font-medium mb-4">Quick Actions</h4>
                        <div className="grid grid-cols-2 gap-4">
                          <Button variant="outline" className="justify-start">
                            <FileText className="mr-2 h-4 w-4" />
                            Analyze Contract
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Market Analysis
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Calculator className="mr-2 h-4 w-4" />
                            Royalty Estimator
                          </Button>
                          <Button variant="outline" className="justify-start">
                            <Search className="mr-2 h-4 w-4" />
                            Opportunity Finder
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 md:space-y-6">
                      <div className="p-4 md:p-6 border rounded-lg bg-background/50">
                        <h4 className="font-medium mb-4">AI Insights</h4>
                        <div className="space-y-3 md:space-y-4">
                          <div className="flex gap-3">
                            <Brain className="h-5 w-5 text-orange-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm md:text-base">Publishing Opportunity</p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                Your catalog shows strong potential for TV commercial licensing based on recent trends.
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-3">
                            <Brain className="h-5 w-5 text-orange-500 mt-0.5" />
                            <div>
                              <p className="font-medium text-sm md:text-base">Market Strategy</p>
                              <p className="text-xs md:text-sm text-muted-foreground">
                                Consider focusing on documentary film scoring based on your recent success rates.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </div>
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

        {/* Features Section */}
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
              Comprehensive Revival Tools
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Everything you need to bring classic music into the modern era
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
              <Music2 className="h-10 md:h-12 w-10 md:w-12 text-orange-500 mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">AI Music Generation</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Create modern remixes and variations while preserving the original essence
              </p>
              <div className="h-[200px] md:h-[300px] overflow-hidden rounded-lg mb-4">
                {/* MusicAIGenerator Component */}
              </div>
            </Card>

            <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
              <Wand2 className="h-10 md:h-12 w-10 md:w-12 text-orange-500 mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">Professional Mastering</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                State-of-the-art AI mastering for perfect sound quality
              </p>
              <div className="h-[200px] md:h-[300px] overflow-hidden rounded-lg mb-4">
                {/* AudioMastering Component */}
              </div>
            </Card>

            <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
              <Video className="h-10 md:h-12 w-10 md:w-12 text-orange-500 mb-4" />
              <h3 className="text-lg md:text-xl font-semibold mb-2">Video Generation</h3>
              <p className="text-sm md:text-base text-muted-foreground mb-4">
                Create compelling music videos for classic tracks
              </p>
              <div className="h-[200px] md:h-[300px] overflow-hidden rounded-lg mb-4">
                {/* MusicVideoAI Component */}
              </div>
              <Link href="/music-video-creator">
                <Button className="w-full bg-orange-500 hover:bg-orange-600">
                  Open Full Video Creator
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>


        {/* Nueva sección de Manager Tools */}
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-purple-600">
              Manager Tools
            </h2>
            <p className="text-sm md:text-base text-muted-foreground">
              Essential tools for managing your artists and venues
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {/* Venues Catalog */}
            <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                  <MapPin className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold">Venues Catalog</h3>
                  <p className="text-sm text-muted-foreground">
                    Find perfect venues for your events
                  </p>
                </div>
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                Find Venues
              </Button>
            </Card>

            {/* Venues Booking */}
            <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                  <Calendar className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold">Venues Booking</h3>
                  <p className="text-sm text-muted-foreground">
                    Schedule and manage bookings
                  </p>
                </div>
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                Book Now
              </Button>
            </Card>

            {/* Venues Reports */}
            <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                  <ChartBar className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold">Venues Reports</h3>
                  <p className="text-sm text-muted-foreground">
                    Analytics and performance data
                  </p>
                </div>
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                View Reports
              </Button>
            </Card>

            {/* Your Artists */}
            <Card className="p-6 md:p-8 hover:shadow-lg transition-all duration-300">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-3 md:p-4 bg-orange-500/10 rounded-lg">
                  <Users className="h-6 md:h-8 w-6 md:w-8 text-orange-500" />
                </div>
                <div>
                  <h3 className="text-lg md:text-xl font-semibold">Your Artists</h3>
                  <p className="text-sm text-muted-foreground">
                    Manage your artist roster
                  </p>
                </div>
              </div>
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                View Artists
              </Button>
            </Card>
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
                <form onSubmit={handleSubmit} className="space-y-4 md:space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={formData.companyName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          companyName: e.target.value
                        }))}
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="contactName">Contact Name</Label>
                      <Input
                        id="contactName"
                        value={formData.contactName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          contactName: e.target.value
                        }))}
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
                        value={formData.email}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          email: e.target.value
                        }))}
                        required
                        className="bg-background"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          phone: e.target.value
                        }))}
                        className="bg-background"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="website">Company Website</Label>
                    <Input
                      id="website"
                      type="url"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        website: e.target.value
                      }))}
                      className="bg-background"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Additional Information</Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        message: e.target.value
                      }))}
                      placeholder="Tell us about your catalog and what you're looking to achieve"
                      className="min-h-[100px] bg-background"
                    />
                  </div>

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600">
                    Submit Registration
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