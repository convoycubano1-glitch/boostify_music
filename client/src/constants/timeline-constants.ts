/**
 * Constantes y configuraciones para el sistema de timeline del editor de videos
 * Este archivo centraliza todas las constantes utilizadas en los componentes del timeline
 */

/**
 * Enum para identificar tipos de capas en la línea de tiempo
 */
export enum LayerType {
  AUDIO = 0,
  VIDEO_IMAGE = 1,
  TEXT = 2,
  EFFECTS = 3,
  AI_GENERATED = 4
}

/**
 * Duración mínima permitida para un clip (en segundos)
 */
export const MIN_CLIP_DURATION = 0.5;

/**
 * Duración máxima permitida para un clip (en segundos)
 */
export const MAX_CLIP_DURATION = 5;

/**
 * Umbral para el ajuste automático (snap) en segundos
 */
export const SNAP_THRESHOLD = 0.25;

/**
 * Colores para tipos de clips específicos
 */
export const CLIP_COLORS = {
  audio: '#4CAF50',  // Verde
  video: '#2196F3',  // Azul
  image: '#9C27B0',  // Púrpura
  text: '#FF9800',   // Naranja
  effect: '#F44336', // Rojo
  ai: '#E91E63'      // Rosado
};

/**
 * Zoom predeterminado para la visualización del timeline
 */
export const DEFAULT_ZOOM = 1.0;

/**
 * Propiedades de configuración para cada tipo de capa
 */
export const LAYER_PROPERTIES: Record<LayerType, {
  name: string;
  color: string;
  height: number;
  allowedTypes: ('audio' | 'video' | 'image' | 'text' | 'effect')[];
}> = {
  [LayerType.AUDIO]: {
    name: 'Audio',
    color: '#4CAF50',
    height: 60,
    allowedTypes: ['audio']
  },
  [LayerType.VIDEO_IMAGE]: {
    name: 'Video e Imagen',
    color: '#2196F3',
    height: 80,
    allowedTypes: ['video', 'image']
  },
  [LayerType.TEXT]: {
    name: 'Texto',
    color: '#FF9800',
    height: 60,
    allowedTypes: ['text']
  },
  [LayerType.EFFECTS]: {
    name: 'Efectos',
    color: '#F44336',
    height: 60,
    allowedTypes: ['effect']
  },
  [LayerType.AI_GENERATED]: {
    name: 'Imágenes IA',
    color: '#E91E63',
    height: 80,
    allowedTypes: ['image']
  }
};

/**
 * Tipos de operaciones que se pueden realizar con clips
 */
export enum ClipOperation {
  NONE = 'none',
  MOVE = 'move',
  RESIZE_START = 'resize-start',
  RESIZE_END = 'resize-end',
  SPLIT = 'split',
  DELETE = 'delete',
  COPY = 'copy',
  PASTE = 'paste'
}

/**
 * Mensajes de error para diversas operaciones del timeline
 */
export const ERROR_MESSAGES = {
  CLIP_TOO_SHORT: `La duración mínima del clip es ${MIN_CLIP_DURATION} segundos.`,
  CLIP_TOO_LONG: `La duración máxima del clip es ${MAX_CLIP_DURATION} segundos.`,
  CLIP_COLLISION: 'El clip colisiona con otro clip en la misma capa.',
  INVALID_LAYER: 'Este tipo de clip no está permitido en esta capa.',
  AI_IMAGE_WRONG_LAYER: 'Las imágenes generadas por IA deben estar en la capa específica para IA.',
  POSITION_OUT_OF_BOUNDS: 'La posición del clip está fuera de los límites permitidos.'
};

/**
 * Formato para etiquetas de tiempo en el timeline
 */
export const TIME_FORMAT = {
  FULL: 'mm:ss.S',  // Minutos:segundos.décimas 
  SHORT: 'ss.S'     // Segundos.décimas
};

/**
 * Dimensiones del timeline para renderizado
 */
export const TIMELINE_DIMENSIONS = {
  RULER_HEIGHT: 30,
  LAYER_LABEL_WIDTH: 120,
  MIN_CLIP_WIDTH: 50,
  PLAYHEAD_WIDTH: 2
};

/**
 * Métodos de interpolación para el movimiento de clips
 */
export enum InterpolationMethod {
  LINEAR = 'linear',
  EASE_IN = 'ease-in',
  EASE_OUT = 'ease-out',
  EASE_IN_OUT = 'ease-in-out'
}