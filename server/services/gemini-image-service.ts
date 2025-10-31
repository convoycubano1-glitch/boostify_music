/**
 * Servicio de generación de imágenes con Gemini 2.5 Flash Image (Nano Banana)
 * Para crear imágenes cinematográficas de alta calidad para videos musicales
 */
import { GoogleGenAI, Modality } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "" 
});

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
 * Genera una imagen usando Gemini 2.5 Flash Image
 * @param prompt - Descripción detallada de la escena
 * @returns Imagen en formato base64
 */
export async function generateCinematicImage(
  prompt: string
): Promise<ImageGenerationResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    console.log('Generando imagen con Gemini:', prompt.substring(0, 100) + '...');

    // Usar el modelo de generación de imágenes de Gemini 2.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No se recibieron candidatos de la API');
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error('Contenido vacío en la respuesta');
    }

    // Buscar la parte de imagen en la respuesta
    for (const part of content.parts) {
      if (part.text) {
        console.log('Texto de respuesta:', part.text);
      } else if (part.inlineData && part.inlineData.data) {
        const imageBase64 = part.inlineData.data;
        console.log('Imagen generada exitosamente');
        
        return {
          success: true,
          imageBase64: imageBase64,
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${imageBase64}`
        };
      }
    }

    throw new Error('No se encontró imagen en la respuesta');
  } catch (error: any) {
    console.error('Error generando imagen con Gemini:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar imagen'
    };
  }
}

/**
 * Genera imagen a partir de una escena cinematográfica completa
 * Combina todos los parámetros cinematográficos en un prompt optimizado
 */
export async function generateImageFromCinematicScene(
  scene: CinematicScene
): Promise<ImageGenerationResult> {
  // Construir prompt cinematográfico detallado
  const cinematicPrompt = `
Professional cinematic photography for a music video:

Scene: ${scene.scene}

Camera Setup: ${scene.camera}

Lighting: ${scene.lighting}

Visual Style: ${scene.style}

Camera Movement: ${scene.movement}

Create a high-quality, professional music video frame with cinematic composition, perfect lighting, and stunning visual aesthetics. The image should be production-ready for a premium music video.
  `.trim();

  return await generateCinematicImage(cinematicPrompt);
}

/**
 * Genera múltiples imágenes en lote
 */
export async function generateBatchImages(
  scenes: CinematicScene[]
): Promise<Map<number, ImageGenerationResult>> {
  const results = new Map<number, ImageGenerationResult>();
  
  // Generar imágenes secuencialmente para evitar rate limits
  for (const scene of scenes) {
    console.log(`Generando imagen ${scene.id}/${scenes.length}...`);
    const result = await generateImageFromCinematicScene(scene);
    results.set(scene.id, result);
    
    // Pequeño delay para evitar rate limiting
    if (scenes.indexOf(scene) < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}
