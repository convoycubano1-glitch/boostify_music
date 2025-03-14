/**
 * Componente LayerRow para el editor de timeline
 * Representa una fila individual de capa en la línea de tiempo
 */
import React from 'react';
import { LayerConfig, TimelineClip } from '../../../interfaces/timeline';

interface LayerRowProps {
  layer: LayerConfig;
  clips: TimelineClip[];
  timeScale: number;
  selectedClipId: number | null;
  onClipSelect: (clipId: number) => void;
  onClipMoveStart: (clipId: number, e: React.MouseEvent) => void;
  onClipResizeStart: (clipId: number, direction: 'start' | 'end', e: React.MouseEvent) => void;
  onToggleVisibility: (layerId: number) => void;
  onToggleLock: (layerId: number) => void;
  isDragging: boolean;
  isResizing: boolean;
  draggingClipId: number | null;
  resizingClipId: number | null;
  clipComponent: React.ComponentType<any>;
}

/**
 * Componente que representa una capa individual en el timeline
 * 
 * Características:
 * - Muestra el nombre y controles de la capa (visibilidad, bloqueo)
 * - Contiene y organiza los clips que pertenecen a esta capa
 * - Maneja la interacción con los clips de la capa
 */
const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  clips,
  timeScale,
  selectedClipId,
  onClipSelect,
  onClipMoveStart,
  onClipResizeStart,
  onToggleVisibility,
  onToggleLock,
  isDragging,
  isResizing,
  draggingClipId,
  resizingClipId,
  clipComponent: ClipComponent
}) => {
  // Filtrar clips que pertenecen a esta capa
  const layerClips = clips.filter(clip => clip.layerId === layer.id);

  // Manejar el cambio de visibilidad de la capa
  const handleToggleVisibility = () => {
    onToggleVisibility(layer.id);
  };

  // Manejar el cambio de bloqueo de la capa
  const handleToggleLock = () => {
    onToggleLock(layer.id);
  };

  return (
    <div className="layer-row" style={{ height: `${layer.height}px` }}>
      {/* Cabecera de la capa (etiqueta izquierda) */}
      <div className="layer-header" style={{ backgroundColor: layer.color }}>
        <div className="layer-name">{layer.name}</div>
        <div className="layer-controls">
          <button 
            className={`layer-control visibility ${layer.visible ? 'active' : 'inactive'}`}
            onClick={handleToggleVisibility}
            title={layer.visible ? 'Ocultar capa' : 'Mostrar capa'}
          >
            {layer.visible ? '👁️' : '👁️‍🗨️'}
          </button>
          <button 
            className={`layer-control lock ${layer.locked ? 'active' : 'inactive'}`}
            onClick={handleToggleLock}
            title={layer.locked ? 'Desbloquear capa' : 'Bloquear capa'}
          >
            {layer.locked ? '🔒' : '🔓'}
          </button>
        </div>
      </div>
      
      {/* Contenido de la capa (clips) */}
      <div className="layer-content">
        {layerClips.map(clip => (
          <ClipComponent
            key={clip.id}
            clip={clip}
            timeScale={timeScale}
            isSelected={selectedClipId === clip.id}
            onSelect={onClipSelect}
            onMoveStart={onClipMoveStart}
            onResizeStart={onClipResizeStart}
            isDragging={isDragging && draggingClipId === clip.id}
            isResizing={isResizing && resizingClipId === clip.id}
          />
        ))}
      </div>

      {/* Estilos del componente */}
      <style jsx>{`
        .layer-row {
          display: flex;
          border-bottom: 1px solid #3f3f3f;
          position: relative;
          background-color: #2a2a2a;
        }
        
        .layer-header {
          width: 150px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          color: #fff;
          font-size: 12px;
          padding: 0 8px;
          opacity: 0.9;
          border-right: 1px solid #3f3f3f;
          position: sticky;
          left: 0;
          z-index: 10;
        }
        
        .layer-name {
          font-weight: bold;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100px;
        }
        
        .layer-controls {
          display: flex;
          gap: 4px;
        }
        
        .layer-control {
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 2px;
          font-size: 12px;
          border-radius: 3px;
        }
        
        .layer-control:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        
        .layer-control.inactive {
          opacity: 0.4;
        }
        
        .layer-content {
          flex-grow: 1;
          position: relative;
          overflow: visible;
          min-width: 2000px; /* Asegurar espacio para clips */
        }
      `}</style>
    </div>
  );
};

export default LayerRow;