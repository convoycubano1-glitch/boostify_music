import { useState, useCallback } from 'react';
import { TimelineClip } from '../../components/music-video/timeline/TimelineEditor';
import {
  MIN_CLIP_DURATION,
  MAX_CLIP_DURATION,
  SNAP_THRESHOLD,
  ClipOperation
} from '../../constants/timeline-constants';

interface UseClipInteractionsProps {
  clips: TimelineClip[];
  setClips: React.Dispatch<React.SetStateAction<TimelineClip[]>>;
  selectedClip: number | null;
  setSelectedClip: React.Dispatch<React.SetStateAction<number | null>>;
  onClipsChange?: (clips: TimelineClip[]) => void;
}

interface UseClipInteractionsResult {
  handleAddClip: (clipParams: Partial<TimelineClip>) => void;
  handleSelectClip: (clipId: number) => void;
  handleDeleteClip: (clipId: number) => void;
  handleMoveClip: (clipId: number, newStart: number) => void;
  handleResizeClip: (clipId: number, newDuration: number) => void;
  handleClipOperation: (operation: ClipOperation, clipId?: number, data?: any) => void;
}

/**
 * Hook para gestionar interacciones con clips (selección, movimiento, redimensionado, etc.)
 */
export function useClipInteractions({
  clips,
  setClips,
  selectedClip,
  setSelectedClip,
  onClipsChange
}: UseClipInteractionsProps): UseClipInteractionsResult {
  // Estado para guardar clips en el portapapeles
  const [clipboardClip, setClipboardClip] = useState<TimelineClip | null>(null);
  
  // Seleccionar un clip
  const handleSelectClip = useCallback((clipId: number) => {
    setSelectedClip(clipId);
  }, [setSelectedClip]);
  
  // Agregar un nuevo clip
  const handleAddClip = useCallback((clipParams: Partial<TimelineClip>) => {
    const newClipId = Math.max(0, ...clips.map(clip => clip.id)) + 1;
    
    const newClip: TimelineClip = {
      id: newClipId,
      type: clipParams.type || 'video',
      start: clipParams.start || 0,
      duration: clipParams.duration || 1,
      layer: clipParams.layer || 0,
      name: clipParams.name || `Clip ${newClipId}`,
      url: clipParams.url,
      content: clipParams.content
    };
    
    setClips(prevClips => {
      const updatedClips = [...prevClips, newClip];
      onClipsChange?.(updatedClips);
      return updatedClips;
    });
    
    setSelectedClip(newClipId);
  }, [clips, setClips, setSelectedClip, onClipsChange]);
  
  // Eliminar un clip
  const handleDeleteClip = useCallback((clipId: number) => {
    setClips(prevClips => {
      const updatedClips = prevClips.filter(clip => clip.id !== clipId);
      onClipsChange?.(updatedClips);
      return updatedClips;
    });
    
    if (selectedClip === clipId) {
      setSelectedClip(null);
    }
  }, [setClips, selectedClip, setSelectedClip, onClipsChange]);
  
  // Mover un clip a una nueva posición
  const handleMoveClip = useCallback((clipId: number, newStart: number) => {
    // Asegurar que el tiempo de inicio sea no negativo
    const validNewStart = Math.max(0, newStart);
    
    setClips(prevClips => {
      const clipIndex = prevClips.findIndex(clip => clip.id === clipId);
      
      if (clipIndex === -1) return prevClips;
      
      const targetClip = { ...prevClips[clipIndex] };
      
      // Comprobar si hay snap a otros clips
      let snappedStart = validNewStart;
      
      // Comprobar snap a otros clips (inicio y fin)
      prevClips.forEach(otherClip => {
        if (otherClip.id !== clipId && otherClip.layer === targetClip.layer) {
          // Snap al inicio de otro clip
          if (Math.abs(validNewStart - otherClip.start) < SNAP_THRESHOLD) {
            snappedStart = otherClip.start;
          }
          
          // Snap al final de otro clip
          const otherClipEnd = otherClip.start + otherClip.duration;
          if (Math.abs(validNewStart - otherClipEnd) < SNAP_THRESHOLD) {
            snappedStart = otherClipEnd;
          }
        }
      });
      
      // Actualizar clip
      const updatedClip = {
        ...targetClip,
        start: snappedStart
      };
      
      const updatedClips = [
        ...prevClips.slice(0, clipIndex),
        updatedClip,
        ...prevClips.slice(clipIndex + 1)
      ];
      
      onClipsChange?.(updatedClips);
      return updatedClips;
    });
  }, [setClips, onClipsChange]);
  
  // Cambiar la duración de un clip
  const handleResizeClip = useCallback((clipId: number, newDuration: number) => {
    // Limitar la duración al rango válido
    const validNewDuration = Math.max(
      MIN_CLIP_DURATION,
      Math.min(MAX_CLIP_DURATION, newDuration)
    );
    
    setClips(prevClips => {
      const clipIndex = prevClips.findIndex(clip => clip.id === clipId);
      
      if (clipIndex === -1) return prevClips;
      
      const targetClip = { ...prevClips[clipIndex] };
      
      // Comprobar snap a otros clips
      let snappedDuration = validNewDuration;
      const clipEnd = targetClip.start + validNewDuration;
      
      // Comprobar snap al inicio de otros clips
      prevClips.forEach(otherClip => {
        if (otherClip.id !== clipId && otherClip.layer === targetClip.layer) {
          // Snap al inicio de otro clip
          if (Math.abs(clipEnd - otherClip.start) < SNAP_THRESHOLD) {
            snappedDuration = otherClip.start - targetClip.start;
          }
        }
      });
      
      // Actualizar clip
      const updatedClip = {
        ...targetClip,
        duration: snappedDuration
      };
      
      const updatedClips = [
        ...prevClips.slice(0, clipIndex),
        updatedClip,
        ...prevClips.slice(clipIndex + 1)
      ];
      
      onClipsChange?.(updatedClips);
      return updatedClips;
    });
  }, [setClips, onClipsChange]);
  
  // Operaciones genéricas sobre clips (copiar, pegar, etc.)
  const handleClipOperation = useCallback((operation: ClipOperation, clipId?: number, data?: any) => {
    switch (operation) {
      case ClipOperation.COPY:
        if (clipId) {
          const clipToCopy = clips.find(clip => clip.id === clipId);
          if (clipToCopy) {
            setClipboardClip({ ...clipToCopy });
          }
        }
        break;
        
      case ClipOperation.PASTE:
        if (clipboardClip && data?.start !== undefined) {
          const newClipId = Math.max(0, ...clips.map(clip => clip.id)) + 1;
          
          const newClip: TimelineClip = {
            ...clipboardClip,
            id: newClipId,
            start: data.start
          };
          
          setClips(prevClips => {
            const updatedClips = [...prevClips, newClip];
            onClipsChange?.(updatedClips);
            return updatedClips;
          });
          
          setSelectedClip(newClipId);
        }
        break;
        
      case ClipOperation.DELETE:
        if (clipId) {
          handleDeleteClip(clipId);
        }
        break;
        
      case ClipOperation.SELECT:
        if (clipId !== undefined) {
          setSelectedClip(clipId);
        } else {
          setSelectedClip(null);
        }
        break;
        
      default:
        console.warn(`Operación no soportada: ${operation}`);
        break;
    }
  }, [clips, clipboardClip, setClips, setSelectedClip, handleDeleteClip, onClipsChange]);
  
  return {
    handleAddClip,
    handleSelectClip,
    handleDeleteClip,
    handleMoveClip,
    handleResizeClip,
    handleClipOperation
  };
}