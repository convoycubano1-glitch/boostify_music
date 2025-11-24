import { useState, useEffect } from "react";
import { logger } from "../lib/logger";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { ScrollArea } from "../components/ui/scroll-area";
import { Header } from "../components/layout/header";
import { Badge } from "../components/ui/badge";
import { Switch } from "../components/ui/switch";
import { motion } from "framer-motion";
import { useAuth } from "../hooks/use-auth";
import { useLocation } from "wouter";
import useSubscriptionFeature from "../hooks/use-subscription-feature";
import { Music2, DollarSign, Star, Music4, Mic2, Guitar, Drum, Piano, Plus, Wand2, Image as ImageIcon, Upload, Loader2, PlayCircle, ChevronDown, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/ui/collapsible";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { masterTrack } from "../lib/api/kits-ai";
import { generateMusic, checkGenerationStatus } from "../lib/api/zuno-ai";
import { generateImageWithFal } from "../lib/api/fal-ai";
import { useQuery } from "@tanstack/react-query";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { BookingDialog } from "../components/booking/booking-dialog";
import { ProfessionalVoiceCloning } from "../components/music/ProfessionalVoiceCloning";
import { AddMusicianForm } from "../components/booking/add-musician-form";
import { AdminMusiciansPanel } from "../components/booking/admin-musicians-panel";
import { FileExchangeHub } from "../components/producer/FileExchangeHub";
import { StudioVideoCall } from "../components/producer/StudioVideoCall";
import { ProductionProgressContainer } from "../components/producer/ProductionProgressContainer";
import { VersionControl } from "../components/producer/VersionControl";
import { MusicAIGenerator } from "../components/music/music-ai-generator";
import { AudioMastering } from "../components/music/audio-mastering";
import { ModernAudioSuite } from "../components/music/modern-audio-suite";

async function getStoredMusicianImages(): Promise<{ url: string; category: string; }[]> {
  try {
    logger.info("Starting to fetch musician images from musician_images collection...");
    const imagesRef = collection(db, "musician_images");
    const querySnapshot = await getDocs(imagesRef);

    logger.info("Total documents found:", querySnapshot.size);

    const images: { url: string; category: string; }[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      logger.info("Document data:", data);

      // Verificar que los campos necesarios existen y usar 'url' en lugar de 'imageUrl'
      if (data && data.url && data.category) {
        images.push({
          url: data.url,
          category: data.category
        });
      }
    });

    logger.info("Retrieved stored images:", images);
    return images;
  } catch (error) {
    logger.error("Error fetching musician images:", error);
    return [];
  }
}

const musicians: MusicianService[] = [
  // Guitarists
  {
    id: "1",
    userId: "user-1",
    title: "Alex Rivera",
    photo: "/assets/musicians/guitarist-1.jpg",
    instrument: "Guitar",
    category: "Guitar",
    description: "Rock and blues specialist with 15 years of experience. Collaborations with international bands.",
    price: 120,
    rating: 4.9,
    totalReviews: 156,
    genres: ["Rock", "Blues", "Metal"]
  },
  {
    id: "2",
    userId: "user-2",
    title: "Sarah Johnson",
    photo: "/assets/musicians/guitarist-2.jpg",
    instrument: "Guitar",
    category: "Guitar",
    description: "Acoustic guitar and flamenco virtuoso. Graduate from Berklee College of Music.",
    price: 150,
    rating: 4.8,
    totalReviews: 98,
    genres: ["Flamenco", "Classical", "Folk"]
  },
  {
    id: "3",
    userId: "user-3",
    title: "Miguel Torres",
    photo: "/assets/musicians/guitarist-3.jpg",
    instrument: "Guitar",
    category: "Guitar",
    description: "Jazz and Latin fusion specialist. Experience with international tours.",
    price: 135,
    rating: 4.7,
    totalReviews: 123,
    genres: ["Jazz", "Latin Fusion", "Funk"]
  },
  // Drummers
  {
    id: "4",
    userId: "user-4",
    title: "John Smith",
    photo: "/assets/musicians/drummer-1.jpg",
    instrument: "Drums",
    category: "Drums",
    description: "Professional drummer with expertise in metal and rock. Studies at Musicians Institute.",
    price: 140,
    rating: 4.9,
    totalReviews: 87,
    genres: ["Metal", "Rock", "Hard Rock"]
  },
  {
    id: "5",
    userId: "user-5",
    title: "Lisa Chen",
    photo: "/assets/musicians/drummer-2.jpg",
    instrument: "Drums",
    category: "Drums",
    description: "Latin rhythms and fusion specialist. Percussion studies in Cuba.",
    price: 130,
    rating: 4.8,
    totalReviews: 92,
    genres: ["Latin", "Fusion", "Pop"]
  },
  {
    id: "6",
    userId: "user-6",
    title: "David Wilson",
    photo: "/assets/musicians/drummer-3.jpg",
    instrument: "Drums",
    category: "Drums",
    description: "Expert in jazz and electronic music. Producer and composer.",
    price: 145,
    rating: 4.7,
    totalReviews: 78,
    genres: ["Jazz", "Electronic", "Experimental"]
  },
  // Pianists
  {
    id: "7",
    userId: "user-7",
    title: "Emma Watson",
    photo: "/assets/musicians/pianist-1.jpg",
    instrument: "Piano",
    category: "Piano",
    description: "Classical pianist with Conservatory training. Specialized in baroque music.",
    price: 160,
    rating: 5.0,
    totalReviews: 112,
    genres: ["Classical", "Baroque", "Romantic"]
  },
  {
    id: "8",
    userId: "user-8",
    title: "Carlos Ruiz",
    photo: "/assets/musicians/pianist-2.jpg",
    instrument: "Piano",
    category: "Piano",
    description: "Jazz and contemporary music specialist. Experience in composition.",
    price: 150,
    rating: 4.9,
    totalReviews: 95,
    genres: ["Jazz", "Contemporary", "Pop"]
  },
  {
    id: "9",
    userId: "user-9",
    title: "Sophie Martin",
    photo: "/assets/musicians/pianist-3.jpg",
    instrument: "Piano",
    category: "Piano",
    description: "Expert in composition and arrangements. Experience in orchestral projects.",
    price: 155,
    rating: 4.8,
    totalReviews: 88,
    genres: ["Classical", "Contemporary", "Film Score"]
  },
  // Vocalists
  {
    id: "10",
    userId: "user-10",
    title: "Maria García",
    photo: "/assets/musicians/vocalist-1.jpg",
    instrument: "Vocals",
    category: "Vocals",
    description: "Versatile vocalist with experience in various genres. Classical and jazz vocal studies.",
    price: 140,
    rating: 4.9,
    totalReviews: 167,
    genres: ["Pop", "Jazz", "R&B"]
  },
  {
    id: "11",
    userId: "user-11",
    title: "James Brown",
    photo: "/assets/musicians/vocalist-2.jpg",
    instrument: "Vocals",
    category: "Vocals",
    description: "Soul and R&B specialist. Extensive experience in choirs and live performances.",
    price: 150,
    rating: 4.8,
    totalReviews: 143,
    genres: ["Soul", "R&B", "Funk"]
  },
  {
    id: "12",
    userId: "user-12",
    title: "Luna Kim",
    photo: "/assets/musicians/vocalist-3.jpg",
    instrument: "Vocals",
    category: "Vocals",
    description: "Jazz and experimental music vocalist. Studies in vocal performance and composition.",
    price: 145,
    rating: 4.7,
    totalReviews: 89,
    genres: ["Jazz", "Experimental", "Electronic"]
  },
  // Producers
  {
    id: "13",
    userId: "user-13",
    title: "Mark Davis",
    photo: "/assets/musicians/producer-1.jpg",
    instrument: "Production",
    category: "Production",
    description: "Urban music production specialist. Experience in mixing and mastering.",
    price: 200,
    rating: 4.9,
    totalReviews: 178,
    genres: ["Hip Hop", "Reggaeton", "Trap"]
  },
  {
    id: "14",
    userId: "user-14",
    title: "Ana Silva",
    photo: "/assets/musicians/producer-2.jpg",
    instrument: "Production",
    category: "Production",
    description: "EDM and electronic music producer. Specialist in electronic sounds.",
    price: 180,
    rating: 4.8,
    totalReviews: 156,
    genres: ["EDM", "Electronic", "Dance"]
  },
  {
    id: "15",
    userId: "user-15",
    title: "Tom Wilson",
    photo: "/assets/musicians/producer-3.jpg",
    instrument: "Production",
    category: "Production",
    description: "Rock and metal production specialist. Experience in recording.",
    price: 190,
    rating: 4.7,
    totalReviews: 134,
    genres: ["Rock", "Metal", "Hard Rock"]
  }
];

export default function ProducerToolsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);
  const { hasAccess: hasBasicPlanAccess } = useSubscriptionFeature({ requiredPlan: 'basic' });

  // Check if user is authenticated - redirect if not
  useEffect(() => {
    if (!user) {
      setLocation('/signup');
    }
  }, [user, setLocation]);

  // Show loading or redirect message while checking auth
  if (!user) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <Card className="bg-zinc-900/50 border-orange-500/20 p-8 max-w-md text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-white/70 mb-6">
            You need to be logged in to access Producer Tools.
          </p>
          <Button 
            onClick={() => setLocation('/signup')}
            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600"
          >
            Sign In / Sign Up
          </Button>
        </Card>
      </div>
    );
  }
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState("");
  const [coverPrompt, setCoverPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);
  const [musiciansState, setMusiciansState] = useState(musicians);
  const [isLoadingImages, setIsLoadingImages] = useState(true);
  const [showAddMusicianDialog, setShowAddMusicianDialog] = useState(false);
  const [useModernUI, setUseModernUI] = useState(false);
  const [isTermsOpen, setIsTermsOpen] = useState(false);

  const loadFirestoreMusicians = async () => {
    try {
      logger.info("Fetching from Firestore collections (musicians and musician_images)...");
      
      // Load from musicians collection
      const musiciansRef = collection(db, "musicians");
      const musiciansSnapshot = await getDocs(musiciansRef);
      logger.info(`Found ${musiciansSnapshot.size} documents in Firestore musicians collection`);
      
      // Load from musician_images collection
      const imagesRef = collection(db, "musician_images");
      const imagesSnapshot = await getDocs(imagesRef);
      logger.info(`Found ${imagesSnapshot.size} documents in Firestore musician_images collection`);
      
      const firestoreMusicians: MusicianService[] = [];
      
      // Process musicians collection
      musiciansSnapshot.forEach(doc => {
        const data = doc.data();
        logger.info("Firestore musician doc:", doc.id, data);
        
        firestoreMusicians.push({
          id: `firestore-${doc.id}`,
          userId: data.userId || doc.id,
          title: data.name || data.title,
          photo: data.photo || data.photoURL,
          instrument: data.instrument,
          category: data.category,
          description: data.description,
          price: typeof data.price === 'string' ? parseFloat(data.price) : data.price,
          rating: typeof data.rating === 'string' ? parseFloat(data.rating) : data.rating,
          totalReviews: data.totalReviews || 0,
          genres: data.genres || []
        });
      });
      
      // Process musician_images collection (reference images)
      imagesSnapshot.forEach(doc => {
        const data = doc.data();
        logger.info("Firestore musician image doc:", doc.id, data);
        
        // Create a musician from the image data
        firestoreMusicians.push({
          id: `firestore-img-${doc.id}`,
          userId: data.userId || doc.id,
          title: data.category || "Reference Musician",
          photo: data.url,
          instrument: data.category || "Various",
          category: data.category || "Other",
          description: data.prompt || "Reference musician from Firestore",
          price: 150,
          rating: 4.5,
          totalReviews: 10,
          genres: [data.category || "Various"]
        });
      });
      
      logger.info(`Loaded ${firestoreMusicians.length} total musicians from Firestore`);
      return firestoreMusicians;
    } catch (error) {
      logger.error("Error loading Firestore musicians:", error);
      return [];
    }
  };

  const loadMusicianImages = async () => {
    try {
      logger.info("Loading musicians from PostgreSQL and Firestore...");
      setIsLoadingImages(true);

      const [postgresResponse, firestoreMusicians] = await Promise.all([
        fetch('/api/musicians').then(res => res.json()),
        loadFirestoreMusicians()
      ]);

      let allMusicians: MusicianService[] = [];

      if (postgresResponse.success && postgresResponse.data) {
        const dbMusicians = postgresResponse.data.map((m: any) => ({
          id: String(m.id),
          userId: m.userId || `user-${m.id}`,
          title: m.name,
          photo: m.photo,
          instrument: m.instrument,
          category: m.category,
          description: m.description,
          price: typeof m.price === 'string' ? parseFloat(m.price) : m.price,
          rating: typeof m.rating === 'string' ? parseFloat(m.rating) : m.rating,
          totalReviews: m.totalReviews || 0,
          genres: m.genres || []
        }));

        logger.info(`Loaded ${dbMusicians.length} musicians from PostgreSQL`);
        allMusicians = [...dbMusicians];
      }

      if (firestoreMusicians.length > 0) {
        logger.info(`Loaded ${firestoreMusicians.length} musicians from Firestore`);
        allMusicians = [...allMusicians, ...firestoreMusicians];
      }

      if (allMusicians.length > 0) {
        logger.info(`Total musicians loaded: ${allMusicians.length}`);
        setMusiciansState(allMusicians);
      } else {
        logger.info("No musicians found, using defaults");
        setMusiciansState(musicians);
      }
    } catch (error) {
      logger.error("Error loading musicians:", error);
      toast({
        title: "Error",
        description: "Failed to load musicians",
        variant: "destructive"
      });
      setMusiciansState(musicians);
    } finally {
      setIsLoadingImages(false);
      setImagesLoaded(true);
    }
  };

  const handleMusicianAdded = () => {
    loadMusicianImages();
  };

  useEffect(() => {
    loadMusicianImages();
  }, []);

  const filteredMusicians = musiciansState.filter(musician =>
    selectedCategory.toLowerCase() === "all" ||
    musician.category.toLowerCase() === selectedCategory.toLowerCase()
  );

  const handleHireMusician = (musician: typeof musicians[0]) => {
    // This function is no longer needed as we're using the BookingDialog
    return;
  };

  const handleMasterTrack = async () => {
    if (!selectedFile) {
      toast({
        title: "Error",
        description: "Please select an audio file to master",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsMastering(true);
      const result = await masterTrack(selectedFile);

      toast({
        title: "Success",
        description: "Track mastered successfully!"
      });

      // Handle the mastered audio file here
      // Could save to Firebase or provide download link

    } catch (error) {
      logger.error("Error mastering track:", error);
      toast({
        title: "Error",
        description: "Failed to master track. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsMastering(false);
    }
  };

  const handleGenerateMusic = async () => {
    if (!musicPrompt) {
      toast({
        title: "Error",
        description: "Please provide a description for the music you want to generate",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingMusic(true);
      const result = await generateMusic({
        prompt: musicPrompt,
        model: "chirp-v3.5", // Changed from 'modelName' to 'model' to match expected interface
        title: "Generated Music",
        tags: "ai generated"
      });

      // Poll for status
      const interval = setInterval(async () => {
        const status = await checkGenerationStatus(result.taskId);
        if (status.status === "completed") {
          clearInterval(interval);
          setIsGeneratingMusic(false);
          // Handle the generated music
          toast({
            title: "Success",
            description: "Music generated successfully!"
          });
        }
      }, 5000);

    } catch (error) {
      logger.error("Error generating music:", error);
      toast({
        title: "Error",
        description: "Failed to generate music. Please try again.",
        variant: "destructive"
      });
      setIsGeneratingMusic(false);
    }
  };

  const handleGenerateCover = async () => {
    if (!coverPrompt) {
      toast({
        title: "Error",
        description: "Please provide a description for the cover art",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGeneratingCover(true);
      const result = await generateImageWithFal({
        prompt: coverPrompt,
        negativePrompt: "low quality, blurry, distorted, deformed, unrealistic, cartoon, anime, illustration",
        imageSize: "landscape_16_9"
      });

      if (result.data && result.data.images && result.data.images[0]) {
        const imageUrl = result.data.images[0].url;
        setGeneratedCoverUrl(imageUrl);

        // Save to Firestore
        await saveMusicianImage({
          url: imageUrl,
          requestId: result.requestId,
          prompt: coverPrompt,
          category: 'cover-art',
          createdAt: new Date()
        });

        toast({
          title: "Success",
          description: "Cover art generated and saved successfully!"
        });
      } else {
        throw new Error("Invalid response format from Fal.ai");
      }

    } catch (error) {
      logger.error("Error generating cover:", error);
      toast({
        title: "Error",
        description: "Failed to generate cover art. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingCover(false);
    }
  };


  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section with Video Background */}
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
                <Music2 className="h-4 w-4 mr-2" /> Next-Gen Production Suite
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
              Your Creative <span className="bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-500">Music Hub</span>
            </h1>
            <p className="text-lg md:text-xl text-white/90 max-w-2xl mb-8">
              Connect with musicians worldwide or use our AI tools to enhance your production workflow
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <Button size="lg" className="bg-orange-600 hover:bg-orange-700 text-white">
                Start Creating <Wand2 className="ml-2 h-5 w-5" />
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
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-3xl font-bold">Musician Services</h2>
              <p className="text-muted-foreground mt-2">
                Connect with musicians and producers worldwide
              </p>
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
                  <DialogDescription>
                    Add a new musician to collaborate with on your projects
                  </DialogDescription>
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
            {["all", "Guitar", "Drums", "Piano", "Vocals", "Production", "Other"].map((category) => (
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
                {category === "Other" && <Music2 className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                <p className="font-medium">{category !== "all" ? category : "All Categories"}</p>
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
                // Loading skeleton
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={`skeleton-${i}`} className="overflow-hidden animate-pulse backdrop-blur-sm border border-orange-500/10 shadow-xl shadow-orange-500/5">
                    <div className="aspect-[4/3] bg-muted" />
                    <div className="p-6 space-y-4">
                      <div className="h-4 bg-muted rounded w-3/4" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-muted rounded w-1/4" />
                        <div className="h-4 bg-muted rounded w-1/4" />
                      </div>
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
                      <div className="aspect-[4/3] bg-orange-500/10 relative overflow-hidden">
                        <img
                          src={musician.photo || "/assets/musician-placeholder.jpg"}
                          alt={musician.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <div className="absolute top-3 right-3 z-10">
                          <Badge variant="outline" className="bg-black/50 backdrop-blur-md border-orange-500/20 text-white px-2.5 py-1">
                            {musician.instrument}
                          </Badge>
                        </div>
                      </div>
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-xl font-semibold group-hover:text-orange-500 transition-colors">{musician.title}</h3>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                            <span className="font-medium">{musician.rating.toFixed(1)}</span>
                          </div>
                        </div>
                        <p className="text-muted-foreground mb-4 line-clamp-2">{musician.description}</p>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {musician.genres?.slice(0, 3).map(genre => (
                            <Badge key={genre} variant="secondary" className="bg-orange-500/10 text-orange-500 hover:bg-orange-500/20">
                              {genre}
                            </Badge>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mb-4">
                          <div className="text-muted-foreground text-sm">
                            {musician.totalReviews} valoraciones
                          </div>
                          <div className="flex items-center gap-2 text-base font-semibold text-orange-500">
                            <DollarSign className="h-4 w-4" />
                            ${musician.price}/sesión
                          </div>
                        </div>
                        <Button
                          className="w-full bg-orange-500 hover:bg-orange-600 shadow-md hover:shadow-lg hover:shadow-orange-500/20 transition-all duration-300"
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

          {/* Admin Musicians Panel */}
          <div className="mb-12 mt-16">
            <AdminMusiciansPanel />
          </div>

          {/* Production Tools Section */}
          <div className="mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gradient-primary mb-2">Production Workflow Tools</h2>
                <p className="text-muted-foreground max-w-2xl">Collaborate seamlessly with professional tools designed for musicians and producers.</p>
              </div>
              <Badge variant="outline" className="mt-2 md:mt-0 bg-orange-500/10 text-orange-500 border-orange-500/20 px-3 py-1">
                <span className="animate-pulse mr-2">●</span> {!hasBasicPlanAccess ? 'BASIC Plan+' : 'Live Collaboration'}
              </Badge>
            </div>
            
            {!hasBasicPlanAccess ? (
              <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/30 p-12 text-center">
                <h3 className="text-2xl font-bold mb-3">Upgrade to Access Production Tools</h3>
                <p className="text-white/70 mb-6 max-w-2xl mx-auto">
                  Production Workflow Tools including File Exchange, Video Studio, Progress Tracking, and Version Control require at least a BASIC subscription plan ($59.99/month).
                </p>
                <Button 
                  onClick={() => setLocation('/signup')}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-orange-500/20"
                >
                  View Subscription Plans
                </Button>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <FileExchangeHub />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.2 }}
                >
                  <StudioVideoCall />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.3 }}
                >
                  <ProductionProgressContainer />
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.4 }}
                >
                  <VersionControl />
                </motion.div>
              </div>
            )}
          </div>

          {/* AI Tools Section - Temporarily disabled */}
          {/* <div className="mb-12">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
              <div>
                <h2 className="text-3xl font-bold text-gradient-primary mb-2">AI Music Generation</h2>
                <p className="text-muted-foreground max-w-2xl">Create original compositions and soundscapes powered by our advanced AI models.</p>
              </div>
              <Badge variant="outline" className="mt-2 md:mt-0 bg-green-500/10 text-green-500 border-green-500/20 px-3 py-1">
                <Wand2 className="h-3.5 w-3.5 mr-1" /> AI Powered
              </Badge>
            </div>
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <MusicAIGenerator />
            </motion.div>
          </div> */}
          
          {/* Audio Mastering & Voice Conversion Section - Temporarily disabled */}
          {/* <div className="mt-8">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
              <div className="text-center md:text-left">
                <h2 className="text-3xl font-bold text-gradient-primary mb-2">Audio Production Suite</h2>
                <p className="text-muted-foreground max-w-2xl">Professional audio mastering and voice cloning solutions for your production needs.</p>
              </div>
              <Badge variant="outline" className="mt-4 md:mt-0 bg-blue-500/10 text-blue-500 border-blue-500/20 px-3 py-1">
                <Music4 className="h-3.5 w-3.5 mr-1" /> Professional Quality
              </Badge>
            </div>
            <div className="space-y-6 lg:space-y-0 lg:grid lg:gap-8 lg:grid-cols-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="backdrop-blur-sm border border-blue-500/10 rounded-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                <div className="relative">
                  <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-background/80 backdrop-blur-sm rounded-full px-3 py-1.5 border border-muted shadow-sm">
                    <span className="text-xs text-muted-foreground font-medium">
                      {useModernUI ? "Moderna" : "Clásica"}
                    </span>
                    <Switch
                      checked={useModernUI}
                      onCheckedChange={setUseModernUI}
                      className="data-[state=checked]:bg-blue-500"
                    />
                  </div>
                  
                  {useModernUI ? <ModernAudioSuite /> : <AudioMastering />}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="backdrop-blur-sm border border-blue-500/10 rounded-lg shadow-lg hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
              >
                <ProfessionalVoiceCloning />
              </motion.div>
            </div>
          </div> */}

          {/* Terms and Conditions Section */}
          <div className="mt-16 mb-8 max-w-6xl mx-auto">
            <Collapsible open={isTermsOpen} onOpenChange={setIsTermsOpen}>
              <CollapsibleTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full flex items-center justify-between p-6 hover:bg-muted/50 transition-colors border-2"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <span className="text-base font-semibold">Booking Terms & Conditions</span>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${
                      isTermsOpen ? "rotate-180" : ""
                    }`}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="px-6 pb-6">
                <div className="space-y-6 text-sm text-muted-foreground mt-6 max-h-[500px] overflow-y-auto border rounded-lg p-6 bg-muted/20">
                  
                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">1. Service Agreement</h4>
                    <p className="leading-relaxed">
                      By booking a session with a musician through our platform, you agree to receive professional music services 
                      as described in the musician's profile. The musician commits to delivering high-quality work according to 
                      the specifications provided in your booking form.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">2. Payment Terms</h4>
                    <p className="leading-relaxed mb-2">
                      Payment is processed securely through Stripe. The total amount shown includes:
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>80% goes directly to the musician for their services</li>
                      <li>20% platform fee for facilitating the connection and payment processing</li>
                    </ul>
                    <p className="leading-relaxed mt-3">
                      All payments are processed in USD. You will be redirected to Stripe's secure checkout page to complete your payment.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">3. Cancellation & Refund Policy</h4>
                    <p className="leading-relaxed mb-2">
                      <strong>Cancellation by Client:</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Cancellations within 24 hours of booking: Full refund</li>
                      <li>Cancellations 24-48 hours after booking: 50% refund</li>
                      <li>Cancellations after 48 hours or after work has begun: No refund</li>
                    </ul>
                    <p className="leading-relaxed mt-3 mb-2">
                      <strong>Cancellation by Musician:</strong> If a musician cancels, you will receive a full refund within 5-7 business days.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">4. Project Delivery</h4>
                    <p className="leading-relaxed">
                      The musician will deliver the completed work according to the deadline specified in your booking. 
                      Delivery times may vary based on project complexity. You will receive the final files in professional-grade 
                      formats suitable for commercial use.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">5. Intellectual Property Rights</h4>
                    <p className="leading-relaxed">
                      Upon full payment, you will own the rights to use the delivered music for your specified project. 
                      The musician retains the right to showcase the work in their portfolio unless otherwise agreed upon. 
                      Additional usage rights or exclusive licenses can be negotiated directly with the musician.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">6. Revisions & Modifications</h4>
                    <p className="leading-relaxed">
                      Most bookings include up to 2 rounds of reasonable revisions. Additional revisions may incur extra charges 
                      to be agreed upon between you and the musician. Major changes to the project scope after booking may require 
                      a new agreement.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">7. Communication & Collaboration</h4>
                    <p className="leading-relaxed">
                      You and the musician will communicate through our platform's messaging system. Response times may vary, 
                      but musicians are expected to reply within 24-48 hours. For urgent matters, please indicate this in your 
                      initial message.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">8. Quality Guarantee</h4>
                    <p className="leading-relaxed">
                      All musicians on our platform are verified professionals. If you're not satisfied with the final delivery, 
                      please contact our support team within 7 days of receiving the files. We'll work to resolve the issue or 
                      facilitate a partial refund if warranted.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">9. Confidentiality</h4>
                    <p className="leading-relaxed">
                      Musicians agree to keep your project details confidential. If your project requires an NDA, please discuss 
                      this with the musician before booking, and we can facilitate the signing of appropriate legal documents.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-semibold text-foreground mb-3 text-base">10. Dispute Resolution</h4>
                    <p className="leading-relaxed">
                      In case of disputes, our support team will mediate between you and the musician. If a resolution cannot 
                      be reached, we reserve the right to make a final decision based on our platform policies and the evidence 
                      provided by both parties.
                    </p>
                  </div>

                  <div className="pt-4 border-t">
                    <p className="leading-relaxed italic">
                      By proceeding with this booking, you acknowledge that you have read, understood, and agree to these terms 
                      and conditions. For questions or concerns, please contact our support team before completing your booking.
                    </p>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

async function saveMusicianImage(data: ImageData) {
  try {
    await addDoc(collection(db, "musicianImages"), {
      ...data,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    logger.error("Error saving image to Firestore:", error);
    //Handle the error appropriately, perhaps display a toast message.
  }
}

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

interface ImageData {
  url: string;
  requestId: string;
  prompt: string;
  category: string;
  createdAt: Date;
}