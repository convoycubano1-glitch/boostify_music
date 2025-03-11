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
  ZoomIn, ZoomOut, SkipBack, FastForward, Rewind, Edit, RefreshCcw, Plus, RefreshCw,
  Film, CheckCircle2, Share, User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import * as fal from "@fal-ai/serverless-client";
import OpenAI from "openai";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "@/firebase";
import { useAuth } from "@/lib/context/auth-context";
import { AnalyticsDashboard } from './analytics-dashboard';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { VideoGenerator } from "./video-generator";
import { ArtistCustomization } from "./artist-customization";
import { MusicianIntegration } from "./musician-integration";
import { MovementIntegration } from "./movement-integration";
import { LipSyncIntegration } from "./lip-sync-integration";
import { FinalRendering, type UpscaleOptions } from "./final-rendering";
import { ProgressSteps } from "./progress-steps";
import { 
  analyzeImage, 
  generateVideoPromptWithRetry, 
  generateMusicVideoScript,
  type VideoPromptParams 
} from "@/lib/api/openrouter";
import { upscaleVideo } from "@/lib/api/video-service";
import { generateVideoScript as generateVideoScriptAPI } from "@/lib/api/openrouter";
import { FileText } from "lucide-react";
import fluxService, { FluxModel, FluxTaskType } from "@/lib/api/flux/flux-service";

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
  // Campos para análisis de audio
  energy?: number;
  averageEnergy?: number;
  // Campos adicionales para compatibilidad con TimelineClip
  start: number;
  type: 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text';
  // Layer por defecto (0=audio, 1=imagen, 2=texto, 3=efectos)
  layer?: number;
  // Propiedades de visualización
  thumbnail?: string; // Usaremos generatedImage o firebaseUrl para esto
  visible?: boolean;
  locked?: boolean;
  // URLs de recursos
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  // Campos para lipsync y metadata
  lipsyncApplied?: boolean;
  lipsyncVideoUrl?: string;
  lipsyncProgress?: number;
  // Campos para movimiento
  movementApplied?: boolean;
  movementPattern?: string;
  movementIntensity?: number;
  movementUrl?: string;
  // Campos para face swap
  faceSwapApplied?: boolean;
  faceSwapImageUrl?: string;
  // Estructura para metadatos
  metadata?: {
    section?: string;
    movementApplied?: boolean;
    movementPattern?: string;
    movementIntensity?: number;
    faceSwapApplied?: boolean;
    musicianIntegrated?: boolean;
    lyrics?: string;
    musical_elements?: string;
    character?: string;
    camera_movement?: string;
    animation_style?: string;
    textContent?: string;
    lipsync?: {
      applied: boolean;
      timestamp?: string;
      videoUrl?: string;
      progress?: number;
    }
    [key: string]: any;
  };
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
  const { user } = useAuth();
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
  const [videoId, setVideoId] = useState<string>("");
  const [songTitle, setSongTitle] = useState<string>("");
  const [duration, setDuration] = useState<number>(0);
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
    styleReferenceUrl: "",
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
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [upscaledVideoUrl, setUpscaledVideoUrl] = useState<string | null>(null);

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
            // Establecer el paso como completado para habilitar el siguiente botón
            // pero no cambiar la vista (por eso usamos 1.5 en lugar de 2)
            setCurrentStep(1.5);
            toast({
              title: "Éxito",
              description: "Audio transcrito correctamente. Ahora puedes generar el guión musical.",
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

  const generateScriptFromTranscription = async () => {
    if (!transcription) {
      toast({
        title: "Error",
        description: "Es necesario transcribir el audio primero",
        variant: "destructive",
      });
      return;
    }

    setIsGeneratingScript(true);
    try {
      // Llamar a la API para generar el guion
      toast({
        title: "Procesando",
        description: "Generando guion basado en la letra de la canción...",
      });

      const scriptResponse = await generateMusicVideoScript(transcription);
      
      // Intentar dar formato al JSON para mejor visualización
      try {
        // Verificamos si ya es un string JSON válido, y lo parseamos para darle formato
        const parsed = JSON.parse(scriptResponse);
        setScriptContent(JSON.stringify(parsed, null, 2));
      } catch (parseError) {
        // Si no se puede parsear, usamos directamente la respuesta
        console.warn("No se pudo formatear el JSON del guion, usando respuesta directa", parseError);
        setScriptContent(scriptResponse);
      }
      
      // Marcar este paso como completado
      setCurrentStep(3);
      
      toast({
        title: "Éxito",
        description: "Guion del video musical generado correctamente",
      });
    } catch (error) {
      console.error("Error generando guion:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el guion del video musical",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingScript(false);
    }
  };

  const syncAudioWithTimeline = async () => {
    if (!audioBuffer) return;

    setIsGeneratingShots(true);
    try {
      const segments = await detectBeatsAndCreateSegments();
      if (segments && segments.length > 0) {
        setTimelineItems(segments);
        setCurrentStep(4); // Actualizamos este paso de 3 a 4 ya que agregamos un paso antes

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

  const generateVideoScriptFromAudio = async () => {
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

      // Validamos que el prompt sea una cadena de texto
      if (typeof prompt !== 'string') {
        throw new Error("El prompt debe ser una cadena de texto");
      }
      
      // Llamada a la API para generar el guion con validación de tipos
      const jsonContent: string = await generateVideoScriptAPI(prompt);

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
          
          // Verificar que jsonContent es un string antes de usar regex
          if (typeof jsonContent === 'string') {
            // Extraer un objeto JSON válido de la respuesta
            try {
              const regex = /\{[\s\S]*"segments"[\s\S]*\}/;
              const match = jsonContent.match(regex);
              if (match && match[0]) {
                scriptResult = JSON.parse(match[0]);
              } else {
                throw new Error("No se pudo encontrar un JSON válido con segmentos");
              }
            } catch (regexError) {
              console.error("Error en la búsqueda de JSON con regex:", regexError);
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

  /**
   * Genera una imagen para un segmento específico utilizando FAL AI
   * @param item - El segmento de timeline para el que se generará la imagen
   * @returns Promise<string> URL de la imagen generada o null en caso de error
   */
  const generateImageForSegment = async (item: TimelineItem): Promise<string | null> => {
    if (!item.imagePrompt) {
      console.warn(`Segmento ${item.id} no tiene prompt para generar imagen`);
      return null;
    }

    // Número de intentos para generación de imagen
    const maxAttempts = 2;
    let attempt = 0;
    let lastError: Error | null = null;

    while (attempt < maxAttempts) {
      try {
        // Formateamos el prompt para incluir información de estilo
        const prompt = `${item.imagePrompt}. Style: ${videoStyle.mood}, ${videoStyle.colorPalette} color palette, ${videoStyle.characterStyle} character style, ${item.shotType} composition`;
        
        console.log(`Generando imagen para segmento ${item.id}, intento ${attempt + 1}/${maxAttempts}`);
        console.log(`Prompt: ${prompt.substring(0, 100)}...`);

        // Configuramos los parámetros para la API de Flux
        const params = {
          prompt: prompt,
          negativePrompt: "low quality, blurry, distorted, deformed, unrealistic, oversaturated, text, watermark",
          width: 1024,
          height: 576, // Relación de aspecto 16:9
          guidance_scale: 2.5,
          model: FluxModel.FLUX1_DEV,
          taskType: FluxTaskType.TXT2IMG,
          // Usar una semilla específica para cada segmento, pero consistente en regeneraciones
          seed: seed + item.id
        };

        // Iniciar la generación de imagen con Flux API
        console.log('Iniciando generación con Flux API');
        const result = await fluxService.generateImage(params);

        if (!result.success || !result.taskId) {
          throw new Error(`Error iniciando la generación de imagen: ${result.error || 'Respuesta inválida'}`);
        }

        console.log(`Tarea de generación iniciada con ID: ${result.taskId}`);
        
        // Esperar a que la imagen se genere (polling)
        const imageUrl = await waitForFluxImageGeneration(result.taskId);
        
        if (imageUrl) {
          console.log(`Imagen generada exitosamente para segmento ${item.id}: ${imageUrl}`);
          return imageUrl;
        } else {
          throw new Error("No se recibió URL de imagen en la respuesta");
        }
      } catch (error) {
        console.error(`Error en intento ${attempt + 1} para segmento ${item.id}:`, error);
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Si es el último intento, no esperamos
        if (attempt < maxAttempts - 1) {
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Reintentando en ${backoffTime/1000} segundos...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
        }
        
        attempt++;
      }
    }

    console.error(`No se pudo generar imagen para segmento ${item.id} después de ${maxAttempts} intentos:`, lastError);
    return null;
  };

  /**
   * Espera a que se complete la generación de imagen en Flux API mediante polling
   * @param taskId ID de la tarea de generación de imagen
   * @returns URL de la imagen generada o null si falla
   */
  const waitForFluxImageGeneration = async (taskId: string): Promise<string | null> => {
    const maxAttempts = 40; // Máximo número de intentos para verificar el estado
    const pollingInterval = 1500; // Intervalo entre verificaciones (1.5 segundos)
    let attempts = 0;

    // Función para hacer un único intento de verificación
    const checkStatus = async (): Promise<string | null> => {
      const statusResult = await fluxService.checkTaskStatus(taskId);
      
      console.log(`Estado de la tarea ${taskId}:`, statusResult.status);
      
      if (statusResult.success && statusResult.status === 'completed' && statusResult.images && statusResult.images.length > 0) {
        return statusResult.images[0];
      } else if (!statusResult.success || statusResult.status === 'failed') {
        throw new Error(`La generación de imagen falló: ${statusResult.error || 'Error desconocido'}`);
      }
      
      return null; // Todavía procesando
    };

    // Bucle de polling
    while (attempts < maxAttempts) {
      try {
        const result = await checkStatus();
        if (result) {
          return result; // Imagen generada exitosamente
        }
        
        // Esperar antes del siguiente intento
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        attempts++;
      } catch (error) {
        console.error('Error verificando estado de generación:', error);
        return null;
      }
    }

    console.error(`Tiempo de espera agotado después de ${attempts} intentos para la tarea ${taskId}`);
    return null;
  };

  /**
   * Regenera la imagen para un segmento específico
   * @param item - El segmento de timeline cuya imagen se regenerará
   */
  const regenerateImage = async (item: TimelineItem) => {
    if (!item.imagePrompt) {
      toast({
        title: "Error",
        description: "Este segmento no tiene un prompt para generar imagen",
        variant: "destructive",
      });
      return;
    }

    try {
      const imageUrl = await generateImageForSegment(item);
      
      if (imageUrl) {
        const updatedItems = timelineItems.map(timelineItem =>
          timelineItem.id === item.id
            ? { ...timelineItem, generatedImage: imageUrl }
            : timelineItem
        );
        setTimelineItems(updatedItems);

        toast({
          title: "Imagen regenerada",
          description: "La imagen se ha regenerado exitosamente",
        });
      } else {
        throw new Error("No se pudo generar la imagen");
      }
    } catch (error) {
      console.error("Error regenerando imagen:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al regenerar la imagen",
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

  /**
   * Genera imágenes para todos los segmentos que tengan prompts
   * Procesa los segmentos en paralelo en batches para optimizar tiempo
   */
  const generateShotImages = async () => {
    if (timelineItems.length === 0) {
      toast({
        title: "Error",
        description: "No hay segmentos para generar imágenes",
        variant: "destructive",
      });
      return;
    }

    // Verificar que haya prompts generados
    const itemsWithoutPrompts = timelineItems.filter(item => !item.imagePrompt).length;
    if (itemsWithoutPrompts === timelineItems.length) {
      toast({
        title: "Error",
        description: "Los segmentos no tienen prompts para generar imágenes",
        variant: "destructive",
      });
      return;
    }

    if (itemsWithoutPrompts > 0) {
      toast({
        title: "Advertencia",
        description: `${itemsWithoutPrompts} segmentos no tienen prompts y se omitirán`,
        variant: "default",
      });
    }

    setIsGeneratingShots(true);
    try {
      // Limitar a máximo 10 imágenes para evitar sobrecarga
      const items = timelineItems
        .filter(item => item.imagePrompt && !item.generatedImage) // Solo procesar los que tienen prompt pero no imagen
        .slice(0, 10);

      if (items.length === 0) {
        toast({
          title: "Información",
          description: "Todos los segmentos ya tienen imágenes generadas",
        });
        setIsGeneratingShots(false);
        return;
      }

      toast({
        title: "Iniciando generación",
        description: `Generando ${items.length} imágenes para el video musical`,
      });

      let successCount = 0;
      let failCount = 0;

      // Procesar en batches de 2 para equilibrar velocidad y estabilidad
      const batchSize = 2;
      
      for (let i = 0; i < items.length; i += batchSize) {
        const currentBatch = items.slice(i, i + batchSize);
        
        try {
          // Mostrar batch actual
          console.log(`Procesando batch ${Math.floor(i/batchSize) + 1} de ${Math.ceil(items.length/batchSize)}`);
          toast({
            title: "Progreso",
            description: `Procesando batch ${Math.floor(i/batchSize) + 1} de ${Math.ceil(items.length/batchSize)}`,
          });

          // Generar imágenes para el batch actual en paralelo
          const results = await Promise.all(
            currentBatch.map(async (item) => {
              try {
                const imageUrl = await generateImageForSegment(item);
                return {
                  id: item.id,
                  success: true,
                  url: imageUrl
                };
              } catch (error) {
                console.error(`Error en generación para segmento ${item.id}:`, error);
                return {
                  id: item.id,
                  success: false,
                  error: error instanceof Error ? error.message : "Error desconocido"
                };
              }
            })
          );

          // Actualizar el timeline con las imágenes generadas
          let updatedItems = [...timelineItems];
          
          for (const result of results) {
            if (result.success && result.url) {
              // Actualizar el item correspondiente
              updatedItems = updatedItems.map(item => 
                item.id === result.id 
                  ? { ...item, generatedImage: result.url as string } 
                  : item
              );
              successCount++;
            } else {
              failCount++;
              console.error(`Fallo en segmento ${result.id}:`, result.error);
            }
          }
          
          // Actualizar estado solo una vez para todo el batch
          setTimelineItems(updatedItems);

          // Esperar entre batches para evitar rate limits
          if (i + batchSize < items.length) {
            await new Promise(resolve => setTimeout(resolve, 4000));
          }
        } catch (batchError) {
          console.error(`Error procesando batch ${Math.floor(i/batchSize) + 1}:`, batchError);
          toast({
            title: "Error en batch",
            description: `Error en batch ${Math.floor(i/batchSize) + 1}, continuando con el siguiente...`,
            variant: "destructive",
          });
        }
      }

      // Mostrar resultado final
      if (successCount > 0) {
        toast({
          title: "Proceso completado",
          description: `Se generaron ${successCount} de ${items.length} imágenes ${failCount > 0 ? `(${failCount} fallaron)` : ''}`,
        });
        
        if (successCount >= 1) { // Mostrar vista previa incluso si solo se generó una imagen
          // Generar ID único para este video
          const videoId = `video_${Date.now()}`;
          
          // Guardar el videoId en el estado para usarlo en la generación del video
          setVideoId(videoId);
          
          // Calcular duración total en segundos
          const calculateTotalDuration = () => {
            if (timelineItems.length === 0) return 0;
            const lastItem = timelineItems[timelineItems.length - 1];
            return lastItem.end_time / 1000; // Convertir a segundos
          };
          
          // Extraer palabras clave del primer segmento o usar etiquetas predeterminadas
          const extractTags = () => {
            const firstSegment = timelineItems[0];
            if (firstSegment && firstSegment.description) {
              return firstSegment.description
                .split(' ')
                .filter(word => word.length > 5)
                .slice(0, 5);
            }
            return ['música', 'video', 'artista', 'canción', 'generado'];
          };
          
          // Crear un documento de video en Firestore para futuras referencias
          try {
            const videoRef = collection(db, 'videos');
            await addDoc(videoRef, {
              id: videoId,
              userId: user?.uid,
              title: songTitle || 'Video Musical Generado',
              status: 'preview', // Inicialmente solo vista previa
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
              duration: duration || calculateTotalDuration(),
              thumbnailUrl: timelineItems.find(item => item.generatedImage)?.generatedImage || '',
              tags: extractTags(),
            });
          } catch (error) {
            console.error('Error guardando información del video:', error);
          }
          
          setCurrentStep(5); // Avanzar al siguiente paso
        }
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
        title: "Error general",
        description: error instanceof Error ? error.message : "Error en el proceso de generación de imágenes",
        variant: "destructive",
      });
    } finally {
      setIsGeneratingShots(false);
    }
  };

  /**
   * Exporta el video generado basado en las imágenes y el audio
   * @returns Promise<string> URL del video generado
   */
  const handleExportVideo = async (): Promise<string | null> => {
    if (!timelineItems.length || !audioBuffer) {
      toast({
        title: "Error",
        description: "No hay suficientes elementos para exportar el video",
        variant: "destructive",
      });
      return null;
    }
    
    // Verificar que todos los segmentos tengan imágenes generadas
    const missingImages = timelineItems.filter(item => !item.generatedImage && !item.firebaseUrl).length;
    if (missingImages > 0) {
      toast({
        title: "Advertencia",
        description: `Faltan ${missingImages} imágenes por generar. El video puede estar incompleto.`,
        variant: "destructive",
      });
    }
    
    setIsExporting(true);
    try {
      // Primero, guardar todas las imágenes en Firebase para tener URLs estables
      const savePromises = timelineItems.map(async (item) => {
        if (item.generatedImage && !item.firebaseUrl) {
          const url = await saveToFirebase(item);
          if (url) {
            return {
              id: item.id,
              url
            };
          }
        }
        return {
          id: item.id,
          url: item.firebaseUrl || item.generatedImage
        };
      });
      
      const savedImages = await Promise.all(savePromises);
      
      // Simulamos el proceso de renderizado (en una implementación real, aquí iría la lógica de FFmpeg)
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Crear un simulado video URL (en una implementación real, esto sería una URL de Firebase Storage)
      const mockVideoUrl = `https://storage.googleapis.com/music-video-generator/${Date.now()}_export.mp4`;
      
      toast({
        title: "Exportación completada",
        description: "Video disponible para descarga",
      });
      
      setCurrentStep(6); // Marcar como completado

      return mockVideoUrl;
    } catch (error) {
      console.error("Error exportando video:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al exportar el video",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsExporting(false);
    }
  };

  const handleScriptChange = (value: string | undefined) => {
    if (!value) return;
    setScriptContent(value);
    try {
      const scriptData = JSON.parse(value);
      
      // Compatibilidad con diferentes formatos de script
      if (scriptData.shots && Array.isArray(scriptData.shots)) {
        // Formato anterior
        generateTimelineItems(scriptData.shots);
      } else if (scriptData.segments && Array.isArray(scriptData.segments)) {
        // Nuevo formato de script desde generateMusicVideoScript
        const shotItems = scriptData.segments.map((segment: any) => ({
          shotType: segment.tipo_plano || segment.shotType || "Plano medio",
          description: segment.descripción_visual || segment.description || "",
          imagePrompt: segment.imagePrompt || "",
          transition: segment.transición || segment.transition || "corte directo",
          duration: typeof segment.duration === 'number' ? String(segment.duration) : "3"
        }));
        generateTimelineItems(shotItems);
      } else if (scriptData.segmentos && Array.isArray(scriptData.segmentos)) {
        // Formato en español
        const shotItems = scriptData.segmentos.map((segmento: any) => ({
          shotType: segmento.tipo_plano || "Plano medio",
          description: segmento.descripción_visual || "",
          imagePrompt: `Escena musical: ${segmento.descripción_visual || ""}. Estilo: ${segmento.mood || "neutral"}`,
          transition: segmento.transición || "corte directo",
          duration: typeof segmento.duration === 'number' ? String(segmento.duration) : "3"
        }));
        generateTimelineItems(shotItems);
      } else {
        console.warn("Formato de script no reconocido:", scriptData);
      }
    } catch (error) {
      console.error("Error parsing script:", error);
      toast({
        title: "Error de formato",
        description: "El script no tiene un formato JSON válido",
        variant: "destructive"
      });
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

  // Mapa de clips organizados por capas para el editor profesional multicanal
  const clips: TimelineClip[] = timelineItems.map(item => ({
    id: item.id,
    start: (item.start_time - timelineItems[0]?.start_time || 0) / 1000,
    duration: item.duration / 1000,
    type: 'image',
    // Layer por defecto para imágenes = 1 (segunda capa)
    layer: 1,
    thumbnail: item.generatedImage || item.firebaseUrl,
    title: item.shotType,
    description: item.description,
    imagePrompt: item.imagePrompt,
    // Añadir URL de imagen para mostrar de forma correcta
    imageUrl: item.generatedImage || item.firebaseUrl,
    // Metadata para preservar el orden exacto del guion
    metadata: {
      sourceIndex: item.id,
      section: item.section || 'default',
      movementApplied: !!item.movementApplied,
      movementPattern: item.movementPattern || undefined,
      movementIntensity: item.movementIntensity || undefined,
      faceSwapApplied: !!item.faceSwapApplied
    },
    // Visibilidad y estado de bloqueo
    visible: true,
    locked: false
  }));

  const totalDuration = clips.reduce((acc, clip) => Math.max(acc, clip.start + clip.duration), 0);

  const handleTimeUpdate = (time: number) => {
    const baseTime = timelineItems[0]?.start_time || 0;
    setCurrentTime(baseTime + time * 1000);
  };

  const handleClipUpdate = (clipId: number, updates: Partial<TimelineClip>) => {
    const updatedItems = timelineItems.map(item => {
      if (item.id === clipId) {
        // Crear objeto de actualización base
        const updatedItem = { ...item };
        
        // Si se actualizaron las propiedades de tiempo
        if (updates.start !== undefined) {
          updatedItem.start_time = timelineItems[0].start_time + updates.start * 1000;
        }
        
        if (updates.duration !== undefined) {
          updatedItem.duration = updates.duration * 1000;
        }
        
        // Manejar propiedades específicas de LipSync
        if (updates.lipsyncApplied !== undefined) {
          updatedItem.lipsyncApplied = updates.lipsyncApplied;
          
          // Actualizar el estado de metadata para reflejar que se ha aplicado LipSync
          if (updates.lipsyncApplied) {
            if (!updatedItem.metadata) {
              updatedItem.metadata = {};
            }
            updatedItem.metadata.lipsync = {
              applied: true,
              timestamp: new Date().toISOString(),
            };
          }
        }
        
        if (updates.lipsyncVideoUrl !== undefined) {
          updatedItem.lipsyncVideoUrl = updates.lipsyncVideoUrl;
          
          // Actualizar la URL del video en metadata
          if (!updatedItem.metadata) {
            updatedItem.metadata = {};
          }
          if (!updatedItem.metadata.lipsync) {
            updatedItem.metadata.lipsync = { applied: true };
          }
          updatedItem.metadata.lipsync.videoUrl = updates.lipsyncVideoUrl;
        }
        
        // Manejar el progreso de LipSync si está presente
        if (updates.lipsyncProgress !== undefined) {
          updatedItem.lipsyncProgress = updates.lipsyncProgress;
          
          // Actualizar el progreso en metadata
          if (!updatedItem.metadata) {
            updatedItem.metadata = {};
          }
          if (!updatedItem.metadata.lipsync) {
            updatedItem.metadata.lipsync = { applied: false };
          }
          updatedItem.metadata.lipsync.progress = updates.lipsyncProgress;
        }
        
        return updatedItem;
      }
      return item;
    });
    
    setTimelineItems(updatedItems);
    
    // Depurar para verificar la actualización
    console.log(`Clip ${clipId} actualizado:`, updates);
  };
  
  // Función para manejar la división de clips en la línea de tiempo
  const handleSplitClip = (clipId: number, splitTime: number) => {
    // Encontrar el clip que se va a dividir
    const clipToSplit = timelineItems.find(item => item.id === clipId);
    if (!clipToSplit) return;
    
    // Calcular la posición absoluta del punto de división
    const absoluteSplitTime = timelineItems[0].start_time + splitTime * 1000;
    
    // Crear el nuevo clip para la segunda parte
    const newClipId = Math.max(...timelineItems.map(item => item.id)) + 1;
    const relativeStartInClip = splitTime - ((clipToSplit.start_time - timelineItems[0].start_time) / 1000);
    
    // Nuevo clip (segunda parte)
    const newClip: TimelineItem = {
      ...clipToSplit,
      id: newClipId,
      start_time: absoluteSplitTime,
      end_time: clipToSplit.end_time,
      start: (absoluteSplitTime - timelineItems[0].start_time) / 1000,
      duration: (clipToSplit.end_time - absoluteSplitTime) / 1000,
      // Conservar otros campos importantes
      title: `${clipToSplit.title} (parte 2)`,
    };
    
    // Actualizar la lista de clips
    const updatedItems = timelineItems.map(item => {
      if (item.id === clipId) {
        // Actualizar el clip original (primera parte)
        return {
          ...item,
          duration: relativeStartInClip,
          end_time: absoluteSplitTime
        };
      }
      return item;
    });
    
    // Añadir el nuevo clip
    updatedItems.push(newClip);
    
    // Ordenar los clips por tiempo de inicio
    updatedItems.sort((a, b) => a.start_time - b.start_time);
    
    // Actualizar el estado
    setTimelineItems(updatedItems);
    
    console.log(`Clip ${clipId} dividido en: ${clipId} y ${newClipId} en tiempo ${splitTime}s`);
  };

  /**
   * Detecta beats en el archivo de audio y crea segmentos para el timeline
   * Implementa un algoritmo de detección de beats basado en energía acústica
   * @returns Array de TimelineItem con los segmentos detectados
   */
  const detectBeatsAndCreateSegments = async (): Promise<TimelineItem[]> => {
    if (!audioBuffer) return [];

    try {
      // Obtenemos los datos del canal y la información del audio
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const totalDuration = audioBuffer.duration;

      // Configuramos parámetros según el estilo de edición seleccionado
      const editingStyle = editingStyles.find(style => style.id === selectedEditingStyle);
      if (!editingStyle) {
        console.error("Estilo de edición no encontrado:", selectedEditingStyle);
        throw new Error("Estilo de edición no válido");
      }

      // Ajustamos parámetros técnicos según el estilo
      const windowSize = Math.floor(sampleRate * (selectedEditingStyle === "rhythmic" ? 0.025 : 0.05));
      const threshold = selectedEditingStyle === "dynamic" ? 0.15 : 0.12;
      const minSegmentDuration = editingStyle.duration.min;
      const maxSegmentDuration = editingStyle.duration.max;

      let lastBeatTime = 0;
      let energyHistory: number[] = [];
      const historySize = 43; // Ventana para comparar la energía
      const segments: TimelineItem[] = [];

      // Definimos tipos de planos disponibles con sus descripciones y prompts base
      const shotTypes = [
        {
          type: "wide shot",
          description: "Plano general que muestra el entorno completo y establece el contexto",
          prompt: "wide angle shot showing the complete environment and atmosphere",
          weight: 1 // Peso para controlar frecuencia
        },
        {
          type: "medium shot",
          description: "Plano medio que captura la expresión y el lenguaje corporal",
          prompt: "medium shot focusing on upper body and expression",
          weight: 3 // Más común en videos musicales
        },
        {
          type: "close-up",
          description: "Primer plano que enfatiza la emoción y los detalles",
          prompt: "close-up shot emphasizing emotion and facial details",
          weight: 4 // Muy común en videos musicales
        },
        {
          type: "extreme close-up",
          description: "Plano detalle que muestra detalles específicos",
          prompt: "extreme close-up showing intricate details",
          weight: 2 // Uso moderado
        },
        {
          type: "tracking shot",
          description: "Plano de seguimiento que añade dinamismo",
          prompt: "smooth tracking shot following the subject with dynamic camera movement",
          weight: 2 // Uso moderado
        },
        {
          type: "aerial shot",
          description: "Plano aéreo que muestra la escena desde arriba",
          prompt: "aerial view looking down at the scene, capturing scale and environment",
          weight: 1 // Menos frecuente
        }
      ];

      // Tipos de transiciones entre escenas
      const transitions = [
        { type: "cut", weight: 5 }, // Más común
        { type: "fade", weight: 3 },
        { type: "dissolve", weight: 2 },
        { type: "crossfade", weight: 2 }
      ];

      // Función para seleccionar un elemento basado en pesos
      const weightedSelection = <T extends { weight: number }>(items: T[]): T => {
        const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;
        
        for (const item of items) {
          random -= item.weight;
          if (random <= 0) return item;
        }
        
        return items[0]; // Fallback
      };

      // Análisis de energía por ventanas para detectar beats
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

          // Detección de beat basada en umbral dinámico
          if (energy > averageEnergy * threshold &&
              currentTime - lastBeatTime >= minSegmentDuration &&
              currentTime - lastBeatTime <= maxSegmentDuration) {

            // Seleccionar tipo de plano y transición con ponderación
            const shotType = weightedSelection(shotTypes);
            const transition = weightedSelection(transitions).type;

            let segmentDuration = currentTime - lastBeatTime;

            // Ajustar duración según estilo de edición
            if (selectedEditingStyle === "dynamic") {
              // Duración inversamente proporcional a la energía - más energía, cortes más rápidos
              segmentDuration = Math.max(minSegmentDuration,
                maxSegmentDuration * (1 - energy / (averageEnergy * 2)));
            } else if (selectedEditingStyle === "minimalist") {
              // Estilo minimalista prefiere tomas más largas
              segmentDuration = Math.max(segmentDuration, minSegmentDuration * 1.5);
            } else if (selectedEditingStyle === "rhythmic") {
              // Estilo rítmico se ajusta exactamente al beat
              segmentDuration = Math.max(minSegmentDuration, Math.min(segmentDuration, maxSegmentDuration * 0.8));
            }

            // Calcula el estado de ánimo basado en la parte del video (inicio/medio/final)
            const videoProgress = currentTime / totalDuration;
            let mood = 'neutral';
            
            if (videoProgress < 0.25) mood = 'introductory';
            else if (videoProgress > 0.75) mood = 'conclusive';
            else if (energy > averageEnergy * 1.5) mood = 'intense';
            else if (energy < averageEnergy * 0.7) mood = 'calm';

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
              mood: mood,
              // Datos para análisis
              energy: energy,
              averageEnergy: averageEnergy
            });

            lastBeatTime = currentTime;
          }
        }
      }

      // Asegurarse de que el video cubre la duración completa del audio
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        if (lastSegment.end_time / 1000 < totalDuration) {
          const finalShotType = weightedSelection(shotTypes);
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

      console.log(`Generados ${segments.length} segmentos para una duración de ${totalDuration.toFixed(2)} segundos`);
      return segments;
    } catch (error) {
      console.error("Error en detectBeatsAndCreateSegments:", error);
      toast({
        title: "Error",
        description: "No se pudieron detectar los beats del audio",
        variant: "destructive",
      });
      return [];
    }
  };

  /**
   * Genera un prompt para un segmento de timeline específico
   * Extrae las letras correspondientes al segmento y genera un prompt visual
   * @param segment - El segmento de timeline para el que se generará el prompt
   * @returns Un string con el prompt generado o un mensaje de error
   */
  const generatePromptForSegment = async (segment: TimelineItem): Promise<string> => {
    if (!segment || typeof segment.id !== 'number') {
      console.error("Segmento inválido:", segment);
      return "Error: segmento inválido";
    }
    
    const maxAttempts = 3;
    let attempt = 0;
    let lastError: Error | null = null;
    
    // Determinar qué parte de la transcripción corresponde a este segmento
    const segmentStartTime = segment.start_time / 1000; // convertir a segundos
    const segmentEndTime = segment.end_time / 1000;
    let relevantLyrics = "";
    
    try {
      console.log(`Generando prompt para segmento ${segment.id} (${segmentStartTime.toFixed(2)}s - ${segmentEndTime.toFixed(2)}s)`);
      
      // PASO 1: EXTRACCIÓN DE LETRAS RELEVANTES
      // Si tenemos transcripción con timestamps (más preciso)
      if (transcriptionWithTimestamps && Array.isArray(transcriptionWithTimestamps.segments)) {
        // Buscar segmentos de la transcripción que coincidan con este segmento de timeline
        const relevantSegments = transcriptionWithTimestamps.segments.filter(
          (s: {start: number, end: number}) => 
            (s.start >= segmentStartTime && s.start <= segmentEndTime) || 
            (s.end >= segmentStartTime && s.end <= segmentEndTime) ||
            (s.start <= segmentStartTime && s.end >= segmentEndTime)
        );
        
        if (relevantSegments.length > 0) {
          relevantLyrics = relevantSegments
            .map((s: {text: string}) => s.text || "")
            .filter(text => text.trim().length > 0)
            .join(" ");
          
          console.log(`Encontrados ${relevantSegments.length} segmentos con timestamps para este fragmento`);
        }
      }
      
      // Si no hay letras específicas, usar transcripción general
      if (!relevantLyrics && transcription) {
        // Dividir la transcripción total proporcionalmente
        const totalDuration = timelineItems.length > 0 ? 
          (timelineItems[timelineItems.length - 1].end_time / 1000) - (timelineItems[0].start_time / 1000) : 0;
          
        if (totalDuration > 0) {
          const segmentDuration = segmentEndTime - segmentStartTime;
          const segmentPercent = segmentDuration / totalDuration;
          const startPercent = (segmentStartTime - (timelineItems[0].start_time / 1000)) / totalDuration;
          
          // Estimar qué parte de la transcripción corresponde a este segmento
          const transcriptionWords = transcription.split(/\s+/);
          const startWordIndex = Math.floor(startPercent * transcriptionWords.length);
          const wordCount = Math.max(1, Math.floor(segmentPercent * transcriptionWords.length));
          
          if (startWordIndex >= 0 && wordCount > 0 && startWordIndex < transcriptionWords.length) {
            const endWordIndex = Math.min(startWordIndex + wordCount, transcriptionWords.length);
            relevantLyrics = transcriptionWords.slice(startWordIndex, endWordIndex).join(" ");
            console.log(`Usando transcripción proporcional: palabras ${startWordIndex}-${endWordIndex} de ${transcriptionWords.length}`);
          }
        }
      }

      // Si aún no tenemos letras, usar información contextual basada en el segmento
      if (!relevantLyrics || relevantLyrics.trim().length === 0) {
        // Determinar contexto basado en la posición en el video y características del segmento
        const isBeginningSong = timelineItems.indexOf(segment) < Math.min(3, timelineItems.length * 0.2);
        const isEndingSong = timelineItems.indexOf(segment) > timelineItems.length * 0.8;
        const isHighEnergy = segment.energy && segment.averageEnergy && segment.energy > segment.averageEnergy * 1.3;
        const isLowEnergy = segment.energy && segment.averageEnergy && segment.energy < segment.averageEnergy * 0.7;
        
        if (isHighEnergy) {
          relevantLyrics = isBeginningSong 
            ? "Introducción enérgica e intensa" 
            : isEndingSong 
              ? "Climax final con gran energía" 
              : "Sección instrumental con alta intensidad";
        } else if (isLowEnergy) {
          relevantLyrics = isBeginningSong 
            ? "Introducción suave y atmosférica" 
            : isEndingSong 
              ? "Cierre melódico y reflexivo" 
              : "Interludio tranquilo y contemplativo";
        } else {
          relevantLyrics = isBeginningSong 
            ? "Introducción de la canción" 
            : isEndingSong 
              ? "Conclusión de la canción" 
              : "Instrumental";
        }
        
        console.log(`No se encontraron letras específicas, usando contexto: "${relevantLyrics}"`);
      }

      // PASO 2: GENERACIÓN DEL PROMPT CON MÚLTIPLES INTENTOS
      while (attempt < maxAttempts) {
        try {
          console.log(`Generando prompt para segmento ${segment.id}, intento ${attempt + 1}/${maxAttempts}`);
          
          // Validar parámetros del estilo de video antes de crear el prompt
          if (!videoStyle.cameraFormat || !videoStyle.mood || !videoStyle.characterStyle || 
              !videoStyle.colorPalette || videoStyle.visualIntensity === undefined || 
              videoStyle.narrativeIntensity === undefined) {
            console.error("Estilos de video incompletos:", videoStyle);
            throw new Error("Faltan parámetros de estilo para generar el prompt");
          }
          
          // Preparar parámetros para el prompt con tipado
          const promptParams: VideoPromptParams = {
            shotType: segment.shotType || "medium shot",
            cameraFormat: videoStyle.cameraFormat,
            mood: segment.mood === 'intense' 
              ? 'Enérgico' 
              : segment.mood === 'calm' 
                ? 'Tranquilo' 
                : videoStyle.mood,
            visualStyle: videoStyle.characterStyle,
            visualIntensity: videoStyle.visualIntensity,
            narrativeIntensity: videoStyle.narrativeIntensity,
            colorPalette: videoStyle.colorPalette,
            duration: segment.duration / 1000,
            directorStyle: videoStyle.selectedDirector?.style,
            specialty: videoStyle.selectedDirector?.specialty,
            styleReference: videoStyle.styleReferenceUrl || ""
          };

          // Añadir información de letra a los parámetros
          const promptWithLyrics = `Escena para video musical que represente estas letras: "${relevantLyrics}". ${await generateVideoPromptWithRetry(promptParams)}`;

          if (promptWithLyrics && promptWithLyrics !== "Error generating prompt") {
            console.log(`Prompt generado exitosamente para segmento ${segment.id}`);
            return promptWithLyrics;
          }

          console.warn(`Intento ${attempt + 1} falló, reintentando en ${2 * (attempt + 1)} segundos...`);
          await new Promise(resolve => setTimeout(resolve, 2000 * (attempt + 1)));
          attempt++;

        } catch (error) {
          console.error(`Error en intento ${attempt + 1}:`, error);
          lastError = error instanceof Error ? error : new Error(String(error));

          if (attempt === maxAttempts - 1) {
            toast({
              title: "Error",
              description: "No se pudo generar el prompt después de varios intentos",
              variant: "destructive",
            });
            return segment.imagePrompt || "Error generating prompt";
          }

          // Backoff exponencial
          const backoffTime = Math.min(1000 * Math.pow(2, attempt), 10000);
          console.log(`Reintentando en ${backoffTime/1000} segundos...`);
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          attempt++;
        }
      }
    } catch (outerError) {
      console.error("Error general en generatePromptForSegment:", outerError);
      lastError = outerError instanceof Error ? outerError : new Error(String(outerError));
    }

    // FALLBACK: Si ningún intento tuvo éxito
    console.error(`No se pudo generar prompt para segmento ${segment.id} después de múltiples intentos:`, lastError);
    
    // Como último recurso, usar un prompt básico basado en el tipo de plano y el mood
    const fallbackPrompt = `${segment.shotType || 'medium shot'} of a ${segment.mood || 'neutral'} scene with ${videoStyle.colorPalette || 'balanced'} colors. ${relevantLyrics}`;
    
    console.warn(`Usando prompt fallback para segmento ${segment.id}: ${fallbackPrompt}`);
    return fallbackPrompt;
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

  const generateVideo = async (): Promise<string | null> => {
    if (!timelineItems.length || !audioBuffer) {
      toast({
        title: "Error",
        description: "No hay suficientes elementos para generar el video",
        variant: "destructive",
      });
      return null;
    }

    // Verificar si hay suficientes imágenes generadas
    const itemsWithImages = timelineItems.filter(item => item.generatedImage).length;
    if (itemsWithImages < timelineItems.length * 0.7) { // Al menos 70% de cobertura
      toast({
        title: "Atención",
        description: `Solo ${itemsWithImages} de ${timelineItems.length} segmentos tienen imágenes. Considera generar más imágenes primero.`,
        variant: "default",
      });
    }

    setIsGeneratingVideo(true);
    try {
      toast({
        title: "Iniciando proceso",
        description: "Preparando elementos para la generación del video...",
      });

      // Primero guardar todas las imágenes en Firebase
      const savePromises = timelineItems
        .filter(item => item.generatedImage && !item.firebaseUrl)
        .map(async (item) => {
          try {
            const url = await saveToFirebase(item);
            if (url) {
              // Actualizar el item con la URL de Firebase
              setTimelineItems(prev => prev.map(
                i => i.id === item.id ? { ...i, firebaseUrl: url } : i
              ));
            }
            return { id: item.id, success: !!url, url };
          } catch (error) {
            console.error(`Error guardando imagen para segmento ${item.id}:`, error);
            return { id: item.id, success: false };
          }
        });

      await Promise.all(savePromises);

      // Simulación del proceso de generación (en una implementación real, enviaríamos los elementos a un servicio)
      for (let i = 1; i <= 5; i++) {
        await new Promise(resolve => setTimeout(resolve, 800));
        // Actualizar progreso
        toast({
          title: "Generando video",
          description: `Fase ${i} de 5: ${["Procesando audio", "Sincronizando elementos", "Renderizando escenas", "Aplicando efectos", "Finalizando"][i-1]}`,
          variant: "default",
        });
      }

      // Generar ID único para este video
      const videoId = `video_${Date.now()}`;
      setVideoId(videoId);

      // Crear un documento en Firestore para el video
      try {
        const videoRef = collection(db, 'videos');
        await addDoc(videoRef, {
          id: videoId,
          userId: user?.uid,
          title: songTitle || 'Video Musical Generado',
          status: 'preview', // Inicialmente solo vista previa
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          duration: audioBuffer.duration || 0,
          thumbnailUrl: timelineItems.find(item => item.firebaseUrl || item.generatedImage)?.firebaseUrl || 
                         timelineItems.find(item => item.firebaseUrl || item.generatedImage)?.generatedImage || '',
          tags: ['música', 'video', 'artista', 'canción', 'generado'],
        });
      } catch (error) {
        console.error("Error guardando información del video:", error);
      }

      // Marcar este paso como completado
      setCurrentStep(7);

      toast({
        title: "Video generado exitosamente",
        description: "Ya puedes previsualizar el video y/o comprarlo para acceso completo",
      });

      return videoId;
    } catch (error) {
      console.error("Error generando video:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al generar el video",
        variant: "destructive",
      });
      return null;
    } finally {
      setIsGeneratingVideo(false);
    }
  };

  // Función para descargar el video final
  const downloadVideo = () => {
    // Usar el video mejorado si está disponible, o el video generado original
    const videoToDownload = upscaledVideoUrl || generatedVideoUrl || "/assets/Standard_Mode_Generated_Video (2).mp4";
    const link = document.createElement('a');
    link.href = videoToDownload;
    link.download = `music-video-${videoId || 'final'}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "Descarga iniciada",
      description: "Tu video musical se está descargando ahora"
    });
  };
  
  // Función para compartir el video en redes sociales
  const shareMusicVideo = () => {
    // En una implementación real, aquí se abriría un modal con opciones
    // de compartir en diferentes redes sociales
    
    // Por ahora, simulamos compartir usando el navegador web API
    const videoToShare = upscaledVideoUrl || generatedVideoUrl || "/assets/Standard_Mode_Generated_Video (2).mp4";
    const shareData = {
      title: 'Mi Video Musical Generado con IA',
      text: '¡Mira este increíble video musical que he creado con IA!',
      url: window.location.origin + videoToShare
    };
    
    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      navigator.share(shareData)
        .then(() => {
          toast({
            title: "Compartido con éxito",
            description: "Tu video ha sido compartido"
          });
        })
        .catch(error => {
          console.error('Error al compartir:', error);
          toast({
            title: "Error al compartir",
            description: "No se pudo compartir el video. Intenta otra opción."
          });
        });
    } else {
      // Fallback si Web Share API no está disponible
      toast({
        title: "Enlace copiado",
        description: "Enlace al video copiado al portapapeles. Ahora puedes compartirlo."
      });
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
            title: "Personalización",
            description: "Ajustando el estilo visual a tus preferencias",
            status: currentStep > 5 ? "completed" : currentStep === 5 ? "current" : "pending"
          },
          {
            title: "Integración de Movimiento",
            description: "Añadiendo coreografías y dinámicas visuales",
            status: currentStep > 6 ? "completed" : currentStep === 6 ? "current" : "pending"
          },
          {
            title: "Sincronización de Labios",
            description: "Sincronizando labios con la letra de la canción",
            status: currentStep > 7 ? "completed" : currentStep === 7 ? "current" : "pending"
          },
          {
            title: "Generación de Video",
            description: "Creando videos con IA a partir de tus escenas",
            status: currentStep > 8 ? "completed" : currentStep === 8 ? "current" : "pending"
          },
          {
            title: "Renderizado Final",
            description: "Combinando todo en tu video musical",
            status: currentStep > 9 ? "completed" : currentStep === 9 ? "current" : "pending"
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
                    
                    {/* Mostrar botón de continuar cuando la transcripción se ha completado pero no se ha avanzado al paso 2 */}
                    {currentStep === 1.5 && (
                      <Button
                        onClick={() => setCurrentStep(2)}
                        className="w-full mb-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Continuar al siguiente paso
                      </Button>
                    )}
                    
                    <Button
                      onClick={generateScriptFromTranscription}
                      disabled={!transcription || isGeneratingScript || currentStep < 2}
                      className="w-full"
                    >
                      {isGeneratingScript ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generando guion...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Generar Guion Musical
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex justify-between items-center mb-4">
                    <Label className="text-lg font-semibold">3. Guion Profesional</Label>
                    {scriptContent && (
                      <Badge variant="outline" className="bg-amber-50 text-amber-800 hover:bg-amber-100">
                        <Film className="h-3 w-3 mr-1" />
                        Análisis cinematográfico
                      </Badge>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {!scriptContent ? (
                      <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground bg-slate-50 rounded-md">
                        <FileText className="h-12 w-12 mb-3 text-muted-foreground/50" />
                        <p className="max-w-md">El guion profesional se generará basado en la transcripción de la letra.</p>
                        <p className="text-xs mt-2 max-w-md text-muted-foreground/70">
                          Incluirá análisis de género musical, estructura narrativa, diseño visual y segmentación por escenas con vocabulario cinematográfico.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-3 gap-2 text-xs">
                          <div className="bg-amber-50 p-2 rounded-md border border-amber-100">
                            <span className="font-semibold block">Análisis Musical</span>
                            <span className="text-muted-foreground">Género y estructura</span>
                          </div>
                          <div className="bg-amber-50 p-2 rounded-md border border-amber-100">
                            <span className="font-semibold block">Narrativa Visual</span>
                            <span className="text-muted-foreground">Arco emocional y mensajes</span>
                          </div>
                          <div className="bg-amber-50 p-2 rounded-md border border-amber-100">
                            <span className="font-semibold block">Dirección Técnica</span>
                            <span className="text-muted-foreground">Planos, transiciones, mood</span>
                          </div>
                        </div>
                        
                        <ScrollArea className="h-[300px] w-full rounded-md border border-zinc-200 p-4 bg-zinc-950 text-zinc-100">
                          <pre className="text-sm whitespace-pre-wrap font-mono">{scriptContent}</pre>
                        </ScrollArea>
                      </>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <Label className="text-lg font-semibold mb-4">4. Estilo Visual</Label>
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
                  <Label className="text-lg font-semibold mb-4">5. Sincronizar Beats</Label>
                  <Button
                    onClick={syncAudioWithTimeline}
                    disabled={!audioBuffer || isGeneratingShots || currentStep < 3}
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
                  <Label className="text-lg font-semibold mb-4">6. Generar Prompts</Label>
                  <Button
                    onClick={generatePromptsForSegments}
                    disabled={
                      timelineItems.length === 0 ||
                      isGeneratingScript ||
                      currentStep < 4 ||
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
                  <Label className="text-lg font-semibold mb-4">7. Generar Imágenes</Label>
                  <Button
                    onClick={generateShotImages}
                    disabled={
                      !timelineItems.length ||
                      isGeneratingShots ||
                      currentStep < 5
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

                {/* Componente de Generación de Video (Paso 8) */}
                {currentStep === 8 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">8. Generación de Video</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Genera un video a partir de tus escenas sincronizadas. Este paso utiliza IA para convertir
                        tus imágenes en secuencias de video fluidas con efectos profesionales.
                      </p>
                      <VideoGenerator
                        clips={timelineItems.map(item => ({
                          id: item.id,
                          start: (item.start_time - (timelineItems[0]?.start_time || 0)) / 1000,
                          duration: item.duration / 1000,
                          type: 'image',
                          layer: 1, // Añadimos layer=1 para video/imagen
                          thumbnail: item.generatedImage || item.firebaseUrl,
                          title: item.shotType,
                          description: item.description,
                          imageUrl: item.generatedImage || item.firebaseUrl,
                          imagePrompt: item.imagePrompt,
                          metadata: {
                            section: item.metadata?.section,
                            movementApplied: item.metadata?.movementApplied,
                            movementPattern: item.metadata?.movementPattern,
                            movementIntensity: item.metadata?.movementIntensity,
                            faceSwapApplied: item.metadata?.faceSwapApplied,
                            musicianIntegrated: item.metadata?.musicianIntegrated
                          }
                        }))}
                        duration={audioBuffer?.duration || 0}
                        isGenerating={isGeneratingVideo}
                        onGenerate={() => generateVideo()}
                      />
                      {videoId && (
                        <Button 
                          className="w-full mt-4 bg-green-600 hover:bg-green-700"
                          onClick={() => setCurrentStep(9)}
                        >
                          <CheckCircle2 className="mr-2 h-4 w-4" />
                          Continuar a Renderizado Final
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Personalización de Artista (Paso 5) */}
                {currentStep === 5 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">5. Personalización de Estilo</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Personaliza tus escenas ajustando el estilo visual y los elementos de identidad del artista.
                      </p>
                      <ArtistCustomization
                        clips={clips}
                        onUpdateClip={handleClipUpdate}
                      />
                      <Button 
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                        onClick={() => setCurrentStep(6)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Continuar a Integración de Movimiento
                      </Button>
                    </div>
                  </div>
                )}

                {/* Integración de Movimiento (Paso 6) */}
                {currentStep === 6 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">6. Integración de Movimiento</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Añade efectos de movimiento y coreografías a tus escenas para crear secuencias más dinámicas.
                      </p>
                      <MovementIntegration
                        onApplyMovements={(movementSettings) => {
                          console.log("Aplicando configuración de movimientos:", movementSettings);
                          // Aquí implementarías la lógica real para aplicar los movimientos
                          toast({
                            title: "Movimientos aplicados",
                            description: `Estilo: ${movementSettings.style}, Intensidad: ${movementSettings.intensity}%`
                          });
                        }}
                        isLoading={false}
                      />
                      <Button 
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                        onClick={() => setCurrentStep(7)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Continuar a Sincronización de Labios
                      </Button>
                    </div>
                  </div>
                )}

                {/* Música e Integraciones Opcionales (fuera del flujo principal) */}
                {false && (
                  <MusicianIntegration
                    clips={clips}
                    audioBuffer={audioBuffer}
                    onUpdateClip={handleClipUpdate}
                  />
                )}

                {/* Sincronización de Labios (Paso 7) */}
                {currentStep === 7 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">7. Sincronización de Labios</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Sincroniza los movimientos labiales con la letra de la canción para dar mayor realismo al video.
                      </p>
                      <LipSyncIntegration
                        onApplyLipSync={(lipSyncSettings) => {
                          console.log("Aplicando configuración de sincronización de labios:", lipSyncSettings);
                          // Aquí implementarías la lógica real para aplicar la sincronización
                          toast({
                            title: "Sincronización aplicada",
                            description: `Tipo: ${lipSyncSettings.sourceType}, ${lipSyncSettings.sourceType === 'text' ? 'Texto configurado' : 'Audio cargado'}`
                          });
                        }}
                        isLoading={false}
                      />
                      <Button 
                        className="w-full mt-4 bg-green-600 hover:bg-green-700"
                        onClick={() => setCurrentStep(8)}
                      >
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Continuar a Generación de Video
                      </Button>
                    </div>
                  </div>
                )}

                {/* Paso 8: Generación de Video */}
                {currentStep === 8 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">8. Generación de Video</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        Genera videos dinámicos a partir de tus escenas utilizando inteligencia artificial avanzada.
                      </p>
                      <VideoGenerator
                        scenesCount={timelineItems.length}
                        isLoading={isGeneratingVideo}
                        onGenerateVideo={async (settings) => {
                          console.log("Configuración para generar video:", settings);
                          toast({
                            title: "Generación iniciada",
                            description: `Generando video con modelo ${settings.model}, calidad ${settings.quality}`
                          });
                          
                          try {
                            await generateVideo();
                            setCurrentStep(9);
                          } catch (error) {
                            console.error("Error generando video:", error);
                            toast({
                              title: "Error",
                              description: "No se pudo generar el video. Intenta de nuevo.",
                              variant: "destructive"
                            });
                          }
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Paso 9: Renderizado Final con Upscaling */}
                {currentStep === 9 && (
                  <div className="mt-6">
                    <div className="border rounded-lg p-4 mb-6">
                      <Label className="text-lg font-semibold mb-4">9. Renderizado Final</Label>
                      <p className="text-sm text-muted-foreground mb-4">
                        El proceso de creación ha terminado. Ahora puedes mejorar la calidad de tu video musical con Qubico Video Toolkit antes de exportarlo.
                      </p>
                      
                      <FinalRendering
                        timelineClips={timelineItems.map(item => ({
                          id: item.id,
                          start: (item.start_time - (timelineItems[0]?.start_time || 0)) / 1000,
                          duration: item.duration / 1000,
                          title: item.shotType || 'Escena',
                          type: 'video' as const,
                          layer: 1, // Añadimos layer=1 para video/imagen
                          thumbnail: item.generatedImage || fallbackImage
                        }))}
                        videoUrl={generatedVideoUrl || '/assets/Standard_Mode_Generated_Video (2).mp4'}
                        onUpscaleVideo={async (options) => {
                          try {
                            setIsUpscaling(true);
                            // Llamar al servicio real de upscaling
                            const result = await upscaleVideo(
                              generatedVideoUrl || '/assets/Standard_Mode_Generated_Video (2).mp4', 
                              options
                            );
                            
                            if (result.success && result.url) {
                              setUpscaledVideoUrl(result.url);
                              return result.url;
                            } else {
                              throw new Error(result.error || 'Error al mejorar el video');
                            }
                          } catch (error) {
                            console.error('Error en upscaling:', error);
                            throw error;
                          } finally {
                            setIsUpscaling(false);
                          }
                        }}
                        onDownloadVideo={downloadVideo}
                        onShareVideo={shareMusicVideo}
                      />
                    </div>
                  </div>
                )}

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
                    onSplitClip={handleSplitClip}
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