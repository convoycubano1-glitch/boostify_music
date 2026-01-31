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

// Props de acciones para clips
interface ClipActionHandlers {
  onEditImage?: (clip: TimelineClip) => void;
  onAddMusician?: (clip: TimelineClip) => void;
  onCameraAngles?: (clip: TimelineClip) => void;
  onRegenerateImage?: (clip: TimelineClip) => void;
  onGenerateVideo?: (clip: TimelineClip) => void;
}

type Tool = 'select' | 'razor' | 'trim' | 'hand';

interface TimelineLayersProps extends ClipActionHandlers {
  clips: TimelineClip[];
  currentTime: number;
  duration: number;
  zoom: number;
  tool?: Tool;
  snapEnabled?: boolean;
  onSelectClip: (clipId: number | null) => void;
  selectedClipId: number | null;
  onMoveClip?: (clipId: number, newStart: number, newLayerId: number) => void;
  onResizeClip?: (clipId: number, newStart: number, newDuration: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
  onTimelineClick?: (time: number) => void;
  onRazorClick?: (clipId: number, time: number) => void;
  onDeleteClip?: (clipId: number) => void;
  showBeatGrid?: boolean;
  beatMarkers?: { time: number }[];
  layerLabelWidth?: number;
  onMuteLayer?: (layerId: number, muted: boolean) => void;
  onConvertAllToVideo?: (layerId: number) => void;
}

/**
 * Professional Timeline Layers Component
 */
export const TimelineLayers: React.FC<TimelineLayersProps> = ({
  clips,
  currentTime,
  duration,
  zoom,
  tool = 'select',
  snapEnabled = false,
  onSelectClip,
  selectedClipId,
  onMoveClip,
  onResizeClip,
  onDragStart,
  onDragEnd,
  onResizeStart,
  onResizeEnd,
  onTimelineClick,
  onRazorClick,
  onDeleteClip,
  showBeatGrid = false,
  beatMarkers = [],
  layerLabelWidth = 100,
  onMuteLayer,
  onConvertAllToVideo,
  // Acciones de clip
  onEditImage,
  onAddMusician,
  onCameraAngles,
  onRegenerateImage,
  onGenerateVideo,
}) => {
  // Estado para las configuraciones de capas
  const [layers, setLayers] = useState<LayerConfig[]>([]);
  
  // Inicializa las capas al montar el componente
  // BOOSTIFY: 3 capas - Imágenes Generadas, Audio Principal, y Segmentos Lipsync
  useEffect(() => {
    // 3 capas: Imágenes generadas, Audio principal, y Segmentos de audio para lipsync
    const defaultLayers: LayerConfig[] = [
      {
        id: 1,
        name: '🎬 Video/Imágenes',
        type: LayerType.IMAGEN,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.IMAGEN]
      },
      {
        id: 2,
        name: '🎵 Audio Principal',
        type: LayerType.AUDIO,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: LAYER_COLORS[LayerType.AUDIO]
      },
      {
        id: 3,
        name: '🎤 Lipsync Segments',
        type: LayerType.AUDIO,
        locked: false,
        visible: true,
        height: DEFAULT_LAYER_HEIGHT,
        color: '#f97316' // Naranja para lipsync
      }
    ];
    
    setLayers(defaultLayers);
  }, []);

  // Handler para click en el timeline (mover playhead)
  const handleContainerClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onTimelineClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left - layerLabelWidth;
    if (clickX >= 0) {
      const time = clickX / zoom;
      onTimelineClick(Math.max(0, Math.min(duration, time)));
    }
  };

  return (
    <div 
      className="timeline-layers"
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'auto',
        background: 'linear-gradient(180deg, #0d0d0d 0%, #111111 50%, #0a0a0a 100%)',
        cursor: 'pointer',
        borderRadius: '6px',
      }}
      onClick={handleContainerClick}
    >
      {/* Grid de marcadores de tiempo (beats) */}
      {showBeatGrid && beatMarkers && beatMarkers.length > 0 && (
        <div 
          className="beat-grid"
          style={{
            position: 'absolute',
            top: 0,
            left: `${layerLabelWidth}px`,
            width: `calc(100% - ${layerLabelWidth}px)`,
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
                backgroundColor: 'rgba(249, 115, 22, 0.15)',
                pointerEvents: 'none'
              }}
            />
          ))}
        </div>
      )}
      
      {/* Render timeline layers */}
      <div className="layers-container" style={{ minHeight: '100%' }}>
        {layers.map(layer => (
          <LayerRow 
            key={layer.id}
            layer={layer}
            clips={clips}
            zoom={zoom}
            currentTime={currentTime}
            duration={duration}
            tool={tool}
            onSelectClip={onSelectClip}
            selectedClipId={selectedClipId}
            onMoveClip={onMoveClip}
            onResizeClip={onResizeClip}
            onRazorClick={onRazorClick}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onResizeStart={onResizeStart}
            onResizeEnd={onResizeEnd}
            layerLabelWidth={layerLabelWidth}
            onMuteLayer={onMuteLayer}
            onConvertAllToVideo={onConvertAllToVideo}
            // Clip actions
            onEditImage={onEditImage}
            onAddMusician={onAddMusician}
            onCameraAngles={onCameraAngles}
            onRegenerateImage={onRegenerateImage}
            onGenerateVideo={onGenerateVideo}
          />
        ))}
      </div>
      
      <style jsx>
        {`
          .timeline-layers {
            border-radius: 6px;
            scrollbar-width: thin;
            scrollbar-color: #3f3f46 #18181b;
            background: linear-gradient(180deg, #0a0a0a 0%, #141414 100%);
          }
          
          .timeline-layers::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .timeline-layers::-webkit-scrollbar-track {
            background: #2a2a2a;
            border-radius: 4px;
          }
          
          .timeline-layers::-webkit-scrollbar-thumb {
            background: #555;
            border-radius: 4px;
          }
          
          .timeline-layers::-webkit-scrollbar-thumb:hover {
            background: #666;
          }
          
          @media (max-width: 640px) {
            .timeline-layers::-webkit-scrollbar {
              width: 4px;
              height: 4px;
            }
          }
        `}
      </style>
    </div>
  );
};