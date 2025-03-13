/**
 * Constantes para el editor de línea de tiempo
 * Define tipos de capas, restricciones y configuraciones
 */

// Tipos de capa para el timeline
export enum LayerType {
  AUDIO = 'audio',
  IMAGE = 'image',
  VIDEO = 'video',
  TEXT = 'text',
  EFFECT = 'effect'
}

// Configuración por defecto para cada tipo de capa
export const LAYER_CONFIGS = {
  [LayerType.AUDIO]: {
    name: 'Audio',
    isIsolated: true,
    allowsMultipleClips: false,
    minDuration: 0.5,
    maxDuration: Infinity,
    color: 'orange'
  },
  [LayerType.IMAGE]: {
    name: 'Imagen',
    isIsolated: false,
    allowsMultipleClips: true,
    minDuration: 0.5,
    maxDuration: Infinity,
    color: 'blue'
  },
  [LayerType.VIDEO]: {
    name: 'Video',
    isIsolated: false,
    allowsMultipleClips: true,
    minDuration: 0.5,
    maxDuration: Infinity,
    color: 'green'
  },
  [LayerType.TEXT]: {
    name: 'Texto',
    isIsolated: false,
    allowsMultipleClips: true,
    minDuration: 0.5,
    maxDuration: Infinity,
    color: 'purple'
  },
  [LayerType.EFFECT]: {
    name: 'Efecto',
    isIsolated: false,
    allowsMultipleClips: true,
    minDuration: 0.5,
    maxDuration: Infinity,
    color: 'pink'
  }
};

// Configuración para capas predefinidas en el editor
export const DEFAULT_LAYERS = [
  {
    id: 0,
    name: 'Audio Principal',
    type: LayerType.AUDIO,
    isIsolated: true,
    visible: true,
    locked: false,
    color: 'orange'
  },
  {
    id: 1,
    name: 'Imágenes',
    type: LayerType.IMAGE,
    isIsolated: false,
    visible: true,
    locked: false,
    color: 'blue'
  },
  {
    id: 2,
    name: 'Textos',
    type: LayerType.TEXT,
    isIsolated: false,
    visible: true,
    locked: false,
    color: 'purple'
  },
  {
    id: 3,
    name: 'Efectos',
    type: LayerType.EFFECT,
    isIsolated: false,
    visible: true,
    locked: false,
    color: 'pink'
  }
];

// Restricciones para placeholders generados por IA
export const AI_PLACEHOLDER_RESTRICTIONS = {
  maxDuration: 5.0,
  minDuration: 0.5,
  allowedLayers: [1, 2] // Solo permitidos en capas de imágenes y textos
};

// Tipos de transiciones disponibles
export const TRANSITION_TYPES = [
  { id: 'crossfade', name: 'Fundido cruzado' },
  { id: 'wipe', name: 'Barrido' },
  { id: 'fade', name: 'Desvanecer' },
  { id: 'slide', name: 'Deslizar' },
  { id: 'zoom', name: 'Zoom' }
];

// Tipos de efectos disponibles
export const EFFECT_TYPES = [
  { id: 'blur', name: 'Desenfoque' },
  { id: 'glow', name: 'Resplandor' },
  { id: 'sepia', name: 'Sepia' },
  { id: 'grayscale', name: 'Escala de grises' },
  { id: 'saturation', name: 'Saturación' },
  { id: 'custom', name: 'Personalizado' }
];

// Tipos de operaciones con clips
export enum ClipOperation {
  NONE = 'none',        // Sin operación
  SELECT = 'select',    // Seleccionar clip
  MOVE = 'move',        // Mover clip
  RESIZE = 'resize',    // Redimensionar clip
  SPLIT = 'split',      // Cortar clip
  DELETE = 'delete',    // Eliminar clip
  DUPLICATE = 'duplicate', // Duplicar clip
  TRANSITION = 'transition' // Agregar transición
}