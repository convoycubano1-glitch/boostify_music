/**
 * Componente ClipItem para el editor de timeline
 * Representa un clip individual en la línea de tiempo
 * 
 * BOOSTIFY 2025 - Incluye botones de acción sobre cada clip:
 * - Edit Image (Nano Banana AI)
 * - Add Musician
 * - Camera Angles
 * - Regenerar Imagen
 * - Generar Video
 */
import React, { MouseEvent, useState } from 'react';
import { TimelineClip } from '../../../interfaces/timeline';
import { CLIP_COLORS } from '../../../constants/timeline-constants';
import { 
  Pencil, Guitar, Camera, RefreshCw, Video as VideoIcon, Sparkles
} from 'lucide-react';

// Props para acciones sobre el clip
interface ClipActionProps {
  onEditImage?: (clip: TimelineClip) => void;
  onAddMusician?: (clip: TimelineClip) => void;
  onCameraAngles?: (clip: TimelineClip) => void;
  onRegenerateImage?: (clip: TimelineClip) => void;
  onGenerateVideo?: (clip: TimelineClip) => void;
}

interface ClipItemProps extends ClipActionProps {
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
  return clip.imageUrl || clip.thumbnailUrl || clip.url || 
         (typeof clip.generatedImage === 'string' ? clip.generatedImage : null) ||
         clip.image_url || clip.publicUrl || clip.firebaseUrl || null;
};

/**
 * Clip individual en el timeline con botones de acción
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
  // Acciones
  onEditImage,
  onAddMusician,
  onCameraAngles,
  onRegenerateImage,
  onGenerateVideo,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Obtener URL de imagen si existe
  const imageUrl = getClipImageUrl(clip);
  const hasImage = imageUrl && (clip.type === 'IMAGE' || clip.type === 'VIDEO' || clip.generatedImage);
  const isImageClip = clip.type === 'IMAGE' || clip.type === 'GENERATED_IMAGE' || hasImage;

  // Calcular ancho mínimo para mostrar botones
  const clipWidth = clip.duration * timeScale;
  const showFullButtons = clipWidth >= 220;
  const showCompactButtons = clipWidth >= 140;
  const showAnyButtons = clipWidth >= 80;

  // Calcula el estilo del clip basado en su posición y duración
  const clipStyle: React.CSSProperties = {
    left: `${clip.start * timeScale}px`,
    width: `${clipWidth}px`,
    backgroundColor: hasImage ? 'transparent' : (clip.color || CLIP_COLORS[clip.type] || CLIP_COLORS.default),
    opacity: clip.opacity !== undefined ? clip.opacity : 1,
    cursor: isDragging ? 'grabbing' : 'grab',
    backgroundImage: hasImage ? `url(${imageUrl})` : 'none',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
  };

  const handleSelect = (e: MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);
  };

  const handleMoveStart = (e: MouseEvent) => {
    e.stopPropagation();
    onMoveStart(clip.id, e);
  };

  const handleResizeStart = (direction: 'start' | 'end', e: MouseEvent) => {
    e.stopPropagation();
    onResizeStart(clip.id, direction, e);
  };

  const formatDuration = (seconds: number): string => {
    return `${seconds.toFixed(1)}s`;
  };

  // Handler para botones de acción
  const handleActionClick = (e: MouseEvent, action?: (clip: TimelineClip) => void) => {
    e.stopPropagation();
    e.preventDefault();
    if (action) action(clip);
  };

  return (
    <div
      className={`clip-item ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''}`}
      style={clipStyle}
      onClick={handleSelect}
      onMouseDown={handleMoveStart}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
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
            <Sparkles size={8} /> IA
          </div>
        )}
        
        {/* Indicador de video generado */}
        {clip.videoUrl && (
          <div className="clip-video-badge" title="Video generado">
            <VideoIcon size={8} /> Video
          </div>
        )}
      </div>

      {/* ===== BOTONES DE ACCIÓN ===== */}
      {isImageClip && (isHovered || isSelected) && showAnyButtons && (
        <div className={`clip-action-buttons ${showFullButtons ? 'full' : showCompactButtons ? 'compact' : 'minimal'}`}>
          {/* Edit Image - Nano Banana AI */}
          {onEditImage && (
            <button
              className="action-btn edit"
              onClick={(e) => handleActionClick(e, onEditImage)}
              title="Editar Imagen (Nano Banana AI)"
            >
              <Pencil size={showFullButtons ? 14 : 12} />
              {showFullButtons && <span>Editar</span>}
            </button>
          )}
          
          {/* Add Musician */}
          {onAddMusician && showCompactButtons && (
            <button
              className="action-btn musician"
              onClick={(e) => handleActionClick(e, onAddMusician)}
              title="Agregar Músico"
            >
              <Guitar size={showFullButtons ? 14 : 12} />
              {showFullButtons && <span>Músico</span>}
            </button>
          )}
          
          {/* Camera Angles */}
          {onCameraAngles && showCompactButtons && (
            <button
              className="action-btn camera"
              onClick={(e) => handleActionClick(e, onCameraAngles)}
              title="Ángulos de Cámara"
            >
              <Camera size={showFullButtons ? 14 : 12} />
              {showFullButtons && <span>Cámara</span>}
            </button>
          )}
          
          {/* Regenerar Imagen */}
          {onRegenerateImage && (
            <button
              className="action-btn regenerate"
              onClick={(e) => handleActionClick(e, onRegenerateImage)}
              title="Regenerar Imagen"
            >
              <RefreshCw size={showFullButtons ? 14 : 12} />
              {showFullButtons && <span>Regen</span>}
            </button>
          )}
          
          {/* Generar Video */}
          {onGenerateVideo && (
            <button
              className="action-btn video"
              onClick={(e) => handleActionClick(e, onGenerateVideo)}
              title="Generar Video desde Imagen"
            >
              <VideoIcon size={showFullButtons ? 14 : 12} />
              {showFullButtons && <span>Video</span>}
            </button>
          )}
        </div>
      )}

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
          border-radius: 6px;
          overflow: visible;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
          user-select: none;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          align-items: stretch;
          color: white;
          font-size: 11px;
          transition: box-shadow 0.15s ease, transform 0.1s ease;
          border: 1px solid rgba(255,255,255,0.15);
        }
        
        @media (min-width: 640px) {
          .clip-item {
            font-size: 13px;
            border-radius: 8px;
          }
        }
        
        .clip-image-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(
            to bottom, 
            rgba(0,0,0,0.2) 0%, 
            rgba(0,0,0,0.1) 30%,
            rgba(0,0,0,0.5) 100%
          );
          pointer-events: none;
          z-index: 1;
          border-radius: inherit;
        }
        
        .clip-item.selected {
          box-shadow: 0 0 0 2px #f97316, 0 4px 12px rgba(249, 115, 22, 0.5);
          z-index: 10;
          border-color: #f97316;
        }
        
        .clip-item.dragging {
          opacity: 0.9;
          z-index: 100;
          transform: scale(1.02);
        }
        
        .clip-content {
          flex: 1;
          padding: 4px 6px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          position: relative;
          z-index: 2;
          overflow: hidden;
          gap: 2px;
        }
        
        @media (min-width: 640px) {
          .clip-content {
            padding: 6px 10px;
            gap: 3px;
          }
        }
        
        .clip-title {
          font-weight: 700;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          text-shadow: 
            0 1px 3px rgba(0, 0, 0, 0.9),
            0 0 8px rgba(0, 0, 0, 0.7);
          font-size: 11px;
          letter-spacing: 0.02em;
          line-height: 1.2;
        }
        
        @media (min-width: 640px) {
          .clip-title {
            font-size: 13px;
          }
        }
        
        .clip-duration {
          font-size: 10px;
          font-weight: 600;
          opacity: 0.95;
          text-shadow: 
            0 1px 2px rgba(0, 0, 0, 0.8),
            0 0 6px rgba(0, 0, 0, 0.6);
          background: rgba(0, 0, 0, 0.4);
          padding: 1px 4px;
          border-radius: 3px;
          width: fit-content;
        }
        
        @media (min-width: 640px) {
          .clip-duration {
            font-size: 11px;
            padding: 2px 6px;
            border-radius: 4px;
          }
        }
        
        .resize-handle {
          position: absolute;
          top: 0;
          width: 8px;
          height: 100%;
          cursor: col-resize;
          z-index: 20;
          background: transparent;
          transition: background 0.15s ease;
        }
        
        .resize-handle:hover {
          background: rgba(249, 115, 22, 0.5);
        }
        
        @media (min-width: 640px) {
          .resize-handle {
            width: 10px;
          }
        }
        
        .resize-handle.left {
          left: 0;
          border-radius: 6px 0 0 6px;
        }
        
        .resize-handle.right {
          right: 0;
          border-radius: 0 6px 6px 0;
        }
        
        /* Badges */
        .clip-ai-badge,
        .clip-video-badge {
          position: absolute;
          font-size: 8px;
          font-weight: 800;
          padding: 2px 5px;
          border-radius: 4px;
          text-shadow: 0 1px 2px rgba(0,0,0,0.5);
          box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          letter-spacing: 0.05em;
          display: flex;
          align-items: center;
          gap: 2px;
          z-index: 5;
          color: #fff;
        }
        
        .clip-ai-badge {
          top: 3px;
          right: 3px;
          background: linear-gradient(135deg, #f97316, #ea580c);
        }
        
        .clip-video-badge {
          top: 3px;
          left: 3px;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        
        @media (min-width: 640px) {
          .clip-ai-badge,
          .clip-video-badge {
            font-size: 9px;
            padding: 3px 6px;
          }
          .clip-ai-badge { top: 4px; right: 4px; }
          .clip-video-badge { top: 4px; left: 4px; }
        }
        
        /* ===== BOTONES DE ACCIÓN ===== */
        .clip-action-buttons {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          gap: 4px;
          z-index: 30;
          padding: 4px;
          background: rgba(0, 0, 0, 0.8);
          border-radius: 8px;
          backdrop-filter: blur(4px);
          border: 1px solid rgba(255, 255, 255, 0.15);
          animation: fadeIn 0.15s ease;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.9); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        
        .clip-action-buttons.full {
          flex-wrap: wrap;
          justify-content: center;
          max-width: 95%;
        }
        
        .clip-action-buttons.compact,
        .clip-action-buttons.minimal {
          flex-wrap: nowrap;
        }
        
        .action-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 6px 8px;
          border: none;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
          color: white;
          white-space: nowrap;
        }
        
        .action-btn:hover {
          transform: scale(1.08);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        .action-btn:active {
          transform: scale(0.95);
        }
        
        .action-btn.edit {
          background: linear-gradient(135deg, #f97316, #ea580c);
        }
        .action-btn.edit:hover {
          background: linear-gradient(135deg, #fb923c, #f97316);
        }
        
        .action-btn.musician {
          background: linear-gradient(135deg, #22c55e, #16a34a);
        }
        .action-btn.musician:hover {
          background: linear-gradient(135deg, #4ade80, #22c55e);
        }
        
        .action-btn.camera {
          background: linear-gradient(135deg, #eab308, #ca8a04);
        }
        .action-btn.camera:hover {
          background: linear-gradient(135deg, #facc15, #eab308);
        }
        
        .action-btn.regenerate {
          background: linear-gradient(135deg, #a855f7, #9333ea);
        }
        .action-btn.regenerate:hover {
          background: linear-gradient(135deg, #c084fc, #a855f7);
        }
        
        .action-btn.video {
          background: linear-gradient(135deg, #3b82f6, #2563eb);
        }
        .action-btn.video:hover {
          background: linear-gradient(135deg, #60a5fa, #3b82f6);
        }
        
        @media (min-width: 640px) {
          .action-btn {
            padding: 8px 10px;
            font-size: 11px;
          }
        }
      `}</style>
    </div>
  );
};

export { ClipItem };
export default ClipItem;