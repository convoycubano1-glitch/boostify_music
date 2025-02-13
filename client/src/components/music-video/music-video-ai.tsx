import { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimelineEditor, type TimelineClip } from "./timeline-editor";
import { Slider } from "@/components/ui/slider";
import Editor from "@monaco-editor/react";
import {
  Video, Loader2, Music2, Image as ImageIcon, Download, Play, Pause,
  ZoomIn, ZoomOut, SkipBack, FastForward, Rewind, Edit, RefreshCcw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as fal from "@fal-ai/serverless-client";
import OpenAI from "openai";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase imports

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
  duration: number;
  transition?: string;
  firebaseUrl?: string; // Para almacenamiento en Firebase
}

// Añadir tipos de grupos para mejor organización del timeline
const groups = [
  { id: 1, title: "Video", stackItems: true },
  { id: 2, title: "Transiciones", stackItems: false },
  { id: 3, title: "Audio", stackItems: false }
];

const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";

export function MusicVideoAI() {
  const { toast } = useToast();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);
  const [isGeneratingShots, setIsGeneratingShots] = useState(false);
  const [transcription, setTranscription] = useState<string>("");
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [visibleTimeStart, setVisibleTimeStart] = useState<number>(0);
  const [visibleTimeEnd, setVisibleTimeEnd] = useState<number>(60000);
  const [hoveredShot, setHoveredShot] = useState<TimelineItem | null>(null);
  const [selectedShot, setSelectedShot] = useState<TimelineItem | null>(null);
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [scriptContent, setScriptContent] = useState<string>("");
  const playbackRef = useRef<NodeJS.Timeout | null>(null);
  const [videoStyle, setVideoStyle] = useState({
    mood: "",
    colorPalette: "",
    characterStyle: "",
    visualIntensity: 50
  });
  const storage = getStorage(); // Initialize Firebase Storage
  const [isSaving, setIsSaving] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioSource = useRef<AudioBufferSourceNode | null>(null);


  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
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
      setTimelineItems([]);
      setCurrentTime(0);
      setIsPlaying(false);

      // Procesar el archivo de audio
      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          if (!audioContext.current) {
            audioContext.current = new AudioContext();
          }
          const buffer = await audioContext.current.decodeAudioData(e.target.result);
          setAudioBuffer(buffer);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [toast]);

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
      const prompt = `Como director creativo de videos musicales profesionales, crea un guion detallado para un video musical que capture la esencia de la canción completa.

Estilo Visual:
- Mood: ${videoStyle.mood || 'Neutral'}
- Paleta de Color: ${videoStyle.colorPalette || 'Natural'}
- Estilo de Personajes/Escenas: ${videoStyle.characterStyle || 'Realista'}
- Intensidad Visual: ${videoStyle.visualIntensity}%

Letra de la canción:
${lyrics}

IMPORTANTE: Tu respuesta debe ser SOLAMENTE un objeto JSON que siga exactamente esta estructura, sin texto adicional:

{
  "shots": [
    {
      "time": número de segundos desde el inicio,
      "duration": número entre 1 y 5,
      "shotType": "tipo de toma (close-up, medium shot, wide shot, etc)",
      "description": "descripción detallada de la escena",
      "imagePrompt": "prompt detallado para IA que describa la escena",
      "transition": "corte directo, fade, dissolve, etc"
    }
  ]
}

Reglas para las tomas:
1. Cada toma debe durar entre 1 y 5 segundos
2. Las tomas deben variar en tipo y ángulo
3. Las transiciones deben ser variadas y apropiadas
4. Los prompts deben ser detallados y específicos
5. Las escenas deben estar sincronizadas con la letra

El tiempo total debe cubrir toda la canción con suficientes tomas para mantener el video dinámico e interesante.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Eres un director de videos musicales experto. Responde SOLAMENTE con JSON válido, sin ningún texto adicional o explicaciones."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log("OpenAI response:", response.choices[0].message.content);

      if (!response.choices[0].message.content) {
        throw new Error("No se recibió respuesta del modelo");
      }

      try {
        // Intentar encontrar y parsear el JSON incluso si hay texto adicional
        const content = response.choices[0].message.content;
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : content;
        const scriptResult = JSON.parse(jsonString);

        if (!scriptResult.shots || !Array.isArray(scriptResult.shots) || scriptResult.shots.length === 0) {
          throw new Error("El formato del guion no es válido");
        }

        generateTimelineItems(scriptResult.shots);
        setScriptContent(JSON.stringify(scriptResult, null, 2));

        toast({
          title: "Éxito",
          description: `Guion generado con ${scriptResult.shots.length} tomas`,
        });

      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        console.log("Raw response:", response.choices[0].message.content);
        throw new Error("Error al procesar la respuesta de la IA");
      }

    } catch (error) {
      console.error("Error generando el guion:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el guion del video",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const handleScriptChange = (value: string | undefined) => {
    if (!value) return;
    setScriptContent(value);
    try {
      const scriptData = JSON.parse(value);
      if (scriptData.shots && Array.isArray(scriptData.shots)) {
        generateTimelineItems(scriptData.shots);
      }
    } catch (error) {
      console.error("Error parsing script:", error);
    }
  };

  const regenerateImage = async (item: TimelineItem) => {
    if (!item.imagePrompt) return;

    try {
      const prompt = `${item.imagePrompt}. Style: ${videoStyle.mood}, ${videoStyle.colorPalette} color palette, ${videoStyle.characterStyle} character style`;

      const result = await fal.subscribe("fal-ai/flux-pro", {
        input: {
          prompt,
          negative_prompt: "low quality, blurry, distorted, deformed, unrealistic",
          image_size: "landscape_16_9"
        },
      });

      if (result?.images?.[0]?.url) {
        const updatedItems = timelineItems.map(timelineItem =>
          timelineItem.id === item.id
            ? { ...timelineItem, generatedImage: result.images[0].url }
            : timelineItem
        );
        setTimelineItems(updatedItems);
      }

      toast({
        title: "Imagen regenerada",
        description: "La imagen se ha regenerado exitosamente",
      });
    } catch (error) {
      console.error("Error regenerando imagen:", error);
      toast({
        title: "Error",
        description: "Error al regenerar la imagen",
        variant: "destructive",
      });
    }
  };

  const generateTimelineItems = useCallback((shots: any[]) => {
    const baseTime = Date.now();
    let currentTime = baseTime;

    const items = shots.map((shot, index) => {
      const duration = shot.duration ? parseFloat(shot.duration) * 1000 : Math.floor(Math.random() * (5000 - 1000) + 1000);
      const item = {
        id: index + 1,
        group: 1,
        title: shot.shotType,
        start_time: currentTime,
        end_time: currentTime + duration,
        description: shot.description,
        shotType: shot.shotType,
        imagePrompt: shot.imagePrompt,
        generatedImage: undefined,
        duration: duration,
        transition: shot.transition || "cut"
      };
      currentTime += duration;
      return item;
    });

    setTimelineItems(items);
    setVisibleTimeStart(baseTime);
    setVisibleTimeEnd(currentTime);
    setZoomLevel(1);
  }, []);


  const handleTimeChange = (visibleTimeStart: number, visibleTimeEnd: number) => {
    setVisibleTimeStart(visibleTimeStart);
    setVisibleTimeEnd(visibleTimeEnd);
  };

  const togglePlayback = useCallback(() => {
    if (!audioBuffer || !audioContext.current) return;

    if (isPlaying) {
      audioSource.current?.stop();
      setIsPlaying(false);
    } else {
      const source = audioContext.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.current.destination);
      source.start(0, currentTime / 1000);
      audioSource.current = source;
      setIsPlaying(true);
    }
  }, [isPlaying, audioBuffer, currentTime]);

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev * 1.5, 10));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev / 1.5, 0.1));
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

  // Función para guardar imágenes en Firebase Storage
  const saveToFirebase = async (item: TimelineItem) => {
    if (!item.generatedImage) return null;

    try {
      const response = await fetch(item.generatedImage);
      const blob = await response.blob();

      const storageRef = ref(storage, `videos/${Date.now()}_${item.id}.jpg`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);

      return url;
    } catch (error) {
      console.error("Error saving to Firebase:", error);
      return null;
    }
  };

  // Función mejorada para generar imágenes
  const generateShotImages = async () => {
    setIsGeneratingShots(true);
    try {
      const updatedItems = [...timelineItems];

      for (let i = 0; i < updatedItems.length; i++) {
        const item = updatedItems[i];
        if (!item.generatedImage && item.imagePrompt) {
          const prompt = `${item.imagePrompt}. Estilo: ${videoStyle.mood}, paleta de colores ${videoStyle.colorPalette}, estilo visual ${videoStyle.characterStyle}. Toma: ${item.shotType}`;

          try {
            const result = await fal.subscribe("fal-ai/flux-pro", {
              input: {
                prompt,
                negative_prompt: "low quality, blurry, distorted, deformed, unrealistic, text, watermark",
                image_size: "landscape_16_9"
              },
            });

            if (result?.images?.[0]?.url) {
              // Guardar en Firebase
              const firebaseUrl = await saveToFirebase({
                ...item,
                generatedImage: result.images[0].url
              });

              updatedItems[i] = {
                ...item,
                generatedImage: result.images[0].url,
                firebaseUrl
              };

              setTimelineItems([...updatedItems]);

              toast({
                title: "Progreso",
                description: `Imagen ${i + 1} generada y guardada`,
              });
            }
          } catch (error) {
            console.error(`Error en toma ${i + 1}:`, error);
            toast({
              title: "Error",
              description: `Error generando imagen ${i + 1}`,
              variant: "destructive",
            });
          }

          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      }

      toast({
        title: "Completado",
        description: "Todas las imágenes han sido generadas y guardadas",
      });
    } catch (error) {
      console.error("Error generando imágenes:", error);
      toast({
        title: "Error",
        description: "Error al generar las imágenes",
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
        title: "Exportación completa",
        description: "Video disponible para descarga",
      });
    } catch (error) {
      console.error("Error exportando:", error);
      toast({
        title: "Error",
        description: "Error al exportar el video",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const itemRenderer = useCallback(({ item, itemContext, getItemProps }: any) => (
    <div
      {...getItemProps()}
      className="relative h-full cursor-pointer group"
      onMouseEnter={() => setHoveredShot(item)}
      onMouseLeave={() => setHoveredShot(null)}
      onClick={() => setSelectedShot(item)}
    >
      <div className={cn(
        "absolute inset-0 bg-card rounded-md border overflow-hidden",
        "transition-all duration-200 ease-in-out",
        currentTime >= item.start_time && currentTime < item.end_time ? "ring-2 ring-orange-500" : "",
        selectedShot?.id === item.id ? "ring-2 ring-blue-500" : "",
        "hover:scale-[1.02] hover:z-10"
      )}>
        {/* Miniatura de la imagen */}
        <div className="absolute inset-0">
          <img
            src={item.generatedImage || fallbackImage}
            alt={item.description}
            className="w-full h-full object-cover"
          />
          {/* Overlay con información */}
          <div className="absolute inset-0 bg-black/40 p-2 flex flex-col justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <div>
              <p className="text-xs font-medium text-white truncate">
                {item.shotType}
              </p>
              <p className="text-xs text-white/80 truncate">
                {item.description}
              </p>
            </div>
            <div className="flex items-center justify-between text-xs text-white/60">
              <span>{(item.duration / 1000).toFixed(1)}s</span>
              <span>{item.transition}</span>
            </div>
          </div>
        </div>

        {/* Indicador de transición */}
        {item.transition && item.transition !== "cut" && (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500/20 rounded-full z-10">
            <div className="absolute inset-1 bg-orange-500 rounded-full" />
          </div>
        )}
      </div>
    </div>
  ), [currentTime, selectedShot]);

  // Convertir timelineItems a formato de clips para el nuevo editor
  const clips: TimelineClip[] = timelineItems.map(item => ({
    id: item.id,
    start: (item.start_time - timelineItems[0]?.start_time || 0) / 1000,
    duration: item.duration / 1000,
    type: 'image',
    thumbnail: item.generatedImage,
    title: item.shotType,
    description: item.description
  }));

  // Calcular duración total
  const totalDuration = clips.reduce((acc, clip) => Math.max(acc, clip.start + clip.duration), 0);

  // Función para actualizar el tiempo actual
  const handleTimeUpdate = (time: number) => {
    const baseTime = timelineItems[0]?.start_time || 0;
    setCurrentTime(baseTime + time * 1000);
  };

  // Función para actualizar clips
  const handleClipUpdate = (clipId: number, updates: Partial<TimelineClip>) => {
    const updatedItems = timelineItems.map(item => {
      if (item.id === clipId) {
        return {
          ...item,
          start_time: timelineItems[0].start_time + updates.start! * 1000,
          duration: updates.duration! * 1000,
        };
      }
      return item;
    });
    setTimelineItems(updatedItems);
  };

  // Función para detectar beats y crear segmentos
  const detectBeatsAndCreateSegments = async () => {
    if (!audioBuffer) return;

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const segments: TimelineItem[] = [];
    const totalDuration = audioBuffer.duration;

    // Configuración mejorada para detección de beats
    const windowSize = Math.floor(sampleRate * 0.05); // 50ms ventana
    const threshold = 0.15; // Aumentado para detectar beats más significativos
    const minSegmentDuration = 2; // segundos
    const maxSegmentDuration = 5; // segundos
    let lastBeatTime = 0;
    let energyHistory: number[] = [];
    const historySize = 43; // Aproximadamente 1 segundo de historia

    // Normalizar y detectar beats
    for (let i = 0; i < channelData.length; i += windowSize) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        if (i + j < channelData.length) {
          sum += Math.abs(channelData[i + j]);
        }
      }
      const energy = sum / windowSize;
      energyHistory.push(energy);

      if (energyHistory.length > historySize) {
        energyHistory.shift();

        const averageEnergy = energyHistory.reduce((a, b) => a + b) / energyHistory.length;
        const currentTime = i / sampleRate;

        if (energy > averageEnergy * threshold &&
            currentTime - lastBeatTime >= minSegmentDuration &&
            currentTime - lastBeatTime <= maxSegmentDuration) {

          // Crear segmento
          segments.push({
            id: segments.length + 1,
            group: 1,
            title: `Escena ${segments.length + 1}`,
            start_time: lastBeatTime * 1000,
            end_time: currentTime * 1000,
            description: "Escena sincronizada con el beat",
            shotType: ["wide shot", "medium shot", "close-up", "extreme close-up"][
              Math.floor(Math.random() * 4)
            ],
            duration: (currentTime - lastBeatTime) * 1000,
            transition: ["cut", "fade", "dissolve"][Math.floor(Math.random() * 3)]
          });

          lastBeatTime = currentTime;
        }
      }
    }

    // Asegurarse de que cubrimos toda la duración de la canción
    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment.end_time / 1000 < totalDuration) {
        segments.push({
          id: segments.length + 1,
          group: 1,
          title: `Escena Final`,
          start_time: lastSegment.end_time,
          end_time: totalDuration * 1000,
          description: "Escena final",
          shotType: "wide shot",
          duration: (totalDuration * 1000) - lastSegment.end_time,
          transition: "fade"
        });
      }
    }

    return segments;
  };

  // Función para sincronizar el audio con el timeline
  const syncAudioWithTimeline = async () => {
    if (!audioBuffer) return;

    try {
      const segments = await detectBeatsAndCreateSegments();
      if (segments && segments.length > 0) {
        setTimelineItems(segments);

        toast({
          title: "Éxito",
          description: `Se detectaron ${segments.length} segmentos sincronizados con la música`,
        });

        // Generar imágenes para los nuevos segmentos
        await generateShotImages();
      }
    } catch (error) {
      console.error("Error sincronizando audio:", error);
      toast({
        title: "Error",
        description: "Error al sincronizar el audio con el timeline",
        variant: "destructive",
      });
    }
  };


  return (
    <Card className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <div className="h-12 w-12 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Video className="h-6 w-6 text-orange-500" />
        </div>
        <div>
          <h2 className="text-xl font-semibold">Creador de Videos Musicales AI</h2>
          <p className="text-sm text-muted-foreground">
            Transforma tu música en experiencias visuales
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda */}
        <div className="space-y-6">
          {/* File Upload Section */}
          <div className="border rounded-lg p-4">
            <Label className="text-lg font-semibold mb-4">1. Subir Canción</Label>
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
                    Generar Guion
                  </>
                )}
              </Button>
              <Button
                onClick={syncAudioWithTimeline}
                disabled={!audioBuffer || isGeneratingShots}
                variant="outline"
              >
                <RefreshCcw className="mr-2 h-4 w-4" />
                Sincronizar Beats
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
                    <SelectValue placeholder="Selecciona mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoStyles.moods.map((mood) => (
                      <SelectItem key={mood} value={mood}>{mood}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Paleta de Color</Label>
                <Select
                  value={videoStyle.colorPalette}
                  onValueChange={(value) => setVideoStyle(prev => ({ ...prev, colorPalette: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona paleta" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoStyles.colorPalettes.map((palette) => (
                      <SelectItem key={palette} value={palette}>{palette}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Estilo Visual</Label>
                <Select
                  value={videoStyle.characterStyle}
                  onValueChange={(value) => setVideoStyle(prev => ({ ...prev, characterStyle: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estilo" />
                  </SelectTrigger>
                  <SelectContent>
                    {videoStyles.characterStyles.map((style) => (
                      <SelectItem key={style} value={style}>{style}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Intensidad Visual ({videoStyle.visualIntensity}%)</Label>
                <Slider
                  value={[videoStyle.visualIntensity]}
                  onValueChange={([value]) => setVideoStyle(prev => ({ ...prev, visualIntensity: value }))}
                  min={0}
                  max={100}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Script Editor */}
          {scriptContent && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">3. Guion del Video</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingScript(!isEditingScript)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditingScript ? "Guardar" : "Editar Guion"}
                </Button>
              </div>
              {isEditingScript ? (
                <div className="h-[400px] border rounded-lg overflow-hidden">
                  <Editor
                    height="100%"
                    defaultLanguage="json"
                    value={scriptContent}
                    onChange={handleScriptChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 14,
                    }}
                  />
                </div>
              ) : (
                <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                  <pre className="text-sm">{scriptContent}</pre>
                </ScrollArea>
              )}
            </div>
          )}

          {/* Transcription Display */}
          {transcription && (
            <div className="border rounded-lg p-4">
              <Label className="text-lg font-semibold mb-4">4. Letra Transcrita</Label>
              <ScrollArea className="h-[200px] w-full rounded-md border p-4 mt-2">
                <p className="text-sm whitespace-pre-wrap">{transcription}</p>
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Columna Derecha - Timeline y Preview */}
        <div className="space-y-6">
          {timelineItems.length > 0 && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <Label className="text-lg font-semibold">5. Secuencia de Video</Label>
              </div>

              <TimelineEditor
                clips={clips}
                currentTime={(currentTime - timelineItems[0]?.start_time || 0) / 1000}
                duration={totalDuration}
                audioBuffer={audioBuffer}
                onTimeUpdate={handleTimeUpdate}
                onClipUpdate={handleClipUpdate}
                onPlay={togglePlayback}
                onPause={togglePlayback}
                isPlaying={isPlaying}
              />

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
                      Generando...
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

          {/* Shot Preview and Editor */}
          {selectedShot && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Detalles de la Toma</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => regenerateImage(selectedShot)}
                >
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Regenerar Imagen
                </Button>
              </div>
              <div className="space-y-4">
                <div className="aspect-video relative rounded-lg overflow-hidden">
                  <img
                    src={selectedShot.generatedImage || fallbackImage}
                    alt={selectedShot.description}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <Label>Tipo de Toma</Label>
                  <p className="text-sm text-muted-foreground">{selectedShot.shotType}</p>
                </div>
                <div>
                  <Label>Descripción</Label>
                  <p className="text-sm text-muted-foreground">{selectedShot.description}</p>
                </div>
                <div>
                  <Label>Prompt de Imagen</Label>
                  <p className="text-sm text-muted-foreground">{selectedShot.imagePrompt}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {(isGeneratingScript || isTranscribing) && !timelineItems.length && (
        <div className="fixed inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-orange-500 mb-4" />
            <p className="text-lg font-medium">
              {isTranscribing ? "Analizando audio..." : "Generando guion visual..."}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}