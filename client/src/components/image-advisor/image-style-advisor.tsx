import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Camera, Sparkles, Palette, Music2, UserCircle2, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { imageAdvisorService } from "@/lib/services/image-advisor-service";
import { useMutation } from "@tanstack/react-query";

export function ImageStyleAdvisor() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [styleRecommendation, setStyleRecommendation] = useState<string>("");
  const [recommendations, setRecommendations] = useState<string[]>([]);

  const [artistStyle, setArtistStyle] = useState({
    genre: "",
    vibe: "Professional",
    aesthetic: "Modern",
    colorPalette: "Vibrant",
  });

  // Mutation for analyzing images
  const analyzeImageMutation = useMutation({
    mutationFn: async (imageUrl: string) => {
      return await imageAdvisorService.analyzeImage(imageUrl);
    },
    onSuccess: (data) => {
      setStyleRecommendation(data.styleAnalysis);
      setRecommendations(data.recommendations);
      toast({
        title: "Success",
        description: "Image analyzed successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to analyze image",
        variant: "destructive",
      });
    }
  });

  // Mutation for generating visual recommendations
  const generateRecommendationsMutation = useMutation({
    mutationFn: async ({ style, genre }: { style: string; genre: string }) => {
      return await imageAdvisorService.generateVisualRecommendations(style, genre);
    },
    onSuccess: (data) => {
      setRecommendations(data);
      toast({
        title: "Success",
        description: "Recommendations generated successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to generate recommendations",
        variant: "destructive",
      });
    }
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "Image must be less than 5MB",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const imageUrl = reader.result as string;
        setReferenceImage(imageUrl);
        analyzeImageMutation.mutate(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateRecommendations = async () => {
    if (!artistStyle.genre) {
      toast({
        title: "Error",
        description: "Please select a genre first",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsGenerating(true);
      await generateRecommendationsMutation.mutateAsync({
        style: `${artistStyle.vibe} ${artistStyle.aesthetic}`,
        genre: artistStyle.genre
      });
    } catch (error) {
      console.error("Error generating style recommendations:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="p-4 md:p-6 shadow-lg">
        <Tabs defaultValue="style" className="space-y-8">
          <TabsList className="grid grid-cols-2 gap-2 md:gap-4 p-1 bg-background/95 backdrop-blur relative z-10 mb-8">
            <TabsTrigger value="style" className="flex items-center gap-2 px-2 py-1.5 md:px-4 md:py-2">
              <Palette className="h-4 w-4" />
              <span className="text-sm md:text-base">Style Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2 px-2 py-1.5 md:px-4 md:py-2">
              <Camera className="h-4 w-4" />
              <span className="text-sm md:text-base">Preview & Results</span>
            </TabsTrigger>
          </TabsList>

          <div className="pt-4 sm:pt-0">
            <TabsContent value="style" className="mt-8 md:mt-6">
              <div className="grid gap-8 md:gap-6">
                <div className="space-y-4">
                  <Label className="text-base font-medium">Musical Genre</Label>
                  <Select
                    value={artistStyle.genre}
                    onValueChange={(value) => setArtistStyle(prev => ({ ...prev, genre: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select your genre" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pop">Pop</SelectItem>
                      <SelectItem value="rock">Rock</SelectItem>
                      <SelectItem value="hiphop">Hip Hop</SelectItem>
                      <SelectItem value="electronic">Electronic</SelectItem>
                      <SelectItem value="jazz">Jazz</SelectItem>
                      <SelectItem value="classical">Classical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Desired Vibe</Label>
                  <Select
                    value={artistStyle.vibe}
                    onValueChange={(value) => setArtistStyle(prev => ({ ...prev, vibe: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select the vibe" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Professional">Professional</SelectItem>
                      <SelectItem value="Edgy">Edgy</SelectItem>
                      <SelectItem value="Artistic">Artistic</SelectItem>
                      <SelectItem value="Minimalist">Minimalist</SelectItem>
                      <SelectItem value="Avant-garde">Avant-garde</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Aesthetic Style</Label>
                  <Select
                    value={artistStyle.aesthetic}
                    onValueChange={(value) => setArtistStyle(prev => ({ ...prev, aesthetic: value }))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select aesthetic style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Modern">Modern</SelectItem>
                      <SelectItem value="Vintage">Vintage</SelectItem>
                      <SelectItem value="Urban">Urban</SelectItem>
                      <SelectItem value="Natural">Natural</SelectItem>
                      <SelectItem value="Futuristic">Futuristic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="text-base font-medium">Reference Image (Optional)</Label>
                  <div className="space-y-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="cursor-pointer w-full"
                    />
                    {referenceImage && (
                      <div className="mt-4">
                        <img 
                          src={referenceImage} 
                          alt="Reference" 
                          className="w-full max-w-md mx-auto rounded-lg shadow-lg"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleGenerateRecommendations}
                    disabled={isGenerating || !artistStyle.genre}
                    className="w-full"
                  >
                    {isGenerating ? (
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Generating Recommendations...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Style Recommendations</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="mt-8 md:mt-6">
              {styleRecommendation && (
                <Card className="p-4 bg-muted/50 mb-6">
                  <div className="flex items-start gap-3">
                    <UserCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold mb-2">Style Analysis</h3>
                      <p className="text-sm md:text-base text-muted-foreground">{styleRecommendation}</p>
                    </div>
                  </div>
                </Card>
              )}

              {recommendations.length > 0 && (
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Recommendations</h3>
                  <div className="grid gap-4">
                    {recommendations.map((recommendation, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Card className="p-4">
                          <p className="text-sm">{recommendation}</p>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </Card>
    </div>
  );
}