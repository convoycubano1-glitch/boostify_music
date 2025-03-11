/**
 * Tipos para el Editor Profesional
 * 
 * Este archivo define los tipos y interfaces utilizados en los componentes
 * del editor profesional.
 */

/**
 * Estado general del editor
 */
export interface EditorState {
  // Información del proyecto
  projectId: string;
  projectName: string;
  projectDescription?: string;
  userId: string;
  
  // Contenido multimedia
  clips: Clip[];
  audioTracks: AudioTrack[];
  transcriptions: Transcription[];
  cameraMovements: CameraMovement[];
  visualEffects: VisualEffect[];
  
  // Análisis musical
  beats: Beat[];
  sections: Section[];
  
  // Estado reproducción
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  
  // Configuración
  settings: EditorSettings;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastSavedAt?: Date;
}

/**
 * Clip multimedia (video o imagen)
 */
export interface Clip {
  id: string;
  name: string;
  type: 'video' | 'image';
  source: string;
  startTime: number;
  endTime: number;
  duration?: number;
  thumbnail?: string;
  effects?: VisualEffect[];
  metadata?: Record<string, any>;
}

/**
 * Pista de audio
 */
export interface AudioTrack {
  id: string;
  name: string;
  source: string;
  type: 'music' | 'vocal' | 'sfx' | 'ambience';
  startTime: number;
  duration: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  waveform: number[];
  metadata?: Record<string, any>;
}

/**
 * Transcripción o subtítulo
 */
export interface Transcription {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'custom';
  language?: string;
  style?: {
    color: string;
    fontSize: number;
    fontWeight: string;
    position: 'top' | 'center' | 'bottom';
  };
  metadata?: Record<string, any>;
}

/**
 * Movimiento de cámara
 */
export interface CameraMovement {
  id: string;
  name: string;
  type: 'track' | 'zoom' | 'pan' | 'tilt' | 'dolly';
  startTime: number;
  duration: number;
  start: number;
  end: number;
  parameters?: Record<string, number>;
  metadata?: Record<string, any>;
}

/**
 * Efecto visual
 */
export interface VisualEffect {
  id: string;
  name: string;
  type: 'filter' | 'overlay' | 'transition' | 'zoom' | 'crop' | 'blur' | 'custom';
  startTime: number;
  duration: number;
  intensity: number;
  parameters?: Record<string, any>;
  metadata?: Record<string, any>;
}

/**
 * Beat o pulso en la música
 */
export interface Beat {
  id: string;
  time: number;
  type: 'beat' | 'bar';
  intensity: number;
  label?: string;
  bpm?: number;
  metadata?: Record<string, any>;
}

/**
 * Sección musical
 */
export interface Section {
  id: string;
  name: string;
  startTime: number;
  endTime: number;
  type: 'intro' | 'verse' | 'chorus' | 'bridge' | 'outro' | 'breakdown' | 'custom';
  color: string;
  metadata?: Record<string, any>;
}

/**
 * Timeline clip para representar cualquier elemento en la línea de tiempo
 */
export interface TimelineClip {
  id: string;
  title: string;
  type: 'video' | 'image' | 'audio' | 'text';
  start: number;
  duration: number;
  url: string;
  trackId: string;
  selected?: boolean;
  color?: string;
  end?: number;
  metadata?: Record<string, any>;
}

/**
 * Configuración del editor
 */
export interface EditorSettings {
  language: 'es' | 'en';
  theme: 'light' | 'dark' | 'system';
  autoSave: boolean;
  autoSaveInterval: number;
  videoQuality: 'draft' | 'standard' | 'high';
  frameRate: number;
  backgroundColor: string;
  showTimecode: boolean;
  snapToGrid: boolean;
  gridSize: number;
  defaultTransitionDuration: number;
}

/**
 * Historia del proyecto
 */
export interface ProjectHistory {
  id: string;
  projectId: string;
  userId: string;
  action: 'create' | 'update' | 'delete' | 'export';
  timestamp: Date;
  details?: Record<string, any>;
}

/**
 * Objeto de exportación
 */
export interface ExportResult {
  id: string;
  projectId: string;
  userId: string;
  format: 'mp4' | 'webm' | 'gif';
  quality: 'draft' | 'standard' | 'high';
  resolution: '480p' | '720p' | '1080p' | '4k';
  url: string;
  duration: number;
  size: number;
  createdAt: Date;
  metadata?: Record<string, any>;
}

/**
 * Métodos auxiliares para manipular objetos EditorState
 */
export const EditorStateUtils = {
  /**
   * Calcula la duración total del proyecto
   */
  calculateDuration(state: Partial<EditorState>): number {
    let maxEnd = 0;
    
    // Revisar clips
    if (state.clips) {
      state.clips.forEach(clip => {
        const clipEnd = clip.endTime;
        if (clipEnd > maxEnd) maxEnd = clipEnd;
      });
    }
    
    // Revisar pistas de audio
    if (state.audioTracks) {
      state.audioTracks.forEach(track => {
        const trackEnd = track.startTime + track.duration;
        if (trackEnd > maxEnd) maxEnd = trackEnd;
      });
    }
    
    // Revisar transcripciones
    if (state.transcriptions) {
      state.transcriptions.forEach(transcription => {
        if (transcription.endTime > maxEnd) maxEnd = transcription.endTime;
      });
    }
    
    return maxEnd;
  },
  
  /**
   * Encuentra elementos activos en un tiempo determinado
   */
  findActiveElementsAtTime(state: Partial<EditorState>, time: number): {
    clips: Clip[];
    audioTracks: AudioTrack[];
    transcriptions: Transcription[];
    cameraMovements: CameraMovement[];
    visualEffects: VisualEffect[];
    beats: Beat[];
    sections: Section[];
  } {
    const result = {
      clips: [] as Clip[],
      audioTracks: [] as AudioTrack[],
      transcriptions: [] as Transcription[],
      cameraMovements: [] as CameraMovement[],
      visualEffects: [] as VisualEffect[],
      beats: [] as Beat[],
      sections: [] as Section[]
    };
    
    // Clips activos
    if (state.clips) {
      result.clips = state.clips.filter(
        clip => time >= clip.startTime && time < clip.endTime
      );
    }
    
    // Pistas de audio activas
    if (state.audioTracks) {
      result.audioTracks = state.audioTracks.filter(
        track => time >= track.startTime && time < (track.startTime + track.duration)
      );
    }
    
    // Transcripciones activas
    if (state.transcriptions) {
      result.transcriptions = state.transcriptions.filter(
        transcription => time >= transcription.startTime && time <= transcription.endTime
      );
    }
    
    // Movimientos de cámara activos
    if (state.cameraMovements) {
      result.cameraMovements = state.cameraMovements.filter(
        movement => time >= movement.startTime && time < (movement.startTime + movement.duration)
      );
    }
    
    // Efectos visuales activos
    if (state.visualEffects) {
      result.visualEffects = state.visualEffects.filter(
        effect => time >= effect.startTime && time < (effect.startTime + effect.duration)
      );
    }
    
    // Beats activos (el beat más cercano)
    if (state.beats) {
      // Encontrar el beat más cercano al tiempo actual
      let closestBeat: Beat | null = null;
      let minDistance = Infinity;
      
      for (const beat of state.beats) {
        const distance = Math.abs(beat.time - time);
        if (distance < minDistance) {
          minDistance = distance;
          closestBeat = beat;
        }
      }
      
      // Solo considerar un beat como activo si está a menos de 0.2 segundos
      if (closestBeat && minDistance <= 0.2) {
        result.beats = [closestBeat];
      }
    }
    
    // Secciones activas
    if (state.sections) {
      result.sections = state.sections.filter(
        section => time >= section.startTime && time < section.endTime
      );
    }
    
    return result;
  },
  
  /**
   * Crea un nuevo estado de editor vacío
   */
  createEmptyState(userId: string): EditorState {
    const now = new Date();
    return {
      projectId: `project-${Date.now()}`,
      projectName: 'Nuevo proyecto',
      projectDescription: '',
      userId,
      clips: [],
      audioTracks: [],
      transcriptions: [],
      cameraMovements: [],
      visualEffects: [],
      beats: [],
      sections: [],
      currentTime: 0,
      duration: 0,
      isPlaying: false,
      settings: {
        language: 'es',
        theme: 'system',
        autoSave: true,
        autoSaveInterval: 30,
        videoQuality: 'standard',
        frameRate: 30,
        backgroundColor: '#000000',
        showTimecode: true,
        snapToGrid: true,
        gridSize: 1,
        defaultTransitionDuration: 1
      },
      createdAt: now,
      updatedAt: now
    };
  },
  
  /**
   * Clona un estado de editor
   */
  cloneState(state: EditorState): EditorState {
    return JSON.parse(JSON.stringify(state));
  }
};