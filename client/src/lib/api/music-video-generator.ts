/**
 * Music Video Generator
 * Helper para generar scripts JSON con prompts variados
 */

import { generateMusicVideoScript } from "./openrouter";

export interface ScenePrompt {
  scene_id: number;
  start_time: number;
  duration: number;
  prompt: string;
  negative_prompt?: string;
  lyrics_segment?: string;
}

export interface MusicVideoScript {
  title: string;
  total_duration: number;
  total_scenes: number;
  scenes: ScenePrompt[];
}

/**
 * Genera un script con prompts variados para el video musical
 * @param transcription - La letra de la canción transcrita
 * @param audioDuration - Duración total del audio en segundos
 * @param isPaid - Si es un video pagado (30 escenas) o preview gratuito (3-5 escenas)
 * @param directorInfo - Información opcional del director seleccionado
 * @returns Script JSON con escenas y prompts
 */
export async function generateMusicVideoPrompts(
  transcription: string,
  audioDuration: number,
  isPaid: boolean = false,
  directorInfo?: { name: string; specialty: string; style: string },
  editingStyle?: { id: string; name: string; description: string; duration: { min: number; max: number } }
): Promise<MusicVideoScript> {
  
  const targetSceneCount = isPaid ? 30 : Math.min(5, Math.floor(audioDuration / 2));
  const targetDuration = isPaid ? audioDuration : Math.min(10, audioDuration);
  
  console.log(`🎬 Generando script ${isPaid ? 'COMPLETO' : 'PREVIEW'}:`);
  console.log(`  - Escenas: ${targetSceneCount}`);
  console.log(`  - Duración: ${targetDuration}s`);
  console.log(`  - Estilo de edición: ${editingStyle?.name || 'Phrase-based Editing'}`);
  console.log(`  - Rango de duración: ${editingStyle?.duration.min || 4}-${editingStyle?.duration.max || 8}s por escena`);
  
  try {
    // Llamar a la API para generar el guion con el número específico de escenas
    const scriptResponse = await generateMusicVideoScript(
      transcription,
      targetSceneCount,
      directorInfo,
      targetDuration,
      editingStyle
    );
    
    // Parsear el JSON del script
    const parsed = JSON.parse(scriptResponse);
    
    // Extraer escenas en el formato correcto
    let scenes: ScenePrompt[] = [];
    if (parsed.scenes && Array.isArray(parsed.scenes)) {
      scenes = parsed.scenes;
    } else if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].scene_id) {
      scenes = parsed;
    } else {
      throw new Error('Formato de script inválido');
    }
    
    // Ajustar duraciones para que encajen en el tiempo objetivo
    const adjustedScenes = adjustSceneDurations(scenes, targetDuration);
    
    return {
      title: isPaid ? "Video Musical Completo" : "Vista Previa",
      total_duration: targetDuration,
      total_scenes: adjustedScenes.length,
      scenes: adjustedScenes
    };
  } catch (error) {
    console.error('Error generando prompts:', error);
    throw error;
  }
}

/**
 * Ajusta las duraciones de las escenas para que encajen exactamente en la duración total
 */
function adjustSceneDurations(scenes: ScenePrompt[], targetDuration: number): ScenePrompt[] {
  if (scenes.length === 0) return [];
  
  // Calcular duración total actual
  const currentTotal = scenes.reduce((sum, scene) => sum + scene.duration, 0);
  const scaleFactor = targetDuration / currentTotal;
  
  let cumulativeTime = 0;
  const adjusted = scenes.map((scene, index) => {
    const scaledDuration = scene.duration * scaleFactor;
    const adjustedScene = {
      ...scene,
      start_time: cumulativeTime,
      duration: scaledDuration
    };
    cumulativeTime += scaledDuration;
    return adjustedScene;
  });
  
  // Ajustar última escena para que termine exactamente en targetDuration
  if (adjusted.length > 0) {
    const lastScene = adjusted[adjusted.length - 1];
    lastScene.duration = targetDuration - lastScene.start_time;
  }
  
  return adjusted;
}

/**
 * Genera prompts variados para hacer el video más dinámico
 * Añade variaciones de cámara, iluminación y estilo
 */
export function enhancePrompt(
  basePrompt: string,
  sceneIndex: number,
  totalScenes: number
): string {
  const cameraAngles = [
    "wide shot",
    "close-up",
    "medium shot",
    "bird's eye view",
    "low angle",
    "dutch angle",
    "over the shoulder"
  ];
  
  const lighting = [
    "dramatic lighting",
    "soft natural light",
    "neon lights",
    "golden hour",
    "moody shadows",
    "vibrant colors",
    "high contrast"
  ];
  
  const movements = [
    "slow motion",
    "dynamic camera movement",
    "smooth dolly shot",
    "steady tracking shot",
    "cinematic pan",
    "elegant crane shot"
  ];
  
  // Seleccionar variaciones basadas en el índice de escena para diversidad
  const camera = cameraAngles[sceneIndex % cameraAngles.length];
  const light = lighting[Math.floor(sceneIndex / 2) % lighting.length];
  const movement = movements[Math.floor(sceneIndex / 3) % movements.length];
  
  return `${basePrompt}, ${camera}, ${light}, ${movement}, cinematic quality, professional music video`;
}

/**
 * Genera prompts negativos estándar para evitar elementos no deseados
 */
export function getStandardNegativePrompt(): string {
  return "blurry, low quality, distorted, deformed, watermark, text, logo, amateur, poor lighting, grainy";
}

export default {
  generatePrompts: generateMusicVideoPrompts,
  enhancePrompt,
  getNegativePrompt: getStandardNegativePrompt
};
