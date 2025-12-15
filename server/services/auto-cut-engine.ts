/**
 * 🔧 Auto-Cut Engine - Motor de cortes perfectos sincronizados con música
 * 
 * Genera un JSON master con:
 * - Beat Grid: Grilla temporal precisa de todos los beats
 * - Cut Points: Puntos de corte alineados a beats según género
 * - Scene JSON: Escenas con duraciones perfectas y variaciones de plano
 * 
 * El resultado es un timeline listo para usar con cortes que
 * caen exactamente en los beats de la música.
 */

import { logger } from '../utils/logger';
import { 
  AudioAnalysisResult, 
  AudioSection, 
  KeyMoment 
} from './audio-analysis-service';
import { 
  GenreEditingProfile, 
  getEditingProfile,
  mapSectionToCutRuleKey
} from './genre-editing-profiles';
import { 
  generateShotVariations, 
  GeneratedVariation,
  VariationGenerationOptions 
} from './shot-variation-engine';

// ========== INTERFACES ==========

export interface Beat {
  index: number;
  time: number;          // ms desde inicio
  isDownbeat: boolean;   // Primer beat del compás (1 de cada 4)
  section: string;       // intro, verse, chorus, etc.
  energy: string;        // low, medium, high, peak
}

export interface Bar {
  index: number;
  startBeat: number;
  endBeat: number;
  startTime: number;     // ms
  endTime: number;       // ms
  section: string;
}

export interface BeatGrid {
  bpm: number;
  beatDuration: number;  // ms por beat
  totalBeats: number;
  totalDuration: number; // ms
  beats: Beat[];
  bars: Bar[];
}

export interface CutPoint {
  index: number;
  time: number;           // ms exacto del corte
  beatIndex: number;      // En qué beat cae
  section: string;        // Sección musical
  duration: number;       // ms hasta siguiente corte
  durationBeats: number;  // Beats hasta siguiente corte
  transition: string;     // Tipo de transición
  energy: string;         // Nivel de energía
  isKeyMoment: boolean;   // Si coincide con drop/climax
  keyMomentType?: string; // Tipo de momento clave
}

export interface MasterSceneVariation {
  id: string;
  imageUrl: string;
  shotType: string;
  startTime: number;     // ms
  endTime: number;       // ms
  duration: number;      // ms
  beatStart: number;
  beatEnd: number;
}

export interface MasterScene {
  id: string;
  sceneNumber: number;
  startTime: number;       // ms, alineado a beat
  endTime: number;
  duration: number;        // ms
  beatStart: number;
  beatEnd: number;
  section: string;
  energy: string;
  transition: string;
  isKeyMoment: boolean;
  baseImageUrl: string;
  variations: MasterSceneVariation[];
}

export interface MasterSceneJSON {
  projectId: string;
  title: string;
  bpm: number;
  beatDuration: number;
  genre: string;
  genreProfile: string;
  totalDuration: number;  // ms
  totalScenes: number;
  totalVariations: number;
  generatedAt: string;
  scenes: MasterScene[];
}

// ========== BEAT GRID GENERATOR ==========

/**
 * Genera una grilla temporal precisa de todos los beats de la canción
 */
export function generateBeatGrid(analysis: AudioAnalysisResult): BeatGrid {
  const { bpm, duration, sections, beats: rawBeats, downbeats } = analysis;
  
  const beatDuration = 60000 / bpm; // ms por beat
  const totalDurationMs = duration * 1000;
  const totalBeats = Math.ceil(totalDurationMs / beatDuration);
  
  logger.log(`[BeatGrid] 🎵 Generando grid: ${bpm} BPM, ${totalBeats} beats, ${Math.round(beatDuration)}ms/beat`);
  
  const beats: Beat[] = [];
  
  for (let i = 0; i < totalBeats; i++) {
    const time = i * beatDuration;
    const section = getSectionAtTime(time, sections);
    const energy = getEnergyAtTime(time, sections, analysis.keyMoments);
    
    // Usar downbeats del análisis si existen, sino calcular (cada 4 beats)
    const isDownbeat = downbeats?.length > 0
      ? downbeats.some(db => Math.abs(db * 1000 - time) < beatDuration / 2)
      : i % 4 === 0;
    
    beats.push({
      index: i,
      time: time,
      isDownbeat: isDownbeat,
      section: section?.type || 'unknown',
      energy: energy
    });
  }
  
  // Generar compases (bars) - grupos de 4 beats
  const bars: Bar[] = [];
  for (let i = 0; i < totalBeats; i += 4) {
    const startBeat = beats[i];
    const endBeatIndex = Math.min(i + 3, totalBeats - 1);
    const endBeat = beats[endBeatIndex];
    
    bars.push({
      index: Math.floor(i / 4),
      startBeat: i,
      endBeat: Math.min(i + 4, totalBeats),
      startTime: startBeat.time,
      endTime: endBeat.time + beatDuration,
      section: startBeat.section
    });
  }
  
  logger.log(`[BeatGrid] ✅ Grid generado: ${beats.length} beats, ${bars.length} compases`);
  
  return { 
    bpm, 
    beatDuration, 
    totalBeats,
    totalDuration: totalDurationMs,
    beats, 
    bars 
  };
}

/**
 * Obtiene la sección musical en un tiempo dado
 */
function getSectionAtTime(timeMs: number, sections: AudioSection[]): AudioSection | undefined {
  return sections.find(s => 
    timeMs >= s.startTime * 1000 && timeMs < s.endTime * 1000
  );
}

/**
 * Obtiene el nivel de energía en un tiempo dado
 */
function getEnergyAtTime(
  timeMs: number, 
  sections: AudioSection[], 
  keyMoments: KeyMoment[]
): string {
  // Primero revisar key moments (más específico)
  const nearKeyMoment = keyMoments.find(km => 
    Math.abs(km.timestamp * 1000 - timeMs) < 2000 // 2 segundos de ventana
  );
  
  if (nearKeyMoment) {
    if (nearKeyMoment.intensity >= 8) return 'peak';
    if (nearKeyMoment.intensity >= 6) return 'high';
  }
  
  // Luego revisar sección
  const section = getSectionAtTime(timeMs, sections);
  if (section) {
    return section.energy;
  }
  
  return 'medium';
}

// ========== CUT POINTS GENERATOR ==========

/**
 * Genera los puntos exactos de corte basados en género y análisis
 */
export function generateCutPoints(
  beatGrid: BeatGrid,
  analysis: AudioAnalysisResult,
  profile: GenreEditingProfile
): CutPoint[] {
  const { beats, beatDuration } = beatGrid;
  const { sections, keyMoments } = analysis;
  const cutPoints: CutPoint[] = [];
  
  let currentBeat = 0;
  let cutIndex = 0;
  
  logger.log(`[CutPoints] 🎬 Generando puntos de corte con perfil "${profile.genre}"`);
  
  while (currentBeat < beats.length) {
    const beat = beats[currentBeat];
    const section = beat.section;
    const energy = beat.energy;
    
    // Obtener reglas de corte para esta sección
    const sectionKey = mapSectionToCutRuleKey(section);
    const cutRule = profile.cutRules[sectionKey] || profile.cutRules.verse;
    
    // Ajustar beats por corte según energía
    let beatsPerCut = cutRule.beatsPerCut;
    
    // Multiplicador de energía del género
    beatsPerCut = beatsPerCut / profile.energyMultiplier;
    
    // Ajustes adicionales por nivel de energía
    if (energy === 'peak') {
      beatsPerCut = Math.max(0.25, beatsPerCut * 0.5);  // Muy rápido
    } else if (energy === 'high') {
      beatsPerCut = Math.max(0.5, beatsPerCut * 0.75);  // Rápido
    } else if (energy === 'low') {
      beatsPerCut = beatsPerCut * 1.5;  // Más lento
    }
    
    // Verificar si hay key moment cerca
    const keyMoment = keyMoments.find(km => 
      Math.abs(km.timestamp * 1000 - beat.time) < beatDuration * 2
    );
    
    let transition = cutRule.transition;
    let isKeyMoment = false;
    let keyMomentType: string | undefined;
    
    if (keyMoment) {
      isKeyMoment = true;
      keyMomentType = keyMoment.type;
      
      // Forzar corte más rápido en key moments
      beatsPerCut = Math.min(beatsPerCut, 1);
      
      // Usar transición sugerida por el momento
      if (keyMoment.suggestedEffect) {
        const effectToTransition: Record<string, string> = {
          'flash': 'flash',
          'zoom_in': 'zoom',
          'zoom_out': 'zoom',
          'shake': 'shake',
          'glitch': 'glitch',
          'slow_motion': 'crossfade',
          'fast_cuts': 'cut'
        };
        transition = effectToTransition[keyMoment.suggestedEffect] || transition;
      }
    }
    
    // Redondear a beats enteros o medios
    const durationBeats = Math.max(0.25, Math.round(beatsPerCut * 4) / 4);
    const durationMs = durationBeats * beatDuration;
    
    cutPoints.push({
      index: cutIndex,
      time: beat.time,
      beatIndex: currentBeat,
      section: section,
      duration: durationMs,
      durationBeats: durationBeats,
      transition: transition,
      energy: energy,
      isKeyMoment: isKeyMoment,
      keyMomentType: keyMomentType
    });
    
    currentBeat += Math.ceil(durationBeats);
    cutIndex++;
  }
  
  logger.log(`[CutPoints] ✅ Generados ${cutPoints.length} puntos de corte`);
  
  // Log distribución
  const sectionCounts: Record<string, number> = {};
  cutPoints.forEach(cp => {
    sectionCounts[cp.section] = (sectionCounts[cp.section] || 0) + 1;
  });
  logger.log(`[CutPoints]    Distribución por sección:`, sectionCounts);
  
  return cutPoints;
}

// ========== MASTER JSON GENERATOR ==========

/**
 * FUNCIÓN PRINCIPAL: Genera el JSON Master con escenas y variaciones
 */
export async function generateMasterSceneJSON(
  projectId: string,
  analysis: AudioAnalysisResult,
  baseScenes: Array<{ 
    id: string;
    imageUrl: string; 
    section?: string;
  }>,
  options: {
    title?: string;
    generateVariations?: boolean;
    variationOptions?: VariationGenerationOptions;
    genre?: string;          // Override de género
    mood?: string[];         // Mood para selección de perfil
  } = {}
): Promise<MasterSceneJSON> {
  
  const {
    title = 'Music Video',
    generateVariations = true,
    variationOptions = {},
    genre,
    mood = []
  } = options;

  logger.log(`[MasterJSON] 🎬 Generando Master Scene JSON para proyecto: ${projectId}`);
  logger.log(`[MasterJSON]    Escenas base: ${baseScenes.length}`);
  logger.log(`[MasterJSON]    Generar variaciones: ${generateVariations}`);

  // 1. Obtener perfil de edición
  const detectedGenre = genre || analysis.genre || 'pop';
  const detectedMood = mood.length > 0 ? mood : analysis.mood || [];
  const profile = getEditingProfile(detectedGenre, detectedMood);
  
  logger.log(`[MasterJSON]    Perfil de género: ${profile.genre}`);
  logger.log(`[MasterJSON]    Estilo: ${profile.styleDescription}`);

  // 2. Generar Beat Grid
  const beatGrid = generateBeatGrid(analysis);
  
  // 3. Generar Cut Points
  const cutPoints = generateCutPoints(beatGrid, analysis, profile);

  // 4. Crear escenas con variaciones
  const scenes: MasterScene[] = [];
  let sceneIndex = 0;
  let totalVariations = 0;
  
  for (const cutPoint of cutPoints) {
    // Seleccionar imagen base (rotar entre las disponibles)
    const baseScene = baseScenes[sceneIndex % baseScenes.length];
    
    // Generar variaciones de plano si está habilitado
    let variations: MasterSceneVariation[] = [];
    
    if (generateVariations && cutPoint.durationBeats >= 0.5) {
      try {
        const shotVariations = await generateShotVariations(
          baseScene.imageUrl,
          cutPoint.section,
          cutPoint.energy,
          profile,
          cutPoint.durationBeats,
          beatGrid.beatDuration,
          {
            maxVariations: 4,
            minVariations: 1,
            includeOriginal: true,
            ...variationOptions
          }
        );
        
        let variationStartTime = cutPoint.time;
        let variationIndex = 0;
        
        variations = shotVariations.map(v => {
          const result: MasterSceneVariation = {
            id: `scene_${sceneIndex + 1}_var_${variationIndex + 1}`,
            imageUrl: v.imageUrl,
            shotType: v.type,
            startTime: variationStartTime,
            endTime: variationStartTime + v.durationMs,
            duration: v.durationMs,
            beatStart: cutPoint.beatIndex + v.beatStart,
            beatEnd: cutPoint.beatIndex + v.beatEnd
          };
          variationStartTime += v.durationMs;
          variationIndex++;
          return result;
        });
        
        totalVariations += variations.length;
      } catch (error: any) {
        logger.warn(`[MasterJSON] ⚠️ Error generando variaciones para escena ${sceneIndex + 1}: ${error.message}`);
        // Fallback: usar imagen original
        variations = [{
          id: `scene_${sceneIndex + 1}_var_1`,
          imageUrl: baseScene.imageUrl,
          shotType: 'original',
          startTime: cutPoint.time,
          endTime: cutPoint.time + cutPoint.duration,
          duration: cutPoint.duration,
          beatStart: cutPoint.beatIndex,
          beatEnd: cutPoint.beatIndex + cutPoint.durationBeats
        }];
        totalVariations += 1;
      }
    } else {
      // Sin variaciones, usar imagen original
      variations = [{
        id: `scene_${sceneIndex + 1}_var_1`,
        imageUrl: baseScene.imageUrl,
        shotType: 'original',
        startTime: cutPoint.time,
        endTime: cutPoint.time + cutPoint.duration,
        duration: cutPoint.duration,
        beatStart: cutPoint.beatIndex,
        beatEnd: cutPoint.beatIndex + cutPoint.durationBeats
      }];
      totalVariations += 1;
    }
    
    scenes.push({
      id: `scene_${sceneIndex + 1}`,
      sceneNumber: sceneIndex + 1,
      startTime: cutPoint.time,
      endTime: cutPoint.time + cutPoint.duration,
      duration: cutPoint.duration,
      beatStart: cutPoint.beatIndex,
      beatEnd: cutPoint.beatIndex + cutPoint.durationBeats,
      section: cutPoint.section,
      energy: cutPoint.energy,
      transition: cutPoint.transition,
      isKeyMoment: cutPoint.isKeyMoment,
      baseImageUrl: baseScene.imageUrl,
      variations: variations
    });
    
    sceneIndex++;
    
    // Log progreso cada 10 escenas
    if (sceneIndex % 10 === 0) {
      logger.log(`[MasterJSON]    Procesadas ${sceneIndex}/${cutPoints.length} escenas...`);
    }
  }

  const masterJSON: MasterSceneJSON = {
    projectId,
    title,
    bpm: beatGrid.bpm,
    beatDuration: beatGrid.beatDuration,
    genre: detectedGenre,
    genreProfile: profile.genre,
    totalDuration: beatGrid.totalDuration,
    totalScenes: scenes.length,
    totalVariations: totalVariations,
    generatedAt: new Date().toISOString(),
    scenes
  };

  logger.log(`[MasterJSON] ✅ Master JSON generado:`);
  logger.log(`[MasterJSON]    Total escenas: ${scenes.length}`);
  logger.log(`[MasterJSON]    Total variaciones: ${totalVariations}`);
  logger.log(`[MasterJSON]    Duración: ${Math.round(beatGrid.totalDuration / 1000)}s`);

  return masterJSON;
}

/**
 * Genera solo los cut points sin variaciones de imagen
 * (útil para preview rápido)
 */
export function generateCutPointsOnly(
  analysis: AudioAnalysisResult,
  options: {
    genre?: string;
    mood?: string[];
  } = {}
): { beatGrid: BeatGrid; cutPoints: CutPoint[]; profile: GenreEditingProfile } {
  
  const { genre, mood = [] } = options;
  const detectedGenre = genre || analysis.genre || 'pop';
  const profile = getEditingProfile(detectedGenre, mood);
  const beatGrid = generateBeatGrid(analysis);
  const cutPoints = generateCutPoints(beatGrid, analysis, profile);
  
  return { beatGrid, cutPoints, profile };
}

/**
 * Calcula estadísticas del timeline
 */
export function calculateTimelineStats(masterJSON: MasterSceneJSON): {
  avgSceneDuration: number;
  avgVariationsPerScene: number;
  sectionDistribution: Record<string, number>;
  energyDistribution: Record<string, number>;
  keyMomentsCount: number;
  transitionCounts: Record<string, number>;
} {
  const scenes = masterJSON.scenes;
  
  const avgSceneDuration = scenes.reduce((sum, s) => sum + s.duration, 0) / scenes.length;
  const avgVariationsPerScene = masterJSON.totalVariations / masterJSON.totalScenes;
  
  const sectionDistribution: Record<string, number> = {};
  const energyDistribution: Record<string, number> = {};
  const transitionCounts: Record<string, number> = {};
  let keyMomentsCount = 0;
  
  scenes.forEach(scene => {
    sectionDistribution[scene.section] = (sectionDistribution[scene.section] || 0) + 1;
    energyDistribution[scene.energy] = (energyDistribution[scene.energy] || 0) + 1;
    transitionCounts[scene.transition] = (transitionCounts[scene.transition] || 0) + 1;
    if (scene.isKeyMoment) keyMomentsCount++;
  });
  
  return {
    avgSceneDuration: Math.round(avgSceneDuration),
    avgVariationsPerScene: Math.round(avgVariationsPerScene * 10) / 10,
    sectionDistribution,
    energyDistribution,
    keyMomentsCount,
    transitionCounts
  };
}

/**
 * Convierte MasterSceneJSON al formato esperado por el timeline del frontend
 */
export function convertToTimelineFormat(masterJSON: MasterSceneJSON): Array<{
  id: string;
  startTime: number;
  endTime: number;
  duration: number;
  imageUrl: string;
  section: string;
  transition: string;
  beatInfo: {
    beatStart: number;
    beatEnd: number;
    bpm: number;
  };
  variations: Array<{
    id: string;
    imageUrl: string;
    shotType: string;
    startTime: number;
    duration: number;
  }>;
}> {
  return masterJSON.scenes.map(scene => ({
    id: scene.id,
    startTime: scene.startTime / 1000, // Convertir a segundos
    endTime: scene.endTime / 1000,
    duration: scene.duration / 1000,
    imageUrl: scene.baseImageUrl,
    section: scene.section,
    transition: scene.transition,
    beatInfo: {
      beatStart: scene.beatStart,
      beatEnd: scene.beatEnd,
      bpm: masterJSON.bpm
    },
    variations: scene.variations.map(v => ({
      id: v.id,
      imageUrl: v.imageUrl,
      shotType: v.shotType,
      startTime: v.startTime / 1000,
      duration: v.duration / 1000
    }))
  }));
}
