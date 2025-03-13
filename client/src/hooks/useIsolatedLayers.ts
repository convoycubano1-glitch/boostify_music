/**
 * Hook para manejar capas aisladas de timeline
 * Proporciona validación, restricciones y operaciones seguras para clips en capas aisladas
 */

import { useState, useCallback } from 'react';
import { LayerType, AI_PLACEHOLDER_RESTRICTIONS } from '../constants/timeline-constants';

// Definición del tipo para clips del timeline
export interface TimelineClip {
  id: number;
  title: string;
  type: 'video' | 'image' | 'audio' | 'text';
  layer: number;
  start: number;
  duration: number;
  isIsolated?: boolean;
  placeholderType?: string;
  maxDuration?: number;
  thumbnail?: string;
  metadata?: {
    section?: string;
    movementApplied?: boolean;
    movementPattern?: string;
    movementIntensity?: number;
    faceSwapApplied?: boolean;
    musicianIntegrated?: boolean;
    sourceIndex?: number;
    lipsync?: {
      enabled: boolean;
      audioTrackId?: string;
    };
  };
}

// Tipo para operaciones del timeline
export enum IsolatedLayerOperation {
  ADD = 'add',
  MOVE = 'move',
  RESIZE = 'resize',
  DELETE = 'delete',
  UPDATE = 'update',
}

// Resultado de validación
interface ValidationResult {
  isValid: boolean;
  message?: string;
}

// Opciones del hook
interface UseIsolatedLayersOptions {
  maxAIPlaceholderDuration?: number;
  validateOverlap?: boolean;
  enforceAudioLayerRestrictions?: boolean;
}

/**
 * Hook para gestionar capas aisladas y restricciones en el timeline
 * 
 * Este hook proporciona:
 * 1. Validación de restricciones de capas aisladas
 * 2. Manejo de placeholders de IA con duración máxima
 * 3. Verificación y prevención de colisiones entre clips
 */
export function useIsolatedLayers(options: UseIsolatedLayersOptions = {}) {
  // Opciones con valores por defecto
  const { 
    maxAIPlaceholderDuration = AI_PLACEHOLDER_RESTRICTIONS.maxDuration,
    validateOverlap = true,
    enforceAudioLayerRestrictions = true
  } = options;

  // Estado interno para mensajes de error
  const [lastError, setLastError] = useState<string | null>(null);
  
  /**
   * Verifica si un clip es placeholder de IA y aplica restricciones
   */
  const validateAIPlaceholder = useCallback((clip: TimelineClip): ValidationResult => {
    if (!clip.placeholderType) {
      return { isValid: true };
    }
    
    // Validar duración máxima
    if (clip.duration > maxAIPlaceholderDuration) {
      return {
        isValid: false,
        message: `Los placeholders IA no pueden exceder ${maxAIPlaceholderDuration} segundos`
      };
    }
    
    return { isValid: true };
  }, [maxAIPlaceholderDuration]);
  
  /**
   * Verifica si hay solapamiento entre clips en la misma capa
   */
  const validateClipOverlap = useCallback((
    clip: TimelineClip, 
    allClips: TimelineClip[], 
    operation: IsolatedLayerOperation
  ): ValidationResult => {
    // Si no validamos solapamiento, retornar válido
    if (!validateOverlap) {
      return { isValid: true };
    }
    
    // Para operaciones de borrado, siempre es válido
    if (operation === IsolatedLayerOperation.DELETE) {
      return { isValid: true };
    }
    
    // Calcular los límites del clip
    const clipStart = clip.start;
    const clipEnd = clip.start + clip.duration;
    
    // Buscar solapamientos
    const overlappingClip = allClips.find(otherClip => {
      // Ignorar el mismo clip en operaciones de actualización/mover/redimensionar
      if (
        otherClip.id === clip.id && 
        (operation === IsolatedLayerOperation.UPDATE || 
         operation === IsolatedLayerOperation.MOVE ||
         operation === IsolatedLayerOperation.RESIZE)
      ) {
        return false;
      }
      
      // Verificar si está en la misma capa
      if (otherClip.layer !== clip.layer) {
        return false;
      }
      
      // Calcular los límites del otro clip
      const otherStart = otherClip.start;
      const otherEnd = otherClip.start + otherClip.duration;
      
      // Verificar solapamiento
      return (
        (clipStart < otherEnd && clipEnd > otherStart) || // Solapamiento general
        (clipStart >= otherStart && clipEnd <= otherEnd) || // Clip dentro del otro
        (otherStart >= clipStart && otherEnd <= clipEnd) // Otro clip dentro de este
      );
    });
    
    if (overlappingClip) {
      return {
        isValid: false,
        message: `El clip se solapa con "${overlappingClip.title}" en la misma capa`
      };
    }
    
    return { isValid: true };
  }, [validateOverlap]);
  
  /**
   * Verifica restricciones de capas de audio
   */
  const validateAudioLayer = useCallback((
    clip: TimelineClip, 
    layerType: LayerType | string | undefined,
    operation: IsolatedLayerOperation
  ): ValidationResult => {
    // Si no aplicamos restricciones de audio, retornar válido
    if (!enforceAudioLayerRestrictions) {
      return { isValid: true };
    }
    
    // Para operaciones de borrado, siempre es válido
    if (operation === IsolatedLayerOperation.DELETE) {
      return { isValid: true };
    }
    
    // Si el clip es de tipo audio pero se intenta añadir a una capa no-audio
    if (clip.type === 'audio' && layerType !== LayerType.AUDIO) {
      return {
        isValid: false,
        message: "Los clips de audio solo pueden colocarse en capas de audio"
      };
    }
    
    // Si el clip no es audio pero se intenta añadir a capa de audio
    if (clip.type !== 'audio' && layerType === LayerType.AUDIO) {
      return {
        isValid: false,
        message: "Las capas de audio solo pueden contener clips de audio"
      };
    }
    
    return { isValid: true };
  }, [enforceAudioLayerRestrictions]);
  
  /**
   * Valida todas las restricciones para una operación en un clip
   */
  const validateClipOperation = useCallback((
    clip: TimelineClip, 
    allClips: TimelineClip[], 
    operation: IsolatedLayerOperation,
    layerType?: LayerType | string
  ): ValidationResult => {
    // Validar restricciones de placeholder IA
    const aiValidation = validateAIPlaceholder(clip);
    if (!aiValidation.isValid) {
      setLastError(aiValidation.message || null);
      return aiValidation;
    }
    
    // Validar solapamiento si no es operación de borrado
    const overlapValidation = validateClipOverlap(clip, allClips, operation);
    if (!overlapValidation.isValid) {
      setLastError(overlapValidation.message || null);
      return overlapValidation;
    }
    
    // Validar restricciones de capa audio
    const audioValidation = validateAudioLayer(clip, layerType, operation);
    if (!audioValidation.isValid) {
      setLastError(audioValidation.message || null);
      return audioValidation;
    }
    
    // Todas las validaciones pasaron
    setLastError(null);
    return { isValid: true };
  }, [validateAIPlaceholder, validateClipOverlap, validateAudioLayer]);
  
  /**
   * Obtiene el error más reciente
   */
  const getLastError = useCallback(() => {
    return lastError;
  }, [lastError]);
  
  /**
   * Limpia el último error
   */
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);
  
  return {
    validateClipOperation,
    getLastError,
    clearError
  };
}