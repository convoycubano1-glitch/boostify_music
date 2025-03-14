/**
 * Componente TimelineLayers para el editor de timeline
 * Organiza y muestra todas las capas del timeline
 */
import React from 'react';
import { LayerConfig, TimelineClip } from '../../../interfaces/timeline';
import LayerRow from './LayerRow';
import ClipItem from './ClipItem';

interface TimelineLayersProps {
  layers: LayerConfig[];
  clips: TimelineClip[];
  timeScale: number;
  selectedClipId: number | null;
  onClipSelect: (clipId: number) => void;
  onClipMoveStart: (clipId: number, e: React.MouseEvent) => void;
  onClipResizeStart: (clipId: number, direction: 'start' | 'end', e: React.MouseEvent) => void;
  onToggleLayerVisibility: (layerId: number) => void;
  onToggleLayerLock: (layerId: number) => void;
  isDragging: boolean;
  isResizing: boolean;
  draggingClipId: number | null;
  resizingClipId: number | null;
}

/**
 * Componente que organiza y muestra todas las capas del timeline
 * 
 * Características:
 * - Renderiza todas las capas configuradas
 * - Distribuye los clips en las capas correspondientes
 * - Maneja la interacción con capas y clips
 */
const TimelineLayers: React.FC<TimelineLayersProps> = ({
  layers,
  clips,
  timeScale,
  selectedClipId,
  onClipSelect,
  onClipMoveStart,
  onClipResizeStart,
  onToggleLayerVisibility,
  onToggleLayerLock,
  isDragging,
  isResizing,
  draggingClipId,
  resizingClipId
}) => {
  return (
    <div className="timeline-layers">
      {/* Renderizar cada capa */}
      {layers.map((layer) => (
        <LayerRow
          key={layer.id}
          layer={layer}
          clips={clips}
          timeScale={timeScale}
          selectedClipId={selectedClipId}
          onClipSelect={onClipSelect}
          onClipMoveStart={onClipMoveStart}
          onClipResizeStart={onClipResizeStart}
          onToggleVisibility={onToggleLayerVisibility}
          onToggleLock={onToggleLayerLock}
          isDragging={isDragging}
          isResizing={isResizing}
          draggingClipId={draggingClipId}
          resizingClipId={resizingClipId}
          clipComponent={ClipItem}
        />
      ))}

      {/* Estilos del componente */}
      <style jsx>{`
        .timeline-layers {
          width: 100%;
          height: 100%;
          overflow-y: auto;
          overflow-x: hidden;
          background-color: #1e1e1e;
          border-top: 1px solid #3f3f3f;
        }
      `}</style>
    </div>
  );
};

export default TimelineLayers;