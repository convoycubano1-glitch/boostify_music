/**
 * Constantes para el editor de timeline
 * Define valores base para toda la configuración del timeline
 */

// Configuración de visualización y zoom
export const PIXELS_PER_SECOND = 100; // Escala visual base (píxeles por segundo)
export const MIN_ZOOM = 0.5; // Nivel mínimo de zoom
export const MAX_ZOOM = 5.0; // Nivel máximo de zoom
export const ZOOM_FACTOR_IN = 1.2; // Factor de aumento de zoom
export const ZOOM_FACTOR_OUT = 0.8; // Factor de reducción de zoom
export const MIN_TIMELINE_WIDTH = 800; // Ancho mínimo del timeline en píxeles

// Configuración de capas
export enum LayerType {
  AUDIO = 0,      // Clips de audio (música, voces, efectos sonoros)
  VIDEO_IMAGE = 1, // Clips de video e imágenes
  TEXT = 2,       // Textos y títulos
  EFFECTS = 3     // Efectos visuales y transiciones
}

// Mapa de tipos de capas para compatibilidad con TimelineEditor
export const LAYER_TYPES = {
  AUDIO: 0,
  VIDEO_IMAGE: 1,
  TEXT: 2,
  EFFECTS: 3
};

// Límites de capas por tipo
export const MAX_LAYERS = {
  [LayerType.AUDIO]: 8,
  [LayerType.VIDEO_IMAGE]: 10,
  [LayerType.TEXT]: 5,
  [LayerType.EFFECTS]: 5
};

// Configuración de clips
export enum ClipType {
  AUDIO = 'audio',
  VIDEO = 'video',
  IMAGE = 'image',
  TEXT = 'text',
  EFFECT = 'effect'
}

// Límites de duración para clips
export const MAX_CLIP_DURATION = 300; // 5 minutos máximo por clip
export const MIN_CLIP_DURATION = 0.3; // Duración mínima en segundos

// Configuración de la línea de tiempo
export const DEFAULT_TIMELINE_DURATION = 60; // Duración inicial de la línea de tiempo (segundos)
export const PLAYHEAD_WIDTH = 2; // Ancho del indicador de reproducción en píxeles
export const TIMELINE_HEIGHT = 200; // Altura total del timeline en píxeles

// Visualización de audio
export const WAVEFORM_HEIGHT = 80; // Altura del visualizador de forma de onda
export const BEAT_MARKER_HEIGHT = 20; // Altura de los marcadores de beat
export const BEAT_MARKER_WIDTH = 2; // Ancho de los marcadores de beat

// Navegación y autoscroll
export const AUTOSCROLL_THRESHOLD_FACTOR = 0.15; // Porcentaje del borde para activar autoscroll
export const SCROLL_SPEED_FACTOR = 5; // Velocidad de autoscroll
export const SCROLL_POSITION_FORWARD = 0.7; // Posición relativa para adelante
export const SCROLL_POSITION_BACKWARD = 0.3; // Posición relativa para atrás

// Colores por tipo de clip
export const CLIP_COLORS = {
  [ClipType.AUDIO]: '#3b82f6', // Azul
  [ClipType.VIDEO]: '#8b5cf6', // Violeta
  [ClipType.IMAGE]: '#10b981', // Verde
  [ClipType.TEXT]: '#f59e0b',  // Ámbar
  [ClipType.EFFECT]: '#ec4899'  // Rosa
};

// Configuración de snap y alineación
export const SNAP_THRESHOLD = 0.2; // Umbral de snap en segundos
export const BEAT_SNAP_ENABLED_DEFAULT = true; // Snap a beats habilitado por defecto

// Mensajes de error
export const ERROR_MESSAGES = {
  INVALID_DURATION: 'La duración del clip no es válida',
  CLIP_OVERLAP: 'El clip se superpone con otro clip existente',
  INVALID_TIME_RANGE: 'El rango de tiempo es inválido',
  MAX_DURATION_EXCEEDED: 'Se ha excedido la duración máxima permitida',
  INVALID_CLIP_TYPE: 'Tipo de clip no válido',
  LAYER_LIMIT_REACHED: 'Se ha alcanzado el límite de capas para este tipo'
};

// Parámetros de BPM (beats por minuto)
export const DEFAULT_BPM = 120; // BPM predeterminado
export const MIN_BPM = 40; // BPM mínimo detectable
export const MAX_BPM = 220; // BPM máximo detectable

// Configuración de interfaz
export const CLIP_HANDLE_WIDTH = 8; // Ancho de los manejadores de redimensionamiento
export const LAYER_HEIGHT = 50; // Altura predeterminada de cada capa
export const TIMELINE_SCALES = [5, 10, 30, 60, 300, 600]; // Escalas de tiempo en segundos
export const DEFAULT_RULER_INTERVAL = 10; // Intervalo de regla predeterminado (segundos)

// Configuración de rendimiento
export const MAX_VISIBLE_TRACKS = 10; // Número máximo de pistas visibles sin scrolling
export const RENDER_BUFFER_SECONDS = 5; // Buffer de renderizado antes/después de la vista actual

// Opciones de exportación/renderizado
export const EXPORT_FORMATS = ['mp4', 'webm', 'gif'];
export const DEFAULT_EXPORT_FORMAT = 'mp4';
export const DEFAULT_EXPORT_QUALITY = 'high';
export const EXPORT_QUALITIES = {
  low: { width: 640, height: 360, bitrate: '1M' },
  medium: { width: 1280, height: 720, bitrate: '5M' },
  high: { width: 1920, height: 1080, bitrate: '10M' }
};

// Configuración de efectos y transiciones
export const TRANSITION_TYPES = [
  'fade',
  'wipe',
  'slide',
  'zoom',
  'dissolve',
  'blur',
  'radial',
  'whip',
  'pixelate'
];

export const EFFECT_TYPES = [
  'blur',
  'brightness',
  'contrast',
  'grayscale',
  'hue-rotate',
  'invert',
  'opacity',
  'saturate',
  'sepia'
];

// Acciones en el timeline
export enum TimelineAction {
  PLAY = 'play',
  PAUSE = 'pause',
  STOP = 'stop',
  SEEK = 'seek',
  ADD_CLIP = 'add_clip',
  REMOVE_CLIP = 'remove_clip',
  RESIZE_CLIP = 'resize_clip',
  MOVE_CLIP = 'move_clip',
  SPLIT_CLIP = 'split_clip',
  COMBINE_CLIPS = 'combine_clips'
}

// Operaciones de clip
export enum ClipOperation {
  NONE = 'none',
  MOVE = 'move',
  RESIZE_START = 'resize_start',
  RESIZE_END = 'resize_end'
}