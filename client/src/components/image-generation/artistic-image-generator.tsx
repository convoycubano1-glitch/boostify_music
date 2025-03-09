import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, Image as ImageIcon, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { createFluxImageTask, checkFluxTaskStatus, FluxTaskResponse } from '../../services/flux/flux-service';

interface ArtisticImageGeneratorProps {
  onImageGenerated?: (imageUrl: string) => void;
}

export function ArtisticImageGenerator({ onImageGenerated }: ArtisticImageGeneratorProps) {
  // Estado para el prompt y opciones
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('cinematográfico');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  
  // Estado para el proceso de generación
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [taskId, setTaskId] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  // Mapeo de proporciones a etiquetas más descriptivas
  const aspectRatioLabels = {
    '1:1': 'Cuadrada (1:1)',
    '4:3': 'Horizontal (4:3)',
    '3:4': 'Vertical (3:4)',
    '16:9': 'Panorámica (16:9)',
    '9:16': 'Móvil (9:16)',
  };

  // Función para iniciar la generación de imágenes
  const handleGenerateImage = async () => {
    if (!prompt || prompt.trim().length < 5) {
      toast({
        title: "Descripción requerida",
        description: "Por favor, proporciona una descripción detallada para generar la imagen.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);
      setGenerationProgress(10);
      setError(null);
      setGeneratedImage(null);

      // Iniciar la tarea de generación
      const taskResponse = await createFluxImageTask({
        prompt,
        style,
        aspectRatio
      });

      setGenerationProgress(25);

      if (taskResponse.status === 'failed' || !taskResponse.taskId) {
        throw new Error(taskResponse.error || 'No se pudo iniciar la generación de imagen');
      }

      setTaskId(taskResponse.taskId);
      pollTaskStatus(taskResponse.taskId);
    } catch (err) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast({
        title: "Error de generación",
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: "destructive"
      });
    }
  };

  // Función para verificar periódicamente el estado de la tarea
  const pollTaskStatus = async (id: string) => {
    try {
      let status: FluxTaskResponse = { taskId: id, status: 'pending' };
      let attempts = 0;
      const maxAttempts = 60; // Maximo 5 minutos (60 intentos x 5 segundos)

      const checkStatus = async () => {
        attempts++;
        setGenerationProgress(25 + Math.min(attempts * 1.2, 70)); // Incremento gradual hasta 95%

        status = await checkFluxTaskStatus(id);

        if (status.status === 'completed' && status.output?.images && status.output.images.length > 0) {
          // Tarea completada con éxito
          setGenerationProgress(100);
          setGeneratedImage(status.output.images[0]);
          setIsGenerating(false);
          
          if (onImageGenerated) {
            onImageGenerated(status.output.images[0]);
          }
          
          toast({
            title: "¡Imagen generada!",
            description: "Tu imagen artística ha sido creada exitosamente.",
          });
        } else if (status.status === 'failed') {
          // Tarea fallida
          throw new Error(status.error || 'La generación de imagen falló');
        } else if (attempts >= maxAttempts) {
          // Demasiados intentos
          throw new Error('Tiempo de espera agotado');
        } else {
          // Continuar verificando
          setTimeout(checkStatus, 5000); // Verificar cada 5 segundos
        }
      };

      await checkStatus();
    } catch (err) {
      setIsGenerating(false);
      setError(err instanceof Error ? err.message : 'Error desconocido');
      toast({
        title: "Error al verificar estado",
        description: err instanceof Error ? err.message : 'Error desconocido',
        variant: "destructive"
      });
    }
  };

  // Función para descargar la imagen generada
  const downloadImage = async () => {
    if (!generatedImage) return;
    
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagen-artistica-${new Date().getTime()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      toast({
        title: "Error al descargar",
        description: "No se pudo descargar la imagen.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle>Generación de Imagen Artística</CardTitle>
        <CardDescription>Crea nuevas imágenes para tu proyecto artístico basadas en tus preferencias</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sección de descripción */}
        <div className="space-y-2">
          <Label htmlFor="prompt">Describe tu imagen ideal</Label>
          <Textarea 
            id="prompt"
            placeholder="Describe tu visión artística en detalle. Por ejemplo: Un retrato artístico de un músico en un estudio, con iluminación dramática azul y roja, estilo cyberpunk, fotografía profesional de alta calidad."
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={4}
            className="resize-none"
            disabled={isGenerating}
          />
        </div>
        
        {/* Sección de estilo */}
        <div className="space-y-2">
          <Label htmlFor="style">Estilo</Label>
          <Select 
            value={style} 
            onValueChange={setStyle}
            disabled={isGenerating}
          >
            <SelectTrigger id="style">
              <SelectValue placeholder="Selecciona un estilo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cinematográfico">Cinematográfico</SelectItem>
              <SelectItem value="realista">Realista</SelectItem>
              <SelectItem value="digital">Digital</SelectItem>
              <SelectItem value="acuarela">Acuarela</SelectItem>
              <SelectItem value="abstracto">Abstracto</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Sección de proporción */}
        <div className="space-y-2">
          <Label>Proporción</Label>
          <RadioGroup 
            value={aspectRatio} 
            onValueChange={setAspectRatio}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2"
            disabled={isGenerating}
          >
            {Object.entries(aspectRatioLabels).map(([value, label]) => (
              <div key={value} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={`ratio-${value}`} />
                <Label htmlFor={`ratio-${value}`} className="cursor-pointer">{label}</Label>
              </div>
            ))}
          </RadioGroup>
        </div>
        
        {/* Sección de imagen generada */}
        {isGenerating && (
          <div className="space-y-4 py-4">
            <Progress value={generationProgress} className="w-full h-2" />
            <div className="flex items-center justify-center h-64 bg-muted rounded-md">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">
                  Generando tu imagen artística...
                </p>
              </div>
            </div>
          </div>
        )}
        
        {generatedImage && !isGenerating && (
          <div className="space-y-2">
            <div className="relative aspect-square md:aspect-auto md:h-96 overflow-hidden rounded-md bg-muted flex items-center justify-center">
              <img
                src={generatedImage}
                alt="Imagen generada"
                className="max-w-full max-h-full object-contain"
              />
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={downloadImage}
            >
              <Download className="h-4 w-4 mr-2" />
              Descargar imagen
            </Button>
          </div>
        )}
        
        {error && !isGenerating && (
          <div className="p-4 border border-red-300 rounded-md bg-red-50 text-red-700">
            <p className="text-sm">Error: {error}</p>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={handleGenerateImage}
          disabled={isGenerating || !prompt || prompt.trim().length < 5}
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generando...
            </>
          ) : (
            <>
              <ImageIcon className="mr-2 h-4 w-4" />
              Generar imagen
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ArtisticImageGenerator;