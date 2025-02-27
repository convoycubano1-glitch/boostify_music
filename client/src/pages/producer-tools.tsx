import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { motion } from "framer-motion";
import { 
  Music2, DollarSign, Star, Music4, Mic2, Guitar, Drum, Piano, Plus, 
  Wand2, Image as ImageIcon, Upload, Loader2, Zap 
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { masterTrack } from "@/lib/api/kits-ai";
import { generateMusic, checkGenerationStatus } from "@/lib/api/zuno-ai";
import { generateImageWithFal } from "@/lib/api/fal-ai";
import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp } from "firebase/firestore";
import { BookingDialog } from "@/components/booking/booking-dialog";
import { AddMusicianForm } from "@/components/booking/add-musician-form";
import { FileExchangeHub } from "@/components/producer/FileExchangeHub";
import { StudioVideoCall } from "@/components/producer/StudioVideoCall";
import { ProductionProgressContainer } from "@/components/producer/ProductionProgressContainer";
import { VersionControl } from "@/components/producer/VersionControl";

async function getStoredMusicianImages(): Promise<{ url: string; category: string; }[]> {
  try {
    console.log("Starting to fetch musician images from musician_images collection...");
    const imagesRef = collection(db, "musician_images");
    const querySnapshot = await getDocs(imagesRef);

    console.log("Total documents found:", querySnapshot.size);

    const images: { url: string; category: string; }[] = [];

    querySnapshot.forEach(doc => {
      const data = doc.data();
      console.log("Document data:", data);

      // Verificar que los campos necesarios existen y usar 'url' en lugar de 'imageUrl'
      if (data && data.url && data.category) {
        images.push({
          url: data.url,
          category: data.category
        });
      }
    });

    console.log("Retrieved stored images:", images);
    return images;
  } catch (error) {
    console.error("Error fetching musician images:", error);
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
  const { toast } = useToast();
  const [showNewServiceDialog, setShowNewServiceDialog] = useState(false);
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

  const loadMusicianImages = async () => {
    try {
      console.log("Starting to load musician images...");
      setIsLoadingImages(true);

      const storedImages = await getStoredMusicianImages();
      console.log("Retrieved stored images:", storedImages);

      if (storedImages && storedImages.length > 0) {
        // Crear un mapa de imágenes por categoría
        const imagesByCategory = storedImages.reduce((acc, img) => {
          if (!acc[img.category]) {
            acc[img.category] = [];
          }
          acc[img.category].push(img.url);
          return acc;
        }, {} as Record<string, string[]>);

        console.log("Images grouped by category:", imagesByCategory);

        const updatedMusicians = musicians.map(musician => {
          const categoryImages = imagesByCategory[musician.category] || [];

          // Usar un índice basado en el ID del músico para variar las imágenes dentro de cada categoría
          const imageIndex = parseInt(musician.id) % (categoryImages.length || 1);

          if (categoryImages.length > 0) {
            console.log(`Assigning image for ${musician.title} (${musician.category}):`, categoryImages[imageIndex]);
            return {
              ...musician,
              userId: `user-${musician.id}`,
              photo: categoryImages[imageIndex]
            };
          }

          console.log(`No image found for ${musician.title} (${musician.category}), using placeholder`);
          return {
            ...musician,
            userId: `user-${musician.id}`,
            photo: `/assets/musicians/${musician.category.toLowerCase()}-placeholder.jpg`
          };
        });

        console.log("Final updated musicians:", updatedMusicians);
        setMusiciansState(updatedMusicians);
      } else {
        console.log("No images found in Firestore, using default images");
        setMusiciansState(musicians.map(musician => ({
          ...musician,
          userId: `user-${musician.id}`,
          photo: `/assets/musicians/${musician.category.toLowerCase()}-placeholder.jpg`
        })));
      }
    } catch (error) {
      console.error("Error loading musician images:", error);
      toast({
        title: "Error",
        description: "Failed to load musician images",
        variant: "destructive"
      });
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
      console.error("Error mastering track:", error);
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
        modelName: "chirp-v3.5",
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
      console.error("Error generating music:", error);
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
      console.error("Error generating cover:", error);
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
          <div className="text-center md:text-left mb-12">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Your Creative Music Hub
            </h1>
            <p className="text-lg text-white/90 max-w-2xl">
              Connect with musicians worldwide or use our AI tools to enhance your production workflow
            </p>
          </div>
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
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {isLoadingImages ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={`skeleton-${i}`} className="overflow-hidden animate-pulse backdrop-blur-sm">
                  <div className="aspect-video bg-muted" />
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </Card>
              ))
            ) : (
              filteredMusicians.map((musician) => (
                <Card key={musician.id} className="overflow-hidden backdrop-blur-sm bg-background/80">
                  <div className="aspect-video bg-orange-500/10 relative">
                    <img
                      src={musician.photo || "/assets/musician-placeholder.jpg"}
                      alt={musician.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-xl font-semibold">{musician.title}</h3>
                      <span className="text-sm font-medium text-orange-500">{musician.instrument}</span>
                    </div>
                    <p className="text-muted-foreground mb-4">{musician.description}</p>
                    <div className="flex justify-between items-center mb-4">
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-orange-500 fill-orange-500" />
                        <span className="font-medium">{musician.rating.toFixed(1)}</span>
                        <span className="text-muted-foreground">
                          ({musician.totalReviews} reviews)
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4 text-orange-500" />
                        <span className="font-medium">${musician.price}/sesión</span>
                      </div>
                    </div>
                    <Button
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      asChild
                    >
                      <BookingDialog musician={musician} />
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Production Tools Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12">
            <FileExchangeHub />
            <StudioVideoCall />
            <ProductionProgressContainer />
            <VersionControl />
          </div>

          {/* AI Tools Section */}
          <div className="mb-12 relative">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-violet-500/5 to-blue-500/5 rounded-xl -z-10"></div>
            <div className="absolute inset-0 bg-[url('https://fal.media/files/elephant/pA5H4n7Z5Mm3bLz74mUot_a051bbde5d634688bca0f16015321750.jpg')] bg-cover bg-center opacity-10 rounded-xl -z-20"></div>
            
            <div className="relative p-6 sm:p-8 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-8 w-1 bg-gradient-to-b from-orange-400 to-orange-600 rounded-full"></div>
                    <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-orange-500 to-orange-600 text-transparent bg-clip-text">AI Production Tools</h2>
                  </div>
                  <p className="text-sm text-muted-foreground max-w-xl">
                    Transform your music with cutting-edge AI technology. Our suite of professional tools helps you master, generate, and visualize your musical ideas effortlessly.
                  </p>
                </div>
                <div className="bg-gradient-to-r from-orange-500/80 to-orange-600/80 rounded-lg px-4 py-2.5 text-xs md:text-sm text-white shadow-md">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    <span className="font-medium">Powered by Advanced AI</span>
                  </div>
                </div>
              </div>
              
              <Tabs defaultValue="mastering" className="space-y-6">
                <TabsList className="w-full flex overflow-x-auto no-scrollbar justify-start sm:justify-center mb-4 bg-white/10 backdrop-blur-sm p-1 rounded-lg border border-orange-500/20">
                  <TabsTrigger value="mastering" className="flex-1 sm:flex-initial data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                    <Wand2 className="mr-2 h-4 w-4" />
                    <span className="hidden xs:inline">AI</span> Mastering
                  </TabsTrigger>
                  <TabsTrigger value="generation" className="flex-1 sm:flex-initial data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                    <Music4 className="mr-2 h-4 w-4" />
                    <span className="hidden xs:inline">Music</span> Generation
                  </TabsTrigger>
                  <TabsTrigger value="cover" className="flex-1 sm:flex-initial data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-orange-600 data-[state=active]:text-white">
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Cover Art
                  </TabsTrigger>
                </TabsList>

              {/* Mastering Tab */}
              <TabsContent value="mastering">
                <Card className="p-4 sm:p-6 backdrop-blur-sm border border-orange-500/10">
                  <div className="w-full max-w-xl mx-auto space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                          <Wand2 className="h-5 w-5 text-orange-500" />
                          AI Mastering
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Mejora la calidad de tu música con tecnología avanzada
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full">
                        <span className="font-medium">Profesional</span>
                      </div>
                    </div>

                    <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border/50">
                      <div className="grid w-full items-center gap-1.5">
                        <Label htmlFor="audio" className="flex items-center gap-2">
                          <Upload className="h-4 w-4 text-orange-500" />
                          Archivo de Audio
                        </Label>
                        <Input
                          id="audio"
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                          className="text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Formatos soportados: WAV, MP3, FLAC (máximo 20MB)
                        </p>
                      </div>

                      <Button
                        onClick={handleMasterTrack}
                        disabled={isMastering || !selectedFile}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {isMastering ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Procesando...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Masterizar Pista
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Generation Tab */}
              <TabsContent value="generation">
                <Card className="p-4 sm:p-6 backdrop-blur-sm border border-orange-500/10">
                  <div className="w-full max-w-xl mx-auto space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                          <Music4 className="h-5 w-5 text-orange-500" />
                          Generación Musical
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Describe la música que quieres crear y la IA la generará para ti
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full">
                        <span className="font-medium">Premium</span>
                      </div>
                    </div>

                    <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border/50">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="prompt" className="flex items-center gap-2">
                          <Music2 className="h-4 w-4 text-orange-500" />
                          Descripción
                        </Label>
                        <Textarea
                          id="prompt"
                          placeholder="Ej: Una pista de reggaeton con melodía de piano y bajo profundo, ritmo de 95 BPM..."
                          value={musicPrompt}
                          onChange={(e) => setMusicPrompt(e.target.value)}
                          className="min-h-[120px] text-sm"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          Incluye género, instrumentos, tempo, y estilo para mejores resultados
                        </p>
                      </div>

                      <Button
                        onClick={handleGenerateMusic}
                        disabled={isGeneratingMusic || !musicPrompt}
                        className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                      >
                        {isGeneratingMusic ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generando...
                          </>
                        ) : (
                          <>
                            <Music4 className="mr-2 h-4 w-4" />
                            Generar Música
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Cover Art Tab */}
              <TabsContent value="cover">
                <Card className="p-4 sm:p-6 backdrop-blur-sm border border-orange-500/10">
                  <div className="w-full max-w-xl mx-auto space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                      <div>
                        <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                          <ImageIcon className="h-5 w-5 text-orange-500" />
                          Portadas con IA
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          Crea portadas profesionales para tus canciones y álbumes
                        </p>
                      </div>
                      <div className="hidden sm:flex items-center gap-2 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full">
                        <span className="font-medium">Creativo</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border/50">
                        <div className="grid w-full gap-1.5">
                          <Label htmlFor="coverPrompt" className="flex items-center gap-2">
                            <ImageIcon className="h-4 w-4 text-orange-500" />
                            Descripción
                          </Label>
                          <Textarea
                            id="coverPrompt"
                            placeholder="Ej: Portada para un álbum de R&B con colores neon, estilo urbano, atmosfera nocturna..."
                            value={coverPrompt}
                            onChange={(e) => setCoverPrompt(e.target.value)}
                            className="min-h-[120px] text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Describe el estilo, paleta de colores y elementos visuales
                          </p>
                        </div>

                        <Button
                          onClick={handleGenerateCover}
                          disabled={isGeneratingCover || !coverPrompt}
                          className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                        >
                          {isGeneratingCover ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Generando...
                            </>
                          ) : (
                            <>
                              <ImageIcon className="mr-2 h-4 w-4" />
                              Generar Portada
                            </>
                          )}
                        </Button>
                      </div>

                      {generatedCoverUrl ? (
                        <div className="relative bg-background/50 rounded-lg border border-border/50 overflow-hidden">
                          <img
                            src={generatedCoverUrl}
                            alt="Generated cover art"
                            className="w-full h-full object-cover aspect-square"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                            <p className="text-xs font-medium">Portada Generada</p>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col justify-center items-center bg-background/50 rounded-lg border border-border/50 p-4 text-center gap-2 aspect-square">
                          <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">
                            La portada generada aparecerá aquí
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
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
    console.error("Error saving image to Firestore:", error);
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