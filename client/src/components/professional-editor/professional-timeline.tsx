import React, { useState, useRef, useEffect } from 'react';
import { useDroppable, DroppedItem } from '@/hooks/use-droppable';
import { TimelineClip, EditorState } from '@/lib/professional-editor-types';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Scissors,
  AlignJustify,
  Copy,
  Trash2,
  ChevronUp,
  ChevronDown,
  MoveHorizontal,
  Lock,
  Unlock
} from 'lucide-react';

interface ProfessionalTimelineProps {
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  zoom: number;
  selectedClipId?: string;
  onAddClip: (clip: Omit<TimelineClip, 'id'>) => void;
  onUpdateClip: (id: string, updates: Partial<TimelineClip>) => void;
  onDeleteClip: (id: string) => void;
  onSelectClip: (id: string | undefined) => void;
  onSeek: (time: number) => void;
}

export const ProfessionalTimeline: React.FC<ProfessionalTimelineProps> = ({
  clips,
  currentTime,
  duration,
  zoom,
  selectedClipId,
  onAddClip,
  onUpdateClip,
  onDeleteClip,
  onSelectClip,
  onSeek
}) => {
  const timelineRef = useRef<HTMLDivElement>(null);
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [isScrubbingTimeline, setIsScrubbingTimeline] = useState(false);
  const [draggingClip, setDraggingClip] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [clipInitialStart, setClipInitialStart] = useState(0);
  const [tracks, setTracks] = useState<string[]>(['Video', 'Audio', 'Text', 'Effects']);
  
  // Referencia para medir el ancho del timeline
  const timelineWidthRef = useRef<number>(0);
  
  // Manejar el área donde se pueden soltar clips
  const { droppableRef, droppableProps } = useDroppable({
    onDrop: (droppedItem: DroppedItem) => {
      const { item, position } = droppedItem;
      
      if (!timelineRef.current) return;
      
      // Calcular en qué posición de tiempo se soltó
      const rect = timelineRef.current.getBoundingClientRect();
      const pixelToTimeRatio = duration / rect.width;
      const timePosition = pixelToTimeRatio * (position.x - rect.left);
      
      // Determinar en qué pista se soltó
      const trackHeight = 80; // altura aproximada de cada pista
      const trackIndex = Math.floor((position.y - rect.top) / trackHeight);
      const trackId = trackIndex >= 0 && trackIndex < tracks.length 
        ? tracks[trackIndex] 
        : 'Video';
      
      // Crear nuevo clip
      onAddClip({
        type: item.type as 'video' | 'audio' | 'image' | 'text',
        title: item.data.title || 'Nuevo Clip',
        startTime: Math.max(0, timePosition),
        duration: item.data.duration || 5, // Por defecto 5 segundos
        url: item.data.url,
        trackId,
        content: item.data.content,
        locked: false,
      });
    },
    acceptTypes: ['video', 'audio', 'image', 'text']
  });
  
  // Actualizar la medida del ancho del timeline cuando cambia el zoom
  useEffect(() => {
    if (timelineRef.current) {
      timelineWidthRef.current = timelineRef.current.offsetWidth;
    }
  }, [zoom]);
  
  // Convierte tiempo a píxeles según el nivel de zoom
  const timeToPixels = (time: number): number => {
    const pixelDuration = timelineWidthRef.current || 1000;
    return (time / duration) * pixelDuration * zoom;
  };
  
  // Convierte píxeles a tiempo según el nivel de zoom
  const pixelsToTime = (pixels: number): number => {
    const pixelDuration = timelineWidthRef.current || 1000;
    return (pixels / (pixelDuration * zoom)) * duration;
  };
  
  // Manejar el clic en la línea de tiempo para buscar una posición
  const handleTimelineClick = (e: React.MouseEvent) => {
    if (!timelineRef.current || isScrubbingTimeline) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const seekTime = (clickX / rect.width) * duration;
    
    onSeek(Math.max(0, Math.min(seekTime, duration)));
  };
  
  // Iniciar el arrastre de la cabeza reproductora
  const handleTimelineScrubStart = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsScrubbingTimeline(true);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const scrubX = moveEvent.clientX - rect.left;
      const scrubTime = (scrubX / rect.width) * duration;
      
      onSeek(Math.max(0, Math.min(scrubTime, duration)));
    };
    
    const handleMouseUp = () => {
      setIsScrubbingTimeline(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  // Iniciar el arrastre de un clip
  const handleClipDragStart = (e: React.MouseEvent, clipId: string, startTime: number) => {
    e.stopPropagation();
    
    // No permitir arrastrar si el clip está bloqueado
    const clip = clips.find(c => c.id === clipId);
    if (clip?.locked) return;
    
    setDraggingClip(clipId);
    setDragStartX(e.clientX);
    setClipInitialStart(startTime);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current || !draggingClip) return;
      
      const deltaX = moveEvent.clientX - dragStartX;
      const deltaTime = pixelsToTime(deltaX);
      const newStartTime = Math.max(0, clipInitialStart + deltaTime);
      
      onUpdateClip(clipId, { startTime: newStartTime });
    };
    
    const handleMouseUp = () => {
      setDraggingClip(null);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  // Cambiar la duración de un clip
  const handleClipResize = (e: React.MouseEvent, clipId: string, direction: 'start' | 'end') => {
    e.stopPropagation();
    
    // No permitir redimensionar si el clip está bloqueado
    const clip = clips.find(c => c.id === clipId);
    if (clip?.locked) return;
    
    const initialX = e.clientX;
    const initialClip = clips.find(c => c.id === clipId);
    
    if (!initialClip) return;
    
    const initialStart = initialClip.startTime;
    const initialDuration = initialClip.duration;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!timelineRef.current) return;
      
      const deltaX = moveEvent.clientX - initialX;
      const deltaTime = pixelsToTime(deltaX);
      
      if (direction === 'start') {
        // Cambiar inicio y mantener el final fijo
        const newStart = Math.max(0, initialStart + deltaTime);
        const newDuration = Math.max(0.1, initialDuration - (newStart - initialStart));
        
        onUpdateClip(clipId, {
          startTime: newStart,
          duration: newDuration
        });
      } else {
        // Cambiar duración manteniendo el inicio fijo
        const newDuration = Math.max(0.1, initialDuration + deltaTime);
        onUpdateClip(clipId, { duration: newDuration });
      }
    };
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  // Manejar la selección de un clip
  const handleClipSelect = (clipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onSelectClip(selectedClipId === clipId ? undefined : clipId);
  };
  
  // Calcular las marcas de tiempo basadas en la duración y el zoom
  const renderTimeMarkers = () => {
    const markers = [];
    
    // Calcular el intervalo adecuado según el zoom
    let interval = 1; // 1 segundo
    if (zoom > 2) interval = 0.5;
    if (zoom > 4) interval = 0.2;
    if (zoom > 8) interval = 0.1;
    if (zoom < 0.5) interval = 5;
    if (zoom < 0.2) interval = 10;
    
    for (let time = 0; time <= duration; time += interval) {
      const position = timeToPixels(time);
      
      markers.push(
        <div 
          key={`marker-${time}`}
          className="absolute -top-4 w-px h-4 bg-zinc-600"
          style={{ left: `${position}px` }}
        >
          <div className="absolute top-4 -translate-x-1/2 text-xs text-zinc-400">
            {time.toFixed(1)}s
          </div>
        </div>
      );
    }
    
    return markers;
  };

  // Renderizar un clip en la línea de tiempo
  const renderClip = (clip: TimelineClip) => {
    const leftPosition = timeToPixels(clip.startTime);
    const width = timeToPixels(clip.duration);
    
    const trackIndex = tracks.indexOf(clip.trackId || 'Video');
    const top = trackIndex >= 0 ? trackIndex * 80 : 0;
    
    // Colores según el tipo de clip
    const colorMap: Record<string, string> = {
      video: 'bg-blue-700 border-blue-500',
      audio: 'bg-green-700 border-green-500',
      image: 'bg-purple-700 border-purple-500',
      text: 'bg-pink-700 border-pink-500'
    };
    
    const clipColor = colorMap[clip.type] || 'bg-gray-700 border-gray-500';
    
    return (
      <div
        key={clip.id}
        className={cn(
          "absolute rounded-md border overflow-hidden cursor-move",
          clipColor,
          selectedClipId === clip.id ? 'ring-2 ring-white' : '',
          clip.locked ? 'opacity-70' : ''
        )}
        style={{
          left: `${leftPosition}px`,
          top: `${top}px`,
          width: `${width}px`,
          height: '70px',
        }}
        onClick={(e) => handleClipSelect(clip.id, e)}
        onMouseDown={(e) => handleClipDragStart(e, clip.id, clip.startTime)}
      >
        <div className="p-1 text-xs font-medium truncate">
          {clip.title}
          {clip.locked && <Lock className="h-3 w-3 ml-1 inline" />}
        </div>
        
        {clip.type === 'video' && clip.thumbnailUrl && (
          <div className="h-[40px] bg-black flex items-center justify-center">
            <img src={clip.thumbnailUrl} alt={clip.title} className="h-full object-cover" />
          </div>
        )}
        
        {clip.type === 'audio' && (
          <div className="h-[40px] bg-black flex items-center justify-center">
            <div className="w-full h-[20px] bg-black">
              {/* Waveform simple */}
              <svg width="100%" height="20" viewBox="0 0 100 20">
                <path 
                  d="M0,10 Q10,5 20,10 T40,10 T60,10 T80,10 T100,10" 
                  fill="none" 
                  stroke="#4CAF50" 
                  strokeWidth="1"
                />
              </svg>
            </div>
          </div>
        )}
        
        {/* Controles del clip */}
        <div className="absolute bottom-0 right-0 p-1 flex space-x-1">
          <Button 
            variant="ghost" 
            size="icon"
            className="h-4 w-4 bg-black/50 hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              onUpdateClip(clip.id, { locked: !clip.locked });
            }}
          >
            {clip.locked ? <Unlock className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
          </Button>
          
          <Button 
            variant="ghost" 
            size="icon"
            className="h-4 w-4 bg-black/50 hover:bg-black/70"
            onClick={(e) => {
              e.stopPropagation();
              onDeleteClip(clip.id);
            }}
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
        
        {/* Handles para redimensionar */}
        <div 
          className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-black/20 hover:bg-black/40"
          onMouseDown={(e) => handleClipResize(e, clip.id, 'start')}
        />
        <div 
          className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-black/20 hover:bg-black/40"
          onMouseDown={(e) => handleClipResize(e, clip.id, 'end')}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col w-full h-full border-t border-zinc-800">
      {/* Pistas de la línea de tiempo */}
      <div className="w-40 shrink-0 border-r border-zinc-800">
        <div className="h-10 border-b border-zinc-800 flex items-center px-3">
          <span className="text-xs font-semibold text-zinc-400">PISTAS</span>
        </div>
        
        <div className="h-[320px]">
          {tracks.map((track, index) => (
            <div 
              key={track} 
              className="h-[80px] border-b border-zinc-800 px-3 flex items-center"
            >
              <div className="flex justify-between items-center w-full">
                <span className="text-xs font-medium">{track}</span>
                <div className="flex space-x-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ChevronUp className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Contenedor principal de la línea de tiempo */}
      <div className="flex-1 overflow-hidden" ref={droppableRef} {...droppableProps}>
        {/* Regla de tiempo */}
        <div className="h-10 border-b border-zinc-800 relative">
          <div className="absolute inset-0 overflow-auto">
            <div className="relative min-w-full h-full" style={{ width: `${timeToPixels(duration)}px` }}>
              {renderTimeMarkers()}
            </div>
          </div>
        </div>
        
        {/* Área de la línea de tiempo */}
        <div 
          className="relative w-full h-[320px] overflow-auto"
          ref={timelineContainerRef}
        >
          <div 
            ref={timelineRef}
            className="relative min-w-full h-full"
            style={{ width: `${timeToPixels(duration)}px` }}
            onClick={handleTimelineClick}
          >
            {/* Marcador de tiempo actual */}
            <div 
              className="absolute top-0 bottom-0 w-px bg-red-500 z-10"
              style={{ left: `${timeToPixels(currentTime)}px` }}
              onMouseDown={handleTimelineScrubStart}
            >
              <div className="h-3 w-3 rounded-full bg-red-500 absolute -top-1.5 -translate-x-1/2 cursor-ew-resize" />
            </div>
            
            {/* Fondo de pistas alternantes para mejor visibilidad */}
            {tracks.map((track, index) => (
              <div 
                key={track}
                className={cn(
                  "absolute left-0 right-0 h-[80px]",
                  index % 2 === 0 ? "bg-zinc-900/30" : "bg-zinc-950/30",
                  "border-b border-zinc-800"
                )}
                style={{ top: `${index * 80}px` }}
              />
            ))}
            
            {/* Clips en la línea de tiempo */}
            {clips.map(clip => renderClip(clip))}
          </div>
        </div>
        
        {/* Controles de la línea de tiempo */}
        <div className="h-10 border-t border-zinc-800 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" className="h-7">
              <Scissors className="h-4 w-4 mr-1" />
              Dividir
            </Button>
            <Button variant="ghost" size="sm" className="h-7">
              <AlignJustify className="h-4 w-4 mr-1" />
              Alinear
            </Button>
          </div>
          
          <div className="flex items-center">
            <span className="text-xs mr-2">
              {currentTime.toFixed(2)}s / {duration.toFixed(2)}s
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfessionalTimeline;