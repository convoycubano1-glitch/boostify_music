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
  ZoomIn, ZoomOut, SkipBack, FastForward, Rewind, Edit, RefreshCcw, Plus, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import * as fal from "@fal-ai/serverless-client";
import OpenAI from "openai";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage"; // Firebase imports
import { AnalyticsDashboard } from './analytics-dashboard';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VideoGenerator } from "./video-generator"; // Added import
import { ArtistCustomization } from "./artist-customization";
import { MusicianIntegration } from "./musician-integration";
import { MovementIntegration } from "./movement-integration";


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
  const [currentStep, setCurrentStep] = useState<number>(1); // Nuevo estado para controlar el flujo
  const [selectedEditingStyle, setSelectedEditingStyle] = useState<string>("dynamic");
  const [seed, setSeed] = useState<number>(Math.floor(Math.random() * 1000000)); // Added seed state
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false); // State for video generation

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
          // Iniciar transcripción automáticamente
          transcribeAudio(file);
        }
      };
      reader.readAsArrayBuffer(file);
    }
  }, [toast]);

  const transcribeAudio = async (file: File) => {
    setIsTranscribing(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('model', 'whisper-1');

      const transcription = await openai.audio.transcriptions.create({
        file: file,
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
        setCurrentStep(2); // Avanzar al siguiente paso

        toast({
          title: "Éxito",
          description: "Letra transcrita correctamente",
        });
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

  // Función para sincronizar beats y crear cortes
  const syncAudioWithTimeline = async () => {
    if (!audioBuffer) return;

    setIsGeneratingShots(true);
    try {
      console.log("Iniciando detección de beats...");
      const segments = await detectBeatsAndCreateSegments();
      console.log("Segmentos detectados:", segments);

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

  // Modificar la función generateVideoScript para manejar mejor los errores
  const generateVideoScript = async () => {
    if (!transcription || timelineItems.length === 0) return;

    setIsGeneratingScript(true);
    try {
      const prompt = `Como director creativo de videos musicales profesionales, crea un guion detallado para un video musical que capture la esencia de la canción y coincida con los ${timelineItems.length} cortes detectados.

Letra de la canción:
${transcription}

Número de segmentos: ${timelineItems.length}
Duración total: ${audioBuffer?.duration.toFixed(2)} segundos

Genera un prompt específico para cada segmento, considerando:
- El momento de la canción
- La letra correspondiente a ese momento
- El tipo de plano asignado
- La duración del segmento

Responde SOLO con el objeto JSON solicitado, sin texto adicional:
{
  "segments": [
    {
      "id": (número que coincide con el id del segmento existente),
      "description": "descripción de la escena",
      "imagePrompt": "prompt detallado para generar la imagen",
      "shotType": "tipo de plano",
      "transition": "tipo de transición"
    }
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "Eres un director de videos musicales experto. IMPORTANTE: Responde SOLAMENTE con el objeto JSON solicitado, sin ningún texto adicional o explicaciones."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      if (!response.choices[0].message.content) {
        throw new Error("No se recibió respuesta del modelo");
      }

      try {
        // Intentar encontrar y parsear el JSON incluso si hay texto adicional
        const content = response.choices[0].message.content;
        console.log("Respuesta completa del modelo:", content); // Log para debugging

        // Limpiar la respuesta de cualquier texto adicional
        const jsonContent = content.replace(/^[\s\S]*?(\{[\s\S]*\})[\s\S]*$/, '$1');
        console.log("JSON extraído:", jsonContent); // Log para debugging

        const scriptResult = JSON.parse(jsonContent);
        console.log("JSON parseado:", scriptResult); // Log para debugging

        if (!scriptResult.segments || !Array.isArray(scriptResult.segments)) {
          throw new Error("El formato del guion no es válido");
        }

        // Actualizar los items existentes con los nuevos prompts y descripciones
        const updatedItems = timelineItems.map(item => {
          const scriptSegment = scriptResult.segments.find(seg => seg.id === item.id);
          if (scriptSegment) {
            return {
              ...item,
              description: scriptSegment.description,
              imagePrompt: scriptSegment.imagePrompt,
              shotType: scriptSegment.shotType,
              transition: scriptSegment.transition
            };
          }
          return item;
        });

        setTimelineItems(updatedItems);
        setCurrentStep(4);

        toast({
          title: "Éxito",
          description: "Guion generado correctamente",
        });

      } catch (parseError) {
        console.error("Error parsing response:", parseError);
        toast({
          title: "Error",
          description: "Error al procesar la respuesta. Por favor intenta de nuevo.",
          variant: "destructive",
        });
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
          const prompt = `${item.imagePrompt}. Style: ${videoStyle.mood}, ${videoStyle.colorPalette} color palette, ${videoStyle.characterStyle} character style. Visual intensity: ${videoStyle.visualIntensity}%`;

          try {
            const result = await fal.subscribe("fal-ai/flux-pro", {
              input: {
                prompt,
                negative_prompt: "low quality, blurry, distorted, deformed, unrealistic, text, watermark",
                image_size: "landscape_16_9",
                seed: seed, // Usar el mismo seed para todas las imágenes
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
    thumbnail: item.generatedImage || item.firebaseUrl,
    title: item.shotType,
    description: item.description,
    imagePrompt: item.imagePrompt
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

  const detectBeatsAndCreateSegments = async () => {
    if (!audioBuffer) return;

    const channelData = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const segments: TimelineItem[] = [];
    const totalDuration = audioBuffer.duration;

    // Configuración mejorada para detección de beats
    const editingStyle = editingStyles.find(style => style.id === selectedEditingStyle)!;
    const windowSize = Math.floor(sampleRate * (selectedEditingStyle === "rhythmic" ? 0.025 : 0.05));
    const threshold = selectedEditingStyle === "dynamic" ? 0.15 : 0.12;
    const minSegmentDuration = editingStyle.duration.min;
    const maxSegmentDuration = editingStyle.duration.max;
    let lastBeatTime = 0;
    let energyHistory: number[] = [];
    const historySize = 43; // Aproximadamente 1 segundo de historia

    // Tipos de planos disponibles con sus descripciones
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

    // Tipos de transiciones
    const transitions = ["cut", "fade", "dissolve", "crossfade"];

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

          // Seleccionar tipo de plano y transición aleatoriamente
          const shotType = shotTypes[Math.floor(Math.random() * shotTypes.length)];
          const transition = transitions[Math.floor(Math.random() * transitions.length)];

          // Crear segmento
          let segmentDuration = currentTime - lastBeatTime;

          if (selectedEditingStyle === "dynamic") {
            // Hacer los cortes más cortos en momentos de alta energía
            segmentDuration = Math.max(minSegmentDuration,
              maxSegmentDuration * (1 - energy / (averageEnergy * 2)));
          } else if (selectedEditingStyle === "minimalist") {
            // Favorecer duraciones más largas
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
            imagePrompt: shotType.prompt
          });

          lastBeatTime = currentTime;
        }
      }
    }

    // Asegurarse de que cubrimos toda la duración de la canción
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
          imagePrompt: finalShotType.prompt
        });
      }
    }

    return segments;
  };

  // Función para generar el guion basado en los segmentos
  const generatePromptForSegment = async (segment: TimelineItem) => {
    try {
      const prompt = `Generaun prompt detallado para unaimagen de video musical que mantenga consistencia visual con estas características:
    - Tipo de plano: ${segment.shotType}
    - Mood: ${videoStyle.mood}
    - Estilo visual: ${videoStyle.characterStyle}
        - Intensidad visual: ${videoStyle.visualIntensity}%
    - Paleta de colores: ${videoStyle.colorPalette}
    - Duración del segmento: ${segment.duration / 1000} segundos

    El prompt debe ser específico y detallado para generar una imagen coherente con el estilo del video.
    Responde SOLO con el prompt, sin explicaciones adicionales.`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          { role: "system", content: "Eres un director de fotografía experto en crear prompts para generar imágenes de videos musicales." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 200
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error("Error generando prompt:", error);
      return segment.imagePrompt || "Error generando prompt";
    }
  };

  // Función separada para generar prompts
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
      console.log("Generando prompts para los segmentos...");
      const segmentsWithPrompts = [...timelineItems];

      for (let i = 0; i < segmentsWithPrompts.length; i++) {
        const prompt = await generatePromptForSegment(segmentsWithPrompts[i]);
        segmentsWithPrompts[i] = {
          ...segmentsWithPrompts[i],
          imagePrompt: prompt
        };
        console.log(`Prompt generado para segmento ${i + 1}:`, prompt);
      }

      setTimelineItems(segmentsWithPrompts);
      setCurrentStep(4);

      toast({
        title: "Éxito",
        description: "Prompts generados correctamente",
      });
    } catch (error) {
      console.error("Error generando prompts:", error);
      toast({
        title: "Error",
        description: "Error al generar los prompts para los segmentos",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  //Simulación de la generación de video
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
      // Aquí se implementará la lógica de Kling para generar el video
      // Por ahora es un placeholder
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

  // Actualizar la interfaz para reflejar los pasos separados
  return (
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

      {/* Layout Principal */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Columna Izquierda - Controles */}
        <div className="space-y-6 order-2 lg:order-1">
          {/* Paso 1: Subida de Audio */}
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

          {/* Resto de los pasos con clases responsive */}
          <div className="space-y-6">
            {/* Paso 2: Transcripción */}
            <div className="border rounded-lg p-4">
              <Label className="text-lg font-semibold mb-4">2. Transcripción</Label>
              <div className="space-y-4">
                <ScrollArea className="h-[200px] w-full rounded-md border p-4">
                  <pre className="text-sm whitespace-pre-wrap">{transcription || "Sin transcripción"}</pre>
                </ScrollArea>
              </div>
            </div>

            {/* Paso 3: Estilo Visual */}
            <div className="border rounded-lg p-4">
              <Label className="text-lg font-semibold mb-4">3. Estilo Visual</Label>
              <div className="grid gap-4 sm:grid-cols-2">
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
            </div>

            {/* Paso 4: Sincronizar Beats */}
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

            {/* Paso 5: Generar Prompts */}
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

            {/* Paso 6: Generar Imágenes */}
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

            {/* Paso 7: Generación de Video */}
            <div className="mt-6">
              <VideoGenerator
                clips={timelineItems}
                duration={audioBuffer?.duration || 0}
                isGenerating={isGeneratingVideo}
                onGenerate={generateVideo}
              />
            </div>

            {/* Paso 7: Personalización de Artista */}
            <ArtistCustomization
              clips={clips}
              onUpdateClip={handleClipUpdate}
            />

            {/* Paso 8: Integración de Músicos */}
            <MusicianIntegration
              clips={clips}
              audioBuffer={audioBuffer}
              onUpdateClip={handleClipUpdate}
            />

            {/* Paso 9: Integración de Movimientos */}
            <MovementIntegration
              clips={clips}
              audioBuffer={audioBuffer}
              onUpdateClip={handleClipUpdate}
            />
          </div>
        </div>

        {/* Columna Derecha - Timeline y Preview */}
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
  );
}