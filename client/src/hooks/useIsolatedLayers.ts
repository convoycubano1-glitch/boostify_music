/**
 * Hook personalizado para gestionar las restricciones en capas aisladas
 * 
 * Este hook proporciona:
 * - Validación de operaciones en clips dentro de capas aisladas
 * - Restricciones para tipos específicos de capas (audio, placeholders IA, etc.)
 * - Mensajes de error personalizados para operaciones no permitidas
 */

import { useState, useCallback } from 'react';
import { ClipOperation, ERROR_MESSAGES } from '../constants/timeline-constants';

/**
 * Opciones para el hook de capas aisladas
 */
export interface IsolatedLayersOptions {
  // Tipos de capas con restricciones especiales
  restrictedLayerTypes?: string[];
  
  // Duración máxima permitida para placeholders de IA (en segundos)
  maxAIPlaceholderDuration?: number;
  
  // Permitir o no solapamiento de clips en la misma capa
  allowOverlap?: boolean;
}

/**
 * Resultado de la validación de operaciones en clips
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Importamos el tipo TimelineClip desde el componente
 */
import { TimelineClip } from '../components/timeline/TimelineClip';

/**
 * Hook personalizado para manejar lógica de validación de operaciones en capas aisladas
 */
function useIsolatedLayers(options: IsolatedLayersOptions = {}) {
  // Opciones por defecto
  const {
    restrictedLayerTypes = [],
    maxAIPlaceholderDuration = 5, // 5 segundos por defecto
    allowOverlap = false
  } = options;

  // Último error de validación
  const [lastError, setLastError] = useState<string | null>(null);

  /**
   * Validar si es posible realizar una operación en un clip
   */
  const validateClipOperation = useCallback((
    clip: TimelineClip,
    existingClips: TimelineClip[],
    operation: ClipOperation
  ): ValidationResult => {
    // Resultado por defecto
    const result: ValidationResult = { isValid: true };

    // Validar restricciones específicas para placeholders de IA
    if (clip.metadata?.isAIGenerated || clip.type === 'ai_placeholder') {
      // Validar duración máxima para placeholders de IA
      if (clip.duration > maxAIPlaceholderDuration) {
        result.isValid = false;
        result.error = `${ERROR_MESSAGES.AI_PLACEHOLDER_DURATION} (${maxAIPlaceholderDuration}s)`;
        setLastError(result.error);
        return result;
      }
    }

    // Validar capas restringidas
    if (restrictedLayerTypes.includes(clip.type)) {
      // Para capas restringidas, solo permitir ciertas operaciones
      switch (operation) {
        case ClipOperation.ADD:
          // Permitir añadir clips en capas restringidas
          break;
          
        case ClipOperation.DELETE:
          // No permitir eliminar en algunos casos específicos
          if (existingClips.filter(c => c.layer === clip.layer).length <= 1) {
            result.isValid = false;
            result.error = ERROR_MESSAGES.CANNOT_DELETE_ISOLATED_LAYER;
            setLastError(result.error);
            return result;
          }
          break;
          
        case ClipOperation.MOVE:
        case ClipOperation.RESIZE_START:
        case ClipOperation.RESIZE_END:
        case ClipOperation.DUPLICATE:
        case ClipOperation.SPLIT:
          // Por defecto, no permitir otras operaciones en capas restringidas
          result.isValid = false;
          result.error = ERROR_MESSAGES.CANNOT_MODIFY_ISOLATED_CLIP;
          setLastError(result.error);
          return result;
          
        default:
          // Operación desconocida
          result.isValid = false;
          result.error = ERROR_MESSAGES.INVALID_OPERATION;
          setLastError(result.error);
          return result;
      }
    }

    // Validar solapamiento de clips (si no está permitido)
    if (!allowOverlap && [ClipOperation.ADD, ClipOperation.MOVE, ClipOperation.RESIZE_START, ClipOperation.RESIZE_END].includes(operation)) {
      // Obtener clips en la misma capa
      const clipsInSameLayer = existingClips.filter(c => 
        c.layer === clip.layer && c.id !== clip.id
      );
      
      // Calcular tiempo de inicio y fin del clip
      const clipStart = clip.start;
      const clipEnd = clip.start + clip.duration;
      
      // Verificar solapamiento con otros clips
      const hasOverlap = clipsInSameLayer.some(otherClip => {
        const otherStart = otherClip.start;
        const otherEnd = otherClip.start + otherClip.duration;
        
        // Detectar si hay solapamiento entre los clips
        return (
          (clipStart >= otherStart && clipStart < otherEnd) || // El inicio del clip está dentro del otro
          (clipEnd > otherStart && clipEnd <= otherEnd) ||     // El fin del clip está dentro del otro
          (clipStart <= otherStart && clipEnd >= otherEnd)     // El clip contiene completamente al otro
        );
      });
      
      if (hasOverlap) {
        result.isValid = false;
        result.error = ERROR_MESSAGES.CLIP_OVERLAP;
        setLastError(result.error);
        return result;
      }
    }

    // Si llegamos aquí, la operación es válida
    setLastError(null);
    return result;
  }, [restrictedLayerTypes, maxAIPlaceholderDuration, allowOverlap]);

  /**
   * Obtener el último error de validación
   */
  const getLastError = useCallback(() => {
    return lastError;
  }, [lastError]);

  /**
   * Limpiar el último error
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

// Exportar el hook principal
export { useIsolatedLayers };

// Exportar los tipos y exportaciones necesarias para mantener la compatibilidad
export { IsolatedLayersOptions, ValidationResult, TimelineClip }; 

// Para mantener compatibilidad con las importaciones existentes
export const IsolatedLayerOperation = ClipOperation;