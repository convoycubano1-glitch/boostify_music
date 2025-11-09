import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { useToast } from "../../hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Sparkles, Loader2, Image as ImageIcon, FileText, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";

interface AIContentGeneratorProps {
  onBiographyGenerated?: (biography: string) => void;
  onImageGenerated?: (imageData: string) => void;
  artistName?: string;
  genre?: string;
}

export function AIContentGenerator({ 
  onBiographyGenerated, 
  onImageGenerated,
  artistName = "",
  genre = "Pop"
}: AIContentGeneratorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isGeneratingBio, setIsGeneratingBio] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [bioArtistName, setBioArtistName] = useState(artistName);
  const [bioGenre, setBioGenre] = useState(genre);
  const [bioStyle, setBioStyle] = useState("");
  const [imageArtistName, setImageArtistName] = useState(artistName);
  const [imageGenre, setImageGenre] = useState(genre);
  const [imageStyle, setImageStyle] = useState("modern and creative");
  const [generatedBio, setGeneratedBio] = useState("");
  const [generatedImage, setGeneratedImage] = useState("");
  const { toast } = useToast();

  const handleGenerateBiography = async () => {
    if (!bioArtistName || !bioGenre) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el nombre del artista y género",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingBio(true);
    try {
      const response = await fetch('/api/gemini-content/generate-biography', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: bioArtistName,
          genre: bioGenre,
          style: bioStyle,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate biography');

      const data = await response.json();
      setGeneratedBio(data.biography);
      
      if (onBiographyGenerated) {
        onBiographyGenerated(data.biography);
      }

      toast({
        title: "¡Biografía generada!",
        description: "Tu biografía ha sido creada con IA",
      });
    } catch (error) {
      console.error('Error generating biography:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la biografía. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingBio(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imageArtistName || !imageGenre) {
      toast({
        title: "Error",
        description: "Por favor, ingresa el nombre del artista y género",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingImage(true);
    try {
      const response = await fetch('/api/gemini-content/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistName: imageArtistName,
          genre: imageGenre,
          style: imageStyle,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate image');

      const data = await response.json();
      setGeneratedImage(data.imageData);
      
      if (onImageGenerated) {
        onImageGenerated(data.imageData);
      }

      toast({
        title: "¡Imagen generada!",
        description: "Tu imagen de artista ha sido creada con IA",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "No se pudo generar la imagen. Intenta nuevamente.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingImage(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border-purple-500/30 hover:border-purple-500/50"
          data-testid="button-ai-generator"
        >
          <Sparkles className="mr-2 h-4 w-4 text-purple-400" />
          Generador IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-400" />
            Generador de Contenido con IA
          </DialogTitle>
          <DialogDescription>
            Utiliza Gemini para crear biografías profesionales e imágenes únicas para tu perfil de artista
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="biography" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="biography" data-testid="tab-biography">
              <FileText className="mr-2 h-4 w-4" />
              Biografía
            </TabsTrigger>
            <TabsTrigger value="image" data-testid="tab-image">
              <ImageIcon className="mr-2 h-4 w-4" />
              Imagen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="biography" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="bio-artist-name">Nombre del Artista</Label>
                <Input
                  id="bio-artist-name"
                  value={bioArtistName}
                  onChange={(e) => setBioArtistName(e.target.value)}
                  placeholder="Ej: Luna Nova"
                  data-testid="input-bio-artist-name"
                />
              </div>
              <div>
                <Label htmlFor="bio-genre">Género Musical</Label>
                <Input
                  id="bio-genre"
                  value={bioGenre}
                  onChange={(e) => setBioGenre(e.target.value)}
                  placeholder="Ej: Pop, Rock, Hip Hop"
                  data-testid="input-bio-genre"
                />
              </div>
              <div>
                <Label htmlFor="bio-style">Estilo/Descripción (Opcional)</Label>
                <Input
                  id="bio-style"
                  value={bioStyle}
                  onChange={(e) => setBioStyle(e.target.value)}
                  placeholder="Ej: Experimental, con influencias latinas"
                  data-testid="input-bio-style"
                />
              </div>

              <Button
                onClick={handleGenerateBiography}
                disabled={isGeneratingBio}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-generate-bio"
              >
                {isGeneratingBio ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando biografía...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generar Biografía
                  </>
                )}
              </Button>

              {generatedBio && (
                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm">Biografía Generada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={generatedBio}
                      onChange={(e) => setGeneratedBio(e.target.value)}
                      rows={8}
                      className="resize-none"
                      data-testid="textarea-generated-bio"
                    />
                    <Button
                      onClick={() => {
                        if (onBiographyGenerated) {
                          onBiographyGenerated(generatedBio);
                        }
                        toast({
                          title: "¡Biografía aplicada!",
                          description: "La biografía se ha copiado a tu perfil",
                        });
                        setIsOpen(false);
                      }}
                      className="w-full mt-4"
                      data-testid="button-apply-bio"
                    >
                      Aplicar Biografía
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="image" className="space-y-4 mt-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="image-artist-name">Nombre del Artista</Label>
                <Input
                  id="image-artist-name"
                  value={imageArtistName}
                  onChange={(e) => setImageArtistName(e.target.value)}
                  placeholder="Ej: Luna Nova"
                  data-testid="input-image-artist-name"
                />
              </div>
              <div>
                <Label htmlFor="image-genre">Género Musical</Label>
                <Input
                  id="image-genre"
                  value={imageGenre}
                  onChange={(e) => setImageGenre(e.target.value)}
                  placeholder="Ej: Pop, Rock, Hip Hop"
                  data-testid="input-image-genre"
                />
              </div>
              <div>
                <Label htmlFor="image-style">Estilo Visual</Label>
                <Input
                  id="image-style"
                  value={imageStyle}
                  onChange={(e) => setImageStyle(e.target.value)}
                  placeholder="Ej: modern and creative, futuristic"
                  data-testid="input-image-style"
                />
              </div>

              <Button
                onClick={handleGenerateImage}
                disabled={isGeneratingImage}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                data-testid="button-generate-image"
              >
                {isGeneratingImage ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generando imagen...
                  </>
                ) : (
                  <>
                    <ImageIcon className="mr-2 h-4 w-4" />
                    Generar Imagen
                  </>
                )}
              </Button>

              {generatedImage && (
                <Card className="border-purple-500/20 bg-purple-500/5">
                  <CardHeader>
                    <CardTitle className="text-sm">Imagen Generada</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <img
                      src={generatedImage}
                      alt="Generated artist"
                      className="w-full h-auto rounded-lg mb-4"
                      data-testid="img-generated"
                    />
                    <Button
                      onClick={() => {
                        if (onImageGenerated) {
                          onImageGenerated(generatedImage);
                        }
                        toast({
                          title: "¡Imagen aplicada!",
                          description: "La imagen se ha guardado en tu perfil",
                        });
                        setIsOpen(false);
                      }}
                      className="w-full"
                      data-testid="button-apply-image"
                    >
                      Aplicar Imagen
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
