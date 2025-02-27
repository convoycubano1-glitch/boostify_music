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

// Define interfaces
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

      // Verify required fields exist
      if (data && data.url && data.category) {
        images.push({
          url: data.url,
          category: data.category
        });
      }
    });

    return images;
  } catch (error) {
    console.error("Error fetching musician images:", error);
    return [];
  }
}

// Sample data
const musicians: MusicianService[] = [
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
    title: "John Smith",
    photo: "/assets/musicians/drummer-1.jpg",
    instrument: "Drums",
    category: "Drums",
    description: "Professional drummer with expertise in metal and rock. Studies at Musicians Institute.",
    price: 140,
    rating: 4.9,
    totalReviews: 87,
    genres: ["Metal", "Rock", "Hard Rock"]
  }
];

// Utility function to save musician image
async function saveMusicianImage(data: ImageData) {
  try {
    await addDoc(collection(db, "musician_images"), {
      ...data,
      createdAt: serverTimestamp()
    });
    console.log("Musician image saved successfully");
  } catch (error) {
    console.error("Error saving musician image:", error);
    throw error;
  }
}

export default function ProducerToolsPage() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("ai-tools");
  const [musicianImages, setMusicianImages] = useState<{ url: string; category: string; }[]>([]);
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  // Function to toggle loading state for different operations
  const toggleLoading = (operation: string, state: boolean) => {
    setLoading(prev => ({ ...prev, [operation]: state }));
  };

  // Function to get musician images from Firestore
  const getMusicianImages = async () => {
    try {
      const imagesRef = collection(db, "musician_images");
      const q = query(imagesRef, orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      
      const images: { url: string; category: string; }[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.url && data.category) {
          images.push({
            url: data.url,
            category: data.category
          });
        }
      });
      
      setMusicianImages(images);
    } catch (error) {
      console.error("Error fetching musician images:", error);
    }
  };

  // Use React Query to fetch musician data
  const { data: musicianServices, isLoading: loadingMusicians } = useQuery({
    queryKey: ['musician-services'],
    queryFn: async () => {
      // In a real app, this would fetch from your API
      return musicians;
    }
  });

  // Effect to fetch musician images on component mount
  useEffect(() => {
    getMusicianImages();
  }, []);

  // AI Tools functions
  const handleImageGeneration = async (category: string, prompt: string) => {
    try {
      toggleLoading(category, true);
      toast({
        title: "Generating image...",
        description: "Please wait while we create your image.",
        duration: 3000
      });

      const result = await generateImageWithFal({ prompt });
      
      if (result && result.image_url) {
        const imageData: ImageData = {
          url: result.image_url,
          requestId: result.request_id || "unknown",
          prompt,
          category,
          createdAt: new Date()
        };
        
        await saveMusicianImage(imageData);
        await getMusicianImages();
        
        toast({
          title: "Image generated successfully",
          description: "Your image has been created and saved.",
          variant: "success",
          duration: 3000
        });
      } else {
        throw new Error("No image URL in response");
      }
    } catch (error) {
      console.error(`Error generating ${category} image:`, error);
      toast({
        title: "Image generation failed",
        description: "There was an error creating your image. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      toggleLoading(category, false);
    }
  };

  // Audio mastering function
  const handleMasterTrack = async (file: File) => {
    try {
      toggleLoading("mastering", true);
      toast({
        title: "Processing audio",
        description: "Your track is being mastered...",
        duration: 3000
      });

      const result = await masterTrack(file);
      
      if (result && result.url) {
        toast({
          title: "Track mastered successfully",
          description: "Your mastered track is ready for download.",
          variant: "success",
          duration: 3000
        });
        
        // Download logic would go here
      } else {
        throw new Error("No URL in mastering response");
      }
    } catch (error) {
      console.error("Error mastering track:", error);
      toast({
        title: "Mastering failed",
        description: "There was an error processing your track. Please try again.",
        variant: "destructive",
        duration: 5000
      });
    } finally {
      toggleLoading("mastering", false);
    }
  };

  // Music generation function
  const handleGenerateMusic = async (prompt: string) => {
    try {
      toggleLoading("music", true);
      toast({
        title: "Generating music",
        description: "Your music is being created...",
        duration: 3000
      });

      const result = await generateMusic({ prompt });
      
      if (result && result.task_id) {
        // Poll for status
        const intervalId = setInterval(async () => {
          const status = await checkGenerationStatus(result.task_id);
          if (status && status.state === "completed") {
            clearInterval(intervalId);
            toggleLoading("music", false);
            toast({
              title: "Music generated successfully",
              description: "Your music is ready for playback.",
              variant: "success",
              duration: 3000
            });
            // Handle completed music (would be implemented in a real app)
          } else if (status && status.state === "failed") {
            clearInterval(intervalId);
            toggleLoading("music", false);
            throw new Error("Music generation failed");
          }
        }, 3000);
      } else {
        throw new Error("No task ID in response");
      }
    } catch (error) {
      console.error("Error generating music:", error);
      toast({
        title: "Music generation failed",
        description: "There was an error creating your music. Please try again.",
        variant: "destructive",
        duration: 5000
      });
      toggleLoading("music", false);
    }
  };

  // Render the musician cards
  const renderMusicianServices = () => {
    if (loadingMusicians) {
      return (
        <div className="flex justify-center items-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
        {musicianServices?.map(musician => (
          <Card key={musician.id} className="overflow-hidden shadow-md hover:shadow-lg transition-shadow">
            <div className="p-4">
              <div className="flex items-center gap-4 mb-2">
                <div className="rounded-full bg-primary/10 p-2">
                  {musician.instrument === "Guitar" ? (
                    <Guitar className="h-5 w-5 text-primary" />
                  ) : musician.instrument === "Drums" ? (
                    <Drum className="h-5 w-5 text-primary" />
                  ) : (
                    <Music2 className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div>
                  <h3 className="font-semibold">{musician.title}</h3>
                  <p className="text-sm text-muted-foreground">{musician.instrument}</p>
                </div>
              </div>
              
              <p className="text-sm mb-4">{musician.description}</p>
              
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <Star className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-sm font-medium">{musician.rating}</span>
                  <span className="text-xs text-muted-foreground ml-1">({musician.totalReviews} reviews)</span>
                </div>
                <div className="font-bold">${musician.price}/hour</div>
              </div>
              
              <BookingDialog musician={musician} trigger={
                <Button className="w-full">Book Session</Button>
              } />
            </div>
          </Card>
        ))}
        
        <Card className="flex flex-col items-center justify-center p-6 border-dashed shadow-md hover:shadow-lg transition-shadow">
          <Plus className="h-8 w-8 text-muted-foreground mb-2" />
          <h3 className="font-semibold mb-2">Add Musician</h3>
          <p className="text-sm text-center text-muted-foreground mb-4">
            Add your profile or a collaborator to the marketplace
          </p>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Add New Profile</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Musician Profile</DialogTitle>
                <DialogDescription>
                  Create a new musician profile for the marketplace
                </DialogDescription>
              </DialogHeader>
              <AddMusicianForm onClose={() => {}} onSuccess={() => {}} />
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    );
  };

  // Render the AI tools section with improved visual design
  const renderAITools = () => {
    return (
      <div className="relative">
        {/* Background image with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-10 rounded-xl overflow-hidden"
          style={{ backgroundImage: 'url(/assets/freepik__boostify_music_organe_abstract_icon.png)' }}
        />
        
        <div className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {/* Image Generation Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-6 bg-gradient-to-br from-primary/5 to-primary/20 backdrop-blur-sm border-2 border-primary/20 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full bg-primary/20 p-2">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">Album Art Generator</h3>
              </div>
              
              <p className="text-sm mb-4">
                Create professional album artwork using AI technology.
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-primary hover:bg-primary/90">Create Album Art</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate Album Art</DialogTitle>
                    <DialogDescription>
                      Describe the album art you want to create
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="album-prompt">Description</Label>
                      <Textarea 
                        id="album-prompt" 
                        placeholder="Describe the album art you want to create..." 
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      const prompt = (document.getElementById("album-prompt") as HTMLTextAreaElement).value;
                      if (prompt) {
                        handleImageGeneration("album-art", prompt);
                      }
                    }}
                    disabled={loading["album-art"]}
                    className="w-full"
                  >
                    {loading["album-art"] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Album Art"
                    )}
                  </Button>
                </DialogContent>
              </Dialog>
            </Card>
          </motion.div>
          
          {/* Audio Mastering Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="p-6 bg-gradient-to-br from-blue-500/5 to-blue-500/20 backdrop-blur-sm border-2 border-blue-500/20 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full bg-blue-500/20 p-2">
                  <Wand2 className="h-5 w-5 text-blue-500" />
                </div>
                <h3 className="font-semibold">AI Mastering</h3>
              </div>
              
              <p className="text-sm mb-4">
                Professional-grade audio mastering using advanced AI.
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-blue-500 hover:bg-blue-600 text-white">Master Track</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>AI Audio Mastering</DialogTitle>
                    <DialogDescription>
                      Upload your track for professional AI mastering
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="track-file">Upload Track</Label>
                      <Input 
                        id="track-file" 
                        type="file" 
                        accept="audio/*" 
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      const fileInput = document.getElementById("track-file") as HTMLInputElement;
                      if (fileInput.files && fileInput.files[0]) {
                        handleMasterTrack(fileInput.files[0]);
                      }
                    }}
                    disabled={loading["mastering"]}
                    className="w-full"
                  >
                    {loading["mastering"] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      "Master Track"
                    )}
                  </Button>
                </DialogContent>
              </Dialog>
            </Card>
          </motion.div>
          
          {/* Music Generation Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="p-6 bg-gradient-to-br from-purple-500/5 to-purple-500/20 backdrop-blur-sm border-2 border-purple-500/20 shadow-lg">
              <div className="flex items-center gap-2 mb-4">
                <div className="rounded-full bg-purple-500/20 p-2">
                  <Music4 className="h-5 w-5 text-purple-500" />
                </div>
                <h3 className="font-semibold">AI Music Creator</h3>
              </div>
              
              <p className="text-sm mb-4">
                Generate original music with advanced AI composition.
              </p>
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full bg-purple-500 hover:bg-purple-600 text-white">Create Music</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Generate AI Music</DialogTitle>
                    <DialogDescription>
                      Describe the music you want to create
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="music-prompt">Description</Label>
                      <Textarea 
                        id="music-prompt" 
                        placeholder="Describe the music style, mood, tempo, instruments..." 
                        className="min-h-[100px]"
                      />
                    </div>
                  </div>
                  
                  <Button 
                    onClick={() => {
                      const prompt = (document.getElementById("music-prompt") as HTMLTextAreaElement).value;
                      if (prompt) {
                        handleGenerateMusic(prompt);
                      }
                    }}
                    disabled={loading["music"]}
                    className="w-full"
                  >
                    {loading["music"] ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      "Generate Music"
                    )}
                  </Button>
                </DialogContent>
              </Dialog>
            </Card>
          </motion.div>
          
          {/* Generated Images Gallery */}
          {musicianImages.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="col-span-1 md:col-span-3"
            >
              <Card className="p-6 bg-gradient-to-r from-background to-background/80 backdrop-blur-sm shadow-lg">
                <h3 className="font-semibold mb-4">Your Generated Images</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {musicianImages.map((image, index) => (
                    <div key={index} className="rounded-md overflow-hidden aspect-square shadow-md hover:shadow-lg transition-shadow">
                      <img 
                        src={image.url} 
                        alt={`Generated ${image.category}`} 
                        className="w-full h-full object-cover" 
                      />
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto py-6">
        <div className="flex flex-col space-y-2 mb-6">
          <h1 className="text-3xl font-bold tracking-tight">AI Production Tools</h1>
          <p className="text-muted-foreground">
            Collaborate with musicians, generate AI content, and manage your production
          </p>
        </div>
        
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="ai-tools" className="flex items-center">
              <Zap className="h-4 w-4 mr-2" />
              AI Tools
            </TabsTrigger>
            <TabsTrigger value="musicians" className="flex items-center">
              <Music2 className="h-4 w-4 mr-2" />
              Musicians
            </TabsTrigger>
            <TabsTrigger value="file-exchange" className="flex items-center">
              <Upload className="h-4 w-4 mr-2" />
              File Exchange
            </TabsTrigger>
            <TabsTrigger value="studio" className="flex items-center">
              <Mic2 className="h-4 w-4 mr-2" />
              Studio
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center">
              <DollarSign className="h-4 w-4 mr-2" />
              Projects
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="ai-tools" className="mt-6">
            {renderAITools()}
          </TabsContent>
          
          <TabsContent value="musicians" className="mt-6">
            {renderMusicianServices()}
          </TabsContent>
          
          <TabsContent value="file-exchange" className="mt-6">
            <FileExchangeHub />
          </TabsContent>
          
          <TabsContent value="studio" className="mt-6">
            <StudioVideoCall />
          </TabsContent>
          
          <TabsContent value="progress" className="mt-6 space-y-6">
            <ProductionProgressContainer />
            <VersionControl />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}