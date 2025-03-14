/**
 * Componente LayerRow - Representa una fila individual de la línea de tiempo
 * 
 * Este componente es responsable de renderizar una capa individual del timeline
 * y gestionar los clips que pertenecen a esa capa.
 */
import React from 'react';
import { 
  LayerConfig, 
  TimelineClip,
  ClipType,
  LayerType
} from '../../../interfaces/timeline';
import { 
  LAYER_HEADER_WIDTH, 
  DEFAULT_LAYER_HEIGHT,
  MAX_CLIP_DURATION
} from '../../../constants/timeline-constants';
import { ClipItem } from './ClipItem';

interface LayerRowProps {
  layer: LayerConfig;
  clips: TimelineClip[];
  zoom: number;
  currentTime: number;
  duration: number;
  onSelectClip: (clipId: number | null) => void;
  selectedClipId: number | null;
  onMoveClip?: (clipId: number, newStart: number, newLayerId: number) => void;
  onResizeClip?: (clipId: number, newStart: number, newDuration: number) => void;
}

/**
 * Componente para mostrar una fila de capa en el timeline
 */
export const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  clips,
  zoom,
  currentTime,
  duration,
  onSelectClip,
  selectedClipId,
  onMoveClip,
  onResizeClip
}) => {
  // Filtrar clips que pertenecen a esta capa
  const layerClips = clips.filter(clip => clip.layerId === layer.id);
  
  // Estado para el arrastre de clips
  const [draggedClipId, setDraggedClipId] = React.useState<number | null>(null);
  const [dragStartX, setDragStartX] = React.useState<number>(0);
  const [dragStartY, setDragStartY] = React.useState<number>(0);
  const [clipOffset, setClipOffset] = React.useState<{x: number, y: number}>({x: 0, y: 0});
  
  // Validaciones específicas para esta capa
  const validateClipPlacement = (clip: TimelineClip, newStart: number, newDuration?: number): boolean => {
    // Comprobar si es una imagen generada por IA (solo permitida en capa 7)
    if (clip.type === ClipType.GENERATED_IMAGE && layer.id !== 7) {
      return false;
    }
    
    // Comprobar duración máxima (5 segundos)
    const clipDuration = newDuration || clip.duration;
    if (clipDuration > MAX_CLIP_DURATION) {
      return false;
    }
    
    // Comprobar superposición con otros clips en la misma capa
    const overlapping = layerClips.some(c => {
      if (c.id === clip.id) return false; // Ignorar el clip actual
      
      // Calcular si hay superposición
      const clipEnd = newStart + clipDuration;
      const otherClipEnd = c.start + c.duration;
      
      return (
        (newStart >= c.start && newStart < otherClipEnd) ||
        (clipEnd > c.start && clipEnd <= otherClipEnd) ||
        (newStart <= c.start && clipEnd >= otherClipEnd)
      );
    });
    
    return !overlapping;
  };
  
  // Manejadores de eventos para arrastrar clips
  const handleDragStart = (clipId: number, e: React.MouseEvent) => {
    setDraggedClipId(clipId);
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    
    const clipElement = e.currentTarget as HTMLElement;
    const rect = clipElement.getBoundingClientRect();
    setClipOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  const handleDragMove = (e: MouseEvent) => {
    if (!draggedClipId) return;
    
    const draggingClip = clips.find(clip => clip.id === draggedClipId);
    if (!draggingClip) return;
    
    // Calcular nueva posición
    const deltaX = e.clientX - dragStartX;
    const calculatedStart = draggingClip.start + (deltaX / zoom);
    const newStart = Math.max(0, Math.min(duration - draggingClip.duration, calculatedStart));
    
    // Validar si la nueva posición es válida
    if (validateClipPlacement(draggingClip, newStart)) {
      onMoveClip?.(draggedClipId, newStart, layer.id);
    }
  };
  
  const handleDragEnd = () => {
    setDraggedClipId(null);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };
  
  // Manejador para redimensionar clips
  const handleResizeClip = (clipId: number, newStart: number, newDuration: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    // Validar si la nueva dimensión es válida
    if (validateClipPlacement(clip, newStart, newDuration)) {
      onResizeClip?.(clipId, newStart, newDuration);
    }
  };
  
  // Estilo para la línea de tiempo actual
  const currentTimeIndicatorStyle = {
    left: `${currentTime * zoom}px`,
    height: `${layer.height || DEFAULT_LAYER_HEIGHT}px`,
    position: 'absolute' as const,
    top: 0,
    width: '2px',
    backgroundColor: 'red',
    zIndex: 10
  };
  
  return (
    <div 
      className="timeline-layer"
      style={{
        display: 'flex',
        width: '100%',
        height: `${layer.height || DEFAULT_LAYER_HEIGHT}px`,
        marginBottom: '2px',
        position: 'relative'
      }}
    >
      {/* Cabecera de la capa */}
      <div 
        className="layer-header"
        style={{
          width: `${LAYER_HEADER_WIDTH}px`,
          backgroundColor: layer.color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          padding: '0 8px',
          position: 'sticky',
          left: 0,
          zIndex: 5,
          boxShadow: '2px 0 5px rgba(0, 0, 0, 0.2)'
        }}
      >
        {layer.name}
      </div>
      
      {/* Contenido de la capa (clips) */}
      <div 
        className="layer-content"
        style={{
          position: 'relative',
          width: `calc(100% - ${LAYER_HEADER_WIDTH}px)`,
          height: '100%',
          backgroundColor: layer.locked ? '#444' : '#333',
          opacity: layer.visible ? 1 : 0.5,
          overflow: 'hidden'
        }}
      >
        {/* Indicador de tiempo actual */}
        <div style={currentTimeIndicatorStyle} />
        
        {/* Renderizar clips de esta capa */}
        {layerClips.map(clip => (
          <ClipItem
            key={clip.id}
            clip={clip}
            zoom={zoom}
            selected={selectedClipId === clip.id}
            onClick={() => onSelectClip(clip.id)}
            onDragStart={(e) => handleDragStart(clip.id, e)}
            onResize={(newStart, newDuration) => handleResizeClip(clip.id, newStart, newDuration)}
            layerHeight={layer.height || DEFAULT_LAYER_HEIGHT}
          />
        ))}
      </div>
      
      <style jsx>
        {`
          .timeline-layer:hover {
            background-color: rgba(255, 255, 255, 0.05);
          }
          
          .layer-header {
            border-radius: 2px 0 0 2px;
            font-size: 12px;
            user-select: none;
          }
          
          .layer-content {
            border-bottom: 1px solid #444;
          }
        `}
      </style>
    </div>
  );
};