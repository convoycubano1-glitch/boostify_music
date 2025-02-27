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

// Import any other necessary components and libraries

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

// Sample data
const musicians: MusicianService[] = [
  // A few sample musicians
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
    await addDoc(collection(db, "musicianImages"), {
      ...data,
      createdAt: serverTimestamp()
    });
  } catch (error) {
    console.error("Error saving image to Firestore:", error);
  }
}

// Main component
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
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);
  const [musiciansState, setMusiciansState] = useState(musicians);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [showAddMusicianDialog, setShowAddMusicianDialog] = useState(false);

  // Handle Mastering Track
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

  // Handle Generate Music
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

  // Handle Generate Cover
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
        >
          <source src="/assets/Standard_Mode_Generated_Video (3).mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/10 via-background/40 to-background"></div>

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
          {/* AI Tools Section - Redesigned with English text */}
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
                            Enhance your audio quality with advanced AI technology
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full">
                          <span className="font-medium">Professional</span>
                        </div>
                      </div>

                      <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border/50">
                        <div className="grid w-full items-center gap-1.5">
                          <Label htmlFor="audio" className="flex items-center gap-2">
                            <Upload className="h-4 w-4 text-orange-500" />
                            Audio File
                          </Label>
                          <Input
                            id="audio"
                            type="file"
                            accept="audio/*"
                            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                            className="text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Supported formats: WAV, MP3, FLAC (maximum 20MB)
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
                              Processing...
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
                  <Card className="p-4 sm:p-6 backdrop-blur-sm border border-orange-500/10">
                    <div className="w-full max-w-xl mx-auto space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                            <Music4 className="h-5 w-5 text-orange-500" />
                            Music Generation
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Describe the music you want to create and let AI generate it for you
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
                            Description
                          </Label>
                          <Textarea
                            id="prompt"
                            placeholder="Example: A reggaeton track with piano melody and deep bass, tempo of 95 BPM..."
                            value={musicPrompt}
                            onChange={(e) => setMusicPrompt(e.target.value)}
                            className="min-h-[120px] text-sm"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Include genre, instruments, tempo, and style for better results
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
                  <Card className="p-4 sm:p-6 backdrop-blur-sm border border-orange-500/10">
                    <div className="w-full max-w-xl mx-auto space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
                        <div>
                          <h2 className="text-xl sm:text-2xl font-semibold flex items-center gap-2">
                            <ImageIcon className="h-5 w-5 text-orange-500" />
                            AI Cover Art
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Create professional covers for your songs and albums
                          </p>
                        </div>
                        <div className="hidden sm:flex items-center gap-2 text-xs bg-orange-500/10 text-orange-600 dark:text-orange-400 px-3 py-1.5 rounded-full">
                          <span className="font-medium">Creative</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4 bg-background/50 p-4 rounded-lg border border-border/50">
                          <div className="grid w-full gap-1.5">
                            <Label htmlFor="coverPrompt" className="flex items-center gap-2">
                              <ImageIcon className="h-4 w-4 text-orange-500" />
                              Description
                            </Label>
                            <Textarea
                              id="coverPrompt"
                              placeholder="Example: Cover for an R&B album with neon colors, urban style, night atmosphere..."
                              value={coverPrompt}
                              onChange={(e) => setCoverPrompt(e.target.value)}
                              className="min-h-[120px] text-sm"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                              Describe the style, color palette, and visual elements
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

                        {generatedCoverUrl ? (
                          <div className="relative bg-background/50 rounded-lg border border-border/50 overflow-hidden">
                            <img
                              src={generatedCoverUrl}
                              alt="Generated cover art"
                              className="w-full h-full object-cover aspect-square"
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-white">
                              <p className="text-xs font-medium">Generated Cover</p>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col justify-center items-center bg-background/50 rounded-lg border border-border/50 p-4 text-center gap-2 aspect-square">
                            <ImageIcon className="h-12 w-12 text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">
                              Generated cover will appear here
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
        </div>
      </ScrollArea>
    </div>
  );
}