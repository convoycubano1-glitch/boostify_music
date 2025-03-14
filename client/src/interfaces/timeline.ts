/**
 * Interfaces para el timeline editor de videos musicales
 * Define los tipos de datos principales usados en el timeline
 */
import { LayerType } from '../constants/timeline-constants';

/**
 * Representa un clip en el timeline
 * Puede ser de diferentes tipos: audio, video, imagen, texto, efecto
 */
export interface TimelineClip {
  id: number;                 // ID único del clip
  title: string;              // Título descriptivo
  start: number;              // Tiempo de inicio en segundos
  duration: number;           // Duración en segundos
  type: string;               // Tipo de clip (audio, video, imagen, etc.)
  layerId: number;            // ID de la capa a la que pertenece
  url?: string;               // URL del recurso (audio, video, imagen)
  text?: string;              // Texto para clips de tipo texto
  generatedImage?: boolean;   // Indica si es una imagen generada por IA
  color?: string;             // Color personalizado (opcional)
  volume?: number;            // Volumen para clips de audio/video (0-1)
  opacity?: number;           // Opacidad para clips visuales (0-1)
  lipsyncVideoUrl?: string;   // URL del video procesado con lipsync
  lipsyncApplied?: boolean;   // Indica si se aplicó sincronización labial
  lipsyncProgress?: number;   // Progreso de procesamiento de lipsync (0-100)
  properties?: any;           // Propiedades adicionales específicas del tipo
}

/**
 * Configuración de una capa en el timeline
 */
export interface LayerConfig {
  id: number;                 // ID único de la capa
  name: string;               // Nombre descriptivo
  type: LayerType;            // Tipo de capa (audio, video, etc.)
  visible: boolean;           // Visibilidad de la capa
  locked: boolean;            // Si la capa está bloqueada para edición
  height?: number;            // Altura personalizada (opcional)
  color?: string;             // Color personalizado (opcional)
  maxClips?: number;          // Número máximo de clips permitidos
  allowedTypes?: string[];    // Tipos de clips permitidos en esta capa
}

/**
 * Definición de la escala de tiempo para el timeline
 */
export interface TimelineScale {
  pixelsPerSecond: number;    // Píxeles por segundo (zoom)
  visibleStartTime: number;   // Tiempo inicial visible en la ventana
  visibleEndTime: number;     // Tiempo final visible en la ventana
  totalDuration: number;      // Duración total del proyecto
}

/**
 * Estado del playhead (cabezal de reproducción)
 */
export interface PlayheadState {
  time: number;               // Posición actual en segundos
  isPlaying: boolean;         // Si está reproduciendo
  speed: number;              // Velocidad de reproducción (0.5, 1, 1.5, 2)
}

/**
 * Estado completo del timeline
 */
export interface TimelineState {
  clips: TimelineClip[];      // Clips en el timeline
  layers: LayerConfig[];      // Configuración de capas
  scale: TimelineScale;       // Escala y configuración visual
  playhead: PlayheadState;    // Estado del playhead
  selectedClipId: number | null; // ID del clip seleccionado
  selectedLayerId: number | null; // ID de la capa seleccionada
  audioUrl?: string;          // URL del audio principal
  videoUrl?: string;          // URL del video principal
  beatMarkers?: number[];     // Marcadores de ritmo para sincronización
  historyIndex?: number;      // Índice actual en el historial para undo/redo
  history?: TimelineState[];  // Historial de estados para undo/redo
}

/**
 * Restricciones de timeline para validación de clips
 */
export interface TimelineConstraints {
  minClipDuration: number;    // Duración mínima de un clip
  maxClipDuration: number;    // Duración máxima de un clip
  maxOverlappingClips: number; // Máximo de clips superpuestos
  totalDuration: number;      // Duración máxima del timeline
  allowClipOverlap: boolean;  // Si permite superposición de clips
  aiGeneratedImageLayer: number; // Capa específica para imágenes generadas
}

/**
 * Props para el componente principal TimelineEditor
 */
export interface TimelineEditorProps {
  clips: TimelineClip[];
  layers?: LayerConfig[];
  duration: number;
  onClipsChange: (updatedClips: TimelineClip[]) => void;
  onTimeChange: (time: number) => void;
  onPlaybackStateChange: (isPlaying: boolean) => void;
  selectedClipId?: number | null;
  onSelectClip?: (clipId: number | null) => void;
  onAddClip?: (clip: Omit<TimelineClip, 'id'>) => void;
  onDeleteClip?: (clipId: number) => void;
  beatMarkers?: number[];
  showBeatGrid?: boolean;
  autoScroll?: boolean;
  initialTime?: number;
  readOnly?: boolean;
}

/**
 * Posición y tamaño visual de un clip en el timeline
 */
export interface ClipVisualPosition {
  left: number;        // Posición X en píxeles
  width: number;       // Ancho en píxeles
  layerIndex: number;  // Índice vertical (capa) 
}

/**
 * Resultado de una operación sobre clips
 */
export interface ClipOperationResult {
  success: boolean;
  clips?: TimelineClip[];
  error?: string;
  clipId?: number;
}