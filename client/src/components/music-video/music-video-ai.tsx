import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimelineEditor, type TimelineClip } from "./timeline-editor";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import Editor from "@monaco-editor/react";
import {
  Video, Loader2, Music2, Image as ImageIcon, Download, Play, Pause,
  ZoomIn, ZoomOut, SkipBack, FastForward, Rewind, Edit, RefreshCcw, Plus, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as fal from "@fal-ai/serverless-client";
import OpenAI from "openai";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase";
import { AnalyticsDashboard } from './analytics-dashboard';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VideoGenerator } from "./video-generator";
import { ArtistCustomization } from "./artist-customization";
import { MusicianIntegration } from "./musician-integration";
import { MovementIntegration } from "./movement-integration";
import { LipSyncIntegration } from "./lip-sync-integration";
import { ProgressSteps } from "./progress-steps";
import { generateVideoScript, analyzeImage, generateVideoPromptWithRetry } from "@/lib/api/openrouter";

// OpenAI configuration for audio transcription only
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true
});

// Add check for debugging
console.log("OpenAI API Key available:", !!import.meta.env.VITE_OPENAI_API_KEY);

if (!import.meta.env.VITE_OPENAI_API_KEY) {
  console.error('OpenAI API key is not configured');
}

// Fal.ai configuration
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY,
});

async function transcribeAudio(file: File) {
  if (!import.meta.env.VITE_OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const transcription = await openai.audio.transcriptions.create({
      file: file,
      model: "whisper-1",
    });

    return transcription.text;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

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
  ],
  cameraFormats: [
    {
      name: "35mm Estándar",
      description: "El formato clásico del cine, ofrece una imagen natural y cinematográfica"
    },
    {
      name: "IMAX",
      description: "Alto detalle y amplitud visual, ideal para escenas épicas"
    },
    {
      name: "Super 8mm",
      description: "Look vintage y granulado, perfecto para escenas nostálgicas"
    },
    {
      name: "Anamórfico",
      description: "Formato panorámico con característicos lens flares"
    },
    {
      name: "PANAVISION",
      description: "Cinematográfico de alta gama con bokeh distintivo"
    },
    {
      name: "Digital RAW",
      description: "Look moderno y nítido con alto rango dinámico"
    }
  ]
};

const editingStyles = [
  {
    id: "phrases",
    name: "Edición por Frases",
    description: "Cortes sincronizados con las frases musicales",
    duration: { min: 4, max: 8 }
  },
  {
    id: "random_bars",
    name: "Compases Aleatorios",
    description: "Cortes variados siguiendo el ritmo",
    duration: { min: 2, max: 6 }
  },
  {
    id: "dynamic",
    name: "Dinámico",
    description: "Cortes rápidos en momentos intensos, más lentos en partes suaves",
    duration: { min: 1.5, max: 4 }
  },
  {
    id: "slow",
    name: "Lento",
    description: "Cortes largos y suaves transiciones",
    duration: { min: 5, max: 10 }
  },
  {
    id: "cinematic",
    name: "Cinematográfico",
    description: "Estilo de película con variedad de duraciones",
    duration: { min: 3, max: 8 }
  },
  {
    id: "music_video",
    name: "Video Musical",
    description: "Estilo MTV con cortes rápidos y dinámicos",
    duration: { min: 1, max: 3 }
  },
  {
    id: "narrative",
    name: "Narrativo",
    description: "Cortes que siguen la historia de la letra",
    duration: { min: 4, max: 7 }
  },
  {
    id: "experimental",
    name: "Experimental",
    description: "Patrones de corte no convencionales",
    duration: { min: 1, max: 6 }
  },
  {
    id: "rhythmic",
    name: "Rítmico",
    description: "Cortes precisos en cada beat",
    duration: { min: 1, max: 2 }
  },
  {
    id: "minimalist",
    name: "Minimalista",
    description: "Pocos cortes, transiciones suaves",
    duration: { min: 6, max: 12 }
  }
];

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
  mood?: string;
  firebaseUrl?: string;
  // Campos adicionales para compatibilidad con TimelineClip
  start: number;
  type: 'video' | 'image' | 'transition' | 'audio';
  thumbnail?: string; // Usaremos generatedImage o firebaseUrl para esto
}

const groups = [
  { id: 1, title: "Video", stackItems: true },
  { id: 2, title: "Transiciones", stackItems: false },
  { id: 3, title: "Audio", stackItems: false }
];

const fallbackImage = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'/%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'/%3E%3Cpolyline points='21 15 16 10 5 21'/%3E%3C/svg%3E";

interface Director {
  id: string;
  name: string;
  specialty: string;
  style: string;
  experience: string;
  rating: number;
  imageUrl?: string;
}

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
    visualIntensity: 50,
    cameraFormat: "",
    narrativeIntensity: 50,
    referenceImage: null as string | null,
    styleDescription: "",
    selectedDirector: null as Director | null
  });
  const storage = getStorage();
  const [isSaving, setIsSaving] = useState(false);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | undefined>(undefined);
  const [transcriptionWithTimestamps, setTranscriptionWithTimestamps] = useState<{
    segments: Array<{
      start: number;
      end: number;
      text: string;
    }>;
  } | null>(null);
  const audioContext = useRef<AudioContext | null>(null);
  const audioSource = useRef<AudioBufferSourceNode | null>(null);
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedEditingStyle, setSelectedEditingStyle] = useState<string>("dynamic");
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000));
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [directors, setDirectors] = useState<Director[]>([]);

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

      const reader = new FileReader();
      reader.onload = async (e) => {
        if (e.target?.result instanceof ArrayBuffer) {
          if (!audioContext.current) {
            audioContext.current = new AudioContext();
          }
          const buffer = await audioContext.current.decodeAudioData(e.target.result);
          setAudioBuffer(buffer);

          // Usar OpenAI para la transcripción
          setIsTranscribing(true);
          try {
            const transcriptionText = await transcribeAudio(file);
            setTranscription(transcriptionText);
            setCurrentStep(2);
            toast({
              title: "Éxito",
              description: "Audio transcrito correctamente",
            });
          } catch (err) {
            console.error("Error transcribing audio:", err);
            toast({
              title: "Error",
              description: "Error al transcribir el audio. Por favor intenta de nuevo.",
              variant: "destructive",
            });
          } finally {
            setIsTranscribing(false);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [toast]);

  const syncAudioWithTimeline = async () => {
    if (!audioBuffer) return;

    setIsGeneratingShots(true);
    try {
      const segments = await detectBeatsAndCreateSegments();
      if (segments && segments.length > 0) {
        setTimelineItems(segments);
        setCurrentStep(3);

        toast({
          title: "Éxito",
          description: `Se detectaron ${segments.length} segmentos sincronizados con la música`,
        });
      } else {
        throw new Error("No se detectaron segmentos en el audio");
      }
    } catch (error) {
      console.error("Error sincronizando audio:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al sincronizar el audio con el timeline",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingShots(false);
    }
  };

  const generateVideoScript = async () => {
    if (!transcription || timelineItems.length === 0) return;

    setIsGeneratingScript(true);
    try {
      // Extraemos información de los cortes actuales en el timeline
      const timelineInfo = timelineItems.map((item, index) => ({
        id: item.id,
        start_time: item.start_time,
        end_time: item.end_time,
        duration: item.duration
      }));

      // Calculamos duración exacta y número total de segmentos
      const totalSegments = timelineItems.length;
      const totalDuration = audioBuffer?.duration || 0;

      const prompt = `Como director de videos musicales profesional, necesito que analices esta canción y crees un guion detallado, perfectamente sincronizado con los cortes musicales ya identificados.

LETRA DE LA CANCIÓN:
${transcription}

DURACIÓN TOTAL: ${totalDuration.toFixed(2)} segundos

INFORMACIÓN DE CORTES MUSICALES:
${JSON.stringify(timelineInfo, null, 2)}

REQUISITOS ESTRICTOS DE SINCRONIZACIÓN:
1. Debes crear EXACTAMENTE ${totalSegments} segmentos de guion, uno para cada corte musical predefinido.
2. Cada segmento debe corresponder con una sección específica de la letra que coincida con el tiempo exacto del corte.
3. Si un corte abarca un periodo instrumental sin letra, especifica que es un momento instrumental y describe qué debería mostrarse.

INSTRUCCIONES ESPECÍFICAS:
1. ANÁLISIS DE LETRA Y MÚSICA:
   - Para cada corte, identifica qué parte exacta de la letra encaja con su duración
   - Describe los elementos musicales precisos que ocurren durante ese corte
   - Señala cualquier cambio de ritmo, tono o instrumentación

2. CREACIÓN DE GUION VISUAL SINCRONIZADO:
   - Para cada segmento, relaciona la escena exactamente con la parte de la letra correspondiente
   - Cada descripción visual debe reflejar el significado literal o metafórico de esa parte específica de la letra
   - El tipo de plano y mood deben ser apropiados para el momento específico de la canción

ESTRUCTURA REQUERIDA (JSON exacto):
{
  "segments": [
    {
      "id": número (debe coincidir con el ID del corte),
      "timeStart": número (tiempo de inicio en segundos, debe coincidir con el corte),
      "timeEnd": número (tiempo de fin en segundos, debe coincidir con el corte),
      "lyrics": "parte EXACTA de la letra que ocurre durante este corte temporal",
      "musical_elements": "descripción precisa de los elementos musicales durante este corte",
      "description": "descripción visual detallada que representa fielmente esta parte específica de la letra",
      "imagePrompt": "prompt detallado y específico para generar una imagen que capture esta escena",
      "shotType": "tipo de plano específico (primer plano, plano medio, plano general, etc.)",
      "mood": "estado de ánimo preciso basado en esta parte específica de la letra y música",
      "transition": "tipo de transición hacia el siguiente segmento"
    }
  ]
}

CRUCIAL:
- Cada segmento debe tener un ID que coincida exactamente con el ID del corte musical correspondiente
- Los tiempos de inicio y fin deben coincidir exactamente con los cortes musicales proporcionados
- Los prompts de imagen deben reflejar ESPECÍFICAMENTE el contenido de la letra en ese corte exacto
- La descripción debe explicar explícitamente cómo la escena se relaciona con esa parte específica de la letra

LETRA COMPLETA DE LA CANCIÓN:
${transcription}`;

      const jsonContent = await generateVideoScript(prompt);

      try {
        // Validar y procesar la respuesta
        let scriptResult;
        try {
          if (typeof jsonContent === 'string') {
            scriptResult = JSON.parse(jsonContent);
          } else {
            throw new Error("La respuesta no es una cadena de texto válida");
          }
        } catch (parseError) {
          // Intentar extraer JSON válido si está dentro de comillas, markdown, etc.
          const error = parseError as Error;
          console.error("Error parsing JSON:", error.message);
          
          // Asegúrate de que jsonContent es una cadena antes de usar match
          if (typeof jsonContent === 'string') {
            const jsonMatch = jsonContent.match(/\{[\s\S]*"segments"[\s\S]*\}/);
            if (jsonMatch && jsonMatch[0]) {
              scriptResult = JSON.parse(jsonMatch[0]);
            } else {
              throw new Error("No se pudo extraer un JSON válido de la respuesta");
            }
          } else {
            throw new Error("La respuesta no es una cadena de texto válida");
          }
        }

        if (!scriptResult || !scriptResult.segments || !Array.isArray(scriptResult.segments)) {
          throw new Error("Formato de guion inválido: no se encontró el array de segmentos");
        }

        // Crear un mapa para buscar segmentos por ID eficientemente
        const segmentMap = new Map();
        scriptResult.segments.forEach((segment: { id?: number; }) => {
          if (segment && segment.id !== undefined) {
            segmentMap.set(segment.id, segment);
          }
        });

        // Actualizar cada elemento del timeline con la información del guion
        const updatedItems = timelineItems.map(item => {
          const scriptSegment = segmentMap.get(item.id);
          
          if (scriptSegment) {
            return {
              ...item,
              description: `Letra: "${scriptSegment.lyrics || 'Instrumental'}"\n\nMúsica: ${scriptSegment.musical_elements || 'N/A'}\n\nEscena: ${scriptSegment.description || 'N/A'}`,
              imagePrompt: `${scriptSegment.imagePrompt || ''} La escena representa estas letras precisas: "${scriptSegment.lyrics || 'Instrumental'}" con elementos musicales: ${scriptSegment.musical_elements || 'ritmo principal'}`,
              shotType: scriptSegment.shotType || 'Plano medio',
              transition: scriptSegment.transition || 'Corte directo',
              mood: scriptSegment.mood || 'Neutral'
            };
          }
          return item;
        });

        setTimelineItems(updatedItems);
        setCurrentStep(4);

        // Guardar el script completo para referencia
        setScriptContent(JSON.stringify(scriptResult, null, 2));

        toast({
          title: "Éxito",
          description: "Guion sincronizado generado correctamente con todos los cortes musicales",
        });

      } catch (parseError) {
        const error = parseError as Error;
        console.error("Error parsing response:", error);
        console.error("Response content:", jsonContent);
        throw new Error("Error al procesar la respuesta del guion: " + error.message);
      }

    } catch (error) {
      console.error("Error generating script:", error);
      toast({
        title: "Error en la generación del guion",
        description: error instanceof Error ? error.message : "Error al generar el guion sincronizado del video",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
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

      // Asegurar que el resultado tiene la estructura correcta
      const resultWithImages = result as { images?: Array<{url: string}> };
      
      if (resultWithImages?.images?.[0]?.url) {
        const updatedItems = timelineItems.map(timelineItem =>
          timelineItem.id === item.id
            ? { ...timelineItem, generatedImage: resultWithImages.images![0].url }
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

  const generateTimelineItems = useCallback((shots: { duration?: string; shotType: string; description: string; imagePrompt?: string; transition?: string }[]) => {
    const baseTime = Date.now();
    let currentTime = baseTime;

    const items = shots.map((shot, index) => {
      const duration = shot.duration ? parseFloat(shot.duration) * 1000 : Math.floor(Math.random() * (5000 - 1000) + 1000);
      const item: TimelineItem = {
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
        transition: shot.transition || "cut",
        // Campos necesarios para compatibilidad con TimelineClip
        start: (currentTime - baseTime) / 1000,
        type: 'image',
        thumbnail: undefined,
        mood: 'neutral'
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

  const generateShotImages = async () => {
    setIsGeneratingShots(true);
    try {
      const items = timelineItems.slice(0, 10); // Limitar a 10 imágenes
      let successCount = 0;

      for (const item of items) {
        if (!item.imagePrompt) continue;

        try {
          console.log(`Generando imagen para el segmento ${item.id}`);

          const prompt = `${item.imagePrompt}. Style: ${videoStyle.mood}, ${videoStyle.colorPalette} color palette, ${videoStyle.characterStyle} character style`;

          const result = await fal.subscribe("fal-ai/flux-pro", {
            input: {
              prompt,
              negative_prompt: "low quality, blurry, distorted, deformed, unrealistic",
              image_size: "landscape_16_9",
              seed
            },
          });

          // Asegurar que el resultado tiene la estructura correcta
          const resultWithImages = result as { images?: Array<{url: string}> };
          
          if (!resultWithImages?.images?.[0]?.url) {
            throw new Error("No se recibió URL de imagen");
          }

          // Actualizar el timeline inmediatamente con la nueva imagen
          const newItems = timelineItems.map(timelineItem => {
            if (timelineItem.id === item.id) {
              return {
                ...timelineItem,
                generatedImage: resultWithImages.images![0].url
              };
            }
            return timelineItem;
          });

          setTimelineItems(newItems);
          successCount++;

          // Mostrar progreso
          toast({
            title: "Progreso",
            description: `Imagen ${successCount} de ${items.length} generada`
          });

          // Esperar antes de la siguiente generación
          if (successCount < items.length) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

        } catch (error) {
          console.error(`Error generando imagen para segmento ${item.id}:`, error);
          toast({
            title: "Error",
            description: `Error en imagen ${successCount + 1}, intentando siguiente...`,
            variant: "destructive",
          });
        }
      }

      // Mostrar resultado final
      if (successCount > 0) {
        toast({
          title: "Proceso completado",
          description: `Se generaron ${successCount} de ${items.length} imágenes`,
        });
        setCurrentStep(prevStep => prevStep + 1);
      } else {
        toast({
          title: "Error",
          description: "No se pudo generar ninguna imagen",
          variant: "destructive",
        });
      }

    } catch (error) {
      console.error("Error en el proceso de generación:", error);
      toast({
        title: "Error",
        description: "Error en el proceso de generación de imágenes",
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
        <div className="absolute inset-0">
          <img
            src={item.generatedImage || item.firebaseUrl || fallbackImage}
            alt={item.description}
            className="w-full h-full object-cover"
          />
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

        {item.transition && item.transition !== "cut" && (
          <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-orange-500/20 rounded-full z-10">
            <div className="absolute inset-1 bg-orange-500 rounded-full" />
          </div>
        )}
      </div>
    </div>
  ), [currentTime, selectedShot]);

  const clips: TimelineClip[] = timelineItems.map(item => ({
    id: item.id,
    start: (item.start_time - timelineItems[0]?.start_time || 0) / 1000,
    duration: item.duration / 1000,
    type: 'image',
    thumbnail: item.generatedImage || item.firebaseUrl,
    title: item.shotType,
    description: item.description,
    imagePrompt: item.imagePrompt
  }));

  const totalDuration = clips.reduce((acc, clip) => Math.max(acc, clip.start + clip.duration), 0);

  const handleTimeUpdate = (time: number) => {
    const baseTime = timelineItems[0]?.start_time || 0;
    setCurrentTime(baseTime + time * 1000);
  };

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

  const detectBeatsAndCreateSegments = async () => {
    if (!audioBuffer) return [];

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const totalDuration = audioBuffer.duration;

    const editingStyle = editingStyles.find(style => style.id === selectedEditingStyle)!;
    const windowSize = Math.floor(sampleRate * (selectedEditingStyle === "rhythmic" ? 0.025 : 0.05));
    const threshold = selectedEditingStyle === "dynamic" ? 0.15 : 0.12;
    const minSegmentDuration = editingStyle.duration.min;
    const maxSegmentDuration = editingStyle.duration.max;
    let lastBeatTime = 0;
    let energyHistory: number[] = [];
    const historySize = 43;
    const segments: TimelineItem[] = [];
    const shotTypes = [
      {
        type: "wide shot",
        description: "Plano general que muestra el entorno completo y establece el contexto",
        prompt: "wide angle shot showing the complete environment and atmosphere"
      },
      {
        type: "medium shot",
        description: "Plano medio que captura la expresión y el lenguaje corporal",
        prompt: "medium shot focusing on upper body and expression"
      },
      {
        type: "close-up",
        description: "Primer plano que enfatiza la emoción y los detalles",
        prompt: "close-up shot emphasizing emotion and facial details"
      },
      {
        type: "extreme close-up",
        description: "Plano detalle que muestra detalles específicos",
        prompt: "extreme close-up showing intricate details"
      },
      {
        type: "tracking shot",
        description: "Plano de seguimiento que añade dinamismo",
        prompt: "smooth tracking shot following the subject"
      }
    ];

    const transitions = ["cut", "fade", "dissolve", "crossfade"];

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

          const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];
          const transition = transitions[Math.floor(Math.random() * transitions.length)];

          let segmentDuration = currentTime - lastBeatTime;

          if (selectedEditingStyle === "dynamic") {
            segmentDuration = Math.max(minSegmentDuration,
              maxSegmentDuration * (1 - energy / (averageEnergy * 2)));
          } else if (selectedEditingStyle === "minimalist") {
            segmentDuration = Math.max(segmentDuration, minSegmentDuration);
          }

          segments.push({
            id: segments.length + 1,
            group: 1,
            title: `Escena ${segments.length + 1}`,
            start_time: lastBeatTime * 1000,
            end_time: (lastBeatTime + segmentDuration) * 1000,
            description: shotType.description,
            shotType: shotType.type,
            duration: segmentDuration * 1000,
            transition: transition,
            imagePrompt: shotType.prompt,
            // Campos adicionales para compatibilidad con TimelineClip
            start: lastBeatTime,
            type: 'image',
            mood: 'neutral'
          });

          lastBeatTime = currentTime;
        }
      }
    }

    if (segments.length > 0) {
      const lastSegment = segments[segments.length - 1];
      if (lastSegment.end_time / 1000 < totalDuration) {
        const finalShotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];
        segments.push({
          id: segments.length + 1,
          group: 1,
          title: `Escena Final`,
          start_time: lastSegment.end_time,
          end_time: totalDuration * 1000,
          description: finalShotType.description,
          shotType: finalShotType.type,
          duration: (totalDuration * 1000) - lastSegment.end_time,
          transition: "fade",
          imagePrompt: finalShotType.prompt,
          // Campos adicionales para compatibilidad con TimelineClip
          start: lastSegment.end_time / 1000,
          type: 'image',
          mood: 'conclusive'
        });
      }
    }

    return segments;
  };

  const generatePromptForSegment = async (segment: TimelineItem): Promise<string> => {
    const maxAttempts = 3;
    let attempt = 0;
    
    // Determinar qué parte de la transcripción corresponde a este segmento
    const segmentStartTime = segment.start_time / 1000; // convertir a segundos
    const segmentEndTime = segment.end_time / 1000;
    let relevantLyrics = "";
    
    // Si tenemos transcripción con timestamps
    if (transcriptionWithTimestamps && Array.isArray(transcriptionWithTimestamps.segments)) {
      // Buscar segmentos de la transcripción que coincidan con este segmento de timeline
      const relevantSegments = transcriptionWithTimestamps.segments.filter(
        (s: {start: number, end: number}) => 
          (s.start >= segmentStartTime && s.start <= segmentEndTime) || 
          (s.end >= segmentStartTime && s.end <= segmentEndTime)
      );
      
      if (relevantSegments.length > 0) {
        relevantLyrics = relevantSegments.map((s: {text: string}) => s.text).join(" ");
      }
    }
    
    // Si no hay letras específicas, usar transcripción general
    if (!relevantLyrics && transcription) {
      // Dividir la transcripción total proporcionalmente
      const totalDuration = timelineItems[timelineItems.length - 1]?.end_time / 1000 - timelineItems[0]?.start_time / 1000;
      if (totalDuration > 0) {
        const segmentDuration = segmentEndTime - segmentStartTime;
        const segmentPercent = segmentDuration / totalDuration;
        
        // Estimar qué parte de la transcripción corresponde a este segmento
        const transcriptionWords = transcription.split(/\s+/);
        const startWordIndex = Math.floor((segmentStartTime - (timelineItems[0]?.start_time / 1000)) / totalDuration * transcriptionWords.length);
        const wordCount = Math.floor(segmentPercent * transcriptionWords.length);
        
        if (startWordIndex >= 0 && wordCount > 0) {
          relevantLyrics = transcriptionWords.slice(startWordIndex, startWordIndex + wordCount).join(" ");
        }
      }
    }

    while (attempt < maxAttempts) {
      try {
        console.log(`Generating prompt for segment ${segment.id}, attempt ${attempt + 1}/${maxAttempts}`);
        
        // Preparar parámetros base para el prompt
        const promptParams = {
          shotType: segment.shotType || "medium shot",
          cameraFormat: videoStyle.cameraFormat,
          mood: videoStyle.mood,
          visualStyle: videoStyle.characterStyle,
          visualIntensity: videoStyle.visualIntensity,
          narrativeIntensity: videoStyle.narrativeIntensity,
          colorPalette: videoStyle.colorPalette,
          duration: segment.duration / 1000,
          directorStyle: videoStyle.selectedDirector?.style,
          specialty: videoStyle.selectedDirector?.specialty,
          styleReference: ""
        };

        const prompt = await generateVideoPromptWithRetry(promptParams);

        if (prompt && prompt !== "Error generating prompt") {
          return prompt;
        }

        console.log(`Attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
        attempt++;

      } catch (error) {
        console.error(`Error in attempt ${attempt + 1}:`, error);

        if (attempt === maxAttempts - 1) {
          toast({
            title: "Error",
            description: "No se pudo generar el prompt después de varios intentos",
            variant: "destructive",
          });
          return segment.imagePrompt || "Error generating prompt";
        }

        attempt++;
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }

    return segment.imagePrompt || "Error generating prompt";
  };

  const generatePromptsForSegments = async () => {
    if (timelineItems.length === 0) {
      toast({
        title: "Error",
        description: "Primero debes detectar los cortes musicales",
        variant: "destructive",
      });
      return;
    }

    if (!videoStyle.mood || !videoStyle.colorPalette || !videoStyle.characterStyle) {
      toast({
        title: "Error",
        description: "Debes configurar todos los aspectos del estilo antes de generar los prompts",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingScript(true);

    try {
      const updatedItems = [...timelineItems].slice(0, 10); // Limitar a 10 segmentos
      let hasError = false;
      let successCount = 0;

      // Procesar los segmentos en grupos de 3 para evitar sobrecargar la API
      for (let i = 0; i < updatedItems.length; i += 3) {
        const batch = updatedItems.slice(i, i + 3);

        try {
          const results = await Promise.all(
            batch.map(async (segment) => {
              const newPrompt = await generatePromptForSegment(segment);
              return {
                segment,
                prompt: newPrompt
              };
            })
          );

          results.forEach(({ segment, prompt }) => {
            if (prompt && prompt !== "Error generating prompt") {
              const index = updatedItems.findIndex(item => item.id === segment.id);
              if (index !== -1) {
                updatedItems[index] = {
                  ...updatedItems[index],
                  imagePrompt: prompt
                };
                successCount++;
              }
            } else {
              hasError = true;
            }
          });

          // Actualizar el estado después de cada batch
          setTimelineItems([...updatedItems]);

          toast({
            title: "Progreso",
            description: `Generados ${successCount} de ${updatedItems.length} prompts`,
          });

          // Esperar entre batches para evitar rate limits
          if (i + 3 < updatedItems.length) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }

        } catch (error) {
          console.error(`Error procesando batch ${i/3 + 1}:`, error);
          hasError = true;
        }
      }

      if (successCount === updatedItems.length) {
        toast({
          title: "Éxito",
          description: "Todos los prompts han sido generados",
        });
        setCurrentStep(5);
      } else {
        toast({
          title: "Completado con advertencias",
          description: `${successCount} de ${updatedItems.length} prompts generados exitosamente`,
          variant: hasError ? "destructive" : "default",
        });
      }

    } catch (error) {
      console.error("Error en la generación de prompts:", error);
      toast({
        title: "Error",
        description: "Error al generar los prompts",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const generateVideo = async () => {
    if (!timelineItems.length || !audioBuffer) {
      toast({
        title: "Error",
        description: "No hay suficientes elementos para generar el video",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingVideo(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 3000));

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
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  const analyzeReferenceImage = async (image: string) => {
    try {
      const analysis = await analyzeImage(image);

      setVideoStyle(prev => ({
        ...prev,
        styleDescription: analysis
      }));

      toast({
        title: "Análisis completado",
        description: "Estilo de referencia actualizado"
      });
    } catch (error) {
      console.error("Error analyzing reference image:", error);
      toast({
        title: "Error",
        description: "No se pudo analizar la imagen de referencia",
        variant: "destructive"
      });
    }
  };

  useEffect(() => {
    const loadDirectors = async () => {
      try {
        const directorsSnapshot = await getDocs(collection(db, "directors"));
        const directorsData = directorsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Director[];
        setDirectors(directorsData);
      } catch (error) {
        console.error("Error loading directors:", error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los directores",
          variant: "destructive",
        });
      }
    };

    loadDirectors();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <ProgressSteps 
        currentStep={currentStep} 
        steps={[
          {
            title: "Transcripción de Audio",
            description: "Analizando y transcribiendo la letra de tu canción",
            status: currentStep > 1 ? "completed" : currentStep === 1 ? "current" : "pending"
          },
          {
            title: "Generación de Guion",
            description: "Creando un guion visual basado en tu música",
            status: currentStep > 2 ? "completed" : currentStep === 2 ? "current" : "pending"
          },
          {
            title: "Sincronización",
            description: "Sincronizando el video con el ritmo de la música",
            status: currentStep > 3 ? "completed" : currentStep === 3 ? "current" : "pending"
          },
          {
            title: "Generación de Escenas",
            description: "Creando las escenas del video musical",
            status: currentStep > 4 ? "completed" : currentStep === 4 ? "current" : "pending"
          },
          {
            title: "Renderizado Final",
            description: "Combinando todo en tu video musical",
            status: currentStep > 5 ? "completed" : currentStep === 5 ? "current" : "pending"
          }
        ]}
      />

      <div className="container py-6 space-y-8">
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

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6 order-2 lg:order-1">
              <div className="border rounded-lg p-4">
                <Label className="text-lg font-semibold mb-4">1. Subir Audio</Label>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="audio/*"
                    onChange={handleFileChange}
                    disabled={isTranscribing}
                  />
                  {selectedFile && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Music2 className="h-4 w-4" />
                      <span>{selectedFile.name}</span>
                    </div>
                  )}
                  {isTranscribing && (
                    <div className="flex items-center gap-2 text-sm">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Transcribiendo audio...</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="border rounded-lg p-4">
                  <Label className="text-lg font-semibold mb-4">2. Transcripción</Label>
                  <div className="space-y-4">
                    <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                      <pre className="text-sm whitespace-pre-wrap">{transcription || "Sin transcripción"}</pre>
                    </ScrollArea>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="text-lg font-semibold mb-4">3. Estilo Visual</Label>
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <Label>Formato de Cámara</Label>
                      <Select
                        value={videoStyle.cameraFormat}
                        onValueChange={(value) => setVideoStyle(prev => ({ ...prev, cameraFormat: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar formato de cámara" />
                        </SelectTrigger>
                        <SelectContent>
                          {videoStyles.cameraFormats.map((format) => (
                            <SelectItem key={format.name} value={format.name}>
                              <div className="grid gap-1">
                                <span>{format.name}</span>
                                <span className="text-xs text-muted-foreground">{format.description}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Mood</Label>
                        <Select
                          value={videoStyle.mood}
                          onValueChange={(value) => setVideoStyle(prev => ({ ...prev, mood: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar mood" />
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

                      <div className="space-y-2">
                        <Label>Paleta de Colores</Label>
                        <Select
                          value={videoStyle.colorPalette}
                          onValueChange={(value) => setVideoStyle(prev => ({ ...prev, colorPalette: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar paleta" />
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
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Estilo de Personajes</Label>
                        <Select
                          value={videoStyle.characterStyle}
                          onValueChange={(value) => setVideoStyle(prev => ({ ...prev, characterStyle: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estilo" />
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

                      <div className="space-y-2">
                        <Label>Intensidad Visual ({videoStyle.visualIntensity}%)</Label>
                        <Slider
                          value={[videoStyle.visualIntensity]}
                          onValueChange={([value]) => setVideoStyle(prev => ({ ...prev, visualIntensity: value }))}
                          max={100}
                          step={1}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Intensidad Narrativa ({videoStyle.narrativeIntensity}%)</Label>
                      <p className="text-sm text-muted-foreground">
                        Ajusta qué tan fielmente el video sigue la narrativa de la letra
                      </p>
                      <Slider
                        value={[videoStyle.narrativeIntensity]}
                        onValueChange={([value]) => setVideoStyle(prev => ({ ...prev, narrativeIntensity: value }))}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Imagen de Referencia</Label>
                      <div className="grid gap-4">
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = async (e) => {
                                const base64 = e.target?.result as string;
                                setVideoStyle(prev => ({
                                  ...prev,
                                  referenceImage: base64
                                }));
                                await analyzeReferenceImage(base64);
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        {videoStyle.referenceImage && (
                          <div className="relative aspect-video w-full rounded-lg overflow-hidden">
                            <img
                              src={videoStyle.referenceImage}
                              alt="Referencia de estilo"
                              className="object-cover w-full h-full"
                            />
                          </div>
                        )}
                        {videoStyle.styleDescription && (
                          <div className="p-4 bg-muted rounded-lg">
                            <p className="text-sm">{videoStyle.styleDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Director del Video</Label>
                      {directors.length > 0 ? (
                        <div className="grid gap-4">
                          <Select
                            value={videoStyle.selectedDirector?.id || ""}
                            onValueChange={(directorId) => {
                              const director = directors.find(d => d.id === directorId);
                              setVideoStyle(prev => ({
                                ...prev,
                                selectedDirector: director || null
                              }));
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar director" />
                            </SelectTrigger>
                            <SelectContent>
                              {directors.map((director) => (
                                <SelectItem key={director.id} value={director.id}>
                                  <div className="flex items-center gap-2">
                                    {director.imageUrl && (
                                      <img
                                        src={director.imageUrl}
                                        alt={director.name}
                                        className="w-8 h-8 rounded-full object-cover"
                                      />
                                    )}
                                    <div className="grid gap-0.5">
                                      <span className="font-medium">{director.name}</span>
                                      <span className="text-xs text-muted-foreground">{director.specialty}</span>
                                    </div>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>

                          {videoStyle.selectedDirector && (
                            <div className="p-4 bg-muted rounded-lg">
                              <div className="flex items-center gap-4">
                                {videoStyle.selectedDirector.imageUrl && (
                                  <img
                                    src={videoStyle.selectedDirector.imageUrl}
                                    alt={videoStyle.selectedDirector.name}
                                    className="w-16 h-16 rounded-full object-cover"
                                  />
                                )}
                                <div className="space-y-1">
                                  <h4 className="font-semibold">{videoStyle.selectedDirector.name}</h4>
                                  <p className="text-sm text-muted-foreground">{videoStyle.selectedDirector.experience}</p>
                                  <p className="text-sm">{videoStyle.selectedDirector.style}</p>
                                  <div className="flex items-center gap-1">
                                    <span className="text-orange-500">★</span>
                                    <span className="text-sm">{videoStyle.selectedDirector.rating.toFixed(1)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 border rounded-lg bg-muted">
                          <p className="text-sm text-muted-foreground">Cargando directores...</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="text-lg font-semibold mb-4">4. Sincronizar Beats</Label>
                  <Button
                    onClick={syncAudioWithTimeline}
                    disabled={!audioBuffer || isGeneratingShots || currentStep < 2}
                    className="w-full"
                  >
                    {isGeneratingShots ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Detectando cortes...
                      </>
                    ) : (
                      <>
                        <RefreshCcw className="mr-2 h-4 w-4" />
                        Detectar Cortes Musicales
                      </>
                    )}
                  </Button>
                </div>

                <div className="border rounded-lg p-4 mt-4">
                  <Label className="text-lg font-semibold mb-4">Estilo de Edición</Label>
                  <RadioGroup
                    value={selectedEditingStyle}
                    onValueChange={setSelectedEditingStyle}
                    className="grid grid-cols-2 gap-4"
                  >
                    {editingStyles.map((style) => (
                      <div key={style.id} className="flex items-start space-x-3">
                        <RadioGroupItem value={style.id} id={style.id} />
                        <div className="grid gap-1.5">
                          <Label htmlFor={style.id} className="font-medium">
                            {style.name}
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            {style.description}
                          </p>
                        </div>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="text-lg font-semibold mb-4">5. Generar Prompts</Label>
                  <Button
                    onClick={generatePromptsForSegments}
                    disabled={
                      timelineItems.length === 0 ||
                      isGeneratingScript ||
                      currentStep < 3 ||
                      !videoStyle.mood ||
                      !videoStyle.colorPalette ||
                      !videoStyle.characterStyle
                    }
                    className="w-full mt-4"
                  >
                    {isGeneratingScript ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando prompts...
                      </>
                    ) : (
                      <>
                        <Edit className="mr-2 h-4 w-4" />
                        Generar Prompts con Estilo
                      </>
                    )}
                  </Button>
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="text-lg font-semibold mb-4">6. Generar Imágenes</Label>
                  <Button
                    onClick={generateShotImages}
                    disabled={
                      !timelineItems.length ||
                      isGeneratingShots ||
                      currentStep < 4
                    }
                    className="w-full"
                  >
                    {isGeneratingShots ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generando imágenes...
                      </>
                    ) : (
                      <>
                        <ImageIcon className="mr-2 h-4 w-4" />
                        Generar Imágenes
                      </>
                    )}
                  </Button>
                </div>

                <div className="mt-6">
                  <VideoGenerator
                    clips={timelineItems}
                    duration={audioBuffer?.duration || 0}
                    isGenerating={isGeneratingVideo}
                    onGenerate={generateVideo}
                  />
                </div>

                <ArtistCustomization
                  clips={clips}
                  onUpdateClip={handleClipUpdate}
                />

                <MusicianIntegration
                  clips={clips}
                  audioBuffer={audioBuffer}
                  onUpdateClip={handleClipUpdate}
                />

                <MovementIntegration
                  clips={clips}
                  audioBuffer={audioBuffer}
                  onUpdateClip={handleClipUpdate}
                />

                <LipSyncIntegration
                  clips={clips}
                  transcription={transcription}
                  audioBuffer={audioBuffer}
                  onUpdateClip={handleClipUpdate}
                />

              </div>
            </div>

            <div className="lg:order-2 order-1">
              <div className="sticky top-4 space-y-4">
                <div className="space-y-4">
                  <TimelineEditor
                    clips={clips}
                    currentTime={(currentTime - (timelineItems[0]?.start_time || 0)) / 1000}
                    duration={totalDuration}
                    audioBuffer={audioBuffer}
                    onTimeUpdate={handleTimeUpdate}
                    onClipUpdate={handleClipUpdate}
                    onPlay={() => setIsPlaying(true)}
                    onPause={() => setIsPlaying(false)}
                    isPlaying={isPlaying}
                    onRegenerateImage={(clipId) => {
                      const item = timelineItems.find(item => item.id === clipId);
                      if (item) {
                        regenerateImage(item);
                      }
                    }}
                  />

                  <AnalyticsDashboard
                    clips={clips}
                    audioBuffer={audioBuffer}
                    duration={totalDuration}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}