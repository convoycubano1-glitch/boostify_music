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
import { motion } from "framer-motion";

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
          description: "La imagen debe ser menor a 5MB",
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

      // Set example style recommendation
      setStyleRecommendation(`Based on your ${artistStyle.genre} genre and ${artistStyle.vibe} vibe, 
        we recommend a ${artistStyle.aesthetic} aesthetic with ${artistStyle.colorPalette} color elements. 
        This style will resonate with your target audience while maintaining professional appeal.`);

      toast({
        title: "¡Éxito!",
        description: "¡Recomendaciones de estilo generadas con éxito!",
      });
    } catch (error) {
      console.error("Error generating style advice:", error);
      toast({
        title: "Error",
        description: "No se pudieron generar las recomendaciones de estilo",
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
              <span>Preferencias de Estilo</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="space-x-2">
              <Camera className="h-4 w-4" />
              <span>Vista Previa & Resultados</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="space-y-6">
            <div className="grid gap-6">
              <div>
                <Label>Género Musical</Label>
                <Select
                  value={artistStyle.genre}
                  onValueChange={(value) => setArtistStyle(prev => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu género" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pop">Pop</SelectItem>
                    <SelectItem value="rock">Rock</SelectItem>
                    <SelectItem value="hiphop">Hip Hop</SelectItem>
                    <SelectItem value="electronic">Electrónica</SelectItem>
                    <SelectItem value="jazz">Jazz</SelectItem>
                    <SelectItem value="classical">Clásica</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Vibra Deseada</Label>
                <Select
                  value={artistStyle.vibe}
                  onValueChange={(value) => setArtistStyle(prev => ({ ...prev, vibe: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la vibra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Professional">Profesional</SelectItem>
                    <SelectItem value="Edgy">Atrevida</SelectItem>
                    <SelectItem value="Artistic">Artística</SelectItem>
                    <SelectItem value="Minimalist">Minimalista</SelectItem>
                    <SelectItem value="Avant-garde">Vanguardista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Estilo Estético</Label>
                <Select
                  value={artistStyle.aesthetic}
                  onValueChange={(value) => setArtistStyle(prev => ({ ...prev, aesthetic: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estilo estético" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Modern">Moderno</SelectItem>
                    <SelectItem value="Vintage">Vintage</SelectItem>
                    <SelectItem value="Urban">Urbano</SelectItem>
                    <SelectItem value="Natural">Natural</SelectItem>
                    <SelectItem value="Futuristic">Futurista</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Imagen de Referencia (Opcional)</Label>
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="cursor-pointer"
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

              <Button
                onClick={generateStyleAdvice}
                disabled={isGenerating || !artistStyle.genre}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando Recomendaciones...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar Recomendaciones de Estilo
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
                    <h3 className="font-semibold mb-2">Recomendaciones de Estilo</h3>
                    <p className="text-muted-foreground">{styleRecommendation}</p>
                  </div>
                </div>
              </Card>
            )}

            {generatedImages.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4">
                {generatedImages.map((imageUrl, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.2 }}
                  >
                    <Card className="overflow-hidden">
                      <div className="aspect-[9/16] relative">
                        <img
                          src={imageUrl}
                          alt={`Style reference ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4">
                        <h4 className="font-medium">Referencia {index + 1}</h4>
                        <p className="text-sm text-muted-foreground">
                          Basado en tus preferencias de {artistStyle.genre}
                        </p>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Card>
    </div>
  );
}