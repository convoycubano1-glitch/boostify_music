import { logger } from "../logger";
/**
 * Cliente para la API de Gemini Image Generation
 */

export interface CinematicScene {
  id: number;
  scene: string;
  camera: string;
  lighting: string;
  style: string;
  movement: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageBase64?: string;
  imageUrl?: string;
  error?: string;
}

/**
 * Genera una imagen simple desde un prompt
 */
export async function generateImageFromPrompt(prompt: string): Promise<ImageGenerationResult> {
  try {
    const response = await fetch('/api/gemini/generate-simple', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.error('Error generando imagen:', error);
    return {
      success: false,
      error: error.message || 'Error al generar imagen'
    };
  }
}

/**
 * Genera una imagen desde una escena cinematográfica completa
 */
export async function generateImageFromScene(scene: CinematicScene): Promise<ImageGenerationResult> {
  try {
    const response = await fetch('/api/gemini/generate-scene', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(scene),
    });

    const data = await response.json();
    return data;
  } catch (error: any) {
    logger.error('Error generando imagen desde escena:', error);
    return {
      success: false,
      error: error.message || 'Error al generar imagen'
    };
  }
}

/**
 * Genera múltiples imágenes en lote
 */
export async function generateBatchImages(scenes: CinematicScene[]): Promise<Record<number, ImageGenerationResult>> {
  try {
    const response = await fetch('/api/gemini/generate-batch', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ scenes }),
    });

    const data = await response.json();
    
    if (data.success) {
      return data.results;
    } else {
      throw new Error(data.error || 'Error al generar imágenes en lote');
    }
  } catch (error: any) {
    logger.error('Error generando imágenes en lote:', error);
    throw error;
  }
}
