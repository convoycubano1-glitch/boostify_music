/**
 * Master Character Generator
 * Genera una imagen de alta calidad del artista usando análisis facial + Flux
 */

import fluxService, { FluxModel } from './flux/flux-service';
import { analyzeFaceFeatures, generateMasterCharacterPrompt, type FaceAnalysis } from './face-analyzer';

export interface MasterCharacter {
  imageUrl: string;
  analysis: FaceAnalysis;
  prompt: string;
  timestamp: Date;
}

/**
 * Genera el Master Character del artista
 * Este character se usará en todas las generaciones del video
 */
export async function generateMasterCharacter(
  artistPhotos: string[],
  directorStyle: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<MasterCharacter> {
  try {
    console.log('🎭 Iniciando generación de Master Character...');
    
    // Paso 1: Analizar características faciales (20%)
    onProgress?.('Analizando rasgos faciales con IA...', 20);
    const analysis = await analyzeFaceFeatures(artistPhotos);
    console.log('✅ Análisis facial completado');
    
    // Paso 2: Generar prompt optimizado (30%)
    onProgress?.('Creando prompt de generación optimizado...', 30);
    const characterPrompt = generateMasterCharacterPrompt(analysis, directorStyle);
    console.log('📝 Prompt generado:', characterPrompt.substring(0, 100) + '...');
    
    // Paso 3: Generar imagen con Flux Pro (40% - 90%)
    onProgress?.('Generando imagen de alta calidad con Flux Pro...', 40);
    
    const result = await fluxService.generateImage({
      prompt: characterPrompt,
      model: FluxModel.FLUX1_DEV_ADVANCED,
      width: 1024,
      height: 1024,
      steps: 50, // Alta calidad
      guidance_scale: 7.5
    });
    
    onProgress?.('Finalizando...', 95);
    
    if (!result.images || result.images.length === 0) {
      throw new Error('No se generó ninguna imagen');
    }
    
    const masterCharacter: MasterCharacter = {
      imageUrl: result.images[0], // images es string[] directamente
      analysis,
      prompt: characterPrompt,
      timestamp: new Date()
    };
    
    onProgress?.('Master Character generado exitosamente', 100);
    console.log('✅ Master Character generado:', masterCharacter.imageUrl);
    
    return masterCharacter;
    
  } catch (error) {
    console.error('❌ Error generando Master Character:', error);
    throw error;
  }
}

/**
 * Genera variantes del master character para diferentes contextos
 * (opcional, para uso futuro)
 */
export async function generateCharacterVariants(
  masterCharacter: MasterCharacter,
  contexts: string[],
  onProgress?: (stage: string, progress: number) => void
): Promise<string[]> {
  const variants: string[] = [];
  
  for (let i = 0; i < contexts.length; i++) {
    const context = contexts[i];
    const progress = ((i + 1) / contexts.length) * 100;
    
    onProgress?.(`Generando variante ${i + 1}/${contexts.length}: ${context}`, progress);
    
    const variantPrompt = `${masterCharacter.prompt}

Context: ${context}

Maintain the exact same person with all their facial features, just adapt to the new context.`;

    const result = await fluxService.generateImage({
      prompt: variantPrompt,
      model: FluxModel.FLUX1_DEV_ADVANCED,
      width: 1024,
      height: 1024,
      steps: 40,
      guidance_scale: 7.5
    });
    
    if (result.images && result.images.length > 0) {
      variants.push(result.images[0]); // images es string[] directamente
    }
  }
  
  return variants;
}

/**
 * Valida que el master character generado sea de buena calidad
 */
export function validateMasterCharacter(character: MasterCharacter): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!character.imageUrl) {
    issues.push('No image URL provided');
  }
  
  if (!character.analysis) {
    issues.push('No facial analysis data');
  }
  
  if (!character.prompt || character.prompt.length < 50) {
    issues.push('Prompt is too short or missing');
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}
