import { useState, useCallback, useMemo } from 'react';
import { MAX_LAYERS, LayerType, ClipType } from '../../constants/timeline-constants';

export interface TimelineLayer {
  id: string;
  type: LayerType;
  name: string;
  visible: boolean;
  locked: boolean;
  clips: string[]; // IDs de clips en esta capa
}

export interface LayerOperation {
  addLayer: (type: LayerType, name?: string) => string | null;
  removeLayer: (layerId: string) => boolean;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  moveClipToLayer: (clipId: string, fromLayerId: string, toLayerId: string) => boolean;
  getAvailableLayerForClipType: (clipType: ClipType) => string | null;
  renameLayer: (layerId: string, newName: string) => void;
  getLayerType: (layerId: string) => LayerType | null;
  getLayerById: (layerId: string) => TimelineLayer | null;
  getLayers: () => TimelineLayer[];
  getLayersByType: (type: LayerType) => TimelineLayer[];
  duplicateLayer: (layerId: string) => string | null;
  getClipLayer: (clipId: string) => string | null;
}

/**
 * Hook para la gestión de capas en el timeline
 * Proporciona operaciones para agregar, eliminar, modificar capas, y organizar clips
 */
export function useTimelineLayers(initialLayers: TimelineLayer[] = []): LayerOperation {
  const [layers, setLayers] = useState<TimelineLayer[]>(initialLayers.length > 0 ? initialLayers : [
    // Capas por defecto si no se proporcionan
    { id: 'audio-main', type: LayerType.AUDIO, name: 'Audio Principal', visible: true, locked: false, clips: [] },
    { id: 'video-main', type: LayerType.VIDEO_IMAGE, name: 'Video Principal', visible: true, locked: false, clips: [] },
    { id: 'text-overlay', type: LayerType.TEXT, name: 'Textos', visible: true, locked: false, clips: [] }
  ]);

  // Obtener un ID único para una nueva capa
  const getUniqueLayerId = useCallback((type: LayerType, name: string) => {
    const baseId = `${LayerType[type].toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    let id = baseId;
    let counter = 1;
    
    while (layers.some(layer => layer.id === id)) {
      id = `${baseId}-${counter}`;
      counter++;
    }
    
    return id;
  }, [layers]);

  // Agregar una nueva capa
  const addLayer = useCallback((type: LayerType, name?: string): string | null => {
    const layersOfType = layers.filter(layer => layer.type === type);
    
    // Verificar si hemos alcanzado el límite de capas para este tipo
    if (layersOfType.length >= MAX_LAYERS[type]) {
      console.warn(`No se pueden agregar más capas de tipo ${LayerType[type]}, límite alcanzado.`);
      return null;
    }
    
    // Generar nombre predeterminado si no se proporciona uno
    const layerName = name || `${LayerType[type]} ${layersOfType.length + 1}`;
    const id = getUniqueLayerId(type, layerName);
    
    const newLayer: TimelineLayer = {
      id,
      type,
      name: layerName,
      visible: true,
      locked: false,
      clips: []
    };
    
    setLayers(prev => [...prev, newLayer]);
    return id;
  }, [layers, getUniqueLayerId]);

  // Eliminar una capa
  const removeLayer = useCallback((layerId: string): boolean => {
    const layerToRemove = layers.find(layer => layer.id === layerId);
    
    if (!layerToRemove) {
      console.warn(`Capa con ID ${layerId} no encontrada.`);
      return false;
    }
    
    // No permitir eliminar una capa que tiene clips
    if (layerToRemove.clips.length > 0) {
      console.warn(`No se puede eliminar la capa ${layerId} porque contiene clips.`);
      return false;
    }
    
    // No permitir eliminar si es la última capa de su tipo
    const layersOfSameType = layers.filter(layer => layer.type === layerToRemove.type);
    if (layersOfSameType.length <= 1) {
      console.warn(`No se puede eliminar la capa ${layerId} porque es la última de su tipo.`);
      return false;
    }
    
    setLayers(prev => prev.filter(layer => layer.id !== layerId));
    return true;
  }, [layers]);

  // Alternar visibilidad de una capa
  const toggleLayerVisibility = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, visible: !layer.visible } : layer
    ));
  }, []);

  // Alternar bloqueo de una capa
  const toggleLayerLock = useCallback((layerId: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, locked: !layer.locked } : layer
    ));
  }, []);

  // Mover un clip a otra capa
  const moveClipToLayer = useCallback((clipId: string, fromLayerId: string, toLayerId: string): boolean => {
    // Verificar que las capas existen
    const fromLayer = layers.find(layer => layer.id === fromLayerId);
    const toLayer = layers.find(layer => layer.id === toLayerId);
    
    if (!fromLayer || !toLayer) {
      console.warn(`Alguna de las capas no existe: fromLayer=${fromLayerId}, toLayer=${toLayerId}`);
      return false;
    }
    
    // Verificar que el clip existe en la capa de origen
    if (!fromLayer.clips.includes(clipId)) {
      console.warn(`Clip ${clipId} no encontrado en la capa ${fromLayerId}`);
      return false;
    }
    
    // No permitir mover clips a capas bloqueadas
    if (toLayer.locked) {
      console.warn(`No se puede mover el clip a la capa ${toLayerId} porque está bloqueada.`);
      return false;
    }
    
    setLayers(prev => prev.map(layer => {
      if (layer.id === fromLayerId) {
        return { ...layer, clips: layer.clips.filter(id => id !== clipId) };
      }
      if (layer.id === toLayerId) {
        return { ...layer, clips: [...layer.clips, clipId] };
      }
      return layer;
    }));
    
    return true;
  }, [layers]);

  // Obtener una capa disponible para un tipo de clip
  const getAvailableLayerForClipType = useCallback((clipType: ClipType): string | null => {
    // Mapear el tipo de clip al tipo de capa correspondiente
    let layerType: LayerType;
    
    switch (clipType) {
      case ClipType.AUDIO:
        layerType = LayerType.AUDIO;
        break;
      case ClipType.VIDEO:
      case ClipType.IMAGE:
        layerType = LayerType.VIDEO_IMAGE;
        break;
      case ClipType.TEXT:
        layerType = LayerType.TEXT;
        break;
      case ClipType.EFFECT:
        layerType = LayerType.EFFECTS;
        break;
      default:
        return null;
    }
    
    // Buscar la primera capa no bloqueada del tipo correspondiente
    const availableLayer = layers
      .filter(layer => layer.type === layerType && !layer.locked)
      .sort((a, b) => a.clips.length - b.clips.length) // Preferir capas con menos clips
      .shift();
    
    if (availableLayer) {
      return availableLayer.id;
    }
    
    // Si no hay capas disponibles, crear una nueva si no hemos alcanzado el límite
    if (layers.filter(layer => layer.type === layerType).length < MAX_LAYERS[layerType]) {
      return addLayer(layerType);
    }
    
    return null;
  }, [layers, addLayer]);

  // Renombrar una capa
  const renameLayer = useCallback((layerId: string, newName: string) => {
    setLayers(prev => prev.map(layer => 
      layer.id === layerId ? { ...layer, name: newName } : layer
    ));
  }, []);

  // Obtener el tipo de una capa
  const getLayerType = useCallback((layerId: string): LayerType | null => {
    const layer = layers.find(layer => layer.id === layerId);
    return layer ? layer.type : null;
  }, [layers]);

  // Obtener una capa por su ID
  const getLayerById = useCallback((layerId: string): TimelineLayer | null => {
    return layers.find(layer => layer.id === layerId) || null;
  }, [layers]);

  // Obtener todas las capas
  const getLayers = useCallback((): TimelineLayer[] => {
    return [...layers];
  }, [layers]);

  // Obtener capas por tipo
  const getLayersByType = useCallback((type: LayerType): TimelineLayer[] => {
    return layers.filter(layer => layer.type === type);
  }, [layers]);

  // Duplicar una capa (sin duplicar los clips)
  const duplicateLayer = useCallback((layerId: string): string | null => {
    const layerToDuplicate = layers.find(layer => layer.id === layerId);
    
    if (!layerToDuplicate) {
      console.warn(`Capa con ID ${layerId} no encontrada.`);
      return null;
    }
    
    // Verificar límite de capas
    const layersOfType = layers.filter(layer => layer.type === layerToDuplicate.type);
    if (layersOfType.length >= MAX_LAYERS[layerToDuplicate.type]) {
      console.warn(`No se pueden agregar más capas de tipo ${LayerType[layerToDuplicate.type]}, límite alcanzado.`);
      return null;
    }
    
    const newName = `${layerToDuplicate.name} (copia)`;
    const newId = getUniqueLayerId(layerToDuplicate.type, newName);
    
    const newLayer: TimelineLayer = {
      ...layerToDuplicate,
      id: newId,
      name: newName,
      clips: [] // La capa duplicada no contiene los clips de la original
    };
    
    setLayers(prev => [...prev, newLayer]);
    return newId;
  }, [layers, getUniqueLayerId]);

  // Obtener la capa que contiene un clip específico
  const getClipLayer = useCallback((clipId: string): string | null => {
    for (const layer of layers) {
      if (layer.clips.includes(clipId)) {
        return layer.id;
      }
    }
    return null;
  }, [layers]);

  // Exponer las funciones
  return {
    addLayer,
    removeLayer,
    toggleLayerVisibility,
    toggleLayerLock,
    moveClipToLayer,
    getAvailableLayerForClipType,
    renameLayer,
    getLayerType,
    getLayerById,
    getLayers,
    getLayersByType,
    duplicateLayer,
    getClipLayer
  };
}