/**
 * Componente TimelineLayers - Gestiona y muestra las capas del timeline
 * 
 * Este componente es responsable de renderizar las diferentes capas del timeline
 * y manejar las interacciones del usuario con ellas, como arrastrar clips, etc.
 */
import React, { useState, useEffect } from 'react';
import { LayerRow } from './LayerRow';
import { LayerType, TimelineClip, LayerConfig } from '../../../interfaces/timeline';
import { 
  DEFAULT_LAYER_HEIGHT, 
  LAYER_NAMES, 
  LAYER_COLORS 
} from '../../../constants/timeline-constants';

interface TimelineLayersProps {
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  zoom: number;
  onSelectClip: (clipId: number | null) => void;
  selectedClipId: number | null;
  onMoveClip?: (clipId: number, newStart: number, newLayerId: number) => void;
  onResizeClip?: (clipId: number, newStart: number, newDuration: number) => void;
  showBeatGrid?: boolean;
  beatMarkers?: { time: number }[];
}

/**
 * Componente para mostrar las capas del timeline
 */
export const TimelineLayers: React.FC<TimelineLayersProps> = ({
  clips,
  currentTime,
  duration,
  zoom,
  onSelectClip,
  selectedClipId,
  onMoveClip,
  onResizeClip,
  showBeatGrid = false,
  beatMarkers = []
}) => {
  // Estado para las configuraciones de capas
  const [layers, setLayers] = useState<LayerConfig[]>([]);
  
  // Inicializa las capas al montar el componente
  useEffect(() => {
    // Crear configuración predeterminada para cada tipo de capa
    const defaultLayers: LayerConfig[] = [
      {
        id: 1,
        name: LAYER_NAMES[LayerType.VIDEO_PRINCIPAL],
        type: LayerType.VIDEO_PRINCIPAL,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.VIDEO_PRINCIPAL]
      },
      {
        id: 2,
        name: LAYER_NAMES[LayerType.VIDEO_SECUNDARIO],
        type: LayerType.VIDEO_SECUNDARIO,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.VIDEO_SECUNDARIO]
      },
      {
        id: 3,
        name: LAYER_NAMES[LayerType.IMAGEN],
        type: LayerType.IMAGEN,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.IMAGEN]
      },
      {
        id: 4,
        name: LAYER_NAMES[LayerType.TEXTO],
        type: LayerType.TEXTO,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.TEXTO]
      },
      {
        id: 5,
        name: LAYER_NAMES[LayerType.AUDIO],
        type: LayerType.AUDIO,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.AUDIO]
      },
      {
        id: 6,
        name: LAYER_NAMES[LayerType.EFECTOS],
        type: LayerType.EFECTOS,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.EFECTOS]
      },
      {
        id: 7,
        name: LAYER_NAMES[LayerType.IA_GENERADA],
        type: LayerType.IA_GENERADA,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.IA_GENERADA]
      },
      {
        id: 8,
        name: LAYER_NAMES[LayerType.TRANSICIONES],
        type: LayerType.TRANSICIONES,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.TRANSICIONES]
      }
    ];
    
    setLayers(defaultLayers);
  }, []);

  return (
    <div 
      className="timeline-layers"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'auto'
      }}
    >
      {/* Grid de marcadores de tiempo (beats) */}
      {showBeatGrid && beatMarkers && beatMarkers.length > 0 && (
        <div 
          className="beat-grid"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 1
          }}
        >
          {beatMarkers.map((marker, index) => (
            <div
              key={`beat-${index}`}
              className="beat-marker"
              style={{
                position: 'absolute',
                left: `${marker.time * zoom}px`,
                top: 0,
                width: '1px',
                height: '100%',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                pointerEvents: 'none'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Renderizar capas de timeline */}
      {layers.map(layer => (
        <LayerRow 
          key={layer.id}
          layer={layer}
          clips={clips}
          zoom={zoom}
          currentTime={currentTime}
          duration={duration}
          onSelectClip={onSelectClip}
          selectedClipId={selectedClipId}
          onMoveClip={onMoveClip}
          onResizeClip={onResizeClip}
        />
      ))}
      
      <style jsx>
        {`
          .timeline-layers {
            background-color: #1a1a1a;
            border: 1px solid #333;
            border-radius: 4px;
          }
          
          .timeline-layers::-webkit-scrollbar {
            width: 10px;
            height: 10px;
          }
          
          .timeline-layers::-webkit-scrollbar-track {
            background: #2a2a2a;
          }
          
          .timeline-layers::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 5px;
          }
          
          .timeline-layers::-webkit-scrollbar-thumb:hover {
            background: #777;
          }
        `}
      </style>
    </div>
  );
};