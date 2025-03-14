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
  ChevronRight, EyeOff, LockOpen, Unlock, Image, RefreshCw
} from 'lucide-react';
import { TimelineClipComponent } from '../timeline/TimelineClip';
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

  // Renderizar marcas de tiempo
  const renderTimeMarkers = () => {
    const markers = [];
    const step = zoom < 0.5 ? 10 : zoom < 1 ? 5 : 1; // Ajustar según el zoom
    
    for (let i = 0; i <= Math.ceil(duration); i += step) {
      const position = timeToPixels(i);
      markers.push(
        <div 
          key={`marker-${i}`}
          className="absolute h-full border-l border-gray-600 flex flex-col items-center"
          style={{ left: `${position}px` }}
        >
          <div className="text-xs text-gray-400 mt-1">{formatTime(i)}</div>
        </div>
      );
    }
    
    return markers;
  };

  // Renderizar línea actual de reproducción
  const renderPlayhead = () => {
    return (
      <div 
        className="absolute top-0 h-full border-l-2 border-primary z-30 pointer-events-none"
        style={{ 
          left: `${timeToPixels(currentTime)}px`,
          transition: isPlaying ? 'none' : 'left 0.1s ease'
        }}
      >
        <div className="absolute -left-2 -top-2 w-4 h-4 bg-primary rounded-full" />
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
    
    if (draggingClip) {
      // Mover el clip completo
      const newStart = Math.max(0, clipStartPosition + deltaTime);
      handleClipUpdate(clip.id, { start: newStart });
    } else if (resizingSide === 'start') {
      // Redimensionar desde el inicio
      const maxNewStart = clipStartPosition + clip.duration - 0.1;
      const newStart = Math.min(maxNewStart, Math.max(0, clipStartPosition + deltaTime));
      const newDuration = clip.duration - (newStart - clipStartPosition);
      
      handleClipUpdate(clip.id, { 
        start: newStart,
        duration: newDuration
      });
    } else if (resizingSide === 'end') {
      // Redimensionar desde el final
      const newDuration = Math.max(0.1, clip.duration + deltaTime);
      handleClipUpdate(clip.id, { duration: newDuration });
    }
  }, [draggingClip, resizingSide, dragStartX, clipStartPosition, selectedClip, clips, pixelsToTime, handleClipUpdate]);

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
      { bg: '#3730a3', text: 'white' },  // Audio - Índigo
      { bg: '#0369a1', text: 'white' },  // Video - Azul
      { bg: '#15803d', text: 'white' },  // Texto - Verde
      { bg: '#9f1239', text: 'white' }   // Efectos - Rojo
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
        {/* Panel lateral de capas */}
        <div className="w-32 min-w-32 border-r border-gray-700 bg-gray-800">
          <div className="p-2 border-b border-gray-700 text-xs font-medium">
            Capas
          </div>
          
          <div className="space-y-1 p-1">
            {/* Encabezados de capas */}
            {Object.keys(clipsByLayer).length > 0 ? (
              Object.keys(clipsByLayer)
                .map(Number)
                .sort((a, b) => a - b)
                .map(layerId => {
                  const layerColor = getLayerColor(layerId);
                  const layerName = layerId === 0 ? 'Audio' : 
                                  layerId === 1 ? 'Video/Imagen' : 
                                  layerId === 2 ? 'Texto' : 'Efectos';
                  
                  return (
                    <div 
                      key={`layer-${layerId}`}
                      className="flex items-center p-1 text-xs rounded-sm"
                      style={{ backgroundColor: layerColor.bg, color: layerColor.text }}
                    >
                      {layerName}
                    </div>
                  );
                })
            ) : (
              <div className="text-gray-500 text-xs p-2">
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
                          <TimelineClipComponent
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