/**
 * Constantes para el Editor de Timeline
 * Centraliza la configuración y valores constantes usados en los componentes de timeline
 */

// Tipos de Clips
export enum ClipType {
  AUDIO = 'audio',
  VIDEO = 'video',
  IMAGE = 'image',
  TEXT = 'text',
  EFFECT = 'effect'
}

// Tipos de Layers (capas)
export enum LayerType {
  AUDIO = 0,
  VIDEO_IMAGE = 1,
  TEXT = 2,
  EFFECTS = 3
}

// Colores por tipo de clip (para mostrar en UI)
export const CLIP_COLORS = {
  [ClipType.AUDIO]: 'bg-blue-500', // Azul para clips de audio
  [ClipType.VIDEO]: 'bg-purple-500', // Morado para clips de video
  [ClipType.IMAGE]: 'bg-green-500', // Verde para imágenes
  [ClipType.TEXT]: 'bg-amber-500', // Ámbar para texto
  [ClipType.EFFECT]: 'bg-pink-500' // Rosa para efectos
};

// Duración máxima de clips en segundos
export const MAX_CLIP_DURATION = 5; // Mantener corto para performance optima
export const DEFAULT_TEXT_DURATION = 3;
export const DEFAULT_IMAGE_DURATION = 3;
export const DEFAULT_EFFECT_DURATION = 2;

// Límites de zoom y visualización 
export const MIN_ZOOM_LEVEL = 0.5;
export const MAX_ZOOM_LEVEL = 10;
export const DEFAULT_ZOOM_LEVEL = 2;
export const PIXELS_PER_SECOND = 100; // Base scale before zoom

// Opciones de renderizado
export const RENDER_WIDTH = 1920;
export const RENDER_HEIGHT = 1080;
export const RENDER_FPS = 30;

// Tamaños de componentes UI
export const TIMELINE_HEADER_HEIGHT = 40;
export const LAYER_HEIGHT = 70;
export const LAYER_GAP = 5;
export const LAYER_HEADER_WIDTH = 150;
export const TIMELINE_PADDING = 20;

// Máximo número de layers por tipo
export const MAX_LAYERS = {
  [LayerType.AUDIO]: 5,
  [LayerType.VIDEO_IMAGE]: 10,
  [LayerType.TEXT]: 5,
  [LayerType.EFFECTS]: 3
};

// WebSocket constants
export const WEBSOCKET_EVENTS = {
  PLAYBACK_START: 'playback:start',
  PLAYBACK_PAUSE: 'playback:pause',
  PLAYBACK_SEEK: 'playback:seek',
  PLAYBACK_STOP: 'playback:stop',
  CLIP_ADDED: 'clip:added',
  CLIP_REMOVED: 'clip:removed',
  CLIP_MOVED: 'clip:moved',
  CLIP_RESIZED: 'clip:resized',
  CLIP_PROPERTIES_CHANGED: 'clip:properties_changed',
  BEAT_DETECTED: 'audio:beat_detected',
  TIMELINE_RESET: 'timeline:reset',
  TIMELINE_SAVE: 'timeline:save',
  TIMELINE_LOAD: 'timeline:load'
};

// Beat detection settings
export const BEAT_DETECTION = {
  MIN_AMPLITUDE: 0.2,
  SENSITIVITY: 1.5,
  MIN_INTERVAL: 0.3 // Minimum time between beats in seconds
};

// Tipos de transiciones
export enum TransitionType {
  CUT = 'cut',
  CROSSFADE = 'crossfade',
  FADE_TO_BLACK = 'fade_to_black',
  FADE_TO_WHITE = 'fade_to_white',
  WIPE_LEFT = 'wipe_left',
  WIPE_RIGHT = 'wipe_right',
  ZOOM_IN = 'zoom_in',
  ZOOM_OUT = 'zoom_out',
  BLUR = 'blur'
}

// Duración predeterminada para transiciones en segundos
export const DEFAULT_TRANSITION_DURATION = 0.5;

// Efectos de texto
export enum TextEffect {
  NONE = 'none',
  FADE_IN = 'fade_in',
  FADE_OUT = 'fade_out',
  TYPING = 'typing',
  ZOOM_IN = 'zoom_in',
  BOUNCE = 'bounce',
  GLOW = 'glow',
  BLUR = 'blur',
  SLIDE_LEFT = 'slide_left',
  SLIDE_RIGHT = 'slide_right'
}

// Mensajes de error
export const ERROR_MESSAGES = {
  CLIP_OVERLAP: 'No se pueden superponer clips en la misma capa',
  INVALID_DURATION: 'La duración del clip no es válida',
  INVALID_TIME: 'El tiempo especificado no es válido',
  LAYER_FULL: 'La capa seleccionada está llena',
  WEBSOCKET_DISCONNECT: 'La conexión con el servidor se ha perdido',
  RENDER_FAILED: 'No se pudo renderizar el video'
};