/**
 * Componente para renderizar todas las capas del timeline
 * Gestiona la organización y visualización de capas y sus clips
 */
import React, { useCallback, useMemo } from 'react';
import { LayerConfig, TimelineClip } from '../../../interfaces/timeline';
import LayerRow from './LayerRow';
import { TIMELINE_DIMENSIONS } from '../../../constants/timeline-constants';

interface TimelineLayersProps {
  layers: LayerConfig[];
  clips: TimelineClip[];
  timeScale: number;
  selectedClipId: number | null;
  onClipSelect: (clipId: number) => void;
  onClipMoveStart: (clipId: number, e: React.MouseEvent) => void;
  onClipResizeStart: (clipId: number, direction: 'start' | 'end', e: React.MouseEvent) => void;
  onLayerDrop: (e: React.DragEvent, layerId: number) => void;
  onAddClip?: (layerId: number, position: number) => void;
  onToggleLayerVisibility?: (layerId: number) => void;
  onToggleLayerLock?: (layerId: number) => void;
}

const TimelineLayers: React.FC<TimelineLayersProps> = ({
  layers,
  clips,
  timeScale,
  selectedClipId,
  onClipSelect,
  onClipMoveStart,
  onClipResizeStart,
  onLayerDrop,
  onAddClip,
  onToggleLayerVisibility,
  onToggleLayerLock
}) => {
  // Calcular la altura total de todas las capas
  const totalHeight = useMemo(() => {
    return layers.reduce((total, layer) => total + layer.height, 0);
  }, [layers]);

  // Función para renderizar las acciones de capa (visibilidad, bloqueo)
  const renderLayerActions = useCallback((layerId: number, isVisible: boolean, isLocked: boolean) => {
    if (!onToggleLayerVisibility && !onToggleLayerLock) return null;

    return (
      <div className="layer-actions">
        {onToggleLayerVisibility && (
          <button 
            className={`visibility-toggle ${isVisible ? 'visible' : 'hidden'}`}
            onClick={() => onToggleLayerVisibility(layerId)}
            title={isVisible ? 'Ocultar capa' : 'Mostrar capa'}
          >
            {isVisible ? '👁️' : '👁️‍🗨️'}
          </button>
        )}
        
        {onToggleLayerLock && (
          <button 
            className={`lock-toggle ${isLocked ? 'locked' : 'unlocked'}`}
            onClick={() => onToggleLayerLock(layerId)}
            title={isLocked ? 'Desbloquear capa' : 'Bloquear capa'}
          >
            {isLocked ? '🔒' : '🔓'}
          </button>
        )}
      </div>
    );
  }, [onToggleLayerVisibility, onToggleLayerLock]);

  return (
    <div className="timeline-layers" style={{ height: `${totalHeight}px` }}>
      <div className="layer-headers" style={{ width: `${TIMELINE_DIMENSIONS.LAYER_LABEL_WIDTH}px` }}>
        {layers.map(layer => (
          <div 
            key={layer.id}
            className="layer-header"
            style={{ height: `${layer.height}px` }}
          >
            <span className="layer-name">{layer.name}</span>
            {renderLayerActions(layer.id, layer.visible, layer.locked)}
          </div>
        ))}
      </div>

      <div className="layers-container">
        {layers.map(layer => (
          <LayerRow
            key={layer.id}
            config={layer}
            clips={clips}
            timeScale={timeScale}
            selectedClipId={selectedClipId}
            height={layer.height}
            onClipSelect={onClipSelect}
            onClipMoveStart={onClipMoveStart}
            onClipResizeStart={onClipResizeStart}
            onDrop={onLayerDrop}
            onAddClip={onAddClip}
          />
        ))}
      </div>
    </div>
  );
};

export default React.memo(TimelineLayers);