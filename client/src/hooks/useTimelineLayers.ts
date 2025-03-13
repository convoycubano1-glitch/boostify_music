/**
 * Hook personalizado para gestionar capas del timeline
 * Este hook controla la creación, configuración y validación de capas
 */

import { useState, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { LayerType, DEFAULT_LAYERS, AI_PLACEHOLDER_RESTRICTIONS } from '../constants/timeline-constants';
import { useIsolatedLayers, type TimelineClip } from './useIsolatedLayers';

// Tipos para gestión de capas
export interface LayerConfig {
  id: number;
  name: string;
  type: string | LayerType;
  isIsolated?: boolean;
  visible: boolean;
  locked: boolean;
  color: string;
}

export type LayerVisibilityMap = Record<number, boolean>;
export type LayerLockMap = Record<number, boolean>;

export interface UseTimelineLayersResult {
  layers: LayerConfig[];
  visibleLayers: LayerVisibilityMap;
  lockedLayers: LayerLockMap;
  selectedLayerId: number | null;
  addLayer: (type: LayerType) => LayerConfig;
  removeLayer: (id: number) => void;
  updateLayer: (id: number, updates: Partial<LayerConfig>) => void;
  toggleLayerVisibility: (id: number) => void;
  toggleLayerLock: (id: number) => void;
  selectLayer: (id: number | null) => void;
  canAddClipToLayer: (layerId: number, clipType: string) => boolean;
  isLayerIsolated: (layerId: number) => boolean;
  getLayerByType: (type: LayerType) => LayerConfig | undefined;
  getLayerNameById: (id: number) => string;
  getLayerColorById: (id: number) => string;
  resetLayers: () => void;
}

/**
 * Hook para gestionar capas del timeline
 */
export function useTimelineLayers(
  clips: TimelineClip[] = [],
  initialLayers: LayerConfig[] = DEFAULT_LAYERS
): UseTimelineLayersResult {
  const [layers, setLayers] = useState<LayerConfig[]>(initialLayers);
  const [visibleLayers, setVisibleLayers] = useState<LayerVisibilityMap>(() => {
    const map: LayerVisibilityMap = {};
    initialLayers.forEach(layer => {
      map[layer.id] = layer.visible;
    });
    return map;
  });
  
  const [lockedLayers, setLockedLayers] = useState<LayerLockMap>(() => {
    const map: LayerLockMap = {};
    initialLayers.forEach(layer => {
      map[layer.id] = layer.locked || false;
    });
    return map;
  });
  
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);
  
  // Usar el hook de capas aisladas para validaciones
  const { canAddClipToLayer: validateClipForLayer } = useIsolatedLayers(clips);

  /**
   * Agregar una nueva capa al timeline
   */
  const addLayer = useCallback((type: LayerType): LayerConfig => {
    const newLayer: LayerConfig = {
      id: layers.length > 0 ? Math.max(...layers.map(l => l.id)) + 1 : 0,
      name: `${type.charAt(0).toUpperCase() + type.slice(1)} ${layers.filter(l => l.type === type).length + 1}`,
      type,
      isIsolated: type === LayerType.AUDIO, // Las capas de audio están aisladas por defecto
      visible: true,
      locked: false,
      color: getRandomColor()
    };
    
    setLayers(prevLayers => [...prevLayers, newLayer]);
    
    // Actualizar los mapas de visibilidad y bloqueo
    setVisibleLayers(prev => ({ ...prev, [newLayer.id]: true }));
    setLockedLayers(prev => ({ ...prev, [newLayer.id]: false }));
    
    return newLayer;
  }, [layers]);

  /**
   * Eliminar una capa del timeline
   */
  const removeLayer = useCallback((id: number) => {
    // No permitir eliminar capas que tienen clips
    const hasClips = clips.some(clip => clip.layer === id);
    if (hasClips) {
      console.warn('No se puede eliminar una capa que contiene clips.');
      return;
    }
    
    setLayers(prevLayers => prevLayers.filter(layer => layer.id !== id));
    
    // Actualizar los mapas de visibilidad y bloqueo
    setVisibleLayers(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    
    setLockedLayers(prev => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
    
    // Si la capa eliminada estaba seleccionada, deseleccionar
    if (selectedLayerId === id) {
      setSelectedLayerId(null);
    }
  }, [clips, selectedLayerId]);

  /**
   * Actualizar propiedades de una capa
   */
  const updateLayer = useCallback((id: number, updates: Partial<LayerConfig>) => {
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === id ? { ...layer, ...updates } : layer
      )
    );
    
    // Actualizar los mapas de visibilidad y bloqueo si esas propiedades cambian
    if (updates.visible !== undefined) {
      setVisibleLayers(prev => ({ ...prev, [id]: updates.visible || false }));
    }
    
    if (updates.locked !== undefined) {
      setLockedLayers(prev => ({ ...prev, [id]: updates.locked || false }));
    }
  }, []);

  /**
   * Alternar visibilidad de una capa
   */
  const toggleLayerVisibility = useCallback((id: number) => {
    setVisibleLayers(prev => {
      const currentVisibility = prev[id] !== undefined ? prev[id] : true;
      return { ...prev, [id]: !currentVisibility };
    });
    
    // También actualizar el estado de la capa
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === id ? { ...layer, visible: !(visibleLayers[id] !== undefined ? visibleLayers[id] : true) } : layer
      )
    );
  }, [visibleLayers]);

  /**
   * Alternar bloqueo de una capa
   */
  const toggleLayerLock = useCallback((id: number) => {
    setLockedLayers(prev => {
      const currentLock = prev[id] !== undefined ? prev[id] : false;
      return { ...prev, [id]: !currentLock };
    });
    
    // También actualizar el estado de la capa
    setLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === id ? { ...layer, locked: !(lockedLayers[id] !== undefined ? lockedLayers[id] : false) } : layer
      )
    );
  }, [lockedLayers]);

  /**
   * Seleccionar una capa
   */
  const selectLayer = useCallback((id: number | null) => {
    setSelectedLayerId(id);
  }, []);

  /**
   * Verificar si se puede agregar un clip a una capa específica
   */
  const canAddClipToLayer = useCallback((layerId: number, clipType: string): boolean => {
    // Obtener la capa por ID
    const layer = layers.find(l => l.id === layerId);
    if (!layer) return false;
    
    // No permitir agregar clips a capas bloqueadas
    if (lockedLayers[layerId]) return false;
    
    // Verificar compatibilidad de tipos
    const isTypeCompatible = 
      (layer.type === LayerType.AUDIO && clipType === 'audio') ||
      (layer.type === LayerType.IMAGE && (clipType === 'image' || clipType === 'video')) ||
      (layer.type === LayerType.TEXT && clipType === 'text') ||
      (layer.type === LayerType.EFFECT && clipType === 'effect');
    
    if (!isTypeCompatible) return false;
    
    // Si la capa es de audio y ya tiene clips, no permitir agregar más
    if (layer.type === LayerType.AUDIO) {
      const layerHasClips = clips.some(clip => clip.layer === layerId);
      if (layerHasClips) return false;
    }
    
    // Verificar las reglas de capa aislada usando el hook
    return validateClipForLayer(layerId);
  }, [layers, lockedLayers, clips, validateClipForLayer]);

  /**
   * Verificar si una capa está aislada
   */
  const isLayerIsolated = useCallback((layerId: number): boolean => {
    const layer = layers.find(l => l.id === layerId);
    return layer?.isIsolated || false;
  }, [layers]);

  /**
   * Obtener una capa por su tipo
   */
  const getLayerByType = useCallback((type: LayerType): LayerConfig | undefined => {
    return layers.find(layer => layer.type === type);
  }, [layers]);

  /**
   * Obtener el nombre de una capa por su ID
   */
  const getLayerNameById = useCallback((id: number): string => {
    const layer = layers.find(l => l.id === id);
    return layer?.name || `Capa ${id}`;
  }, [layers]);

  /**
   * Obtener el color de una capa por su ID
   */
  const getLayerColorById = useCallback((id: number): string => {
    const layer = layers.find(l => l.id === id);
    return layer?.color || '#cccccc';
  }, [layers]);

  /**
   * Restablecer capas a la configuración predeterminada
   */
  const resetLayers = useCallback(() => {
    setLayers(DEFAULT_LAYERS);
    
    // Restablecer mapas de visibilidad y bloqueo
    const visMap: LayerVisibilityMap = {};
    const lockMap: LayerLockMap = {};
    
    DEFAULT_LAYERS.forEach(layer => {
      visMap[layer.id] = layer.visible;
      lockMap[layer.id] = layer.locked || false;
    });
    
    setVisibleLayers(visMap);
    setLockedLayers(lockMap);
    setSelectedLayerId(null);
  }, []);

  return {
    layers,
    visibleLayers,
    lockedLayers,
    selectedLayerId,
    addLayer,
    removeLayer,
    updateLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    selectLayer,
    canAddClipToLayer,
    isLayerIsolated,
    getLayerByType,
    getLayerNameById,
    getLayerColorById,
    resetLayers
  };
}

/**
 * Función auxiliar para generar un color aleatorio
 */
function getRandomColor(): string {
  const colors = [
    '#FF5722', '#E91E63', '#9C27B0', '#673AB7', 
    '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39',
    '#FFC107', '#FF9800', '#795548', '#607D8B'
  ];
  
  return colors[Math.floor(Math.random() * colors.length)];
}