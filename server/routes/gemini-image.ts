/**
 * Rutas para generación de imágenes con Gemini
 */
import { Router, Request, Response } from 'express';
import { 
  generateCinematicImage, 
  generateImageFromCinematicScene,
  generateBatchImages,
  generateBatchImagesWithMultipleFaceReferences,
  type CinematicScene 
} from '../services/gemini-image-service';

const router = Router();

/**
 * Genera una imagen simple desde un prompt
 * Opcionalmente acepta imágenes de referencia para mantener identidad facial
 */
router.post('/generate-simple', async (req: Request, res: Response) => {
  try {
    const { prompt, referenceImages, seed } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un prompt'
      });
    }
    
    // Si hay imágenes de referencia, usar la función con múltiples referencias
    if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
      console.log(`🎨 Generando imagen simple con ${referenceImages.length} referencias faciales`);
      const { generateImageWithMultipleFaceReferences } = await import('../services/gemini-image-service');
      const result = await generateImageWithMultipleFaceReferences(prompt, referenceImages);
      return res.json(result);
    }
    
    // Sin referencias, usar generación simple
    const result = await generateCinematicImage(prompt);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error en /generate-simple:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al generar imagen'
    });
  }
});

/**
 * Genera una imagen desde una escena cinematográfica completa
 */
router.post('/generate-scene', async (req: Request, res: Response) => {
  try {
    const scene: CinematicScene = req.body;
    
    if (!scene.scene || !scene.camera || !scene.lighting || !scene.style || !scene.movement) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren todos los campos de la escena cinematográfica'
      });
    }
    
    const result = await generateImageFromCinematicScene(scene);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error en /generate-scene:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al generar imagen'
    });
  }
});

/**
 * Genera múltiples imágenes en lote
 */
router.post('/generate-batch', async (req: Request, res: Response) => {
  try {
    const { scenes }: { scenes: CinematicScene[] } = req.body;
    
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de escenas'
      });
    }
    
    const results = await generateBatchImages(scenes);
    
    // Convertir Map a objeto para JSON
    const resultsObj: Record<number, any> = {};
    results.forEach((value, key) => {
      resultsObj[key] = value;
    });
    
    return res.json({
      success: true,
      results: resultsObj
    });
  } catch (error: any) {
    console.error('Error en /generate-batch:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al generar imágenes'
    });
  }
});

/**
 * Genera una imagen adaptando rostro de imagen de referencia
 */
router.post('/generate-with-face', async (req: Request, res: Response) => {
  try {
    const { prompt, referenceImageBase64 } = req.body;
    
    if (!prompt || !referenceImageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere prompt y referenceImageBase64'
      });
    }
    
    const { generateImageWithFaceReference } = await import('../services/gemini-image-service');
    const result = await generateImageWithFaceReference(prompt, referenceImageBase64);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error en /generate-with-face:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al generar imagen con rostro'
    });
  }
});

// Nuevo endpoint para generar UNA imagen con MÚLTIPLES referencias faciales
router.post('/generate-single-with-multiple-faces', async (req: Request, res: Response) => {
  try {
    const { prompt, referenceImagesBase64, seed, scene, sceneId } = req.body;

    if (!prompt || !referenceImagesBase64 || !Array.isArray(referenceImagesBase64)) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren "prompt" y "referenceImagesBase64" (array)'
      });
    }

    console.log(`🎬 Generando UNA imagen con ${referenceImagesBase64.length} referencias faciales`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

    // Intentar primero con Gemini
    const { generateImageWithMultipleFaceReferences } = await import('../services/gemini-image-service');
    const result = await generateImageWithMultipleFaceReferences(
      prompt,
      referenceImagesBase64
    );

    // Si Gemini tuvo éxito, retornar
    if (result.success && result.imageUrl) {
      console.log('✅ Imagen generada con Gemini (Nano Banana)');
      return res.json({
        success: true,
        imageUrl: result.imageUrl,
        provider: 'gemini'
      });
    }

    // Si Gemini falló (cuota excedida), usar FAL AI como fallback
    console.log('⚠️ Gemini falló, usando FAL AI FLUX Kontext Pro como fallback...');
    
    // Generar con FAL AI
    const axios = (await import('axios')).default;
    const FAL_API_KEY = process.env.FAL_API_KEY;
    
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'Gemini agotó su cuota y FAL_API_KEY no está configurada para fallback'
      });
    }

    // Mejorar prompt para FLUX Kontext Pro
    const enhancedPrompt = `${prompt}. Maintain exact facial features and identity, professional photography, cinematic lighting, 8k resolution.`;
    
    const requestBody: any = {
      prompt: enhancedPrompt,
      image_size: "landscape_16_9",
      num_inference_steps: 35,
      guidance_scale: 4.5,
      num_images: 1,
      enable_safety_checker: false,
      output_format: "jpeg",
      sync_mode: true
    };

    // Agregar imágenes de referencia si hay
    if (referenceImagesBase64 && referenceImagesBase64.length > 0) {
      requestBody.reference_images = referenceImagesBase64.slice(0, 3);
      requestBody.reference_image_weight = 0.8;
    }

    // Agregar seed si está disponible
    if (seed) {
      requestBody.seed = seed;
    }

    console.log(`🎨 Generando con FAL AI FLUX Kontext Pro (${referenceImagesBase64.length} referencias, seed: ${seed || 'auto'})...`);
    
    const falResponse = await axios.post(
      'https://fal.run/fal-ai/flux-pro/kontext',
      requestBody,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    if (falResponse.data && falResponse.data.images && falResponse.data.images.length > 0) {
      const imageUrl = falResponse.data.images[0].url;
      console.log(`✅ Imagen generada exitosamente con FAL AI (fallback)`);
      return res.json({
        success: true,
        imageUrl: imageUrl,
        provider: 'fal'
      });
    }

    throw new Error('FAL AI no retornó imágenes');

  } catch (error: any) {
    console.error('Error generating single image with multiple faces:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error generando imagen'
    });
  }
});

/**
 * Genera múltiples imágenes en lote con referencia facial
 */
router.post('/generate-batch-with-face', async (req: Request, res: Response) => {
  try {
    const { scenes, referenceImageBase64 }: { scenes: CinematicScene[], referenceImageBase64: string } = req.body;
    
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de escenas'
      });
    }
    
    if (!referenceImageBase64) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una imagen de referencia'
      });
    }
    
    const { generateBatchImagesWithFaceReference } = await import('../services/gemini-image-service');
    const results = await generateBatchImagesWithFaceReference(scenes, referenceImageBase64);
    
    // Convertir Map a objeto para JSON
    const resultsObj: Record<number, any> = {};
    results.forEach((value, key) => {
      resultsObj[key] = value;
    });
    
    return res.json({
      success: true,
      results: resultsObj
    });
  } catch (error: any) {
    console.error('Error en /generate-batch-with-face:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al generar imágenes con rostro'
    });
  }
});

/**
 * Genera múltiples imágenes en lote con MÚLTIPLES referencias faciales (hasta 3)
 * Ideal para videos musicales con consistencia facial usando varias fotos del artista
 */
router.post('/generate-batch-with-multiple-faces', async (req: Request, res: Response) => {
  try {
    const { scenes, referenceImagesBase64, useFallback = true }: { 
      scenes: CinematicScene[], 
      referenceImagesBase64: string[],
      useFallback?: boolean
    } = req.body;
    
    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de escenas'
      });
    }
    
    if (!referenceImagesBase64 || !Array.isArray(referenceImagesBase64) || referenceImagesBase64.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un array de imágenes de referencia (1-10 imágenes)'
      });
    }

    if (referenceImagesBase64.length > 10) {
      return res.status(400).json({
        success: false,
        error: 'Máximo 10 imágenes de referencia permitidas'
      });
    }
    
    console.log(`🎨 Generando ${scenes.length} escenas con ${referenceImagesBase64.length} referencias faciales`);
    console.log(`📌 Fallback a FAL AI: ${useFallback ? 'ACTIVADO' : 'DESACTIVADO'}`);
    const results = await generateBatchImagesWithMultipleFaceReferences(scenes, referenceImagesBase64, useFallback);
    
    // Convertir Map a objeto para JSON y rastrear proveedores
    const resultsObj: Record<number, any> = {};
    let successCount = 0;
    let quotaExceeded = false;
    let geminiCount = 0;
    let falCount = 0;
    
    results.forEach((value, key) => {
      resultsObj[key] = value;
      if (value.success) {
        successCount++;
        if (value.provider === 'gemini') geminiCount++;
        if (value.provider === 'fal') falCount++;
      }
      if ((value as any).quotaError) quotaExceeded = true;
    });
    
    let message = '';
    if (quotaExceeded) {
      message = `Límite de cuota alcanzado. Se generaron ${successCount}/${scenes.length} imágenes`;
      if (falCount > 0) {
        message += ` (${geminiCount} con Gemini, ${falCount} con FAL AI fallback)`;
      }
      message += '. La cuota se restablecerá en 24 horas.';
    } else {
      message = `Se generaron ${successCount}/${scenes.length} imágenes exitosamente`;
      if (falCount > 0) {
        message += ` (${geminiCount} con Gemini, ${falCount} con FAL AI fallback)`;
      }
      message += '.';
    }
    
    return res.json({
      success: true,
      results: resultsObj,
      totalScenes: scenes.length,
      totalReferences: referenceImagesBase64.length,
      successCount,
      quotaExceeded,
      geminiCount,
      falCount,
      usedFallback: falCount > 0,
      message
    });
  } catch (error: any) {
    console.error('Error en /generate-batch-with-multiple-faces:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al generar imágenes con múltiples rostros'
    });
  }
});

export default router;
