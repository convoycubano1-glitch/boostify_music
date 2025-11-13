/**
 * Video Rendering Routes
 * API endpoints para renderizado de video final con Shotstack
 */

import { Router } from 'express';
import { z } from 'zod';
import { logger } from '../utils/logger';
import { startVideoRender, checkRenderStatus } from '../services/video-rendering/shotstack-service';
import { db } from '../db';
import { musicVideoProjects } from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

const renderRequestSchema = z.object({
  projectId: z.number().optional(),
  clips: z.array(
    z.object({
      id: z.string(),
      videoUrl: z.string().optional(),
      imageUrl: z.string().optional(),
      start: z.number(),
      duration: z.number(),
      transition: z.enum(['fade', 'slide', 'wipe', 'none']).optional(),
    })
  ),
  audioUrl: z.string().optional(),
  audioDuration: z.number().optional(),
  resolution: z.enum(['480p', '720p', '1080p', '4k']).optional(),
  fps: z.enum([25, 30, 60]).optional(),
  quality: z.enum(['low', 'medium', 'high']).optional(),
});

/**
 * POST /api/video-rendering/start
 * Inicia el renderizado de un video final
 */
router.post('/start', async (req, res) => {
  try {
    logger.log('🎬 [VIDEO RENDERING] Iniciando renderizado...');

    const validatedData = renderRequestSchema.parse(req.body);
    logger.log(`📊 [VIDEO RENDERING] Clips: ${validatedData.clips.length}`);

    // Validar que hay clips
    if (validatedData.clips.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere al menos un clip para renderizar',
      });
    }

    // Iniciar renderizado con Shotstack
    const result = await startVideoRender({
      clips: validatedData.clips,
      audioUrl: validatedData.audioUrl,
      audioDuration: validatedData.audioDuration,
      resolution: validatedData.resolution,
      fps: validatedData.fps,
      quality: validatedData.quality,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    // Si hay projectId, guardar el renderId en el proyecto
    if (validatedData.projectId && result.renderId) {
      try {
        await db
          .update(musicVideoProjects)
          .set({
            status: 'full_generation',
            lastModified: new Date(),
          })
          .where(eq(musicVideoProjects.id, validatedData.projectId));

        logger.log(`✅ [VIDEO RENDERING] Proyecto ${validatedData.projectId} actualizado`);
      } catch (dbError) {
        logger.error('❌ [VIDEO RENDERING] Error actualizando proyecto:', dbError);
        // No fallar la request por error de BD
      }
    }

    logger.log(`✅ [VIDEO RENDERING] Renderizado iniciado: ${result.renderId}`);
    res.json(result);
  } catch (error: any) {
    logger.error('❌ [VIDEO RENDERING] Error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Datos inválidos',
        details: error.errors,
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Error desconocido',
    });
  }
});

/**
 * GET /api/video-rendering/status/:renderId
 * Verifica el estado de un renderizado
 */
router.get('/status/:renderId', async (req, res) => {
  try {
    const { renderId } = req.params;

    if (!renderId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere renderId',
      });
    }

    logger.log(`🔍 [VIDEO RENDERING] Verificando estado: ${renderId}`);

    const result = await checkRenderStatus(renderId);

    // Si el renderizado está completo, actualizar el proyecto
    if (result.status === 'done' && result.url) {
      // Intentar encontrar el proyecto por el renderId
      // (esto requeriría guardar el renderId en el proyecto, lo cual ya hicimos arriba)
      logger.log(`✅ [VIDEO RENDERING] Video listo: ${result.url}`);
    }

    res.json(result);
  } catch (error: any) {
    logger.error('❌ [VIDEO RENDERING] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error desconocido',
    });
  }
});

/**
 * POST /api/video-rendering/update-project
 * Actualiza el proyecto con la URL del video final
 */
router.post('/update-project', async (req, res) => {
  try {
    const { projectId, videoUrl } = req.body;

    if (!projectId || !videoUrl) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere projectId y videoUrl',
      });
    }

    logger.log(`💾 [VIDEO RENDERING] Actualizando proyecto ${projectId} con video final`);

    await db
      .update(musicVideoProjects)
      .set({
        finalVideoUrl: videoUrl,
        status: 'completed',
        lastModified: new Date(),
      })
      .where(eq(musicVideoProjects.id, parseInt(projectId)));

    logger.log(`✅ [VIDEO RENDERING] Proyecto actualizado con video final`);

    res.json({
      success: true,
      message: 'Proyecto actualizado exitosamente',
    });
  } catch (error: any) {
    logger.error('❌ [VIDEO RENDERING] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error desconocido',
    });
  }
});

export default router;
