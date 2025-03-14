import { useState, useRef, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Play, Pause, SkipBack, SkipForward,
  ZoomIn, ZoomOut, ChevronLeft, ChevronRight,
  Music, Image as ImageIcon, Video, Scissors, 
  Layers, Plus, ArrowLeftRight, Film, Wand2,
  Text, ArrowUpDown, Sparkles, AudioLines,
  LineChart, BarChart4, MoveHorizontal, RefreshCw,
  Type, Maximize2, Minimize2
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogFooter } from "../ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

// Importamos nuestros hooks personalizados
import { useClipOperations } from '../../hooks/timeline/useClipOperations';
import { useClipInteractions } from '../../hooks/timeline/useClipInteractions';
import { useTimelineLayers, LayerConfig } from '../../hooks/timeline/useTimelineLayers';
import { useBeatDetection } from '../../hooks/timeline/useBeatDetection';

// Importamos constantes
import {
  PIXELS_PER_SECOND,
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_FACTOR_IN,
  ZOOM_FACTOR_OUT,
  LayerType,
  ClipType,
  MAX_CLIP_DURATION,
  MIN_CLIP_DURATION,
  PLAYHEAD_WIDTH,
  WAVEFORM_HEIGHT,
  CLIP_COLORS,
  STRING_CLIP_COLORS,
  SNAP_THRESHOLD,
  LAYER_HEIGHT,
  ClipOperation
} from '../../constants/timeline-constants';

/**
 * Interfaz para clips de línea de tiempo con soporte para múltiples capas
 * Estructura profesional inspirada en editores como CapCut y Premiere
 */
export interface TimelineClip {
  id: number;
  start: number;
  duration: number;
  // Tipo de clip con soporte para múltiples formatos
  type: 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text';
  // Layer al que pertenece: 0=audio, 1=video/imagen, 2=texto, 3=efectos
  layer: number;
  // Propiedades visuales
  thumbnail?: string;
  title: string;
  description?: string;
  waveform?: number[];
  imagePrompt?: string;
  shotType?: string;
  // Propiedades de visibilidad y bloqueo
  visible?: boolean;
  locked?: boolean;
  // URLs de recursos
  imageUrl?: string;
  videoUrl?: string;
  movementUrl?: string;
  audioUrl?: string;
  // DEPRECADO: Estas propiedades están siendo migradas a metadata.lipsync
  // Mantener por retrocompatibilidad, pero usar metadata.lipsync en su lugar
  lipsyncApplied?: boolean; 
  lipsyncVideoUrl?: string;
  lipsyncProgress?: number;
  // Propiedades de transición
  transitionType?: 'crossfade' | 'wipe' | 'fade' | 'slide' | 'zoom';
  transitionDuration?: number;
  // Propiedades de efecto
  effectType?: 'blur' | 'glow' | 'sepia' | 'grayscale' | 'saturation' | 'custom';
  effectIntensity?: number;
  // Propiedades de texto
  textContent?: string;
  textStyle?: 'normal' | 'bold' | 'italic' | 'title' | 'subtitle' | 'caption';
  textColor?: string;
  // Metadatos adicionales
  metadata?: {
    section?: string;    // Sección musical (coro, verso, etc.)
    movementApplied?: boolean;
    movementPattern?: string;
    movementIntensity?: number;
    faceSwapApplied?: boolean;
    musicianIntegrated?: boolean;
    sourceIndex?: number; // Índice en el guion original
    // Propiedades de sincronización de labios en metadata
    lipsync?: {
      applied: boolean;
      videoUrl?: string;
      progress?: number;
      timestamp?: string;
    };
  };
}

// Interfaz para los datos de beat detectados
export interface BeatData {
  time: number;      // Tiempo en segundos
  timecode: string;  // Timecode formateado
  energy: number;    // Nivel de energía
  intensity: number; // Intensidad normalizada (0-1)
  type: string;      // Tipo de beat (downbeat, accent, beat)
  isDownbeat: boolean; // Si es un beat principal o secundario
}

// Interfaz para metadata de beatMap
export interface BeatMapMetadata {
  songTitle?: string;
  artist?: string;
  duration?: number;
  bpm?: number;
  key?: string;
  timeSignature?: string;
  complexity?: string;
  generatedAt?: string;
  beatAnalysis?: {
    totalBeats?: number;
    beatTypes?: {
      downbeats?: number;
      accents?: number;
      regularBeats?: number;
    };
    averageInterval?: number;
    patternComplexity?: string;
  };
}

// Interfaz para el mapa completo de beats
export interface BeatMap {
  metadata: BeatMapMetadata;
  beats: BeatData[];
}

interface TimelineEditorProps {
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  audioBuffer?: AudioBuffer;
  onTimeUpdate: (time: number) => void;
  onClipUpdate: (clipId: number, updates: Partial<TimelineClip>) => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  onRegenerateImage?: (clipId: number) => void;
  onSplitClip?: (clipId: number, splitTime: number) => void;
  beatsData?: BeatMap; // Datos de beats para visualización avanzada
}

/**
 * Editor de línea de tiempo avanzado para edición de clips de audio, video e imágenes
 * Esta versión usa hooks modularizados para organizar la funcionalidad
 */
export function TimelineEditor({
  clips,
  currentTime,
  duration,
  audioBuffer,
  onTimeUpdate,
  onClipUpdate,
  onPlay,
  onPause,
  isPlaying,
  onRegenerateImage,
  onSplitClip,
  beatsData
}: TimelineEditorProps) {
  // Estado fundamental del timeline
  const [zoom, setZoom] = useState(1);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  const [hoveredTime, setHoveredTime] = useState<number | null>(null);
  const [showBeats, setShowBeats] = useState(true);
  const [selectedImagePreview, setSelectedImagePreview] = useState<TimelineClip | null>(null);
  const [expandedPreview, setExpandedPreview] = useState(false);

  // Referencias
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const waveformContainerRef = useRef<HTMLDivElement>(null);

  // Funciones de conversión de coordenadas
  const timeToPixels = (time: number) => time * zoom * PIXELS_PER_SECOND;
  const pixelsToTime = (pixels: number) => pixels / (zoom * PIXELS_PER_SECOND);
  
  // Hooks personalizados para gestionar capas
  const { 
    layers, 
    visibleLayers,
    addLayer, 
    removeLayer, 
    updateLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    moveLayerUp,
    moveLayerDown,
    getLayerById,
    isLayerLocked
  } = useTimelineLayers({
    defaultLayerHeight: LAYER_HEIGHT,
    onLayerChange: (layers) => {
      console.log("Capas actualizadas:", layers);
    }
  });

  // Hook para operaciones de clips
  const {
    addClip,
    removeClip,
    moveClip,
    resizeClip,
    splitClip,
    getClipById,
    getClipsInLayer,
    getSelectedClip,
    validateClipOperation
  } = useClipOperations({
    clips,
    duration,
    snapThreshold: SNAP_THRESHOLD,
    minClipDuration: MIN_CLIP_DURATION,
    maxClipDuration: MAX_CLIP_DURATION,
    onClipUpdate,
    onSplitClip
  });

  // Hook para interacciones con clips
  const {
    isDragging,
    currentOperation,
    selectedClipStartPosition,
    handleClipMouseDown,
    handleClipDrag,
    handleClipMouseUp,
    handleResizeStart,
    handleResize,
    handleResizeEnd
  } = useClipInteractions({
    timeToPixels,
    pixelsToTime,
    onClipMove: moveClip,
    onClipResize: resizeClip,
    isLayerLocked,
    getClipById,
    selectedClipId,
    setSelectedClipId
  });

  // Hook para detección de beats y sincronización
  const {
    beats,
    bpm,
    isDetecting,
    manualBpm,
    isUsingManualBpm,
    updateSensitivity,
    updateManualBpm,
    toggleBpmMode,
    analyzeAudio,
    getNearestBeat,
    generateBeatGrid
  } = useBeatDetection({
    sensitivity: 0.7,
    wavesurfer: null, // Se inicializará después si es necesario
    onBeatsDetected: (detectedBeats) => {
      console.log(`Se detectaron ${detectedBeats.length} beats, BPM estimado: ${bpm}`);
    }
  });

  // Calcular ancho total del timeline
  const timelineWidth = Math.max(duration * zoom * PIXELS_PER_SECOND, scrollAreaRef.current?.clientWidth || 800);

  // Funciones para zoom
  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev * ZOOM_FACTOR_IN, MAX_ZOOM));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev * ZOOM_FACTOR_OUT, MIN_ZOOM));
  };

  // Función para manejar clic en la línea de tiempo
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const clickTime = pixelsToTime(offsetX);
    
    if (clickTime >= 0 && clickTime <= duration) {
      onTimeUpdate(clickTime);
      setSelectedClipId(null); // Deseleccionar clip al hacer clic en el timeline
    }
  };

  // Manejador de movimiento del mouse sobre el timeline
  const handleTimelineMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const hoverTime = pixelsToTime(offsetX);
    
    if (hoverTime >= 0 && hoverTime <= duration) {
      setHoveredTime(hoverTime);
    } else {
      setHoveredTime(null);
    }
  };

  // Manejador de salida del mouse del timeline
  const handleTimelineMouseLeave = () => {
    setHoveredTime(null);
  };

  // Generar marcas de tiempo para la regla del timeline
  const generateTimeMarkers = () => {
    const markers = [];
    const interval = zoom < 0.8 ? 10 : zoom < 1.5 ? 5 : 1; // Ajuste de intervalos según zoom
    
    for (let i = 0; i <= duration; i += interval) {
      markers.push(
        <div 
          key={`marker-${i}`}
          className="absolute top-0 h-4 border-l border-gray-400"
          style={{ 
            left: `${timeToPixels(i)}px`,
            width: '1px'
          }}
        >
          <div className="text-xs text-gray-500 ml-1 whitespace-nowrap">
            {formatTime(i)}
          </div>
        </div>
      );
    }
    
    return markers;
  };

  // Función auxiliar para formatear tiempo
  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  // Obtener color para un clip según su tipo
  const getClipColorByType = (clipType: string): { background: string; border: string; text: string; selected: string; } => {
    // Para depurar el tipo de clip que se está procesando
    console.log('Tipo de clip a procesar:', clipType);
    
    // Si es una cadena vacía o undefined, usar un valor por defecto
    if (!clipType) {
      console.warn('Tipo de clip inválido (vacío/undefined)');
      return STRING_CLIP_COLORS['video']; // Valor por defecto seguro
    }
    
    // Primero verificar en STRING_CLIP_COLORS directamente para compatibilidad máxima
    if (STRING_CLIP_COLORS[clipType]) {
      return STRING_CLIP_COLORS[clipType];
    }
    
    // Intentar con enum LayerType 
    if (CLIP_COLORS[clipType as LayerType]) {
      return CLIP_COLORS[clipType as LayerType];
    }
    
    // Color por defecto basado en el layer si no hay coincidencia
    const defaultColors: Record<number, { background: string; border: string; text: string; selected: string }> = {
      0: STRING_CLIP_COLORS['audio'],
      1: STRING_CLIP_COLORS['video'],
      2: STRING_CLIP_COLORS['text'],
      3: STRING_CLIP_COLORS['effect']
    };
    
    // Intentar convertir a número para usar en el mapa de layers por defecto
    const layerNumber = parseInt(clipType);
    if (!isNaN(layerNumber) && defaultColors[layerNumber]) {
      return defaultColors[layerNumber];
    }
    
    // Color por defecto en caso de que todo falle
    console.warn('Usando color por defecto para tipo desconocido:', clipType);
    return {
      background: '#4169E1', // Azul por defecto
      border: '#1E90FF',
      text: '#FFFFFF',
      selected: '#6495ED'
    };
  };

  // Renderizado de clips
  const renderClips = () => {
    // Agregar log para depuración
    console.log('Renderizando clips:', clips);
    
    return clips.map(clip => {
      // Verificar que clip y propiedades esenciales existan
      if (!clip) {
        console.warn('Clip inválido:', clip);
        return null;
      }
      
      // Usar start o startTime según esté disponible (compatibilidad)
      const clipStart = clip.start !== undefined ? clip.start : 
                       (clip.startTime !== undefined ? clip.startTime : 0);
      
      // Verificar que la duración sea válida
      if (clip.duration === undefined || clip.duration <= 0) {
        console.warn('Duración inválida para clip:', clip);
        return null;
      }
      
      const clipWidth = timeToPixels(clip.duration);
      const clipLeft = timeToPixels(clipStart);
      const isSelected = clip.id === selectedClipId;
      const layer = getLayerById(typeof clip.layer === 'number' ? clip.layer : 0);
      
      // Log para depuración de capa
      console.log('Capa para clip:', clip.id, clip.layer, layer);
      
      // Si la capa está oculta o el clip es invisible, no renderizar
      if (!layer || !layer.visible || clip.visible === false) {
        console.log('Clip no visible:', clip.id, layer?.visible, clip.visible);
        return null;
      }
      
      // Asegurar que el tipo sea una cadena para evitar errores
      const clipType = typeof clip.type === 'string' ? clip.type : 'video';
      
      // Obtener el color adecuado según el tipo de clip
      const clipColor = getClipColorByType(clipType);
      
      // Si clipColor es undefined por alguna razón, usar un color por defecto
      if (!clipColor) {
        console.warn('Color no encontrado para tipo:', clipType);
      }
      
      const getClipBackgroundColor = () => {
        return clip.locked ? `${clipColor?.background || '#4169E1'}80` : (clipColor?.background || '#4169E1');
      };
      
      return (
        <div
          key={`clip-${clip.id}`}
          className={cn(
            "absolute rounded-md overflow-hidden flex flex-col justify-between border",
            isSelected ? "border-white border-2 shadow-lg" : "border-gray-700",
            clip.locked ? "opacity-60" : "hover:brightness-110",
            isDragging && clip.id === selectedClipId ? "cursor-grabbing z-20" : "cursor-grab"
          )}
          style={{
            left: `${clipLeft}px`,
            width: `${clipWidth}px`,
            top: `${clip.layer * (layer.height || LAYER_HEIGHT)}px`,
            height: `${layer.height || LAYER_HEIGHT}px`,
            backgroundColor: getClipBackgroundColor()
          }}
          onMouseDown={(e) => handleClipMouseDown(e, clip.id)}
        >
          {/* Título del clip */}
          <div className="text-xs font-medium truncate px-1 pt-1 text-white">
            {clip.title}
            {clip.shotType && <span className="ml-1 opacity-70">({clip.shotType})</span>}
          </div>
          
          {/* Contenido del clip según su tipo */}
          <div className="flex-1 flex items-center justify-center overflow-hidden">
            {clip.type === 'image' && clip.thumbnail && (
              <img
                src={clip.thumbnail}
                alt={clip.title}
                className="object-cover w-full h-full"
                style={{ objectFit: 'cover' }}
              />
            )}
            {clip.type === 'video' && (
              <div className="flex items-center justify-center w-full">
                <Video className="h-6 w-6 text-white opacity-50" />
              </div>
            )}
            {clip.type === 'audio' && (
              <div className="w-full px-1">
                {clip.waveform && clip.waveform.length > 0 ? (
                  <div className="w-full h-10 flex items-center">
                    {clip.waveform.map((value, idx) => (
                      <div
                        key={`wf-${clip.id}-${idx}`}
                        className="bg-white opacity-60 w-1 mx-[0.5px]"
                        style={{ height: `${Math.max(1, value * 20)}px` }}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-full">
                    <Music className="h-6 w-6 text-white opacity-50" />
                  </div>
                )}
              </div>
            )}
            {clip.type === 'text' && (
              <div className="flex items-center justify-center w-full">
                <Text className="h-6 w-6 text-white opacity-50" />
                <span className="text-xs text-white ml-1 truncate">
                  {clip.textContent || "Texto"}
                </span>
              </div>
            )}
          </div>
          
          {/* Duración del clip */}
          <div className="text-[10px] text-white opacity-80 px-1 pb-1">
            {formatTime(clip.duration)}
          </div>
          
          {/* Manejadores de redimensionamiento */}
          {!clip.locked && (
            <>
              <div 
                className="absolute left-0 top-0 w-2 h-full cursor-col-resize hover:bg-white hover:opacity-40"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleResizeStart(e, clip.id, 'start');
                }}
              />
              <div 
                className="absolute right-0 top-0 w-2 h-full cursor-col-resize hover:bg-white hover:opacity-40"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleResizeStart(e, clip.id, 'end');
                }}
              />
            </>
          )}
        </div>
      );
    });
  };

  // Renderizar marcadores de beat
  const renderBeatMarkers = () => {
    if (!showBeats || (!beatsData && beats.length === 0)) return null;
    
    const beatArray = beatsData?.beats || beats;
    
    return beatArray.map((beat, index) => {
      // Convertir el tiempo del beat a número para evitar problemas de tipado
      let beatTime: number;
      let isDownbeat: boolean;
      
      // Determinar si es un objeto BeatData o simplemente un número
      if (typeof beat === 'object' && beat !== null && 'time' in beat) {
        // Es un objeto BeatData
        beatTime = (beat as BeatData).time;
        isDownbeat = (beat as BeatData).isDownbeat || false;
      } else {
        // Es un número simple
        beatTime = Number(beat);
        isDownbeat = index % 4 === 0;
      }
      
      return (
        <div 
          key={`beat-${index}`}
          className={cn(
            "absolute top-0 bottom-0 border-l",
            isDownbeat ? "border-orange-400 opacity-60" : "border-orange-300 opacity-30"
          )}
          style={{ 
            left: `${timeToPixels(beatTime)}px`,
            width: '1px',
            height: '100%'
          }}
        />
      );
    });
  };

  // Renderizar capas (fondo del timeline para cada capa)
  const renderLayers = () => {
    return layers.map((layer, index) => {
      if (!layer.visible) return null;
      
      return (
        <div 
          key={`layer-${layer.id}`}
          className={cn(
            "absolute left-0 right-0 border-b border-gray-700",
            layer.locked ? "bg-gray-900 opacity-70" : "bg-gray-800"
          )}
          style={{
            top: `${index * (layer.height || LAYER_HEIGHT)}px`,
            height: `${layer.height || LAYER_HEIGHT}px`,
            width: '100%'
          }}
        >
          {/* Opcional: Indicador de tipo de capa */}
          <div 
            className="absolute left-0 top-0 bottom-0 w-1"
            style={{
              backgroundColor: layer.color || '#888888'
            }}
          />
        </div>
      );
    });
  };

  // Efecto para inicializar audio si hay un cambio en el buffer
  useEffect(() => {
    if (audioBuffer) {
      console.log("Audio buffer cargado, duración:", audioBuffer.duration);
      // Aquí se inicializaría WaveSurfer y se analizarían los beats
    }
  }, [audioBuffer]);

  return (
    <Card className="border-gray-800 bg-gray-900 text-white shadow-xl">
      <CardHeader className="bg-gray-800 border-b border-gray-700 p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-white flex items-center">
            <Film className="mr-2 h-5 w-5" />
            Editor de Línea de Tiempo
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="bg-blue-900 text-blue-100">
              {formatTime(currentTime)} / {formatTime(duration)}
            </Badge>
            {bpm > 0 && (
              <Badge variant="outline" className="bg-orange-900/50 text-orange-100">
                <BarChart4 className="h-3 w-3 mr-1" />
                {bpm} BPM
              </Badge>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onTimeUpdate(0)}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Ir al inicio</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => isPlaying ? onPause() : onPlay()}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{isPlaying ? 'Pausar' : 'Reproducir'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onTimeUpdate(Math.min(currentTime + 5, duration))}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Avanzar 5s</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleZoomOut}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                    disabled={zoom <= MIN_ZOOM}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Alejar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleZoomIn}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                    disabled={zoom >= MAX_ZOOM}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Acercar</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          
          <div className="flex items-center space-x-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setShowBeats(prev => !prev)}
                    className={cn(
                      "text-gray-300 hover:text-white hover:bg-gray-700",
                      showBeats && "bg-orange-900/30"
                    )}
                  >
                    <BarChart4 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{showBeats ? 'Ocultar beats' : 'Mostrar beats'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <Select
              value={selectedClipId?.toString() || ""}
              onValueChange={(value) => setSelectedClipId(value ? parseInt(value) : null)}
            >
              <SelectTrigger className="w-[150px] h-8 border-gray-700 bg-gray-800 text-gray-300 text-xs">
                <SelectValue placeholder="Seleccionar clip" />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700 text-gray-300">
                {clips.map(clip => (
                  <SelectItem 
                    key={clip.id} 
                    value={clip.id.toString()}
                    className="text-gray-300 focus:bg-gray-700 focus:text-white cursor-pointer"
                  >
                    {clip.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0 relative">
        {/* Barra de capas lateral */}
        <div className="absolute left-0 top-12 bottom-0 w-[60px] bg-gray-800 border-r border-gray-700 z-10 flex flex-col">
          <div className="flex flex-col p-1 space-y-1">
            {layers.map(layer => (
              <div 
                key={`layer-control-${layer.id}`}
                className={cn(
                  "flex flex-col items-center rounded px-1 py-1",
                  layer.visible ? "bg-gray-700" : "bg-gray-800",
                  layer.locked && "opacity-60"
                )}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleLayerVisibility(layer.id)}
                        className="h-6 w-6 p-1 text-gray-300 hover:text-white hover:bg-gray-700"
                      >
                        {layer.type === LayerType.AUDIO && <AudioLines className="h-4 w-4" />}
                        {layer.type === LayerType.VIDEO && <Video className="h-4 w-4" />}
                        {layer.type === LayerType.IMAGE && <ImageIcon className="h-4 w-4" />}
                        {layer.type === LayerType.TEXT && <Type className="h-4 w-4" />}
                        {layer.type === LayerType.EFFECT && <Sparkles className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{layer.name}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <div className="flex space-x-1 mt-1">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => toggleLayerLock(layer.id)}
                    className="h-4 w-4 p-0.5 text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-lock h-3 w-3">
                      {layer.locked ? (
                        <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z M7 11V7a5 5 0 0 1 10 0v4" />
                      ) : (
                        <path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2Z M7 11V7a5 5 0 0 1 9.9-1" />
                      )}
                    </svg>
                  </Button>
                </div>
              </div>
            ))}
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => addLayer(LayerType.TEXT, "Nueva Capa")}
              className="h-6 w-6 p-1 text-gray-300 hover:text-white hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        {/* Área principal del timeline */}
        <div className="ml-[60px] flex flex-col">
          {/* Cabecera con regla de tiempo */}
          <div 
            className="h-10 bg-gray-800 border-b border-gray-700 relative"
            style={{ width: '100%', overflowX: 'hidden' }}
          >
            <div 
              className="absolute top-0 left-0 h-full"
              style={{ width: `${timelineWidth}px` }}
            >
              {generateTimeMarkers()}
              
              {/* Indicador de tiempo hover */}
              {hoveredTime !== null && (
                <div 
                  className="absolute top-0 h-full border-l border-yellow-400 opacity-60"
                  style={{ 
                    left: `${timeToPixels(hoveredTime)}px`,
                    pointerEvents: 'none'
                  }}
                >
                  <div className="absolute bottom-0 left-0 transform -translate-x-1/2 bg-yellow-600 text-white text-xs px-1 rounded">
                    {formatTime(hoveredTime)}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Contenedor principal del timeline */}
          <ScrollArea 
            ref={scrollAreaRef}
            className="h-[calc(100vh-280px)] min-h-[240px]"
          >
            <div 
              ref={timelineRef}
              className="relative"
              style={{ 
                height: `${layers.filter(l => l.visible).reduce((acc, layer) => acc + (layer.height || LAYER_HEIGHT), 0)}px`,
                width: `${timelineWidth}px`,
                minHeight: '240px'
              }}
              onClick={handleTimelineClick}
              onMouseMove={handleTimelineMouseMove}
              onMouseLeave={handleTimelineMouseLeave}
            >
              {/* Fondo de las capas */}
              {renderLayers()}
              
              {/* Grid de marcadores de tiempo verticales */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                {generateTimeMarkers().map((marker, i) => (
                  <div
                    key={`grid-${i}`}
                    className="absolute top-0 h-full border-l border-gray-700 opacity-30"
                    style={{ left: marker.props.style.left }}
                  />
                ))}
                
                {/* Marcadores de beats */}
                {renderBeatMarkers()}
              </div>
              
              {/* Clips en el timeline */}
              {renderClips()}
              
              {/* Indicador de posición actual de reproducción (playhead) */}
              <motion.div
                className="absolute top-0 bottom-0 w-0.5 bg-white z-10 pointer-events-none"
                initial={{ x: timeToPixels(currentTime) }}
                style={{ x: timeToPixels(currentTime) }}
                animate={{ x: timeToPixels(currentTime) }}
                transition={{ duration: 0.1, ease: "linear" }}
              >
                <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-3 h-3 bg-white z-10 rotate-45" />
              </motion.div>
            </div>
          </ScrollArea>
        </div>
      </CardContent>
      
      {/* Diálogo de vista previa de imagen */}
      <Dialog open={!!selectedImagePreview} onOpenChange={(open) => !open && setSelectedImagePreview(null)}>
        <DialogContent className="bg-gray-900 border-gray-700 text-white">
          <DialogTitle>Vista previa: {selectedImagePreview?.title}</DialogTitle>
          {selectedImagePreview?.imageUrl && (
            <div className={cn(
              "relative rounded overflow-hidden",
              expandedPreview ? "w-full max-h-[70vh]" : "w-full h-64"
            )}>
              <img
                src={selectedImagePreview.imageUrl}
                alt={selectedImagePreview.title}
                className={cn(
                  "object-contain",
                  expandedPreview ? "w-full h-full" : "max-h-64 w-full"
                )}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setExpandedPreview(!expandedPreview)}
              >
                {expandedPreview ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
              </Button>
            </div>
          )}
          <DialogFooter className="flex justify-between items-center">
            <div className="text-sm text-gray-400">
              {selectedImagePreview?.imagePrompt && (
                <span>Prompt: {selectedImagePreview.imagePrompt}</span>
              )}
            </div>
            <div className="flex space-x-2">
              {onRegenerateImage && selectedImagePreview && (
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedImagePreview && onRegenerateImage) {
                      onRegenerateImage(selectedImagePreview.id);
                    }
                    setSelectedImagePreview(null);
                  }}
                  className="border-gray-700 hover:bg-gray-800"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Regenerar
                </Button>
              )}
              <Button
                variant="default"
                onClick={() => setSelectedImagePreview(null)}
              >
                Cerrar
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}