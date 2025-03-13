/**
 * Constantes para el Timeline Editor
 * Centraliza todos los valores, umbrales y configuraciones fijas
 */

// Límites de duración y tamaño
export const MAX_CLIP_DURATION = 5.0; // 5 segundos
export const MIN_CLIP_DURATION = 0.5; // 0.5 segundos

// Factores de zoom
export const ZOOM_FACTOR_IN = 1.5; // Incremento de zoom
export const ZOOM_FACTOR_OUT = 1.5; // Decremento de zoom
export const MAX_ZOOM = 10;
export const MIN_ZOOM = 0.1;

// Constantes para el scrolling automático
export const AUTOSCROLL_THRESHOLD_FACTOR = 0.25; // Porcentaje de la ventana visible
export const SCROLL_POSITION_FORWARD = 0.6; // Posición del playhead cuando avanza
export const SCROLL_POSITION_BACKWARD = 0.4; // Posición del playhead cuando retrocede

// Configuraciones visuales y estilos
export const WAVEFORM_SAMPLES = 2000; // Número de muestras para visualización de forma de onda
export const WAVEFORM_PRIMARY_COLOR = 'rgba(249, 115, 22, 0.4)';
export const WAVEFORM_PROGRESS_COLOR = 'rgba(249, 115, 22, 0.8)';
export const WAVEFORM_HEIGHT = 80;

// Colores para los tipos de clips
export const CLIP_COLORS = {
  video: 'bg-purple-500',
  image: 'bg-green-500',
  audio: 'bg-blue-500',
  text: 'bg-amber-500',
  transition: 'bg-pink-500',
  effect: 'bg-indigo-500',
};

// Capas (layers) para organización vertical
export const LAYERS = {
  AUDIO: 0,
  VIDEO: 1,
  TEXT: 2,
  EFFECT: 3,
};

// Transiciones entre animaciones
export const ANIMATION_DURATION = 0.05; // Duración de animación del playhead
export const PLAYHEAD_ANIMATION_EASE = "linear";

// Configuraciones de interacción
export const INTERACT_MIN_RESIZE_WIDTH = 10;