/**
 * Definiciones de tipos para el sistema de timeline
 * Centraliza todos los tipos y enumeraciones relacionados con el timeline
 */

/**
 * Tipo de clip en la línea de tiempo
 * Define los posibles tipos de contenido que pueden colocarse en el timeline
 */
export type ClipType = 'video' | 'image' | 'audio' | 'text' | 'effect' | 'transition';

/**
 * Interface para clips de línea de tiempo
 * Estructura base que todos los clips deben implementar
 */
export interface TimelineClip {
  id: number;
  start: number;
  duration: number;
  type: ClipType;
  layer: number;
  title: string;
  visible?: boolean;
  locked?: boolean;
  thumbnail?: string;
  description?: string;
  waveform?: number[];
  
  // Propiedades específicas por tipo
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  textContent?: string;
  
  // Propiedades para imágenes generadas
  imagePrompt?: string;
  shotType?: string;
  generatedImage?: boolean;
  
  // Propiedades para efectos
  effectParams?: Record<string, any>;
  
  // Propiedades para transiciones
  transitionType?: string;
  
  // Metadatos adicionales
  createdAt?: Date;
  updatedAt?: Date;
  tags?: string[];
}

/**
 * Configuración de una capa en el timeline
 */
export interface LayerConfig {
  id: number;
  name: string;
  type: number;
  locked: boolean;
  visible: boolean;
  height: number;
  color: string;
}

/**
 * Estado de reproducción del timeline
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  speed: number;
}

/**
 * Proyecto de timeline completo
 */
export interface TimelineProject {
  id: string;
  name: string;
  clips: TimelineClip[];
  layers: LayerConfig[];
  duration: number;
  createdAt: Date;
  updatedAt: Date;
  audioTrack?: string;
  videoTracks?: string[];
  version: string;
}