import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

/**
 * Endpoint para subir imágenes en base64 y convertirlas a URLs
 * Sin dependencia de Firebase Storage - usa almacenamiento local o CDN
 */
router.post('/upload-image', authenticate, async (req: Request, res: Response) => {
  try {
    const { imageData, fileName, folder } = req.body;

    if (!imageData || !fileName) {
      return res.status(400).json({
        success: false,
        error: 'imageData and fileName are required'
      });
    }

    // Validar que sea una imagen base64 válida
    const base64Regex = /^data:image\/(png|jpg|jpeg|gif|webp);base64,/;
    if (!base64Regex.test(imageData)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format. Must be base64 encoded image.'
      });
    }

    // Por ahora, devolvemos la misma imagen base64
    // En producción, aquí subirías a un CDN o servicio de almacenamiento
    // Ejemplos: Cloudinary, AWS S3, Google Cloud Storage, etc.
    
    // TODO: Implementar subida real a CDN
    // Por ahora, guardamos la referencia en memoria o devolvemos el base64
    
    res.json({
      success: true,
      imageUrl: imageData, // Temporal: devolver el mismo base64
      message: 'Image uploaded successfully (using base64 temporarily)'
    });

  } catch (error) {
    console.error('Error uploading image:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload image'
    });
  }
});

export default router;
