/**
 * 🎵 Audio Analysis Service - fal-ai/audio-understanding
 * 
 * Analiza automáticamente la estructura musical para enriquecer la edición de video.
 * Este servicio se ejecuta automáticamente cuando el usuario sube audio
 * y proporciona información para sincronizar escenas con la música.
 * 
 * CAPACIDADES:
 * - Detección de estructura (intro, verso, coro, bridge, outro)
 * - BPM y tempo
 * - Detección de instrumentos prominentes
 * - Momentos de alta energía (drops, climax)
 * - Beats y downbeats para sincronización
 * 
 * COSTO: ~$0.05-0.10 por análisis (según duración)
 */

import axios from 'axios';
import { logger } from '../utils/logger';

const FAL_API_KEY = process.env.FAL_API_KEY || '';
const FAL_BASE_URL = 'https://fal.run';

// ========== INTERFACES ==========

export interface AudioSection {
  type: 'intro' | 'verse' | 'pre-chorus' | 'chorus' | 'bridge' | 'breakdown' | 'solo' | 'outro' | 'instrumental';
  startTime: number;
  endTime: number;
  duration: number;
  energy: 'low' | 'medium' | 'high' | 'peak';
  description: string;
}

export interface InstrumentSegment {
  startTime: number;
  endTime: number;
  prominence: 'background' | 'supporting' | 'lead';
  isSolo: boolean;
}

export interface InstrumentAnalysis {
  name: string;
  segments: InstrumentSegment[];
}

export interface KeyMoment {
  timestamp: number;
  type: 'drop' | 'crescendo' | 'breakdown' | 'climax' | 'silence' | 'transition' | 'hook';
  intensity: number; // 1-10
  suggestedEffect: 'zoom_in' | 'zoom_out' | 'flash' | 'slow_motion' | 'fast_cuts' | 'shake' | 'glitch' | 'crossfade' | 'none';
  description: string;
}

export interface EnergyPoint {
  timestamp: number;
  level: number; // 0-100
}

export interface AudioAnalysisResult {
  // Metadata básica
  duration: number;
  bpm: number;
  key: string; // "C major", "A minor", etc.
  genre: string;
  mood: string[];
  
  // Estructura de la canción
  sections: AudioSection[];
  
  // Instrumentos detectados
  instruments: InstrumentAnalysis[];
  
  // Beats para sincronización
  beats: number[];
  downbeats: number[]; // Primer beat de cada compás
  
  // Momentos clave para efectos
  keyMoments: KeyMoment[];
  
  // Curva de energía para visualización
  energyCurve: EnergyPoint[];
  
  // Metadata de análisis
  analyzedAt: string;
  analysisVersion: string;
  rawResponse?: any; // Respuesta cruda de fal-ai para debugging
}

export interface EditingRecommendations {
  // Recomendaciones para edición automática
  suggestedCutPoints: number[]; // Timestamps recomendados para cortes
  sceneDurationBySection: Record<string, number>; // Duración recomendada por tipo de sección
  transitionsByEnergy: Record<string, string>; // Tipo de transición según energía
}

// ========== SERVICIO PRINCIPAL ==========

/**
 * Analiza un archivo de audio usando fal-ai/audio-understanding
 */
export async function analyzeAudio(audioUrl: string): Promise<AudioAnalysisResult> {
  if (!FAL_API_KEY) {
    logger.error('[AudioAnalysis] FAL_API_KEY no configurada');
    throw new Error('FAL_API_KEY is required for audio analysis');
  }

  logger.log(`[AudioAnalysis] 🎵 Iniciando análisis de audio: ${audioUrl.substring(0, 60)}...`);

  try {
    // Paso 1: Llamar a fal-ai/audio-understanding para análisis completo
    const analysisResponse = await axios.post(
      `${FAL_BASE_URL}/fal-ai/audio-understanding`,
      {
        audio_url: audioUrl,
        // Pedir análisis completo
        analysis_type: 'full',
        include_beats: true,
        include_structure: true,
        include_instruments: true,
        include_mood: true,
      },
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minutos para canciones largas
      }
    );

    logger.log('[AudioAnalysis] ✅ Respuesta recibida de fal-ai');
    
    // Paso 2: Parsear y estructurar la respuesta
    const rawData = analysisResponse.data;
    const analysis = parseAudioAnalysisResponse(rawData, audioUrl);
    
    logger.log(`[AudioAnalysis] 📊 Análisis completado:
      - BPM: ${analysis.bpm}
      - Key: ${analysis.key}
      - Secciones: ${analysis.sections.length}
      - Instrumentos: ${analysis.instruments.length}
      - Key Moments: ${analysis.keyMoments.length}
      - Beats: ${analysis.beats.length}
    `);

    return analysis;

  } catch (error: any) {
    logger.error('[AudioAnalysis] ❌ Error en análisis:', error.message);
    
    // Si fal-ai falla, intentar análisis simplificado
    if (error.response?.status === 404 || error.response?.status === 400) {
      logger.warn('[AudioAnalysis] Modelo no disponible, usando análisis básico');
      return generateBasicAnalysis(audioUrl);
    }
    
    throw error;
  }
}

/**
 * Parsea la respuesta de fal-ai a nuestro formato estructurado
 */
function parseAudioAnalysisResponse(rawData: any, audioUrl: string): AudioAnalysisResult {
  // Adaptar según el formato real de respuesta de fal-ai
  // Esta función se ajustará cuando veamos el formato exacto
  
  const duration = rawData.duration || rawData.audio_duration || 180;
  const bpm = rawData.bpm || rawData.tempo || 120;
  
  // Parsear secciones
  const sections: AudioSection[] = (rawData.sections || rawData.structure || []).map((s: any, i: number) => ({
    type: mapSectionType(s.label || s.type || 'verse'),
    startTime: s.start || s.start_time || (i * 30),
    endTime: s.end || s.end_time || ((i + 1) * 30),
    duration: (s.end || s.end_time || ((i + 1) * 30)) - (s.start || s.start_time || (i * 30)),
    energy: mapEnergy(s.energy || s.intensity || 'medium'),
    description: s.description || s.label || `Section ${i + 1}`,
  }));

  // Parsear instrumentos
  const instruments: InstrumentAnalysis[] = (rawData.instruments || []).map((inst: any) => ({
    name: inst.name || inst.instrument || 'unknown',
    segments: (inst.segments || inst.activations || []).map((seg: any) => ({
      startTime: seg.start || seg.start_time || 0,
      endTime: seg.end || seg.end_time || duration,
      prominence: mapProminence(seg.prominence || seg.level || 'supporting'),
      isSolo: seg.is_solo || seg.solo || false,
    })),
  }));

  // Parsear beats
  const beats: number[] = rawData.beats || rawData.beat_times || generateBeats(bpm, duration);
  const downbeats: number[] = rawData.downbeats || rawData.bar_starts || beats.filter((_, i) => i % 4 === 0);

  // Parsear momentos clave
  const keyMoments: KeyMoment[] = (rawData.key_moments || rawData.highlights || []).map((m: any) => ({
    timestamp: m.time || m.timestamp || 0,
    type: mapMomentType(m.type || m.label || 'transition'),
    intensity: m.intensity || m.strength || 5,
    suggestedEffect: suggestEffect(m.type || m.label, m.intensity || 5),
    description: m.description || m.label || '',
  }));

  // Generar curva de energía
  const energyCurve: EnergyPoint[] = rawData.energy_curve || generateEnergyCurve(sections, duration);

  return {
    duration,
    bpm,
    key: rawData.key || rawData.musical_key || 'Unknown',
    genre: rawData.genre || 'Unknown',
    mood: rawData.mood || rawData.moods || ['neutral'],
    sections: sections.length > 0 ? sections : generateDefaultSections(duration),
    instruments,
    beats,
    downbeats,
    keyMoments: keyMoments.length > 0 ? keyMoments : detectKeyMoments(sections),
    energyCurve,
    analyzedAt: new Date().toISOString(),
    analysisVersion: '1.0.0',
    rawResponse: rawData,
  };
}

// ========== FUNCIONES AUXILIARES ==========

function mapSectionType(label: string): AudioSection['type'] {
  const normalized = label.toLowerCase().trim();
  const mapping: Record<string, AudioSection['type']> = {
    'intro': 'intro',
    'verse': 'verse',
    'pre-chorus': 'pre-chorus',
    'prechorus': 'pre-chorus',
    'chorus': 'chorus',
    'hook': 'chorus',
    'bridge': 'bridge',
    'breakdown': 'breakdown',
    'drop': 'breakdown',
    'solo': 'solo',
    'instrumental': 'instrumental',
    'outro': 'outro',
    'ending': 'outro',
  };
  return mapping[normalized] || 'verse';
}

function mapEnergy(level: string | number): AudioSection['energy'] {
  if (typeof level === 'number') {
    if (level >= 80) return 'peak';
    if (level >= 60) return 'high';
    if (level >= 40) return 'medium';
    return 'low';
  }
  const normalized = level.toLowerCase();
  if (['peak', 'maximum', 'very high'].includes(normalized)) return 'peak';
  if (['high', 'energetic', 'intense'].includes(normalized)) return 'high';
  if (['medium', 'moderate', 'mid'].includes(normalized)) return 'medium';
  return 'low';
}

function mapProminence(level: string): InstrumentSegment['prominence'] {
  const normalized = level.toLowerCase();
  if (['lead', 'primary', 'main', 'solo'].includes(normalized)) return 'lead';
  if (['supporting', 'secondary', 'accompaniment'].includes(normalized)) return 'supporting';
  return 'background';
}

function mapMomentType(type: string): KeyMoment['type'] {
  const normalized = type.toLowerCase();
  const mapping: Record<string, KeyMoment['type']> = {
    'drop': 'drop',
    'bass drop': 'drop',
    'crescendo': 'crescendo',
    'build': 'crescendo',
    'buildup': 'crescendo',
    'breakdown': 'breakdown',
    'climax': 'climax',
    'peak': 'climax',
    'silence': 'silence',
    'pause': 'silence',
    'hook': 'hook',
    'transition': 'transition',
  };
  return mapping[normalized] || 'transition';
}

function suggestEffect(type: string, intensity: number): KeyMoment['suggestedEffect'] {
  const normalized = type.toLowerCase();
  
  if (['drop', 'bass drop'].includes(normalized)) {
    return intensity > 7 ? 'shake' : 'zoom_in';
  }
  if (['climax', 'peak'].includes(normalized)) {
    return 'flash';
  }
  if (['breakdown'].includes(normalized)) {
    return 'slow_motion';
  }
  if (intensity > 8) {
    return 'glitch';
  }
  if (intensity > 5) {
    return 'fast_cuts';
  }
  return 'crossfade';
}

function generateBeats(bpm: number, duration: number): number[] {
  const beatInterval = 60 / bpm;
  const beats: number[] = [];
  for (let t = 0; t < duration; t += beatInterval) {
    beats.push(Math.round(t * 1000) / 1000);
  }
  return beats;
}

function generateEnergyCurve(sections: AudioSection[], duration: number): EnergyPoint[] {
  const curve: EnergyPoint[] = [];
  const step = 1; // 1 segundo
  
  for (let t = 0; t <= duration; t += step) {
    const section = sections.find(s => t >= s.startTime && t < s.endTime);
    const energyMap = { 'low': 25, 'medium': 50, 'high': 75, 'peak': 95 };
    const level = section ? energyMap[section.energy] : 50;
    
    // Añadir variación natural
    const variation = Math.sin(t * 0.5) * 5 + Math.random() * 5;
    curve.push({
      timestamp: t,
      level: Math.max(0, Math.min(100, level + variation)),
    });
  }
  
  return curve;
}

function generateDefaultSections(duration: number): AudioSection[] {
  // Estructura típica de canción pop
  const structure = [
    { type: 'intro', percentage: 0.05, energy: 'low' as const },
    { type: 'verse', percentage: 0.15, energy: 'medium' as const },
    { type: 'pre-chorus', percentage: 0.08, energy: 'high' as const },
    { type: 'chorus', percentage: 0.15, energy: 'peak' as const },
    { type: 'verse', percentage: 0.12, energy: 'medium' as const },
    { type: 'pre-chorus', percentage: 0.08, energy: 'high' as const },
    { type: 'chorus', percentage: 0.15, energy: 'peak' as const },
    { type: 'bridge', percentage: 0.10, energy: 'medium' as const },
    { type: 'chorus', percentage: 0.10, energy: 'peak' as const },
    { type: 'outro', percentage: 0.02, energy: 'low' as const },
  ];
  
  const sections: AudioSection[] = [];
  let currentTime = 0;
  
  structure.forEach((s, i) => {
    const sectionDuration = duration * s.percentage;
    sections.push({
      type: s.type as AudioSection['type'],
      startTime: currentTime,
      endTime: currentTime + sectionDuration,
      duration: sectionDuration,
      energy: s.energy,
      description: `${s.type.charAt(0).toUpperCase() + s.type.slice(1)} section`,
    });
    currentTime += sectionDuration;
  });
  
  return sections;
}

function detectKeyMoments(sections: AudioSection[]): KeyMoment[] {
  const moments: KeyMoment[] = [];
  
  sections.forEach((section, i) => {
    // Detectar cambios de sección como momentos clave
    if (i > 0) {
      const prevSection = sections[i - 1];
      if (section.energy !== prevSection.energy) {
        moments.push({
          timestamp: section.startTime,
          type: section.energy === 'peak' ? 'climax' : 'transition',
          intensity: section.energy === 'peak' ? 8 : 5,
          suggestedEffect: section.energy === 'peak' ? 'zoom_in' : 'crossfade',
          description: `Transition from ${prevSection.type} to ${section.type}`,
        });
      }
    }
    
    // Marcar coros como hooks
    if (section.type === 'chorus' && section.energy === 'peak') {
      moments.push({
        timestamp: section.startTime,
        type: 'hook',
        intensity: 9,
        suggestedEffect: 'flash',
        description: 'Chorus hook - high energy moment',
      });
    }
  });
  
  return moments;
}

/**
 * Genera análisis básico cuando fal-ai no está disponible
 */
async function generateBasicAnalysis(audioUrl: string): Promise<AudioAnalysisResult> {
  logger.warn('[AudioAnalysis] Generando análisis básico (sin fal-ai)');
  
  // Duración estimada por defecto (se puede mejorar con ffprobe)
  const duration = 180; // 3 minutos default
  const bpm = 120;
  
  return {
    duration,
    bpm,
    key: 'Unknown',
    genre: 'Unknown',
    mood: ['neutral'],
    sections: generateDefaultSections(duration),
    instruments: [],
    beats: generateBeats(bpm, duration),
    downbeats: generateBeats(bpm, duration).filter((_, i) => i % 4 === 0),
    keyMoments: [],
    energyCurve: generateEnergyCurve(generateDefaultSections(duration), duration),
    analyzedAt: new Date().toISOString(),
    analysisVersion: '1.0.0-basic',
  };
}

// ========== UTILIDADES PARA EDICIÓN ==========

/**
 * Genera recomendaciones de edición basadas en el análisis
 */
export function generateEditingRecommendations(analysis: AudioAnalysisResult): EditingRecommendations {
  // Puntos de corte recomendados = downbeats cada 2-4 compases
  const cutPoints = analysis.downbeats.filter((_, i) => i % 2 === 0);
  
  // Duración de escena por tipo de sección
  const sceneDurationBySection: Record<string, number> = {
    'intro': 4,      // 4 beats (más lento)
    'verse': 2,      // 2 beats (storytelling)
    'pre-chorus': 2, // 2 beats (building)
    'chorus': 1,     // 1 beat (energético)
    'bridge': 4,     // 4 beats (reflexión)
    'breakdown': 2,  // 2 beats (dramático)
    'solo': 8,       // 8 beats (spotlight)
    'outro': 4,      // 4 beats (cierre)
    'instrumental': 4,
  };
  
  // Transiciones según energía
  const transitionsByEnergy: Record<string, string> = {
    'low': 'slow_dissolve',
    'medium': 'crossfade',
    'high': 'fast_fade',
    'peak': 'cut', // Corte abrupto en alta energía
  };
  
  return {
    suggestedCutPoints: cutPoints,
    sceneDurationBySection,
    transitionsByEnergy,
  };
}

/**
 * Obtiene el instrumento dominante en un timestamp específico
 */
export function getDominantInstrumentAt(analysis: AudioAnalysisResult, timestamp: number): string | null {
  for (const instrument of analysis.instruments) {
    const activeSegment = instrument.segments.find(
      seg => timestamp >= seg.startTime && timestamp < seg.endTime && seg.prominence === 'lead'
    );
    if (activeSegment) {
      return instrument.name;
    }
  }
  return null;
}

/**
 * Obtiene la sección musical en un timestamp
 */
export function getSectionAt(analysis: AudioAnalysisResult, timestamp: number): AudioSection | null {
  return analysis.sections.find(
    s => timestamp >= s.startTime && timestamp < s.endTime
  ) || null;
}

/**
 * Encuentra el beat más cercano a un timestamp
 */
export function getNearestBeat(analysis: AudioAnalysisResult, timestamp: number): number {
  if (analysis.beats.length === 0) return timestamp;
  
  let nearest = analysis.beats[0];
  let minDiff = Math.abs(timestamp - nearest);
  
  for (const beat of analysis.beats) {
    const diff = Math.abs(timestamp - beat);
    if (diff < minDiff) {
      minDiff = diff;
      nearest = beat;
    }
  }
  
  return nearest;
}

/**
 * Snap un timestamp al beat más cercano
 */
export function snapToBeat(analysis: AudioAnalysisResult, timestamp: number, threshold: number = 0.2): number {
  const nearest = getNearestBeat(analysis, timestamp);
  if (Math.abs(timestamp - nearest) <= threshold) {
    return nearest;
  }
  return timestamp;
}

export default {
  analyzeAudio,
  generateEditingRecommendations,
  getDominantInstrumentAt,
  getSectionAt,
  getNearestBeat,
  snapToBeat,
};
