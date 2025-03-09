import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Download, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TimelineClip } from "./timeline-editor";
import { PremiumVideoPlayer } from "./premium-video-player";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface VideoGeneratorProps {
  clips: TimelineClip[];
  duration: number;
  isGenerating: boolean;
  onGenerate: () => Promise<string | null>;
}

export function VideoGenerator({
  clips,
  duration,
  isGenerating,
  onGenerate
}: VideoGeneratorProps) {
  const { toast } = useToast();
  const [quality, setQuality] = useState<string>("high");
  const [fps, setFps] = useState<number>(30);
  const [progress, setProgress] = useState<number>(0);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoId, setVideoId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(false);

  // Verificar si el video ya fue comprado
  const { data: videoPaymentStatus } = useQuery({
    queryKey: ['videoPaymentStatus', videoId],
    queryFn: async () => {
      if (!videoId) return { isPurchased: false };
      const res = await apiRequest(`/api/stripe/video-purchase-status/${videoId}`);
      return res;
    },
    enabled: !!videoId && showPreview,
  });

  const handleGenerate = async () => {
    try {
      setProgress(0);
      setVideoUrl("");
      
      // Iniciar el progreso visual para mostrar actividad al usuario
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 1.5;
          if (next >= 100) {
            clearInterval(interval);
          }
          return Math.min(next, 100);
        });
      }, 300);

      // Llamar a la función de generación pasada como prop
      const videoIdResult = await onGenerate();

      // Verificar si se obtuvo un ID válido del proceso de generación
      if (videoIdResult) {
        clearInterval(interval);
        setProgress(100);
        
        // Guardar el ID en el estado local
        setVideoId(videoIdResult);
        
        // Usar un video de muestra para la vista previa
        // En una implementación real, esto se obtendría de Firebase Storage usando el videoId
        setVideoUrl("/assets/Standard_Mode_Generated_Video (2).mp4");
        setShowPreview(true);

        toast({
          title: "Video generado",
          description: "El video se ha generado exitosamente y ya está disponible para visualización",
        });
      } else {
        // Si no hay ID es porque hubo un problema en la generación
        clearInterval(interval);
        throw new Error("No se pudo completar la generación del video");
      }
    } catch (error) {
      console.error("Error generando video:", error);
      setProgress(0);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el video",
        variant: "destructive",
      });
    }
  };

  const handlePurchaseComplete = () => {
    toast({
      title: "¡Compra exitosa!",
      description: "Ya puedes ver el video completo sin limitaciones",
    });
  };

  return (
    <Card className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Video className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Generación de Video</h2>
          <p className="text-sm text-muted-foreground">
            {clips.length} clips · {duration.toFixed(2)} segundos
          </p>
        </div>
      </div>

      {!showPreview ? (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Calidad del Video</Label>
            <Select value={quality} onValueChange={setQuality}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar calidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Baja (720p)</SelectItem>
                <SelectItem value="medium">Media (1080p)</SelectItem>
                <SelectItem value="high">Alta (2K)</SelectItem>
                <SelectItem value="ultra">Ultra (4K)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Cuadros por Segundo ({fps} FPS)</Label>
            <Slider
              min={24}
              max={60}
              step={1}
              value={[fps]}
              onValueChange={([value]) => setFps(value)}
            />
          </div>

          {isGenerating && (
            <div className="space-y-2">
              <Label>Progreso</Label>
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-muted-foreground text-center">
                {progress}% completado
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2">
            <Button
              className="flex-1"
              onClick={handleGenerate}
              disabled={isGenerating || clips.length === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generando video...
                </>
              ) : (
                <>
                  <Video className="mr-2 h-4 w-4" />
                  Generar Video
                </>
              )}
            </Button>
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Detalles del proceso:</p>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>Resolución según calidad seleccionada</li>
              <li>Transiciones suaves entre clips</li>
              <li>Audio sincronizado con el video</li>
              <li>Formato MP4 optimizado para web</li>
              <li><strong>Vista previa gratuita de 10 segundos</strong></li>
              <li><strong>Opción para comprar el video completo por $199</strong></li>
            </ul>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <PremiumVideoPlayer
            videoId={videoId}
            videoUrl={videoUrl}
            title="Video Musical Generado con IA"
            isPurchased={videoPaymentStatus?.isPurchased}
            onPurchaseComplete={handlePurchaseComplete}
          />
          
          <Button
            variant="outline"
            onClick={() => setShowPreview(false)}
            className="w-full"
          >
            Volver a las opciones de generación
          </Button>
        </div>
      )}
    </Card>
  );
}
