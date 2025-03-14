/**
 * Interfaz unificada para clips de línea de tiempo
 * 
 * Esta interfaz proporciona una estructura común para todos los tipos de clips
 * en el editor de línea de tiempo, garantizando compatibilidad entre componentes.
 */
export interface TimelineClipUnified {
  // Propiedades básicas de identificación y tiempo
  id: number;
  title: string;
  name?: string; // Para compatibilidad con implementaciones anteriores
  description?: string;
  
  // Propiedades de posición y duración
  start: number;
  startTime?: number; // Para compatibilidad con implementaciones anteriores
  duration: number;
  endTime?: number; // Para compatibilidad con implementaciones anteriores
  
  // Tipo y capa
  type: 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text';
  layer: number; // 0=audio, 1=video/imagen, 2=texto, 3=efectos
  
  // Propiedades visuales
  thumbnail?: string;
  waveform?: number[];
  imagePrompt?: string;
  shotType?: string;
  
  // Propiedades de visibilidad y bloqueo
  visible?: boolean;
  locked?: boolean;
  
  // URLs de recursos
  url?: string;         // URL genérica para compatibilidad
  source?: string;      // Source para compatibilidad con editor-context
  imageUrl?: string;    // URL específica para imágenes
  videoUrl?: string;    // URL específica para videos
  movementUrl?: string; // URL específica para movimientos
  audioUrl?: string;    // URL específica para audio
  
  // Propiedades de sincronización labial migrando a metadata
  // Estas propiedades están siendo deprecadas en favor de metadata.lipsync
  lipsyncApplied?: boolean;
  lipsyncVideoUrl?: string; 
  lipsyncProgress?: number;
  
  // Propiedades de transición
  transitionType?: 'crossfade' | 'wipe' | 'fade' | 'slide' | 'zoom';
  transitionDuration?: number;
  
  // Propiedades de efecto
  effectType?: 'blur' | 'glow' | 'sepia' | 'grayscale' | 'saturation' | 'custom';
  effectIntensity?: number;
  
  // Propiedades de texto
  textContent?: string;
  textStyle?: 'normal' | 'bold' | 'italic' | 'title' | 'subtitle' | 'caption';
  textColor?: string;
  
  // Metadatos adicionales
  metadata?: {
    section?: string;    // Sección musical (coro, verso, etc.)
    sourceIndex?: number; // Índice en el guion original
    
    // Propiedades de movimiento
    movementApplied?: boolean;
    movementPattern?: string;
    movementIntensity?: number;
    
    // Propiedades de intercambio de caras
    faceSwapApplied?: boolean;
    
    // Integración de músico
    musicianIntegrated?: boolean;
    
    // Propiedades de sincronización de labios en metadata (recomendado)
    lipsync?: {
      applied: boolean;
      videoUrl?: string;
      progress?: number;
      timestamp?: string;
    };
  };
  
  // Propiedades para compatibilidad con interfaces de track
  trackId?: string;
  trimStart?: number;
  trimEnd?: number;
  
  // Información de tiempo
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Asegura que un objeto clip sea compatible con la interfaz TimelineClipUnified
 * Esta función toma un objeto y garantiza que tenga todas las propiedades
 * requeridas por TimelineClipUnified, agregando propiedades faltantes con valores por defecto.
 * 
 * @param clip Objeto clip a validar y normalizar
 * @returns Objeto clip compatible con TimelineClipUnified
 */
export function ensureCompatibleClip(clip: any): TimelineClipUnified {
  if (!clip) {
    throw new Error('El clip proporcionado es nulo o undefined');
  }

  // Asegurar propiedades básicas
  const id = clip.id !== undefined ? clip.id : Math.floor(Math.random() * 10000);
  
  // Asegurar propiedades básicas para el manejo en la línea de tiempo
  // Priorizar valores existentes para garantizar compatibilidad
  const start = clip.start !== undefined ? clip.start : 
               clip.startTime !== undefined ? clip.startTime : 0;
  
  const duration = clip.duration !== undefined ? clip.duration : 
                  (clip.endTime !== undefined && clip.start !== undefined) ?
                  clip.endTime - clip.start : 5; // Valor por defecto
  
  // Asegurar propiedades adicionales que se requieren
  const result: TimelineClipUnified = {
    id,
    title: clip.title || clip.name || `Clip ${id}`,
    name: clip.name || clip.title || `Clip ${id}`, // Compatibilidad para ambos campos
    description: clip.description || '',
    
    // Propiedades de tiempo con valores normalizados
    start,
    startTime: start, // Compatibilidad con interfaz anterior
    duration,
    endTime: start + duration, // Compatibilidad con interfaz anterior
    
    // Tipo y capa
    type: clip.type || 'video',
    layer: typeof clip.layer === 'number' ? clip.layer : 1,
    
    // Visibilidad
    visible: clip.visible !== undefined ? clip.visible : true,
    locked: clip.locked !== undefined ? clip.locked : false,
    
    // URLs y recursos
    url: clip.url || clip.imageUrl || clip.videoUrl || clip.audioUrl || undefined,
    source: clip.source || clip.url || clip.imageUrl || clip.videoUrl || clip.audioUrl || undefined,
    
    // Copiar propiedades específicas
    ...clip
  };
  
  // Asegurar que metadata exista
  if (!result.metadata) {
    result.metadata = {};
  }
  
  // Migrar propiedades de lipsync a metadata si existen en el clip original
  if (clip.lipsyncApplied && !result.metadata.lipsync) {
    result.metadata.lipsync = {
      applied: clip.lipsyncApplied || false,
      videoUrl: clip.lipsyncVideoUrl,
      progress: clip.lipsyncProgress
    };
  }
  
  // Log para depuración de desarrollo
  console.log('Clip normalizado:', result);
  
  return result;
}

/**
 * Convierte un array de clips a un formato compatible con TimelineClipUnified
 * 
 * @param clips Array de clips a normalizar
 * @returns Array de clips compatibles con TimelineClipUnified
 */
export function normalizeClips(clips: any[]): TimelineClipUnified[] {
  if (!clips || !Array.isArray(clips)) {
    return [];
  }
  
  return clips.map(clip => ensureCompatibleClip(clip));
}