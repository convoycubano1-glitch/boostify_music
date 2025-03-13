import { useState, useCallback, useMemo } from 'react';

// Tipos de capas disponibles
export enum LayerType {
  AUDIO = 0,      // Clips de audio (música, voces, efectos sonoros)
  VIDEO_IMAGE = 1, // Clips de video e imágenes
  TEXT = 2,       // Textos y títulos
  EFFECTS = 3     // Efectos visuales y transiciones
}

// Configuración de una capa
export interface LayerConfig {
  /**
   * ID único de la capa
   */
  id: number;
  
  /**
   * Nombre descriptivo de la capa
   */
  name: string;
  
  /**
   * Tipo de capa (audio, video, texto, efectos)
   */
  type: LayerType | string;
  
  /**
   * Si la capa está bloqueada para edición
   */
  locked: boolean;
  
  /**
   * Si la capa está visible
   */
  visible: boolean;
  
  /**
   * Color asociado con la capa (opcional)
   */
  color?: string;
  
  /**
   * Altura en píxeles de la capa
   */
  height: number;
  
  /**
   * Si la capa está aislada (no se puede modificar ni eliminar)
   * La capa de audio (0) debe estar siempre aislada
   */
  isIsolated?: boolean;
  
  /**
   * Si la capa es para contenido generado por AI (placeholders)
   */
  isPlaceholder?: boolean;
  
  /**
   * Metadatos adicionales específicos para cada tipo de capa
   */
  metadata?: Record<string, any>;
}

interface TimelineLayersOptions {
  /**
   * Callback cuando cambia una capa
   */
  onLayerChange?: (layers: LayerConfig[]) => void;
  
  /**
   * Altura predeterminada de las capas
   */
  defaultLayerHeight?: number;
}

/**
 * Hook para gestionar las capas del timeline
 * 
 * Permite:
 * - Crear capas de diferentes tipos (audio, video, texto, efectos)
 * - Reordenar capas
 * - Cambiar visibilidad y bloqueo de capas
 * - Eliminar capas
 * - Gestionar capas aisladas y placeholder
 */
export function useTimelineLayers({
  onLayerChange,
  defaultLayerHeight = 50
}: TimelineLayersOptions = {}) {
  // Estado para las capas
  const [layers, setLayers] = useState<LayerConfig[]>([
    // Capa de audio (siempre presente en la posición más baja)
    // Esta capa debe estar aislada y nunca puede eliminarse
    {
      id: LayerType.AUDIO,
      name: 'Audio',
      type: LayerType.AUDIO,
      locked: true, // Capa de audio bloqueada por defecto
      visible: true,
      height: defaultLayerHeight,
      color: '#f97316', // Naranja
      isIsolated: true, // Capa aislada para protección
    },
    // Capa de video/imagen (siempre presente arriba del audio)
    {
      id: LayerType.VIDEO_IMAGE,
      name: 'Video/Imagen',
      type: LayerType.VIDEO_IMAGE,
      locked: false,
      visible: true,
      height: defaultLayerHeight,
      color: '#4f46e5', // Índigo
      isPlaceholder: true, // Capa que contiene placeholders para IA
    },
    // Capa de texto
    {
      id: LayerType.TEXT,
      name: 'Texto',
      type: LayerType.TEXT,
      locked: false,
      visible: true,
      height: defaultLayerHeight * 0.8, // Altura reducida para texto
      color: '#8b5cf6', // Violeta
    },
    // Capa de efectos
    {
      id: LayerType.EFFECTS,
      name: 'Efectos',
      type: LayerType.EFFECTS,
      locked: false,
      visible: true,
      height: defaultLayerHeight * 0.8, // Altura reducida para efectos
      color: '#10b981', // Esmeralda
    }
  ]);
  
  // Estado para capas visibles
  const [visibleLayers, setVisibleLayers] = useState<number[]>([0, 1, 2, 3]);
  
  // Estado para capas bloqueadas (capa 0 siempre bloqueada)
  const [lockedLayers, setLockedLayers] = useState<number[]>([0]);
  
  /**
   * Añade una nueva capa de un tipo específico
   */
  const addLayer = useCallback((type: LayerType | string, name?: string, metadata?: Record<string, any>) => {
    const newLayer: LayerConfig = {
      id: Date.now(), // ID único basado en timestamp
      name: name || getDefaultLayerName(type),
      type,
      locked: false,
      visible: true,
      height: defaultLayerHeight,
      color: getLayerColorByType(type),
      metadata
    };
    
    setLayers(prevLayers => {
      const updatedLayers = [...prevLayers, newLayer];
      
      if (onLayerChange) {
        onLayerChange(updatedLayers);
      }
      
      return updatedLayers;
    });
    
    // Añadir la nueva capa a las capas visibles
    setVisibleLayers(prev => [...prev, newLayer.id]);
    
    return newLayer.id;
  }, [defaultLayerHeight, onLayerChange]);
  
  /**
   * Elimina una capa por su ID
   * No permite eliminar capas aisladas (como la capa de audio)
   */
  const removeLayer = useCallback((layerId: number) => {
    // Verificar si la capa existe y no está aislada
    const layerToRemove = layers.find(layer => layer.id === layerId);
    
    if (!layerToRemove || layerToRemove.isIsolated) {
      return false; // No se puede eliminar una capa aislada
    }
    
    setLayers(prevLayers => {
      const updatedLayers = prevLayers.filter(layer => layer.id !== layerId);
      
      if (onLayerChange) {
        onLayerChange(updatedLayers);
      }
      
      return updatedLayers;
    });
    
    // Eliminar de las listas de visibilidad y bloqueo
    setVisibleLayers(prev => prev.filter(id => id !== layerId));
    setLockedLayers(prev => prev.filter(id => id !== layerId));
    
    return true;
  }, [layers, onLayerChange]);
  
  /**
   * Actualiza propiedades de una capa
   */
  const updateLayer = useCallback((layerId: number, updates: Partial<LayerConfig>) => {
    // No permitir cambios en el estado de aislamiento
    if ('isIsolated' in updates) {
      const layer = layers.find(l => l.id === layerId);
      if (layer?.isIsolated) {
        delete updates.isIsolated;
      }
    }
    
    setLayers(prevLayers => {
      const updatedLayers = prevLayers.map(layer => 
        layer.id === layerId ? { ...layer, ...updates } : layer
      );
      
      if (onLayerChange) {
        onLayerChange(updatedLayers);
      }
      
      return updatedLayers;
    });
  }, [layers, onLayerChange]);
  
  /**
   * Cambia la visibilidad de una capa
   */
  const toggleLayerVisibility = useCallback((layerId: number) => {
    setVisibleLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(id => id !== layerId);
      } else {
        return [...prev, layerId];
      }
    });
  }, []);
  
  /**
   * Cambia el estado de bloqueo de una capa
   * No permite desbloquear capas aisladas
   */
  const toggleLayerLock = useCallback((layerId: number) => {
    // Verificar si la capa está aislada
    const layer = layers.find(l => l.id === layerId);
    if (layer?.isIsolated) return; // No permitir cambios en capas aisladas
    
    setLockedLayers(prev => {
      if (prev.includes(layerId)) {
        return prev.filter(id => id !== layerId);
      } else {
        return [...prev, layerId];
      }
    });
  }, [layers]);
  
  /**
   * Cambia la altura de una capa
   */
  const resizeLayer = useCallback((layerId: number, newHeight: number) => {
    updateLayer(layerId, { height: Math.max(20, newHeight) });
  }, [updateLayer]);
  
  /**
   * Mueve una capa hacia arriba en el orden Z
   */
  const moveLayerUp = useCallback((layerId: number) => {
    setLayers(prevLayers => {
      const index = prevLayers.findIndex(layer => layer.id === layerId);
      
      // Si es la capa superior o no se encuentra, no hacer nada
      if (index <= 0 || index === prevLayers.length - 1) return prevLayers;
      
      // Crear un nuevo array con las capas intercambiadas
      const updatedLayers = [...prevLayers];
      [updatedLayers[index], updatedLayers[index + 1]] = [updatedLayers[index + 1], updatedLayers[index]];
      
      if (onLayerChange) {
        onLayerChange(updatedLayers);
      }
      
      return updatedLayers;
    });
  }, [onLayerChange]);
  
  /**
   * Mueve una capa hacia abajo en el orden Z
   */
  const moveLayerDown = useCallback((layerId: number) => {
    setLayers(prevLayers => {
      const index = prevLayers.findIndex(layer => layer.id === layerId);
      
      // Si es la capa inferior, es la capa 0 (audio) o no se encuentra, no hacer nada
      // La capa 0 (audio) siempre debe estar en la posición más baja
      if (index <= 0 || index === prevLayers.length - 1 || layerId === 0) return prevLayers;
      
      // Crear un nuevo array con las capas intercambiadas
      const updatedLayers = [...prevLayers];
      [updatedLayers[index], updatedLayers[index - 1]] = [updatedLayers[index - 1], updatedLayers[index]];
      
      if (onLayerChange) {
        onLayerChange(updatedLayers);
      }
      
      return updatedLayers;
    });
  }, [onLayerChange]);
  
  /**
   * Reinicia las capas a su estado predeterminado
   */
  const resetLayers = useCallback(() => {
    const defaultLayers = [
      {
        id: LayerType.AUDIO,
        name: 'Audio',
        type: LayerType.AUDIO,
        locked: true,
        visible: true,
        height: defaultLayerHeight,
        color: '#f97316', // Naranja
        isIsolated: true,
      },
      {
        id: LayerType.VIDEO_IMAGE,
        name: 'Video/Imagen',
        type: LayerType.VIDEO_IMAGE,
        locked: false,
        visible: true,
        height: defaultLayerHeight,
        color: '#4f46e5', // Índigo
        isPlaceholder: true,
      },
      {
        id: LayerType.TEXT,
        name: 'Texto',
        type: LayerType.TEXT,
        locked: false,
        visible: true,
        height: defaultLayerHeight * 0.8,
        color: '#8b5cf6', // Violeta
      },
      {
        id: LayerType.EFFECTS,
        name: 'Efectos',
        type: LayerType.EFFECTS,
        locked: false,
        visible: true,
        height: defaultLayerHeight * 0.8,
        color: '#10b981', // Esmeralda
      }
    ];
    
    setLayers(defaultLayers);
    setVisibleLayers([0, 1, 2, 3]);
    setLockedLayers([0]);
    
    if (onLayerChange) {
      onLayerChange(defaultLayers);
    }
  }, [defaultLayerHeight, onLayerChange]);
  
  /**
   * Obtiene una capa por ID
   */
  const getLayerById = useCallback((layerId: number) => {
    return layers.find(layer => layer.id === layerId) || null;
  }, [layers]);
  
  /**
   * Verifica si una capa está bloqueada
   */
  const isLayerLocked = useCallback((layerId: number) => {
    const layer = getLayerById(layerId);
    return (layer ? layer.locked || lockedLayers.includes(layerId) : false);
  }, [getLayerById, lockedLayers]);
  
  /**
   * Verifica si una capa está visible
   */
  const isLayerVisible = useCallback((layerId: number) => {
    const layer = getLayerById(layerId);
    return (layer ? layer.visible && visibleLayers.includes(layerId) : false);
  }, [getLayerById, visibleLayers]);
  
  /**
   * Verifica si una capa está aislada
   */
  const isLayerIsolated = useCallback((layerId: number) => {
    const layer = getLayerById(layerId);
    return layer?.isIsolated || false;
  }, [getLayerById]);
  
  /**
   * Devuelve solo las capas visibles
   */
  const filteredVisibleLayers = useMemo(() => {
    return layers.filter(layer => visibleLayers.includes(layer.id));
  }, [layers, visibleLayers]);
  
  // Funciones auxiliares
  function getDefaultLayerName(type: LayerType | string): string {
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'audio': return 'Nueva capa de audio';
        case 'video': return 'Nueva capa de video';
        case 'image': return 'Nueva capa de imagen';
        case 'text': return 'Nueva capa de texto';
        case 'effect': return 'Nueva capa de efectos';
        default: return 'Nueva capa';
      }
    } else {
      switch (type) {
        case LayerType.AUDIO: return 'Nueva capa de audio';
        case LayerType.VIDEO_IMAGE: return 'Nueva capa de video/imagen';
        case LayerType.TEXT: return 'Nueva capa de texto';
        case LayerType.EFFECTS: return 'Nueva capa de efectos';
        default: return 'Nueva capa';
      }
    }
  }
  
  function getLayerColorByType(type: LayerType | string): string {
    if (typeof type === 'string') {
      switch (type.toLowerCase()) {
        case 'audio': return '#f97316'; // Naranja
        case 'video': return '#4f46e5'; // Índigo
        case 'image': return '#0ea5e9'; // Azul cielo
        case 'text': return '#8b5cf6'; // Violeta
        case 'effect': return '#10b981'; // Esmeralda
        default: return '#6b7280'; // Gris
      }
    } else {
      switch (type) {
        case LayerType.AUDIO: return '#f97316'; // Naranja
        case LayerType.VIDEO_IMAGE: return '#4f46e5'; // Índigo
        case LayerType.TEXT: return '#8b5cf6'; // Violeta
        case LayerType.EFFECTS: return '#10b981'; // Esmeralda
        default: return '#6b7280'; // Gris
      }
    }
  }
  
  return {
    layers,
    visibleLayers,
    lockedLayers,
    filteredVisibleLayers,
    addLayer,
    removeLayer,
    updateLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    resizeLayer,
    moveLayerUp,
    moveLayerDown,
    resetLayers,
    getLayerById,
    isLayerLocked,
    isLayerVisible,
    isLayerIsolated
  };
}

export default useTimelineLayers;