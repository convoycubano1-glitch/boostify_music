/**
 * Interfaces para el sistema de timeline del editor de videos musicales
 * Centraliza todas las definiciones de tipos utilizadas en el timeline
 */

/**
 * Representa un clip en la línea de tiempo
 * Los clips son los elementos básicos que conforman un video musical
 */
export interface TimelineClip {
  // Identificadores
  id: number;
  title: string;
  
  // Metadatos
  type: 'audio' | 'video' | 'image' | 'text' | 'effect';
  layer: number;
  
  // Posición y duración
  start: number;
  duration: number;
  
  // Estado del clip
  visible: boolean;
  locked: boolean;
  
  // Propiedades específicas por tipo
  audioUrl?: string;
  videoUrl?: string;
  imageUrl?: string;
  textContent?: string;
  
  // Propiedades para imágenes generadas por IA
  generatedImage?: boolean;
  generationPrompt?: string;
  
  // Propiedades para efectos especiales
  effectParams?: {
    intensity?: number;
    type?: string;
    [key: string]: any;
  };
  
  // Propiedades para control de transiciones
  transition?: {
    type: string;
    duration: number;
  };
  
  // Metadatos adicionales
  createdAt: Date;
  updatedAt?: Date;
  
  // Propiedades adicionales para la sincronización de labios (LipSync)
  lipsyncApplied?: boolean;
  lipsyncVideoUrl?: string;
  lipsyncProgress?: number;
  
  // Propiedades para movimientos de cámara
  cameraMovement?: {
    type: string;
    intensity: number;
    direction?: string;
  };
  
  // Campo genérico para propiedades adicionales específicas
  [key: string]: any;
}

/**
 * Configuración de una capa en la línea de tiempo
 */
export interface LayerConfig {
  id: number;
  name: string;
  type: number;
  color: string;
  height: number;
  visible: boolean;
  locked: boolean;
}

/**
 * Estado de edición de un clip en la línea de tiempo
 */
export interface ClipEditState {
  clipId: number | null;
  operation: 'move' | 'resize-start' | 'resize-end' | 'none';
  startX: number;
  startTime: number;
  clipStartPosition: number;
  clipDuration: number;
}

/**
 * Errores específicos del timeline
 */
export interface TimelineError {
  code: string;
  message: string;
  clipId?: number;
  layerId?: number;
  timestamp: Date;
}

/**
 * Marcadores de tiempo (beats, compases, etc.)
 */
export interface TimeMarker {
  time: number;
  type: 'beat' | 'bar' | 'section' | 'custom';
  label?: string;
}

/**
 * Estado del reproductor de la línea de tiempo
 */
export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  speed: number;
}

/**
 * Historia de acciones para deshacer/rehacer
 */
export interface TimelineAction {
  type: 'add' | 'remove' | 'update' | 'move' | 'resize';
  clipId: number;
  before: Partial<TimelineClip>;
  after: Partial<TimelineClip>;
  timestamp: Date;
}

/**
 * Requisitos de rendimiento del video
 */
export interface RenderSettings {
  resolution: {
    width: number;
    height: number;
  };
  format: 'mp4' | 'webm' | 'gif';
  quality: 'low' | 'medium' | 'high';
  fps: number;
  exportAudio: boolean;
  includeSubtitles: boolean;
}

/**
 * Proyección de la línea de tiempo para visualizar clips filtrados
 */
export interface TimelineView {
  startTime: number;
  endTime: number;
  visibleLayers: number[];
  filterTags?: string[];
  zoom: number;
}