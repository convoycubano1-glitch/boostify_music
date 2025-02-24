import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Upload, Camera, Sparkles, Palette, UserCircle2 } from "lucide-react";
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
    <div className="space-y-8">
      <div className="grid gap-6 md:gap-8">
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
          <div className="flex items-center justify-center w-full">
            <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer border-orange-500/20 bg-black/20 hover:bg-black/30">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 mb-4 text-orange-500" />
                <p className="mb-2 text-sm text-orange-500">
                  <span className="font-semibold">Click to upload</span> or drag and drop
                </p>
                <p className="text-xs text-muted-foreground">
                  PNG, JPG or GIF (MAX. 5MB)
                </p>
              </div>
              <Input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {referenceImage && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4"
            >
              <Card className="overflow-hidden">
                <img 
                  src={referenceImage} 
                  alt="Reference" 
                  className="w-full h-64 object-cover"
                />
              </Card>
            </motion.div>
          )}
        </div>

        <Button
          onClick={handleGenerateRecommendations}
          disabled={isGenerating || !artistStyle.genre}
          className="w-full bg-orange-500 hover:bg-orange-600"
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

        {/* Results Section */}
        {styleRecommendation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className="p-6 bg-black/40 backdrop-blur-sm border-orange-500/20">
              <div className="flex items-start gap-4">
                <UserCircle2 className="h-6 w-6 text-orange-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-lg mb-2">Style Analysis</h3>
                  <p className="text-sm text-muted-foreground">{styleRecommendation}</p>
                </div>
              </div>
            </Card>

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
                      <Card className="p-4 bg-black/40 backdrop-blur-sm border-orange-500/20">
                        <p className="text-sm">{recommendation}</p>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}