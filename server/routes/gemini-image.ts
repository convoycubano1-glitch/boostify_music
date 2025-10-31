/**
 * Rutas para generación de imágenes con Gemini
 */
import { Router, Request, Response } from 'express';
import { 
  generateCinematicImage, 
  generateImageFromCinematicScene,
  generateBatchImages,
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

export default router;
