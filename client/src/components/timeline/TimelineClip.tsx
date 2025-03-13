/**
 * Componente para representar y manejar clips individuales en el timeline
 * Incluye gestión de restricciones para clips aislados y placeholders de IA
 */

import React, { useRef, useState } from 'react';
import { Trash2, Copy, Scissors, RefreshCw, Lock } from 'lucide-react';
import { TimelineClip } from '../../hooks/useIsolatedLayers';
import { AI_PLACEHOLDER_RESTRICTIONS, ClipOperation, LayerType } from '../../constants/timeline-constants';

// Exportar el componente como default también para facilitar importación
export default TimelineClipComponent;

interface TimelineClipProps {
  clip: TimelineClip;
  selected: boolean;
  zoom: number; 
  layerHeight: number;
  pixelsPerSecond: number;
  isLayerLocked: boolean;
  onSelect: (id: number) => void;
  onMove: (id: number, newStart: number) => void;
  onResize: (id: number, newDuration: number) => void;
  onDelete: (id: number) => void;
  onDuplicate: (id: number) => void;
  onSplit: (id: number, position: number) => void;
  onRegenerate?: (id: number) => void;
}

export function TimelineClipComponent({
  clip,
  selected,
  zoom,
  layerHeight,
  pixelsPerSecond,
  isLayerLocked,
  onSelect,
  onMove,
  onResize,
  onDelete,
  onDuplicate,
  onSplit,
  onRegenerate
}: TimelineClipProps) {
  const [operation, setOperation] = useState<ClipOperation>(ClipOperation.NONE);
  const [startOffset, setStartOffset] = useState<number>(0);
  const [initialX, setInitialX] = useState<number>(0);
  const clipRef = useRef<HTMLDivElement>(null);

  // Calcular dimensiones del clip
  const width = clip.duration * pixelsPerSecond * zoom;
  const left = clip.start * pixelsPerSecond * zoom;
  
  // Determinar el tipo visual del clip para mostrar el color adecuado
  const getClipTypeClass = () => {
    switch (clip.type) {
      case 'audio':
        return 'bg-orange-200 border-orange-400';
      case 'image': 
        return 'bg-blue-200 border-blue-400';
      case 'video':
        return 'bg-green-200 border-green-400';
      case 'text':
        return 'bg-purple-200 border-purple-400';
      default:
        return 'bg-gray-200 border-gray-400';
    }
  };

  // Verificar si el clip es un placeholder generado por IA
  const isAIPlaceholder = Boolean(clip.placeholderType);
  
  // Verificar si el clip está bloqueado (aislado o en capa bloqueada)
  const isLocked = isLayerLocked || clip.isIsolated;

  // Calcular si el clip tiene restricciones de duración
  const hasMaxDuration = isAIPlaceholder || clip.maxDuration !== undefined;
  const maxDuration = isAIPlaceholder 
    ? AI_PLACEHOLDER_RESTRICTIONS.maxDuration 
    : clip.maxDuration;

  // Iniciar operación de arrastre
  const handleMouseDown = (e: React.MouseEvent, op: ClipOperation) => {
    if (isLocked && op !== ClipOperation.SELECT) return;
    
    e.stopPropagation();
    e.preventDefault();
    
    // Seleccionar el clip si no está seleccionado
    if (!selected) {
      onSelect(clip.id);
    }
    
    // Iniciar la operación
    setOperation(op);
    setInitialX(e.clientX);
    
    if (op === ClipOperation.MOVE) {
      // Para mover, guardar el offset inicial donde se hizo clic
      const clipRect = clipRef.current?.getBoundingClientRect();
      if (clipRect) {
        setStartOffset(e.clientX - clipRect.left);
      }
    }
    
    // Agregar controladores de eventos a nivel de documento
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Manejar movimiento durante la operación de arrastre
  const handleMouseMove = (e: MouseEvent) => {
    if (operation === ClipOperation.NONE) return;
    
    const deltaX = e.clientX - initialX;
    
    if (operation === ClipOperation.MOVE) {
      // Calcular nueva posición basada en el offset inicial
      const newPosition = clip.start + (deltaX / (pixelsPerSecond * zoom));
      onMove(clip.id, Math.max(0, newPosition));
    } 
    else if (operation === ClipOperation.RESIZE) {
      // Calcular nueva duración basada en el cambio de ancho
      const deltaTime = deltaX / (pixelsPerSecond * zoom);
      const newDuration = Math.max(0.1, clip.duration + deltaTime);
      
      // Aplicar restricción de duración máxima si existe
      if (hasMaxDuration && maxDuration !== undefined) {
        onResize(clip.id, Math.min(newDuration, maxDuration));
      } else {
        onResize(clip.id, newDuration);
      }
    }
    
    // Actualizar la posición inicial para el siguiente movimiento
    setInitialX(e.clientX);
  };

  // Finalizar operación de arrastre
  const handleMouseUp = () => {
    setOperation(ClipOperation.NONE);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Manejar clic en el clip
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);
  };

  return (
    <div
      ref={clipRef}
      className={`
        absolute rounded border-2 shadow-sm
        ${getClipTypeClass()}
        ${selected ? 'ring-2 ring-primary' : ''}
        ${isLocked ? 'opacity-70' : 'hover:brightness-95'}
        transition-all duration-75
      `}
      style={{
        width: `${width}px`,
        left: `${left}px`,
        height: `${layerHeight - 4}px`,
        top: '2px',
        zIndex: selected ? 10 : 1,
        cursor: isLocked ? 'not-allowed' : 'move'
      }}
      onClick={handleClick}
      onMouseDown={(e) => handleMouseDown(e, ClipOperation.MOVE)}
    >
      {/* Contenido del clip */}
      <div className="flex flex-col h-full overflow-hidden p-1">
        <div className="flex justify-between items-center text-xs font-medium truncate">
          <span className="truncate">{clip.title || `Clip ${clip.id}`}</span>
          {isLocked && <Lock className="h-3 w-3 text-gray-600" />}
        </div>
        
        {/* Información adicional */}
        <div className="text-[10px] text-gray-600 truncate">
          {clip.duration.toFixed(1)}s
          {isAIPlaceholder && " (IA)"}
        </div>
        
        {/* Miniatura si está disponible */}
        {clip.thumbnail && (
          <div className="absolute inset-0 bg-center bg-cover opacity-15 pointer-events-none" 
               style={{ backgroundImage: `url(${clip.thumbnail})` }} />
        )}
      </div>

      {/* Controles del clip (solo se muestran si está seleccionado) */}
      {selected && !isLocked && (
        <div className="absolute -bottom-8 left-0 flex gap-1 bg-white border rounded-md shadow-sm p-1 z-20">
          <button 
            className="text-gray-600 hover:text-red-500 p-1 rounded-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(clip.id);
            }}
            title="Eliminar clip"
          >
            <Trash2 size={14} />
          </button>
          
          <button 
            className="text-gray-600 hover:text-blue-500 p-1 rounded-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate(clip.id);
            }}
            title="Duplicar clip"
          >
            <Copy size={14} />
          </button>
          
          <button 
            className="text-gray-600 hover:text-yellow-500 p-1 rounded-sm"
            onClick={(e) => {
              e.stopPropagation();
              // Calcular la posición media para cortar
              const splitPosition = clip.start + (clip.duration / 2);
              onSplit(clip.id, splitPosition);
            }}
            title="Dividir clip"
          >
            <Scissors size={14} />
          </button>
          
          {isAIPlaceholder && onRegenerate && (
            <button 
              className="text-gray-600 hover:text-green-500 p-1 rounded-sm"
              onClick={(e) => {
                e.stopPropagation();
                onRegenerate(clip.id);
              }}
              title="Regenerar contenido IA"
            >
              <RefreshCw size={14} />
            </button>
          )}
        </div>
      )}

      {/* Control de redimensionamiento */}
      {!isLocked && (
        <div 
          className="absolute right-0 top-0 bottom-0 w-4 cursor-e-resize"
          onMouseDown={(e) => handleMouseDown(e, ClipOperation.RESIZE)}
          title={hasMaxDuration ? `Máx: ${maxDuration}s` : "Redimensionar"}
        >
          <div className="absolute right-0 top-0 bottom-0 w-1 bg-gray-400 opacity-50" />
        </div>
      )}
      
      {/* Indicador de duración máxima para clips IA */}
      {isAIPlaceholder && (
        <div 
          className="absolute top-0 right-0 text-[8px] bg-orange-400 text-white px-1 rounded-bl"
          title={`Placeholder IA - máx ${maxDuration}s`}
        >
          IA
        </div>
      )}
    </div>
  );
}