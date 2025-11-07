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
  quotaError?: boolean;
  provider?: 'gemini' | 'fal' | 'unknown';
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
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${imageBase64}`,
          provider: 'gemini'
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
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${imageBase64}`,
          provider: 'gemini'
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
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${imageBase64}`,
          provider: 'gemini'
        };
      }
    }

    throw new Error('No se encontró imagen en la respuesta');
  } catch (error: any) {
    console.error('Error generando imagen con múltiples referencias faciales:', error);
    
    // Detectar error de cuota excedida (429)
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return {
        success: false,
        error: 'QUOTA_EXCEEDED',
        quotaError: true
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error desconocido al generar imagen con rostros'
    };
  }
}

/**
 * Genera múltiples imágenes en lote con MÚLTIPLES referencias faciales
 * Ideal para crear videos musicales con consistencia facial usando hasta 3 fotos del artista
 * USA SEMILLA CONSISTENTE PARA COHERENCIA VISUAL (color, tono, iluminación)
 */
export async function generateBatchImagesWithMultipleFaceReferences(
  scenes: CinematicScene[],
  referenceImagesBase64: string[],
  useFallback: boolean = true
): Promise<Map<number, ImageGenerationResult>> {
  const results = new Map<number, ImageGenerationResult>();
  let quotaExceeded = false;
  
  // 🌱 GENERAR SEMILLA BASE para coherencia visual entre escenas
  // Usar timestamp + random para unicidad, pero consistente dentro de la sesión
  const baseSeed = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  
  console.log(`🎨 Generando ${scenes.length} escenas con ${referenceImagesBase64.length} referencias faciales`);
  console.log(`📌 Fallback a FAL AI: ${useFallback ? 'ACTIVADO' : 'DESACTIVADO'}`);
  console.log(`🌱 Semilla base para coherencia visual: ${baseSeed}`);
  
  for (const scene of scenes) {
    console.log(`🎬 Generando escena ${scene.id}/${scenes.length}...`);
    
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
    
    // Intentar primero con Gemini
    let result = await generateImageWithMultipleFaceReferences(cinematicPrompt, referenceImagesBase64);
    
    // CRÍTICO: Extraer número del scene.id para calcular semilla y key
    // scene.id puede ser "scene-1", "scene-2", etc.
    const sceneIdStr = String(scene.id);
    const sceneNumber = sceneIdStr.includes('scene-') 
      ? parseInt(sceneIdStr.replace('scene-', '')) 
      : parseInt(sceneIdStr);
    
    // Calcular semilla única para esta escena (mantiene coherencia visual)
    const sceneSeed = baseSeed + sceneNumber;
    
    // Si falla y el fallback está activado, intentar con FAL AI
    if (!result.success && useFallback && !quotaExceeded) {
      console.log(`⚠️ Gemini falló para escena ${scene.id}, intentando con FAL AI...`);
      result = await generateImageWithFAL(cinematicPrompt, referenceImagesBase64, sceneSeed);
      
      if (result.success) {
        console.log(`✅ Escena ${scene.id} generada exitosamente con FAL AI (fallback)`);
      }
    }
    
    results.set(sceneNumber, result);
    
    // Si se detecta error de cuota, detener la generación
    if ((result as any).quotaError) {
      console.log(`⚠️ Cuota de API excedida después de generar ${results.size} imágenes. Deteniendo generación.`);
      quotaExceeded = true;
      break;
    }
    
    // Delay para evitar rate limiting (1.5 segundos entre requests)
    if (scenes.indexOf(scene) < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  if (quotaExceeded) {
    console.log(`⚠️ Generación detenida por límite de cuota: ${results.size}/${scenes.length} imágenes creadas`);
  } else {
    console.log(`✅ Generación completada: ${results.size} imágenes creadas`);
  }
  
  return results;
}

/**
 * Genera una imagen usando FAL AI FLUX Pro v1.1 con referencias faciales
 * USAR IMÁGENES DE REFERENCIA SUBIDAS POR EL USUARIO
 * USA SEMILLA (SEED) PARA COHERENCIA VISUAL
 */
async function generateImageWithFAL(
  prompt: string,
  referenceImagesBase64: string[],
  seed?: number
): Promise<ImageGenerationResult> {
  try {
    // Importar axios dinámicamente
    const axios = (await import('axios')).default;
    
    // Obtener la API key de FAL
    const FAL_API_KEY = process.env.FAL_API_KEY;
    
    if (!FAL_API_KEY) {
      return {
        success: false,
        error: 'FAL_API_KEY no configurada'
      };
    }
    
    // Mejorar el prompt para mantener consistencia facial
    const enhancedPrompt = `${prompt}. Professional photography, same person, consistent facial features, high quality, detailed, 8k resolution.`;
    
    console.log(`🎨 Generando con FAL AI FLUX Pro v1.1 (${referenceImagesBase64.length} referencias, seed: ${seed || 'auto'})...`);
    
    // Preparar request body base
    const requestBody: any = {
      prompt: enhancedPrompt,
      image_size: 'landscape_16_9',
      num_inference_steps: 28,
      guidance_scale: 3.5,
      num_images: 1,
      enable_safety_checker: false,
      output_format: 'jpeg'
    };
    
    // 🌱 CRÍTICO: Agregar semilla para coherencia visual
    if (seed !== undefined) {
      requestBody.seed = seed;
      console.log(`🌱 Usando semilla ${seed} para coherencia visual (color, tono, estilo)`);
    }
    
    // CRÍTICO: Usar imagen de referencia si está disponible
    if (referenceImagesBase64 && referenceImagesBase64.length > 0) {
      // Usar la primera imagen de referencia como base
      const referenceImage = referenceImagesBase64[0];
      
      // Convertir base64 a data URI si no lo es ya
      const imageDataUri = referenceImage.startsWith('data:') 
        ? referenceImage 
        : `data:image/jpeg;base64,${referenceImage}`;
      
      requestBody.image_url = imageDataUri;
      requestBody.image_prompt_strength = 0.4; // Influencia media-alta para mantener rasgos faciales
      
      console.log(`✅ Usando referencia facial (strength: 0.4)`);
    }
    
    // Usar FLUX Pro v1.1 que soporta image_url
    const response = await axios.post(
      'https://fal.run/fal-ai/flux-pro/v1.1',
      requestBody,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 90000 // Aumentar timeout por referencias
      }
    );
    
    // Verificar si hay imágenes en la respuesta
    if (response.data && response.data.images && response.data.images.length > 0) {
      const imageUrl = response.data.images[0].url;
      
      console.log(`✅ Imagen generada con FAL AI (con referencia facial)`);
      
      return {
        success: true,
        imageUrl: imageUrl,
        provider: 'fal',
        error: undefined
      };
    }
    
    return {
      success: false,
      error: 'No se generaron imágenes con FAL AI'
    };
    
  } catch (error: any) {
    console.error('Error generando imagen con FAL AI:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error al generar imagen con FAL AI'
    };
  }
}
