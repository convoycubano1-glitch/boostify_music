/**
 * Constantes para el timeline editor
 * Contiene valores, dimensiones, tipos y mensajes de error para el editor
 */

// Tipos de capas en el timeline
export enum LayerType {
  AUDIO = 'audio',      // Capas de audio (música, efectos, voces)
  VIDEO = 'video',      // Capas de video (filmaciones, B-roll)
  IMAGE = 'image',      // Capas de imagen (fotos, ilustraciones, generadas)
  TEXT = 'text',        // Capas de texto (subtítulos, títulos)
  EFFECTS = 'effect',   // Capas de efectos (transiciones, filtros)
  TRANSITION = 'transition', // Capas de transición entre clips
  AI_PLACEHOLDER = 'ai_placeholder' // Capas para contenido generado por IA
}

// Operaciones posibles con clips
export enum ClipOperation {
  ADD = 'add',              // Añadir un nuevo clip
  REMOVE = 'remove',        // Eliminar un clip existente
  MOVE = 'move',            // Mover un clip
  RESIZE = 'resize',        // Cambiar duración de un clip
  DUPLICATE = 'duplicate'   // Duplicar un clip existente
}

// Dimensiones del timeline y elementos relacionados
export const TIMELINE_DIMENSIONS = {
  LAYER_LABEL_WIDTH: 150,    // Ancho de la etiqueta de la capa
  DEFAULT_LAYER_HEIGHT: 40,  // Altura predeterminada de las capas
  BEAT_MARKER_HEIGHT: 10,    // Altura de los marcadores de ritmo
  MINIMUM_SCALE: 50,         // Escala mínima de píxeles por segundo
  MAXIMUM_SCALE: 500,        // Escala máxima de píxeles por segundo
  DEFAULT_SCALE: 100,        // Escala predeterminada para visualización
  MINIMUM_CLIP_DURATION: 0.1, // Duración mínima de un clip en segundos
  PIXELS_PER_SECOND: 100,    // Píxeles por segundo (escala base)
  SNAP_THRESHOLD_PIXELS: 5,  // Umbral para ajuste magnético en píxeles
}

// Mensajes de error para validación de clips
export const VALIDATION_ERRORS = {
  CLIP_TOO_SHORT: "El clip no puede ser más corto que 0.1 segundos",
  CLIP_TOO_LONG: "El clip no puede ser más largo que 5 segundos",
  CLIP_COLLISION: "El clip se superpone con otro clip en la misma capa",
  INVALID_LAYER: "Tipo de clip no válido para esta capa",
  AI_IMAGE_WRONG_LAYER: "Las imágenes generadas por IA solo pueden colocarse en la capa 7",
  POSITION_OUT_OF_BOUNDS: "La posición del clip está fuera de los límites del timeline",
  CLIP_OVERLAP: "No se permite superposición de clips",
  INVALID_DURATION: "Duración de clip no válida",
  MAX_DURATION_EXCEEDED: "Se ha excedido la duración máxima de 5 segundos",
  AI_PLACEHOLDER_DURATION: "Los marcadores de IA tienen una duración fija",
  CANNOT_DELETE_ISOLATED_LAYER: "No se puede eliminar un clip en una capa bloqueada",
  CANNOT_MODIFY_ISOLATED_CLIP: "No se puede modificar un clip bloqueado",
  INVALID_OPERATION: "Operación no válida para este tipo de clip"
}

// Configuración de duración de los clips
export const CLIP_DURATION = {
  DEFAULT: 2.0,          // Duración predeterminada para clips nuevos
  MINIMUM: 0.1,          // Duración mínima permitida
  MAXIMUM: 5.0,          // Duración máxima permitida (requerimiento)
  AI_PLACEHOLDER: 3.0    // Duración fija para marcadores de IA
}

// Colores para los diferentes tipos de capas
export const LAYER_COLORS = {
  audio: '#4299e1',      // Azul para audio
  video: '#48bb78',      // Verde para video
  image: '#38b2ac',      // Turquesa para imágenes
  text: '#ed8936',       // Naranja para texto
  effect: '#9f7aea',     // Púrpura para efectos
  ai: '#d69e2e'          // Amarillo para contenido IA
}

// Duración máxima del timeline en segundos
export const TIMELINE_MAX_DURATION = 300;  // 5 minutos