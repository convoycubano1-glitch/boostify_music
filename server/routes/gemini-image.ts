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
 */
router.post('/generate-simple', async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un prompt'
      });
    }
    
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
    const { scenes, referenceImagesBase64 }: { 
      scenes: CinematicScene[], 
      referenceImagesBase64: string[] 
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
        error: 'Se requiere un array de imágenes de referencia (1-3 imágenes)'
      });
    }

    if (referenceImagesBase64.length > 3) {
      return res.status(400).json({
        success: false,
        error: 'Máximo 3 imágenes de referencia permitidas'
      });
    }
    
    console.log(`Generando ${scenes.length} escenas con ${referenceImagesBase64.length} referencias faciales`);
    const results = await generateBatchImagesWithMultipleFaceReferences(scenes, referenceImagesBase64);
    
    // Convertir Map a objeto para JSON
    const resultsObj: Record<number, any> = {};
    results.forEach((value, key) => {
      resultsObj[key] = value;
    });
    
    return res.json({
      success: true,
      results: resultsObj,
      totalScenes: scenes.length,
      totalReferences: referenceImagesBase64.length
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
