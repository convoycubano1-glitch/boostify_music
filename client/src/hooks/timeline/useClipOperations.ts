import { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  ClipType, 
  LayerType, 
  MAX_CLIP_DURATION, 
  MIN_CLIP_DURATION,
  ERROR_MESSAGES,
  SNAP_THRESHOLD,
  ClipOperation
} from '../../constants/timeline-constants';

// Importar tipo desde nuestro componente TimelineEditor para asegurar consistencia
import { TimelineClip } from '../../components/music-video/timeline/TimelineEditor';
import { useClipInteractions } from './useClipInteractions';

export interface ClipOperationsOptions {
  /**
   * Callback para cuando hay un error en una operación de clip
   */
  onError?: (message: string) => void;
  
  /**
   * Permite o no la superposición de clips en una misma capa
   */
  allowOverlap?: boolean;
  
  /**
   * Precisión de snap en segundos
   */
  snapThreshold?: number;
  
  /**
   * Listado de posiciones de beats para snap (opcional)
   */
  beatPositions?: number[];
  
  /**
   * Flag para habilitar o deshabilitar el snap a beats
   */
  beatSnapEnabled?: boolean;
}

/**
 * Hook para gestionar todas las operaciones relacionadas con clips en la línea de tiempo
 * 
 * Este hook proporciona funciones para:
 * - Añadir clips
 * - Borrar clips
 * - Mover clips
 * - Redimensionar clips
 * - Dividir clips
 * - Combinar clips
 * - Duplicar clips
 * - Validar operaciones
 */
export function useClipOperations({
  onError = (message) => console.error(message),
  allowOverlap = false,
  snapThreshold = SNAP_THRESHOLD,
  beatPositions = [],
  beatSnapEnabled = true,
  initialClips = []
}: ClipOperationsOptions & { initialClips?: TimelineClip[] } = {}) {
  // Estado para los clips como lista plana
  const [clips, setClips] = useState<TimelineClip[]>(initialClips);
  
  // Usamos useClipInteractions como capa base de interactividad
  const clipInteractions = useClipInteractions({
    clips,
    onClipsChange: (updatedClips) => setClips(updatedClips),
  });
  
  // Organizamos los clips por capa para operaciones más complejas
  const clipsByLayer = useMemo(() => {
    const grouped: { [layerId: number]: TimelineClip[] } = {};
    
    for (const clip of clips) {
      const layerId = clip.layerIndex || 0; // Fallback a capa 0 por compatibilidad
      if (!grouped[layerId]) {
        grouped[layerId] = [];
      }
      grouped[layerId].push(clip);
    }
    
    return grouped;
  }, [clips]);
  
  // Estado para tracking del último ID usado
  const [lastClipId, setLastClipId] = useState<number>(0);
  
  /**
   * Genera un ID único para un nuevo clip
   */
  const generateClipId = useCallback((): number => {
    const newId = lastClipId + 1;
    setLastClipId(newId);
    return newId;
  }, [lastClipId]);
  
  /**
   * Verifica si un clip se superpone con otros en la misma capa
   */
  const checkOverlap = useCallback((
    layerId: number, 
    startTime: number, 
    endTime: number, 
    excludeClipId?: number
  ): boolean => {
    if (allowOverlap) return false;
    
    const layerClips = clipsByLayer[layerId] || [];
    
    return layerClips.some(clip => {
      // Excluir el clip que se está verificando (para operaciones de movimiento)
      if (excludeClipId !== undefined && clip.id === excludeClipId) {
        return false;
      }
      
      // Verificar superposición: ¿el nuevo clip comienza antes de que termine un clip existente
      // Y termina después de que comienza un clip existente?
      return (
        (startTime < clip.endTime) && 
        (endTime > clip.startTime)
      );
    });
  }, [clipsByLayer, allowOverlap]);
  
  /**
   * Encuentra la posición de snap más cercana (grid o beat)
   */
  const findSnapPosition = useCallback((time: number): number => {
    // Sin snap si el umbral es 0
    if (snapThreshold <= 0) return time;
    
    // Buscar snap a beats si está habilitado
    if (beatSnapEnabled && beatPositions.length > 0) {
      // Encontrar el beat más cercano
      let closestBeat = null;
      let minDistance = snapThreshold;
      
      for (const beatTime of beatPositions) {
        const distance = Math.abs(beatTime - time);
        if (distance < minDistance) {
          minDistance = distance;
          closestBeat = beatTime;
        }
      }
      
      if (closestBeat !== null) {
        return closestBeat;
      }
    }
    
    // Fallback: snap a una grid básica (segundos enteros)
    const gridSize = 1; // 1 segundo
    if (Math.abs(time - Math.round(time / gridSize) * gridSize) < snapThreshold) {
      return Math.round(time / gridSize) * gridSize;
    }
    
    return time;
  }, [snapThreshold, beatSnapEnabled, beatPositions]);
  
  /**
   * Añade un nuevo clip a la línea de tiempo
   */
  const addClip = useCallback((
    layerId: number,
    clipType: ClipType,
    startTime: number,
    duration: number,
    properties: Partial<Omit<TimelineClip, 'id' | 'type' | 'startTime' | 'endTime' | 'layerId'>> = {}
  ): TimelineClip | null => {
    // Validaciones
    if (duration < MIN_CLIP_DURATION) {
      onError(ERROR_MESSAGES.INVALID_DURATION);
      return null;
    }
    
    if (duration > MAX_CLIP_DURATION) {
      onError(ERROR_MESSAGES.MAX_DURATION_EXCEEDED);
      return null;
    }
    
    // Aplicar snap
    const snappedStartTime = findSnapPosition(startTime);
    const endTime = snappedStartTime + duration;
    
    // Verificar superposición
    if (checkOverlap(layerId, snappedStartTime, endTime)) {
      onError(ERROR_MESSAGES.CLIP_OVERLAP);
      return null;
    }
    
    // Crear el clip
    const newClip: TimelineClip = {
      id: generateClipId(),
      type: clipType,
      startTime: snappedStartTime,
      endTime: endTime,
      layerId,
      ...properties
    };
    
    // Actualizar estado
    setClipsByLayer(prev => {
      const layerClips = [...(prev[layerId] || [])];
      layerClips.push(newClip);
      return {
        ...prev,
        [layerId]: layerClips
      };
    });
    
    return newClip;
  }, [generateClipId, checkOverlap, findSnapPosition, onError]);
  
  /**
   * Elimina un clip de la línea de tiempo
   */
  const removeClip = useCallback((clipId: number): boolean => {
    let clipRemoved = false;
    
    setClipsByLayer(prev => {
      const newClipsByLayer = { ...prev };
      
      // Buscar en todas las capas
      for (const layerId in newClipsByLayer) {
        const layerClips = newClipsByLayer[layerId];
        const clipIndex = layerClips.findIndex(clip => clip.id === clipId);
        
        if (clipIndex !== -1) {
          // Eliminar el clip
          const updatedLayerClips = [...layerClips];
          updatedLayerClips.splice(clipIndex, 1);
          newClipsByLayer[layerId] = updatedLayerClips;
          clipRemoved = true;
          break;
        }
      }
      
      return newClipsByLayer;
    });
    
    return clipRemoved;
  }, []);
  
  /**
   * Mueve un clip a una nueva posición temporal
   */
  const moveClip = useCallback((clipId: number, newStartTime: number): boolean => {
    let clipMoved = false;
    let targetClip: TimelineClip | null = null;
    let layerId: number | null = null;
    
    // Encontrar el clip y su capa
    for (const lId in clipsByLayer) {
      const numLayerId = parseInt(lId);
      const clip = clipsByLayer[numLayerId].find(c => c.id === clipId);
      if (clip) {
        targetClip = clip;
        layerId = numLayerId;
        break;
      }
    }
    
    if (!targetClip || layerId === null) {
      onError('Clip no encontrado');
      return false;
    }
    
    // Aplicar snap
    const snappedStartTime = findSnapPosition(newStartTime);
    
    // Calcular nueva posición final
    const duration = targetClip.endTime - targetClip.startTime;
    const newEndTime = snappedStartTime + duration;
    
    // Verificar si la nueva posición es válida
    if (checkOverlap(layerId, snappedStartTime, newEndTime, clipId)) {
      onError(ERROR_MESSAGES.CLIP_OVERLAP);
      return false;
    }
    
    // Actualizar el clip
    setClipsByLayer(prev => {
      const newClipsByLayer = { ...prev };
      const layerClips = [...newClipsByLayer[layerId!]];
      
      const clipIndex = layerClips.findIndex(c => c.id === clipId);
      if (clipIndex !== -1) {
        layerClips[clipIndex] = {
          ...layerClips[clipIndex],
          startTime: snappedStartTime,
          endTime: newEndTime
        };
        
        newClipsByLayer[layerId!] = layerClips;
        clipMoved = true;
      }
      
      return newClipsByLayer;
    });
    
    return clipMoved;
  }, [clipsByLayer, checkOverlap, findSnapPosition, onError]);
  
  /**
   * Redimensiona un clip (por el inicio o el final)
   */
  const resizeClip = useCallback((
    clipId: number, 
    isStart: boolean, 
    newTime: number
  ): boolean => {
    let clipResized = false;
    let targetClip: TimelineClip | null = null;
    let layerId: number | null = null;
    
    // Encontrar el clip y su capa
    for (const lId in clipsByLayer) {
      const numLayerId = parseInt(lId);
      const clip = clipsByLayer[numLayerId].find(c => c.id === clipId);
      if (clip) {
        targetClip = clip;
        layerId = numLayerId;
        break;
      }
    }
    
    if (!targetClip || layerId === null) {
      onError('Clip no encontrado');
      return false;
    }
    
    // Aplicar snap
    const snappedTime = findSnapPosition(newTime);
    
    // Calcular nuevos tiempos
    let newStartTime = targetClip.startTime;
    let newEndTime = targetClip.endTime;
    
    if (isStart) {
      // Redimensionar desde el inicio
      newStartTime = snappedTime;
      
      // Validar duración mínima
      if (newEndTime - newStartTime < MIN_CLIP_DURATION) {
        newStartTime = newEndTime - MIN_CLIP_DURATION;
      }
      
      // Validar duración máxima
      if (newEndTime - newStartTime > MAX_CLIP_DURATION) {
        newStartTime = newEndTime - MAX_CLIP_DURATION;
      }
    } else {
      // Redimensionar desde el final
      newEndTime = snappedTime;
      
      // Validar duración mínima
      if (newEndTime - newStartTime < MIN_CLIP_DURATION) {
        newEndTime = newStartTime + MIN_CLIP_DURATION;
      }
      
      // Validar duración máxima
      if (newEndTime - newStartTime > MAX_CLIP_DURATION) {
        newEndTime = newStartTime + MAX_CLIP_DURATION;
      }
    }
    
    // Verificar superposición
    if (checkOverlap(layerId, newStartTime, newEndTime, clipId)) {
      onError(ERROR_MESSAGES.CLIP_OVERLAP);
      return false;
    }
    
    // Actualizar el clip
    setClipsByLayer(prev => {
      const newClipsByLayer = { ...prev };
      const layerClips = [...newClipsByLayer[layerId!]];
      
      const clipIndex = layerClips.findIndex(c => c.id === clipId);
      if (clipIndex !== -1) {
        layerClips[clipIndex] = {
          ...layerClips[clipIndex],
          startTime: newStartTime,
          endTime: newEndTime
        };
        
        newClipsByLayer[layerId!] = layerClips;
        clipResized = true;
      }
      
      return newClipsByLayer;
    });
    
    return clipResized;
  }, [clipsByLayer, checkOverlap, findSnapPosition, onError]);
  
  /**
   * Divide un clip en dos en un punto específico
   */
  const splitClip = useCallback((clipId: number, splitTime: number): boolean => {
    let clipSplit = false;
    let targetClip: TimelineClip | null = null;
    let layerId: number | null = null;
    
    // Encontrar el clip y su capa
    for (const lId in clipsByLayer) {
      const numLayerId = parseInt(lId);
      const clip = clipsByLayer[numLayerId].find(c => c.id === clipId);
      if (clip) {
        targetClip = clip;
        layerId = numLayerId;
        break;
      }
    }
    
    if (!targetClip || layerId === null) {
      onError('Clip no encontrado');
      return false;
    }
    
    // Validar que el tiempo de división esté dentro del clip
    if (splitTime <= targetClip.startTime || splitTime >= targetClip.endTime) {
      onError('El punto de división debe estar dentro del clip');
      return false;
    }
    
    // Aplicar snap
    const snappedSplitTime = findSnapPosition(splitTime);
    
    // Actualizar el clip y crear uno nuevo
    setClipsByLayer(prev => {
      const newClipsByLayer = { ...prev };
      const layerClips = [...newClipsByLayer[layerId!]];
      
      const clipIndex = layerClips.findIndex(c => c.id === clipId);
      if (clipIndex !== -1) {
        // Acortar el clip original hasta el punto de división
        layerClips[clipIndex] = {
          ...layerClips[clipIndex],
          endTime: snappedSplitTime
        };
        
        // Crear un nuevo clip para la segunda parte
        const secondPart: TimelineClip = {
          ...layerClips[clipIndex],
          id: generateClipId(),
          startTime: snappedSplitTime,
          endTime: targetClip!.endTime
        };
        
        layerClips.push(secondPart);
        newClipsByLayer[layerId!] = layerClips;
        clipSplit = true;
      }
      
      return newClipsByLayer;
    });
    
    return clipSplit;
  }, [clipsByLayer, findSnapPosition, generateClipId, onError]);
  
  /**
   * Combina dos clips adyacentes
   */
  const combineClips = useCallback((clipId1: number, clipId2: number): boolean => {
    let clip1: TimelineClip | null = null;
    let clip2: TimelineClip | null = null;
    let layerId: number | null = null;
    
    // Encontrar ambos clips y verificar que estén en la misma capa
    for (const lId in clipsByLayer) {
      const numLayerId = parseInt(lId);
      const layerClips = clipsByLayer[numLayerId];
      
      const c1 = layerClips.find(c => c.id === clipId1);
      const c2 = layerClips.find(c => c.id === clipId2);
      
      if (c1 && c2) {
        clip1 = c1;
        clip2 = c2;
        layerId = numLayerId;
        break;
      }
    }
    
    if (!clip1 || !clip2 || layerId === null) {
      onError('Uno o ambos clips no encontrados');
      return false;
    }
    
    // Verificar que sean del mismo tipo
    if (clip1.type !== clip2.type) {
      onError('No se pueden combinar clips de diferentes tipos');
      return false;
    }
    
    // Ordenar los clips por tiempo
    if (clip1.startTime > clip2.startTime) {
      const temp = clip1;
      clip1 = clip2;
      clip2 = temp;
    }
    
    // Verificar que sean adyacentes (con un pequeño margen de tolerancia)
    const ADJACENCY_TOLERANCE = 0.1; // segundos
    if (Math.abs(clip1.endTime - clip2.startTime) > ADJACENCY_TOLERANCE) {
      onError('Los clips deben ser adyacentes para combinarlos');
      return false;
    }
    
    // Verificar si la duración resultante es válida
    const combinedDuration = clip2.endTime - clip1.startTime;
    if (combinedDuration > MAX_CLIP_DURATION) {
      onError(ERROR_MESSAGES.MAX_DURATION_EXCEEDED);
      return false;
    }
    
    // Combinar los clips
    setClipsByLayer(prev => {
      const newClipsByLayer = { ...prev };
      const layerClips = [...newClipsByLayer[layerId!]];
      
      const clip1Index = layerClips.findIndex(c => c.id === clip1!.id);
      const clip2Index = layerClips.findIndex(c => c.id === clip2!.id);
      
      if (clip1Index !== -1 && clip2Index !== -1) {
        // Crear un clip combinado con las propiedades del primer clip
        const combinedClip: TimelineClip = {
          ...clip1!,
          endTime: clip2!.endTime
        };
        
        // Reemplazar el primer clip con el combinado y eliminar el segundo
        layerClips[clip1Index] = combinedClip;
        layerClips.splice(clip2Index, 1);
        
        newClipsByLayer[layerId!] = layerClips;
      }
      
      return newClipsByLayer;
    });
    
    return true;
  }, [clipsByLayer, onError]);
  
  /**
   * Corta un clip eliminándolo del timeline
   * A diferencia de removeClip, esta operación está diseñada para ser
   * utilizada específicamente con la interfaz de usuario de edición
   */
  const cutClip = useCallback((clipId: number): boolean => {
    // Simplemente delegamos al método removeClip, pero mantenemos
    // una función separada para claridad semántica en la interfaz
    return removeClip(clipId);
  }, [removeClip]);

  /**
   * Duplica un clip
   */
  const duplicateClip = useCallback((clipId: number, offsetTime: number = 0): TimelineClip | null => {
    let targetClip: TimelineClip | null = null;
    let layerId: number | null = null;
    
    // Encontrar el clip y su capa
    for (const lId in clipsByLayer) {
      const numLayerId = parseInt(lId);
      const clip = clipsByLayer[numLayerId].find(c => c.id === clipId);
      if (clip) {
        targetClip = { ...clip };
        layerId = numLayerId;
        break;
      }
    }
    
    if (!targetClip || layerId === null) {
      onError('Clip no encontrado');
      return null;
    }
    
    // Calcular los nuevos tiempos para el duplicado
    const duration = targetClip.endTime - targetClip.startTime;
    const newStartTime = offsetTime > 0 
      ? targetClip.startTime + offsetTime 
      : targetClip.endTime + 0.1; // Si no se especifica offset, colocar justo después
    
    // Crear un duplicado 
    return addClip(
      layerId,
      targetClip.type as ClipType,
      newStartTime,
      duration,
      // Filtrar las propiedades específicas de TimelineClip
      Object.entries(targetClip)
        .filter(([key]) => !['id', 'type', 'startTime', 'endTime', 'layerId'].includes(key))
        .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {})
    );
  }, [clipsByLayer, addClip, onError]);
  
  /**
   * Cambia un clip de capa
   */
  const changeClipLayer = useCallback((clipId: number, newLayerId: number): boolean => {
    let targetClip: TimelineClip | null = null;
    let currentLayerId: number | null = null;
    
    // Encontrar el clip y su capa
    for (const lId in clipsByLayer) {
      const numLayerId = parseInt(lId);
      const clip = clipsByLayer[numLayerId].find(c => c.id === clipId);
      if (clip) {
        targetClip = clip;
        currentLayerId = numLayerId;
        break;
      }
    }
    
    if (!targetClip || currentLayerId === null) {
      onError('Clip no encontrado');
      return false;
    }
    
    // No hacer nada si es la misma capa
    if (currentLayerId === newLayerId) {
      return true;
    }
    
    // Verificar superposición en la nueva capa
    if (checkOverlap(newLayerId, targetClip.startTime, targetClip.endTime)) {
      onError(ERROR_MESSAGES.CLIP_OVERLAP);
      return false;
    }
    
    // Mover el clip a la nueva capa
    setClipsByLayer(prev => {
      const newClipsByLayer = { ...prev };
      
      // Eliminar de la capa actual
      const currentLayerClips = [...(newClipsByLayer[currentLayerId!] || [])];
      const clipIndex = currentLayerClips.findIndex(c => c.id === clipId);
      if (clipIndex !== -1) {
        currentLayerClips.splice(clipIndex, 1);
        newClipsByLayer[currentLayerId!] = currentLayerClips;
        
        // Añadir a la nueva capa
        const newLayerClips = [...(newClipsByLayer[newLayerId] || [])];
        const movedClip = { ...targetClip!, layerId: newLayerId };
        newLayerClips.push(movedClip);
        newClipsByLayer[newLayerId] = newLayerClips;
      }
      
      return newClipsByLayer;
    });
    
    return true;
  }, [clipsByLayer, checkOverlap, onError]);
  
  /**
   * Obtiene todos los clips en una capa específica
   */
  const getClipsInLayer = useCallback((layerId: number): TimelineClip[] => {
    return clipsByLayer[layerId] || [];
  }, [clipsByLayer]);
  
  /**
   * Obtiene un clip por su ID
   */
  const getClipById = useCallback((clipId: number): TimelineClip | null => {
    for (const layerId in clipsByLayer) {
      const clip = clipsByLayer[layerId].find(c => c.id === clipId);
      if (clip) {
        return clip;
      }
    }
    return null;
  }, [clipsByLayer]);
  
  /**
   * Obtiene todos los clips en todas las capas
   */
  const getAllClips = useCallback((): TimelineClip[] => {
    return Object.values(clipsByLayer).flat();
  }, [clipsByLayer]);
  
  /**
   * Encuentra clips que coincidan con un rango de tiempo
   */
  const findClipsInTimeRange = useCallback((startTime: number, endTime: number): TimelineClip[] => {
    const results: TimelineClip[] = [];
    
    for (const layerId in clipsByLayer) {
      clipsByLayer[layerId].forEach(clip => {
        // Un clip está en el rango si alguna parte del clip está dentro del rango
        if (
          (clip.startTime <= endTime && clip.endTime >= startTime)
        ) {
          results.push(clip);
        }
      });
    }
    
    return results;
  }, [clipsByLayer]);
  
  /**
   * Borra todos los clips
   */
  const clearAllClips = useCallback(() => {
    setClipsByLayer({});
    setLastClipId(0);
  }, []);
  
  /**
   * Importa clips desde un formato externo
   */
  const importClips = useCallback((importedClips: TimelineClip[]) => {
    // Encontrar el ID más alto para continuar desde ahí
    let highestId = lastClipId;
    
    importedClips.forEach(clip => {
      if (clip.id > highestId) {
        highestId = clip.id;
      }
    });
    
    // Actualizar el último ID
    setLastClipId(highestId);
    
    // Organizar clips por capa
    const newClipsByLayer: { [layerId: number]: TimelineClip[] } = { ...clipsByLayer };
    
    importedClips.forEach(clip => {
      if (!newClipsByLayer[clip.layerId]) {
        newClipsByLayer[clip.layerId] = [];
      }
      
      newClipsByLayer[clip.layerId].push({
        ...clip,
        // Asegurar que tenga las propiedades necesarias
        startTime: clip.startTime || 0,
        endTime: clip.endTime || 0
      });
    });
    
    setClipsByLayer(newClipsByLayer);
  }, [clipsByLayer, lastClipId]);
  
  // Aprovechar las capacidades de useClipInteractions
  const [selectedClipId, setSelectedClipId] = useState<number | null>(null);
  
  // Conector para que useClipOperations utilice las funciones de useClipInteractions
  const {
    operation,
    getClipMouseHandlers,
    getClipCursorStyle,
    selectClip,
    deselectClip,
    handleAddClip,
    handleDeleteClip,
    handleMoveClip,
    handleResizeClip,
    handleSplitClip,
    handleDuplicateClip
  } = clipInteractions;
  
  // Función para combinar multiple selección con las operaciones de clips
  const handleBatchOperation = useCallback((operation: ClipOperation, clipIds: number[]) => {
    // Implementar operaciones en lote según sea necesario
    switch (operation) {
      case ClipOperation.CUT:
        clipIds.forEach(id => handleDeleteClip(id));
        return true;
      default:
        return false;
    }
  }, [handleDeleteClip]);
  
  // Objeto con todas las funciones que exponemos al componente
  return {
    // Estado de clips
    clips,
    clipsByLayer,
    selectedClipId,
    
    // Operaciones básicas de clips
    addClip: handleAddClip,
    removeClip: handleDeleteClip,
    moveClip: handleMoveClip,
    resizeClip: handleResizeClip,
    splitClip: handleSplitClip,
    combineClips,
    duplicateClip: handleDuplicateClip,
    cutClip: handleDeleteClip,
    changeClipLayer,
    clearAllClips,
    importClips,
    
    // Operaciones de selección y manipulación
    selectClip,
    deselectClip,
    
    // Helpers para interactividad
    getClipMouseHandlers,
    getClipCursorStyle,
    currentOperation: operation,
    isClipSelected: (clipId: number) => selectedClipId === clipId,
    
    // Operaciones avanzadas
    handleBatchOperation,
    
    // Acceso a clips
    getClipsInLayer,
    getClipById,
    getAllClips,
    findClipsInTimeRange,
    
    // Utilidades
    findSnapPosition,
    
    // Estado
  };
}