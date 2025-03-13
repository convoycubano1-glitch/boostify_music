import { useState, useCallback, useRef } from 'react';
import { ClipType, LayerType, MAX_CLIP_DURATION, ERROR_MESSAGES } from '../../constants/timeline-constants';
import { TimelineClip } from './useClipOperations';

// Define constantes para la interacción
const SNAP_THRESHOLD = 0.2; // En segundos
const MIN_CLIP_DURATION = 0.3; // Duración mínima en segundos

export enum ClipOperation {
  NONE = 'none',
  MOVE = 'move',
  RESIZE_START = 'resize_start',
  RESIZE_END = 'resize_end'
}

interface ClipInteractionOptions {
  pixelsPerSecond: number;
  onClipUpdate?: (clipId: string, updates: Partial<TimelineClip>) => void;
  onClipMoved?: (clipId: string, layerId: string, startTime: number) => void;
  onClipResized?: (clipId: string, newDuration: number) => void;
  snapToBeat?: boolean;
  snapToOtherClips?: boolean;
  beatPositions?: number[];
  checkClipOverlap?: (layerId: string, startTime: number, duration: number, excludeClipId?: string) => boolean;
}

/**
 * Hook para manejar las interacciones con clips en el timeline
 * Gestiona operaciones como arrastrar, redimensionar y soltar
 */
export function useClipInteractions({
  pixelsPerSecond,
  onClipUpdate,
  onClipMoved,
  onClipResized,
  snapToBeat = true,
  snapToOtherClips = true,
  beatPositions = [],
  checkClipOverlap
}: ClipInteractionOptions) {
  // Estado para la operación actual
  const [activeOperation, setActiveOperation] = useState<ClipOperation>(ClipOperation.NONE);
  const [activeClipId, setActiveClipId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [originalClipState, setOriginalClipState] = useState<Partial<TimelineClip> | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Referencias para datos intermedios
  const lastPositionRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  
  // Iniciar operación de arrastrar
  const startDrag = useCallback((
    clipId: string, 
    operation: ClipOperation, 
    clientX: number, 
    clipData: Partial<TimelineClip>
  ) => {
    setActiveClipId(clipId);
    setActiveOperation(operation);
    setDragStartX(clientX);
    setOriginalClipState(clipData);
    setIsDragging(true);
    
    lastPositionRef.current = { x: clientX, y: 0 };
    
    // Añadir listeners globales para poder mover fuera del clip
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);
  
  // Convertir pixels a segundos basado en el zoom
  const pixelsToSeconds = useCallback((pixels: number) => {
    return pixels / pixelsPerSecond;
  }, [pixelsPerSecond]);
  
  // Snap to beat o a otros clips
  const getSnappedTime = useCallback((time: number): number => {
    if (!snapToBeat && !snapToOtherClips) return time;
    
    // Redondear a 2 decimales para evitar errores de precisión
    time = Math.round(time * 100) / 100;
    
    // Snap a beat si está activado
    if (snapToBeat && beatPositions.length > 0) {
      for (const beatTime of beatPositions) {
        if (Math.abs(time - beatTime) < SNAP_THRESHOLD) {
          return beatTime;
        }
      }
    }
    
    // En el futuro podríamos implementar snap a otros clips
    
    return time;
  }, [snapToBeat, snapToOtherClips, beatPositions]);
  
  // Manejar movimiento del mouse durante una operación
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!activeClipId || !originalClipState || activeOperation === ClipOperation.NONE) return;
    
    const deltaX = e.clientX - dragStartX;
    const timeDelta = pixelsToSeconds(deltaX);
    
    // Actualizar la posición actual
    lastPositionRef.current = { x: e.clientX, y: e.clientY };
    
    switch (activeOperation) {
      case ClipOperation.MOVE: {
        if (!originalClipState.startTime) return;
        
        // Calcular nueva posición con snap
        let newStartTime = originalClipState.startTime + timeDelta;
        newStartTime = Math.max(0, newStartTime); // No permitir valores negativos
        newStartTime = getSnappedTime(newStartTime);
        
        // Si onClipUpdate está disponible, usarlo para actualizar el clip
        if (onClipUpdate) {
          onClipUpdate(activeClipId, { startTime: newStartTime });
        }
        break;
      }
      
      case ClipOperation.RESIZE_START: {
        if (!originalClipState.startTime || !originalClipState.duration) return;
        
        // Calcular nuevo tiempo de inicio y duración
        let deltaStart = Math.min(timeDelta, originalClipState.duration - MIN_CLIP_DURATION);
        let newStartTime = originalClipState.startTime + deltaStart;
        newStartTime = Math.max(0, newStartTime);
        newStartTime = getSnappedTime(newStartTime);
        
        // Recalcular delta después del snap
        deltaStart = newStartTime - originalClipState.startTime;
        
        // Ajustar la duración para mantener el final fijo
        const newDuration = Math.max(
          MIN_CLIP_DURATION,
          originalClipState.duration - deltaStart
        );
        
        // Actualizar clip
        if (onClipUpdate) {
          onClipUpdate(activeClipId, { 
            startTime: newStartTime,
            duration: newDuration 
          });
        }
        break;
      }
      
      case ClipOperation.RESIZE_END: {
        if (!originalClipState.duration) return;
        
        // Calcular nueva duración con límites
        let newDuration = Math.max(
          MIN_CLIP_DURATION,
          originalClipState.duration + timeDelta
        );
        
        // Aplicar límite máximo
        newDuration = Math.min(newDuration, MAX_CLIP_DURATION);
        
        // Hacer snap del final del clip
        if (originalClipState.startTime) {
          const endTime = originalClipState.startTime + newDuration;
          const snappedEndTime = getSnappedTime(endTime);
          newDuration = snappedEndTime - originalClipState.startTime;
          
          // Asegurar que se mantiene la duración mínima
          newDuration = Math.max(MIN_CLIP_DURATION, newDuration);
        }
        
        // Actualizar clip
        if (onClipUpdate) {
          onClipUpdate(activeClipId, { duration: newDuration });
        }
        break;
      }
    }
  }, [
    activeClipId, 
    originalClipState, 
    activeOperation, 
    dragStartX, 
    onClipUpdate, 
    pixelsToSeconds, 
    getSnappedTime
  ]);
  
  // Finalizar operación de arrastrar
  const handleMouseUp = useCallback(() => {
    // Limpiar listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Finalizar la operación
    if (activeClipId && originalClipState) {
      switch (activeOperation) {
        case ClipOperation.MOVE:
          if (onClipMoved && originalClipState.startTime && originalClipState.layerId) {
            const updatedStartTime = lastPositionRef.current.x !== dragStartX
              ? getSnappedTime(originalClipState.startTime + pixelsToSeconds(lastPositionRef.current.x - dragStartX))
              : originalClipState.startTime;
            
            onClipMoved(activeClipId, originalClipState.layerId, updatedStartTime);
          }
          break;
          
        case ClipOperation.RESIZE_START:
        case ClipOperation.RESIZE_END:
          if (onClipResized && originalClipState.duration) {
            let updatedDuration = originalClipState.duration;
            
            if (activeOperation === ClipOperation.RESIZE_START && originalClipState.startTime) {
              // Para redimensionar por el inicio, calculamos la nueva duración
              const deltaStart = pixelsToSeconds(lastPositionRef.current.x - dragStartX);
              updatedDuration = Math.max(MIN_CLIP_DURATION, originalClipState.duration - deltaStart);
            } else if (activeOperation === ClipOperation.RESIZE_END) {
              // Para redimensionar por el final, simplemente ajustamos la duración
              const deltaEnd = pixelsToSeconds(lastPositionRef.current.x - dragStartX);
              updatedDuration = Math.max(MIN_CLIP_DURATION, originalClipState.duration + deltaEnd);
              updatedDuration = Math.min(updatedDuration, MAX_CLIP_DURATION);
            }
            
            onClipResized(activeClipId, updatedDuration);
          }
          break;
      }
    }
    
    // Resetear estado
    setActiveClipId(null);
    setActiveOperation(ClipOperation.NONE);
    setOriginalClipState(null);
    setIsDragging(false);
  }, [
    activeClipId, 
    activeOperation, 
    originalClipState, 
    dragStartX, 
    onClipMoved, 
    onClipResized,
    pixelsToSeconds,
    getSnappedTime
  ]);
  
  // Método para cancelar una operación en curso
  const cancelOperation = useCallback(() => {
    // Restaurar el estado original del clip si se proporcionó un callback
    if (activeClipId && originalClipState && onClipUpdate) {
      onClipUpdate(activeClipId, originalClipState);
    }
    
    // Limpiar listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    
    // Resetear estado
    setActiveClipId(null);
    setActiveOperation(ClipOperation.NONE);
    setOriginalClipState(null);
    setIsDragging(false);
  }, [activeClipId, originalClipState, onClipUpdate, handleMouseMove, handleMouseUp]);
  
  // Al desmontar, asegurarse de limpiar los listeners
  useCallback(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);
  
  return {
    startDrag,
    cancelOperation,
    activeClipId,
    activeOperation,
    isDragging
  };
}