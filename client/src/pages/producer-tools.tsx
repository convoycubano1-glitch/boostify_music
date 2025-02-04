import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Header } from "@/components/layout/header";
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
import { generateCoverArt } from "@/lib/api/fal-ai";
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
}

export default function ProducerToolsPage() {
  const { toast } = useToast();
  const [isGeneratingMusic, setIsGeneratingMusic] = useState(false);
  const [isMastering, setIsMastering] = useState(false);
  const [isGeneratingCover, setIsGeneratingCover] = useState(false);
  const [musicPrompt, setMusicPrompt] = useState("");
  const [coverPrompt, setCoverPrompt] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: services = [] } = useQuery({
    queryKey: ["musician-services"],
    queryFn: async () => {
      const servicesRef = collection(db, "musician-services");
      const q = query(
        servicesRef,
        orderBy("rating", "desc")
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as MusicianService[];
    },
  });

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
      const result = await generateCoverArt({
        prompt: coverPrompt,
        negativePrompt: "low quality, blurry, distorted",
        style: "realistic"
      });

      toast({
        title: "Success",
        description: "Cover art generated successfully!"
      });

      // Handle the generated image here
      // Could save to Firebase or provide download link

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
      <ScrollArea className="flex-1">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-500/70">
                Producer Tools
              </h1>
              <p className="text-muted-foreground mt-2">
                Create, master, and visualize your music
              </p>
            </div>
          </div>

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
      </ScrollArea>
    </div>
  );
}