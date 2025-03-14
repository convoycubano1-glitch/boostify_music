/**
 * Editor de línea de tiempo para música
 * Componente principal que integra gestión de capas, clips y reproducción de audio
 * @export TimelineEditor - Componente principal del editor
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';
import { 
  Play, Pause, SkipBack, SkipForward, ZoomIn, ZoomOut,
  Music, Volume2, Volume1, VolumeX, Layers, Lock, Eye, Trash, 
  Plus, Save, Download, Upload, Share2, Loader2, ChevronLeft, 
  ChevronRight, EyeOff, LockOpen, Unlock, Image as ImageIcon, RefreshCw,
  Video, Wand2, Text, Sparkles as SparklesIcon, Star
} from 'lucide-react';
import { TimelineClip } from '../timeline/TimelineClip';
import { ScrollArea } from '../../components/ui/scroll-area';
import { Slider } from '../../components/ui/slider';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { useToast } from '../../hooks/use-toast';
import { Switch } from '../../components/ui/switch';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Separator } from '../../components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Progress } from '../../components/ui/progress';
import { ensureCompatibleClip } from '../timeline/TimelineClipUnified';

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
  // Propiedades adicionales
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

// Propiedades del editor de línea de tiempo
interface TimelineEditorProps {
  clips?: TimelineClip[];
  currentTime: number;
  duration: number;
  audioBuffer?: AudioBuffer;
  onTimeUpdate: (time: number) => void;
  onClipUpdate?: (clipId: number, updates: Partial<TimelineClip>) => void;
  onPlay: () => void;
  onPause: () => void;
  isPlaying: boolean;
  onRegenerateImage?: (clipId: number) => void;
  onSplitClip?: (clipId: number, splitTime: number) => void;
  beatsData?: BeatMap; // Datos de beats para visualización avanzada
}

/**
 * Editor de línea de tiempo para música
 * 
 * Componente principal que integra:
 * - Gestión de capas (audio, video, texto, efectos)
 * - Edición de clips con restricciones
 * - Reproducción y visualización de audio
 * - Sincronización con beats
 */
export function TimelineEditor({
  clips = [],
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
  const { toast } = useToast();

  const [zoom, setZoom] = useState(1);
  const timelineRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const waveformRef = useRef<HTMLCanvasElement>(null);
  const [selectedClip, setSelectedClip] = useState<number | null>(null);
  const [draggingClip, setDraggingClip] = useState<number | null>(null);
  const [resizingSide, setResizingSide] = useState<'start' | 'end' | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [clipStartPosition, setClipStartPosition] = useState<number>(0);
  const [showWaveform, setShowWaveform] = useState<boolean>(true);

  const PIXELS_PER_SECOND = 100; // Base de píxeles por segundo
  const scaledPixelsPerSecond = PIXELS_PER_SECOND * zoom;

  // Convertir tiempo a píxeles y viceversa
  const timeToPixels = (time: number) => time * scaledPixelsPerSecond;
  const pixelsToTime = (pixels: number) => pixels / scaledPixelsPerSecond;

  // Dibujar forma de onda si hay audioBuffer
  useEffect(() => {
    const canvas = waveformRef.current;
    if (!canvas || !audioBuffer || !showWaveform) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configurar dimensiones
    const width = timeToPixels(duration);
    canvas.width = width;
    canvas.height = 80;

    // Limpiar canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Configurar estilo
    ctx.fillStyle = 'rgba(249, 115, 22, 0.4)'; // Color naranja semitransparente

    // Obtener datos del canal izquierdo del audio
    const data = audioBuffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const amp = canvas.height / 2;

    // Dibujar forma de onda
    for (let i = 0; i < width; i++) {
      let min = 1.0;
      let max = -1.0;
      
      // Encontrar min/max en el segmento
      for (let j = 0; j < step; j++) {
        const datum = data[(i * step) + j] || 0;
        if (datum < min) min = datum;
        if (datum > max) max = datum;
      }
      
      // Dibujar barra desde min hasta max
      ctx.fillRect(
        i, 
        (1 + min) * amp, 
        1, 
        Math.max(1, (max - min) * amp)
      );
    }
  }, [audioBuffer, duration, zoom, showWaveform, timeToPixels]);

  // Renderizar marcas de tiempo y guías para límites de clips
  const renderTimeMarkers = () => {
    const markers = [];
    // Ajusta la frecuencia de las marcas según el nivel de zoom
    const majorStep = zoom < 0.5 ? 10 : zoom < 1 ? 5 : zoom < 2 ? 1 : 0.5; 
    const minorStep = majorStep / 5;
    
    // Añadir cuadrícula horizontal
    markers.push(
      <div 
        key="grid-base" 
        className="absolute top-12 left-0 right-0 w-full border-t border-gray-700" 
      />
    );
    
    // Añadir marcadores de tiempo principales y secundarios
    for (let i = 0; i <= Math.ceil(duration); i += minorStep) {
      const position = timeToPixels(i);
      const isMajor = Math.abs(i % majorStep) < 0.001; // Usar una pequeña tolerancia para evitar errores de punto flotante
      const isHalfSecond = Math.abs(i % 0.5) < 0.001;
      
      markers.push(
        <div 
          key={`marker-${i}`}
          className={cn(
            "absolute",
            isMajor ? "border-l border-gray-500 h-12" : 
                     isHalfSecond ? "border-l border-gray-700 h-8" : 
                     "border-l border-gray-800 h-4"
          )}
          style={{ left: `${position}px` }}
        >
          {isMajor && (
            <div className="text-xs text-gray-400 font-medium ml-1">{formatTime(i)}</div>
          )}
        </div>
      );
    }
    
    // Añadir marcadores especiales para los límites de 5 segundos
    for (let i = 0; i <= Math.ceil(duration); i += 5) {
      const position = timeToPixels(i);
      
      markers.push(
        <div 
          key={`limit-${i}`}
          className="absolute top-12 bottom-0 border-l border-amber-800 border-dashed opacity-40 z-5"
          style={{ left: `${position}px` }}
        >
          <div className="absolute -rotate-90 text-[10px] text-amber-500 transform -translate-x-6 mt-4 opacity-80 whitespace-nowrap">
            {i === 0 ? "Inicio" : `${i}s (límite de clip)`}
          </div>
        </div>
      );
    }
    
    // Añadir marcadores para la posición actual de reproducción
    if (currentTime > 0) {
      const currentPosition = timeToPixels(currentTime);
      markers.push(
        <div 
          key="current-position-line"
          className="absolute top-0 bottom-0 border-l border-primary opacity-25 z-5"
          style={{ left: `${currentPosition}px` }}
        />
      );
    }
    
    return markers;
  };

  // Renderizar línea actual de reproducción con indicadores mejorados
  const renderPlayhead = () => {
    return (
      <div 
        className="absolute top-0 h-full border-l-2 border-primary z-30 pointer-events-none"
        style={{ 
          left: `${timeToPixels(currentTime)}px`,
          transition: isPlaying ? 'none' : 'left 0.1s ease',
          filter: "drop-shadow(0 0 3px rgba(255,255,255,0.3))"
        }}
      >
        {/* Indicador superior con tiempo actual */}
        <div className="absolute -left-[18px] -top-2 flex flex-col items-center">
          <div className="w-9 h-9 bg-primary rounded-full flex items-center justify-center shadow-lg">
            {isPlaying ? 
              <Pause className="h-4 w-4 text-white" /> : 
              <Play className="h-4 w-4 text-white" />
            }
          </div>
          <div className="text-[9px] font-bold bg-primary text-white px-2 py-0.5 rounded mt-1 whitespace-nowrap">
            {formatTime(currentTime)}
          </div>
        </div>
        
        {/* Línea vertical con efecto de brillo */}
        <div className="absolute top-0 left-0 w-full h-full bg-primary opacity-25" style={{width: '1px'}} />
        
        {/* Indicador inferior */}
        <div className="absolute -left-1 bottom-0 w-2 h-4 bg-primary rounded-t-sm" />
      </div>
    );
  };

  // Manejar clic en timeline para cambiar la posición actual
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const clickedTime = pixelsToTime(offsetX);
    
    if (clickedTime >= 0 && clickedTime <= duration) {
      onTimeUpdate(clickedTime);
    }
  };

  // Manejar selección de clip
  const handleSelectClip = (id: number, multiSelect = false) => {
    setSelectedClip(id);
    
    // Aquí puedes implementar selección múltiple si multiSelect es true
    toast({
      title: "Clip seleccionado",
      description: `Has seleccionado el clip #${id}`,
      variant: "default",
    });
  };

  // Manejar actualización de clip
  const handleClipUpdate = (id: number, updates: Partial<TimelineClip>) => {
    if (onClipUpdate) {
      onClipUpdate(id, updates);
    }
  };

  // Manejar inicio de arrastre de clip
  const handleClipMouseDown = (e: React.MouseEvent, clipId: number, handle?: 'start' | 'end' | 'body') => {
    e.stopPropagation();
    
    setSelectedClip(clipId);
    setDraggingClip(handle === 'body' ? clipId : null);
    setResizingSide(handle === 'start' || handle === 'end' ? handle : null);
    setDragStartX(e.clientX);
    
    // Encontrar la posición inicial del clip
    const clip = clips.find(c => c.id === clipId);
    if (clip) {
      setClipStartPosition(clip.start);
    }
    
    // Registrar manejadores de eventos globales
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Manejar movimiento durante el arrastre
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!draggingClip && !resizingSide) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaTime = pixelsToTime(deltaX);
    
    const clip = clips.find(c => c.id === (draggingClip || selectedClip));
    if (!clip) return;
    
    // Verificar colisiones con otros clips en la misma capa
    const otherClipsInLayer = clips.filter(c => c.layer === clip.layer && c.id !== clip.id);
    
    if (draggingClip) {
      // Mover el clip completo
      const newStart = Math.max(0, clipStartPosition + deltaTime);
      
      // Comprobar si hay colisión al mover
      const wouldCollide = otherClipsInLayer.some(otherClip => {
        const clipEnd = newStart + clip.duration;
        return (newStart < otherClip.start + otherClip.duration && 
                clipEnd > otherClip.start);
      });
      
      if (!wouldCollide) {
        handleClipUpdate(clip.id, { start: newStart });
      } else {
        // Mostrar mensaje de colisión
        toast({
          title: "Superposición detectada",
          description: "No se permite superposición entre clips en la misma capa",
          variant: "destructive",
        });
      }
    } else if (resizingSide === 'start') {
      // Redimensionar desde el inicio
      const maxNewStart = clipStartPosition + clip.duration - 0.1;
      let newStart = Math.min(maxNewStart, Math.max(0, clipStartPosition + deltaTime));
      const newDuration = Math.min(5, clip.duration - (newStart - clipStartPosition));
      
      // Comprobar si hay colisión al redimensionar desde el inicio
      const wouldCollide = otherClipsInLayer.some(otherClip => {
        return (newStart < otherClip.start + otherClip.duration && 
                otherClip.start < clipStartPosition);
      });
      
      if (!wouldCollide) {
        handleClipUpdate(clip.id, { 
          start: newStart,
          duration: newDuration
        });
      } else {
        toast({
          title: "Superposición detectada",
          description: "No se permite superposición entre clips en la misma capa",
          variant: "destructive",
        });
      }
    } else if (resizingSide === 'end') {
      // Redimensionar desde el final - limitar a 5 segundos exactos como máximo
      let newDuration = Math.min(5, Math.max(0.1, clip.duration + deltaTime));
      
      // Comprobar si hay colisión al redimensionar desde el final
      const wouldCollide = otherClipsInLayer.some(otherClip => {
        const newEnd = clip.start + newDuration;
        return (newEnd > otherClip.start && otherClip.start > clip.start);
      });
      
      if (!wouldCollide) {
        handleClipUpdate(clip.id, { duration: newDuration });
      } else {
        toast({
          title: "Superposición detectada",
          description: "No se permite superposición entre clips en la misma capa",
          variant: "destructive",
        });
      }
      
      // Mostrar mensaje si intenta exceder la duración máxima
      if (clip.duration + deltaTime > 5) {
        toast({
          title: "Límite de duración",
          description: "La duración máxima de un clip es de 5 segundos",
          variant: "warning",
        });
      }
    }
  }, [draggingClip, resizingSide, dragStartX, clipStartPosition, selectedClip, clips, pixelsToTime, handleClipUpdate, toast]);

  // Manejar fin del arrastre
  const handleMouseUp = useCallback(() => {
    setDraggingClip(null);
    setResizingSide(null);
    
    // Eliminar manejadores de eventos globales
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseMove]);

  // Limpiar manejadores de eventos al desmontar
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Agrupar clips por capa para visualización
  const clipsByLayer = clips.reduce((grouped, clip) => {
    const layer = clip.layer || 0;
    if (!grouped[layer]) grouped[layer] = [];
    grouped[layer].push(clip);
    return grouped;
  }, {} as Record<number, TimelineClip[]>);

  // Formatear tiempo en formato mm:ss.ms
  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const ms = Math.floor((time % 1) * 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms}`;
  };

  // Manejar regeneración de imagen
  const handleRegenerateImage = (clipId: number) => {
    if (onRegenerateImage) {
      onRegenerateImage(clipId);
    }
  };

  // Determinar el color de una capa
  const getLayerColor = (layer: number) => {
    const colors = [
      { bg: '#3730a3', text: 'white' },  // 0: Audio - Índigo
      { bg: '#0369a1', text: 'white' },  // 1: Video - Azul
      { bg: '#15803d', text: 'white' },  // 2: Texto - Verde
      { bg: '#9f1239', text: 'white' },  // 3: Efectos - Rojo
      { bg: '#7e22ce', text: 'white' },  // 4: Reservada - Púrpura
      { bg: '#b91c1c', text: 'white' },  // 5: Reservada - Rojo oscuro
      { bg: '#854d0e', text: 'white' },  // 6: Reservada - Ámbar oscuro
      { bg: '#f97316', text: 'white' }   // 7: Imágenes generadas - Naranja
    ];
    
    return colors[layer % colors.length];
  };

  return (
    <div className="flex flex-col h-full border rounded-md bg-gray-900 text-white overflow-hidden">
      {/* Barra de herramientas superior */}
      <div className="flex items-center justify-between p-2 border-b border-gray-700">
        <div className="flex items-center space-x-2">
          {/* Controles de reproducción */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onTimeUpdate(Math.max(0, currentTime - 1))}
            title="Retroceder 1 segundo"
          >
            <SkipBack className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="default" 
            onClick={isPlaying ? onPause : onPlay}
            title={isPlaying ? "Pausar" : "Reproducir"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => onTimeUpdate(Math.min(duration, currentTime + 1))}
            title="Avanzar 1 segundo"
          >
            <SkipForward className="h-4 w-4" />
          </Button>
          
          <div className="h-8 border-r border-gray-700 mx-2" />
          
          {/* Controles de zoom */}
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setZoom(Math.max(0.1, zoom / 1.5))}
            title="Alejar"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={() => setZoom(Math.min(10, zoom * 1.5))}
            title="Acercar"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          
          <div className="text-xs text-gray-400">
            Zoom: {zoom.toFixed(1)}x
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Tiempo actual / duración total */}
          <div className="text-sm font-medium bg-gray-800 px-2 py-1 rounded">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
          
          {/* Controles adicionales */}
          <div className="flex items-center">
            <Switch 
              checked={showWaveform} 
              onCheckedChange={setShowWaveform}
              id="show-waveform"
            />
            <Label htmlFor="show-waveform" className="ml-2 text-xs">
              Mostrar forma de onda
            </Label>
          </div>
        </div>
      </div>
      
      {/* Área principal del timeline */}
      <div className="flex flex-1 overflow-hidden">
        {/* Panel lateral de capas con mejor organización */}
        <div className="w-40 min-w-40 border-r border-gray-700 bg-gray-800 overflow-hidden">
          <div className="bg-gray-900 p-2 border-b border-gray-700 text-xs font-semibold flex items-center justify-between">
            <span>Capas</span>
            <Badge variant="outline" className="text-[9px] bg-gray-800">
              {Object.keys(clipsByLayer).length} activas
            </Badge>
          </div>
          
          <div className="space-y-1 p-1 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {/* Encabezados de capas con iconos y mejores estilos */}
            {Object.keys(clipsByLayer).length > 0 ? (
              Object.keys(clipsByLayer)
                .map(Number)
                .sort((a, b) => a - b)
                .map(layerId => {
                  const layerColor = getLayerColor(layerId);
                  const layerName = layerId === 0 ? 'Audio' : 
                                  layerId === 1 ? 'Video/Imagen' : 
                                  layerId === 2 ? 'Texto' : 
                                  layerId === 3 ? 'Efectos' :
                                  layerId === 7 ? 'Imágenes Generadas' : 'Capa ' + layerId;
                  
                  // Seleccionar ícono según tipo de capa
                  const layerIcon = layerId === 0 ? <Music className="h-3 w-3 mr-1" /> : 
                               layerId === 1 ? <Video className="h-3 w-3 mr-1" /> : 
                               layerId === 2 ? <Text className="h-3 w-3 mr-1" /> : 
                               layerId === 3 ? <Wand2 className="h-3 w-3 mr-1" /> :
                               layerId === 7 ? <ImageIcon className="h-3 w-3 mr-1" /> : 
                               <Layers className="h-3 w-3 mr-1" />;
                  
                  // Destacar la capa 7 con un estilo especial
                  const isGeneratedImagesLayer = layerId === 7;
                  
                  return (
                    <div 
                      key={`layer-${layerId}`}
                      className={cn(
                        "flex flex-col p-1.5 text-xs rounded-sm", 
                        isGeneratedImagesLayer ? "border-l-2 border-amber-500" : ""
                      )}
                      style={{ 
                        background: isGeneratedImagesLayer 
                          ? "linear-gradient(135deg, rgba(249, 115, 22, 0.2), rgba(234, 88, 12, 0.1))" 
                          : layerColor.bg,
                        color: layerColor.text
                      }}
                    >
                      <div className="flex items-center">
                        {layerIcon}
                        <span className="font-medium">{layerName}</span>
                      </div>
                      
                      <div className="ml-4 mt-0.5 text-[9px] text-gray-300">
                        {clipsByLayer[layerId].length} elementos
                      </div>
                      
                      {isGeneratedImagesLayer && (
                        <div className="mt-1 flex items-center">
                          <Badge variant="outline" className="text-[8px] bg-amber-950 text-amber-200 border-amber-700">
                            <SparklesIcon className="h-2 w-2 mr-0.5" />
                            IA
                          </Badge>
                          <div className="text-[8px] ml-1 text-amber-200">
                            Límite: 5s
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
            ) : (
              <div className="text-gray-500 text-xs p-2 italic">
                No hay capas disponibles
              </div>
            )}
          </div>
        </div>
        
        {/* Área de clips y línea de tiempo */}
        <div className="flex-1 overflow-hidden" ref={containerRef}>
          <ScrollArea className="h-full">
            <div 
              className="relative"
              style={{ width: `${timeToPixels(duration) + 100}px`, minHeight: '200px' }}
              ref={timelineRef}
              onClick={handleTimelineClick}
            >
              {/* Fondo con marcas de tiempo */}
              <div className="absolute inset-0">
                {renderTimeMarkers()}
              </div>
              
              {/* Línea de reproducción actual */}
              {renderPlayhead()}
              
              {/* Forma de onda del audio */}
              {showWaveform && (
                <div className="absolute inset-0">
                  <canvas 
                    ref={waveformRef} 
                    className="absolute top-0" 
                    style={{ height: '80px' }} 
                  />
                </div>
              )}
              
              {/* Renderizado de clips por capa */}
              <div className="relative pt-12">
                {Object.keys(clipsByLayer).length > 0 ? (
                  Object.keys(clipsByLayer)
                    .map(Number)
                    .sort((a, b) => a - b)
                    .map(layerId => (
                      <div 
                        key={`layer-container-${layerId}`}
                        className="relative h-16 mb-2 border-t border-gray-800"
                      >
                        {/* Clips en esta capa */}
                        {clipsByLayer[layerId].map(clip => (
                          <TimelineClip
                            key={`clip-${clip.id}`}
                            clip={clip}
                            selected={selectedClip === clip.id}
                            timeToPixels={timeToPixels}
                            onSelect={handleSelectClip}
                            onMouseDown={handleClipMouseDown}
                            onDelete={id => handleClipUpdate(id, { visible: false })}
                            onDuplicate={id => {
                              const original = clips.find(c => c.id === id);
                              if (original) {
                                const newClip = {
                                  ...original,
                                  id: Math.max(...clips.map(c => c.id)) + 1,
                                  start: original.start + original.duration,
                                };
                                // Aquí deberías tener un onAddClip para añadir el clip duplicado
                              }
                            }}
                            onPreview={id => {
                              const clip = clips.find(c => c.id === id);
                              if (clip) {
                                onTimeUpdate(clip.start);
                              }
                            }}
                          />
                        ))}
                      </div>
                    ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-32 text-gray-500">
                    <p>No hay clips para mostrar</p>
                    <Button variant="outline" size="sm" className="mt-2">
                      <Plus className="h-4 w-4 mr-1" /> Añadir clip
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>
      
      {/* Panel inferior de propiedades */}
      {selectedClip !== null && (
        <div className="border-t border-gray-700 p-2 bg-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium">
                Propiedades del clip
              </h4>
              <p className="text-xs text-gray-400">
                {clips.find(c => c.id === selectedClip)?.title || `Clip #${selectedClip}`}
              </p>
            </div>
            
            {onRegenerateImage && (
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => handleRegenerateImage(selectedClip)}
              >
                <RefreshCw className="h-4 w-4 mr-1" /> Regenerar imagen
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}