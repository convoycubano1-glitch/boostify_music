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
      const prompt = `Create an artist image style based on: 
        Genre: ${artistStyle.genre}, 
        Vibe: ${artistStyle.vibe}, 
        Aesthetic: ${artistStyle.aesthetic}, 
        Color Palette: ${artistStyle.colorPalette}
        Style should be professional and suitable for music industry visuals.`;

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
    <div className="w-full max-w-4xl mx-auto">
      <Card className="p-4 md:p-6 shadow-lg">
        <Tabs defaultValue="style" className="space-y-8">
          <TabsList className="grid grid-cols-2 gap-2 md:gap-4 p-1 bg-background/95 backdrop-blur sticky top-0 z-10">
            <TabsTrigger value="style" className="flex items-center gap-2 px-2 py-1.5 md:px-4 md:py-2">
              <Palette className="h-4 w-4" />
              <span className="text-sm md:text-base">Preferencias de Estilo</span>
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2 px-2 py-1.5 md:px-4 md:py-2">
              <Camera className="h-4 w-4" />
              <span className="text-sm md:text-base">Vista Previa & Resultados</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="style" className="mt-6 md:mt-8">
            <div className="grid gap-6 md:gap-8">
              <div className="space-y-4">
                <Label className="text-base font-medium">Género Musical</Label>
                <Select
                  value={artistStyle.genre}
                  onValueChange={(value) => setArtistStyle(prev => ({ ...prev, genre: value }))}
                >
                  <SelectTrigger className="w-full">
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

              <div className="space-y-4">
                <Label className="text-base font-medium">Vibra Deseada</Label>
                <Select
                  value={artistStyle.vibe}
                  onValueChange={(value) => setArtistStyle(prev => ({ ...prev, vibe: value }))}
                >
                  <SelectTrigger className="w-full">
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

              <div className="space-y-4">
                <Label className="text-base font-medium">Estilo Estético</Label>
                <Select
                  value={artistStyle.aesthetic}
                  onValueChange={(value) => setArtistStyle(prev => ({ ...prev, aesthetic: value }))}
                >
                  <SelectTrigger className="w-full">
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

              <div className="space-y-4">
                <Label className="text-base font-medium">Imagen de Referencia (Opcional)</Label>
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
                  onClick={generateStyleAdvice}
                  disabled={isGenerating || !artistStyle.genre}
                  className="w-full"
                >
                  {isGenerating ? (
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Generando Recomendaciones...</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <Sparkles className="h-4 w-4" />
                      <span>Generar Recomendaciones de Estilo</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="preview" className="mt-6 md:mt-8">
            {styleRecommendation && (
              <Card className="p-4 bg-muted/50 mb-6">
                <div className="flex items-start gap-3">
                  <UserCircle2 className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold mb-2">Recomendaciones de Estilo</h3>
                    <p className="text-sm md:text-base text-muted-foreground">{styleRecommendation}</p>
                  </div>
                </div>
              </Card>
            )}

            {generatedImages.length > 0 && (
              <div className="grid md:grid-cols-2 gap-6">
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
                        <h4 className="font-medium text-sm md:text-base">Referencia {index + 1}</h4>
                        <p className="text-xs md:text-sm text-muted-foreground">
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