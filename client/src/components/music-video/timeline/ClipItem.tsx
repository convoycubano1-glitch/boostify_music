/**
 * Componente que representa un clip individual en el timeline
 * Gestiona la visualización, selección y operaciones específicas de los clips
 */
import React from 'react';
import { TimelineClip } from '../../../interfaces/timeline';

interface ClipItemProps {
  clip: TimelineClip;
  timeScale: number;
  isSelected: boolean;
  onSelect: () => void;
  onMoveStart: (e: React.MouseEvent) => void;
  onResizeStart: (direction: 'start' | 'end', e: React.MouseEvent) => void;
  disabled?: boolean;
}

const ClipItem: React.FC<ClipItemProps> = ({
  clip,
  timeScale,
  isSelected,
  onSelect,
  onMoveStart,
  onResizeStart,
  disabled = false
}) => {
  // Calcular posición y tamaño del clip en pixels
  const left = clip.start * timeScale;
  const width = clip.duration * timeScale;
  
  // Iniciar drag and drop
  const handleDragStart = (e: React.DragEvent) => {
    if (disabled) {
      e.preventDefault();
      return;
    }
    
    e.dataTransfer.setData('clip-id', clip.id.toString());
    e.dataTransfer.effectAllowed = 'move';
  };
  
  // Manejar clic para seleccionar
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect();
  };
  
  // Determinar el color del clip según su tipo
  const getClipColor = (): string => {
    switch (clip.type) {
      case 'audio':
        return '#4299e1'; // Azul
      case 'video':
        return '#48bb78'; // Verde
      case 'image':
        return clip.generatedImage ? '#d69e2e' : '#38b2ac'; // Amarillo para IA, Turquesa para normal
      case 'text':
        return '#ed8936'; // Naranja
      case 'effect':
        return '#9f7aea'; // Púrpura
      default:
        return '#a0aec0'; // Gris por defecto
    }
  };
  
  // Determinar el ícono según el tipo de clip
  const getClipIcon = (): string => {
    switch (clip.type) {
      case 'audio':
        return '🔊';
      case 'video':
        return '🎬';
      case 'image':
        return clip.generatedImage ? '🤖' : '🖼️';
      case 'text':
        return '📝';
      case 'effect':
        return '✨';
      default:
        return '📎';
    }
  };
  
  return (
    <div
      className={`timeline-clip ${isSelected ? 'selected' : ''} ${disabled ? 'disabled' : ''}`}
      style={{
        left: `${left}px`,
        width: `${Math.max(20, width)}px`,
        backgroundColor: getClipColor(),
      }}
      onClick={handleClick}
      onMouseDown={disabled ? undefined : onMoveStart}
      draggable={!disabled}
      onDragStart={handleDragStart}
    >
      {/* Controlador para redimensionar desde el inicio */}
      {!disabled && (
        <div 
          className="resize-handle resize-start"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart('start', e);
          }}
        />
      )}
      
      {/* Contenido del clip */}
      <div className="clip-content">
        <span className="clip-icon">{getClipIcon()}</span>
        <div className="clip-info">
          <div className="clip-title">{clip.title}</div>
          <div className="clip-duration">{clip.duration.toFixed(1)}s</div>
        </div>
      </div>
      
      {/* Controlador para redimensionar desde el final */}
      {!disabled && (
        <div 
          className="resize-handle resize-end"
          onMouseDown={(e) => {
            e.stopPropagation();
            onResizeStart('end', e);
          }}
        />
      )}
      
      {/* Estilos para el clip */}
      <style jsx>{`
        .timeline-clip {
          position: absolute;
          height: calc(100% - 4px);
          top: 2px;
          border-radius: 4px;
          overflow: hidden;
          user-select: none;
          cursor: grab;
          z-index: 1;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: box-shadow 0.15s ease;
        }
        
        .timeline-clip:hover {
          box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
          z-index: 2;
        }
        
        .timeline-clip.selected {
          box-shadow: 0 0 0 2px white, 0 0 0 4px #3182ce;
          z-index: 3;
        }
        
        .timeline-clip.disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        
        .resize-handle {
          position: absolute;
          top: 0;
          width: 8px;
          height: 100%;
          cursor: col-resize;
          z-index: 10;
        }
        
        .resize-start {
          left: 0;
        }
        
        .resize-end {
          right: 0;
        }
        
        .clip-content {
          display: flex;
          align-items: center;
          padding: 4px 6px;
          height: 100%;
          color: white;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }
        
        .clip-icon {
          font-size: 12px;
          margin-right: 4px;
        }
        
        .clip-info {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          font-size: 10px;
        }
        
        .clip-title {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .clip-duration {
          font-size: 9px;
          opacity: 0.8;
        }
      `}</style>
    </div>
  );
};

export default ClipItem;