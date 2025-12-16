/**
 * Componente LayerRow - Represents an individual timeline layer row
 * 
 * Professional timeline layer with expandable height, mute controls,
 * and convert to video functionality.
 */
import React, { useState } from 'react';
import { 
  LayerConfig, 
  TimelineClip,
  ClipType,
  LayerType
} from '../../../interfaces/timeline';
import { 
  LAYER_HEADER_WIDTH, 
  DEFAULT_LAYER_HEIGHT,
  MAX_CLIP_DURATION
} from '../../../constants/timeline-constants';
import { ClipItem } from './ClipItem';
import { 
  Volume2, VolumeX, Film, ChevronDown, ChevronUp, 
  Lock, Unlock, Eye, EyeOff, GripVertical 
} from 'lucide-react';

// Props de acciones para clips
interface ClipActionHandlers {
  onEditImage?: (clip: TimelineClip) => void;
  onAddMusician?: (clip: TimelineClip) => void;
  onCameraAngles?: (clip: TimelineClip) => void;
  onRegenerateImage?: (clip: TimelineClip) => void;
  onGenerateVideo?: (clip: TimelineClip) => void;
}

interface LayerRowProps extends ClipActionHandlers {
  layer: LayerConfig;
  clips: TimelineClip[];
  zoom: number;
  currentTime: number;
  duration: number;
  onSelectClip: (clipId: number | null) => void;
  selectedClipId: number | null;
  onMoveClip?: (clipId: number, newStart: number, newLayerId: number) => void;
  onResizeClip?: (clipId: number, newStart: number, newDuration: number) => void;
  layerLabelWidth?: number;
  onMuteLayer?: (layerId: number, muted: boolean) => void;
  onConvertAllToVideo?: (layerId: number) => void;
}

/**
 * Professional timeline layer component
 */
export const LayerRow: React.FC<LayerRowProps> = ({
  layer,
  clips,
  zoom,
  currentTime,
  duration,
  onSelectClip,
  selectedClipId,
  onMoveClip,
  onResizeClip,
  layerLabelWidth = 100,
  // Acciones de clip
  onEditImage,
  onAddMusician,
  onCameraAngles,
  onRegenerateImage,
  onGenerateVideo,
  onMuteLayer,
  onConvertAllToVideo,
}) => {
  // Filtrar clips que pertenecen a esta capa
  const layerClips = clips.filter(clip => clip.layerId === layer.id);
  
  // Layer state
  const [layerHeight, setLayerHeight] = useState(layer.height || DEFAULT_LAYER_HEIGHT);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [isLocked, setIsLocked] = useState(layer.locked || false);
  const [isVisible, setIsVisible] = useState(layer.visible !== false);
  
  // Estado para el arrastre de clips
  const [draggedClipId, setDraggedClipId] = React.useState<number | null>(null);
  const [dragStartX, setDragStartX] = React.useState<number>(0);
  const [dragStartY, setDragStartY] = React.useState<number>(0);
  const [clipOffset, setClipOffset] = React.useState<{x: number, y: number}>({x: 0, y: 0});
  
  // Validaciones específicas para esta capa
  const validateClipPlacement = (clip: TimelineClip, newStart: number, newDuration?: number): boolean => {
    // Comprobar si es una imagen generada por IA (solo permitida en capa 7)
    if (clip.type === ClipType.GENERATED_IMAGE && layer.id !== 7) {
      return false;
    }
    
    // Comprobar duración máxima (5 segundos)
    const clipDuration = newDuration || clip.duration;
    if (clipDuration > MAX_CLIP_DURATION) {
      return false;
    }
    
    // Comprobar superposición con otros clips en la misma capa
    const overlapping = layerClips.some(c => {
      if (c.id === clip.id) return false; // Ignorar el clip actual
      
      // Calcular si hay superposición
      const clipEnd = newStart + clipDuration;
      const otherClipEnd = c.start + c.duration;
      
      return (
        (newStart >= c.start && newStart < otherClipEnd) ||
        (clipEnd > c.start && clipEnd <= otherClipEnd) ||
        (newStart <= c.start && clipEnd >= otherClipEnd)
      );
    });
    
    return !overlapping;
  };
  
  // Manejadores de eventos para arrastrar clips
  const handleDragStart = (clipId: number, e: React.MouseEvent) => {
    setDraggedClipId(clipId);
    setDragStartX(e.clientX);
    setDragStartY(e.clientY);
    
    const clipElement = e.currentTarget as HTMLElement;
    const rect = clipElement.getBoundingClientRect();
    setClipOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };
  
  const handleDragMove = (e: MouseEvent) => {
    if (!draggedClipId) return;
    
    const draggingClip = clips.find(clip => clip.id === draggedClipId);
    if (!draggingClip) return;
    
    // Calcular nueva posición
    const deltaX = e.clientX - dragStartX;
    const calculatedStart = draggingClip.start + (deltaX / zoom);
    const newStart = Math.max(0, Math.min(duration - draggingClip.duration, calculatedStart));
    
    // Validar si la nueva posición es válida
    if (validateClipPlacement(draggingClip, newStart)) {
      onMoveClip?.(draggedClipId, newStart, layer.id);
    }
  };
  
  const handleDragEnd = () => {
    setDraggedClipId(null);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
  };
  
  // Manejador para redimensionar clips
  const handleResizeClip = (clipId: number, newStart: number, newDuration: number) => {
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    // Validar si la nueva dimensión es válida
    if (validateClipPlacement(clip, newStart, newDuration)) {
      onResizeClip?.(clipId, newStart, newDuration);
    }
  };
  
  // Estilo para la línea de tiempo actual
  const currentTimeIndicatorStyle = {
    left: `${currentTime * zoom}px`,
    height: '100%',
    position: 'absolute' as const,
    top: 0,
    width: '2px',
    backgroundColor: '#f97316', // orange-500
    zIndex: 10,
    boxShadow: '0 0 4px rgba(249, 115, 22, 0.5)'
  };

  // Height resize handlers
  const handleHeightResizeStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingHeight(true);
    const startY = e.clientY;
    const startHeight = layerHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = Math.max(40, Math.min(200, startHeight + deltaY));
      setLayerHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsResizingHeight(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Toggle mute for audio layer
  const handleToggleMute = () => {
    setIsMuted(!isMuted);
    onMuteLayer?.(layer.id, !isMuted);
  };

  // Toggle lock state
  const handleToggleLock = () => {
    setIsLocked(!isLocked);
  };

  // Toggle visibility
  const handleToggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // Convert all images to video
  const handleConvertAllToVideo = () => {
    onConvertAllToVideo?.(layer.id);
  };

  // Determine layer icon and color based on type
  const isAudioLayer = layer.type === LayerType.AUDIO;
  const isVideoLayer = layer.type === LayerType.IMAGEN;

  // Professional gray color palette
  const headerBgColor = isAudioLayer 
    ? 'linear-gradient(135deg, #1e293b 0%, #334155 100%)' 
    : 'linear-gradient(135deg, #18181b 0%, #27272a 100%)';
  
  const contentBgColor = isAudioLayer 
    ? (isMuted ? '#1a1a2e' : '#0f172a')
    : '#171717';

  const accentColor = isAudioLayer ? '#3b82f6' : '#f97316';
  
  return (
    <div 
      className="timeline-layer group relative"
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        marginBottom: '2px',
        position: 'relative',
      }}
    >
      {/* Main Row */}
      <div 
        className="flex w-full transition-all duration-200"
        style={{ height: isExpanded ? `${layerHeight}px` : '32px' }}
      >
        {/* Layer Header - Professional Design */}
        <div 
          className="layer-header flex-shrink-0 relative group/header"
          style={{
            width: `${layerLabelWidth}px`,
            minWidth: '80px',
            maxWidth: '200px',
            background: headerBgColor,
            color: 'white',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '4px 6px',
            position: 'sticky',
            left: 0,
            zIndex: 5,
            borderRight: `2px solid ${accentColor}`,
            borderRadius: '4px 0 0 4px',
          }}
        >
          {/* Top: Layer name & expand */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1.5 min-w-0">
              <div 
                className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${isLocked ? 'ring-1 ring-yellow-400' : ''}`}
                style={{ backgroundColor: isVisible ? accentColor : '#6b7280' }}
              />
              <span 
                className="font-medium truncate"
                style={{ 
                  fontSize: layerLabelWidth < 100 ? '9px' : '10px',
                  opacity: isVisible ? 1 : 0.5 
                }}
                title={layer.name}
              >
                {isAudioLayer ? 'Audio Track' : 'Video Track'}
                {isLocked && ' 🔒'}
              </span>
            </div>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-0.5 rounded hover:bg-white/10 transition-colors flex-shrink-0"
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            </button>
          </div>

          {/* Bottom: Controls (visible when expanded) */}
          {isExpanded && (
            <div className="flex items-center justify-between gap-1 mt-1">
              {/* Left controls */}
              <div className="flex items-center gap-0.5">
                {/* Audio: Mute button */}
                {isAudioLayer && (
                  <button
                    onClick={handleToggleMute}
                    className={`p-1 rounded transition-all ${
                      isMuted 
                        ? 'bg-red-500/30 text-red-400' 
                        : 'hover:bg-white/10 text-blue-400'
                    }`}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? <VolumeX size={11} /> : <Volume2 size={11} />}
                  </button>
                )}

                {/* Video: Convert all to video */}
                {isVideoLayer && (
                  <button
                    onClick={handleConvertAllToVideo}
                    className="p-1 rounded hover:bg-orange-500/20 text-orange-400 transition-all"
                    title="Convert All to Video"
                  >
                    <Film size={11} />
                  </button>
                )}

                {/* Lock toggle */}
                <button
                  onClick={handleToggleLock}
                  className={`p-1 rounded transition-all ${
                    isLocked 
                      ? 'bg-yellow-500/20 text-yellow-400' 
                      : 'hover:bg-white/10 text-white/40'
                  }`}
                  title={isLocked ? 'Unlock Layer' : 'Lock Layer'}
                >
                  {isLocked ? <Lock size={10} /> : <Unlock size={10} />}
                </button>

                {/* Visibility toggle */}
                <button
                  onClick={handleToggleVisibility}
                  className={`p-1 rounded transition-all ${
                    !isVisible 
                      ? 'bg-gray-500/20 text-gray-500' 
                      : 'hover:bg-white/10 text-white/40'
                  }`}
                  title={isVisible ? 'Hide Layer' : 'Show Layer'}
                >
                  {isVisible ? <Eye size={10} /> : <EyeOff size={10} />}
                </button>
              </div>

              {/* Clip count badge */}
              <div 
                className="text-[8px] px-1.5 py-0.5 rounded-full font-medium"
                style={{ 
                  backgroundColor: `${accentColor}20`,
                  color: accentColor 
                }}
                title={`${layerClips.length} clip${layerClips.length !== 1 ? 's' : ''}`}
              >
                {layerClips.length}
              </div>
            </div>
          )}
        </div>
      
        {/* Layer Content (clips) */}
        <div 
          className={`layer-content relative flex-1 overflow-hidden transition-all ${isLocked ? 'pointer-events-none' : ''}`}
          style={{
            height: '100%',
            backgroundColor: contentBgColor,
            opacity: isVisible ? (isMuted && isAudioLayer ? 0.6 : 1) : 0.3,
            borderBottom: '1px solid rgba(255,255,255,0.03)',
            backgroundImage: isAudioLayer 
              ? 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(59,130,246,0.03) 10px, rgba(59,130,246,0.03) 11px)'
              : 'repeating-linear-gradient(90deg, transparent, transparent 10px, rgba(249,115,22,0.02) 10px, rgba(249,115,22,0.02) 11px)',
            filter: isLocked ? 'grayscale(0.5)' : 'none',
          }}
        >
          {/* Locked overlay */}
          {isLocked && (
            <div className="absolute inset-0 bg-yellow-900/20 z-20 flex items-center justify-center">
              <div className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                <Lock size={12} />
                <span className="text-[10px] font-medium">LOCKED</span>
              </div>
            </div>
          )}

          {/* Hidden overlay */}
          {!isVisible && (
            <div className="absolute inset-0 bg-gray-900/60 z-20 flex items-center justify-center">
              <div className="flex items-center gap-1 text-gray-400 bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20">
                <EyeOff size={12} />
                <span className="text-[10px] font-medium">HIDDEN</span>
              </div>
            </div>
          )}

          {/* Muted overlay for audio */}
          {isMuted && isAudioLayer && isVisible && !isLocked && (
            <div className="absolute inset-0 bg-gray-900/50 z-20 flex items-center justify-center">
              <div className="flex items-center gap-1 text-red-400 bg-red-500/10 px-2 py-1 rounded">
                <VolumeX size={12} />
                <span className="text-[10px] font-medium">MUTED</span>
              </div>
            </div>
          )}

          {/* Current time indicator */}
          <div style={currentTimeIndicatorStyle} />
        
          {/* Render clips */}
          {layerClips.map(clip => (
            <ClipItem
              key={clip.id}
              clip={clip}
              timeScale={zoom}
              isSelected={selectedClipId === clip.id}
              onSelect={(id) => !isLocked && onSelectClip(id)}
              onMoveStart={(id, e) => !isLocked && handleDragStart(id, e)}
              onResizeStart={(id, direction, e) => {
                e.stopPropagation();
              }}
              isDragging={draggedClipId === clip.id}
              isResizing={false}
              onEditImage={onEditImage}
              onAddMusician={onAddMusician}
              onCameraAngles={onCameraAngles}
              onRegenerateImage={onRegenerateImage}
              onGenerateVideo={onGenerateVideo}
            />
          ))}

          {/* Empty state */}
          {layerClips.length === 0 && isExpanded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] text-white/20 italic">
                {isAudioLayer ? 'Drop audio here' : 'Drop clips here'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Resize Handle - Bottom edge */}
      {isExpanded && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1.5 cursor-ns-resize group/resize z-10"
          onMouseDown={handleHeightResizeStart}
        >
          <div 
            className={`absolute inset-x-0 bottom-0 h-0.5 transition-all ${
              isResizingHeight 
                ? 'bg-orange-500' 
                : 'bg-transparent group-hover/resize:bg-white/20'
            }`}
          />
          <div 
            className={`absolute left-1/2 -translate-x-1/2 bottom-0 transition-opacity ${
              isResizingHeight ? 'opacity-100' : 'opacity-0 group-hover/resize:opacity-100'
            }`}
          >
            <GripVertical size={10} className="text-white/40 rotate-90" />
          </div>
        </div>
      )}
    </div>
  );
};