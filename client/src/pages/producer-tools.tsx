import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
import { motion } from "framer-motion";
import {
  Music2,
  DollarSign,
  Star,
  Music4,
  Mic2,
  Guitar,
  Drum,
  Piano,
  Plus,
  Wand2,
  Image as ImageIcon,
  Upload,
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { masterTrack } from "@/lib/api/kits-ai";
import { generateMusic, checkGenerationStatus } from "@/lib/api/zuno-ai";
import { generateImageWithFal } from "@/lib/api/fal-ai";
import { useQuery } from "@tanstack/react-query";
import { db, auth } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

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
  genres?: string[]; //Added genres
}

const musicians = [
  // Guitarristas
  {
    id: "1",
    name: "Alex Rivera",
    photo: "/assets/musicians/guitarist-1.jpg", // Will be replaced with Fal.ai generated image
    instrument: "Guitar",
    description: "Especialista en rock y blues con 15 años de experiencia. Colaboraciones con bandas internacionales y más de 500 sesiones de estudio.",
    pricePerSession: 120,
    rating: 4.9,
    totalReviews: 156,
    genres: ["Rock", "Blues", "Metal"],
    category: "Guitar"
  },
  {
    id: "2",
    name: "Sarah Johnson",
    photo: "/assets/musicians/guitarist-2.jpg",
    instrument: "Guitar",
    description: "Virtuosa de la guitarra acústica y flamenco. Graduada del Berklee College of Music con especialización en técnicas de fingerpicking.",
    pricePerSession: 150,
    rating: 4.8,
    totalReviews: 98,
    genres: ["Flamenco", "Classical", "Folk"],
    category: "Guitar"
  },
  {
    id: "3",
    name: "Miguel Torres",
    photo: "/assets/musicians/guitarist-3.jpg",
    instrument: "Guitar",
    description: "Especialista en jazz y fusión latina.  Amplia experiencia en giras internacionales y sesiones de grabación.",
    pricePerSession: 135,
    rating: 4.7,
    totalReviews: 123,
    genres: ["Jazz", "Latin Fusion", "Funk"],
    category: "Guitar"
  },
  // Bateristas
  {
    id: "4",
    name: "John Smith",
    photo: "/assets/musicians/drummer-1.jpg",
    instrument: "Drums",
    description: "Batería profesional con experiencia en metal y rock.  Estudios en el Musicians Institute y colaboraciones con artistas reconocidos.",
    pricePerSession: 140,
    rating: 4.9,
    totalReviews: 87,
    genres: ["Metal", "Rock", "Hard Rock"],
    category: "Drums"
  },
  {
    id: "5",
    name: "Lisa Chen",
    photo: "/assets/musicians/drummer-2.jpg",
    instrument: "Drums",
    description: "Especialista en ritmos latinos y fusión.  Estudios de percusión en Cuba y amplia experiencia en bandas de diferentes estilos.",
    pricePerSession: 130,
    rating: 4.8,
    totalReviews: 92,
    genres: ["Latin", "Fusion", "Pop"],
    category: "Drums"
  },
  {
    id: "6",
    name: "David Wilson",
    photo: "/assets/musicians/drummer-3.jpg",
    instrument: "Drums",
    description: "Experto en jazz y música electrónica.  Productor y compositor con experiencia en proyectos de vanguardia.",
    pricePerSession: 145,
    rating: 4.7,
    totalReviews: 78,
    genres: ["Jazz", "Electronic", "Experimental"],
    category: "Drums"
  },
  // Pianistas
  {
    id: "7",
    name: "Emma Watson",
    photo: "/assets/musicians/pianist-1.jpg",
    instrument: "Piano",
    description: "Pianista clásica con formación en el Conservatorio.  Especializada en música barroca y romántica.",
    pricePerSession: 160,
    rating: 5.0,
    totalReviews: 112,
    genres: ["Classical", "Baroque", "Romantic"],
    category: "Piano"
  },
  {
    id: "8",
    name: "Carlos Ruiz",
    photo: "/assets/musicians/pianist-2.jpg",
    instrument: "Piano",
    description: "Especialista en jazz y música contemporánea.  Amplia experiencia en composición y arreglos musicales.",
    pricePerSession: 150,
    rating: 4.9,
    totalReviews: 95,
    genres: ["Jazz", "Contemporary", "Pop"],
    category: "Piano"
  },
  {
    id: "9",
    name: "Sophie Martin",
    photo: "/assets/musicians/pianist-3.jpg",
    instrument: "Piano",
    description: "Experta en composición y arreglos.  Estudios en composición musical y amplia experiencia en proyectos orquestales.",
    pricePerSession: 155,
    rating: 4.8,
    totalReviews: 88,
    genres: ["Classical", "Contemporary", "Film Score"],
    category: "Piano"
  },
  // Vocalistas
  {
    id: "10",
    name: "Maria García",
    photo: "/assets/musicians/vocalist-1.jpg",
    instrument: "Vocals",
    description: "Vocalista versátil con experiencia en diversos géneros.  Estudios de canto clásico y jazz.",
    pricePerSession: 140,
    rating: 4.9,
    totalReviews: 167,
    genres: ["Pop", "Jazz", "R&B"],
    category: "Vocals"
  },
  {
    id: "11",
    name: "James Brown",
    photo: "/assets/musicians/vocalist-2.jpg",
    instrument: "Vocals",
    description: "Especialista en soul y R&B.  Amplia experiencia en coros y presentaciones en vivo.",
    pricePerSession: 150,
    rating: 4.8,
    totalReviews: 143,
    genres: ["Soul", "R&B", "Funk"],
    category: "Vocals"
  },
  {
    id: "12",
    name: "Luna Kim",
    photo: "/assets/musicians/vocalist-3.jpg",
    instrument: "Vocals",
    description: "Vocalista de jazz y música experimental.  Estudios de canto y composición en la universidad.",
    pricePerSession: 145,
    rating: 4.7,
    totalReviews: 89,
    genres: ["Jazz", "Experimental", "Electronic"],
    category: "Vocals"
  },
  // Productores
  {
    id: "13",
    name: "Mark Davis",
    photo: "/assets/musicians/producer-1.jpg",
    instrument: "Production",
    description: "Productor especializado en música urbana.  Experiencia en mezcla, masterización y producción musical.",
    pricePerSession: 200,
    rating: 4.9,
    totalReviews: 178,
    genres: ["Hip Hop", "Reggaeton", "Trap"],
    category: "Production"
  },
  {
    id: "14",
    name: "Ana Silva",
    photo: "/assets/musicians/producer-2.jpg",
    instrument: "Production",
    description: "Productora de EDM y música electrónica.  Especializada en la creación de sonidos electrónicos.",
    pricePerSession: 180,
    rating: 4.8,
    totalReviews: 156,
    genres: ["EDM", "Electronic", "Dance"],
    category: "Production"
  },
  {
    id: "15",
    name: "Tom Wilson",
    photo: "/assets/musicians/producer-3.jpg",
    instrument: "Production",
    description: "Especialista en producción de rock y metal.  Experiencia en grabación, mezcla y masterización.",
    pricePerSession: 190,
    rating: 4.7,
    totalReviews: 134,
    genres: ["Rock", "Metal", "Hard Rock"],
    category: "Production"
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

  const filteredMusicians = selectedCategory === "all"
    ? musicians
    : musicians.filter(m => m.category === selectedCategory);

  const handleHireMusician = (musician: typeof musicians[0]) => {
    toast({
      title: "Solicitud enviada",
      description: `Se ha enviado una solicitud de contratación a ${musician.name}`,
    });
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
        toast({
          title: "Success",
          description: "Cover art generated successfully!"
        });
        // Handle the generated image URL
        const imageUrl = result.data.images[0].url;
        // You can add state here to display the generated image
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

  useEffect(() => {
    async function loadMusicianImages() {
      try {
        // Placeholder - Replace with actual image generation logic
        const images = await generateMusicianImages();
        musicians.forEach((musician, index) => {
          musician.photo = images[index];
        });
        setImagesLoaded(true);
      } catch (error) {
        console.error("Error loading musician images:", error);
        setImagesLoaded(true); // Set to true even on error to show placeholders
      }
    }

    loadMusicianImages();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />

      {/* Hero Section with Video Background */}
      <div className="relative w-full h-[300px] overflow-hidden">
        <video
          autoPlay
          loop
          muted
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/assets/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10 container mx-auto px-4 h-full flex flex-col justify-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Your Creative Music Hub
          </h1>
          <p className="text-lg text-white/90 max-w-2xl">
            Connect with musicians worldwide or use our AI tools to enhance your production workflow
          </p>
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
          </div>

          {/* Service Categories */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-8">
            {["Guitar", "Drums", "Piano", "Vocals", "Production", "Other"].map((category) => (
              <Card
                key={category}
                className={`p-4 text-center cursor-pointer transition-colors ${
                  selectedCategory === category ? 'bg-orange-500/10 border-orange-500' : 'hover:bg-orange-500/5'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category === "Guitar" && <Guitar className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                {category === "Drums" && <Drum className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                {category === "Piano" && <Piano className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                {category === "Vocals" && <Mic2 className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                {category === "Production" && <Music4 className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                {category === "Other" && <Music2 className="h-8 w-8 mx-auto mb-2 text-orange-500" />}
                <p className="font-medium">{category}</p>
              </Card>
            ))}
          </div>

          {/* Musicians Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {filteredMusicians.map((musician) => (
              <Card key={musician.id} className="overflow-hidden">
                <div className="aspect-video bg-orange-500/10 relative">
                  <img
                    src={musician.photo}
                    alt={musician.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-xl font-semibold">{musician.name}</h3>
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
                      <span className="font-medium">${musician.pricePerSession}/sesión</span>
                    </div>
                  </div>
                  <Button
                    className="w-full bg-orange-500 hover:bg-orange-600"
                    onClick={() => handleHireMusician(musician)}
                  >
                    Contratar
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* AI Tools Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold mb-6">AI Production Tools</h2>
            <Tabs defaultValue="mastering" className="space-y-6">
              <TabsList>
                <TabsTrigger value="mastering">
                  <Wand2 className="mr-2 h-4 w-4" />
                  AI Mastering
                </TabsTrigger>
                <TabsTrigger value="generation">
                  <Music4 className="mr-2 h-4 w-4" />
                  Music Generation
                </TabsTrigger>
                <TabsTrigger value="cover">
                  <ImageIcon className="mr-2 h-4 w-4" />
                  Cover Art
                </TabsTrigger>
              </TabsList>

              {/* Mastering Tab */}
              <TabsContent value="mastering">
                <Card className="p-6">
                  <div className="max-w-xl mx-auto space-y-4">
                    <h2 className="text-2xl font-semibold">AI Mastering</h2>
                    <p className="text-muted-foreground">
                      Upload your track and let our AI master it to professional standards
                    </p>

                    <div className="space-y-4">
                      <div className="grid w-full max-w-sm items-center gap-1.5">
                        <Label htmlFor="audio">Audio File</Label>
                        <Input
                          id="audio"
                          type="file"
                          accept="audio/*"
                          onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        />
                      </div>

                      <Button
                        onClick={handleMasterTrack}
                        disabled={isMastering || !selectedFile}
                        className="w-full"
                      >
                        {isMastering ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Mastering...
                          </>
                        ) : (
                          <>
                            <Wand2 className="mr-2 h-4 w-4" />
                            Master Track
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Generation Tab */}
              <TabsContent value="generation">
                <Card className="p-6">
                  <div className="max-w-xl mx-auto space-y-4">
                    <h2 className="text-2xl font-semibold">AI Music Generation</h2>
                    <p className="text-muted-foreground">
                      Describe the music you want to create and let AI generate it for you
                    </p>

                    <div className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="prompt">Description</Label>
                        <Textarea
                          id="prompt"
                          placeholder="Describe the music you want to generate..."
                          value={musicPrompt}
                          onChange={(e) => setMusicPrompt(e.target.value)}
                        />
                      </div>

                      <Button
                        onClick={handleGenerateMusic}
                        disabled={isGeneratingMusic || !musicPrompt}
                        className="w-full"
                      >
                        {isGeneratingMusic ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Music4 className="mr-2 h-4 w-4" />
                            Generate Music
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card>
              </TabsContent>

              {/* Cover Art Tab */}
              <TabsContent value="cover">
                <Card className="p-6">
                  <div className="max-w-xl mx-auto space-y-4">
                    <h2 className="text-2xl font-semibold">AI Cover Art Generation</h2>
                    <p className="text-muted-foreground">
                      Describe your ideal album cover and let AI create it for you
                    </p>

                    <div className="space-y-4">
                      <div className="grid w-full gap-1.5">
                        <Label htmlFor="coverPrompt">Description</Label>
                        <Textarea
                          id="coverPrompt"
                          placeholder="Describe the cover art you want to generate..."
                          value={coverPrompt}
                          onChange={(e) => setCoverPrompt(e.target.value)}
                        />
                      </div>

                      <Button
                        onClick={handleGenerateCover}
                        disabled={isGeneratingCover || !coverPrompt}
                        className="w-full"
                      >
                        {isGeneratingCover ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Generate Cover
                          </>
                        )}
                      </Button>
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


// Placeholder function -  Replace with actual implementation to generate images from Fal.ai
async function generateMusicianImages(): Promise<string[]> {
  //Simulate API call.  Replace with actual API call to Fal.ai
  const imageUrls = [
    "/assets/musicians/guitarist-1.jpg",
    "/assets/musicians/guitarist-2.jpg",
    "/assets/musicians/guitarist-3.jpg",
    "/assets/musicians/drummer-1.jpg",
    "/assets/musicians/drummer-2.jpg",
    "/assets/musicians/drummer-3.jpg",
    "/assets/musicians/pianist-1.jpg",
    "/assets/musicians/pianist-2.jpg",
    "/assets/musicians/pianist-3.jpg",
    "/assets/musicians/vocalist-1.jpg",
    "/assets/musicians/vocalist-2.jpg",
    "/assets/musicians/vocalist-3.jpg",
    "/assets/musicians/producer-1.jpg",
    "/assets/musicians/producer-2.jpg",
    "/assets/musicians/producer-3.jpg"
  ]
  return imageUrls;
}