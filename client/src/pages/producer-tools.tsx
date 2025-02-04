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
import { collection, query, where, getDocs, orderBy, addDoc, serverTimestamp, updateDoc, doc } from "firebase/firestore";
import { BookingDialog } from "@/components/booking/booking-dialog";

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

export default function ProducerToolsPage() {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState("");
  const [coverPrompt, setCoverPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [generatedCoverUrl, setGeneratedCoverUrl] = useState<string | null>(null);

  // Fetch musicians from Firestore - using existing data
  const { data: musicians = [], isLoading: isLoadingMusicians } = useQuery({
    queryKey: ['musicians'],
    queryFn: async () => {
      const musiciansRef = collection(db, 'musicians');
      const q = query(musiciansRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MusicianService[];
    }
  });

  const filteredMusicians = selectedCategory === "all"
    ? musicians
    : musicians.filter(m => m.category === selectedCategory);

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

  // useEffect hook simplified - no image loading
  useEffect(() => {
  }, [musicians]);

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
            {isLoadingMusicians ? (
              // Loading skeleton
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={`skeleton-${i}`} className="overflow-hidden animate-pulse">
                  <div className="aspect-video bg-muted" />
                  <div className="p-6 space-y-4">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </Card>
              ))
            ) : (
              filteredMusicians.map((musician) => (
                <Card key={musician.id} className="overflow-hidden">
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
                        <span className="font-medium">${musician.price}/session</span>
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

                      {generatedCoverUrl && (
                        <div className="mt-4">
                          <h3 className="text-lg font-medium mb-2">Generated Cover Art:</h3>
                          <div className="aspect-video relative rounded-lg overflow-hidden border">
                            <img
                              src={generatedCoverUrl}
                              alt="Generated cover art"
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      )}

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