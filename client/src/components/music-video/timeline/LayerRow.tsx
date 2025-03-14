/**
 * Componente para renderizar una fila/capa completa del timeline con sus clips
 * Cada capa tiene un tipo definido y solo acepta ciertos tipos de clips
 */
import React, { useCallback, useMemo } from 'react';
import { LayerConfig, TimelineClip } from '../../../interfaces/timeline';
import ClipItem from './ClipItem';
import { LAYER_PROPERTIES } from '../../../constants/timeline-constants';

interface LayerRowProps {
  config: LayerConfig;
  clips: TimelineClip[];
  timeScale: number;
  selectedClipId: number | null;
  height: number;
  onClipSelect: (clipId: number) => void;
  onClipMoveStart: (clipId: number, e: React.MouseEvent) => void;
  onClipResizeStart: (clipId: number, direction: 'start' | 'end', e: React.MouseEvent) => void;
  onDrop: (e: React.DragEvent, layerId: number) => void;
  onAddClip?: (layerId: number, position: number) => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  config,
  clips,
  timeScale,
  selectedClipId,
  height,
  onClipSelect,
  onClipMoveStart,
  onClipResizeStart,
  onDrop,
  onAddClip
}) => {
  // Filtrar clips que pertenecen a esta capa
  const layerClips = useMemo(() => {
    return clips.filter(clip => clip.layer === config.id);
  }, [clips, config.id]);

  // Manejador para arrastar y soltar clips
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    onDrop(e, config.id);
  }, [config.id, onDrop]);

  // Manejador para añadir un nuevo clip
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    if (onAddClip) {
      const layerEl = e.currentTarget as HTMLDivElement;
      const rect = layerEl.getBoundingClientRect();
      const position = (e.clientX - rect.left) / timeScale;
      onAddClip(config.id, position);
    }
  }, [config.id, onAddClip, timeScale]);

  // Obtener propiedades de la capa desde constantes
  const layerProperties = useMemo(() => {
    return LAYER_PROPERTIES[config.type] || {
      name: 'Capa desconocida',
      color: '#666',
      allowedTypes: []
    };
  }, [config.type]);

  return (
    <div className="timeline-layer" style={{ height: `${height}px` }}>
      <div 
        className="layer-label" 
        style={{ 
          backgroundColor: config.locked ? '#666' : layerProperties.color,
          opacity: config.visible ? 1 : 0.5 
        }}
      >
        <span className="layer-name">{config.name}</span>
        {config.locked && <span className="layer-lock-indicator">🔒</span>}
        {!config.visible && <span className="layer-visibility-indicator">👁️</span>}
      </div>
      
      <div 
        className="layer-content"
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onDoubleClick={handleDoubleClick}
      >
        {layerClips.map(clip => (
          <ClipItem
            key={clip.id}
            clip={clip}
            timeScale={timeScale}
            selected={selectedClipId === clip.id}
            onSelect={onClipSelect}
            onMoveStart={onClipMoveStart}
            onResizeStart={onClipResizeStart}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(LayerRow);