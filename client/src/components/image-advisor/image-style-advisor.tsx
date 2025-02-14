import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Upload, Camera, Sparkles, Palette, Music2, UserCircle2, RefreshCw } from "lucide-react";
import { generateImageWithFal } from "@/lib/api/fal-ai";
import { useToast } from "@/hooks/use-toast";

export function ImageStyleAdvisor() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [styleRecommendation, setStyleRecommendation] = useState<string>("");
  
  const [artistStyle, setArtistStyle] = useState({
    genre: "",
    vibe: "Professional",
    aesthetic: "Modern",
    colorPalette: "Vibrant",
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
        setReferenceImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStyleAdvice = async () => {
    setIsGenerating(true);
    try {
      // Generate style recommendations
      const prompt = `Create an artist image style based on: 
        Genre: ${artistStyle.genre}, 
        Vibe: ${artistStyle.vibe}, 
        Aesthetic: ${artistStyle.aesthetic}, 
        Color Palette: ${artistStyle.colorPalette}
        Style should be professional and suitable for music industry visuals.`;

      // Generate multiple reference images
      const imageResults = await Promise.all([
        generateImageWithFal({
          prompt: `Professional portrait of a ${artistStyle.genre} musician, 
            ${artistStyle.vibe} style, ${artistStyle.aesthetic} aesthetic, 
            ${artistStyle.colorPalette} color scheme, high-end photography, studio lighting`,
          negativePrompt: "deformed, unrealistic, low quality, blurry",
          imageSize: "portrait_9_16"
        }),
        generateImageWithFal({
          prompt: `Artistic promotional photo of a ${artistStyle.genre} artist, 
            ${artistStyle.vibe} mood, ${artistStyle.aesthetic} setting, 
            ${artistStyle.colorPalette} tones, professional music industry photo`,
          negativePrompt: "deformed, unrealistic, low quality, blurry",
          imageSize: "portrait_9_16"
        })
      ]);

      const newImages = imageResults
        .map(result => result.data?.images?.[0]?.url)
        .filter((url): url is string => !!url);

      setGeneratedImages(newImages);
      
      // Set example style recommendation (replace with Perplexity API integration)
      setStyleRecommendation(`Based on your ${artistStyle.genre} genre and ${artistStyle.vibe} vibe, 
        we recommend a ${artistStyle.aesthetic} aesthetic with ${artistStyle.colorPalette} color elements. 
        This style will resonate with your target audience while maintaining professional appeal.`);

      toast({
        title: "Success",
        description: "Style recommendations generated successfully!",
      });
    } catch (error) {
      console.error("Error generating style advice:", error);
      toast({
        title: "Error",
        description: "Failed to generate style recommendations",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="p-6 shadow-lg">
        <Tabs defaultValue="style" className="space-y-6">
          <TabsList className="grid grid-cols-2 gap-4 p-1">
            <TabsTrigger value="style" className="space-x-2">
              <Palette className="h-4 w-4" />
              <span>Style Preferences</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="space-x-2">
              <Camera className="h-4 w-4" />
              <span>Preview & Results</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="space-y-6">
            <div className="grid gap-6">
              <div>
                <Label>Music Genre</Label>
                <Select
                  value={artistStyle.genre}
                  onValueChange={(value) => setArtistStyle(prev => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger>
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

              <div>
                <Label>Desired Vibe</Label>
                <Select
                  value={artistStyle.vibe}
                  onValueChange={(value) => setArtistStyle(prev => ({ ...prev, vibe: value }))}
                >
                  <SelectTrigger>
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

              <div>
                <Label>Aesthetic Style</Label>
                <Select
                  value={artistStyle.aesthetic}
                  onValueChange={(value) => setArtistStyle(prev => ({ ...prev, aesthetic: value }))}
                >
                  <SelectTrigger>
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

              <div>
                <Label>Reference Image (Optional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>

              <Button
                onClick={generateStyleAdvice}
                disabled={isGenerating || !artistStyle.genre}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Recommendations...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Style Recommendations
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="space-y-6">
            {styleRecommendation && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-start space-x-2">
                  <UserCircle2 className="h-5 w-5 text-primary mt-1" />
                  <div>
                    <h3 className="font-semibold mb-2">Style Recommendations</h3>
                    <p className="text-muted-foreground">{styleRecommendation}</p>
                  </div>
                </div>
              </Card>
            )}

            {generatedImages.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {generatedImages.map((imageUrl, index) => (
                  <Card key={index} className="overflow-hidden">
                    <div className="aspect-[9/16] relative">
                      <img
                        src={imageUrl}
                        alt={`Style reference ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4">
                      <h4 className="font-medium">Reference Look {index + 1}</h4>
                      <p className="text-sm text-muted-foreground">
                        Based on your {artistStyle.genre} style preferences
                      </p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}
