import { useState } from "react";
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
  Download
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

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
    }
  };

  const simulateTranscription = async () => {
    setIsTranscribing(true);
    try {
      // Simulamos la transcripción
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
      // Simulamos la generación del guion
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
    // Get current timestamp in milliseconds for the timeline
    const now = Date.now();
    const items = shots.map((shot, index) => ({
      id: index + 1,
      group: 1,
      title: shot.shotType,
      start_time: now + (parseInt(shot.time) * 1000),
      end_time: now + ((parseInt(shot.time) + 5) * 1000),
      description: shot.description,
      shotType: shot.shotType,
      imagePrompt: shot.imagePrompt,
      generatedImage: `/assets/mock-shots/shot-${index + 1}.jpg` // Imágenes simuladas
    }));
    setTimelineItems(items);
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

        {/* Timeline */}
        {timelineItems.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4 text-orange-500" />
                Secuencia de Tomas
              </h3>
              <div className="space-x-2">
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
            <div className="border rounded-lg p-4">
              <Timeline
                groups={groups}
                items={timelineItems}
                defaultTimeStart={timelineItems[0]?.start_time || Date.now()}
                defaultTimeEnd={timelineItems[timelineItems.length - 1]?.end_time || Date.now() + 60000}
                canMove={false}
                canResize={false}
                itemRenderer={({ item }) => (
                  <div className="relative h-full">
                    <div className="absolute inset-0 bg-orange-500/10 rounded flex items-center justify-center text-xs p-1">
                      {item.title}
                      {item.generatedImage && (
                        <img 
                          src={item.generatedImage} 
                          alt={item.description}
                          className="absolute inset-0 w-full h-full object-cover rounded opacity-50 hover:opacity-100 transition-opacity"
                        />
                      )}
                    </div>
                  </div>
                )}
              />
            </div>
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