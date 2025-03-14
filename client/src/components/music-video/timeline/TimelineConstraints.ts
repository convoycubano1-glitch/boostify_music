/**
 * Sistema de validación y limitación para clips del timeline
 * Implementa las restricciones para asegurar que los clips cumplan con las reglas establecidas
 */
import { TimelineClip } from '../../../interfaces/timeline';
import { 
  MAX_CLIP_DURATION, 
  MIN_CLIP_DURATION, 
  LayerType as LAYER_TYPES 
} from '../../../constants/timeline-constants';

// Exportamos las constantes para que puedan ser usadas desde otros archivos
export { MAX_CLIP_DURATION, MIN_CLIP_DURATION, LAYER_TYPES };

/**
 * Verifica y limita la duración máxima de los clips según las restricciones
 * @param clips Lista de clips a verificar y limitar
 * @returns Lista de clips con duraciones ajustadas
 */
export function enforceDurationConstraints(clips: TimelineClip[]): TimelineClip[] {
  return clips.map(clip => {
    if (clip.duration > MAX_CLIP_DURATION) {
      return { ...clip, duration: MAX_CLIP_DURATION };
    }
    if (clip.duration < MIN_CLIP_DURATION) {
      return { ...clip, duration: MIN_CLIP_DURATION };
    }
    return clip;
  });
}

/**
 * Verifica que no haya solapamiento entre clips en la misma capa
 * Si hay solapamiento, ajusta la posición del clip
 * @param clips Lista de clips a verificar
 * @returns Lista de clips con posiciones ajustadas
 */
export function enforceNoOverlap(clips: TimelineClip[]): TimelineClip[] {
  // Copia segura de los clips para no modificar el original
  const safeClips = [...clips];
  
  // Para cada capa, verificamos solapamientos
  const layers = [...new Set(clips.map(clip => clip.layer))];
  
  layers.forEach(layer => {
    // Obtener clips de esta capa
    const layerClips = safeClips.filter(clip => clip.layer === layer);
    
    // Ordenar clips por posición inicial
    layerClips.sort((a, b) => a.start - b.start);
    
    // Verificar solapamientos
    for (let i = 1; i < layerClips.length; i++) {
      const prevClip = layerClips[i - 1];
      const currentClip = layerClips[i];
      
      // Si hay solapamiento
      if (prevClip.start + prevClip.duration > currentClip.start) {
        // Ajustar posición del clip actual
        const newStart = prevClip.start + prevClip.duration;
        
        // Encontrar el índice real del clip en la lista original
        const clipIndex = safeClips.findIndex(c => c.id === currentClip.id);
        if (clipIndex !== -1) {
          safeClips[clipIndex] = { ...safeClips[clipIndex], start: newStart };
        }
      }
    }
  });
  
  return safeClips;
}

/**
 * Verifica que las imágenes generadas por IA estén en la capa correcta
 * Si no lo están, las mueve a la capa de IA
 * @param clips Lista de clips a verificar
 * @returns Lista de clips con capas ajustadas
 */
export function enforceAILayerConstraint(clips: TimelineClip[]): TimelineClip[] {
  return clips.map(clip => {
    // Si es una imagen generada por IA pero no está en la capa correcta
    if (clip.type === 'image' && clip.generatedImage && clip.layer !== LAYER_TYPES.AI_GENERATED) {
      return { ...clip, layer: LAYER_TYPES.AI_GENERATED };
    }
    return clip;
  });
}

/**
 * Aplica todas las restricciones a la lista de clips
 * @param clips Lista de clips a verificar y ajustar
 * @returns Lista de clips con todas las restricciones aplicadas
 */
export function enforceAllConstraints(clips: TimelineClip[]): TimelineClip[] {
  // Aplicar restricciones en secuencia
  let result = [...clips];
  result = enforceDurationConstraints(result);
  result = enforceNoOverlap(result);
  result = enforceAILayerConstraint(result);
  return result;
}

/**
 * Valida si un clip puede colocarse en una capa específica según su tipo
 * @param clipType Tipo de clip a validar
 * @param layerType Tipo de capa donde se quiere colocar
 * @returns true si el clip es válido para esa capa, false en caso contrario
 */
export function isClipValidForLayer(clipType: string, layerType: LAYER_TYPES): boolean {
  switch (layerType) {
    case LAYER_TYPES.AUDIO:
      return clipType === 'audio';
    case LAYER_TYPES.VIDEO_IMAGE:
      return clipType === 'video' || clipType === 'image';
    case LAYER_TYPES.TEXT:
      return clipType === 'text';
    case LAYER_TYPES.EFFECTS:
      return clipType === 'effect';
    case LAYER_TYPES.AI_GENERATED:
      return clipType === 'image' && Boolean(clipType);
    default:
      return false;
  }
}