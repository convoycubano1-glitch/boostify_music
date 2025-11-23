/**
 * Constantes para el editor de timeline
 * 
 * Definición de constantes utilizadas en el editor de línea de tiempo
 * para vídeos musicales. Incluye configuraciones por defecto y valores límite.
 */

import { LayerType, ClipType } from '../interfaces/timeline';

// Re-export for easier imports
export type { LayerType, ClipType };

/**
 * Ancho en píxeles de la cabecera de cada capa
 */
export const LAYER_HEADER_WIDTH = 160;

/**
 * Altura por defecto en píxeles de cada capa en el timeline
 */
export const DEFAULT_LAYER_HEIGHT = 50;

/**
 * Duración máxima en segundos para los clips (restricción de 5 segundos)
 */
export const MAX_CLIP_DURATION = 5.0;

/**
 * Factor de zoom por defecto (píxeles por segundo)
 */
export const DEFAULT_ZOOM_FACTOR = 100;

/**
 * Mínimo factor de zoom permitido
 */
export const MIN_ZOOM_FACTOR = 20;

/**
 * Máximo factor de zoom permitido
 */
export const MAX_ZOOM_FACTOR = 300;

/**
 * Altura mínima permitida para capas
 */
export const MIN_LAYER_HEIGHT = 30;

/**
 * Altura máxima permitida para capas
 */
export const MAX_LAYER_HEIGHT = 200;

/**
 * Operaciones disponibles sobre clips
 */
export enum ClipOperation {
  MOVE = 'MOVE',         // Mover un clip
  RESIZE = 'RESIZE',     // Redimensionar un clip
  SPLIT = 'SPLIT',       // Dividir un clip
  JOIN = 'JOIN',         // Unir dos clips
  DUPLICATE = 'DUPLICATE', // Duplicar un clip
  DELETE = 'DELETE',     // Eliminar un clip
  CREATE = 'CREATE',     // Crear un nuevo clip
  UPDATE = 'UPDATE',     // Actualizar propiedades de un clip
  ADD = 'ADD'            // Añadir un clip
}

/**
 * Nombres de las capas según su tipo
 */
export const LAYER_NAMES: Record<LayerType, string> = {
  [LayerType.VIDEO_PRINCIPAL]: 'Video Principal',
  [LayerType.VIDEO_SECUNDARIO]: 'Video B-Roll',
  [LayerType.IMAGEN]: 'Imágenes',
  [LayerType.TEXTO]: 'Textos',
  [LayerType.AUDIO]: 'Audio',
  [LayerType.EFECTOS]: 'Efectos',
  [LayerType.IA_GENERADA]: 'IA Generada',
  [LayerType.TRANSICIONES]: 'Transiciones'
};

/**
 * Colores por defecto para las capas según su tipo
 */
export const DEFAULT_LAYER_COLORS: Record<LayerType, string> = {
  [LayerType.VIDEO_PRINCIPAL]: '#5E35B1',   // Morado
  [LayerType.VIDEO_SECUNDARIO]: '#1E88E5',  // Azul
  [LayerType.IMAGEN]: '#43A047',            // Verde
  [LayerType.TEXTO]: '#F4511E',             // Naranja
  [LayerType.AUDIO]: '#FB8C00',             // Ámbar
  [LayerType.EFECTOS]: '#8E24AA',           // Púrpura
  [LayerType.IA_GENERADA]: '#D81B60',       // Rosa
  [LayerType.TRANSICIONES]: '#546E7A'       // Gris azulado
};

/**
 * Alias para LAYER_COLORS (compatibilidad con importes existentes)
 */
export const LAYER_COLORS = DEFAULT_LAYER_COLORS;

/**
 * Colores para clips (alias de DEFAULT_LAYER_COLORS)
 */
export const CLIP_COLORS = DEFAULT_LAYER_COLORS;

/**
 * Configuración inicial predeterminada para capas
 */
export const DEFAULT_LAYERS = [
  {
    id: 1,
    name: 'Video Principal',
    type: LayerType.VIDEO_PRINCIPAL,
    color: DEFAULT_LAYER_COLORS[LayerType.VIDEO_PRINCIPAL],
    visible: true,
    locked: false
  },
  {
    id: 2,
    name: 'Video B-Roll',
    type: LayerType.VIDEO_SECUNDARIO,
    color: DEFAULT_LAYER_COLORS[LayerType.VIDEO_SECUNDARIO],
    visible: true,
    locked: false
  },
  {
    id: 3,
    name: 'Imágenes',
    type: LayerType.IMAGEN,
    color: DEFAULT_LAYER_COLORS[LayerType.IMAGEN],
    visible: true,
    locked: false
  },
  {
    id: 4,
    name: 'Textos',
    type: LayerType.TEXTO,
    color: DEFAULT_LAYER_COLORS[LayerType.TEXTO],
    visible: true,
    locked: false
  },
  {
    id: 5,
    name: 'Audio',
    type: LayerType.AUDIO,
    color: DEFAULT_LAYER_COLORS[LayerType.AUDIO],
    visible: true,
    locked: false
  },
  {
    id: 6,
    name: 'Efectos',
    type: LayerType.EFECTOS,
    color: DEFAULT_LAYER_COLORS[LayerType.EFECTOS],
    visible: true,
    locked: false
  },
  {
    id: 7,
    name: 'IA Generada',
    type: LayerType.IA_GENERADA,
    color: DEFAULT_LAYER_COLORS[LayerType.IA_GENERADA],
    visible: true,
    locked: false
  },
  {
    id: 8,
    name: 'Transiciones',
    type: LayerType.TRANSICIONES,
    color: DEFAULT_LAYER_COLORS[LayerType.TRANSICIONES],
    visible: true,
    locked: false
  }
];