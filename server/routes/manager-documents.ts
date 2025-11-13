/**
 * API Routes para Manager Tools
 * Generación de documentos profesionales con Gemini + Nano Banana
 */
import express from 'express';
import { managerDocumentsService } from '../services/manager-documents-service';
import { generateDocumentPreview } from '../services/gemini-text-service';

const router = express.Router();

/**
 * POST /api/manager/documents/generate
 * Genera un documento completo con texto e imágenes
 */
router.post('/generate', async (req, res) => {
  try {
    const { userId, type, requirements, includeImages = false } = req.body;

    if (!userId || !type || !requirements) {
      return res.status(400).json({ 
        error: 'userId, type y requirements son requeridos' 
      });
    }

    const validTypes = ['technical-rider', 'lighting-setup', 'stage-plot', 'hospitality', 'contract'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        error: `Tipo inválido. Debe ser uno de: ${validTypes.join(', ')}` 
      });
    }

    console.log(`📄 Generando documento tipo ${type} para usuario ${userId}`);

    const document = await managerDocumentsService.generateDocument(
      userId,
      type,
      requirements,
      includeImages
    );

    res.json({ 
      success: true, 
      document 
    });
  } catch (error: any) {
    console.error('Error en /generate:', error);
    res.status(500).json({ 
      error: error.message || 'Error generando documento' 
    });
  }
});

/**
 * POST /api/manager/documents/preview
 * Genera un preview del documento sin guardarlo
 */
router.post('/preview', async (req, res) => {
  try {
    const { type, requirements } = req.body;

    if (!type || !requirements) {
      return res.status(400).json({ 
        error: 'type y requirements son requeridos' 
      });
    }

    const preview = await generateDocumentPreview({
      type,
      requirements,
      format: 'concise'
    });

    res.json({ 
      success: true, 
      preview 
    });
  } catch (error: any) {
    console.error('Error en /preview:', error);
    res.status(500).json({ 
      error: error.message || 'Error generando preview' 
    });
  }
});

/**
 * GET /api/manager/documents/:userId
 * Obtiene todos los documentos de un usuario
 */
router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { type } = req.query;

    const documents = await managerDocumentsService.getDocuments(
      userId,
      type as string | undefined
    );

    res.json({ 
      success: true, 
      documents 
    });
  } catch (error: any) {
    console.error('Error obteniendo documentos:', error);
    res.status(500).json({ 
      error: error.message || 'Error obteniendo documentos' 
    });
  }
});

/**
 * GET /api/manager/documents/document/:id
 * Obtiene un documento específico
 */
router.get('/document/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const document = await managerDocumentsService.getDocument(id);

    if (!document) {
      return res.status(404).json({ 
        error: 'Documento no encontrado' 
      });
    }

    res.json({ 
      success: true, 
      document 
    });
  } catch (error: any) {
    console.error('Error obteniendo documento:', error);
    res.status(500).json({ 
      error: error.message || 'Error obteniendo documento' 
    });
  }
});

/**
 * PATCH /api/manager/documents/:id
 * Actualiza un documento existente
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, images } = req.body;

    const updates: any = {};
    if (title !== undefined) updates.title = title;
    if (content !== undefined) updates.content = content;
    if (images !== undefined) updates.images = images;

    const document = await managerDocumentsService.updateDocument(id, updates);

    res.json({ 
      success: true, 
      document 
    });
  } catch (error: any) {
    console.error('Error actualizando documento:', error);
    res.status(500).json({ 
      error: error.message || 'Error actualizando documento' 
    });
  }
});

/**
 * DELETE /api/manager/documents/:id
 * Elimina un documento
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await managerDocumentsService.deleteDocument(id);

    res.json({ 
      success: true, 
      message: 'Documento eliminado exitosamente' 
    });
  } catch (error: any) {
    console.error('Error eliminando documento:', error);
    res.status(500).json({ 
      error: error.message || 'Error eliminando documento' 
    });
  }
});

/**
 * POST /api/manager/documents/:id/regenerate-images
 * Regenera las imágenes de un documento
 */
router.post('/:id/regenerate-images', async (req, res) => {
  try {
    const { id } = req.params;

    console.log(`🎨 Regenerando imágenes para documento ${id}`);

    const document = await managerDocumentsService.regenerateImages(id);

    res.json({ 
      success: true, 
      document 
    });
  } catch (error: any) {
    console.error('Error regenerando imágenes:', error);
    res.status(500).json({ 
      error: error.message || 'Error regenerando imágenes' 
    });
  }
});

export default router;
