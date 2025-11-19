/**
 * Master Character Generator
 * Genera una imagen de alta calidad del artista usando análisis facial + Nano Banana (Gemini)
 */

import { analyzeFaceFeatures, generateMasterCharacterPrompt, type FaceAnalysis } from './face-analyzer';
import { logger } from "../logger";

export interface MasterCharacter {
  imageUrl: string;
  analysis: FaceAnalysis;
  prompt: string;
  timestamp: Date;
}

/**
 * Genera el Master Character del artista usando Nano Banana (Gemini 2.5 Flash Image)
 * Este character se usará en todas las generaciones del video
 * OPTIMIZADO: Usa directamente Nano Banana sin análisis facial previo (más rápido)
 */
export async function generateMasterCharacter(
  artistPhotos: string[],
  directorStyle: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<MasterCharacter> {
  try {
    logger.info('🎭 Iniciando generación de Master Character con Nano Banana (modo rápido)...');
    
    // ⚡ OPTIMIZACIÓN: Generar directamente con Nano Banana (SIN análisis facial previo)
    // Nano Banana puede entender las referencias faciales directamente
    onProgress?.('Generando personaje consistente con Nano Banana...', 20);
    
    // Crear prompt optimizado para Master Character (sin análisis previo)
    const characterPrompt = `Create a professional, high-quality master character portrait based on the reference images provided.

Style: ${directorStyle}

CRITICAL REQUIREMENTS:
- Use the reference images to maintain EXACT facial identity, features, and skin tone
- Professional studio lighting
- Cinematic quality and composition
- Photorealistic rendering
- High resolution (8K quality)
- Perfect facial consistency for use across multiple video scenes
- Professional color grading
- Sharp focus on facial details`;
    
    logger.info('📝 Generando con prompt optimizado para Nano Banana...');
    
    onProgress?.('Procesando referencias faciales y generando...', 40);
    
    const response = await fetch('/api/gemini-image/generate-master-character', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        referenceImagesBase64: artistPhotos,
        prompt: characterPrompt,
        directorStyle: directorStyle
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Error generando Master Character');
    }

    const data = await response.json();
    
    onProgress?.('Finalizando...', 95);
    
    if (!data.success || !data.imageUrl) {
      throw new Error('No se generó ninguna imagen');
    }
    
    // Crear análisis simplificado (sin el paso lento de análisis facial)
    const simplifiedAnalysis: FaceAnalysis = {
      faceShape: 'from reference images',
      jawline: 'from reference images',
      cheekbones: 'from reference images',
      eyeShape: 'from reference images',
      eyeColor: 'from reference images',
      eyeSize: 'from reference images',
      eyebrowShape: 'from reference images',
      eyeSpacing: 'from reference images',
      noseShape: 'from reference images',
      noseSize: 'from reference images',
      lipShape: 'from reference images',
      lipSize: 'from reference images',
      smileType: 'from reference images',
      hairColor: 'from reference images',
      hairTexture: 'from reference images',
      hairStyle: 'from reference images',
      hairline: 'from reference images',
      skinTone: 'from reference images',
      skinTexture: 'from reference images',
      distinctiveFeatures: ['Based on reference images'],
      typicalExpression: 'from reference images',
      facialProportions: {
        foreheadSize: 'from reference images',
        eyeToEyeDistance: 'from reference images',
        noseToLipDistance: 'from reference images',
        chinSize: 'from reference images'
      },
      apparentAge: 'from reference images',
      perceivedGender: 'from reference images',
      overallDescription: 'Master character generated directly from reference images using Nano Banana',
      generationPrompt: characterPrompt
    };
    
    const masterCharacter: MasterCharacter = {
      imageUrl: data.imageUrl,
      analysis: simplifiedAnalysis,
      prompt: characterPrompt,
      timestamp: new Date()
    };
    
    onProgress?.('Master Character generado exitosamente', 100);
    logger.info('✅ Master Character generado con Nano Banana (modo rápido):', masterCharacter.imageUrl.substring(0, 100) + '...');
    
    return masterCharacter;
    
  } catch (error) {
    logger.error('❌ Error generando Master Character:', error);
    throw error;
  }
}

/**
 * Genera variantes del master character para diferentes contextos usando Nano Banana
 * (opcional, para uso futuro)
 */
export async function generateCharacterVariants(
  masterCharacter: MasterCharacter,
  contexts: string[],
  artistPhotos: string[],
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

    try {
      const response = await fetch('/api/gemini-image/generate-simple', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: variantPrompt,
          referenceImages: artistPhotos
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.imageUrl) {
          variants.push(data.imageUrl);
        }
      }
    } catch (error) {
      logger.error('Error generando variante:', error);
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
