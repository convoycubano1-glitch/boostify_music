/**
 * Rutas para generación de imágenes con Gemini
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { 
  generateCinematicImage, 
  generateImageFromCinematicScene,
  generateBatchImages,
  generateBatchImagesWithMultipleFaceReferences,
  generateImageWithMultipleFaceReferences,
  editImageWithGemini,
  generateHollywoodStylePoster,
  type CinematicScene 
} from '../services/gemini-image-service';

const router = Router();

/**
 * Edita una imagen existente con instrucciones específicas
 */
router.post('/edit-image', async (req: Request, res: Response) => {
  try {
    const { imageUrl, editInstructions, originalPrompt } = req.body;
    
    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una imagen (imageUrl)'
      });
    }
    
    if (!editInstructions) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren instrucciones de edición (editInstructions)'
      });
    }
    
    console.log(`✏️ Editando imagen con instrucciones: ${editInstructions.substring(0, 100)}...`);
    
    const result = await editImageWithGemini(imageUrl, editInstructions, originalPrompt);
    
    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Error al editar imagen'
      });
    }
    
    return res.json({
      success: true,
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      prompt: editInstructions
    });
  } catch (error: any) {
    console.error('Error en /edit-image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al editar imagen'
    });
  }
});

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

/**
 * Genera Master Character con Nano Banana
 * Combina análisis facial + generación de personaje consistente
 */
router.post('/generate-master-character', async (req: Request, res: Response) => {
  try {
    const { referenceImagesBase64, prompt, directorStyle } = req.body;

    if (!referenceImagesBase64 || !Array.isArray(referenceImagesBase64) || referenceImagesBase64.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren imágenes de referencia'
      });
    }

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un prompt para el Master Character'
      });
    }

    console.log(`🎭 Generando Master Character con Nano Banana`);
    console.log(`📸 Referencias: ${referenceImagesBase64.length}`);
    console.log(`🎬 Estilo: ${directorStyle || 'default'}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

    // Construir prompt optimizado para Master Character
    const masterPrompt = `PROFESSIONAL MASTER CHARACTER PORTRAIT:

${prompt}

Style: ${directorStyle || 'cinematic'}

CRITICAL REQUIREMENTS:
- High-quality professional portrait
- Perfect facial consistency from reference images
- Maintain exact identity, features, and skin tone
- Cinematic lighting and composition
- Production-ready quality
- 8K resolution clarity`;

    // Generar con Nano Banana (gemini-2.5-flash-image) usando múltiples referencias
    const result = await generateImageWithMultipleFaceReferences(
      masterPrompt,
      referenceImagesBase64
    );

    if (!result.success) {
      console.error('❌ Error generando Master Character:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error || 'Error generando Master Character'
      });
    }

    console.log('✅ Master Character generado exitosamente con Nano Banana');

    return res.json({
      success: true,
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      provider: 'gemini-nano-banana'
    });

  } catch (error: any) {
    console.error('❌ Error en /generate-master-character:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al generar Master Character'
    });
  }
});

/**
 * POST /api/gemini/generate-image
 * Genera imagen para escena del timeline respetando el guión JSON y referencias faciales
 * Soporta:
 * - Prompts específicos de escena
 * - Múltiples referencias faciales para consistencia
 * - Contexto cinematográfico del director
 */
router.post('/generate-image', async (req: Request, res: Response) => {
  try {
    const { 
      prompt,
      referenceImages,
      sceneNumber,
      shotType,
      mood,
      cinematicStyle,
      directorStyle
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere un prompt' 
      });
    }

    console.log(`🎬 [Timeline] Generando imagen para escena ${sceneNumber || '?'}`);
    console.log(`📝 Prompt: ${prompt.substring(0, 100)}...`);

    // Si hay referencias faciales, usar generación con múltiples rostros para consistencia
    if (referenceImages && Array.isArray(referenceImages) && referenceImages.length > 0) {
      console.log(`📸 Usando ${referenceImages.length} referencias faciales para consistencia`);
      
      const result = await generateImageWithMultipleFaceReferences(
        prompt,
        referenceImages
      );

      if (result.success && result.imageUrl) {
        console.log(`✅ Imagen generada con referencias faciales`);
        return res.json({
          success: true,
          imageUrl: result.imageUrl,
          imageBase64: result.imageBase64,
          provider: 'gemini-with-faces',
          sceneNumber
        });
      }

      // Si falla con referencias, intentar sin ellas
      console.warn(`⚠️ Generación con referencias falló, intentando sin referencias...`);
    }

    // Generación simple (sin referencias o como fallback)
    const result = await generateCinematicImage(prompt);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Error generando imagen',
        sceneNumber
      });
    }

    console.log(`✅ Imagen generada para escena ${sceneNumber || '?'}`);
    return res.json({
      success: true,
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      provider: 'gemini',
      sceneNumber
    });

  } catch (error: any) {
    console.error('❌ Error en /generate-image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al generar imagen'
    });
  }
});

/**
 * Genera poster cinematográfico estilo Hollywood para un concepto
 */
router.post('/generate-hollywood-poster', async (req: Request, res: Response) => {
  try {
    const { conceptTitle, conceptDescription, artistReferenceImages, directorName } = req.body;

    if (!conceptTitle || !conceptDescription) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren conceptTitle y conceptDescription'
      });
    }

    if (!artistReferenceImages || !Array.isArray(artistReferenceImages) || artistReferenceImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requieren imágenes de referencia del artista'
      });
    }

    console.log(`🎬 Generando poster Hollywood: "${conceptTitle}"`);

    const result = await generateHollywoodStylePoster(
      conceptTitle,
      conceptDescription,
      artistReferenceImages,
      directorName || 'Director'
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Error generando poster'
      });
    }

    return res.json({
      success: true,
      imageUrl: result.imageUrl,
      imageBase64: result.imageBase64,
      provider: result.provider
    });

  } catch (error: any) {
    console.error('❌ Error en /generate-hollywood-poster:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno al generar poster'
    });
  }
});

export default router;
