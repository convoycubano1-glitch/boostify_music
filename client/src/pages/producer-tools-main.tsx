import React, { useState, useEffect } from "react";
import { logger } from "../lib/logger";
import { Header } from "../components/layout/header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { ScrollArea } from "../components/ui/scroll-area";
import { Badge } from "../components/ui/badge";
import { motion } from "framer-motion";
import { Users, FileText, TrendingUp, Zap, Music, DollarSign, Share2, Radio, Music2, Guitar, Drum, Piano, Mic2, Music4, Plus, Wand2, PlayCircle, Star, Briefcase, Volume2, Zap as ZapIcon, Mic } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { useToast } from "../hooks/use-toast";
import { useAuth } from "../hooks/use-auth";

import { FileExchangeHub } from "../components/producer/FileExchangeHub";
import { VirtualStudioSession } from "../components/producer/VirtualStudioSession";
import { VersionControl } from "../components/producer/VersionControl";
import { ServiceRequestForm, ServiceRequestList } from "../components/services/ServiceRequestForm";
import { FloatingServiceRequestModal } from "../components/services/FloatingServiceRequestModal";
import { BookingDialog } from "../components/booking/booking-dialog";
import { AddMusicianForm } from "../components/booking/add-musician-form";
import { AudioMastering } from "../components/music/audio-mastering";
import { ModernAudioSuite } from "../components/music/modern-audio-suite";
import { ProfessionalVoiceCloning } from "../components/music/ProfessionalVoiceCloning";

interface MusicianService {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  category: string;
  instrument: string;
  rating: number;
  totalReviews: number;
  genres?: string[];
  photo?: string;
}

const defaultMusicians: MusicianService[] = [
  { id: "1", userId: "user-1", title: "Alex Rivera", photo: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=300&fit=crop", instrument: "Guitar", category: "Guitar", description: "Rock and blues specialist with 15 years of experience.", price: 120, rating: 4.9, totalReviews: 156, genres: ["Rock", "Blues"] },
  { id: "2", userId: "user-2", title: "Sarah Johnson", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", instrument: "Guitar", category: "Guitar", description: "Acoustic guitar virtuoso.", price: 150, rating: 4.8, totalReviews: 98, genres: ["Flamenco", "Classical"] },
  { id: "3", userId: "user-3", title: "Miguel Torres", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop", instrument: "Guitar", category: "Guitar", description: "Jazz and Latin fusion specialist.", price: 135, rating: 4.7, totalReviews: 123, genres: ["Jazz", "Latin"] },
  { id: "4", userId: "user-4", title: "John Smith", photo: "https://images.unsplash.com/photo-1500625046104-924381ca267d?w=400&h=300&fit=crop", instrument: "Drums", category: "Drums", description: "Professional metal and rock drummer.", price: 140, rating: 4.9, totalReviews: 87, genres: ["Metal", "Rock"] },
  { id: "5", userId: "user-5", title: "Lisa Chen", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop", instrument: "Drums", category: "Drums", description: "Latin rhythms specialist.", price: 130, rating: 4.8, totalReviews: 92, genres: ["Latin", "Fusion"] },
  { id: "6", userId: "user-6", title: "David Wilson", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", instrument: "Drums", category: "Drums", description: "Jazz and electronic music expert.", price: 145, rating: 4.7, totalReviews: 78, genres: ["Jazz", "Electronic"] },
  { id: "7", userId: "user-7", title: "Emma Watson", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop", instrument: "Piano", category: "Piano", description: "Classical pianist with conservatory training.", price: 160, rating: 5.0, totalReviews: 112, genres: ["Classical", "Baroque"] },
  { id: "8", userId: "user-8", title: "Carlos Ruiz", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", instrument: "Piano", category: "Piano", description: "Jazz and contemporary specialist.", price: 150, rating: 4.9, totalReviews: 95, genres: ["Jazz", "Contemporary"] },
  { id: "9", userId: "user-9", title: "Sophie Martin", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop", instrument: "Piano", category: "Piano", description: "Composition and arrangements expert.", price: 155, rating: 4.8, totalReviews: 88, genres: ["Classical", "Film Score"] },
  { id: "10", userId: "user-10", title: "Maria García", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop", instrument: "Vocals", category: "Vocals", description: "Versatile vocalist with classical training.", price: 140, rating: 4.9, totalReviews: 167, genres: ["Pop", "Jazz"] },
  { id: "11", userId: "user-11", title: "James Brown", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=300&fit=crop", instrument: "Vocals", category: "Vocals", description: "Soul and R&B specialist.", price: 150, rating: 4.8, totalReviews: 143, genres: ["Soul", "R&B"] },
  { id: "12", userId: "user-12", title: "Luna Kim", photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop", instrument: "Vocals", category: "Vocals", description: "Jazz and experimental vocalist.", price: 145, rating: 4.7, totalReviews: 89, genres: ["Jazz", "Electronic"] },
  { id: "13", userId: "user-13", title: "Mark Davis", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", instrument: "Production", category: "Production", description: "Urban music production specialist.", price: 200, rating: 4.9, totalReviews: 178, genres: ["Hip Hop", "Trap"] },
  { id: "14", userId: "user-14", title: "Ana Silva", photo: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=300&fit=crop", instrument: "Production", category: "Production", description: "EDM and electronic producer.", price: 180, rating: 4.8, totalReviews: 156, genres: ["EDM", "Dance"] },
  { id: "15", userId: "user-15", title: "Tom Wilson", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop", instrument: "Production", category: "Production", description: "Rock and metal producer.", price: 190, rating: 4.7, totalReviews: 134, genres: ["Rock", "Metal"] },
];

export default function ProducerToolsMain() {
  const { toast } = useToast();
  const { user } = useAuth() || {};
  const [activeTab, setActiveTab] = useState("mastering");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [musiciansState, setMusiciansState] = useState(defaultMusicians);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [showAddMusicianDialog, setShowAddMusicianDialog] = useState(false);

  useEffect(() => {
    loadMusicianImages();
  }, []);

  const loadMusicianImages = async () => {
    try {
      setIsLoadingImages(true);
      logger.info(`🎵 Loading 15 default musicians`);
      setMusiciansState(defaultMusicians);
      logger.info(`✨ Final musicians count: 15`);
    } catch (error) {
      logger.error("❌ Error loading musicians:", error);
      setMusiciansState(defaultMusicians);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const filteredMusicians = musiciansState.filter(musician =>
    selectedCategory.toLowerCase() === "all" ||
    musician.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const handleMusicianAdded = () => {
    loadMusicianImages();
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section with Audio Focus */}
      <div className="relative w-full h-[70vh] md:h-[90vh] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          poster="/assets/video-fallback.jpg"
          onError={(e) => {
            const target = e.target as HTMLVideoElement;
            target.style.display = 'none';
          }}
        >
          <source src="/assets/Standard_Mode_Generated_Video (3).mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background" />

        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-end md:justify-end pb-12 md:pb-12 pt-48 md:pt-96">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center md:text-left mb-12"
          >
            <div className="inline-block bg-orange-500/20 backdrop-blur-sm border border-orange-500/30 rounded-full px-4 py-2 mb-6">
              <span className="text-orange-500 text-sm font-medium flex items-center">
                <Volume2 className="h-4 w-4 mr-2" /> Professional Audio Production
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Master Your <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">Audio Sound</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
              Professional mastering, voice cloning, and audio production tools for musicians
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
                Start Mastering <Zap className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="outline" size="lg" className="border-white/30 bg-black/30 backdrop-blur-sm text-white hover:bg-black/40">
                Watch Demo <PlayCircle className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          {/* Main Tabs - AUDIO FOCUSED */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 bg-slate-900 border border-slate-700 rounded-lg p-1 mb-8">
              <TabsTrigger value="mastering" className="flex items-center gap-2 text-xs md:text-sm">
                <Volume2 className="w-4 h-4" />
                <span className="hidden sm:inline">Mastering</span>
              </TabsTrigger>
              <TabsTrigger value="suite" className="flex items-center gap-2 text-xs md:text-sm">
                <ZapIcon className="w-4 h-4" />
                <span className="hidden sm:inline">Suite</span>
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2 text-xs md:text-sm">
                <Mic className="w-4 h-4" />
                <span className="hidden sm:inline">Voice</span>
              </TabsTrigger>
              <TabsTrigger value="files" className="flex items-center gap-2 text-xs md:text-sm">
                <Share2 className="w-4 h-4" />
                <span className="hidden sm:inline">Files</span>
              </TabsTrigger>
              <TabsTrigger value="musicians" className="flex items-center gap-2 text-xs md:text-sm">
                <Users className="w-4 h-4" />
                <span className="hidden sm:inline">Musicians</span>
              </TabsTrigger>
              <TabsTrigger value="services" className="flex items-center gap-2 text-xs md:text-sm">
                <Briefcase className="w-4 h-4" />
                <span className="hidden sm:inline">Services</span>
              </TabsTrigger>
            </TabsList>

            {/* Audio Mastering Tab */}
            <TabsContent value="mastering" className="mt-6 space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Audio Mastering</h2>
                <p className="text-muted-foreground">Professional audio mastering for your tracks</p>
              </div>
              <AudioMastering />
            </TabsContent>

            {/* Modern Audio Suite Tab */}
            <TabsContent value="suite" className="mt-6 space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Audio Production Suite</h2>
                <p className="text-muted-foreground">Advanced audio editing and production tools</p>
              </div>
              <ModernAudioSuite />
            </TabsContent>

            {/* Voice Cloning Tab */}
            <TabsContent value="voice" className="mt-6 space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Voice Cloning</h2>
                <p className="text-muted-foreground">Professional voice cloning and synthesis</p>
              </div>
              <ProfessionalVoiceCloning />
            </TabsContent>

            {/* File Exchange Hub Tab */}
            <TabsContent value="files" className="mt-6 space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Audio Files Exchange</h2>
                <p className="text-muted-foreground">Share and manage audio files with collaborators</p>
              </div>
              <FileExchangeHub />
            </TabsContent>

            {/* Musicians Tab */}
            <TabsContent value="musicians" className="mt-6 space-y-6">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-3xl font-bold">Musician Services</h2>
                  <p className="text-muted-foreground mt-2">Connect with musicians and producers worldwide</p>
                </div>
                <Dialog open={showAddMusicianDialog} onOpenChange={setShowAddMusicianDialog}>
                  <DialogTrigger asChild>
                    <Button className="bg-orange-500 hover:bg-orange-600">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Musician
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Add New Musician</DialogTitle>
                      <DialogDescription>Add a new musician to collaborate with</DialogDescription>
                    </DialogHeader>
                    <AddMusicianForm
                      onClose={() => setShowAddMusicianDialog(false)}
                      onSuccess={handleMusicianAdded}
                    />
                  </DialogContent>
                </Dialog>
              </div>

              {/* Service Categories */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
                {["all", "Guitar", "Drums", "Piano", "Vocals", "Production"].map((category) => (
                  <Card
                    key={category}
                    className={`p-4 text-center cursor-pointer transition-colors backdrop-blur-sm ${
                      selectedCategory.toLowerCase() === category.toLowerCase() ? 'bg-orange-500/10 border-orange-500' : 'hover:bg-orange-500/5'
                    }`}
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category === "Guitar" && <Guitar className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                    {category === "Drums" && <Drum className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                    {category === "Piano" && <Piano className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                    {category === "Vocals" && <Mic2 className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                    {category === "Production" && <Music4 className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                    <p className="font-medium text-sm">{category !== "all" ? category : "All"}</p>
                  </Card>
                ))}
              </div>

              {/* Musicians Grid */}
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-12"
              >
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {isLoadingImages ? (
                    Array.from({ length: 6 }).map((_, i) => (
                      <Card key={`skeleton-${i}`} className="overflow-hidden animate-pulse backdrop-blur-sm border border-orange-500/10">
                        <div className="aspect-[4/3] bg-muted" />
                        <div className="p-6 space-y-4">
                          <div className="h-4 bg-muted rounded w-3/4" />
                          <div className="h-10 bg-muted rounded w-full" />
                        </div>
                      </Card>
                    ))
                  ) : (
                    filteredMusicians.map((musician, index) => (
                      <motion.div
                        key={musician.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <Card className="overflow-hidden backdrop-blur-sm bg-background/80 border border-orange-500/10 shadow-lg hover:shadow-xl hover:shadow-orange-500/10 transition-all duration-300 group">
                          <div className="h-40 bg-orange-500/10 relative overflow-hidden">
                            <img
                              src={musician.photo || "/assets/musician-placeholder.jpg"}
                              alt={musician.title}
                              className="w-full h-full object-cover object-center transition-transform duration-500 group-hover:scale-110"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(musician.title)}&background=FF6B35&color=fff&size=400`;
                              }}
                            />
                          </div>
                          <div className="p-6">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-xl font-semibold group-hover:text-orange-500 transition-colors">{musician.title}</h3>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                                <span className="font-medium text-sm">{musician.rating.toFixed(1)}</span>
                              </div>
                            </div>
                            <p className="text-muted-foreground mb-4 line-clamp-2 text-sm">{musician.description}</p>
                            <div className="flex justify-between items-center mb-4">
                              <div className="text-muted-foreground text-xs">{musician.totalReviews} reviews</div>
                              <div className="flex items-center gap-1 text-base font-semibold text-orange-500">
                                <DollarSign className="h-4 w-4" />
                                ${musician.price}
                              </div>
                            </div>
                            <Button
                              className="w-full bg-orange-500 hover:bg-orange-600 text-sm"
                              asChild
                            >
                              <BookingDialog musician={musician} />
                            </Button>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            </TabsContent>

            {/* Service Requests Tab */}
            <TabsContent value="services" className="mt-6 space-y-6">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-2">Service Requests</h2>
                <p className="text-muted-foreground">Browse and bid on music production services</p>
              </div>
              
              <Card className="p-8 text-center bg-background/50 border border-orange-500/20">
                <Briefcase className="h-12 w-12 mx-auto mb-4 text-orange-500" />
                <h3 className="text-2xl font-bold mb-2">Active Service Requests</h3>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Musicians and producers are posting service requests. Check the floating notifications to see what's available, or create your own request.
                </p>
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus className="h-4 w-4 mr-2" />
                  Post Service Request
                </Button>
              </Card>

              <div className="grid gap-6">
                <Card className="p-6 border border-orange-500/10 hover:border-orange-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold mb-2">Professional Vocal Recording</h4>
                      <p className="text-muted-foreground mb-4">Looking for a high-quality vocal recording for indie track. Need something with good presence and polish.</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600">Open</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border/30">
                    <div>
                      <span className="text-xs text-muted-foreground">Budget</span>
                      <p className="font-semibold text-orange-500">$200-300</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Service Type</span>
                      <p className="font-semibold">Vocals</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Posted By</span>
                      <p className="font-semibold">Alex Music Studios</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Bids Received</span>
                      <p className="font-semibold">5</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-orange-500/30 text-orange-600 hover:bg-orange-500/10">
                    View Bids & Details
                  </Button>
                </Card>

                <Card className="p-6 border border-orange-500/10 hover:border-orange-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold mb-2">Mixing & Mastering Service</h4>
                      <p className="text-muted-foreground mb-4">Have a full 8-track song ready for professional mixing and mastering. Need punchy, modern sound.</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600">Open</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border/30">
                    <div>
                      <span className="text-xs text-muted-foreground">Budget</span>
                      <p className="font-semibold text-orange-500">$300+</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Service Type</span>
                      <p className="font-semibold">Mixing/Mastering</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Posted By</span>
                      <p className="font-semibold">Indie Label Co</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Bids Received</span>
                      <p className="font-semibold">8</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-orange-500/30 text-orange-600 hover:bg-orange-500/10">
                    View Bids & Details
                  </Button>
                </Card>

                <Card className="p-6 border border-orange-500/10 hover:border-orange-500/30 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h4 className="text-xl font-semibold mb-2">Piano Accompaniment Recording</h4>
                      <p className="text-muted-foreground mb-4">Need beautiful piano accompaniment for classical-inspired vocal piece. Looking for emotional performance.</p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600">Open</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-border/30">
                    <div>
                      <span className="text-xs text-muted-foreground">Budget</span>
                      <p className="font-semibold text-orange-500">$180-280</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Service Type</span>
                      <p className="font-semibold">Piano</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Posted By</span>
                      <p className="font-semibold">Classical Fusion Studio</p>
                    </div>
                    <div>
                      <span className="text-xs text-muted-foreground">Bids Received</span>
                      <p className="font-semibold">3</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-orange-500/30 text-orange-600 hover:bg-orange-500/10">
                    View Bids & Details
                  </Button>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>

      {/* Floating modals */}
      <FloatingServiceRequestModal />
    </div>
  );
}
