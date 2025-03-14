/**
 * TimelineClipUnified
 * 
 * Este módulo proporciona una capa de compatibilidad entre diferentes sistemas
 * de líneas de tiempo, permitiendo la comunicación entre el editor de línea de tiempo
 * (TimelineEditor) y los modelos de datos existentes (TimelineItem).
 */

import { TimelineClip } from '../music-video/TimelineEditor';

/**
 * Interfaz para los elementos de la línea de tiempo antiguo
 * Esta interfaz representa el formato de timeline antiguo que se usa en algunas partes de la aplicación
 */
export interface TimelineItem {
  id: string;
  group: string;
  start_time: number;
  end_time: number;
  duration?: number;
  title?: string;
  thumbnail?: string;
  content?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  type?: string;
  imagePrompt?: string;
  shotType?: string;
  section?: string;
  className?: string;
  style?: any;
  itemProps?: any;
}

/**
 * Clase unificada para clips de línea de tiempo
 * Proporciona compatibilidad entre diferentes formatos de clips
 */
export class TimelineClipUnified implements TimelineClip {
  id: number;
  start: number;
  duration: number;
  type: 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text';
  layer: number;
  thumbnail?: string;
  title: string;
  description?: string;
  waveform?: number[];
  imagePrompt?: string;
  shotType?: string;
  visible?: boolean;
  locked?: boolean;
  imageUrl?: string;
  videoUrl?: string;
  movementUrl?: string;
  audioUrl?: string;
  metadata?: {
    section?: string;
    movementApplied?: boolean;
    movementPattern?: string;
    movementIntensity?: number;
    faceSwapApplied?: boolean;
    musicianIntegrated?: boolean;
    sourceIndex?: number;
    lipsync?: {
      applied: boolean;
      videoUrl?: string;
      progress?: number;
      timestamp?: string;
    };
  };

  /**
   * Constructor que acepta un objeto parcial TimelineClip o TimelineItem
   */
  constructor(data: Partial<TimelineClip> | TimelineItem) {
    if ('start_time' in data) {
      // Es un TimelineItem (formato antiguo)
      this.id = parseInt(data.id) || 0;
      this.start = data.start_time;
      this.duration = data.duration || (data.end_time - data.start_time);
      this.type = this.determineType(data);
      this.layer = this.determineLayer(data);
      this.title = data.title || `Clip ${data.id}`;
      this.thumbnail = data.thumbnail;
      this.imageUrl = data.imageUrl;
      this.videoUrl = data.videoUrl;
      this.audioUrl = data.audioUrl;
      this.imagePrompt = data.imagePrompt;
      this.shotType = data.shotType;
      this.description = data.content;
      this.metadata = {
        section: data.section
      };
    } else {
      // Es un TimelineClip (formato nuevo o parcial)
      this.id = data.id || 0;
      this.start = data.start || 0;
      this.duration = data.duration || 0;
      this.type = data.type || 'image';
      this.layer = data.layer || 0;
      this.title = data.title || `Clip ${this.id}`;
      this.thumbnail = data.thumbnail;
      this.description = data.description;
      this.waveform = data.waveform;
      this.imagePrompt = data.imagePrompt;
      this.shotType = data.shotType;
      this.visible = data.visible;
      this.locked = data.locked;
      this.imageUrl = data.imageUrl;
      this.videoUrl = data.videoUrl;
      this.movementUrl = data.movementUrl;
      this.audioUrl = data.audioUrl;
      this.metadata = data.metadata || {};
    }
  }

  /**
   * Determina el tipo de clip basado en las propiedades disponibles
   */
  private determineType(data: TimelineItem): 'video' | 'image' | 'transition' | 'audio' | 'effect' | 'text' {
    // Verificar si data.type existe y es una cadena
    if (data.type && typeof data.type === 'string') {
      const typeLower = data.type.toLowerCase();
      switch (typeLower) {
        case 'video': return 'video';
        case 'audio': return 'audio';
        case 'text': return 'text';
        case 'effect': return 'effect';
        case 'transition': return 'transition';
        default: break;
      }
    }

    // Verificar por URLs
    if (data.videoUrl) return 'video';
    if (data.audioUrl) return 'audio';
    if (data.imageUrl || data.thumbnail) return 'image';
    
    // Determinación por grupo (si existe y es una cadena)
    if (data.group && typeof data.group === 'string') {
      const groupLower = data.group.toLowerCase();
      if (groupLower === 'audio') return 'audio';
      if (groupLower === 'text') return 'text';
      if (groupLower === 'video') return 'video';
      if (groupLower === 'image') return 'image';
    }
    
    // Por defecto asumimos imagen
    return 'image';
  }

  /**
   * Determina la capa basado en el tipo o grupo
   */
  private determineLayer(data: TimelineItem): number {
    // Verificar si data.group es un número, usarlo directamente
    if (data.group !== undefined && !isNaN(Number(data.group))) {
      return Number(data.group);
    }
    
    // Verificar si data.group existe y es una cadena antes de llamar a toLowerCase
    if (data.group && typeof data.group === 'string') {
      const groupLower = data.group.toLowerCase();
      switch (groupLower) {
        case 'audio': return 0;
        case 'video': return 1;
        case 'image': return 1;
        case 'text': return 2;
        case 'effect': return 3;
      }
    }

    // Determinar por tipo
    const type = this.determineType(data);
    switch (type) {
      case 'audio': return 0;
      case 'video': case 'image': return 1;
      case 'text': return 2;
      case 'effect': case 'transition': return 3;
      default: return 1;
    }
  }

  /**
   * Convierte a TimelineItem (formato antiguo)
   */
  toTimelineItem(): TimelineItem {
    return {
      id: this.id.toString(),
      group: this.getGroupFromType(),
      start_time: this.start,
      end_time: this.start + this.duration,
      duration: this.duration,
      title: this.title,
      thumbnail: this.thumbnail,
      content: this.description,
      imageUrl: this.imageUrl,
      videoUrl: this.videoUrl,
      audioUrl: this.audioUrl,
      type: this.type,
      imagePrompt: this.imagePrompt,
      shotType: this.shotType,
      section: this.metadata?.section
    };
  }

  /**
   * Obtiene el nombre del grupo basado en el tipo
   */
  private getGroupFromType(): string {
    switch (this.type) {
      case 'audio': return 'audio';
      case 'video': return 'video';
      case 'image': return 'image';
      case 'text': return 'text';
      case 'effect': return 'effect';
      case 'transition': return 'transition';
      default: return 'image';
    }
  }
}

/**
 * Asegura que un clip tenga el formato adecuado para el editor de línea de tiempo
 * Esta función convierte cualquier formato de clip al formato unificado (TimelineClipUnified)
 */
export function ensureCompatibleClip(
  clip: TimelineClip | TimelineItem | Partial<TimelineClip>
): TimelineClipUnified {
  if (clip instanceof TimelineClipUnified) {
    return clip;
  }
  return new TimelineClipUnified(clip);
}

/**
 * Convierte un array de clips al formato unificado
 */
export function ensureCompatibleClips<T extends TimelineClip | TimelineItem | Partial<TimelineClip>>(
  clips: T[]
): TimelineClipUnified[] {
  return clips.map(clip => ensureCompatibleClip(clip));
}