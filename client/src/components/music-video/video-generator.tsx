import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Progress } from "@/components/ui/progress";
import { Download, Video, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { TimelineClip } from "./timeline-editor";

interface VideoGeneratorProps {
  clips: TimelineClip[];
  duration: number;
  isGenerating: boolean;
  onGenerate: () => Promise<void>;
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

  const handleGenerate = async () => {
    try {
      setProgress(0);
      setVideoUrl("");
      
      // Simular progreso (esto se reemplazará con la API real)
      const interval = setInterval(() => {
        setProgress(prev => {
          const next = prev + 5;
          if (next >= 100) {
            clearInterval(interval);
          }
          return Math.min(next, 100);
        });
      }, 500);

      await onGenerate();

      // Esto se reemplazará con la URL real del video
      setVideoUrl("video_url_here");

      toast({
        title: "Video generado",
        description: "El video se ha generado exitosamente",
      });
    } catch (error) {
      console.error("Error generando video:", error);
      toast({
        title: "Error",
        description: "Error al generar el video",
        variant: "destructive",
      });
    }
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

          {videoUrl && (
            <Button
              variant="outline"
              onClick={() => window.open(videoUrl, "_blank")}
              className="flex-1"
            >
              <Download className="mr-2 h-4 w-4" />
              Descargar Video
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Detalles del proceso:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Resolución según calidad seleccionada</li>
            <li>Transiciones suaves entre clips</li>
            <li>Audio sincronizado con el video</li>
            <li>Formato MP4 optimizado para web</li>
          </ul>
        </div>
      </div>
    </Card>
  );
}
