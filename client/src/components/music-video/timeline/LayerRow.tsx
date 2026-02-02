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

type Tool = 'select' | 'razor' | 'trim' | 'hand';

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
  tool?: Tool;
  onSelectClip: (clipId: number | null) => void;
  selectedClipId: number | null;
  onMoveClip?: (clipId: number, newStart: number, newLayerId: number) => void;
  onResizeClip?: (clipId: number, newStart: number, newDuration: number) => void;
  onRazorClick?: (clipId: number, time: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onResizeStart?: () => void;
  onResizeEnd?: () => void;
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
  tool = 'select',
  onSelectClip,
  selectedClipId,
  onMoveClip,
  onResizeClip,
  onRazorClick,
  onDragStart: onDragStartCallback,
  onDragEnd: onDragEndCallback,
  onResizeStart: onResizeStartCallback,
  onResizeEnd: onResizeEndCallback,
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
  const isAudioLayer = layer.type === LayerType.AUDIO;
  
  // Layer state
  const [layerHeight, setLayerHeight] = useState(layer.height || DEFAULT_LAYER_HEIGHT);
  const [isMuted, setIsMuted] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [isLocked, setIsLocked] = useState(layer.locked || false);
  const [isVisible, setIsVisible] = useState(layer.visible !== false);
  
  // Estado para el arrastre de clips
  const [draggedClipId, setDraggedClipId] = React.useState<number | null>(null);
  const [resizingClipId, setResizingClipId] = React.useState<number | null>(null);
  const [resizeDirection, setResizeDirection] = React.useState<'start' | 'end' | null>(null);
  
  // Refs para evitar closures obsoletos
  const dragStateRef = React.useRef({
    clipId: null as number | null,
    startX: 0,
    originalStart: 0,
    currentDeltaX: 0, // Para tracking del delta actual
    clipElement: null as HTMLElement | null, // Referencia al elemento DOM
    rafId: null as number | null // Para requestAnimationFrame
  });
  
  const resizeStateRef = React.useRef({
    clipId: null as number | null,
    direction: null as 'start' | 'end' | null,
    startX: 0,
    originalData: null as { start: number; duration: number } | null,
    clipElement: null as HTMLElement | null,
    rafId: null as number | null,
    currentDeltaX: 0 // Para tracking del delta actual
  });
  
  // Referencia al contenedor para calcular posiciones
  const containerRef = React.useRef<HTMLDivElement>(null);
  
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
    
    // Comprobar duración mínima
    if (clipDuration < 0.1) {
      return false;
    }
    
    // Comprobar límites del timeline
    if (newStart < 0 || newStart + clipDuration > duration) {
      return false;
    }
    
    return true;
  };
  
  // ====== ARRASTRAR CLIPS (OPTIMIZADO CON RAF) ======
  const handleDragMove = React.useCallback((e: MouseEvent) => {
    const state = dragStateRef.current;
    if (!state.clipId) {
      return;
    }
    
    // Guardar el delta actual
    state.currentDeltaX = e.clientX - state.startX;
    
    // Usar requestAnimationFrame para rendimiento fluido
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
    
    state.rafId = requestAnimationFrame(() => {
      const clipElement = state.clipElement;
      if (!clipElement) {
        return;
      }
      
      // Aplicar transform CSS directamente (sin re-render React)
      clipElement.style.transform = `translateX(${state.currentDeltaX}px)`;
      clipElement.style.transition = 'none';
      clipElement.style.zIndex = '100';
    });
  }, []);
  
  const handleDragEnd = React.useCallback(() => {
    const state = dragStateRef.current;
    const clipId = state.clipId;
    const deltaX = state.currentDeltaX;
    const originalStart = state.originalStart;
    const clipElement = state.clipElement;
    
    // Cancelar cualquier RAF pendiente
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
    
    // Restaurar estilos del elemento
    if (clipElement) {
      clipElement.style.transform = '';
      clipElement.style.transition = '';
      clipElement.style.zIndex = '';
    }
    
    // Calcular posición final y actualizar estado React UNA sola vez
    if (clipId && deltaX !== 0) {
      const deltaTime = deltaX / zoom;
      const newStart = Math.max(0, Math.min(duration - (clips.find(c => c.id === clipId)?.duration || 0), originalStart + deltaTime));
      onMoveClip?.(clipId, newStart, layer.id);
    }
    
    // Limpiar estado
    dragStateRef.current = { 
      clipId: null, 
      startX: 0, 
      originalStart: 0, 
      currentDeltaX: 0, 
      clipElement: null, 
      rafId: null 
    };
    setDraggedClipId(null);
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.body.style.cursor = '';
    
    // Notificar al editor que terminó el drag para guardar en historial
    onDragEndCallback?.();
  }, [clips, zoom, duration, layer.id, onMoveClip, handleDragMove, onDragEndCallback]);
  
  const handleDragStart = React.useCallback((clipId: number, e: React.MouseEvent) => {
    if (isLocked && !isAudioLayer) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    
    const clip = clips.find(c => c.id === clipId);
    if (!clip) {
      return;
    }
    
    // Notificar al editor que empieza un drag para guardar estado inicial
    onDragStartCallback?.();
    
    // Buscar el elemento DOM del clip usando el selector de data-clip-id
    // Usar querySelector en lugar de closest para mayor confiabilidad
    const clipElement = document.querySelector(`[data-clip-id="${clipId}"]`) as HTMLElement;
    
    if (!clipElement) {
      return;
    }
    
    // Guardar estado en ref para evitar closures obsoletos
    dragStateRef.current = {
      clipId: clipId,
      startX: e.clientX,
      originalStart: clip.start,
      currentDeltaX: 0,
      clipElement: clipElement,
      rafId: null
    };
    setDraggedClipId(clipId);
    
    // Añadir listeners globales
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.body.style.cursor = 'grabbing';
  }, [clips, isLocked, isAudioLayer, handleDragMove, handleDragEnd, onDragStartCallback]);
  
  // ====== REDIMENSIONAR CLIPS (OPTIMIZADO CON RAF) ======
  const handleResizeMove = React.useCallback((e: MouseEvent) => {
    const state = resizeStateRef.current;
    if (!state.clipId || !state.originalData || !state.direction) return;
    
    const deltaX = e.clientX - state.startX;
    
    // Guardar el delta actual en el ref
    state.currentDeltaX = deltaX;
    
    // Usar requestAnimationFrame para rendimiento fluido
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
    
    state.rafId = requestAnimationFrame(() => {
      const clipElement = state.clipElement;
      if (!clipElement || !state.originalData) return;
      
      const originalWidthPx = state.originalData.duration * zoom;
      
      if (state.direction === 'start') {
        // Redimensionar desde el inicio: mover y cambiar ancho
        let clampedDelta = deltaX;
        const minWidthPx = 0.5 * zoom;
        const maxDeltaX = originalWidthPx - minWidthPx;
        const minDeltaX = -(state.originalData.start * zoom);
        
        clampedDelta = Math.max(minDeltaX, Math.min(maxDeltaX, deltaX));
        
        clipElement.style.transform = `translateX(${clampedDelta}px)`;
        clipElement.style.width = `${originalWidthPx - clampedDelta}px`;
      } else {
        // Redimensionar desde el final: solo cambiar ancho
        let newWidth = originalWidthPx + deltaX;
        const minWidthPx = 0.5 * zoom;
        const maxWidthPx = (duration - state.originalData.start) * zoom;
        
        newWidth = Math.max(minWidthPx, Math.min(maxWidthPx, newWidth));
        
        clipElement.style.width = `${newWidth}px`;
      }
      
      clipElement.style.transition = 'none';
      clipElement.style.zIndex = '100';
    });
  }, [zoom, duration]);
  
  const handleResizeEnd = React.useCallback(() => {
    const state = resizeStateRef.current;
    const clipId = state.clipId;
    const direction = state.direction;
    const originalData = state.originalData;
    const clipElement = state.clipElement;
    const currentDeltaX = state.currentDeltaX;
    
    // Cancelar cualquier RAF pendiente
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
    
    // Restaurar estilos del elemento
    if (clipElement) {
      clipElement.style.transform = '';
      clipElement.style.width = '';
      clipElement.style.transition = '';
      clipElement.style.zIndex = '';
    }
    
    // Calcular valores finales y actualizar estado React UNA sola vez
    if (clipId && originalData && currentDeltaX !== 0) {
      const deltaTime = currentDeltaX / zoom;
      
      let newStart = originalData.start;
      let newDuration = originalData.duration;
      
      if (direction === 'start') {
        newStart = originalData.start + deltaTime;
        newDuration = originalData.duration - deltaTime;
        
        if (newStart < 0) {
          newStart = 0;
          newDuration = originalData.start + originalData.duration;
        }
        if (newDuration < 0.5) {
          newDuration = 0.5;
          newStart = originalData.start + originalData.duration - 0.5;
        }
      } else {
        newDuration = originalData.duration + deltaTime;
        if (newDuration < 0.5) newDuration = 0.5;
        if (newStart + newDuration > duration) newDuration = duration - newStart;
      }
      
      onResizeClip?.(clipId, newStart, newDuration);
    }
    
    // Limpiar estado
    resizeStateRef.current = { 
      clipId: null, 
      direction: null, 
      startX: 0, 
      originalData: null,
      clipElement: null,
      rafId: null,
      currentDeltaX: 0
    };
    setResizingClipId(null);
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = '';
    onResizeEndCallback?.();
  }, [zoom, duration, onResizeClip, handleResizeMove, onResizeEndCallback]);
  
  const handleResizeStart = React.useCallback((clipId: number, direction: 'start' | 'end', e: React.MouseEvent) => {
    if (isLocked && !isAudioLayer) return;
    e.preventDefault();
    e.stopPropagation();
    
    const clip = clips.find(c => c.id === clipId);
    if (!clip) return;
    
    // Notificar al editor que empieza un resize para guardar estado inicial
    onResizeStartCallback?.();
    
    // Buscar el elemento DOM del clip
    const clipElement = (e.target as HTMLElement).closest('[data-clip-id]') as HTMLElement;
    
    // Guardar estado en ref
    resizeStateRef.current = {
      clipId: clipId,
      direction: direction,
      startX: e.clientX,
      originalData: { start: clip.start, duration: clip.duration },
      clipElement: clipElement,
      rafId: null,
      currentDeltaX: 0
    };
    setResizingClipId(clipId);
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.body.style.cursor = 'ew-resize';
  }, [clips, isLocked, isAudioLayer, handleResizeMove, handleResizeEnd, onResizeStartCallback]);
  
  // Cleanup en unmount
  React.useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
      // Cancelar cualquier RAF pendiente
      if (dragStateRef.current.rafId) {
        cancelAnimationFrame(dragStateRef.current.rafId);
      }
      if (resizeStateRef.current.rafId) {
        cancelAnimationFrame(resizeStateRef.current.rafId);
      }
    };
  }, [handleDragMove, handleDragEnd, handleResizeMove, handleResizeEnd]);
  
  // Estilo para la línea de tiempo actual
  const currentTimeIndicatorStyle = {
    left: `${currentTime * zoom}px`,
    height: '100%',
    position: 'absolute' as const,
    top: 0,
    width: '2px',
    backgroundColor: '#f97316', // orange-500
    zIndex: 10,
    boxShadow: '0 0 4px rgba(249, 115, 22, 0.5)',
    pointerEvents: 'none' as const, // No bloquear eventos de mouse
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
    if (isAudioLayer) return;
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
                  disabled={isAudioLayer}
                  className={`p-1 rounded transition-all ${
                    isAudioLayer
                      ? 'opacity-40 cursor-not-allowed'
                      : isLocked 
                        ? 'bg-yellow-500/20 text-yellow-400' 
                        : 'hover:bg-white/10 text-white/40'
                  }`}
                  title={isAudioLayer ? 'Audio layer always editable' : (isLocked ? 'Unlock Layer' : 'Lock Layer')}
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
          className={`layer-content relative flex-1 overflow-hidden transition-all ${isLocked && !isAudioLayer ? 'pointer-events-none' : ''}`}
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
          {isLocked && !isAudioLayer && (
            <div className="absolute inset-0 bg-yellow-900/20 z-20 flex items-center justify-center">
              <div className="flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20">
                <Lock size={12} />
                <span className="text-[10px] font-medium">LOCKED</span>
              </div>
            </div>
          )}

          {/* Hidden overlay */}
          {!isVisible && (
            <div className="absolute inset-0 bg-gray-900/60 z-20 flex items-center justify-center pointer-events-none">
              <div className="flex items-center gap-1 text-gray-400 bg-gray-500/10 px-2 py-1 rounded border border-gray-500/20">
                <EyeOff size={12} />
                <span className="text-[10px] font-medium">HIDDEN</span>
              </div>
            </div>
          )}

          {/* Muted overlay for audio */}
          {isMuted && isAudioLayer && isVisible && !isLocked && (
            <div className="absolute inset-0 bg-gray-900/50 z-20 flex items-center justify-center pointer-events-none">
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
              tool={tool}
              onSelect={(id) => {
                if (!isLocked || isAudioLayer) onSelectClip(id);
              }}
              onMoveStart={(id, e) => {
                if (!isLocked || isAudioLayer) handleDragStart(id, e);
              }}
              onResizeStart={(id, direction, e) => {
                if (!isLocked || isAudioLayer) handleResizeStart(id, direction, e);
              }}
              onRazorClick={onRazorClick}
              isDragging={draggedClipId === clip.id}
              isResizing={resizingClipId === clip.id}
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