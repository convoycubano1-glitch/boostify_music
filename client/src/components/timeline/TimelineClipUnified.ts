/**
 * Interfaz TimelineClip unificada para garantizar compatibilidad entre diferentes
 * componentes del sistema de edición de video
 */

import { LayerType } from '../../constants/timeline-constants';

/**
 * TimelineClip - Interfaz unificada para clips en la línea de tiempo
 * Compatible tanto con useTimelineLayers como con el EditorContext
 */
export interface TimelineClipUnified {
  // Identificadores (soporta string o number para compatibilidad)
  id: number | string;
  
  // Datos de track
  trackId?: string;              // ID de pista (para EditorContext)
  layer: number;                 // Capa/layer numérica (0=audio, 1=video/imagen, etc)
  
  // Tiempo y duración
  start?: number;                // Tiempo de inicio (alias para compatibilidad) 
  startTime: number;             // Tiempo de inicio estandarizado
  duration: number;              // Duración del clip
  endTime?: number;              // Tiempo de finalización (calculado)
  trimStart?: number;            // Punto de inicio del trim
  trimEnd?: number;              // Punto de finalización del trim
  
  // Información básica
  title?: string;                // Título para visualización
  name?: string;                 // Nombre (alias para compatibilidad)
  description?: string;          // Descripción opcional
  type: string | LayerType;      // Tipo de clip (admite string o enum)
  
  // Estado y control
  visible?: boolean;             // Si el clip es visible
  locked?: boolean;              // Si el clip está bloqueado para edición
  
  // URLs de recursos
  url?: string;                  // URL genérica del recurso
  source?: string;               // URL del recurso (alias para compatibilidad)
  audioUrl?: string;             // URL específica para audio
  videoUrl?: string;             // URL específica para video
  imageUrl?: string;             // URL específica para imagen
  movementUrl?: string;          // URL para datos de movimiento
  
  // Visualización
  thumbnail?: string;            // URL de miniatura
  waveform?: number[];           // Datos de forma de onda para audio
  shotType?: string;             // Tipo de plano (closeup, wide, etc)
  
  // Propiedades de texto
  textContent?: string;          // Contenido para clips de texto
  textStyle?: string;            // Estilo del texto
  textColor?: string;            // Color del texto
  
  // Propiedades de efecto
  effectType?: string;           // Tipo de efecto
  effectIntensity?: number;      // Intensidad del efecto
  
  // Propiedades de transición
  transitionType?: string;       // Tipo de transición
  transitionDuration?: number;   // Duración de la transición
  
  // Metadatos adicionales
  metadata?: {
    section?: string;            // Sección musical (coro, verso, etc)
    movementApplied?: boolean;   // Si tiene aplicado movimiento de cámara
    movementPattern?: string;    // Patrón de movimiento
    movementIntensity?: number;  // Intensidad del movimiento
    lipsync?: {                  // Datos de sincronización labial
      applied: boolean;
      videoUrl?: string;
      progress?: number;
    };
    [key: string]: any;          // Propiedades adicionales
  };
  
  // Propiedades adicionales para compatibilidad
  imagePrompt?: string;          // Prompt para generación de imagen
  createdAt?: Date;              // Fecha de creación
}

/**
 * Función para convertir clips entre formatos
 * Asegura que un clip tenga todas las propiedades mínimas necesarias
 */
export function ensureCompatibleClip(clip: any): TimelineClipUnified {
  // Asegurarnos que tenga los campos básicos
  const compatibleClip: TimelineClipUnified = {
    id: clip.id || Math.floor(Math.random() * 10000),
    layer: typeof clip.layer === 'number' ? clip.layer : 
           (clip.trackId === 'audio-track-1' ? 0 : 1),
    type: clip.type || 'video',
    startTime: clip.startTime !== undefined ? clip.startTime : 
               (clip.start !== undefined ? clip.start : 0),
    duration: clip.duration || 5,
    title: clip.title || clip.name || 'Clip',
    name: clip.name || clip.title || 'Clip',
    visible: clip.visible !== undefined ? clip.visible : true,
    locked: clip.locked || false,
  };
  
  // Calcular endTime si no existe
  compatibleClip.endTime = clip.endTime || (compatibleClip.startTime + compatibleClip.duration);
  
  // Asegurar que start también esté definido para compatibilidad
  compatibleClip.start = compatibleClip.startTime;
  
  // Copiar URL del recurso con compatibilidad
  if (clip.url) compatibleClip.url = clip.url;
  if (clip.source) compatibleClip.source = clip.source;
  
  // URLs específicas por tipo
  if (clip.audioUrl) compatibleClip.audioUrl = clip.audioUrl;
  if (clip.videoUrl) compatibleClip.videoUrl = clip.videoUrl;
  if (clip.imageUrl) compatibleClip.imageUrl = clip.imageUrl;
  
  // Si tenemos alguna URL pero no la genérica, usamos la primera disponible
  if (!compatibleClip.url && !compatibleClip.source) {
    compatibleClip.url = clip.audioUrl || clip.videoUrl || clip.imageUrl || '';
    compatibleClip.source = compatibleClip.url;
  }
  
  // Copia el resto de propiedades si existen
  if (clip.trackId) compatibleClip.trackId = clip.trackId;
  if (clip.thumbnail) compatibleClip.thumbnail = clip.thumbnail;
  if (clip.waveform) compatibleClip.waveform = clip.waveform;
  if (clip.textContent) compatibleClip.textContent = clip.textContent;
  if (clip.metadata) compatibleClip.metadata = clip.metadata;
  if (clip.trimStart !== undefined) compatibleClip.trimStart = clip.trimStart;
  if (clip.trimEnd !== undefined) compatibleClip.trimEnd = clip.trimEnd;
  if (clip.shotType) compatibleClip.shotType = clip.shotType;
  if (clip.createdAt) compatibleClip.createdAt = clip.createdAt;
  
  return compatibleClip;
}