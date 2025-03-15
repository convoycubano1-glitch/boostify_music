import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { Textarea } from "../ui/textarea";
import { TimelineEditor } from "./TimelineEditor";
import type { TimelineClip } from "./TimelineEditor";
import { TimelineClipUnified, ensureCompatibleClip, TimelineItem } from "../timeline/TimelineClipUnified";
import { Slider } from "../ui/slider";
import { Card } from "../ui/card";
import Editor from "@monaco-editor/react";
import {
  Video, Loader2, Music2, Image as ImageIcon, Download, Play, Pause,
  ZoomIn, ZoomOut, SkipBack, FastForward, Rewind, Edit, RefreshCcw, Plus, RefreshCw,
  Film, CheckCircle2, Share, User, Upload, X, Check, Activity, ChevronUp, ChevronDown,
  Megaphone, Waves, HelpCircle
} from "lucide-react";
import { useToast } from "../../hooks/use-toast";
import { ScrollArea } from "../ui/scroll-area";
import { Badge } from "../ui/badge";
import { cn } from "../../lib/utils";
import * as fal from "@fal-ai/serverless-client";
import OpenAI from "openai";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../../firebase";
import { useAuth } from "../../lib/context/auth-context";
import { AnalyticsDashboard } from './analytics-dashboard';
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { VideoGenerator } from "./video-generator";
import { ArtistCustomization } from "./artist-customization";
import { MusicianIntegration } from "./musician-integration";
import { MovementIntegration } from "./movement-integration";
import { LipSyncIntegration } from "./lip-sync-integration";
import { FinalRendering, type UpscaleOptions } from "./final-rendering";
import { ProgressSteps } from "./progress-steps";
import { EnhancedProgressSteps, Step } from "./enhanced-progress-steps";
import { 
  ParticleSystem, 
  AnimatedGradient,
  GlowEffect
} from "./animation-effects";
import { 
  analyzeImage, 
  generateVideoPromptWithRetry, 
  generateMusicVideoScript,
  type VideoPromptParams 
} from "../../lib/api/openrouter";
import { upscaleVideo } from "../../lib/api/video-service";
import { generateVideoScript as generateVideoScriptAPI } from "../../lib/api/openrouter";
import { FileText } from "lucide-react";
import fluxService, { FluxModel, FluxTaskType } from "../../lib/api/flux/flux-service";

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

// Usamos la interfaz TimelineItem importada anteriormente
// No es necesario importarla de nuevo

// Usamos la interfaz TimelineItem importada para mantener compatibilidad
// Definimos un tipo específico para nuestra aplicación basado en TimelineItem
type MusicVideoTimelineItem = TimelineItem;

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
  const [beatsJsonData, setBeatsJsonData] = useState<string>("");
  const [showBeatDetails, setShowBeatDetails] = useState<boolean>(false);
  const [selectedBeatIndex, setSelectedBeatIndex] = useState<number | null>(null);
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
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
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
          seed: seed + (typeof item.id === 'string' ? parseInt(item.id, 10) || 0 : item.id)
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
      // Asegurarnos de que generatedImage sea una URL válida (string)
      const imageUrl = typeof item.generatedImage === 'string' ? item.generatedImage : '';
      if (!imageUrl) return null;
      
      const response = await fetch(imageUrl);
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

  // Calculamos un estimado de duración antes de generar los clips
  // para evitar la dependencia circular
  const estimatedDuration = useMemo(() => {
    // Si tenemos audioBuffer, usamos su duración como fuente principal
    if (audioBuffer) {
      return audioBuffer.duration;
    }
    
    // Si tenemos items de timeline, calculamos la duración en base a ellos
    if (timelineItems.length > 0) {
      const lastItem = timelineItems[timelineItems.length - 1];
      return (lastItem.end_time - timelineItems[0].start_time) / 1000; // Convertir a segundos
    }
    
    // Duración predeterminada si no hay otras fuentes
    return 180; // 3 minutos por defecto
  }, [audioBuffer, timelineItems]);

  // Mapa de clips organizados por capas para el editor profesional multicanal
  const clips: TimelineClip[] = useMemo(() => {
    console.log("🎬 Generando clips para timeline editor, items:", timelineItems.length);
    
    // Asegurar que siempre hay un clip de audio en la capa 0 si existe audioUrl
    const audioClips = audioUrl ? [
      ensureCompatibleClip({
        id: 9999, // ID especial para audio principal
        start: 0,
        duration: estimatedDuration, // Usamos la duración estimada
        type: 'audio' as const,
        layer: 0, // Capa de audio (0)
        title: 'Audio Principal',
        description: 'Pista de audio importada',
        audioUrl: audioUrl,
        visible: true,
        locked: false
      })
    ] : [];
    
    console.log("🔊 Audio importado:", audioUrl ? "SI" : "NO");
    
    // Mapear los items de timeline a clips visuales
    const visualClips = timelineItems.map(item => {
      // Determinar el tipo de clip basado en sus propiedades
      let clipType: 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text' = 'image';
      let clipLayer = 1; // Por defecto, capa de imagen (1)
      
      // Si tiene audioUrl, es un clip de audio adicional
      if (item.audioUrl) {
        clipType = 'audio';
        clipLayer = 0; // Capa de audio (0)
      } 
      // Si tiene textContent, es un clip de texto
      else if (item.metadata?.textContent) {
        clipType = 'text';
        clipLayer = 2; // Capa de texto (2)
      }
      // Si tiene movementApplied, es un clip con efecto
      else if (item.metadata?.movementApplied) {
        clipType = 'effect';
        clipLayer = 3; // Capa de efectos (3)
      }
      // Si tiene videoUrl o lipsyncVideoUrl, es un clip de video
      else if (item.videoUrl || item.metadata?.lipsync?.videoUrl || item.lipsyncVideoUrl) {
        clipType = 'video';
        clipLayer = 1; // Capa de video/imagen (1)
      }
      // Si es una imagen generada por IA (tiene generatedImage)
      else if (item.generatedImage) {
        clipType = 'image';
        clipLayer = 7; // Colocar imágenes generadas en la capa 7
        console.log(`🎨 Imagen generada detectada: ${item.id} - Asignando a capa 7`);
      }
      
      // URL del recurso: priorizar video, luego imagen
      const url = item.videoUrl || 
                  item.metadata?.lipsync?.videoUrl || 
                  item.lipsyncVideoUrl || 
                  item.generatedImage || 
                  item.firebaseUrl || 
                  '';
      
      console.log(`📍 Clip ${item.id} - Tipo: ${clipType}, Capa: ${clipLayer}, URL: ${url ? "SI" : "NO"}`);
      
      // Crear un objeto base con todas las propiedades necesarias
      const clipBase = {
        id: item.id,
        start: (item.start_time - timelineItems[0]?.start_time || 0) / 1000,
        duration: item.duration / 1000,
        // Usar tipo determinado (video, imagen, audio, texto, efecto)
        type: clipType,
        // Usar capa determinada (0=audio, 1=video/imagen, 2=texto, 3=efectos)
        layer: clipLayer,
        thumbnail: item.generatedImage || item.firebaseUrl,
        title: item.shotType || `Clip ${item.id}`,
        description: item.description || '',
        // Propiedades específicas por tipo
        imageUrl: (clipType === 'image') ? url : undefined,
        videoUrl: (clipType === 'video') ? url : undefined,
        audioUrl: (clipType === 'audio') ? item.audioUrl : undefined,
        textContent: (clipType === 'text') ? item.metadata?.textContent : undefined,
        // Estado de visibilidad y bloqueo
        visible: true,
        locked: false,
        // Metadatos para preservar el orden exacto del guion
        metadata: {
          sourceIndex: item.id,
          section: item.metadata?.section || 'default',
          movementApplied: !!item.metadata?.movementApplied,
          movementPattern: item.metadata?.movementPattern,
          movementIntensity: item.metadata?.movementIntensity,
          faceSwapApplied: !!item.metadata?.faceSwapApplied,
          // Preservar metadata de lipsync si existe
          lipsync: item.metadata?.lipsync
        }
      };
      
      // Usar ensureCompatibleClip para garantizar compatibilidad con la interfaz unificada
      return ensureCompatibleClip(clipBase);
    });
    
    // Combinar clips de audio con clips visuales
    return [...audioClips, ...visualClips];
  }, [timelineItems, audioUrl, estimatedDuration]);

  // Ahora podemos calcular la duración real basada en los clips
  const totalDuration = useMemo(() => {
    return clips.reduce((acc, clip) => Math.max(acc, clip.start + clip.duration), 0);
  }, [clips]);

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
          // Asegurarse de que el objeto metadata existe
          if (!updatedItem.metadata) {
            updatedItem.metadata = {};
          }
          
          // Actualizar el estado de lipsync en metadata
          updatedItem.metadata.lipsync = {
            ...(updatedItem.metadata.lipsync || {}),
            applied: updates.lipsyncApplied !== undefined ? updates.lipsyncApplied : false,
            timestamp: new Date().toISOString(),
          };
        }
        
        if (updates.lipsyncVideoUrl !== undefined) {
          // Asegurarse de que el objeto metadata existe
          if (!updatedItem.metadata) {
            updatedItem.metadata = {};
          }
          
          // Actualizar la URL del video en metadata
          updatedItem.metadata.lipsync = {
            ...(updatedItem.metadata.lipsync || {}),
            applied: true, // Cuando hay URL de video, siempre aplicamos lipsync
            videoUrl: updates.lipsyncVideoUrl,
            timestamp: new Date().toISOString(), // Añadir timestamp para seguimiento
          };
        }
        
        // Manejar el progreso de LipSync si está presente
        if (updates.lipsyncProgress !== undefined) {
          // Asegurarse de que el objeto metadata existe
          if (!updatedItem.metadata) {
            updatedItem.metadata = {};
          }
          
          // Actualizar el progreso en metadata
          updatedItem.metadata.lipsync = {
            ...(updatedItem.metadata.lipsync || {}),
            progress: updates.lipsyncProgress,
            applied: (updatedItem.metadata.lipsync?.applied === undefined) ? false : updatedItem.metadata.lipsync.applied,
          };
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
    // Creamos primero un objeto base TimelineItem
    const newClipBase: TimelineItem = {
      ...clipToSplit,
      id: newClipId,
      start_time: absoluteSplitTime,
      end_time: clipToSplit.end_time,
      start: (absoluteSplitTime - timelineItems[0].start_time) / 1000,
      duration: (clipToSplit.end_time - absoluteSplitTime) / 1000,
      // Conservar otros campos importantes
      title: `${clipToSplit.title} (parte 2)`,
    };
    
    // Aseguramos que el nuevo clip es compatible con TimelineClipUnified
    const newClip = ensureCompatibleClip(newClipBase);
    
    // Actualizar la lista de clips
    const updatedItems = timelineItems.map(item => {
      if (item.id === clipId) {
        // Actualizar el clip original (primera parte)
        const updatedItemBase = {
          ...item,
          duration: relativeStartInClip,
          end_time: absoluteSplitTime
        };
        // Asegurar que el clip original modificado también sea compatible con TimelineClipUnified
        return ensureCompatibleClip(updatedItemBase);
      }
      return item;
    });
    
    // Añadir el nuevo clip
    updatedItems.push(newClip);
    
    // Ordenar los clips por tiempo de inicio
    updatedItems.sort((a, b) => {
      // Compatibilidad con ambos formatos (TimelineItem y TimelineClipUnified)
      const aStart = 'start_time' in a ? a.start_time : a.start;
      const bStart = 'start_time' in b ? b.start_time : b.start;
      return aStart - bStart;
    });
    
    // Actualizar el estado
    setTimelineItems(updatedItems as TimelineItem[]);
    
    console.log(`Clip ${clipId} dividido en: ${clipId} y ${newClipId} en tiempo ${splitTime}s`);
  };

  /**
   * Detecta beats en el archivo de audio y crea segmentos para el timeline
   * Implementa un algoritmo de detección de beats basado en energía acústica
   * @returns Array de TimelineItem con los segmentos detectados
   */
  // Interfaz para los datos de beat detectados
  interface BeatData {
    time: number;      // Tiempo en segundos
    timecode: string;  // Timecode formateado
    energy: number;    // Nivel de energía
    intensity: number; // Intensidad normalizada (0-1)
    type: string;      // Tipo de beat (downbeat, beat, accent)
    isDownbeat: boolean; // Si es un beat principal o secundario
  }

  // Función para convertir segundos a timecode formateado (HH:MM:SS:FF)
  const secondsToTimecode = (seconds: number, fps: number = 30): string => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    const f = Math.floor((seconds - Math.floor(seconds)) * fps);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}:${f.toString().padStart(2, '0')}`;
  };

  // Función para generar archivo JSON con datos de beats
  const generateBeatsJSON = (beats: BeatData[], songMetadata: any): void => {
    // Calcular patrones rítmicos y estadísticas adicionales
    const totalBeats = beats.length;
    const downbeats = beats.filter(beat => beat.type === 'downbeat').length;
    const accents = beats.filter(beat => beat.type === 'accent').length;
    const regularBeats = beats.filter(beat => beat.type === 'beat').length;
    
    // Calcular tiempos entre beats para análisis de patrones
    const beatIntervals: number[] = [];
    let averageInterval = 0;
    
    if (beats.length > 1) {
      for (let i = 1; i < beats.length; i++) {
        const interval = beats[i].time - beats[i-1].time;
        beatIntervals.push(interval);
      }
      
      // Calcular intervalo promedio (para aproximar BPM)
      averageInterval = beatIntervals.reduce((sum, val) => sum + val, 0) / beatIntervals.length;
      
      // Estimar BPM basado en intervalo promedio
      const estimatedBPM = Math.round(60 / averageInterval);
      songMetadata.bpm = estimatedBPM;
    }
    
    const beatMapData = {
      metadata: {
        songTitle: songMetadata?.title || "Unknown Track",
        artist: songMetadata?.artist || "Unknown Artist",
        duration: songMetadata?.duration || 0,
        bpm: songMetadata?.bpm || 0,
        key: songMetadata?.key || "",
        generatedAt: new Date().toISOString(),
        // Información adicional sobre el análisis
        beatAnalysis: {
          totalBeats,
          beatTypes: {
            downbeats,
            accents,
            regularBeats
          },
          averageInterval,
          patternComplexity: calculatePatternComplexity(beatIntervals)
        }
      },
      beats: beats
    };
    
    // Convertir a JSON y almacenar en el estado
    const jsonData = JSON.stringify(beatMapData, null, 2);
    setBeatsJsonData(jsonData);
    
    console.log("Mapa de beats generado:", beatMapData);
  };
  
  // Función auxiliar para calcular la complejidad del patrón rítmico
  const calculatePatternComplexity = (intervals: number[]): string => {
    if (intervals.length === 0) return "N/A";
    
    // Calcular la desviación estándar de los intervalos
    const avg = intervals.reduce((sum, val) => sum + val, 0) / intervals.length;
    const squareDiffs = intervals.map(val => Math.pow(val - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((sum, val) => sum + val, 0) / squareDiffs.length;
    const stdDev = Math.sqrt(avgSquareDiff);
    
    // Normalizar la desviación estándar como porcentaje del promedio
    const variabilityFactor = (stdDev / avg) * 100;
    
    // Clasificar la complejidad basada en la variabilidad
    if (variabilityFactor < 10) return "Simple";
    if (variabilityFactor < 25) return "Moderado";
    if (variabilityFactor < 40) return "Complejo";
    return "Muy complejo";
  };
  
  // Función para descargar el mapa de beats como archivo JSON
  const downloadBeatsJSON = (): void => {
    if (!beatsJsonData) {
      toast({
        title: "Error",
        description: "No hay datos de beats disponibles para descargar",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const blob = new Blob([beatsJsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beats_${selectedFile?.name || 'track'}_timecodes.json`;
      a.click();
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Éxito",
        description: "Archivo de timecodes descargado correctamente",
      });
    } catch (error) {
      console.error("Error al descargar el archivo JSON:", error);
      toast({
        title: "Error",
        description: "No se pudo descargar el archivo JSON",
        variant: "destructive",
      });
    }
  };

  /**
   * Aplica todas las restricciones requeridas a los clips del timeline:
   * 1. Duración máxima de clips (5 segundos)
   * 2. Imágenes generadas por IA solo en capa 7
   * 3. No solapamiento de imágenes en la misma capa
   * @param clips Lista de clips a verificar
   * @returns Lista de clips con restricciones aplicadas
   */
  const enforceAllConstraints = (clips: TimelineItem[]): TimelineItem[] => {
    if (!clips || !clips.length) return [];
    
    // Crear una copia de los clips para no modificar los originales
    const processedClips = [...clips];
    const MAX_CLIP_DURATION = 5 * 1000; // 5 segundos en milisegundos
    
    // Ordenamos los clips por tiempo de inicio para facilitar la detección de solapamientos
    processedClips.sort((a, b) => {
      // Garantizar que los clips tienen la propiedad start_time
      const aStart = a.start_time;
      const bStart = b.start_time;
      return aStart - bStart;
    });
    
    // Recorremos todos los clips
    for (let i = 0; i < processedClips.length; i++) {
      const currentClip = processedClips[i];
      
      // 1. Restricción de duración - limitar a 5 segundos máximo
      // Asegurar que la duración esté definida
      const clipDuration = currentClip.duration || (currentClip.end_time - currentClip.start_time);
      
      if (clipDuration > MAX_CLIP_DURATION) {
        console.log(`Ajustando clip ${currentClip.id} de ${clipDuration}ms a ${MAX_CLIP_DURATION}ms`);
        currentClip.duration = MAX_CLIP_DURATION;
        currentClip.end_time = currentClip.start_time + MAX_CLIP_DURATION;
      }
      
      // 2. Restricción de capa para imágenes generadas por IA - siempre en capa 7
      if (currentClip.generatedImage || (currentClip.metadata && currentClip.metadata.isGeneratedImage)) {
        if (currentClip.group !== 7) {
          console.log(`Moviendo clip de imagen generada ${currentClip.id} a capa 7`);
          currentClip.group = 7;
        }
      }
      
      // 3. Prevenir solapamiento de clips en la misma capa
      // Solo necesitamos verificar contra los clips que siguen, ya que estamos ordenados
      for (let j = i + 1; j < processedClips.length; j++) {
        const nextClip = processedClips[j];
        
        // Si están en la misma capa y hay solapamiento
        if (currentClip.group === nextClip.group && 
            currentClip.end_time > nextClip.start_time) {
          
          console.log(`Detectado solapamiento entre clips ${currentClip.id} y ${nextClip.id} en capa ${currentClip.group}`);
          
          // Ajustar la duración del clip actual para evitar el solapamiento
          const newEndTime = nextClip.start_time;
          const newDuration = newEndTime - currentClip.start_time;
          
          // Solo aplicar el cambio si la nueva duración es razonable (más de 0.1 segundos)
          if (newDuration >= 100) {
            console.log(`Ajustando fin de clip ${currentClip.id} de ${currentClip.end_time}ms a ${newEndTime}ms`);
            currentClip.end_time = newEndTime;
            currentClip.duration = newDuration;
          }
          // Si la duración resultante es demasiado pequeña, movemos el clip siguiente
          else if (newDuration < 100) {
            // Calculamos el nuevo start_time para el clip siguiente
            const newStartTime = currentClip.end_time;
            console.log(`Ajustando inicio de clip ${nextClip.id} de ${nextClip.start_time}ms a ${newStartTime}ms`);
            nextClip.start_time = newStartTime;
            nextClip.duration = nextClip.end_time - newStartTime;
          }
        }
      }
    }
    
    return processedClips;
  };

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
      
      // Colección para almacenar todos los beats detectados
      const detectedBeats: BeatData[] = [];

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

      // Análisis de energía por ventanas para detectar beats de forma más precisa
      // Variable para almacenar la máxima energía para normalización
      let maxEnergy = 0;
      let allEnergyValues: number[] = [];
      
      // Primer pase: recopilar información de energía para normalización y estadísticas
      for (let i = 0; i < channelData.length; i += windowSize) {
        let sum = 0;
        for (let j = 0; j < windowSize; j++) {
          if (i + j < channelData.length) {
            sum += Math.abs(channelData[i + j]);
          }
        }
        const energy = sum / windowSize;
        allEnergyValues.push(energy);
        maxEnergy = Math.max(maxEnergy, energy);
      }
      
      // Calcular estadísticas de energía
      allEnergyValues.sort((a, b) => a - b);
      const medianEnergy = allEnergyValues[Math.floor(allEnergyValues.length / 2)];
      const p75Energy = allEnergyValues[Math.floor(allEnergyValues.length * 0.75)];
      
      // Ajustar threshold basado en estadísticas de energía si es necesario
      const adjustedThreshold = selectedEditingStyle === "dynamic" 
        ? threshold 
        : Math.max(threshold, medianEnergy * 1.5);
      
      console.log(`Estadísticas de energía: max=${maxEnergy.toFixed(4)}, mediana=${medianEnergy.toFixed(4)}, p75=${p75Energy.toFixed(4)}, threshold=${adjustedThreshold.toFixed(4)}`);
      
      // Segundo pase: detección de beats y construcción de segmentos
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
          
          // Normalizamos la energía para tener valores entre 0-1
          const normalizedEnergy = maxEnergy > 0 ? energy / maxEnergy : 0;

          // Detección de beat con umbral dinámico mejorado
          if (energy > averageEnergy * adjustedThreshold &&
              currentTime - lastBeatTime >= minSegmentDuration &&
              currentTime - lastBeatTime <= maxSegmentDuration) {
              
            // Determinar si es un downbeat (beat principal) basado en la energía relativa
            const isDownbeat = normalizedEnergy > 0.6 || energy > p75Energy * 1.2;

            // Determinar el tipo de beat basado en su intensidad y energía
            let beatType = "beat";
            if (isDownbeat) {
              beatType = "downbeat"; // Beat principal (más fuerte)
            } else if (normalizedEnergy > 0.4) {
              beatType = "accent"; // Beat con acento (medio)
            }
            
            // Almacenar datos del beat detectado con formato de timecode
            detectedBeats.push({
              time: currentTime,
              timecode: secondsToTimecode(currentTime),
              energy: energy,
              intensity: normalizedEnergy,
              type: beatType,
              isDownbeat: isDownbeat
            });

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

            // Aseguramos que la duración no exceda los 5 segundos (MAX_CLIP_DURATION de timeline-constants.ts)
            const maxDuration = 5; // 5 segundos como límite máximo
            if (segmentDuration > maxDuration) {
              segmentDuration = maxDuration;
              console.log(`Duración del segmento ajustada a ${maxDuration} segundos según límite máximo`);
            }
            
            // Creamos segmento base
            const segmentBase = {
              id: segments.length + 1,
              group: 7, // Colocamos las imágenes generadas en la capa 7 según especificación
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
              type: 'image' as const, // Usamos type assertion para asegurar compatibilidad
              mood: mood,
              // Datos para análisis
              energy: energy,
              averageEnergy: averageEnergy,
              // Información de timecode para sincronización
              timecode: secondsToTimecode(lastBeatTime),
              endTimecode: secondsToTimecode(lastBeatTime + segmentDuration),
              normalizedEnergy: normalizedEnergy,
              isDownbeat: isDownbeat,
              // Indicador de que es una imagen generada por IA
              metadata: {
                isGeneratedImage: true
              }
            };
            
            // Usamos ensureCompatibleClip para garantizar compatibilidad con TimelineClipUnified
            const compatibleClip = ensureCompatibleClip(segmentBase);
            // Convertimos a TimelineItem para mantener compatibilidad
            segments.push(compatibleClip.toTimelineItem());

            lastBeatTime = currentTime;
          }
        }
      }

      // Asegurarse de que el video cubre la duración completa del audio
      if (segments.length > 0) {
        const lastSegment = segments[segments.length - 1];
        if (lastSegment.end_time / 1000 < totalDuration) {
          const finalShotType = weightedSelection(shotTypes);
          
          // Verificar que la duración del segmento final no exceda el máximo permitido
          let finalSegmentDuration = (totalDuration * 1000) - lastSegment.end_time;
          const maxDurationMs = 5000; // 5 segundos en milisegundos
          
          if (finalSegmentDuration > maxDurationMs) {
            console.log(`Duración del segmento final ajustada de ${finalSegmentDuration}ms a ${maxDurationMs}ms según límite máximo`);
            finalSegmentDuration = maxDurationMs;
            // Ajustar también el tiempo de finalización
            const newEndTime = lastSegment.end_time + maxDurationMs;
            if (newEndTime < totalDuration * 1000) {
              // Si aún queda espacio después del segmento final ajustado, dejaremos un hueco
              console.log(`Ajuste de tiempo final: ${newEndTime}ms (tiempo total: ${totalDuration * 1000}ms)`);
            }
          }
          
          // Crear segmento final usando la misma estructura unificada
          const finalSegmentBase = {
            id: segments.length + 1,
            group: 7, // Colocamos las imágenes generadas en la capa 7 según especificación
            title: `Escena Final`,
            start_time: lastSegment.end_time,
            end_time: lastSegment.end_time + finalSegmentDuration,
            description: finalShotType.description,
            shotType: finalShotType.type,
            duration: finalSegmentDuration,
            transition: "fade",
            imagePrompt: finalShotType.prompt,
            // Campos adicionales para compatibilidad con TimelineClip
            start: lastSegment.end_time / 1000,
            type: 'image' as const,
            mood: 'conclusive',
            // Indicador de que es una imagen generada por IA
            metadata: {
              isGeneratedImage: true
            }
          };
          
          // Usar ensureCompatibleClip para garantizar compatibilidad
          const compatibleFinalClip = ensureCompatibleClip(finalSegmentBase);
          // Convertimos a TimelineItem para mantener compatibilidad
          segments.push(compatibleFinalClip.toTimelineItem());
        }
      }

      // Generar el mapa de beats con los datos de timecodes para exportación JSON
      const songMetadata = {
        title: selectedFile?.name || "Unknown Track",
        artist: "Artist",
        duration: totalDuration,
        bpm: 0, // Esto se podría calcular con los datos de beats
        key: "",
        generatedAt: new Date().toISOString()
      };
      
      // Generar el JSON con los beats detectados
      generateBeatsJSON(detectedBeats, songMetadata);
      
      // Aplicar todas las restricciones a los segmentos generados
      const processedSegments = enforceAllConstraints(segments);
      
      console.log(`Generados ${segments.length} segmentos y ${detectedBeats.length} beats detectados para una duración de ${totalDuration.toFixed(2)} segundos`);
      console.log(`Segmentos procesados con restricciones: ${processedSegments.length}`);
      return processedSegments;
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

  // Convertir los pasos para el componente EnhancedProgressSteps
  // Definir los pasos del workflow con el tipo Step importado
  const workflowSteps: Step[] = [
    {
      id: "transcription",
      name: "Transcripción de Audio",
      description: "Analizando y transcribiendo la letra de tu canción",
      status: currentStep > 1 ? "completed" : currentStep === 1 ? "in-progress" : "pending"
    },
    {
      id: "script",
      name: "Generación de Guion",
      description: "Creando un guion visual basado en la letra",
      status: currentStep > 2 ? "completed" : currentStep === 2 ? "in-progress" : "pending"
    },
    {
      id: "sync",
      name: "Sincronización",
      description: "Alineando el contenido visual con el ritmo musical",
      status: currentStep > 3 ? "completed" : currentStep === 3 ? "in-progress" : "pending"
    },
    {
      id: "scenes",
      name: "Generación de Escenas",
      description: "Creando escenas para cada sección",
      status: currentStep > 4 ? "completed" : currentStep === 4 ? "in-progress" : "pending"
    },
    {
      id: "customization",
      name: "Personalización",
      description: "Ajustando el estilo visual a tus preferencias",
      status: currentStep > 5 ? "completed" : currentStep === 5 ? "in-progress" : "pending"
    },
    {
      id: "movement",
      name: "Integración de Movimiento",
      description: "Añadiendo dinámicas visuales y coreografías",
      status: currentStep > 6 ? "completed" : currentStep === 6 ? "in-progress" : "pending"
    },
    {
      id: "lipsync",
      name: "Sincronización de Labios",
      description: "Sincronizando labios con la letra",
      status: currentStep > 7 ? "completed" : currentStep === 7 ? "in-progress" : "pending"
    },
    {
      id: "generation",
      name: "Generación de Video",
      description: "Creando clips de video con IA",
      status: currentStep > 8 ? "completed" : currentStep === 8 ? "in-progress" : "pending"
    },
    {
      id: "rendering",
      name: "Renderizado Final",
      description: "Combinando todo en un video musical completo",
      status: currentStep > 9 ? "completed" : currentStep === 9 ? "in-progress" : "pending"
    }
  ];

  // Calcular el progreso para las animaciones
  const allStepsCompleted = workflowSteps.every(step => step.status === "completed");
  
  return (
    <div className="min-h-screen bg-black">
      {/* Efectos visuales para toda la aplicación */}
      {allStepsCompleted && <motion.div className="confetti-container" />}
      
      {/* Sistema de partículas dinámicas basadas en el paso actual - Ajustadas a naranja/negro */}
      {currentStep === 1 && (
        <ParticleSystem 
          count={30} 
          currentStep={1}
          active={true}
        />
      )}
      
      {currentStep === 2 && (
        <ParticleSystem 
          count={40} 
          currentStep={2}
          active={true}
        />
      )}
      
      {currentStep === 3 && (
        <ParticleSystem 
          count={50} 
          currentStep={3}
          active={true}
        />
      )}
      
      {currentStep === 4 && (
        <ParticleSystem 
          count={60} 
          currentStep={4}
          active={true}
        />
      )}
      
      {currentStep === 6 && (
        <ParticleSystem 
          count={80} 
          currentStep={6}
          active={true}
        />
      )}
      
      {currentStep >= 8 && currentStep < 9 && (
        <ParticleSystem 
          count={120}
          currentStep={8}
          active={true}
        />
      )}
      
      {/* Contenedor principal con posicionamiento relativo para los efectos */}
      <div className="relative">
        {/* Gradiente animado en el fondo - Usando solo naranja y negro */}
        <AnimatedGradient 
          colors={
            currentStep <= 2 ? ["#FF6B00", "#FF8800", "#FF4500", "#111111"] :
            currentStep <= 4 ? ["#FF4500", "#FF8800", "#111111", "#222222"] :
            currentStep <= 6 ? ["#FF7700", "#FF5500", "#111111", "#222222"] :
            currentStep <= 8 ? ["#FF6B00", "#111111", "#FF4500", "#000000"] :
            ["#FF8800", "#FF4500", "#111111", "#000000"]
          } 
          speed={currentStep <= 2 ? 5 : currentStep <= 5 ? 8 : 12} 
          className="opacity-20"
        />
        
        {/* Efectos de brillo según la etapa del proceso */}
        {currentStep >= 5 && currentStep < 7 && (
          <GlowEffect 
            color="purple" 
            size={300} 
            x={25} 
            y={30} 
            pulsate={true} 
            className="opacity-10"
          />
        )}
        
        {currentStep >= 7 && (
          <GlowEffect 
            color="orange" 
            size={350} 
            x={75} 
            y={40} 
            pulsate={true} 
            className="opacity-15"
          />
        )}
        
        {/* Componente de pasos mejorado con animaciones */}
        <EnhancedProgressSteps
          steps={workflowSteps}
          currentStep={workflowSteps.find(s => s.status === "in-progress")?.id || "transcription"}
          showDescriptions={true}
        />
        
        {/* Mantener el ProgressSteps original como fallback (escondido para compatibilidad) */}
        <div className="hidden">
          <ProgressSteps 
            currentStep={String(currentStep)} 
            steps={[
              {
                id: "transcription",
                name: "Transcripción de Audio",
                description: "Analizando y transcribiendo la letra de tu canción",
                status: currentStep > 1 ? "completed" : currentStep === 1 ? "in-progress" : "pending"
              },
              {
                id: "script",
                name: "Generación de Guion",
                description: "Creando un guion visual basado en tu música",
                status: currentStep > 2 ? "completed" : currentStep === 2 ? "in-progress" : "pending"
              },
              {
                id: "sync",
                name: "Sincronización",
                description: "Sincronizando el video con el ritmo de la música",
                status: currentStep > 3 ? "completed" : currentStep === 3 ? "in-progress" : "pending"
              },
              {
                id: "scenes",
                name: "Generación de Escenas",
                description: "Creando las escenas del video musical",
                status: currentStep > 4 ? "completed" : currentStep === 4 ? "in-progress" : "pending"
              },
              {
                id: "customization",
                name: "Personalización",
                description: "Ajustando el estilo visual a tus preferencias",
                status: currentStep > 5 ? "completed" : currentStep === 5 ? "in-progress" : "pending"
              },
              {
                id: "movement",
                name: "Integración de Movimiento",
                description: "Añadiendo coreografías y dinámicas visuales",
                status: currentStep > 6 ? "completed" : currentStep === 6 ? "in-progress" : "pending"
              },
              {
                id: "lipsync",
                name: "Sincronización de Labios",
                description: "Sincronizando labios con la letra de la canción",
                status: currentStep > 7 ? "completed" : currentStep === 7 ? "in-progress" : "pending"
              },
              {
                id: "generation",
                name: "Generación de Video",
                description: "Creando videos con IA a partir de tus escenas",
                status: currentStep > 8 ? "completed" : currentStep === 8 ? "in-progress" : "pending"
              },
              {
                id: "rendering",
                name: "Renderizado Final",
                description: "Combinando todo en tu video musical",
                status: currentStep > 9 ? "completed" : currentStep === 9 ? "in-progress" : "pending"
              }
            ]}
          />
        </div>
      </div> {/* Cierre del div className="relative" */}

      <motion.div 
        className="container py-6 space-y-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.1
          }}
        >
          <Card className="p-6 relative overflow-hidden shadow-lg border-none">
            {/* Efectos decorativos múltiples en la esquina */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-radial from-orange-400/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-radial from-purple-500/15 to-transparent rounded-full -translate-y-1/3 translate-x-1/3 pointer-events-none" />
            
            {/* Línea decorativa animada - versión mejorada */}
            <motion.div 
              className="absolute bottom-0 left-0 h-1.5 bg-gradient-to-r from-orange-500 via-purple-500 to-blue-500 rounded-full"
              initial={{ width: "0%", opacity: 0.7 }}
              animate={{ 
                width: `${(currentStep / 9) * 100}%`,
                opacity: [0.7, 0.9, 0.7]
              }}
              transition={{ 
                width: { duration: 0.8, ease: "easeOut" },
                opacity: { duration: 2, repeat: Infinity, ease: "easeInOut" }
              }}
            />
            
            {/* Borde brillante animado en la parte superior */}
            <motion.div 
              className="absolute top-0 left-0 h-1 w-full bg-gradient-to-r from-blue-500/0 via-purple-500/30 to-orange-500/0"
              animate={{ 
                opacity: [0, 0.8, 0],
                left: ["-100%", "100%"]
              }}
              transition={{ 
                duration: 3, 
                repeat: Infinity, 
                ease: "easeInOut", 
                repeatDelay: 1
              }}
            />
            
          <div className="flex items-center gap-4 mb-6">
            <motion.div 
              className="h-14 w-14 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 flex items-center justify-center border border-orange-500/20 shadow-sm"
              whileHover={{ scale: 1.05 }}
              animate={{ 
                boxShadow: ["0 0 0 rgba(249, 115, 22, 0)", "0 0 12px rgba(249, 115, 22, 0.3)", "0 0 0 rgba(249, 115, 22, 0)"] 
              }}
              transition={{ 
                boxShadow: { duration: 2, repeat: Infinity, ease: "easeInOut" } 
              }}
            >
              <Video className="h-7 w-7 text-orange-500" />
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">
                Creador de Videos Musicales AI
              </h2>
              <p className="text-sm text-muted-foreground/90 tracking-wide">
                Transforma tu música en experiencias visuales cautivadoras
              </p>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6 order-2 lg:order-1">
              <motion.div 
                className="border rounded-lg overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black shadow-sm relative border-zinc-800"
                initial={{ opacity: 0, y: 20 }}
                animate={{ 
                  opacity: 1, 
                  y: 0,
                  boxShadow: currentStep >= 2 ? "0 0 0 2px rgba(249, 115, 22, 0.2)" : "none"
                }}
                transition={{ duration: 0.5 }}
              >
                {/* Indicador de paso completado */}
                {currentStep >= 2 && (
                  <motion.div 
                    className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20 }}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                  </motion.div>
                )}
                
                {/* Título con icono animado */}
                <div className="flex items-center gap-3 mb-4">
                  <motion.div 
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600"
                    whileHover={{ scale: 1.1 }}
                    animate={{ 
                      rotate: isTranscribing ? [0, 10, -10, 0] : 0
                    }}
                    transition={{ 
                      rotate: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                      scale: { duration: 0.2 }
                    }}
                  >
                    <Music2 className="h-4 w-4" />
                  </motion.div>
                  <Label className="text-lg font-semibold text-orange-500">1. Subir Audio</Label>
                </div>
                
                <div className="space-y-4">
                  <motion.div 
                    className="relative border-2 border-dashed border-orange-300 rounded-lg p-4 hover:border-orange-400 transition-colors bg-black/50"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <Input
                      type="file"
                      accept="audio/*"
                      onChange={handleFileChange}
                      disabled={isTranscribing}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="flex flex-col items-center justify-center gap-2 pointer-events-none">
                      <Upload className="h-8 w-8 text-orange-400 mb-1" />
                      <p className="font-medium text-sm text-center">Arrastra tu archivo de audio o haz clic para seleccionar</p>
                      <p className="text-xs text-muted-foreground text-center">Soporta MP3, WAV, FLAC, OGG y otros formatos de audio</p>
                    </div>
                  </motion.div>
                  
                  {selectedFile && (
                    <motion.div 
                      className="flex items-center gap-3 text-sm p-3 bg-orange-50 rounded-md border border-orange-100"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="bg-orange-100 rounded-full p-1.5">
                        <Music2 className="h-4 w-4 text-orange-600" />
                      </div>
                      <div className="flex-1 truncate">
                        <span className="font-medium">{selectedFile.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                        </span>
                      </div>
                    </motion.div>
                  )}
                  
                  {isTranscribing && (
                    <motion.div 
                      className="flex items-center gap-3 text-sm p-3 bg-blue-50 rounded-md"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.4 }}
                    >
                      <div className="bg-blue-100 rounded-full p-1.5 relative">
                        <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                        <motion.div 
                          className="absolute inset-0 rounded-full border-2 border-blue-300 border-t-blue-600"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        />
                      </div>
                      <div>
                        <span className="font-medium">Transcribiendo audio...</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          Procesando datos de voz con IA
                        </span>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>

              <div className="space-y-6">
                <motion.div 
                  className="border rounded-lg overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black shadow-sm relative border-zinc-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 3 ? "0 0 0 2px rgba(79, 70, 229, 0.2)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.1 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 3 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-4">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: isGeneratingScript ? [0, 10, -10, 0] : 0
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 1.5, ease: "easeInOut" },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <FileText className="h-4 w-4" />
                    </motion.div>
                    <Label className="text-lg font-semibold text-orange-500">2. Transcripción</Label>
                  </div>
                  
                  <div className="space-y-4">
                    <motion.div 
                      className="relative"
                      animate={{ opacity: 1 }}
                      initial={{ opacity: 0.8 }}
                      transition={{ duration: 0.3 }}
                    >
                      <ScrollArea className="h-[200px] w-full rounded-md border border-orange-500/20 bg-black/80 p-4 shadow-inner">
                        {transcription ? (
                          <motion.pre 
                            className="text-sm whitespace-pre-wrap font-normal text-slate-700"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5 }}
                          >
                            {transcription}
                          </motion.pre>
                        ) : (
                          <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                            <FileText className="h-8 w-8 mb-2 text-slate-400" />
                            <p className="text-sm text-slate-500">Sube un archivo de audio para ver la transcripción</p>
                          </div>
                        )}
                      </ScrollArea>
                    </motion.div>
                    
                    {/* Mostrar botón de continuar cuando la transcripción se ha completado pero no se ha avanzado al paso 2 */}
                    {currentStep === 1.5 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Button
                          onClick={() => setCurrentStep(2)}
                          className="w-full mb-2 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md"
                        >
                          <motion.div 
                            className="mr-2"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 1.5 }}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </motion.div>
                          Continuar al siguiente paso
                        </Button>
                      </motion.div>
                    )}
                    
                    <Button
                      onClick={generateScriptFromTranscription}
                      disabled={!transcription || isGeneratingScript || currentStep < 2}
                      className={cn(
                        "w-full group relative overflow-hidden transition-all",
                        transcription && !isGeneratingScript && currentStep >= 2 
                          ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-md" 
                          : ""
                      )}
                    >
                      {isGeneratingScript ? (
                        <motion.div className="flex items-center justify-center w-full">
                          <motion.div 
                            className="mr-2"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          >
                            <Loader2 className="h-4 w-4" />
                          </motion.div>
                          <span>Generando guion...</span>
                        </motion.div>
                      ) : (
                        <motion.div 
                          className="flex items-center justify-center w-full"
                          whileHover={{ scale: 1.02 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          <span>Generar Guion Musical</span>
                        </motion.div>
                      )}
                      
                      {/* Efecto de brillo al pasar el mouse */}
                      {transcription && !isGeneratingScript && currentStep >= 2 && (
                        <motion.div 
                          className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
                          animate={{ translateX: ["100%", "-100%"] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut", repeatDelay: 0.5 }}
                        />
                      )}
                    </Button>
                  </div>
                </motion.div>

                <motion.div 
                  className="border rounded-lg overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black shadow-sm relative border-zinc-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 4 ? "0 0 0 2px rgba(124, 58, 237, 0.2)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 4 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado y badge */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <motion.div 
                        className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600"
                        whileHover={{ scale: 1.1 }}
                        animate={scriptContent ? { 
                          scale: [1, 1.05, 1],
                          rotate: [0, 2, -2, 0]
                        } : {}}
                        transition={{ 
                          repeat: scriptContent ? Infinity : 0,
                          repeatDelay: 3,
                          duration: 1
                        }}
                      >
                        <Film className="h-4 w-4" />
                      </motion.div>
                      <Label className="text-lg font-semibold text-orange-500">3. Guion Profesional</Label>
                    </div>
                    
                    {scriptContent && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Badge variant="outline" className="bg-gradient-to-r from-amber-50 to-yellow-50 text-amber-800 hover:from-amber-100 hover:to-yellow-100 border-amber-200">
                          <Film className="h-3 w-3 mr-1" />
                          Análisis cinematográfico
                        </Badge>
                      </motion.div>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    {!scriptContent ? (
                      <motion.div 
                        className="flex flex-col items-center justify-center py-8 text-center rounded-md bg-gradient-to-b from-zinc-900 to-black border border-zinc-800 shadow-sm"
                        initial={{ opacity: 0.8 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div
                          animate={{ 
                            y: [0, -5, 0],
                            opacity: [0.5, 0.8, 0.5]
                          }}
                          transition={{ 
                            repeat: Infinity,
                            duration: 3,
                            ease: "easeInOut"
                          }}
                        >
                          <Film className="h-14 w-14 mb-3 text-purple-200" />
                        </motion.div>
                        <p className="max-w-md font-medium text-gray-600">El guion profesional se generará basado en la transcripción de la letra.</p>
                        <div className="mt-4 grid grid-cols-3 gap-3 max-w-lg">
                          <div className="flex flex-col items-center p-3 rounded-lg bg-purple-50/50 border border-purple-100">
                            <span className="text-xs font-semibold text-purple-800 mb-1">Estilo</span>
                            <span className="text-[10px] text-center text-purple-600">Análisis de género y estética</span>
                          </div>
                          <div className="flex flex-col items-center p-3 rounded-lg bg-amber-50/50 border border-amber-100">
                            <span className="text-xs font-semibold text-amber-800 mb-1">Arco</span>
                            <span className="text-[10px] text-center text-amber-600">Estructura narrativa</span>
                          </div>
                          <div className="flex flex-col items-center p-3 rounded-lg bg-blue-50/50 border border-blue-100">
                            <span className="text-xs font-semibold text-blue-800 mb-1">Técnica</span>
                            <span className="text-[10px] text-center text-blue-600">Dirección escénica</span>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                      >
                        <motion.div 
                          className="grid grid-cols-3 gap-2 text-xs mb-4"
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.5,
                            staggerChildren: 0.1
                          }}
                        >
                          <motion.div 
                            className="bg-gradient-to-br from-zinc-900 to-black p-3 rounded-md border border-orange-800/30 shadow-sm"
                            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(251, 191, 36, 0.1)" }}
                            transition={{ duration: 0.2 }}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <span className="font-semibold block text-orange-400">Análisis Musical</span>
                            <span className="text-orange-300">Género y estructura</span>
                          </motion.div>
                          <motion.div 
                            className="bg-gradient-to-br from-zinc-900 to-black p-3 rounded-md border border-orange-800/30 shadow-sm"
                            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(139, 92, 246, 0.1)" }}
                            transition={{ duration: 0.2 }}
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            
                          >
                            <span className="font-semibold block text-orange-400">Narrativa Visual</span>
                            <span className="text-orange-300">Arco emocional y mensajes</span>
                          </motion.div>
                          <motion.div 
                            className="bg-gradient-to-br from-zinc-900 to-black p-3 rounded-md border border-orange-800/30 shadow-sm"
                            whileHover={{ scale: 1.02, boxShadow: "0 4px 12px rgba(99, 102, 241, 0.1)" }}
                            transition={{ duration: 0.2 }}
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                          >
                            <span className="font-semibold block text-orange-400">Dirección Técnica</span>
                            <span className="text-orange-300">Planos, transiciones, mood</span>
                          </motion.div>
                        </motion.div>
                        
                        <motion.div
                          className="relative overflow-hidden rounded-lg"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.3, duration: 0.5 }}
                        >
                          {/* Efecto de resplandor superior */}
                          <motion.div 
                            className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-orange-400/0 via-orange-500/50 to-orange-400/0 z-10"
                            animate={{ 
                              opacity: [0.3, 0.7, 0.3]
                            }}
                            transition={{ 
                              duration: 3,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          />
                          
                          <ScrollArea className="h-[300px] w-full rounded-md border border-zinc-800 p-4 bg-gradient-to-b from-zinc-950 to-zinc-900 text-zinc-100 shadow-inner">
                            <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{scriptContent}</pre>
                          </ScrollArea>
                        </motion.div>
                      </motion.div>
                    )}
                  </div>
                </motion.div>

                <motion.div 
                  className="border rounded-lg overflow-hidden p-5 bg-gradient-to-br from-zinc-900 to-black shadow-sm relative border-zinc-800"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 5 ? "0 0 0 2px rgba(244, 63, 94, 0.2)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 5 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 text-orange-600"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: [0, -5, 5, 0],
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 5, ease: "easeInOut", repeatDelay: 1 },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <Label className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-orange-500">4. Estilo Visual</Label>
                      <p className="text-xs text-muted-foreground">Define la estética visual de tu video musical</p>
                    </div>
                  </div>
                  
                  <div className="grid gap-5">
                    <motion.div 
                      className="space-y-3"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-orange-900/80">Formato de Cámara</Label>
                        <motion.div 
                          className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"
                          whileHover={{ scale: 1.2, backgroundColor: "rgb(255 237 213 / 1)" }}
                          transition={{ duration: 0.2 }}
                        >
                          <Film className="h-3 w-3" />
                        </motion.div>
                      </div>
                      <Select
                        value={videoStyle.cameraFormat}
                        onValueChange={(value) => setVideoStyle(prev => ({ ...prev, cameraFormat: value }))}
                      >
                        <SelectTrigger className="bg-black/90 border-orange-500/20 focus:ring-orange-500 h-11 text-white/90">
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
                    </motion.div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-orange-900/80">Mood</Label>
                          <motion.div 
                            className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"
                            whileHover={{ scale: 1.2, backgroundColor: "rgb(255 237 213 / 1)" }}
                            transition={{ duration: 0.2 }}
                          >
                            <span className="text-xs font-semibold">M</span>
                          </motion.div>
                        </div>
                        <Select
                          value={videoStyle.mood}
                          onValueChange={(value) => setVideoStyle(prev => ({ ...prev, mood: value }))}
                        >
                          <SelectTrigger className="bg-black/90 border-orange-500/20 focus:ring-orange-500 h-11 text-white/90">
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
                      </motion.div>

                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-orange-900/80">Paleta de Colores</Label>
                          <div className="flex space-x-1">
                            <motion.div 
                              className="h-4 w-4 rounded-full bg-red-400"
                              whileHover={{ scale: 1.2 }}
                              transition={{ duration: 0.2 }}
                            />
                            <motion.div 
                              className="h-4 w-4 rounded-full bg-purple-400"
                              whileHover={{ scale: 1.2 }}
                              transition={{ duration: 0.2 }}
                            />
                            <motion.div 
                              className="h-4 w-4 rounded-full bg-blue-400"
                              whileHover={{ scale: 1.2 }}
                              transition={{ duration: 0.2 }}
                            />
                          </div>
                        </div>
                        <Select
                          value={videoStyle.colorPalette}
                          onValueChange={(value) => setVideoStyle(prev => ({ ...prev, colorPalette: value }))}
                        >
                          <SelectTrigger className="bg-black/90 border-orange-500/20 focus:ring-orange-500 h-11 text-white/90">
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
                      </motion.div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.3 }}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-orange-900/80">Estilo de Personajes</Label>
                          <motion.div 
                            className="h-6 w-6 rounded-full bg-orange-50 flex items-center justify-center text-orange-500"
                            whileHover={{ scale: 1.2, backgroundColor: "rgb(255 237 213 / 1)" }}
                            transition={{ duration: 0.2 }}
                          >
                            <User className="h-3 w-3" />
                          </motion.div>
                        </div>
                        <Select
                          value={videoStyle.characterStyle}
                          onValueChange={(value) => setVideoStyle(prev => ({ ...prev, characterStyle: value }))}
                        >
                          <SelectTrigger className="bg-black/90 border-orange-500/20 focus:ring-orange-500 h-11 text-white/90">
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
                      </motion.div>

                      <motion.div 
                        className="space-y-3"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.4 }}
                      >
                        <div className="flex items-center justify-between">
                          <Label className="font-medium text-orange-900/80">
                            Intensidad Visual
                            <span className="ml-2 inline-flex items-center justify-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                              {videoStyle.visualIntensity}%
                            </span>
                          </Label>
                        </div>
                        <div className="pt-2">
                          <Slider
                            value={[videoStyle.visualIntensity]}
                            onValueChange={([value]) => setVideoStyle(prev => ({ ...prev, visualIntensity: value }))}
                            max={100}
                            step={1}
                            className="py-2"
                          />
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>Sutil</span>
                            <span>Impactante</span>
                          </div>
                        </div>
                      </motion.div>
                    </div>

                    <motion.div 
                      className="space-y-3 pt-1"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.5 }}
                    >
                      <div className="flex items-center justify-between">
                        <Label className="font-medium text-orange-900/80">
                          Intensidad Narrativa 
                          <span className="ml-2 inline-flex items-center justify-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-700">
                            {videoStyle.narrativeIntensity}%
                          </span>
                        </Label>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ajusta qué tan fielmente el video sigue la narrativa de la letra
                      </p>
                      <div className="pt-1">
                        <Slider
                          value={[videoStyle.narrativeIntensity]}
                          onValueChange={([value]) => setVideoStyle(prev => ({ ...prev, narrativeIntensity: value }))}
                          max={100}
                          step={1}
                          className="py-2"
                        />
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>Abstracto</span>
                          <span>Literal</span>
                        </div>
                      </div>
                    </motion.div>

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
                </motion.div>

                <motion.div 
                  className="border border-orange-500/30 rounded-lg overflow-hidden p-5 bg-gradient-to-br from-black to-black/70 shadow-sm relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 6 ? "0 0 0 2px rgba(255, 98, 0, 0.4)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 6 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-100 text-orange-600 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-orange-500"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: [0, -3, 3, 0],
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 4, ease: "easeInOut", repeatDelay: 1 },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <Waves className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <Label className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-orange-300">5. Sincronizar Beats</Label>
                      <p className="text-xs text-white/70">Detecta puntos clave para sincronización de video</p>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Button
                      onClick={syncAudioWithTimeline}
                      disabled={!audioBuffer || isGeneratingShots || currentStep < 3}
                      className="w-full mb-3 h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                    >
                      {isGeneratingShots ? (
                        <motion.div className="flex items-center justify-center gap-2" animate={{ opacity: [0.7, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Detectando patrones rítmicos...</span>
                        </motion.div>
                      ) : (
                        <motion.div className="flex items-center justify-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                          <RefreshCcw className="mr-2 h-4 w-4" />
                          <span>Detectar Cortes Musicales</span>
                        </motion.div>
                      )}
                    </Button>
                    
                    {/* Botón para descargar el archivo JSON de timecodes */}
                    {beatsJsonData && (
                      <motion.div
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                      >
                        <Button
                          onClick={downloadBeatsJSON}
                          variant="outline"
                          className="w-full mt-2 border-orange-500/20 text-orange-500 hover:bg-orange-500/10"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          <span>Descargar Timecodes JSON</span>
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                  
                  {/* Visualización de los beats detectados */}
                  {beatsJsonData && (
                    <motion.div 
                      className="mt-5 border border-orange-500/20 rounded-lg p-4 bg-black/50 overflow-hidden"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      transition={{ duration: 0.5, delay: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <motion.div 
                            animate={{ scale: [1, 1.1, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="h-5 w-5 rounded-full bg-orange-500/20 flex items-center justify-center"
                          >
                            <Activity className="h-3 w-3 text-orange-500" />
                          </motion.div>
                          <h4 className="font-medium text-white/90">Beats Detectados</h4>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                          onClick={() => setShowBeatDetails(prev => !prev)}
                        >
                          {showBeatDetails ? (
                            <motion.div 
                              className="flex items-center gap-1"
                              initial={{ x: 0 }}
                              whileHover={{ x: -2 }}
                            >
                              <ChevronUp className="h-3 w-3" />
                              <span>Ocultar detalles</span>
                            </motion.div>
                          ) : (
                            <motion.div 
                              className="flex items-center gap-1"
                              initial={{ x: 0 }}
                              whileHover={{ x: 2 }}
                            >
                              <span>Ver detalles</span>
                              <ChevronDown className="h-3 w-3" />
                            </motion.div>
                          )}
                        </Button>
                      </div>
                      
                      <div className="text-xs text-white/80 mt-3 mb-2">
                        Clasificación por tipo de intensidad:
                      </div>
                      <div className="flex items-center gap-3 mb-3">
                        <motion.div 
                          className="flex items-center bg-white/80 px-2 py-1 rounded-full shadow-sm border border-red-200"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="w-3 h-3 rounded-full bg-red-500 mr-1.5"></div>
                          <span className="text-xs font-medium text-red-700">Downbeat</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center bg-white/80 px-2 py-1 rounded-full shadow-sm border border-yellow-200"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1.5"></div>
                          <span className="text-xs font-medium text-yellow-700">Accent</span>
                        </motion.div>
                        <motion.div 
                          className="flex items-center bg-white/80 px-2 py-1 rounded-full shadow-sm border border-blue-200"
                          whileHover={{ scale: 1.05 }}
                        >
                          <div className="w-3 h-3 rounded-full bg-blue-500 mr-1.5"></div>
                          <span className="text-xs font-medium text-blue-700">Beat</span>
                        </motion.div>
                      </div>
                      
                      {/* Visualización gráfica de beats */}
                      <motion.div 
                        className="h-16 border rounded-lg shadow-inner bg-white/70 flex items-end p-1 overflow-x-auto relative"
                        whileHover={{ boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}
                      >
                        {JSON.parse(beatsJsonData).beats.map((beat: any, idx: number) => {
                          // Determinar color según tipo de beat
                          const beatColor = beat.type === 'downbeat' 
                            ? 'bg-red-500' 
                            : beat.type === 'accent'
                              ? 'bg-yellow-500'
                              : 'bg-blue-500';
                          
                          // Altura basada en intensidad (0-1)
                          const height = `${Math.max(15, Math.min(100, beat.intensity * 90))}%`;
                          
                          return (
                            <motion.div 
                              key={idx} 
                              className={`${beatColor} w-1 mx-[1px] rounded-t hover:w-2 hover:mx-0 transition-all cursor-pointer`} 
                              style={{ height }}
                              title={`${beat.timecode} - ${beat.type} (${beat.intensity.toFixed(2)})`}
                              onClick={() => setSelectedBeatIndex(idx)}
                              initial={{ y: 20, opacity: 0 }}
                              animate={{ y: 0, opacity: 1 }}
                              transition={{ delay: idx * 0.001, duration: 0.2 }}
                              whileHover={{ 
                                boxShadow: "0 0 8px rgba(0,0,0,0.3)",
                                filter: "brightness(1.2)"
                              }}
                            />
                          );
                        })}
                        
                        {/* Indicador de beat seleccionado */}
                        {selectedBeatIndex !== null && (
                          <motion.div 
                            className="absolute bottom-0 border-l-2 border-dashed border-primary h-full" 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            style={{ 
                              left: `${selectedBeatIndex * 3 + 4}px`, 
                              transition: 'left 0.2s ease-out' 
                            }} 
                          />
                        )}
                      </motion.div>
                      
                      {/* Panel de detalles de beats */}
                      {showBeatDetails && (
                        <motion.div 
                          className="mt-4 pt-3 border-t border-orange-500/20 text-xs"
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3 }}
                        >
                          <div className="flex justify-between mb-3 bg-black/50 p-2 rounded-md shadow-sm">
                            <div className="flex flex-col items-center">
                              <span className="font-medium text-orange-500">Análisis del Ritmo</span>
                              <span className="text-white text-sm font-semibold">{JSON.parse(beatsJsonData).metadata.beatAnalysis.patternComplexity}</span>
                            </div>
                            <div className="flex flex-col items-center">
                              <span className="font-medium text-orange-500">BPM Estimado</span>
                              <span className="text-white text-sm font-semibold">{JSON.parse(beatsJsonData).metadata.bpm}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <motion.div 
                              className="flex flex-col items-center border border-red-500/20 rounded-lg p-2 bg-black/40 shadow-sm"
                              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
                            >
                              <span className="text-red-500 font-bold text-lg">
                                {JSON.parse(beatsJsonData).metadata.beatAnalysis.beatTypes.downbeats}
                              </span>
                              <span className="text-[10px] text-white/90 font-medium">Downbeats</span>
                            </motion.div>
                            <motion.div 
                              className="flex flex-col items-center border border-yellow-500/20 rounded-lg p-2 bg-black/40 shadow-sm"
                              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
                            >
                              <span className="text-yellow-500 font-bold text-lg">
                                {JSON.parse(beatsJsonData).metadata.beatAnalysis.beatTypes.accents}
                              </span>
                              <span className="text-[10px] text-white/90 font-medium">Accents</span>
                            </motion.div>
                            <motion.div 
                              className="flex flex-col items-center border border-blue-500/20 rounded-lg p-2 bg-black/40 shadow-sm"
                              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}
                            >
                              <span className="text-blue-500 font-bold text-lg">
                                {JSON.parse(beatsJsonData).metadata.beatAnalysis.beatTypes.regularBeats}
                              </span>
                              <span className="text-[10px] text-white/90 font-medium">Beats</span>
                            </motion.div>
                          </div>
                          
                          {/* Detalles del beat seleccionado, si hay alguno */}
                          {selectedBeatIndex !== null && (
                            <motion.div 
                              className="p-3 rounded-lg border border-orange-500/20 bg-black/60 shadow-sm"
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.3 }}
                            >
                              <h5 className="font-medium mb-2 flex items-center gap-2 text-orange-500">
                                <Music2 className="h-3 w-3" />
                                <span>Beat #{selectedBeatIndex + 1}</span>
                              </h5>
                              <div className="grid grid-cols-2 gap-2">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-orange-400">Tipo:</span> 
                                  <span className={
                                    JSON.parse(beatsJsonData).beats[selectedBeatIndex].type === 'downbeat'
                                      ? 'text-red-500 font-medium bg-red-600/20 px-1.5 py-0.5 rounded-full text-[10px]'
                                      : JSON.parse(beatsJsonData).beats[selectedBeatIndex].type === 'accent'
                                        ? 'text-yellow-500 font-medium bg-yellow-600/20 px-1.5 py-0.5 rounded-full text-[10px]'
                                        : 'text-blue-500 font-medium bg-blue-600/20 px-1.5 py-0.5 rounded-full text-[10px]'
                                  }>
                                    {JSON.parse(beatsJsonData).beats[selectedBeatIndex].type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-orange-400">Tiempo:</span>
                                  <span className="font-mono bg-black/40 text-white px-1.5 py-0.5 rounded-full text-[10px]">
                                    {JSON.parse(beatsJsonData).beats[selectedBeatIndex].timecode}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-orange-400">Intensidad:</span>
                                  <span className="font-medium text-white">
                                    {(JSON.parse(beatsJsonData).beats[selectedBeatIndex].intensity * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-orange-400">Energía:</span>
                                  <span className="font-medium text-white">
                                    {JSON.parse(beatsJsonData).beats[selectedBeatIndex].energy.toFixed(4)}
                                  </span>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </motion.div>

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

                <motion.div 
                  className="border border-orange-500/20 rounded-lg overflow-hidden p-5 bg-gradient-to-br from-black to-black/70 shadow-sm relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 7 ? "0 0 0 2px rgba(249, 115, 22, 0.3)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 7 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-900 text-orange-400 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-900 text-orange-400"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: [0, -3, 3, 0],
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 4, ease: "easeInOut", repeatDelay: 1 },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <Megaphone className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <Label className="text-lg font-semibold text-orange-500">6. Generar Prompts</Label>
                      <p className="text-xs text-white/70">Crea instrucciones de IA con el estilo definido</p>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
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
                      className="w-full h-12 mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                    >
                      {isGeneratingScript ? (
                        <motion.div className="flex items-center justify-center gap-2" animate={{ opacity: [0.7, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Creando prompts artísticos...</span>
                        </motion.div>
                      ) : (
                        <motion.div className="flex items-center justify-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                          <Edit className="mr-2 h-4 w-4" />
                          <span>Generar Prompts con Estilo</span>
                        </motion.div>
                      )}
                    </Button>
                    
                    {/* Fondo decorativo para el botón */}
                    {!isGeneratingScript && (
                      <motion.div 
                        className="absolute -bottom-2 -right-2 -left-2 h-8 rounded-b-lg opacity-30 bg-gradient-to-t from-orange-900/40 to-transparent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    )}
                  </motion.div>
                </motion.div>

                <motion.div 
                  className="border border-orange-500/20 rounded-lg overflow-hidden p-5 bg-gradient-to-br from-black to-black/70 shadow-sm relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ 
                    opacity: 1, 
                    y: 0,
                    boxShadow: currentStep >= 8 ? "0 0 0 2px rgba(249, 115, 22, 0.3)" : "none"
                  }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  {/* Indicador de paso completado */}
                  {currentStep >= 8 && (
                    <motion.div 
                      className="absolute -top-1 -right-1 p-1 rounded-full bg-orange-900 text-orange-400 z-10"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <CheckCircle2 className="h-4 w-4" />
                    </motion.div>
                  )}
                  
                  {/* Título con icono animado */}
                  <div className="flex items-center gap-3 mb-6">
                    <motion.div 
                      className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-900 text-orange-400"
                      whileHover={{ scale: 1.1 }}
                      animate={{ 
                        rotate: [0, -3, 3, 0],
                      }}
                      transition={{ 
                        rotate: { repeat: Infinity, duration: 4, ease: "easeInOut", repeatDelay: 1 },
                        scale: { duration: 0.2 }
                      }}
                    >
                      <ImageIcon className="h-4 w-4" />
                    </motion.div>
                    <div>
                      <Label className="text-lg font-semibold text-orange-500">7. Generar Imágenes</Label>
                      <p className="text-xs text-white/70">Crea visuales impactantes para cada segmento</p>
                    </div>
                  </div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="relative mt-4"
                  >
                    <Button
                      onClick={generateShotImages}
                      disabled={
                        !timelineItems.length ||
                        isGeneratingShots ||
                        currentStep < 5
                      }
                      className="w-full h-12 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
                    >
                      {isGeneratingShots ? (
                        <motion.div className="flex items-center justify-center gap-2" animate={{ opacity: [0.7, 1] }} transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          <span>Generando escenas visuales...</span>
                        </motion.div>
                      ) : (
                        <motion.div className="flex items-center justify-center" whileHover={{ scale: 1.03 }} transition={{ duration: 0.2 }}>
                          <ImageIcon className="mr-2 h-4 w-4" />
                          <span>Generar Imágenes para Escenas</span>
                        </motion.div>
                      )}
                    </Button>
                    
                    {/* Decoración visual */}
                    {!isGeneratingShots && (
                      <motion.div 
                        className="absolute -bottom-2 -right-2 -left-2 h-8 rounded-b-lg opacity-30 bg-gradient-to-t from-orange-900/40 to-transparent"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.3 }}
                        transition={{ duration: 1, delay: 0.5 }}
                      />
                    )}
                  </motion.div>
                  
                  {/* Información de ayuda */}
                  <motion.div 
                    className="mt-5 bg-black/50 rounded-lg p-3 text-xs text-orange-400 border border-orange-500/20 flex items-start gap-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.4 }}
                  >
                    <HelpCircle className="h-4 w-4 text-orange-400/70 mt-0.5 flex-shrink-0" />
                    <div className="text-white/80">
                      Este paso utilizará los prompts generados para crear imágenes para cada segmento del video. 
                      Las imágenes generadas se adaptarán al estilo visual que has definido anteriormente.
                    </div>
                  </motion.div>
                </motion.div>

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
                        onGenerateVideo={async (settings) => {
                          console.log("Configuración para generar video:", settings);
                          toast({
                            title: "Generación iniciada",
                            description: `Generando video con modelo ${settings.model}, calidad ${settings.quality}`
                          });
                          await generateVideo();
                        }}
                        isLoading={isGeneratingVideo}
                        scenesCount={timelineItems.length}
                        clips={timelineItems.map(item => ({
                          id: item.id,
                          start: (item.start_time - (timelineItems[0]?.start_time || 0)) / 1000,
                          duration: item.duration / 1000,
                          type: 'image' as const,
                          layer: 1, // Añadimos layer=1 para video/imagen
                          thumbnail: item.generatedImage || item.firebaseUrl,
                          title: item.shotType || 'Escena',
                          description: item.description || '',
                          imageUrl: item.generatedImage || item.firebaseUrl,
                          imagePrompt: item.imagePrompt,
                          metadata: {
                            section: item.metadata?.section || 'default',
                            movementApplied: item.metadata?.movementApplied,
                            movementPattern: item.metadata?.movementPattern,
                            movementIntensity: item.metadata?.movementIntensity,
                            faceSwapApplied: item.metadata?.faceSwapApplied,
                            musicianIntegrated: item.metadata?.musicianIntegrated
                          }
                        }))}
                        duration={audioBuffer?.duration || 0}
                        isGenerating={isGeneratingVideo}
                        onGenerate={async () => { await generateVideo(); return; }}
                      />
                      {videoId && (
                        <Button 
                          className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
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
                        className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
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
                        className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
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
                        className="w-full mt-4 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 border-0 shadow-md"
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
        </motion.div>
      </motion.div>
    </div>
  );
}