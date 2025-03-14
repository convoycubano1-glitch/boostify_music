/**
 * Componente que representa una fila (capa) en el timeline
 * Gestiona la visualización y las operaciones específicas de la capa
 */
import React from 'react';
import { TimelineClip, LayerConfig } from '../../../interfaces/timeline';
import { Button } from "../../../components/ui/button";
import { EyeIcon, EyeOffIcon, LockIcon, UnlockIcon, PlusIcon } from 'lucide-react';
import { TIMELINE_DIMENSIONS } from '../../../constants/timeline-constants';
import ClipItem from './ClipItem';

interface LayerRowProps {
  layer: LayerConfig;
  clips: TimelineClip[];
  timeScale: number;
  selectedClipId: number | null;
  onClipSelect: (clipId: number) => void;
  onClipMoveStart: (clipId: number, e: React.MouseEvent) => void;
  onClipResizeStart: (clipId: number, direction: 'start' | 'end', e: React.MouseEvent) => void;
  onLayerDrop: (e: React.DragEvent, layerId: number) => void;
  onAddClip: (layerId: number, position: number) => void;
  onToggleVisibility: (layerId: number) => void;
  onToggleLock: (layerId: number) => void;
}

const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  clips,
  timeScale,
  selectedClipId,
  onClipSelect,
  onClipMoveStart,
  onClipResizeStart,
  onLayerDrop,
  onAddClip,
  onToggleVisibility,
  onToggleLock
}) => {
  // Filtrar los clips que pertenecen a esta capa
  const layerClips = clips.filter(clip => clip.layer === layer.id);
  
  // Manejar drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    onLayerDrop(e, layer.id);
  };
  
  // Manejar clic en la capa para añadir un nuevo clip
  const handleLayerClick = (e: React.MouseEvent) => {
    if (layer.locked) return;
    
    // Obtener la posición del clic relativa al inicio del timeline
    const timelineStart = TIMELINE_DIMENSIONS.LAYER_LABEL_WIDTH;
    const clickPosition = e.nativeEvent.offsetX - timelineStart;
    
    // Convertir la posición a tiempo
    const clickTime = Math.max(0, clickPosition / timeScale);
    
    // Verificar si el clic fue en un área vacía (no en un clip existente)
    const isEmptyArea = !layerClips.some(clip => {
      const clipStartX = clip.start * timeScale;
      const clipEndX = (clip.start + clip.duration) * timeScale;
      return clickPosition >= clipStartX && clickPosition <= clipEndX;
    });
    
    if (isEmptyArea) {
      onAddClip(layer.id, clickTime);
    }
  };
  
  return (
    <div 
      className={`timeline-layer ${layer.locked ? 'locked' : ''}`}
      style={{ height: `${layer.height}px` }}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {/* Etiqueta de capa */}
      <div 
        className="layer-label" 
        style={{ 
          width: `${TIMELINE_DIMENSIONS.LAYER_LABEL_WIDTH}px`,
          background: layer.color 
        }}
      >
        <span className="layer-name">{layer.name}</span>
        <div className="layer-controls">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleVisibility(layer.id)}
            className="layer-button"
            title={layer.visible ? "Ocultar capa" : "Mostrar capa"}
          >
            {layer.visible ? <EyeIcon size={14} /> : <EyeOffIcon size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onToggleLock(layer.id)}
            className="layer-button"
            title={layer.locked ? "Desbloquear capa" : "Bloquear capa"}
          >
            {layer.locked ? <LockIcon size={14} /> : <UnlockIcon size={14} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            disabled={layer.locked}
            onClick={(e) => {
              e.stopPropagation();
              onAddClip(layer.id, 0);
            }}
            className="layer-button"
            title="Añadir clip"
          >
            <PlusIcon size={14} />
          </Button>
        </div>
      </div>
      
      {/* Área de clips */}
      <div 
        className={`layer-content ${!layer.visible ? 'hidden' : ''}`}
        onClick={handleLayerClick}
      >
        {/* Renderizar los clips de esta capa */}
        {layerClips.map(clip => (
          <ClipItem 
            key={clip.id}
            clip={clip}
            timeScale={timeScale}
            isSelected={clip.id === selectedClipId}
            onSelect={() => onClipSelect(clip.id)}
            onMoveStart={(e) => onClipMoveStart(clip.id, e)}
            onResizeStart={(direction, e) => onClipResizeStart(clip.id, direction, e)}
            disabled={layer.locked}
          />
        ))}
      </div>
      
      {/* Estilos para la capa */}
      <style jsx>{`
        .timeline-layer {
          display: flex;
          position: relative;
          border-bottom: 1px solid #e2e8f0;
          background-color: #f8fafc;
        }
        
        .timeline-layer.locked {
          background-color: #f1f5f9;
          opacity: 0.8;
        }
        
        .layer-label {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
          color: #fff;
          font-size: 12px;
          font-weight: 500;
          position: sticky;
          left: 0;
          z-index: 10;
          box-shadow: 2px 0 4px rgba(0, 0, 0, 0.1);
        }
        
        .layer-name {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .layer-controls {
          display: flex;
          gap: 2px;
        }
        
        .layer-button {
          padding: 2px;
          height: 22px;
          width: 22px;
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
          color: white;
        }
        
        .layer-button:hover {
          background-color: rgba(255, 255, 255, 0.3);
        }
        
        .layer-content {
          flex: 1;
          position: relative;
          overflow: visible;
          min-height: 30px;
        }
        
        .layer-content.hidden {
          opacity: 0.5;
          background-image: repeating-linear-gradient(
            45deg,
            rgba(0, 0, 0, 0.03),
            rgba(0, 0, 0, 0.03) 10px,
            rgba(0, 0, 0, 0.05) 10px,
            rgba(0, 0, 0, 0.05) 20px
          );
        }
      `}</style>
    </div>
  );
};

export default LayerRow;