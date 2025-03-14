/**
 * Componente que gestiona las capas del timeline
 * Organiza y muestra las capas (LayerRow) con sus clips
 */
import React from 'react';
import { TimelineClip, LayerConfig } from '../../../interfaces/timeline';
import LayerRow from './LayerRow';

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
  onToggleLayerVisibility: (layerId: number) => void;
  onToggleLayerLock: (layerId: number) => void;
}

/**
 * Componente que renderiza todas las capas del timeline
 * 
 * Cada capa (LayerRow) se encarga de mostrar los clips que le corresponden
 * y manejar las interacciones específicas de esa capa
 */
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
  return (
    <div className="timeline-layers">
      {layers.map(layer => (
        <LayerRow 
          key={layer.id}
          layer={layer}
          clips={clips}
          timeScale={timeScale}
          selectedClipId={selectedClipId}
          onClipSelect={onClipSelect}
          onClipMoveStart={onClipMoveStart}
          onClipResizeStart={onClipResizeStart}
          onLayerDrop={onLayerDrop}
          onAddClip={onAddClip || (() => {})}
          onToggleVisibility={onToggleLayerVisibility}
          onToggleLock={onToggleLayerLock}
        />
      ))}
      
      {/* Estilos para el contenedor de capas */}
      <style jsx>{`
        .timeline-layers {
          display: flex;
          flex-direction: column;
          width: 100%;
          height: 100%;
        }
      `}</style>
    </div>
  );
};

export default TimelineLayers;