import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Wand2, Video, RefreshCw, Camera, Check, Image, Music, Info, Sparkles } from 'lucide-react';

// Interfaz para las propiedades del componente
interface MusicVideoAIProps {
  onGenerateVideo: (videoUrl: string, title: string) => void;
}

// Lista de estilos visuales predefinidos
const visualStyles = [
  "Cinematográfico",
  "Minimalista",
  "Neon",
  "Vaporwave",
  "Anime",
  "Retro",
  "Cyberpunk",
  "Natural",
  "Surrealista"
];

// Lista de movimientos de cámara disponibles
const cameraMovements = [
  "Zoom lento",
  "Paneo horizontal",
  "Paneo vertical",
  "Travelling",
  "Orbital",
  "Tilt up",
  "Tilt down",
  "Estático",
  "Dolly zoom"
];

// Modelos disponibles para generación
const availableModels = [
  { id: "t2v-director", name: "Director", description: "Alta calidad con control de movimientos" },
  { id: "t2v-standard", name: "Estándar", description: "Buen balance de calidad y velocidad" },
  { id: "t2v-fast", name: "Rápido", description: "Generación veloz, calidad reducida" },
  { id: "i2v-advanced", name: "Imagen a Video", description: "Animación de imágenes estáticas" }
];

// URLs de muestra para desarrollo (reemplazar con API real)
const sampleVideoUrls = [
  '/assets/Standard_Mode_Generated_Video (2).mp4',
  '/assets/Standard_Mode_Generated_Video (9).mp4',
  '/src/images/videos/Standard_Mode_Generated_Video.mp4',
];

export const MusicVideoAI: React.FC<MusicVideoAIProps> = ({ onGenerateVideo }) => {
  // Estados para almacenar información del formulario
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModel, setSelectedModel] = useState("t2v-director");
  const [selectedStyle, setSelectedStyle] = useState("");
  const [selectedMovement, setSelectedMovement] = useState("");
  const [duration, setDuration] = useState(3); // En segundos
  const [resolution, setResolution] = useState("1080p");
  const [fps, setFps] = useState(24);
  const [imageUrl, setImageUrl] = useState(""); // Para modos image-to-video
  const [generatedVideos, setGeneratedVideos] = useState<string[]>([]);
  
  const { toast } = useToast();
  
  // Función para generar un video (mock)
  const generateVideo = async () => {
    // Validaciones básicas
    if (!prompt.trim()) {
      toast({
        title: "Prompt requerido",
        description: "Por favor, ingresa una descripción del video que deseas generar",
        variant: "destructive"
      });
      return;
    }
    
    setIsGenerating(true);
    
    try {
      // Aquí se implementaría la llamada real a la API de generación de videos
      // Usando PiAPI/Hailuo a través del endpoint del servidor
      
      // Construir el cuerpo de la solicitud
      const requestBody = {
        prompt: prompt,
        negative_prompt: negativePrompt,
        model: selectedModel,
        style: selectedStyle,
        camera_movement: selectedMovement,
        duration: duration,
        resolution: resolution,
        fps: fps,
        image_url: selectedModel.includes("i2v") ? imageUrl : undefined
      };
      
      // Simulación del proceso de generación
      console.log("Generando video con parámetros:", requestBody);
      
      // Simular retardo en la generación
      setTimeout(() => {
        // Obtener URL de un video de muestra
        const videoUrl = sampleVideoUrls[Math.floor(Math.random() * sampleVideoUrls.length)];
        
        // Añadir a la lista de videos generados
        setGeneratedVideos(prev => [videoUrl, ...prev]);
        
        // Notificar del éxito y enviar resultado al componente padre
        toast({
          title: "Video generado con éxito",
          description: "Tu video musical ha sido creado y está listo para usar en tu proyecto",
        });
        
        setIsGenerating(false);
        
        // Notificar al componente padre
        onGenerateVideo(videoUrl, `Video AI: ${prompt.slice(0, 20)}...`);
      }, 3000);
      
    } catch (error) {
      console.error("Error al generar video:", error);
      toast({
        title: "Error en generación",
        description: "No se pudo generar el video. Intenta con un prompt diferente",
        variant: "destructive"
      });
      setIsGenerating(false);
    }
  };
  
  // Función para aplicar un estilo predefinido
  const applyStyle = (style: string) => {
    setSelectedStyle(style);
    
    // Ajustar el prompt basado en el estilo seleccionado
    let stylePrompt = prompt;
    
    if (!stylePrompt.toLowerCase().includes(style.toLowerCase())) {
      stylePrompt = `${style}, ${stylePrompt}`;
    }
    
    setPrompt(stylePrompt);
  };
  
  // Función para aplicar un movimiento de cámara
  const applyMovement = (movement: string) => {
    setSelectedMovement(movement);
    
    // Solo ajustar si es un modelo que admite movimientos de cámara
    if (selectedModel === "t2v-director") {
      let movementPrompt = prompt;
      
      // Evitar repetición
      if (!movementPrompt.toLowerCase().includes(movement.toLowerCase())) {
        movementPrompt = `${movementPrompt}, con movimiento de cámara: ${movement}`;
      }
      
      setPrompt(movementPrompt);
    }
  };
  
  // Función para subir imágenes (mock)
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // En una implementación real, subiríamos la imagen a un servidor
    // Para el demo, simplemente creamos una URL local
    const url = URL.createObjectURL(file);
    setImageUrl(url);
    
    toast({
      title: "Imagen cargada",
      description: "La imagen se ha cargado correctamente y se usará para generar el video",
    });
  };
  
  return (
    <div className="space-y-6">
      <Tabs defaultValue="text-to-video" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="text-to-video">Texto a Video</TabsTrigger>
          <TabsTrigger value="image-to-video">Imagen a Video</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text-to-video" className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="prompt">Descripción del video</Label>
            <Textarea
              id="prompt"
              placeholder="Describe detalladamente el video que quieres generar..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="negative-prompt" className="flex items-center">
              <span>Elementos a evitar</span>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 ml-1">
                    <Info className="h-3 w-3" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80">
                  <p className="text-sm">
                    Describe elementos que NO quieres que aparezcan en tu video, como "mala calidad", "distorsiones", etc.
                  </p>
                </PopoverContent>
              </Popover>
            </Label>
            <Input
              id="negative-prompt"
              placeholder="Elementos que no deseas en el video..."
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Modelo</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model">
                  <SelectValue placeholder="Selecciona un modelo" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      <div className="flex flex-col">
                        <span>{model.name}</span>
                        <span className="text-xs text-muted-foreground">{model.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="duration">Duración ({duration}s)</Label>
              <Slider
                id="duration"
                min={1}
                max={10}
                step={1}
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
              />
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="image-to-video" className="space-y-4">
          <div className="space-y-2">
            <Label>Imagen de referencia</Label>
            <div className="border-2 border-dashed rounded-md p-4 text-center cursor-pointer">
              <input
                type="file"
                id="image-upload"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <label htmlFor="image-upload" className="cursor-pointer">
                {imageUrl ? (
                  <div className="relative w-full aspect-video">
                    <img 
                      src={imageUrl} 
                      alt="Imagen de referencia" 
                      className="w-full h-full object-cover rounded-md"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col items-center py-4">
                    <Camera className="h-10 w-10 mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium">
                      Arrastra aquí o haz clic para subir una imagen
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      JPG, PNG, WEBP (máx. 10MB)
                    </p>
                  </div>
                )}
              </label>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="i2v-prompt">Instrucciones adicionales</Label>
            <Textarea
              id="i2v-prompt"
              placeholder="Describe cómo quieres que sea la animación de la imagen..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[80px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="i2v-duration">Duración ({duration}s)</Label>
              <Slider
                id="i2v-duration"
                min={1}
                max={10}
                step={1}
                value={[duration]}
                onValueChange={(value) => setDuration(value[0])}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="i2v-model">Tipo de animación</Label>
              <Select value={selectedMovement} onValueChange={setSelectedMovement}>
                <SelectTrigger id="i2v-model">
                  <SelectValue placeholder="Selecciona un estilo" />
                </SelectTrigger>
                <SelectContent>
                  {cameraMovements.map((movement) => (
                    <SelectItem key={movement} value={movement}>
                      {movement}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium mb-2">Estilo visual</h3>
          <div className="flex flex-wrap gap-2">
            {visualStyles.map((style) => (
              <Button
                key={style}
                variant={selectedStyle === style ? "default" : "outline"}
                size="sm"
                onClick={() => applyStyle(style)}
              >
                {style}
              </Button>
            ))}
          </div>
        </div>
        
        {selectedModel === "t2v-director" && (
          <div>
            <h3 className="text-sm font-medium mb-2">Movimiento de cámara</h3>
            <div className="flex flex-wrap gap-2">
              {cameraMovements.map((movement) => (
                <Button
                  key={movement}
                  variant={selectedMovement === movement ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyMovement(movement)}
                >
                  {movement}
                </Button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex justify-between">
        <div className="flex space-x-2">
          <Select value={resolution} onValueChange={setResolution}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Resolución" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="720p">720p</SelectItem>
              <SelectItem value="1080p">1080p</SelectItem>
              <SelectItem value="4k">4K</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={fps.toString()} onValueChange={(val) => setFps(parseInt(val))}>
            <SelectTrigger className="w-20">
              <SelectValue placeholder="FPS" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24">24 FPS</SelectItem>
              <SelectItem value="30">30 FPS</SelectItem>
              <SelectItem value="60">60 FPS</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <Button
          onClick={generateVideo}
          disabled={isGenerating || (prompt.trim() === "") || (selectedModel.includes("i2v") && !imageUrl)}
          className="min-w-[150px]"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <Wand2 className="mr-2 h-4 w-4" />
              Generar Video
            </>
          )}
        </Button>
      </div>
      
      {generatedVideos.length > 0 && (
        <div className="mt-6">
          <h3 className="text-sm font-medium mb-2">Videos generados recientemente</h3>
          <div className="grid grid-cols-2 gap-3">
            {generatedVideos.slice(0, 4).map((url, index) => (
              <Card key={`gen-video-${index}`} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    <video 
                      src={url} 
                      controls
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute bottom-2 right-2"
                      onClick={() => onGenerateVideo(url, `Video AI ${index + 1}`)}
                    >
                      <Check className="mr-1 h-3 w-3" />
                      Usar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};