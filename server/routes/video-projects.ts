/**
 * Rutas API para gestión de proyectos de video musical
 */
import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createProjectWithImages,
  getVideoProject,
  getUserProjects,
  updateProjectScript,
  updateProjectImages,
  deleteVideoProject,
  uploadImageToStorage,
  uploadMultipleImages
} from '../services/video-project-storage';
import type { MusicVideoScene } from '../../client/src/types/music-video-scene';

const router = Router();

/**
 * POST /api/video-projects/create
 * Crea un nuevo proyecto de video con imágenes
 */
router.post('/create', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, script, generatedImages, metadata } = req.body;
    const userId = (req as any).user.uid;

    if (!name || !script || !script.scenes) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: name, script.scenes'
      });
    }

    console.log(`📝 Creando proyecto: ${name} para usuario ${userId}`);

    const { projectId, project } = await createProjectWithImages(
      name,
      userId,
      script,
      generatedImages || [],
      metadata
    );

    return res.json({
      success: true,
      projectId,
      project
    });
  } catch (error: any) {
    console.error('Error creating video project:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create video project'
    });
  }
});

/**
 * POST /api/video-projects/:projectId/upload-images
 * Sube imágenes generadas a un proyecto existente
 */
router.post('/:projectId/upload-images', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { images } = req.body;
    const userId = (req as any).user.uid;

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        success: false,
        error: 'images array is required'
      });
    }

    console.log(`📤 Subiendo ${images.length} imágenes al proyecto ${projectId}`);

    // Verificar que el proyecto pertenece al usuario
    const project = await getVideoProject(projectId);
    if (!project || project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }

    // Subir las imágenes
    const uploadedImages = await uploadMultipleImages(images, projectId, userId);

    // Actualizar el proyecto
    await updateProjectImages(projectId, uploadedImages);

    return res.json({
      success: true,
      images: uploadedImages
    });
  } catch (error: any) {
    console.error('Error uploading images:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload images'
    });
  }
});

/**
 * GET /api/video-projects/:projectId
 * Obtiene un proyecto por ID
 */
router.get('/:projectId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.uid;

    const project = await getVideoProject(projectId);

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    // Verificar acceso
    if (project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied'
      });
    }

    return res.json({
      success: true,
      project
    });
  } catch (error: any) {
    console.error('Error getting project:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get project'
    });
  }
});

/**
 * GET /api/video-projects
 * Obtiene todos los proyectos del usuario
 */
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.uid;

    const projects = await getUserProjects(userId);

    return res.json({
      success: true,
      projects
    });
  } catch (error: any) {
    console.error('Error getting user projects:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to get projects'
    });
  }
});

/**
 * PUT /api/video-projects/:projectId/script
 * Actualiza el script de un proyecto
 */
router.put('/:projectId/script', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const { script } = req.body;
    const userId = (req as any).user.uid;

    if (!script || !script.scenes) {
      return res.status(400).json({
        success: false,
        error: 'script.scenes is required'
      });
    }

    // Verificar acceso
    const project = await getVideoProject(projectId);
    if (!project || project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }

    await updateProjectScript(projectId, script);

    return res.json({
      success: true,
      message: 'Script updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating script:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to update script'
    });
  }
});

/**
 * DELETE /api/video-projects/:projectId
 * Elimina un proyecto y sus imágenes
 */
router.delete('/:projectId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params;
    const userId = (req as any).user.uid;

    await deleteVideoProject(projectId, userId);

    return res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to delete project'
    });
  }
});

/**
 * POST /api/video-projects/upload-single-image
 * Sube una sola imagen (útil para reemplazos individuales)
 */
router.post('/upload-single-image', requireAuth, async (req: Request, res: Response) => {
  try {
    const { projectId, sceneId, imageData } = req.body;
    const userId = (req as any).user.uid;

    if (!projectId || !sceneId || !imageData) {
      return res.status(400).json({
        success: false,
        error: 'projectId, sceneId, and imageData are required'
      });
    }

    // Verificar acceso
    const project = await getVideoProject(projectId);
    if (!project || project.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Project not found or access denied'
      });
    }

    const { storageUrl, publicUrl } = await uploadImageToStorage(
      imageData,
      projectId,
      sceneId,
      userId
    );

    return res.json({
      success: true,
      storageUrl,
      publicUrl
    });
  } catch (error: any) {
    console.error('Error uploading single image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to upload image'
    });
  }
});

export default router;
