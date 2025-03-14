/**
 * Interfaces y tipos para el editor de timeline
 * Define la estructura y tipado de datos para los componentes del timeline
 */

/**
 * Tipo de clip en el timeline
 * Define los diferentes tipos de contenido que pueden existir en la línea de tiempo
 */
export enum ClipType {
  VIDEO = 'video',
  IMAGE = 'image',
  AUDIO = 'audio',
  TEXT = 'text',
  EFFECT = 'effect',
  GENERATED_IMAGE = 'generated_image',
  TRANSITION = 'transition',
  PLACEHOLDER = 'placeholder'
}

/**
 * Tipo de capa en el timeline
 * Define los diferentes tipos de capas que pueden existir en la línea de tiempo
 */
export enum LayerType {
  VIDEO_PRINCIPAL = 1,  // Capa principal de video
  VIDEO_SECUNDARIO = 2, // Capa para videos secundarios o b-roll
  IMAGEN = 3,           // Capa para imágenes estáticas
  TEXTO = 4,            // Capa para textos y títulos
  AUDIO = 5,            // Capa para audio
  EFECTOS = 6,          // Capa para efectos visuales
  IA_GENERADA = 7,      // Capa exclusiva para imágenes generadas por IA
  TRANSICIONES = 8      // Capa para transiciones entre clips
}

/**
 * Interfaz para un clip en el timeline
 * Representa un elemento individual en la línea de tiempo
 */
export interface TimelineClip {
  id: number;             // Identificador único del clip
  type: ClipType;         // Tipo de clip (video, imagen, audio, etc.)
  layerId: number;        // ID de la capa a la que pertenece
  start: number;          // Tiempo de inicio en segundos
  duration: number;       // Duración en segundos
  title: string;          // Título o nombre del clip
  url?: string;           // URL del recurso asociado (video, audio, imagen)
  color?: string;         // Color de visualización del clip
  opacity?: number;       // Opacidad visual del clip (0-1)
  generatedImage?: boolean; // Indica si es una imagen generada por IA
  lipsyncApplied?: boolean; // Indica si tiene sincronización labial aplicada
  lipsyncVideoUrl?: string; // URL del video con sincronización labial
  lipsyncProgress?: number; // Progreso de la sincronización labial (0-100)
  metadata?: {             // Metadatos adicionales
    [key: string]: any;
  };
}

/**
 * Interfaz para la configuración de una capa en el timeline
 * Define una capa individual que puede contener clips
 */
export interface LayerConfig {
  id: number;             // Identificador único de la capa
  name: string;           // Nombre descriptivo de la capa
  type: LayerType;        // Tipo de capa
  locked: boolean;        // Indica si la capa está bloqueada para edición
  visible: boolean;       // Indica si la capa es visible
  height: number;         // Altura en píxeles de la capa en el timeline
  color: string;          // Color de visualización de la capa
  metadata?: {            // Metadatos adicionales
    [key: string]: any;
  };
}

/**
 * Interfaz para el estado del timeline
 * Representa el estado completo del editor de línea de tiempo
 */
export interface TimelineState {
  clips: TimelineClip[];         // Lista de clips en el timeline
  layers: LayerConfig[];         // Configuración de capas
  currentTime: number;           // Tiempo actual de reproducción en segundos
  duration: number;              // Duración total del proyecto en segundos
  selectedClipId: number | null; // ID del clip seleccionado actualmente
  isDragging: boolean;           // Indica si se está arrastrando un clip
  isResizing: boolean;           // Indica si se está redimensionando un clip
  zoom: number;                  // Nivel de zoom del timeline (1 = 100%)
  beatGridEnabled: boolean;      // Indica si la cuadrícula de ritmo está habilitada
}

/**
 * Interfaz para reglas de validación de clips
 * Define las restricciones a aplicar a los clips del timeline
 */
export interface ClipConstraints {
  maxDuration: number;               // Duración máxima de un clip en segundos
  minDuration: number;               // Duración mínima de un clip en segundos
  allowOverlap: boolean;             // Permite que los clips se superpongan en una capa
  allowMultiLayer: boolean;          // Permite que un clip ocupe varias capas
  restrictAIToLayer?: LayerType;     // Restringe imágenes generadas por IA a una capa específica
  maxClipsPerLayer?: number;         // Número máximo de clips por capa
  validLayerTypes: Map<ClipType, LayerType[]>; // Mapa de tipos de clips a capas válidas
}