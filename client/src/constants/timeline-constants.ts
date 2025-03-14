/**
 * Constantes para el editor de timeline
 * Define valores constantes y enumeraciones para el editor de línea de tiempo
 */
import { ClipType, LayerType } from '../interfaces/timeline';

/**
 * Altura predeterminada de las capas
 */
export const DEFAULT_LAYER_HEIGHT = 60;

/**
 * Ancho de la cabecera de capas
 */
export const LAYER_HEADER_WIDTH = 150;

/**
 * Duración máxima permitida para clips (en segundos)
 */
export const MAX_CLIP_DURATION = 5; // 5 segundos máximo para clips

/**
 * Duración mínima permitida para clips (en segundos)
 */
export const MIN_CLIP_DURATION = 0.1; // 100ms mínimo para clips

/**
 * Nivel de zoom predeterminado
 * Determina cuántos píxeles por segundo se muestran en el timeline
 */
export const DEFAULT_ZOOM_LEVEL = 100; // 100 píxeles por segundo

/**
 * Colores predeterminados para cada tipo de capa
 */
export const LAYER_COLORS = {
  [LayerType.VIDEO_PRINCIPAL]: '#4a6bdd', // Azul
  [LayerType.VIDEO_SECUNDARIO]: '#6e5adc', // Púrpura
  [LayerType.IMAGEN]: '#4caf50', // Verde
  [LayerType.TEXTO]: '#ff9800', // Naranja
  [LayerType.AUDIO]: '#2196f3', // Azul claro
  [LayerType.EFECTOS]: '#e91e63', // Rosa
  [LayerType.IA_GENERADA]: '#ff5252', // Rojo
  [LayerType.TRANSICIONES]: '#9c27b0'  // Púrpura
};

/**
 * Nombres de las capas en español
 */
export const LAYER_NAMES = {
  [LayerType.VIDEO_PRINCIPAL]: 'Video Principal',
  [LayerType.VIDEO_SECUNDARIO]: 'Video Secundario',
  [LayerType.IMAGEN]: 'Imágenes',
  [LayerType.TEXTO]: 'Texto',
  [LayerType.AUDIO]: 'Audio',
  [LayerType.EFECTOS]: 'Efectos',
  [LayerType.IA_GENERADA]: 'Imágenes IA',
  [LayerType.TRANSICIONES]: 'Transiciones'
};

/**
 * Nombres de los tipos de clip en español
 */
export const CLIP_TYPE_NAMES = {
  [ClipType.VIDEO]: 'Video',
  [ClipType.IMAGE]: 'Imagen',
  [ClipType.AUDIO]: 'Audio',
  [ClipType.TEXT]: 'Texto',
  [ClipType.EFFECT]: 'Efecto',
  [ClipType.GENERATED_IMAGE]: 'Imagen IA',
  [ClipType.TRANSITION]: 'Transición',
  [ClipType.PLACEHOLDER]: 'Marcador'
};

/**
 * Tipos de operaciones que se pueden realizar en clips
 */
export enum ClipOperation {
  ADD = 'add',
  REMOVE = 'remove',
  MOVE = 'move',
  RESIZE = 'resize',
  UPDATE = 'update'
}

/**
 * Mensajes de error para validación de clips
 */
export const ERROR_MESSAGES = {
  DURATION_EXCEEDED: `La duración máxima permitida es de ${MAX_CLIP_DURATION} segundos.`,
  DURATION_TOO_SHORT: `La duración mínima permitida es de ${MIN_CLIP_DURATION} segundos.`,
  OVERLAP_NOT_ALLOWED: 'No se permite la superposición de clips en esta capa.',
  INVALID_LAYER: 'Este tipo de clip no puede ser colocado en esta capa.',
  INVALID_POSITION: 'Posición no válida para el clip.',
  AI_LAYER_RESTRICTION: 'Las imágenes generadas por IA solo pueden colocarse en la capa 7.'
};

/**
 * Mapeo de tipos de clips a capas válidas
 */
export const VALID_LAYER_TYPES = new Map<ClipType, LayerType[]>([
  [ClipType.VIDEO, [LayerType.VIDEO_PRINCIPAL, LayerType.VIDEO_SECUNDARIO]],
  [ClipType.IMAGE, [LayerType.IMAGEN]],
  [ClipType.AUDIO, [LayerType.AUDIO]],
  [ClipType.TEXT, [LayerType.TEXTO]],
  [ClipType.EFFECT, [LayerType.EFECTOS]],
  [ClipType.GENERATED_IMAGE, [LayerType.IA_GENERADA]],
  [ClipType.TRANSITION, [LayerType.TRANSICIONES]],
  [ClipType.PLACEHOLDER, [
    LayerType.VIDEO_PRINCIPAL, 
    LayerType.VIDEO_SECUNDARIO,
    LayerType.IMAGEN,
    LayerType.TEXTO,
    LayerType.AUDIO,
    LayerType.EFECTOS,
    LayerType.IA_GENERADA, 
    LayerType.TRANSICIONES
  ]]
]);