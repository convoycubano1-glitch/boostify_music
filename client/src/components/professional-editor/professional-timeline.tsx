import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  Video,
  Image as ImageIcon,
  Type,
  Sparkles,
  Music,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TimelineClip {
  id: number;
  title: string;
  start: number;
  duration: number;
  type: 'video' | 'image' | 'text' | 'effect' | 'audio';
  color: string;
  thumbnail: string | null;
  layer: number;
}

interface BeatData {
  time: number;
  type: string;
  intensity: number;
  energy: number;
  isDownbeat: boolean;
}

interface BeatMapMetadata {
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

interface BeatMap {
  metadata: BeatMapMetadata;
  beats: BeatData[];
}

interface ProfessionalTimelineProps {
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  zoomLevel: number;
  onClipUpdate: (clipId: number, updates: any) => void;
  onClipSelect: (clipId: number) => void;
  selectedClipId: number | null;
  onTimeUpdate: (time: number) => void;
  isPlaying: boolean;
  beatsData?: BeatMap;
}

export function ProfessionalTimeline({
  clips,
  currentTime,
  duration,
  zoomLevel,
  onClipUpdate,
  onClipSelect,
  selectedClipId,
  onTimeUpdate,
  isPlaying,
  beatsData
}: ProfessionalTimelineProps) {
  const [draggingClipId, setDraggingClipId] = useState<number | null>(null);
  const [resizingClipId, setResizingClipId] = useState<number | null>(null);
  const [resizingSide, setResizingSide] = useState<'start' | 'end' | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expandedLayers, setExpandedLayers] = useState<number[]>([1, 2, 3, 4]);
  const timelineRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const playheadAnimation = useAnimation();

  // Calcular ancho del timeline basado en duración y zoom
  const timelineWidth = duration * zoomLevel * 100; // 100px por segundo base, ajustado por zoom
  
  // Convertir tiempo (segundos) a posición horizontal (pixeles)
  const timeToPixels = (time: number) => time * zoomLevel * 100;
  
  // Convertir posición horizontal (pixeles) a tiempo (segundos)
  const pixelsToTime = (pixels: number) => pixels / (zoomLevel * 100);

  // Agrupar clips por capa para visualización organizada
  const clipsByLayer = clips.reduce((acc, clip) => {
    const layer = clip.layer || 1;
    if (!acc[layer]) acc[layer] = [];
    acc[layer].push(clip);
    return acc;
  }, {} as Record<number, TimelineClip[]>);

  // Determinar el número de capas para altura del timeline
  const layers = Object.keys(clipsByLayer).map(Number);
  const maxLayer = Math.max(...layers, 1);

  // Ordenar capas de arriba a abajo (la capa 1 arriba, luego 2, etc.)
  const sortedLayers = [...layers].sort((a, b) => a - b);

  // Animación de la línea de tiempo
  useEffect(() => {
    const playheadPosition = timeToPixels(currentTime);
    
    if (isPlaying) {
      playheadAnimation.start({
        x: playheadPosition,
        transition: {
          duration: 0.05,
          ease: "linear",
          type: "tween"
        }
      });
      
      // Auto-scroll cuando la posición se acerca al borde
      if (scrollAreaRef.current) {
        const scrollLeft = scrollAreaRef.current.scrollLeft;
        const clientWidth = scrollAreaRef.current.clientWidth;
        const threshold = clientWidth * 0.2;
        
        if (playheadPosition > scrollLeft + clientWidth - threshold) {
          scrollAreaRef.current.scrollTo({
            left: playheadPosition - (clientWidth * 0.7),
            behavior: 'smooth'
          });
        } else if (playheadPosition < scrollLeft + threshold && scrollLeft > 0) {
          scrollAreaRef.current.scrollTo({
            left: Math.max(0, playheadPosition - (clientWidth * 0.3)),
            behavior: 'smooth'
          });
        }
      }
    } else {
      playheadAnimation.set({ x: playheadPosition });
    }
  }, [currentTime, isPlaying, playheadAnimation, timeToPixels]);

  // Manejar clic en la línea de tiempo
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isDragging) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const newTime = pixelsToTime(x);
    
    onTimeUpdate(Math.max(0, Math.min(newTime, duration)));
  };

  // Formatear tiempo para las divisiones de la regla
  const formatRulerTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Renderizar líneas verticales para la regla de tiempo
  const renderTimeRuler = () => {
    // Determinar el intervalo entre marcas según el zoom
    let interval = 5; // 5 segundos por defecto
    if (zoomLevel > 1.5) interval = 1;
    else if (zoomLevel < 0.5) interval = 10;
    
    const markers = [];
    for (let time = 0; time <= duration; time += interval) {
      markers.push(
        <div 
          key={`marker-${time}`}
          className="absolute top-0 bottom-0 border-l border-gray-300 dark:border-gray-700 flex flex-col items-center"
          style={{ left: `${timeToPixels(time)}px` }}
        >
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1 -ml-3">
            {formatRulerTime(time)}
          </div>
        </div>
      );
    }
    return markers;
  };

  // Renderizar marcadores de beats si están disponibles
  const renderBeatMarkers = () => {
    if (!beatsData || !beatsData.beats) return null;
    
    // Limitar a 300 marcadores para performance
    const visibleBeats = beatsData.beats
      .filter(beat => beat.time <= duration)
      .slice(0, 300);
    
    return (
      <div className="absolute top-6 left-0 right-0 h-4">
        {visibleBeats.map((beat, index) => {
          const beatColor = beat.type === 'downbeat' 
            ? 'bg-red-500' 
            : beat.type === 'accent'
              ? 'bg-yellow-500'
              : 'bg-blue-500';
          
          const intensity = beat.energy || beat.intensity || 0.5;
          const height = `${Math.max(15, Math.min(100, intensity * 100))}%`;
          
          return (
            <div
              key={`beat-${index}`}
              className={`absolute bottom-0 w-0.5 ${beatColor} opacity-70 transition-all duration-200 hover:opacity-100`}
              style={{
                left: `${timeToPixels(beat.time)}px`,
                height,
                zIndex: beat.isDownbeat ? 2 : 1
              }}
              title={`Beat ${index}: ${beat.type}`}
            />
          );
        })}
      </div>
    );
  };

  // Renderizar el contenido de un clip
  const renderClipContent = (clip: TimelineClip) => {
    const IconComponent = 
      clip.type === 'video' ? Video :
      clip.type === 'image' ? ImageIcon :
      clip.type === 'text' ? Type :
      clip.type === 'effect' ? Sparkles : 
      clip.type === 'audio' ? Music : Clock;
    
    return (
      <>
        <div className="flex items-center p-1 overflow-hidden">
          <IconComponent className="h-3 w-3 mr-1 flex-shrink-0" />
          <span className="text-xs font-medium truncate">
            {clip.title}
          </span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-300 dark:bg-gray-700 opacity-50" />
      </>
    );
  };

  // Alternar expansión de una capa
  const toggleLayerExpansion = (layerId: number) => {
    setExpandedLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    );
  };

  return (
    <div className="w-full relative" style={{ overflow: 'hidden' }}>
      {/* Regla de Tiempo */}
      <div className="w-full border-b relative z-10 mb-1 bg-gray-50 dark:bg-gray-900 overflow-hidden">
        <ScrollArea 
          ref={scrollAreaRef as any}
          className="h-[40px]"
        >
          <div 
            style={{ width: `${timelineWidth}px`, height: '40px', position: 'relative' }} 
            className="relative"
          >
            {renderTimeRuler()}
            {renderBeatMarkers()}
          </div>
        </ScrollArea>
      </div>
      
      {/* Encabezados de las Capas */}
      <div className="flex">
        <div className="w-[120px] min-w-[120px] pr-2 border-r">
          {sortedLayers.map(layerId => (
            <div 
              key={`layer-${layerId}`}
              className={cn(
                "h-[40px] px-2 flex items-center justify-between text-sm font-medium",
                "border-b hover:bg-gray-50 dark:hover:bg-gray-900 cursor-pointer",
                selectedClipId !== null && clips.find(c => c.id === selectedClipId)?.layer === layerId
                  ? "bg-gray-100 dark:bg-gray-800"
                  : ""
              )}
              onClick={() => toggleLayerExpansion(layerId)}
            >
              <span>
                {layerId === 1 ? 'Video/Imagen' : 
                 layerId === 2 ? 'Texto' : 
                 layerId === 3 ? 'Efectos' : 
                 layerId === 4 ? 'Audio' : 
                 `Capa ${layerId}`}
              </span>
              {expandedLayers.includes(layerId) ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </div>
          ))}
        </div>
        
        {/* Área de la Línea de Tiempo */}
        <div className="flex-grow overflow-hidden">
          <ScrollArea 
            ref={scrollAreaRef as any}
            className="h-[300px]"
          >
            <div 
              ref={timelineRef}
              style={{ width: `${timelineWidth}px`, minHeight: `${sortedLayers.length * 40}px` }} 
              className="relative"
              onClick={handleTimelineClick}
            >
              {/* Líneas de división horizontal para cada capa */}
              {sortedLayers.map((layerId, index) => (
                <div 
                  key={`layer-bg-${layerId}`} 
                  className={cn(
                    "absolute left-0 right-0 h-[40px] border-b",
                    index % 2 === 0 ? "bg-transparent" : "bg-gray-50 dark:bg-gray-900"
                  )}
                  style={{ top: `${(layerId - 1) * 40}px` }}
                />
              ))}
              
              {/* Líneas verticales para marcar el tiempo */}
              {Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => (
                <div 
                  key={`time-line-${i}`}
                  className="absolute top-0 bottom-0 border-l border-gray-200 dark:border-gray-800"
                  style={{ left: `${timeToPixels(i)}px` }}
                />
              ))}
              
              {/* Línea vertical para el tiempo actual */}
              <motion.div 
                className="absolute top-0 bottom-0 w-0.5 bg-orange-500 z-20"
                animate={playheadAnimation}
                style={{ x: timeToPixels(currentTime) }}
              >
                <div className="h-3 w-3 bg-orange-500 rounded-full -ml-1.5 -mt-1.5" />
              </motion.div>
              
              {/* Clips de la línea de tiempo */}
              {sortedLayers.map(layerId => (
                expandedLayers.includes(layerId) && clipsByLayer[layerId]?.map(clip => (
                  <motion.div
                    key={`clip-${clip.id}`}
                    className={cn(
                      "absolute rounded cursor-pointer select-none z-10",
                      selectedClipId === clip.id ? "ring-2 ring-blue-500" : "",
                      isDragging && draggingClipId === clip.id ? "opacity-70" : ""
                    )}
                    style={{
                      left: `${timeToPixels(clip.start)}px`,
                      top: `${(clip.layer - 1) * 40 + 2}px`,
                      width: `${timeToPixels(clip.duration)}px`,
                      height: '36px',
                      backgroundColor: clip.color || '#4CAF50',
                      zIndex: (isDragging && draggingClipId === clip.id) ? 100 : 10
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onClipSelect(clip.id);
                    }}
                    drag="x"
                    dragConstraints={timelineRef}
                    dragElastic={0}
                    dragMomentum={false}
                    onDragStart={() => {
                      setDraggingClipId(clip.id);
                      setIsDragging(true);
                    }}
                    onDragEnd={(e, info) => {
                      setIsDragging(false);
                      setDraggingClipId(null);
                      
                      // Calcular el nuevo tiempo de inicio basado en el desplazamiento
                      if (info && info.offset) {
                        const deltaX = info.offset.x;
                        const deltaTime = pixelsToTime(deltaX);
                        const newStart = Math.max(0, clip.start + deltaTime);
                        
                        onClipUpdate(clip.id, { start: newStart });
                      }
                    }}
                  >
                    {renderClipContent(clip)}
                    
                    {/* Handle para redimensionar inicio del clip */}
                    <div 
                      className="absolute left-0 top-0 bottom-0 w-2 cursor-w-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingClipId(clip.id);
                        setResizingSide('start');
                      }}
                    />
                    
                    {/* Handle para redimensionar fin del clip */}
                    <div 
                      className="absolute right-0 top-0 bottom-0 w-2 cursor-e-resize"
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setResizingClipId(clip.id);
                        setResizingSide('end');
                      }}
                    />
                  </motion.div>
                ))
              ))}
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}