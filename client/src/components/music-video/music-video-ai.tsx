import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Timeline from "react-calendar-timeline";
import { Slider } from "@/components/ui/slider";
import {
  Video, Upload, Loader2, Music2, FileText, Clock, Camera,
  Image as ImageIcon, Download, Play, Pause, ZoomIn, ZoomOut,
  SkipBack, FastForward, Rewind, Palette
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as fal from "@fal-ai/serverless-client";
import OpenAI from "openai";

// OpenAI configuration
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Fal.ai configuration
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

const videoStyles = {
  moods: [
    "Energético", "Melancólico", "Romántico", "Dramático",
    "Misterioso", "Alegre", "Épico", "Minimalista"
  ],
  colorPalettes: [
    "Vibrante", "Monocromático", "Pastel", "Oscuro y Contrastado",
    "Cálido", "Frío", "Retro", "Neón"
  ],
  characterStyles: [
    "Realista", "Estilizado", "Artístico", "Abstracto",
    "Cinematográfico", "Documental", "Surrealista", "Vintage"
  ]
};

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
  const [videoStyle, setVideoStyle] = useState({
    mood: "",
    colorPalette: "",
    characterStyle: "",
    visualIntensity: 50
  });

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

  const transcribeAudio = async () => {
    if (!selectedFile) return;

    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('model', 'whisper-1');

      const transcription = await openai.audio.transcriptions.create({
        file: selectedFile,
        model: "whisper-1",
      });

      if (transcription.text) {
        setTranscription(transcription.text);

        const formattedResponse = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Format the given text as song lyrics, identifying verses, chorus, and bridges. Keep the original words but add structure."
            },
            {
              role: "user",
              content: transcription.text
            }
          ]
        });

        const formattedLyrics = formattedResponse.choices[0].message.content;
        setTranscription(formattedLyrics || transcription.text);
        generateVideoScript(formattedLyrics || transcription.text);
      }

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
      const prompt = `Como director creativo de videos musicales, crea un guion detallado para un video musical basado en la siguiente letra y especificaciones de estilo. 
      
Estilo Visual:
- Mood: ${videoStyle.mood}
- Paleta de Color: ${videoStyle.colorPalette}
- Estilo de Personajes/Escenas: ${videoStyle.characterStyle}
- Intensidad Visual: ${videoStyle.visualIntensity}%

Letra de la canción:
${lyrics}

Genera 5 escenas clave que capturen los momentos más impactantes de la canción. Para cada escena, incluye:
1. Tiempo exacto en segundos
2. Descripción detallada de la acción y elementos visuales
3. Tipo de toma (ej: Close-up, Wide Shot, Tracking Shot, etc.)
4. Un prompt detallado para IA de generación de imágenes que capture la esencia de la escena

Para cada prompt de imagen, incorpora:
- El estilo visual especificado (mood, paleta de color, estilo)
- Elementos específicos a incluir
- Dirección de arte y composición
- Iluminación y atmosfera
- Referencias a la letra en ese momento

Estructura cada escena en formato JSON como:
{
  "shots": [
    {
      "time": "segundos desde el inicio",
      "description": "descripción detallada de la escena",
      "shotType": "tipo de toma cinematográfica",
      "imagePrompt": "prompt detallado para IA"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Eres un director de videos musicales experto. Tus guiones deben ser creativos y cohesivos, asegurando que cada escena fluya naturalmente a la siguiente mientras mantiene el estilo visual especificado."
          },
          { role: "user", content: prompt }
        ]
      });

      if (response.choices[0].message.content) {
        try {
          const scriptResult = JSON.parse(response.choices[0].message.content);
          if (scriptResult.shots && Array.isArray(scriptResult.shots)) {
            generateTimelineItems(scriptResult.shots);
            setGeneratedScript(JSON.stringify(scriptResult, null, 2));
          }
        } catch (parseError) {
          const jsonMatch = response.choices[0].message.content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            const scriptResult = JSON.parse(jsonMatch[0]);
            if (scriptResult.shots && Array.isArray(scriptResult.shots)) {
              generateTimelineItems(scriptResult.shots);
              setGeneratedScript(JSON.stringify(scriptResult, null, 2));
            }
          } else {
            console.error("Error parsing JSON:", parseError);
            toast({
              title: "Error",
              description: "Error al procesar la respuesta de la IA. Intenta de nuevo.",
              variant: "destructive"
            })
          }
        }
      }
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

  const generateTimelineItems = (shots: { time: string; description: string; shotType: string; imagePrompt: string; }[]) => {
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
      generatedImage: undefined
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
      const updatedItems = [...timelineItems];

      const itemsToGenerate = updatedItems.slice(0, 5);

      for (let i = 0; i < itemsToGenerate.length; i++) {
        const item = itemsToGenerate[i];
        if (!item.generatedImage && item.imagePrompt) {
          const prompt = `${item.imagePrompt}. Style: ${videoStyle.mood}, ${videoStyle.colorPalette} color palette, ${videoStyle.characterStyle} character style`;

          const result = await fal.subscribe("fal-ai/flux-pro", {
            input: {
              prompt,
              negative_prompt: "low quality, blurry, distorted, deformed, unrealistic",
              image_size: "landscape_16_9"
            },
          });

          if (result?.images?.[0]?.url) {
            updatedItems[i] = {
              ...item,
              generatedImage: result.images[0].url
            };
            setTimelineItems([...updatedItems]);
          }

          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Input and Settings */}
        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="border rounded-lg p-4">
            <Label className="text-lg font-semibold mb-4">1. Sube tu Canción</Label>
            <div className="flex items-center gap-2 mt-2">
              <Input
                type="file"
                accept="audio/mpeg"
                onChange={handleFileChange}
                className="flex-1"
              />
              <Button
                onClick={transcribeAudio}
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

          {/* Video Style Settings */}
          <div className="border rounded-lg p-4">
            <Label className="text-lg font-semibold mb-4">2. Estilo del Video</Label>
            <div className="grid gap-4">
              <div>
                <Label>Mood</Label>
                <Select
                  value={videoStyle.mood}
                  onValueChange={(value) => setVideoStyle(prev => ({ ...prev, mood: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoStyles.moods.map((mood) => (
                      <SelectItem key={mood} value={mood}>
                        {mood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Paleta de Colores</Label>
                <Select
                  value={videoStyle.colorPalette}
                  onValueChange={(value) => setVideoStyle(prev => ({ ...prev, colorPalette: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona la paleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoStyles.colorPalettes.map((palette) => (
                      <SelectItem key={palette} value={palette}>
                        {palette}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Estilo de Personajes</Label>
                <Select
                  value={videoStyle.characterStyle}
                  onValueChange={(value) => setVideoStyle(prev => ({ ...prev, characterStyle: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona el estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoStyles.characterStyles.map((style) => (
                      <SelectItem key={style} value={style}>
                        {style}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Intensidad Visual</Label>
                <div className="pt-2">
                  <Slider
                    value={[videoStyle.visualIntensity]}
                    onValueChange={([value]) => setVideoStyle(prev => ({ ...prev, visualIntensity: value }))}
                    min={0}
                    max={100}
                    step={1}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Transcription Display */}
          {transcription && (
            <div className="border rounded-lg p-4">
              <Label className="text-lg font-semibold mb-4">3. Letra Transcrita</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 mt-2">
                <p className="text-sm whitespace-pre-wrap">{transcription}</p>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Right Column - Timeline and Preview */}
        <div className="space-y-6">
          {timelineItems.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">4. Secuencia de Video</Label>
                <div className="flex items-center gap-2">
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
                </div>
              </div>

              {/* Playback Controls */}
              <div className="flex items-center justify-center gap-2 mb-4">
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
              </div>

              {/* Timeline */}
              <div className="relative">
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

                <div
                  className="absolute top-0 bottom-0 w-px bg-orange-500 z-50 pointer-events-none"
                  style={{
                    left: `${((currentTime - visibleTimeStart) / (visibleTimeEnd - visibleTimeStart)) * 100}%`,
                    display: timelineItems.length > 0 ? 'block' : 'none'
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 mt-4">
                <Button
                  onClick={generateShotImages}
                  disabled={isGeneratingShots}
                  variant="outline"
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
                  variant="default"
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
          )}

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
      </div>

      {(isGeneratingScript || isTranscribing) && !timelineItems.length && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-orange-500" />
        </div>
      )}
    </Card>
  );
}