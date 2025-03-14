/**
 * Constantes para el editor de línea de tiempo
 * 
 * Este archivo define todas las constantes utilizadas en el editor de línea de tiempo,
 * incluyendo tipos de capas, operaciones, dimensiones y mensajes de error.
 */

/**
 * Tipos de capas disponibles en la línea de tiempo
 */
export enum LayerType {
  AUDIO = 'audio',
  VIDEO = 'video',
  IMAGE = 'image',
  TEXT = 'text',
  EFFECT = 'effect',
  TRANSITION = 'transition',
  AI_PLACEHOLDER = 'ai_placeholder'
}

/**
 * Operaciones disponibles para clips
 */
export enum ClipOperation {
  NONE = 'none',
  ADD = 'add',
  DELETE = 'delete',
  MOVE = 'move',
  RESIZE_START = 'resize_start',
  RESIZE_END = 'resize_end',
  DUPLICATE = 'duplicate',
  SPLIT = 'split'
}

/**
 * Constantes para manejo de clips y visualización
 */
export const CLIP_HANDLE_WIDTH = 8;
export const MIN_CLIP_DURATION = 0.5; // Segundos
export const MAX_CLIP_DURATION = 600; // 10 minutos
export const SNAP_THRESHOLD = 0.5; // Segundos
export const LAYER_HEIGHT = 50; // Altura de cada capa en píxeles

/**
 * Colores para los diferentes tipos de capas
 */
export const CLIP_COLORS = {
  [LayerType.AUDIO]: {
    background: '#8A2BE2',
    border: '#7B68EE',
    text: '#FFFFFF',
    selected: '#9370DB'
  },
  [LayerType.VIDEO]: {
    background: '#4169E1',
    border: '#1E90FF',
    text: '#FFFFFF',
    selected: '#6495ED'
  },
  [LayerType.IMAGE]: {
    background: '#20B2AA',
    border: '#48D1CC',
    text: '#FFFFFF',
    selected: '#40E0D0'
  },
  [LayerType.TEXT]: {
    background: '#FF6347',
    border: '#FF7F50',
    text: '#FFFFFF',
    selected: '#FF8C69'
  },
  [LayerType.EFFECT]: {
    background: '#FFD700',
    border: '#FFA500',
    text: '#000000',
    selected: '#FFDB58'
  },
  [LayerType.TRANSITION]: {
    background: '#32CD32',
    border: '#3CB371',
    text: '#FFFFFF',
    selected: '#90EE90'
  },
  [LayerType.AI_PLACEHOLDER]: {
    background: '#BA55D3',
    border: '#DDA0DD',
    text: '#FFFFFF',
    selected: '#DA70D6'
  }
};

/**
 * Constantes para navegación y zoom
 */
export const PIXELS_PER_SECOND = 100;
export const DEFAULT_ZOOM = 1.0;
export const ZOOM_FACTOR_IN = 1.2;
export const ZOOM_FACTOR_OUT = 0.8;
export const MIN_ZOOM = 0.1;
export const MAX_ZOOM = 5.0;

/**
 * Constantes para auto-scroll
 */
export const AUTOSCROLL_THRESHOLD_FACTOR = 0.1;
export const SCROLL_POSITION_FORWARD = 1.0;
export const SCROLL_POSITION_BACKWARD = 0.0;

/**
 * Mensajes de error para diferentes operaciones
 */
export const ERROR_MESSAGES = {
  CLIP_OVERLAP: 'No se permite solapamiento entre clips',
  AI_PLACEHOLDER_DURATION: 'La duración máxima para placeholders de IA es',
  CANNOT_DELETE_ISOLATED_LAYER: 'No se puede eliminar este clip de capa aislada',
  CANNOT_MODIFY_ISOLATED_CLIP: 'No se pueden modificar clips en capas aisladas',
  INVALID_OPERATION: 'Operación no válida',
  INVALID_DURATION: 'La duración del clip no es válida',
  MAX_DURATION_EXCEEDED: `La duración máxima es ${MAX_CLIP_DURATION} segundos`
};