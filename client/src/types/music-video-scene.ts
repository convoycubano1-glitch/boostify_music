/**
 * Tipos unificados para el sistema de generación de videos musicales con IA
 * 
 * Este archivo define el schema completo que se comparte entre:
 * - Generación de script (openrouter.fixed.ts)
 * - Generación de imágenes (gemini-image.ts)
 * - Timeline editor (TimelineEditor.tsx)
 */

/**
 * Tipos de planos cinematográficos completos
 * Basados en nomenclatura estándar de la industria
 */
export enum ShotType {
  // Extreme Close-up - Plano extremadamente cerrado
  ECU = 'ECU',
  
  // Close-up - Primer plano
  CU = 'CU',
  
  // Medium Close-up - Plano medio cerrado
  MCU = 'MCU',
  
  // Medium Shot - Plano medio
  MS = 'MS',
  
  // Medium Wide Shot - Plano medio abierto
  MWS = 'MWS',
  
  // Long Shot - Plano largo
  LS = 'LS',
  
  // Wide Shot - Plano general
  WS = 'WS',
  
  // Extreme Wide Shot - Plano extremadamente abierto
  EWS = 'EWS',
  
  // Over-the-shoulder - Por encima del hombro
  OTS = 'OTS',
  
  // Point of View - Punto de vista
  POV = 'POV',
  
  // High Angle - Ángulo alto
  HIGH = 'HIGH',
  
  // Low Angle - Ángulo bajo
  LOW = 'LOW',
  
  // Dutch Angle - Ángulo holandés
  DUTCH = 'DUTCH'
}

/**
 * Rol de la escena en el video musical
 * 50% debe ser performance y 50% debe ser b-roll
 */
export enum SceneRole {
  // Artista performing (cantando, tocando instrumento, etc.)
  PERFORMANCE = 'performance',
  
  // B-roll (escenas de historia, ambiente, escenarios, etc.)
  BROLL = 'b-roll'
}

/**
 * Tipos de movimiento de cámara
 */
export enum CameraMovement {
  STATIC = 'static',
  PAN = 'pan',
  TILT = 'tilt',
  DOLLY = 'dolly',
  ZOOM = 'zoom',
  HANDHELD = 'handheld',
  STEADICAM = 'steadicam',
  CRANE = 'crane',
  DRONE = 'drone',
  TRACKING = 'tracking'
}

/**
 * Tipos de lentes cinematográficos
 */
export enum LensType {
  ULTRA_WIDE = '14mm',
  WIDE = '24mm',
  STANDARD = '35mm',
  PORTRAIT = '50mm',
  TELEPHOTO = '85mm',
  LONG_TELEPHOTO = '135mm'
}

/**
 * Estilos visuales
 */
export enum VisualStyle {
  CINEMATIC = 'cinematic',
  VIBRANT = 'vibrant',
  MUTED = 'muted',
  HIGH_CONTRAST = 'high-contrast',
  MOODY = 'moody',
  WARM = 'warm',
  COOL = 'cool',
  SATURATED = 'saturated',
  DESATURATED = 'desaturated'
}

/**
 * Tipos de iluminación
 */
export enum LightingType {
  NATURAL = 'natural',
  STUDIO = 'studio',
  DRAMATIC = 'dramatic',
  SOFT = 'soft',
  HARD = 'hard',
  MIXED = 'mixed',
  GOLDEN_HOUR = 'golden-hour',
  BLUE_HOUR = 'blue-hour',
  NEON = 'neon'
}

/**
 * Sección musical (para referencia, no se muestra en timeline)
 */
export enum MusicSection {
  INTRO = 'intro',
  VERSE = 'verse',
  PRE_CHORUS = 'pre-chorus',
  CHORUS = 'chorus',
  BRIDGE = 'bridge',
  OUTRO = 'outro',
  BREAKDOWN = 'breakdown'
}

/**
 * Schema principal de una escena de video musical
 * Este es el tipo unificado que se usa en todo el sistema
 */
export interface MusicVideoScene {
  // Identificadores
  scene_id: string;                    // ID único de la escena (ej: "scene-1")
  
  // Temporalidad (sincronizada con beats de la música)
  start_time: number;                  // Tiempo de inicio en segundos
  duration: number;                    // Duración en segundos
  beat_index?: number;                 // Índice del beat donde inicia
  
  // Rol y tipo de plano
  role: SceneRole;                     // 'performance' o 'b-roll'
  shot_type: ShotType;                 // ECU, CU, MS, LS, etc.
  
  // Configuración de cámara
  camera_movement: CameraMovement;     // Tipo de movimiento
  lens: LensType;                      // Lente usado
  
  // Estilo visual
  visual_style: VisualStyle;           // Estilo visual general
  lighting: LightingType;              // Tipo de iluminación
  color_temperature?: string;          // Temperatura de color (ej: "3200K", "5600K")
  
  // Descripción de la escena
  description: string;                 // Descripción detallada para generación de imagen
  location?: string;                   // Ubicación/escenario
  
  // Sección musical (solo para referencia interna)
  music_section: MusicSection;         // Intro, Verse, Chorus, etc.
  
  // Estado de generación
  image_url?: string;                  // URL de la imagen generada
  status?: 'pending' | 'generating' | 'completed' | 'error';
  
  // Metadatos adicionales
  metadata?: {
    generation_prompt?: string;        // Prompt usado para generar la imagen
    generation_timestamp?: number;     // Timestamp de generación
    error_message?: string;            // Mensaje de error si falla
  };
}

/**
 * Configuración para generación del script completo
 */
export interface ScriptGenerationConfig {
  // Audio
  audio_duration: number;              // Duración del audio en segundos
  audio_transcription: string;         // Transcripción del audio
  
  // Configuración de escenas
  target_scene_count?: number;         // Número objetivo de escenas (default: basado en beats)
  scene_duration_range?: {             // Rango de duración por escena
    min: number;
    max: number;
  };
  
  // Balance de roles
  performance_ratio?: number;          // Ratio de performance vs b-roll (default: 0.5 = 50%)
  
  // Beats detectados
  beats?: Array<{
    time: number;
    strength: number;
  }>;
  
  // Personalización del artista
  artist_description?: string;         // Descripción del artista
  artist_style?: string;               // Estilo del artista
  
  // Referencias visuales
  visual_references?: string[];        // Referencias de estilo visual
  
  // Restricciones
  constraints?: {
    max_consecutive_same_shot?: number;  // Máximo de shots consecutivos del mismo tipo
    required_shot_types?: ShotType[];    // Tipos de shots que deben incluirse
    forbidden_shot_types?: ShotType[];   // Tipos de shots a evitar
  };
}

/**
 * Resultado completo de la generación de script
 */
export interface MusicVideoScript {
  // Metadatos del script
  id: string;
  title: string;
  duration: number;
  scene_count: number;
  
  // Escenas generadas
  scenes: MusicVideoScene[];
  
  // Estadísticas
  stats: {
    performance_count: number;
    broll_count: number;
    performance_ratio: number;
    shot_type_distribution: Record<ShotType, number>;
  };
  
  // Información de generación
  generated_at: number;
  generation_config: ScriptGenerationConfig;
}

/**
 * Resultado de generación batch de imágenes
 */
export interface BatchImageGenerationResult {
  success: boolean;
  scenes: MusicVideoScene[];  // Escenas con image_url poblado
  failed_scenes?: string[];   // IDs de escenas que fallaron
  error?: string;
}

/**
 * Validador de balance 50/50
 */
export function validateSceneBalance(scenes: MusicVideoScene[]): {
  valid: boolean;
  performance_ratio: number;
  message: string;
} {
  const total = scenes.length;
  const performance_count = scenes.filter(s => s.role === SceneRole.PERFORMANCE).length;
  const performance_ratio = performance_count / total;
  
  const tolerance = 0.1; // 10% de tolerancia
  const valid = Math.abs(performance_ratio - 0.5) <= tolerance;
  
  return {
    valid,
    performance_ratio,
    message: valid 
      ? `Balance correcto: ${(performance_ratio * 100).toFixed(1)}% performance`
      : `Balance incorrecto: ${(performance_ratio * 100).toFixed(1)}% performance (debe ser ~50%)`
  };
}

/**
 * Generador de shot_type variado
 * Asegura que no haya muchos shots consecutivos del mismo tipo
 */
export function generateVariedShotSequence(
  count: number,
  maxConsecutive: number = 2
): ShotType[] {
  const allShots = Object.values(ShotType);
  const sequence: ShotType[] = [];
  let consecutiveCount = 0;
  let lastShot: ShotType | null = null;
  
  for (let i = 0; i < count; i++) {
    let shot: ShotType;
    
    if (lastShot && consecutiveCount >= maxConsecutive) {
      // Forzar un shot diferente
      const available = allShots.filter(s => s !== lastShot);
      shot = available[Math.floor(Math.random() * available.length)];
    } else {
      // Shot aleatorio
      shot = allShots[Math.floor(Math.random() * allShots.length)];
    }
    
    if (shot === lastShot) {
      consecutiveCount++;
    } else {
      consecutiveCount = 1;
      lastShot = shot;
    }
    
    sequence.push(shot);
  }
  
  return sequence;
}

/**
 * Helper para convertir MusicVideoScene a TimelineClip
 */
export function sceneToTimelineClip(scene: MusicVideoScene, layerId: number): any {
  return {
    id: scene.scene_id,
    layerId,
    type: 'image' as const,
    start: scene.start_time,
    duration: scene.duration,
    url: scene.image_url || undefined,
    title: `${scene.shot_type} - ${scene.role}`,
    metadata: {
      scene_id: scene.scene_id,
      shot_type: scene.shot_type,
      role: scene.role,
      music_section: scene.music_section,
      camera_movement: scene.camera_movement,
      lens: scene.lens,
      visual_style: scene.visual_style,
      lighting: scene.lighting
    },
    generated: true,
    generatedImage: true
  };
}
