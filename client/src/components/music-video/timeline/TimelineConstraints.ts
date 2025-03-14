/**
 * Funciones de validación y restricciones para el timeline
 * Implementa todas las reglas de negocio relacionadas con el timeline
 */
import { TimelineClip } from '../../../interfaces/timeline';
import { 
  LayerType, 
  MAX_CLIP_DURATION, 
  MIN_CLIP_DURATION,
  LAYER_PROPERTIES 
} from '../../../constants/timeline-constants';

/**
 * Verifica que un clip tenga una duración válida (entre MIN_CLIP_DURATION y MAX_CLIP_DURATION)
 * @param clip Clip a verificar
 * @returns true si la duración es válida, false en caso contrario
 */
export function hasValidDuration(clip: TimelineClip): boolean {
  return clip.duration >= MIN_CLIP_DURATION && clip.duration <= MAX_CLIP_DURATION;
}

/**
 * Verifica si dos clips colisionan en la línea de tiempo (ocupan el mismo espacio temporal)
 * @param clip1 Primer clip
 * @param clip2 Segundo clip
 * @returns true si hay colisión, false en caso contrario
 */
export function clipsCollide(clip1: TimelineClip, clip2: TimelineClip): boolean {
  // Solo pueden colisionar clips en la misma capa
  if (clip1.layer !== clip2.layer) {
    return false;
  }

  // Verificar si hay superposición de tiempo
  const start1 = clip1.start;
  const end1 = clip1.start + clip1.duration;
  const start2 = clip2.start;
  const end2 = clip2.start + clip2.duration;

  // Hay colisión si alguno de los intervalos contiene al otro o si se solapan
  return (
    (start1 <= start2 && end1 > start2) || // clip1 empieza antes que clip2 y termina después del inicio de clip2
    (start2 <= start1 && end2 > start1)    // clip2 empieza antes que clip1 y termina después del inicio de clip1
  );
}

/**
 * Encuentra todos los clips que colisionan con un clip dado
 * @param clip Clip a verificar
 * @param allClips Lista de todos los clips en el timeline
 * @returns Array con los clips que colisionan con el clip dado
 */
export function findClipCollisions(clip: TimelineClip, allClips: TimelineClip[]): TimelineClip[] {
  return allClips.filter(c => 
    c.id !== clip.id && // No considerar el mismo clip
    c.layer === clip.layer && // Solo clips en la misma capa
    clipsCollide(clip, c) // Verificar colisión
  );
}

/**
 * Verifica si un clip está en la capa correcta según su tipo
 * @param clip Clip a verificar
 * @returns true si el clip está en la capa correcta, false en caso contrario
 */
export function isInCorrectLayer(clip: TimelineClip): boolean {
  const layerProps = LAYER_PROPERTIES[clip.layer as LayerType];
  
  if (!layerProps) {
    return false; // La capa no existe
  }
  
  // Verificar si el tipo de clip está permitido en la capa
  return layerProps.allowedTypes.includes(clip.type);
}

/**
 * Verifica si una imagen está marcada como generada por IA
 * y si está en la capa específica para imágenes de IA
 * @param clip Clip a verificar
 * @returns true si es una imagen generada por IA en la capa correcta
 */
export function isAIGeneratedImage(clip: TimelineClip): boolean {
  return (
    clip.type === 'image' && 
    clip.generatedImage === true && 
    clip.layer === LayerType.AI_GENERATED
  );
}

/**
 * Reposiciona un clip para evitar colisiones con otros clips
 * @param clip Clip a reposicionar
 * @param allClips Lista de todos los clips en el timeline
 * @returns Clip con la nueva posición que evita colisiones
 */
export function repositionClipToAvoidCollisions(
  clip: TimelineClip, 
  allClips: TimelineClip[]
): TimelineClip {
  // Filtrar clips en la misma capa
  const clipsInSameLayer = allClips.filter(c => 
    c.id !== clip.id && c.layer === clip.layer
  );
  
  if (clipsInSameLayer.length === 0) {
    return clip; // No hay otros clips en la capa, no hay colisiones
  }
  
  // Ordenar clips por posición inicial para buscar espacios libres
  const sortedClips = [...clipsInSameLayer].sort((a, b) => a.start - b.start);
  
  // Copia del clip para modificar
  const modifiedClip = { ...clip };
  
  // Buscar espacios libres entre clips existentes
  let foundValidPosition = false;
  
  // Verificar espacio al inicio (antes del primer clip)
  if (sortedClips[0].start >= clip.duration) {
    modifiedClip.start = 0;
    foundValidPosition = true;
  }
  
  // Verificar espacios entre clips
  if (!foundValidPosition) {
    for (let i = 0; i < sortedClips.length - 1; i++) {
      const endOfCurrent = sortedClips[i].start + sortedClips[i].duration;
      const startOfNext = sortedClips[i + 1].start;
      
      if (startOfNext - endOfCurrent >= clip.duration) {
        modifiedClip.start = endOfCurrent;
        foundValidPosition = true;
        break;
      }
    }
  }
  
  // Si no hay espacios, colocar después del último clip
  if (!foundValidPosition) {
    const lastClip = sortedClips[sortedClips.length - 1];
    modifiedClip.start = lastClip.start + lastClip.duration;
  }
  
  return modifiedClip;
}

/**
 * Verifica si un clip excede la duración máxima y lo ajusta si es necesario
 * @param clip Clip a verificar y ajustar
 * @returns Clip con la duración ajustada al máximo permitido si era necesario
 */
export function enforceMaxDuration(clip: TimelineClip): TimelineClip {
  if (clip.duration > MAX_CLIP_DURATION) {
    return { ...clip, duration: MAX_CLIP_DURATION };
  }
  return clip;
}

/**
 * Valida completamente un clip según todas las restricciones
 * @param clip Clip a validar
 * @param allClips Lista de todos los clips en el timeline
 * @returns Objeto con el resultado de la validación y mensajes de error si los hay
 */
export function validateClip(
  clip: TimelineClip, 
  allClips: TimelineClip[]
): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Validar duración
  if (!hasValidDuration(clip)) {
    errors.push(`La duración del clip debe estar entre ${MIN_CLIP_DURATION} y ${MAX_CLIP_DURATION} segundos.`);
  }
  
  // Validar capa correcta
  if (!isInCorrectLayer(clip)) {
    errors.push(`El tipo de clip '${clip.type}' no está permitido en la capa seleccionada.`);
  }
  
  // Validar imágenes generadas por IA
  if (clip.type === 'image' && clip.generatedImage && clip.layer !== LayerType.AI_GENERATED) {
    errors.push('Las imágenes generadas por IA deben estar en la capa específica para contenido AI.');
  }
  
  // Validar colisiones
  const collisions = findClipCollisions(clip, allClips);
  if (collisions.length > 0) {
    errors.push(`El clip colisiona con ${collisions.length} clip(s) existente(s).`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Valida si un clip puede ser movido a una posición específica
 * @param clip Clip a mover
 * @param newStart Nueva posición inicial
 * @param allClips Lista de todos los clips en el timeline
 * @returns true si el movimiento es válido, false en caso contrario
 */
export function canMoveClipTo(
  clip: TimelineClip, 
  newStart: number, 
  allClips: TimelineClip[]
): boolean {
  // Crear una versión temporal del clip en la nueva posición
  const movedClip = { ...clip, start: newStart };
  
  // Verificar colisiones con otros clips
  const wouldCollide = findClipCollisions(movedClip, allClips).length > 0;
  
  // El movimiento es válido si no hay colisiones y no sale de los límites
  return !wouldCollide && newStart >= 0;
}

/**
 * Ajusta la duración de un clip al cambiar su final
 * @param clip Clip a redimensionar
 * @param newEnd Nueva posición final
 * @param allClips Lista de todos los clips en el timeline
 * @returns Clip con la duración ajustada o null si no es posible
 */
export function resizeClipEnd(
  clip: TimelineClip, 
  newEnd: number, 
  allClips: TimelineClip[]
): TimelineClip | null {
  // Calcular la nueva duración
  const newDuration = newEnd - clip.start;
  
  // Verificar límites
  if (newDuration < MIN_CLIP_DURATION || newDuration > MAX_CLIP_DURATION) {
    return null; // Duración fuera de límites
  }
  
  // Crear una versión temporal del clip con la nueva duración
  const resizedClip = { ...clip, duration: newDuration };
  
  // Verificar colisiones con otros clips
  const wouldCollide = findClipCollisions(resizedClip, allClips).length > 0;
  
  // El redimensionamiento es válido si no hay colisiones
  return wouldCollide ? null : resizedClip;
}