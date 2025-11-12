/**
 * Rutas para gestión de galerías de imágenes de artista
 */
import { Router, Request, Response } from 'express';
import { 
  generateImageWithMultipleFaceReferences, 
  generateImageWithFAL 
} from '../services/gemini-image-service';
import type { 
  CreateGalleryRequest, 
  GenerateImagesRequest,
  ImageGallery,
  GeneratedImage 
} from '../types/image-gallery';

const router = Router();

/**
 * Crea una nueva galería y genera 6 imágenes profesionales
 * Usa 3 referencias faciales para mantener la identidad del artista
 */
router.post('/create-and-generate', async (req: Request, res: Response) => {
  try {
    const { 
      singleName, 
      artistName, 
      basePrompt, 
      styleInstructions, 
      referenceImages 
    }: CreateGalleryRequest = req.body;

    if (!singleName || !artistName || !referenceImages || referenceImages.length < 1) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere singleName, artistName y al menos 1 imagen de referencia'
      });
    }

    if (referenceImages.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Máximo 3 imágenes de referencia permitidas'
      });
    }

    console.log(`🎨 Creando galería para "${singleName}" de ${artistName}`);
    console.log(`📸 Referencias faciales: ${referenceImages.length}`);

    // Generar 6 variaciones de imágenes profesionales
    const imagePrompts = [
      `${basePrompt}. ${styleInstructions}. Close-up portrait shot, dramatic lighting, studio photography, looking at camera.`,
      `${basePrompt}. ${styleInstructions}. Medium shot, performing on stage with professional lighting, energetic atmosphere.`,
      `${basePrompt}. ${styleInstructions}. Full body shot, urban location, modern fashion, cinematic composition.`,
      `${basePrompt}. ${styleInstructions}. Artistic portrait with creative lighting, experimental angles, bold colors.`,
      `${basePrompt}. ${styleInstructions}. Lifestyle shot, natural setting, authentic moment, professional photography.`,
      `${basePrompt}. ${styleInstructions}. Editorial style photo, high fashion aesthetic, magazine quality, striking pose.`
    ];

    const generatedImages: GeneratedImage[] = [];
    let successCount = 0;

    // Generar las 6 imágenes secuencialmente
    for (let i = 0; i < imagePrompts.length; i++) {
      console.log(`📷 Generando imagen ${i + 1}/6...`);
      
      // Intentar con Gemini primero
      let result = await generateImageWithMultipleFaceReferences(
        imagePrompts[i],
        referenceImages
      );

      // Si Gemini falla, usar FAL AI como fallback
      if (!result.success && (result as any).quotaError) {
        console.log(`⚠️ Gemini quota exceeded para imagen ${i + 1}, usando FAL AI...`);
        result = await generateImageWithFAL(imagePrompts[i], referenceImages, Date.now() + i);
      }

      if (result.success && result.imageUrl) {
        // Retornar las imágenes como data URLs
        // El frontend se encargará de subirlas a Firebase Storage
        generatedImages.push({
          id: `img-${Date.now()}-${i}`,
          url: result.imageUrl, // Data URL (base64)
          prompt: imagePrompts[i],
          createdAt: new Date().toISOString(),
          isVideo: false
        });
        successCount++;
        console.log(`✅ Imagen ${i + 1} generada exitosamente`);
      } else {
        console.error(`❌ Error generando imagen ${i + 1}:`, result.error);
      }

      // Delay para evitar rate limiting
      if (i < imagePrompts.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    // Crear objeto de galería (será guardado en Firestore por el cliente)
    const gallery = {
      singleName,
      artistName,
      basePrompt,
      styleInstructions,
      referenceImageUrls: referenceImages,
      generatedImages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: true
    };

    return res.json({
      success: true,
      gallery,
      successCount,
      totalImages: imagePrompts.length,
      message: `Se generaron ${successCount}/${imagePrompts.length} imágenes exitosamente`
    });

  } catch (error: any) {
    console.error('Error creating gallery:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al crear galería'
    });
  }
});

/**
 * Regenera una imagen específica de la galería
 */
router.post('/regenerate-image', async (req: Request, res: Response) => {
  try {
    const { prompt, referenceImages } = req.body;

    if (!prompt || !referenceImages || referenceImages.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere prompt y referenceImages'
      });
    }

    console.log('🔄 Regenerando imagen...');

    // Intentar con Gemini primero
    let result = await generateImageWithMultipleFaceReferences(prompt, referenceImages);

    // Si Gemini falla, usar FAL AI como fallback
    if (!result.success && (result as any).quotaError) {
      console.log('⚠️ Gemini quota exceeded, usando FAL AI...');
      result = await generateImageWithFAL(prompt, referenceImages, Date.now());
    }

    if (result.success && result.imageUrl) {
      return res.json({
        success: true,
        image: {
          id: `img-${Date.now()}`,
          url: result.imageUrl,
          prompt,
          createdAt: new Date().toISOString(),
          isVideo: false
        }
      });
    }

    return res.status(500).json({
      success: false,
      error: result.error || 'Error al regenerar imagen'
    });

  } catch (error: any) {
    console.error('Error regenerating image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al regenerar imagen'
    });
  }
});

/**
 * Convierte una imagen de la galería en video usando Gemini Video
 * TODO: Implementar cuando Gemini Video esté disponible
 */
router.post('/convert-to-video', async (req: Request, res: Response) => {
  try {
    const { imageUrl, prompt } = req.body;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere imageUrl'
      });
    }

    // Por ahora retornar error, implementar cuando Gemini Video esté disponible
    return res.status(501).json({
      success: false,
      error: 'Conversión a video estará disponible próximamente'
    });

  } catch (error: any) {
    console.error('Error converting to video:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Error al convertir a video'
    });
  }
});

export default router;
