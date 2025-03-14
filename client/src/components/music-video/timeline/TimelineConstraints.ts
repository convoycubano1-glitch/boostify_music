/**
 * Restricciones para el timeline de producción de vídeos musicales
 * 
 * Este archivo define las funciones y restricciones que se aplican
 * al editor de timeline para asegurar que se cumplan los requisitos específicos:
 * - Clips de máximo 5 segundos
 * - Imágenes generadas solo en la capa 7 (IA_GENERADA)
 * - No solapamiento de imágenes
 */

import { TimelineClip, LayerType, ClipType } from '../../../interfaces/timeline';
import { MAX_CLIP_DURATION } from '../../../constants/timeline-constants';

/**
 * Valida la duración máxima de un clip (máximo 5 segundos)
 * @param duration Duración del clip en segundos
 * @returns True si es válida, false si excede el límite
 */
export function validateClipDuration(duration: number): boolean {
  return duration <= MAX_CLIP_DURATION;
}

/**
 * Valida que las imágenes generadas por IA solo estén en la capa IA_GENERADA (capa 7)
 * @param clip Clip a validar
 * @param layerType Tipo de capa donde se quiere colocar
 * @returns True si es una colocación válida según restricciones
 */
export function validateGeneratedImageLayer(clip: TimelineClip, layerType: LayerType): boolean {
  // Si es una imagen generada pero no está en la capa IA_GENERADA, no es válido
  if (clip.type === ClipType.GENERATED_IMAGE && layerType !== LayerType.IA_GENERADA) {
    return false;
  }
  
  // Si es otro tipo de clip, no hay restricción de capa específica
  return true;
}

/**
 * Verifica si hay colisión entre un clip y otro clip existente
 * @param newClip Nuevo clip o clip a mover
 * @param existingClip Clip existente en el timeline
 * @returns True si hay solapamiento, false si no colisionan
 */
export function checkClipOverlap(newClip: TimelineClip, existingClip: TimelineClip): boolean {
  // Si no están en la misma capa, no pueden solaparse
  if (newClip.layerId !== existingClip.layerId) {
    return false;
  }
  
  // Verificar si hay solapamiento temporal
  const newStart = newClip.start;
  const newEnd = newClip.start + newClip.duration;
  const existingStart = existingClip.start;
  const existingEnd = existingClip.start + existingClip.duration;
  
  // Comprueba si el nuevo clip comienza antes de que termine el existente
  // y termina después de que comience el existente
  return (newStart < existingEnd && newEnd > existingStart);
}

/**
 * Valida la colocación de un clip en el timeline según restricciones
 * @param clip Clip a validar
 * @param clips Lista de clips existentes en el timeline
 * @param layerType Tipo de capa donde se quiere colocar
 * @returns True si cumple todas las restricciones, false si alguna falla
 */
export function validateClipPlacement(
  clip: TimelineClip, 
  clips: TimelineClip[], 
  layerType: LayerType
): boolean {
  // Validar duración máxima
  if (!validateClipDuration(clip.duration)) {
    console.warn('Clip excede la duración máxima permitida (5 segundos)');
    return false;
  }
  
  // Validar restricción de capa para imágenes generadas
  if (!validateGeneratedImageLayer(clip, layerType)) {
    console.warn('Las imágenes generadas solo pueden colocarse en la capa 7 (IA_GENERADA)');
    return false;
  }
  
  // Validar no solapamiento con otros clips en la misma capa
  for (const existingClip of clips) {
    // Ignorar el mismo clip (para casos de movimiento)
    if (existingClip.id === clip.id) {
      continue;
    }
    
    // Si hay solapamiento y están en la misma capa, no es válido
    if (checkClipOverlap(clip, existingClip)) {
      console.warn('No se permite el solapamiento de clips en la misma capa');
      return false;
    }
  }
  
  // Si pasa todas las validaciones, es una colocación válida
  return true;
}