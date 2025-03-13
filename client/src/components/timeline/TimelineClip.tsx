import React, { useState, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import { Wand2, Lock, Eye, EyeOff, Music, Video, Image, Palette, Type, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { TimelineClip as ITimelineClip } from '../../components/music-video/timeline-editor';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../components/ui/tooltip';

interface TimelineClipProps {
  clip: ITimelineClip;
  pixelsPerSecond: number;
  currentTime: number;
  isSelected: boolean;
  onSelect: (clipId: number) => void;
  onRegenerateContent?: (clipId: number) => void;
  onUpdateClip?: (clipId: number, updates: Partial<ITimelineClip>) => void;
  onMoveClipStart?: (clipId: number, delta: number) => void;
  onMoveClipEnd?: (clipId: number, delta: number) => void;
  isPlayheadOver?: boolean;
  beatsData?: any;
  layersVisible?: number[];
  layersLocked?: number[];
}

/**
 * Componente TimelineClip profesional para el editor de línea de tiempo
 * 
 * Características:
 * - Visualización por tipo (video, audio, imagen, texto, efecto)
 * - Soporte para placeholder con indicador de generación pendiente
 * - Previsualización de contenido
 * - Bloqueo y visibilidad por capas
 * - Soporte para capas aisladas (audio)
 */
export const TimelineClip: React.FC<TimelineClipProps> = ({
  clip,
  pixelsPerSecond,
  currentTime,
  isSelected,
  onSelect,
  onRegenerateContent,
  onUpdateClip,
  onMoveClipStart,
  onMoveClipEnd,
  isPlayheadOver,
  beatsData,
  layersVisible = [0, 1, 2, 3],
  layersLocked = []
}) => {
  const [isResizing, setIsResizing] = useState<'start' | 'end' | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [clipStartTime, setClipStartTime] = useState(clip.start);
  const [clipDuration, setClipDuration] = useState(clip.duration);
  const clipRef = useRef<HTMLDivElement>(null);
  
  // Verificar si la capa está visible y desbloqueada
  const isLayerVisible = layersVisible.includes(clip.layer);
  const isLayerLocked = layersLocked.includes(clip.layer);
  const isAudioLayer = clip.layer === 0;
  
  // Determinar si el clip es un placeholder para generación de AI
  const isPlaceholder = clip.isPlaceholder || clip.pendingGeneration;
  
  // Estilos específicos según tipo de clip
  const getClipTypeStyles = () => {
    // Estilos base comunes
    const baseStyles = {
      borderRadius: '0.25rem',
      boxSizing: 'border-box' as const, 
      position: 'absolute' as const,
      height: '100%',
      cursor: isLayerLocked || clip.locked ? 'not-allowed' : 'pointer',
      overflow: 'hidden',
      transition: 'opacity 0.2s, border 0.2s',
      opacity: isLayerVisible && (clip.visible !== false) ? 1 : 0.4,
    };
    
    // Calcular la posición y ancho según tiempo y duración
    const positionStyles = {
      left: `${clip.start * pixelsPerSecond}px`,
      width: `${clip.duration * pixelsPerSecond}px`,
    };
    
    // Estilos específicos por tipo de clip
    let typeSpecificStyles: React.CSSProperties = {};
    
    // Estilos por tipo
    switch (clip.type) {
      case 'audio':
        typeSpecificStyles = {
          background: 'linear-gradient(180deg, rgba(249, 115, 22, 0.2) 0%, rgba(249, 115, 22, 0.5) 100%)',
          borderBottom: '2px solid #f97316',
          borderTop: isSelected ? '2px solid #f97316' : '1px solid #f97316',
        };
        break;
      case 'video':
        typeSpecificStyles = {
          background: 'linear-gradient(180deg, rgba(79, 70, 229, 0.2) 0%, rgba(79, 70, 229, 0.5) 100%)',
          borderBottom: '2px solid #4f46e5',
          borderTop: isSelected ? '2px solid #4f46e5' : '1px solid #4f46e5',
        };
        break;
      case 'image':
        typeSpecificStyles = {
          background: 'linear-gradient(180deg, rgba(14, 165, 233, 0.2) 0%, rgba(14, 165, 233, 0.5) 100%)',
          borderBottom: '2px solid #0ea5e9',
          borderTop: isSelected ? '2px solid #0ea5e9' : '1px solid #0ea5e9',
        };
        break;
      case 'text':
        typeSpecificStyles = {
          background: 'linear-gradient(180deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.5) 100%)',
          borderBottom: '2px solid #8b5cf6',
          borderTop: isSelected ? '2px solid #8b5cf6' : '1px solid #8b5cf6',
        };
        break;
      case 'effect':
      case 'transition':
        typeSpecificStyles = {
          background: 'linear-gradient(180deg, rgba(16, 185, 129, 0.2) 0%, rgba(16, 185, 129, 0.5) 100%)',
          borderBottom: '2px solid #10b981',
          borderTop: isSelected ? '2px solid #10b981' : '1px solid #10b981',
        };
        break;
      default:
        typeSpecificStyles = {
          background: 'linear-gradient(180deg, rgba(156, 163, 175, 0.2) 0%, rgba(156, 163, 175, 0.5) 100%)',
          borderBottom: '2px solid #9ca3af',
          borderTop: isSelected ? '2px solid #9ca3af' : '1px solid #9ca3af',
        };
    }
    
    // Estilos para placeholder (generación pendiente)
    if (isPlaceholder) {
      typeSpecificStyles = {
        ...typeSpecificStyles,
        background: 'repeating-linear-gradient(45deg, rgba(0,0,0,0.1), rgba(0,0,0,0.1) 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)',
        border: '2px dashed #9ca3af',
      };
    }
    
    // Estilos para clip seleccionado
    if (isSelected) {
      typeSpecificStyles = {
        ...typeSpecificStyles,
        boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.5)',
        zIndex: 10,
      };
    }
    
    // Estilos si el clip está bloqueado
    if (isLayerLocked || clip.locked) {
      typeSpecificStyles = {
        ...typeSpecificStyles,
        opacity: 0.7,
        background: `repeating-linear-gradient(45deg, 
                     ${typeSpecificStyles.background || 'rgba(156, 163, 175, 0.2)'}, 
                     ${typeSpecificStyles.background || 'rgba(156, 163, 175, 0.2)'} 5px, 
                     rgba(0, 0, 0, 0.1) 5px, 
                     rgba(0, 0, 0, 0.1) 10px)`,
      };
    }
    
    // Combinar todos los estilos
    return {
      ...baseStyles,
      ...positionStyles,
      ...typeSpecificStyles
    };
  };
  
  // Manejador para seleccionar clip
  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // No permitir selección si la capa está bloqueada
    if (isLayerLocked || clip.locked) return;
    
    onSelect(clip.id);
  };
  
  // Manejador para regenerar contenido
  const handleRegenerate = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // No permitir regeneración si la capa está bloqueada
    if (isLayerLocked || clip.locked) return;
    
    onRegenerateContent?.(clip.id);
  };
  
  // Manejador para iniciar redimensionamiento
  const handleResizeStart = (e: React.MouseEvent, side: 'start' | 'end') => {
    e.stopPropagation();
    
    // No permitir redimensionamiento si la capa está bloqueada o el clip está aislado
    if (isLayerLocked || clip.locked || clip.isIsolated) return;
    
    setIsResizing(side);
    setResizeStartX(e.clientX);
    setClipStartTime(clip.start);
    setClipDuration(clip.duration);
  };
  
  // Efecto para manejar el redimensionamiento
  useEffect(() => {
    if (!isResizing) return;
    
    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = e.clientX - resizeStartX;
      const deltaSeconds = deltaX / pixelsPerSecond;
      
      if (isResizing === 'start') {
        // Mover inicio del clip
        const newStart = Math.max(0, clipStartTime + deltaSeconds);
        const newDuration = Math.max(0.5, clipDuration - (newStart - clipStartTime));
        
        // Aplicar límites de duración máxima (5 segundos para clips aislados)
        if (clip.maxDuration && newDuration > clip.maxDuration) {
          return;
        }
        
        onMoveClipStart?.(clip.id, newStart - clipStartTime);
      } else if (isResizing === 'end') {
        // Mover fin del clip
        const newDuration = Math.max(0.5, clipDuration + deltaSeconds);
        
        // Aplicar límites de duración máxima (5 segundos para clips aislados)
        if (clip.maxDuration && newDuration > clip.maxDuration) {
          return;
        }
        
        onMoveClipEnd?.(clip.id, deltaSeconds);
      }
    };
    
    const handleMouseUp = () => {
      setIsResizing(null);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, resizeStartX, pixelsPerSecond, clipStartTime, clipDuration, clip.id, onMoveClipStart, onMoveClipEnd, clip.maxDuration, clip.isIsolated]);
  
  // Renderizar el icono correspondiente según el tipo de clip
  const renderTypeIcon = () => {
    switch (clip.type) {
      case 'audio':
        return <Music className="w-3 h-3" />;
      case 'video':
        return <Video className="w-3 h-3" />;
      case 'image':
        return <Image className="w-3 h-3" />;
      case 'text':
        return <Type className="w-3 h-3" />;
      case 'effect':
      case 'transition':
        return <Palette className="w-3 h-3" />;
      default:
        return null;
    }
  };
  
  // Renderizar el contenido del clip
  const renderClipContent = () => {
    return (
      <div className="flex items-center justify-between px-1.5 h-full">
        <div className="flex items-center gap-1 overflow-hidden">
          <span className="flex items-center justify-center rounded-sm bg-black/20 p-0.5">
            {renderTypeIcon()}
          </span>
          
          <span className="truncate text-xs font-medium text-white">
            {clip.title || `Clip ${clip.id}`}
          </span>
          
          {clip.locked && (
            <Lock className="w-3 h-3 text-white/70" />
          )}
          
          {clip.visible === false && (
            <EyeOff className="w-3 h-3 text-white/70" />
          )}
          
          {isPlaceholder && (
            <span className="inline-flex items-center rounded-full bg-yellow-500/20 px-1 text-[10px] font-medium text-yellow-500">
              AI
            </span>
          )}
        </div>
        
        {isPlaceholder && onRegenerateContent && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-4 w-4 p-0 opacity-70 hover:opacity-100 hover:bg-white/10"
                  onClick={handleRegenerate}
                >
                  <Wand2 className="h-3 w-3" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Generar contenido AI</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  };
  
  // Manejo de clips aislados (caso especial para audio)
  const renderIsolatedIndicator = () => {
    if (!clip.isIsolated) return null;
    
    return (
      <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-3 h-3 flex items-center justify-center">
        <span className="sr-only">Capa aislada</span>
      </div>
    );
  };
  
  // Renderizar indicadores de restricción de duración
  const renderDurationLimitIndicator = () => {
    if (!clip.maxDuration) return null;
    
    return (
      <div className="absolute top-0 right-0 left-0 h-1 bg-orange-500/30">
        <div 
          className="h-full bg-orange-500" 
          style={{ width: `${(clip.duration / clip.maxDuration) * 100}%` }}
        />
      </div>
    );
  };
  
  return (
    <div
      ref={clipRef}
      style={getClipTypeStyles()}
      onClick={handleSelect}
      className={cn(
        "timeline-clip",
        { "opacity-0": !isLayerVisible || clip.visible === false }
      )}
    >
      {/* Manejadores de redimensionamiento */}
      {!isLayerLocked && !clip.locked && !clip.isIsolated && (
        <>
          <div 
            className="absolute top-0 left-0 w-2 h-full cursor-ew-resize z-10 hover:bg-white/20"
            onMouseDown={(e) => handleResizeStart(e, 'start')}
          />
          <div 
            className="absolute top-0 right-0 w-2 h-full cursor-ew-resize z-10 hover:bg-white/20"
            onMouseDown={(e) => handleResizeStart(e, 'end')}
          />
        </>
      )}
      
      {/* Contenido principal del clip */}
      {renderClipContent()}
      
      {/* Indicadores adicionales */}
      {renderIsolatedIndicator()}
      {renderDurationLimitIndicator()}
      
      {/* Indicador de playhead */}
      {isPlayheadOver && (
        <div className="absolute top-0 bottom-0 w-0.5 bg-white z-20" 
          style={{ left: `${(currentTime - clip.start) * pixelsPerSecond}px` }} 
        />
      )}
    </div>
  );
};

export default TimelineClip;