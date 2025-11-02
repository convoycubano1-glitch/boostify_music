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

/**
 * Genera una imagen adaptando el rostro de una imagen de referencia
 * Usa image-to-image editing de Gemini para mantener consistencia facial
 */
export async function generateImageWithFaceReference(
  prompt: string,
  referenceImageBase64: string
): Promise<ImageGenerationResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    console.log('Generando imagen con referencia facial...');

    // Crear el prompt combinado para mantener la cara de la referencia
    const combinedPrompt = `${prompt}

IMPORTANT: Maintain the exact same face, facial features, and person from the reference image. Keep their identity, facial structure, skin tone, and distinctive features identical.`;

    // Usar Gemini con imagen de referencia para edición
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        { 
          role: "user", 
          parts: [
            {
              inlineData: {
                data: referenceImageBase64,
                mimeType: "image/jpeg"
              }
            },
            { text: combinedPrompt }
          ] 
        }
      ],
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
        console.log('Imagen con rostro adaptado generada exitosamente');
        
        return {
          success: true,
          imageBase64: imageBase64,
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${imageBase64}`
        };
      }
    }

    throw new Error('No se encontró imagen en la respuesta');
  } catch (error: any) {
    console.error('Error generando imagen con referencia facial:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar imagen con rostro'
    };
  }
}

/**
 * Genera múltiples imágenes en lote con referencia facial
 */
export async function generateBatchImagesWithFaceReference(
  scenes: CinematicScene[],
  referenceImageBase64: string
): Promise<Map<number, ImageGenerationResult>> {
  const results = new Map<number, ImageGenerationResult>();
  
  for (const scene of scenes) {
    console.log(`Generando imagen con rostro ${scene.id}/${scenes.length}...`);
    
    // Construir prompt cinematográfico
    const cinematicPrompt = `
Professional cinematic photography for a music video:

Scene: ${scene.scene}
Camera Setup: ${scene.camera}
Lighting: ${scene.lighting}
Visual Style: ${scene.style}
Camera Movement: ${scene.movement}

Create a high-quality, professional music video frame with cinematic composition.
    `.trim();
    
    const result = await generateImageWithFaceReference(cinematicPrompt, referenceImageBase64);
    results.set(scene.id, result);
    
    // Delay para evitar rate limiting
    if (scenes.indexOf(scene) < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  return results;
}

/**
 * Genera una imagen usando MÚLTIPLES imágenes de referencia (hasta 3)
 * Nano Banana puede usar múltiples referencias para mejor adaptación facial
 */
export async function generateImageWithMultipleFaceReferences(
  prompt: string,
  referenceImagesBase64: string[]
): Promise<ImageGenerationResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    if (!referenceImagesBase64 || referenceImagesBase64.length === 0) {
      // Si no hay referencias, usar generación normal
      return await generateCinematicImage(prompt);
    }

    console.log(`Generando imagen con ${referenceImagesBase64.length} referencias faciales...`);

    // Crear el prompt mejorado para múltiples referencias
    const combinedPrompt = `${prompt}

CRITICAL: Use these ${referenceImagesBase64.length} reference images to maintain facial consistency. The person should have the EXACT same face, features, skin tone, and identity across all generated images. Blend the best features from all reference angles to create a consistent appearance.`;

    // Construir array de parts con todas las imágenes de referencia
    const parts: any[] = [];
    
    // Agregar todas las imágenes de referencia primero
    for (let i = 0; i < Math.min(referenceImagesBase64.length, 3); i++) {
      const base64Data = referenceImagesBase64[i].split(',')[1] || referenceImagesBase64[i];
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      });
    }
    
    // Agregar el prompt al final
    parts.push({ text: combinedPrompt });

    // Usar Gemini con múltiples imágenes de referencia
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-preview-image-generation",
      contents: [
        { 
          role: "user", 
          parts: parts
        }
      ],
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
        console.log('Imagen con rostros adaptados generada exitosamente');
        
        return {
          success: true,
          imageBase64: imageBase64,
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${imageBase64}`
        };
      }
    }

    throw new Error('No se encontró imagen en la respuesta');
  } catch (error: any) {
    console.error('Error generando imagen con múltiples referencias faciales:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar imagen con rostros'
    };
  }
}

/**
 * Genera múltiples imágenes en lote con MÚLTIPLES referencias faciales
 * Ideal para crear videos musicales con consistencia facial usando hasta 3 fotos del artista
 */
export async function generateBatchImagesWithMultipleFaceReferences(
  scenes: CinematicScene[],
  referenceImagesBase64: string[]
): Promise<Map<number, ImageGenerationResult>> {
  const results = new Map<number, ImageGenerationResult>();
  
  console.log(`Generando ${scenes.length} escenas con ${referenceImagesBase64.length} referencias faciales`);
  
  for (const scene of scenes) {
    console.log(`Generando escena ${scene.id}/${scenes.length}...`);
    
    // Construir prompt cinematográfico detallado
    const cinematicPrompt = `
Professional cinematic photography for a music video:

Scene: ${scene.scene}
Camera Setup: ${scene.camera}
Lighting: ${scene.lighting}
Visual Style: ${scene.style}
Camera Movement: ${scene.movement}

Create a high-quality, professional music video frame with cinematic composition, perfect lighting, and stunning visual aesthetics.
    `.trim();
    
    const result = await generateImageWithMultipleFaceReferences(cinematicPrompt, referenceImagesBase64);
    results.set(scene.id, result);
    
    // Delay para evitar rate limiting (1.5 segundos entre requests)
    if (scenes.indexOf(scene) < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  console.log(`Generación completada: ${results.size} imágenes creadas`);
  return results;
}
