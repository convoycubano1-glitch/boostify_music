/**
 * Tipos para el Editor Profesional de Video
 * 
 * Este archivo contiene todas las definiciones de tipos esenciales
 * para el editor de video profesional, incluyendo clips, efectos,
 * marcadores, y estado general.
 */

// Clip básico que se puede colocar en la línea de tiempo
export interface TimelineClip {
  id: string;
  type: 'video' | 'audio' | 'image' | 'text';
  title: string;
  url?: string;
  startTime: number;
  duration: number;
  trackId?: string;
  content?: string;  // Para clips de texto
  effects?: Effect[];
  color?: string;     // Para identificar clips visualmente
  thumbnailUrl?: string; // URL de miniatura para clips de video
  locked?: boolean;  // Indica si el clip está bloqueado para edición
}

// Efectos que se pueden aplicar a clips
export interface Effect {
  id: string;
  type: 'filter' | 'text' | 'transform' | 'transition' | 'overlay' | 'color';
  name: string;
  startTime: number;
  duration: number;
  parameters: Record<string, any>;
  properties?: Record<string, any>; // Propiedades adicionales para configuración
  endTime?: number;      // Tiempo de finalización calculado
  clipId?: string;       // ID del clip al que pertenece
}

// Marcadores de tiempo para análisis de ritmo
export interface BeatMarker {
  id: string;
  time: number;
  label: string;
  type: 'beat' | 'bar' | 'section' | 'downbeat';
  intensity: number;  // De 0 a 1
}

// Marcador para secciones musicales
export interface SectionMarker {
  id: string;
  startTime: number;
  endTime: number;
  name: string;
  type: 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'custom';
  color: string;
  label?: string; // Etiqueta adicional para visualización
}

// Pista de audio específica
export interface AudioTrack {
  id: string;
  type: 'audio';
  name: string;
  url: string;
  waveform: number[];
  startTime: number;
  duration: number;
  volume: number;
  source?: 'music' | 'vocal' | 'sfx' | 'ambience';
  muted?: boolean;
  loop?: boolean;
}

// Configuración de subtítulos o textos
export interface TextStyle {
  color: string;
  fontSize: number;
  fontWeight: string;
  fontFamily?: string;
  textAlign?: 'left' | 'center' | 'right';
  position: 'top' | 'middle' | 'bottom' | 'center';
}

// Valores por defecto para estilos de texto
export const defaultTextStyle: TextStyle = {
  color: '#ffffff',
  fontSize: 18,
  fontWeight: 'normal',
  fontFamily: 'Arial, sans-serif',
  textAlign: 'center',
  position: 'bottom'
};

// Transcripción para subtítulos
export interface Transcription {
  id: string;
  startTime: number;
  endTime: number;
  text: string;
  type: 'subtitle' | 'caption' | 'verse' | 'chorus' | 'bridge' | 'intro' | 'outro' | 'custom';
  style?: TextStyle;
  language?: string; // Idioma de la transcripción
  audioId?: string; // ID del audio relacionado
  confidence?: number; // Nivel de confianza en la transcripción automática
}

// Movimientos de cámara para efectos
export interface CameraMovement {
  id: string;
  type: 'pan' | 'zoom' | 'tilt' | 'track' | 'dolly';
  startTime: number;
  duration: number;
  startPosition: { x: number; y: number; z: number };
  endPosition: { x: number; y: number; z: number };
  easing: string;
  name?: string;
  parameters?: Record<string, any>;
  // Propiedades adicionales para animaciones
  start?: { x: number; y: number; z: number; rotation?: number };
  end?: { x: number; y: number; z: number; rotation?: number };
}

// Configuración general del proyecto
export interface EditorSettings {
  resolution: { width: number; height: number };
  frameRate: number;
  audioSampleRate: number;
  outputFormat: 'mp4' | 'webm' | 'gif';
  quality: 'draft' | 'medium' | 'high';
}

// Entrada en el historial para deshacer/rehacer
export interface HistoryEntry {
  state: Partial<EditorState>;
  timestamp: Date;
  description: string;
}

// Estado completo del editor
export interface EditorState {
  // Metadatos del proyecto
  projectName: string;
  projectId: string;
  settings: EditorSettings;
  
  // Estado de reproducción
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  
  // Selección actual
  selectedClipId?: string;
  selectedTrackId?: string;
  selectedEffectId?: string;
  
  // Zoom y vista
  zoom: number;
  timelineScroll: number;
  
  // Contenido
  timelineClips: TimelineClip[];
  audioTracks: AudioTrack[];
  transcriptions: Transcription[];
  beatMarkers: BeatMarker[];
  sectionMarkers: SectionMarker[];
  cameraMovements: CameraMovement[];
  
  // Historial de cambios
  history: HistoryEntry[];
  historyIndex: number;
  
  // Modo de persistencia
  persistenceMode: 'local' | 'cloud' | 'none';
  lastSaved?: Date;
  saveStatus?: 'saved' | 'unsaved' | 'saving';
}

// Utilidades para gestionar el estado del editor
export const EditorStateUtils = {
  /**
   * Crea un estado vacío del editor para un nuevo proyecto
   */
  createEmptyState(): EditorState {
    return {
      projectName: 'Proyecto sin título',
      projectId: crypto.randomUUID(),
      settings: {
        resolution: { width: 1920, height: 1080 },
        frameRate: 30,
        audioSampleRate: 44100,
        outputFormat: 'mp4',
        quality: 'medium'
      },
      currentTime: 0,
      duration: 60, // 60 segundos por defecto
      isPlaying: false,
      zoom: 1,
      timelineScroll: 0,
      timelineClips: [],
      audioTracks: [],
      transcriptions: [],
      beatMarkers: [],
      sectionMarkers: [],
      cameraMovements: [],
      history: [],
      historyIndex: -1,
      persistenceMode: 'local'
    };
  },
  
  /**
   * Crea un nuevo proyecto con configuraciones personalizadas
   */
  createNewProject(params?: {
    name?: string;
    duration?: number;
    resolution?: { width: number; height: number };
    frameRate?: number;
  }): EditorState {
    const emptyState = this.createEmptyState();
    
    return {
      ...emptyState,
      projectName: params?.name || 'Proyecto sin título',
      duration: params?.duration || 60,
      settings: {
        ...emptyState.settings,
        resolution: params?.resolution || emptyState.settings.resolution,
        frameRate: params?.frameRate || emptyState.settings.frameRate
      }
    };
  },
  
  /**
   * Añade una entrada al historial para deshacer/rehacer
   */
  addHistoryEntry(
    state: EditorState,
    partialState: Partial<EditorState>,
    description: string
  ): EditorState {
    // Crear una copia del estado actual
    const newState = { ...state, ...partialState };
    
    // Si estamos en medio del historial, eliminar entradas posteriores
    const newHistory = newState.historyIndex < newState.history.length - 1
      ? newState.history.slice(0, newState.historyIndex + 1)
      : [...newState.history];
      
    // Añadir la nueva entrada al historial
    newHistory.push({
      state: partialState,
      timestamp: new Date(),
      description
    });
    
    // Actualizar el estado con el nuevo historial
    return {
      ...newState,
      history: newHistory,
      historyIndex: newHistory.length - 1,
      saveStatus: 'unsaved'
    };
  },
  
  /**
   * Retrocede en el historial
   */
  undo(state: EditorState): EditorState {
    if (state.historyIndex < 0) {
      return state; // No hay nada que deshacer
    }
    
    // Obtener la entrada actual del historial
    const currentEntry = state.history[state.historyIndex];
    
    // Revertir los cambios
    const prevState = { ...state };
    
    // Recorrer todas las propiedades de la entrada y restaurar sus valores previos
    Object.keys(currentEntry.state).forEach(key => {
      if (state.historyIndex > 0) {
        // Buscar la propiedad en entradas anteriores
        for (let i = state.historyIndex - 1; i >= 0; i--) {
          if (key in state.history[i].state) {
            // @ts-ignore - Accedemos dinámicamente a las propiedades
            prevState[key] = state.history[i].state[key];
            break;
          }
        }
      } else {
        // Si es la primera entrada, volver al estado vacío
        const emptyState = this.createEmptyState();
        // @ts-ignore - Accedemos dinámicamente a las propiedades
        prevState[key] = emptyState[key];
      }
    });
    
    // Actualizar el índice de historial
    return {
      ...prevState,
      historyIndex: state.historyIndex - 1,
      saveStatus: 'unsaved'
    };
  },
  
  /**
   * Avanza en el historial
   */
  redo(state: EditorState): EditorState {
    if (state.historyIndex >= state.history.length - 1) {
      return state; // No hay nada que rehacer
    }
    
    // Obtener la entrada siguiente del historial
    const nextEntry = state.history[state.historyIndex + 1];
    
    // Aplicar los cambios
    return {
      ...state,
      ...nextEntry.state,
      historyIndex: state.historyIndex + 1,
      saveStatus: 'unsaved'
    };
  },
  
  /**
   * Busca clips que estén en un rango de tiempo específico
   */
  findClipsInTimeRange(state: EditorState, startTime: number, endTime: number): TimelineClip[] {
    return state.timelineClips.filter(clip => {
      const clipEnd = clip.startTime + clip.duration;
      return (clip.startTime <= endTime && clipEnd >= startTime);
    });
  },
  
  /**
   * Busca clips que pertenezcan a una pista específica
   */
  findClipsInTrack(state: EditorState, trackId: string): TimelineClip[] {
    return state.timelineClips.filter(clip => clip.trackId === trackId);
  },
  
  /**
   * Encuentra efectos activos en un momento específico
   */
  findActiveEffectsAtTime(state: EditorState, time: number): Effect[] {
    const allEffects: Effect[] = [];
    
    // Recopilar todos los efectos de todos los clips
    state.timelineClips.forEach(clip => {
      if (clip.effects && Array.isArray(clip.effects)) {
        clip.effects.forEach(effect => {
          const effectEndTime = effect.startTime + effect.duration;
          if (effect.startTime <= time && effectEndTime >= time) {
            allEffects.push(effect);
          }
        });
      }
    });
    
    return allEffects;
  }
};

// Tipo visual para efectos (usado en previsualizaciones)
export interface VisualEffect {
  id: string;
  type: string;
  name: string;
  description: string;
  thumbnail?: string;
  category: string;
  previewUrl?: string;
  parameters?: Record<string, any>;
  intensity?: number;
}