/**
 * Constantes y funciones para ayudar a mantener la consistencia
 * y cumplir con las restricciones del timeline de vídeo musical
 */

import { TimelineClip } from '../../timeline/TimelineClip';

// Constantes principales
export const MAX_CLIP_DURATION = 5; // Duración máxima de un clip en segundos
export const MIN_CLIP_DURATION = 0.1; // Duración mínima de un clip en segundos
export const LAYER_TYPES = {
  AUDIO: 0,
  VIDEO_IMAGE: 1,
  TEXT: 2,
  EFFECTS: 3,
  RESERVED_4: 4,
  RESERVED_5: 5,
  RESERVED_6: 6,
  AI_GENERATED: 7
};

// Verifica si un clip cumple con las restricciones de duración
export function hasValidDuration(clip: TimelineClip): boolean {
  return clip.duration <= MAX_CLIP_DURATION && clip.duration >= MIN_CLIP_DURATION;
}

// Verifica si hay colisión entre dos clips
export function clipsCollide(clip1: TimelineClip, clip2: TimelineClip): boolean {
  if (clip1.layer !== clip2.layer) return false;
  if (clip1.id === clip2.id) return false;
  
  const clip1End = clip1.start + clip1.duration;
  const clip2End = clip2.start + clip2.duration;
  
  return (
    (clip1.start < clip2End && clip1End > clip2.start) ||
    (clip1.start === clip2.start) // Evitar que dos clips empiecen exactamente en el mismo punto
  );
}

// Encuentra colisiones entre un clip y todos los demás clips
export function findClipCollisions(clip: TimelineClip, allClips: TimelineClip[]): TimelineClip[] {
  return allClips.filter(otherClip => clipsCollide(clip, otherClip));
}

// Corregir la duración de un clip para que cumpla con las restricciones
export function correctClipDuration(clip: TimelineClip): TimelineClip {
  return {
    ...clip,
    duration: Math.min(MAX_CLIP_DURATION, Math.max(MIN_CLIP_DURATION, clip.duration))
  };
}

// Verifica si un clip está en la capa correcta según su tipo
export function isInCorrectLayer(clip: TimelineClip): boolean {
  switch (clip.type) {
    case 'audio':
      return clip.layer === LAYER_TYPES.AUDIO;
    case 'video':
    case 'image':
      return clip.layer === LAYER_TYPES.VIDEO_IMAGE || clip.layer === LAYER_TYPES.AI_GENERATED;
    case 'text':
      return clip.layer === LAYER_TYPES.TEXT;
    case 'effect':
    case 'transition':
      return clip.layer === LAYER_TYPES.EFFECTS;
    default:
      return false;
  }
}

// Corrige la posición de un clip para evitar colisiones
export function correctClipPosition(clip: TimelineClip, allClips: TimelineClip[]): TimelineClip {
  const otherClipsInLayer = allClips.filter(c => c.layer === clip.layer && c.id !== clip.id);
  let correctedStart = clip.start;
  let hasCollision = true;
  
  // Intentar ajustar el clip a la derecha para evitar colisiones
  while (hasCollision) {
    hasCollision = false;
    
    for (const otherClip of otherClipsInLayer) {
      const correctedEnd = correctedStart + clip.duration;
      const otherEnd = otherClip.start + otherClip.duration;
      
      if (
        (correctedStart < otherEnd && correctedEnd > otherClip.start) ||
        (correctedStart === otherClip.start)
      ) {
        // Hay colisión, mover a la derecha del clip en conflicto
        correctedStart = otherEnd + 0.01; // Pequeño espacio para evitar problemas de redondeo
        hasCollision = true;
        break;
      }
    }
  }
  
  return {
    ...clip,
    start: correctedStart
  };
}

// Verifica si un clip está en la capa 7 y es una imagen generada por IA
export function isAIGeneratedImage(clip: TimelineClip): boolean {
  return clip.layer === LAYER_TYPES.AI_GENERATED && clip.type === 'image';
}

// Verifica si hay algún clip que exceda la duración máxima
export function hasDurationViolations(clips: TimelineClip[]): boolean {
  return clips.some(clip => clip.duration > MAX_CLIP_DURATION);
}

// Intenta corregir todas las restricciones de un conjunto de clips
export function enforceAllConstraints(clips: TimelineClip[]): TimelineClip[] {
  let correctedClips = [...clips];
  
  // 1. Primero corregir las duraciones
  correctedClips = correctedClips.map(clip => correctClipDuration(clip));
  
  // 2. Luego corregir las posiciones para evitar colisiones
  for (let i = 0; i < correctedClips.length; i++) {
    correctedClips[i] = correctClipPosition(correctedClips[i], correctedClips);
  }
  
  return correctedClips;
}