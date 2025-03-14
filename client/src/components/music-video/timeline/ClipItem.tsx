/**
 * Componente para renderizar un clip individual en el timeline
 * Se utiliza para mostrar los clips en las capas del timeline
 */
import React, { useCallback } from 'react';
import { TimelineClip } from '../../../interfaces/timeline';
import { CLIP_COLORS } from '../../../constants/timeline-constants';

interface ClipItemProps {
  clip: TimelineClip;
  timeScale: number;
  selected: boolean;
  onSelect: (clipId: number) => void;
  onMoveStart: (clipId: number, e: React.MouseEvent) => void;
  onResizeStart: (clipId: number, direction: 'start' | 'end', e: React.MouseEvent) => void;
}

const ClipItem: React.FC<ClipItemProps> = ({
  clip,
  timeScale,
  selected,
  onSelect,
  onMoveStart,
  onResizeStart
}) => {
  // Calcular la posición y ancho del clip basado en la escala de tiempo
  const clipStyle = {
    left: `${clip.start * timeScale}px`,
    width: `${clip.duration * timeScale}px`,
    backgroundColor: CLIP_COLORS[clip.type] || CLIP_COLORS.video,
    opacity: clip.visible ? 1 : 0.5,
    borderColor: selected ? '#fff' : 'transparent'
  };

  // Manejadores de eventos
  const handleSelect = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(clip.id);
  }, [clip.id, onSelect]);

  const handleMoveStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onMoveStart(clip.id, e);
  }, [clip.id, onMoveStart]);

  const handleResizeStartLeft = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onResizeStart(clip.id, 'start', e);
  }, [clip.id, onResizeStart]);

  const handleResizeStartRight = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onResizeStart(clip.id, 'end', e);
  }, [clip.id, onResizeStart]);

  // Generar un icono según el tipo de clip
  const renderIcon = () => {
    switch (clip.type) {
      case 'audio':
        return <span className="clip-icon">🔊</span>;
      case 'video':
        return <span className="clip-icon">🎬</span>;
      case 'image':
        return <span className="clip-icon">🖼️</span>;
      case 'text':
        return <span className="clip-icon">📝</span>;
      case 'effect':
        return <span className="clip-icon">✨</span>;
      default:
        return null;
    }
  };

  // Si la imagen es generada por IA, mostrar un indicador especial
  const isAiGenerated = clip.type === 'image' && clip.generatedImage;

  return (
    <div
      className={`timeline-clip ${selected ? 'selected' : ''} ${clip.locked ? 'locked' : ''}`}
      style={clipStyle}
      onClick={handleSelect}
      onMouseDown={handleMoveStart}
    >
      <div 
        className="clip-resize-handle clip-resize-handle-left" 
        onMouseDown={handleResizeStartLeft} 
      />

      <div className="clip-content">
        {renderIcon()}
        <span className="clip-title">{clip.title}</span>
        {isAiGenerated && <span className="ai-badge">AI</span>}
        {clip.locked && <span className="lock-icon">🔒</span>}
      </div>

      <div 
        className="clip-resize-handle clip-resize-handle-right" 
        onMouseDown={handleResizeStartRight} 
      />
    </div>
  );
};

export default React.memo(ClipItem);