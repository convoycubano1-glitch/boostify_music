/**
 * Componente TimelineClip
 * 
 * Este componente renderiza un clip individual en la línea de tiempo.
 * Maneja la visualización, selección, arrastre y redimensionamiento de clips.
 */

import React, { useState, useRef } from 'react';
import { 
  Trash2, 
  Copy, 
  Scissors, 
  Play, 
  Lock, 
  Info, 
  AlertTriangle 
} from 'lucide-react';
import { CLIP_COLORS, LayerType } from '../../constants/timeline-constants';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

/**
 * Tipo para un clip de la línea de tiempo
 */
export interface TimelineClip {
  id: number;
  title: string; 
  type: string;
  layer: number;
  start: number;
  duration: number;
  selected?: boolean;
  metadata?: {
    isAIGenerated?: boolean;
    thumbnail?: string;
    source?: string;
    [key: string]: any;
  };
}

/**
 * Props para el componente TimelineClip
 */
interface TimelineClipProps {
  clip: TimelineClip;
  selected: boolean;
  timeToPixels: (time: number) => number;
  disabled?: boolean;
  pixelsPerSecond?: number;
  minWidth?: number;
  onSelect: (id: number, multiSelect?: boolean) => void;
  onDelete?: (id: number) => void;
  onDuplicate?: (id: number) => void;
  onSplit?: (id: number, time: number) => void;
  onPreview?: (id: number) => void;
  onMouseDown?: (e: React.MouseEvent, clipId: number, handle?: 'start' | 'end' | 'body') => void;
  onMouseMove?: (e: React.MouseEvent, clipId: number) => void;
  onMouseUp?: (e: React.MouseEvent, clipId: number) => void;
}

/**
 * Componente que muestra un clip en la línea de tiempo
 */
export const TimelineClipComponent: React.FC<TimelineClipProps> = ({
  clip,
  selected,
  timeToPixels,
  disabled = false,
  pixelsPerSecond = 100,
  minWidth = 5,
  onSelect,
  onDelete,
  onDuplicate,
  onSplit,
  onPreview,
  onMouseDown,
  onMouseMove,
  onMouseUp
}) => {
  // Referencias y estado
  const clipRef = useRef<HTMLDivElement>(null);
  const [showControls, setShowControls] = useState(false);
  
  // Calcular las dimensiones y posición del clip
  const clipWidth = Math.max(timeToPixels(clip.duration), minWidth);
  const clipLeft = timeToPixels(clip.start);
  
  // Determinar los colores basados en el tipo de clip
  const colors = CLIP_COLORS[clip.type as LayerType] || CLIP_COLORS.video;
  
  // Manejar el clic en el clip
  const handleClipClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const multiSelect = e.ctrlKey || e.metaKey;
    onSelect(clip.id, multiSelect);
  };
  
  // Manejar acciones del menú de clip
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) onDelete(clip.id);
  };
  
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDuplicate) onDuplicate(clip.id);
  };
  
  const handleSplit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSplit) {
      // Calcular el punto medio para dividir
      const splitPoint = clip.start + (clip.duration / 2);
      onSplit(clip.id, splitPoint);
    }
  };
  
  const handlePreview = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onPreview) onPreview(clip.id);
  };
  
  // Manejar eventos del mouse para drag & resize
  const handleMouseDown = (e: React.MouseEvent, handle?: 'start' | 'end' | 'body') => {
    if (disabled) return;
    e.stopPropagation();
    if (onMouseDown) onMouseDown(e, clip.id, handle);
  };
  
  // Determinar si el clip es un placeholder de IA
  const isAIPlaceholder = clip.metadata?.isAIGenerated || clip.type === LayerType.AI_PLACEHOLDER;
  
  return (
    <div
      ref={clipRef}
      className={`absolute rounded-md flex flex-col overflow-hidden transition-colors h-full
        ${selected ? 'ring-2 ring-primary z-10' : 'z-1'}
        ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}
      `}
      style={{
        left: `${clipLeft}px`,
        width: `${clipWidth}px`,
        backgroundColor: selected ? colors.selected : colors.background,
        borderColor: colors.border,
        borderWidth: '1px',
      }}
      onClick={handleClipClick}
      onMouseEnter={() => setShowControls(true)}
      onMouseLeave={() => setShowControls(false)}
      onMouseDown={(e) => handleMouseDown(e, 'body')}
      onMouseMove={(e) => onMouseMove && onMouseMove(e, clip.id)}
      onMouseUp={(e) => onMouseUp && onMouseUp(e, clip.id)}
    >
      {/* Manejador de resize izquierdo */}
      {!disabled && (
        <div
          className="absolute left-0 top-0 w-3 h-full cursor-w-resize z-20"
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        />
      )}
      
      {/* Contenido del clip */}
      <div className="flex items-center p-1 overflow-hidden h-full">
        {/* Icono o thumbnail */}
        {clip.metadata?.thumbnail ? (
          <div className="w-6 h-6 mr-1 flex-shrink-0">
            <img 
              src={clip.metadata.thumbnail} 
              alt={clip.title} 
              className="w-full h-full object-cover rounded-sm"
            />
          </div>
        ) : (
          isAIPlaceholder && (
            <div className="w-5 h-5 mr-1 flex-shrink-0 text-purple-200">
              <AlertTriangle size={16} />
            </div>
          )
        )}
        
        {/* Título del clip */}
        <div 
          className="text-sm font-medium truncate text-white flex-1"
          style={{ color: colors.text }}
        >
          {clip.title}
        </div>
        
        {/* Indicadores de estado */}
        {isAIPlaceholder && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="ml-1 text-purple-200">
                  <Info size={14} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Placeholder IA (máx. 5 segundos)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Barra de duración */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 opacity-30">
        <div 
          className="h-full"
          style={{ 
            width: `${(clip.duration / 60) * 100}%`,
            backgroundColor: selected ? colors.selected : colors.border,
            opacity: 0.6
          }}
        />
      </div>
      
      {/* Controles flotantes */}
      {showControls && !disabled && (
        <div className="absolute top-0 right-0 p-1 flex gap-1 bg-black bg-opacity-50 rounded-bl-md z-20">
          {/* Previsualizar clip */}
          <button
            onClick={handlePreview}
            className="text-white hover:text-blue-400 p-0.5"
            title="Previsualizar"
          >
            <Play size={14} />
          </button>
          
          {/* Duplicar clip */}
          <button
            onClick={handleDuplicate}
            className="text-white hover:text-green-400 p-0.5"
            title="Duplicar"
          >
            <Copy size={14} />
          </button>
          
          {/* Dividir clip */}
          <button
            onClick={handleSplit}
            className="text-white hover:text-yellow-400 p-0.5"
            title="Dividir"
          >
            <Scissors size={14} />
          </button>
          
          {/* Eliminar clip */}
          <button
            onClick={handleDelete}
            className="text-white hover:text-red-400 p-0.5"
            title="Eliminar"
          >
            <Trash2 size={14} />
          </button>
        </div>
      )}
      
      {/* Indicador de clip bloqueado */}
      {disabled && (
        <div className="absolute top-0 right-0 p-1">
          <Lock size={14} className="text-gray-400" />
        </div>
      )}
      
      {/* Manejador de resize derecho */}
      {!disabled && (
        <div
          className="absolute right-0 top-0 w-3 h-full cursor-e-resize z-20"
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        />
      )}
    </div>
  );
};

export { TimelineClipComponent as TimelineClip };
export default TimelineClipComponent;