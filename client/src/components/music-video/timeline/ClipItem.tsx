/**
import { logger } from "../../lib/logger";
 * Componente ClipItem para el editor de timeline
 * Representa un clip individual en la línea de tiempo
 */
import React, { MouseEvent } from 'react';
import { TimelineClip } from '../../../interfaces/timeline';
import { CLIP_COLORS } from '../../../constants/timeline-constants';

interface ClipItemProps {
  clip: TimelineClip;
  timeScale: number;
  isSelected: boolean;
  onSelect: (clipId: number) => void;
  onMoveStart: (clipId: number, e: MouseEvent) => void;
  onResizeStart: (clipId: number, direction: 'start' | 'end', e: MouseEvent) => void;
  isDragging: boolean;
  isResizing: boolean;
}

/**
 * Obtiene la URL de imagen del clip buscando en todos los campos posibles
 */
const getClipImageUrl = (clip: TimelineClip): string | null => {
  return clip.imageUrl || clip.thumbnail || clip.url || 
         clip.generatedImage || clip.image_url || 
         clip.publicUrl || clip.firebaseUrl || null;
};

/**
 * Clip individual en el timeline
 * 
 * Características:
 * - Muestra el clip con su duración en la posición correcta
 * - Permite seleccionar, mover y redimensionar el clip
 * - Visualiza el estado seleccionado
 * - Muestra información como el título del clip
 * - Muestra imagen de fondo si existe (generada por IA)
 */
const ClipItem: React.FC<ClipItemProps> = ({
  clip,
  timeScale,
  isSelected,
  onSelect,
  onMoveStart,
  onResizeStart,
  isDragging,
  isResizing,
}) => {
  // Obtener URL de imagen si existe
  const imageUrl = getClipImageUrl(clip);
  const hasImage = imageUrl && (clip.type === 'image' || clip.type === 'video' || clip.generatedImage);

  // Calcula el estilo del clip basado en su posición y duración
  const clipStyle = {
    left: `${clip.start * timeScale}px`,
    width: `${clip.duration * timeScale}px`,
    backgroundColor: hasImage ? 'transparent' : (clip.color || CLIP_COLORS[clip.type] || CLIP_COLORS.default),
    opacity: clip.opacity !== undefined ? clip.opacity : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    backgroundImage: hasImage ? `url(${imageUrl})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  /**
   * Maneja la selección del clip
   */
  const handleSelect = (e: MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);
  };

  /**
   * Inicia el movimiento del clip
   */
  const handleMoveStart = (e: MouseEvent) => {
    e.stopPropagation();
    onMoveStart(clip.id, e);
  };

  /**
   * Inicia el redimensionamiento del clip
   */
  const handleResizeStart = (direction: 'start' | 'end', e: MouseEvent) => {
    e.stopPropagation();
    onResizeStart(clip.id, direction, e);
  };

  /**
   * Formatea la duración para mostrarla en el clip
   * @param seconds Duración en segundos
   * @returns Duración formateada (ej: "2.5s")
   */
  const formatDuration = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
  };

  return (
    <div
      className={`clip-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={clipStyle}
      onClick={handleSelect}
      onMouseDown={handleMoveStart}
    >
      {/* Overlay oscuro para legibilidad del texto sobre imagen */}
      {hasImage && (
        <div className="clip-image-overlay" />
      )}
      
      {/* Manejador de redimensionamiento (inicio) */}
      <div
        className="resize-handle left"
        onMouseDown={(e) => handleResizeStart('start', e)}
      />

      {/* Contenido del clip */}
      <div className="clip-content">
        <div className="clip-title" title={clip.title}>
          {clip.title}
        </div>
        <div className="clip-duration">
          {formatDuration(clip.duration)}
        </div>
        
        {/* Indicador de clip generado por IA */}
        {clip.generatedImage && (
          <div className="clip-ai-badge" title="Imagen generada por IA">
            IA
          </div>
        )}
        
        {/* Indicador de sincronización labial */}
        {clip.lipsyncApplied && (
          <div className="clip-lipsync-badge" title="Sincronización labial aplicada">
            Lip
          </div>
        )}
      </div>

      {/* Manejador de redimensionamiento (fin) */}
      <div
        className="resize-handle right"
        onMouseDown={(e) => handleResizeStart('end', e)}
      />

      {/* Estilos del componente */}
      <style jsx>{`
        .clip-item {
          position: absolute;
          height: calc(100% - 4px);
          margin: 2px 0;
          border-radius: 4px;
          overflow: hidden;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
          user-select: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          align-items: stretch;
          color: white;
          font-size: 12px;
          transition: box-shadow 0.15s ease;
        }
        
        .clip-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.5));
          pointer-events: none;
          z-index: 1;
        }
        
        .clip-item.selected {
          box-shadow: 0 0 0 2px #ffffff, 0 0 0 4px #3498db;
          z-index: 10;
        }
        
        .clip-item.dragging {
          opacity: 0.8;
          z-index: 100;
        }
        
        .clip-content {
          flex: 1;
          padding: 4px 8px;
          display: flex;
          flex-direction: column;
          position: relative;
          z-index: 2;
          overflow: hidden;
        }
        
        .clip-title {
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 0 1px 1px rgba(0, 0, 0, 0.5);
        }
        
        .clip-duration {
          font-size: 10px;
          opacity: 0.9;
          margin-top: 2px;
        }
        
        .resize-handle {
          position: absolute;
          top: 0;
          width: 8px;
          height: 100%;
          cursor: col-resize;
          z-index: 20;
        }
        
        .resize-handle.left {
          left: 0;
        }
        
        .resize-handle.right {
          right: 0;
        }
        
        .clip-ai-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          background-color: #f1c40f;
          color: #000;
          font-size: 9px;
          font-weight: bold;
          padding: 1px 3px;
          border-radius: 2px;
        }
        
        .clip-lipsync-badge {
          position: absolute;
          bottom: 2px;
          right: 2px;
          background-color: #9b59b6;
          color: #fff;
          font-size: 9px;
          font-weight: bold;
          padding: 1px 3px;
          border-radius: 2px;
        }
      `}</style>
    </div>
  );
};

export { ClipItem };
export default ClipItem;