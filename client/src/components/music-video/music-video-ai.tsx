import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Timeline from "react-calendar-timeline";
import {
  Video,
  Upload,
  Loader2,
  Music2,
  FileText,
  Clock,
  Camera,
  Image as ImageIcon,
  Download,
  Play,
  Pause,
  ZoomIn,
  ZoomOut,
  SkipBack,
  FastForward,
  Rewind
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TimelineItem {
  id: number;
  group: number;
  title: string;
  start_time: number;
  end_time: number;
  description: string;
  shotType: string;
  imagePrompt?: string;
  generatedImage?: string;
}

const groups = [{ id: 1, title: "Secuencia de Video" }];

// Datos simulados para desarrollo
const mockVideoSequence = [
  {
    time: "0",
    description: "Plano general del artista en el escenario",
    shotType: "Wide Shot",
    imagePrompt: "Artist on stage with dramatic lighting"
  },
  {
    time: "5",
    description: "Primer plano del rostro del artista cantando",
    shotType: "Close Up",
    imagePrompt: "Close up of singer's face with emotional expression"
  },
  {
    time: "10",
    description: "Toma panorámica de la audiencia",
    shotType: "Tracking Shot",
    imagePrompt: "Crowd at concert with waving hands and phone lights"
  },
  {
    time: "15",
    description: "Plano medio del artista con banda",
    shotType: "Medium Shot",
    imagePrompt: "Band performing on stage with dynamic composition"
  }
];

export function MusicVideoAI() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingShots, setIsGeneratingShots] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [generatedScript, setGeneratedScript] = useState<string>("");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleTimeStart, setVisibleTimeStart] = useState<number>(0);
  const [visibleTimeEnd, setVisibleTimeEnd] = useState<number>(60000);
  const [hoveredShot, setHoveredShot] = useState<TimelineItem | null>(null);
  const playbackRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "Error",
          description: "El archivo debe ser menor a 10MB",
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith("audio/")) {
        toast({
          title: "Error",
          description: "Por favor sube un archivo de audio válido (MP3)",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
      setTranscription("");
      setGeneratedScript("");
      setTimelineItems([]);
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const simulateTranscription = async () => {
    setIsTranscribing(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockTranscription = `Verso 1:
En la ciudad de luces brillantes
Donde los sueños nunca duermen
Buscando un camino entre la gente
Tratando de encontrar mi suerte

Coro:
Y sigo caminando
Con el corazón latiendo
En esta noche sin fin
Buscando mi destino`;

      setTranscription(mockTranscription);
      generateVideoScript(mockTranscription);
    } catch (error) {
      console.error("Error en la transcripción:", error);
      toast({
        title: "Error",
        description: "Error al transcribir el audio. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const generateVideoScript = async (lyrics: string) => {
    setIsGeneratingScript(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const mockScript = mockVideoSequence;
      generateTimelineItems(mockScript);
      setGeneratedScript(JSON.stringify(mockScript, null, 2));
    } catch (error) {
      console.error("Error generando el guion:", error);
      toast({
        title: "Error",
        description: "Error al generar el guion. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateTimelineItems = (shots: typeof mockVideoSequence) => {
    const baseTime = Date.now();
    const items = shots.map((shot, index) => ({
      id: index + 1,
      group: 1,
      title: shot.shotType,
      start_time: baseTime + (parseInt(shot.time) * 1000),
      end_time: baseTime + ((parseInt(shot.time) + 5) * 1000),
      description: shot.description,
      shotType: shot.shotType,
      imagePrompt: shot.imagePrompt,
      generatedImage: `/assets/mock-shots/shot-${index + 1}.jpg`
    }));
    setTimelineItems(items);
    setVisibleTimeStart(baseTime);
    setVisibleTimeEnd(baseTime + 60000);
  };

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  useEffect(() => {
    if (isPlaying && timelineItems.length > 0) {
      const startTime = timelineItems[0].start_time;
      const endTime = timelineItems[timelineItems.length - 1].end_time;

      playbackRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const nextTime = prev + 100;
          if (nextTime >= endTime) {
            setIsPlaying(false);
            return startTime;
          }
          return nextTime;
        });
      }, 100);
    } else if (playbackRef.current) {
      clearInterval(playbackRef.current);
    }

    return () => {
      if (playbackRef.current) {
        clearInterval(playbackRef.current);
      }
    };
  }, [isPlaying, timelineItems]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.1));
  };

  const handleTimeChange = (visibleTimeStart: number, visibleTimeEnd: number) => {
    setVisibleTimeStart(visibleTimeStart);
    setVisibleTimeEnd(visibleTimeEnd);
  };

  const handleReset = () => {
    if (timelineItems.length > 0) {
      setCurrentTime(timelineItems[0].start_time);
      setIsPlaying(false);
    }
  };

  const handleSkipForward = () => {
    if (timelineItems.length > 0) {
      const currentIndex = timelineItems.findIndex(item => item.start_time > currentTime);
      if (currentIndex !== -1) {
        setCurrentTime(timelineItems[currentIndex].start_time);
      }
    }
  };

  const handleSkipBackward = () => {
    if (timelineItems.length > 0) {
      const currentIndex = timelineItems.findIndex(item => item.end_time > currentTime) - 1;
      if (currentIndex >= 0) {
        setCurrentTime(timelineItems[currentIndex].start_time);
      } else {
        setCurrentTime(timelineItems[0].start_time);
      }
    }
  };

  const generateShotImages = async () => {
    setIsGeneratingShots(true);
    try {
      // Simulamos la generación de imágenes
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: "Éxito",
        description: "Imágenes generadas correctamente",
      });
    } catch (error) {
      console.error("Error generando imágenes:", error);
      toast({
        title: "Error",
        description: "Error al generar las imágenes. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingShots(false);
    }
  };

  const handleExportVideo = async () => {
    setIsExporting(true);
    try {
      // Simulamos la exportación del video
      await new Promise(resolve => setTimeout(resolve, 4000));

      toast({
        title: "Éxito",
        description: "Video exportado correctamente",
      });
    } catch (error) {
      console.error("Error exportando el video:", error);
      toast({
        title: "Error",
        description: "Error al exportar el video. Por favor intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Video className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">AI Music Video Creator</h2>
          <p className="text-sm text-muted-foreground">
            Genera conceptos de video a partir de tu música
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Subida de archivo */}
        <div>
          <Label>Sube tu Canción (MP3)</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              type="file"
              accept="audio/mpeg"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Button
              onClick={simulateTranscription}
              disabled={!selectedFile || isTranscribing}
            >
              {isTranscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Music2 className="mr-2 h-4 w-4" />
                  Procesar Audio
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Transcripción */}
        {transcription && (
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Music2 className="h-4 w-4 text-orange-500" />
              Letra Transcrita
            </h3>
            <ScrollArea className="h-[200px] w-full rounded-md border p-4">
              <p className="text-sm whitespace-pre-wrap">{transcription}</p>
            </ScrollArea>
          </div>
        )}

        {/* Timeline Controls */}
        {timelineItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Secuencia de Tomas
              </h3>
              <div className="space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomOut}
                  className="px-2"
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleZoomIn}
                  className="px-2"
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleReset}
                  className="px-2"
                >
                  <SkipBack className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipBackward}
                  className="px-2"
                >
                  <Rewind className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={togglePlayback}
                  className="px-2"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSkipForward}
                  className="px-2"
                >
                  <FastForward className="h-4 w-4" />
                </Button>
                <Button
                  onClick={generateShotImages}
                  disabled={isGeneratingShots}
                  variant="outline"
                  size="sm"
                >
                  {isGeneratingShots ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generando Imágenes...
                    </>
                  ) : (
                    <>
                      <ImageIcon className="mr-2 h-4 w-4" />
                      Generar Imágenes
                    </>
                  )}
                </Button>
                <Button
                  onClick={handleExportVideo}
                  disabled={isExporting}
                  variant="outline"
                  size="sm"
                >
                  {isExporting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <Download className="mr-2 h-4 w-4" />
                      Exportar Video
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Timeline */}
            <div className="border rounded-lg p-4 relative">
              <Timeline
                groups={groups}
                items={timelineItems}
                defaultTimeStart={visibleTimeStart}
                defaultTimeEnd={visibleTimeEnd}
                visibleTimeStart={visibleTimeStart}
                visibleTimeEnd={visibleTimeEnd}
                onTimeChange={handleTimeChange}
                canMove={false}
                canResize={false}
                stackItems
                itemHeightRatio={0.8}
                itemRenderer={({ item }) => (
                  <div 
                    className="relative h-full cursor-pointer group"
                    onMouseEnter={() => setHoveredShot(item)}
                    onMouseLeave={() => setHoveredShot(null)}
                  >
                    <div className={cn(
                      "absolute inset-0 bg-orange-500/10 rounded flex items-center justify-center text-xs p-1 transition-all",
                      currentTime >= item.start_time && currentTime < item.end_time ? "ring-2 ring-orange-500" : ""
                    )}>
                      <span className="z-10 font-medium text-foreground/80">{item.title}</span>
                      {item.generatedImage && (
                        <img 
                          src={item.generatedImage} 
                          alt={item.description}
                          className="absolute inset-0 w-full h-full object-cover rounded opacity-50 group-hover:opacity-100 transition-opacity"
                        />
                      )}
                    </div>
                  </div>
                )}
              />

              {/* Current time indicator */}
              <div
                className="absolute top-0 bottom-0 w-px bg-orange-500 z-50 pointer-events-none"
                style={{
                  left: `${((currentTime - visibleTimeStart) / (visibleTimeEnd - visibleTimeStart)) * 100}%`,
                  display: timelineItems.length > 0 ? 'block' : 'none'
                }}
              />
            </div>

            {/* Shot Preview */}
            {hoveredShot && (
              <div className="fixed bottom-4 right-4 max-w-sm bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-4 z-50">
                <div className="aspect-video relative rounded-lg overflow-hidden mb-3">
                  {hoveredShot.generatedImage && (
                    <img
                      src={hoveredShot.generatedImage}
                      alt={hoveredShot.description}
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <h4 className="font-medium mb-1">{hoveredShot.shotType}</h4>
                <p className="text-sm text-muted-foreground">{hoveredShot.description}</p>
              </div>
            )}
          </div>
        )}

        {/* Loading States */}
        {(isGeneratingScript || isTranscribing) && !timelineItems.length && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
          </div>
        )}
      </div>
    </Card>
  );
}