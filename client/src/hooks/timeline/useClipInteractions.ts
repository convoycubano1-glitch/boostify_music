import { useRef, useState, useCallback, useEffect } from 'react';
import { 
  ClipOperation, 
  CLIP_HANDLE_WIDTH, 
  ClipType,
  LAYER_TYPES,
  PIXELS_PER_SECOND
} from '../../constants/timeline-constants';
import { TimelineClip } from '../../components/music-video/timeline/TimelineEditor';

/**
 * Opciones para configurar las interacciones con clips
 */
export interface ClipInteractionsOptions {
  /**
   * Lista de clips del timeline
   */
  clips: TimelineClip[];
  
  /**
   * Función para actualizar los clips
   */
  setClips: React.Dispatch<React.SetStateAction<TimelineClip[]>>;
  
  /**
   * ID del clip seleccionado
   */
  selectedClip: number | null;
  
  /**
   * Función para establecer el clip seleccionado
   */
  setSelectedClip: React.Dispatch<React.SetStateAction<number | null>>;
  
  /**
   * Función que se llama cuando se cambian los clips
   */
  onClipsChange?: (clips: TimelineClip[]) => void;
  
  /**
   * Función que se llama cuando un clip se mueve
   */
  onMoveClip?: (clipId: number, newStartTime: number) => void;
  
  /**
   * Función que se llama cuando se redimensiona un clip
   */
  onResizeClip?: (clipId: number, isStart: boolean, newTime: number) => void;
  
  /**
   * Función que se llama cuando se selecciona un clip
   */
  onSelectClip?: (clipId: number) => void;
  
  /**
   * Función que se llama cuando se inicia una operación de clip
   */
  onOperationStart?: (operation: ClipOperation, clipId: number) => void;
  
  /**
   * Función que se llama cuando finaliza una operación de clip
   */
  onOperationEnd?: (operation: ClipOperation, clipId: number) => void;
  
  /**
   * Función para convertir píxeles a segundos según el zoom actual
   */
  pixelsToSeconds?: (pixels: number) => number;
  
  /**
   * Función para convertir segundos a píxeles según el zoom actual
   */
  secondsToPixels?: (seconds: number) => number;
  
  /**
   * Ancho del controlador de redimensionamiento en píxeles
   */
  handleWidth?: number;
}

/**
 * Hook para manejar las interacciones del usuario con los clips en el timeline
 * 
 * Este hook maneja:
 * - Selección de clips
 * - Arrastrar clips para moverlos
 * - Redimensionar clips desde el inicio o final
 * - Operaciones de movimiento de ratón y eventos táctiles
 */
export function useClipInteractions({
  clips,
  setClips,
  selectedClip,
  setSelectedClip,
  onClipsChange,
  onMoveClip,
  onResizeClip,
  onSelectClip,
  onOperationStart,
  onOperationEnd,
  pixelsToSeconds = (px) => px / PIXELS_PER_SECOND,
  secondsToPixels = (sec) => sec * PIXELS_PER_SECOND,
  handleWidth = CLIP_HANDLE_WIDTH
}: ClipInteractionsOptions) {
  // Estado para la operación actual y el clip seleccionado
  const [operation, setOperation] = useState<ClipOperation>(ClipOperation.NONE);
  const [selectedClipId, setSelectedClipId] = useState<number | null>(selectedClip);
  
  // Refs para guardar la posición inicial y el desplazamiento
  const offsetXRef = useRef<number>(0);
  const startXRef = useRef<number>(0);
  const activeClipIdRef = useRef<number | null>(null);

  // Mantener sincronizado selectedClipId con el prop selectedClip
  useEffect(() => {
    setSelectedClipId(selectedClip);
  }, [selectedClip]);
  
  /**
   * Inicia una operación de mover clip
   */
  const startMoveOperation = useCallback((clipId: number, clientX: number, currentStartTime: number) => {
    setOperation(ClipOperation.MOVE);
    activeClipIdRef.current = clipId;
    startXRef.current = clientX;
    offsetXRef.current = secondsToPixels(currentStartTime);
    
    if (onOperationStart) {
      onOperationStart(ClipOperation.MOVE, clipId);
    }
  }, [onOperationStart, secondsToPixels]);
  
  /**
   * Inicia una operación de redimensionar clip desde el inicio
   */
  const startResizeStartOperation = useCallback((clipId: number, clientX: number, currentStartTime: number) => {
    setOperation(ClipOperation.RESIZE_START);
    activeClipIdRef.current = clipId;
    startXRef.current = clientX;
    offsetXRef.current = secondsToPixels(currentStartTime);
    
    if (onOperationStart) {
      onOperationStart(ClipOperation.RESIZE_START, clipId);
    }
  }, [onOperationStart, secondsToPixels]);
  
  /**
   * Inicia una operación de redimensionar clip desde el final
   */
  const startResizeEndOperation = useCallback((clipId: number, clientX: number, currentEndTime: number) => {
    setOperation(ClipOperation.RESIZE_END);
    activeClipIdRef.current = clipId;
    startXRef.current = clientX;
    offsetXRef.current = secondsToPixels(currentEndTime);
    
    if (onOperationStart) {
      onOperationStart(ClipOperation.RESIZE_END, clipId);
    }
  }, [onOperationStart, secondsToPixels]);
  
  /**
   * Maneja el movimiento durante una operación activa
   */
  const handleMouseMove = useCallback((clientX: number) => {
    if (operation === ClipOperation.NONE || activeClipIdRef.current === null) {
      return;
    }
    
    const deltaX = clientX - startXRef.current;
    const newPositionPx = offsetXRef.current + deltaX;
    const newPositionSec = pixelsToSeconds(newPositionPx);
    
    switch (operation) {
      case ClipOperation.MOVE:
        if (onMoveClip) {
          onMoveClip(activeClipIdRef.current, newPositionSec);
        }
        break;
        
      case ClipOperation.RESIZE_START:
        if (onResizeClip) {
          onResizeClip(activeClipIdRef.current, true, newPositionSec);
        }
        break;
        
      case ClipOperation.RESIZE_END:
        if (onResizeClip) {
          onResizeClip(activeClipIdRef.current, false, newPositionSec);
        }
        break;
    }
  }, [operation, onMoveClip, onResizeClip, pixelsToSeconds]);
  
  /**
   * Finaliza cualquier operación activa
   */
  const endOperation = useCallback(() => {
    if (operation !== ClipOperation.NONE && activeClipIdRef.current !== null) {
      if (onOperationEnd) {
        onOperationEnd(operation, activeClipIdRef.current);
      }
      
      // Restablecer el estado
      setOperation(ClipOperation.NONE);
      activeClipIdRef.current = null;
    }
  }, [operation, onOperationEnd]);
  
  /**
   * Selecciona un clip
   */
  const selectClip = useCallback((clipId: number) => {
    setSelectedClipId(clipId);
    if (onSelectClip) {
      onSelectClip(clipId);
    }
  }, [onSelectClip]);
  
  /**
   * Deselecciona el clip actual
   */
  const deselectClip = useCallback(() => {
    setSelectedClipId(null);
  }, []);
  
  /**
   * Maneja los eventos de ratón para un clip
   */
  const getClipMouseHandlers = useCallback((
    clipId: number, 
    startTime: number, 
    endTime: number
  ) => {
    return {
      onClick: (e: React.MouseEvent) => {
        // Si no estamos en una operación, seleccionar el clip
        if (operation === ClipOperation.NONE) {
          e.stopPropagation();
          selectClip(clipId);
        }
      },
      onMouseDown: (e: React.MouseEvent) => {
        e.stopPropagation();
        
        // Obtener la posición relativa del cursor dentro del clip
        const clipElement = e.currentTarget as HTMLElement;
        const clipRect = clipElement.getBoundingClientRect();
        const relativeX = e.clientX - clipRect.left;
        
        // Determinar la operación según la posición del cursor
        if (relativeX <= handleWidth) {
          // Cerca del borde izquierdo - redimensionar desde el inicio
          startResizeStartOperation(clipId, e.clientX, startTime);
        } else if (relativeX >= clipRect.width - handleWidth) {
          // Cerca del borde derecho - redimensionar desde el final
          startResizeEndOperation(clipId, e.clientX, endTime);
        } else {
          // En el medio - mover
          startMoveOperation(clipId, e.clientX, startTime);
        }
        
        // Seleccionar el clip
        selectClip(clipId);
      }
    };
  }, [
    operation, 
    selectClip, 
    startMoveOperation, 
    startResizeEndOperation, 
    startResizeStartOperation, 
    handleWidth
  ]);
  
  /**
   * Configura los event listeners globales
   */
  useEffect(() => {
    // Manejador para movimiento del ratón
    const handleGlobalMouseMove = (e: MouseEvent) => {
      handleMouseMove(e.clientX);
    };
    
    // Manejador para soltar el botón del ratón
    const handleGlobalMouseUp = () => {
      endOperation();
    };
    
    // Manejador para clics fuera de los clips
    const handleGlobalClick = (e: MouseEvent) => {
      // Verificar si el clic fue directamente en el timeline (no en un clip)
      const clickedOnClip = (e.target as HTMLElement)?.closest('.timeline-clip');
      if (!clickedOnClip) {
        deselectClip();
      }
    };
    
    // Añadir event listeners
    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
    document.addEventListener('click', handleGlobalClick);
    
    // Limpiar event listeners al desmontar
    return () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [handleMouseMove, endOperation, deselectClip]);
  
  /**
   * Obtiene el estilo del cursor según la operación y posición
   */
  const getClipCursorStyle = useCallback((e: React.MouseEvent) => {
    // Si hay una operación activa, no cambiar el cursor
    if (operation !== ClipOperation.NONE) {
      return;
    }
    
    // Obtener la posición relativa del cursor dentro del clip
    const clipElement = e.currentTarget as HTMLElement;
    const clipRect = clipElement.getBoundingClientRect();
    const relativeX = e.clientX - clipRect.left;
    
    if (relativeX <= handleWidth) {
      return 'ew-resize'; // Redimensionar desde el inicio
    } else if (relativeX >= clipRect.width - handleWidth) {
      return 'ew-resize'; // Redimensionar desde el final
    } else {
      return 'move'; // Mover
    }
  }, [operation, handleWidth]);
  
  /**
   * Añade un nuevo clip a la línea de tiempo
   */
  const handleAddClip = useCallback((clipData: Partial<TimelineClip>) => {
    // Generar un ID único para el nuevo clip
    const newId = Math.max(0, ...clips.map(clip => clip.id)) + 1;
    
    // Crear el nuevo clip con valores predeterminados y los proporcionados
    const newClip: TimelineClip = {
      id: newId,
      type: clipData.type || ClipType.VIDEO,
      layerIndex: clipData.layerIndex || 0,
      startTime: clipData.startTime || 0,
      duration: clipData.duration || 5,
      url: clipData.url || '',
      ...clipData
    };
    
    // Añadir el nuevo clip a la lista
    const updatedClips = [...clips, newClip];
    setClips(updatedClips);
    
    // Establecer el nuevo clip como el seleccionado
    setSelectedClip(newId);
    
    // Notificar cambios en los clips
    if (onClipsChange) {
      onClipsChange(updatedClips);
    }
    
    return newId;
  }, [clips, setClips, setSelectedClip, onClipsChange]);
  
  /**
   * Elimina un clip de la línea de tiempo
   */
  const handleDeleteClip = useCallback((clipId: number) => {
    const clipIndex = clips.findIndex(clip => clip.id === clipId);
    
    if (clipIndex === -1) {
      return false;
    }
    
    // Crear una nueva lista de clips sin el clip a eliminar
    const updatedClips = clips.filter(clip => clip.id !== clipId);
    setClips(updatedClips);
    
    // Si el clip eliminado era el seleccionado, deseleccionar
    if (selectedClip === clipId) {
      setSelectedClip(null);
    }
    
    // Notificar cambios en los clips
    if (onClipsChange) {
      onClipsChange(updatedClips);
    }
    
    return true;
  }, [clips, setClips, selectedClip, setSelectedClip, onClipsChange]);
  
  /**
   * Mueve un clip a una nueva posición en la línea de tiempo
   */
  const handleMoveClip = useCallback((clipId: number, newStartTime: number) => {
    const clipIndex = clips.findIndex(clip => clip.id === clipId);
    
    if (clipIndex === -1) {
      return false;
    }
    
    // Asegurar que el tiempo de inicio no sea negativo
    const startTime = Math.max(0, newStartTime);
    
    // Actualizar la posición del clip
    const updatedClips = [...clips];
    updatedClips[clipIndex] = {
      ...updatedClips[clipIndex],
      startTime
    };
    
    setClips(updatedClips);
    
    // Notificar cambios en los clips
    if (onClipsChange) {
      onClipsChange(updatedClips);
    }
    
    return true;
  }, [clips, setClips, onClipsChange]);
  
  /**
   * Redimensiona un clip cambiando su duración o posición inicial
   */
  const handleResizeClip = useCallback((clipId: number, isStart: boolean, newTime: number) => {
    const clipIndex = clips.findIndex(clip => clip.id === clipId);
    
    if (clipIndex === -1) {
      return false;
    }
    
    const clip = clips[clipIndex];
    let updatedClip = { ...clip };
    
    if (isStart) {
      // Redimensionar desde el inicio
      const newStartTime = Math.max(0, newTime);
      const newDuration = Math.max(0.1, clip.startTime + clip.duration - newStartTime);
      
      updatedClip = {
        ...updatedClip,
        startTime: newStartTime,
        duration: newDuration
      };
    } else {
      // Redimensionar desde el final
      const endTime = Math.max(clip.startTime + 0.1, newTime);
      updatedClip = {
        ...updatedClip,
        duration: endTime - clip.startTime
      };
    }
    
    // Actualizar el clip en la lista
    const updatedClips = [...clips];
    updatedClips[clipIndex] = updatedClip;
    
    setClips(updatedClips);
    
    // Notificar cambios en los clips
    if (onClipsChange) {
      onClipsChange(updatedClips);
    }
    
    return true;
  }, [clips, setClips, onClipsChange]);
  
  /**
   * Divide un clip en dos en un punto específico
   */
  const handleSplitClip = useCallback((clipId: number, splitTime: number) => {
    const clipIndex = clips.findIndex(clip => clip.id === clipId);
    
    if (clipIndex === -1) {
      return false;
    }
    
    const clip = clips[clipIndex];
    
    // Verificar que el punto de división esté dentro del clip
    if (splitTime <= clip.startTime || splitTime >= clip.startTime + clip.duration) {
      return false;
    }
    
    // Calcular la duración de ambas partes
    const firstPartDuration = splitTime - clip.startTime;
    const secondPartDuration = clip.duration - firstPartDuration;
    
    // Actualizar el clip original (primera parte)
    const updatedClip = {
      ...clip,
      duration: firstPartDuration
    };
    
    // Crear el nuevo clip (segunda parte)
    const newId = Math.max(0, ...clips.map(c => c.id)) + 1;
    const newClip = {
      ...clip,
      id: newId,
      startTime: splitTime,
      duration: secondPartDuration
    };
    
    // Actualizar la lista de clips
    const updatedClips = [...clips];
    updatedClips[clipIndex] = updatedClip;
    updatedClips.push(newClip);
    
    setClips(updatedClips);
    
    // Establecer el nuevo clip como el seleccionado
    setSelectedClip(newId);
    
    // Notificar cambios en los clips
    if (onClipsChange) {
      onClipsChange(updatedClips);
    }
    
    return newId;
  }, [clips, setClips, setSelectedClip, onClipsChange]);
  
  /**
   * Duplica un clip existente
   */
  const handleDuplicateClip = useCallback((clipId: number) => {
    const clipIndex = clips.findIndex(clip => clip.id === clipId);
    
    if (clipIndex === -1) {
      return false;
    }
    
    const clip = clips[clipIndex];
    
    // Crear un nuevo ID para el clip duplicado
    const newId = Math.max(0, ...clips.map(c => c.id)) + 1;
    
    // Crear el clip duplicado, colocándolo justo después del original
    const duplicatedClip = {
      ...clip,
      id: newId,
      startTime: clip.startTime + clip.duration + 0.1
    };
    
    // Actualizar la lista de clips
    const updatedClips = [...clips, duplicatedClip];
    setClips(updatedClips);
    
    // Establecer el clip duplicado como el seleccionado
    setSelectedClip(newId);
    
    // Notificar cambios en los clips
    if (onClipsChange) {
      onClipsChange(updatedClips);
    }
    
    return newId;
  }, [clips, setClips, setSelectedClip, onClipsChange]);
  
  /**
   * Maneja operaciones especiales en los clips (split, duplicate, etc.)
   */
  const handleClipOperation = useCallback((operation: ClipOperation, clipId: number, params?: any) => {
    switch (operation) {
      case ClipOperation.SPLIT:
        return handleSplitClip(clipId, params?.splitTime ?? (clips.find(c => c.id === clipId)?.startTime ?? 0) + (clips.find(c => c.id === clipId)?.duration ?? 0) / 2);
        
      case ClipOperation.DUPLICATE:
        return handleDuplicateClip(clipId);
        
      case ClipOperation.CUT:
        return handleDeleteClip(clipId);
        
      case ClipOperation.MOVE:
        return handleMoveClip(clipId, params?.newStartTime ?? 0);
        
      case ClipOperation.RESIZE_START:
      case ClipOperation.RESIZE_END:
        return handleResizeClip(clipId, operation === ClipOperation.RESIZE_START, params?.newTime ?? 0);
        
      default:
        return false;
    }
  }, [handleSplitClip, handleDuplicateClip, handleDeleteClip, handleMoveClip, handleResizeClip, clips]);
  
  // Exponer todas las funciones y estados necesarios
  return {
    operation,
    selectedClipId,
    activeClipId: activeClipIdRef.current,
    getClipMouseHandlers,
    getClipCursorStyle,
    selectClip,
    deselectClip,
    isSelected: (clipId: number) => selectedClipId === clipId,
    handleMouseMove,
    endOperation,
    handleAddClip,
    handleDeleteClip,
    handleMoveClip,
    handleResizeClip,
    handleSplitClip,
    handleDuplicateClip,
    handleClipOperation
  };
}