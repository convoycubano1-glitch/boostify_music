import { Router } from 'express';
import { db } from '../db';
import { musicVideoProjects } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '../utils/logger';

const router = Router();

const saveProjectSchema = z.object({
  userEmail: z.string().email(),
  projectName: z.string().min(1),
  audioUrl: z.string().optional(),
  audioDuration: z.number().optional(),
  transcription: z.string().optional(),
  scriptContent: z.string().optional(),
  timelineItems: z.array(z.any()).default([]),
  selectedDirector: z.any().optional(),
  videoStyle: z.any().optional(),
  artistReferenceImages: z.array(z.string()).default([]),
  selectedEditingStyle: z.any().optional(),
  status: z.enum(["draft", "generating_script", "generating_images", "generating_videos", "demo_generation", "demo_completed", "payment_pending", "full_generation", "completed", "failed"]).default("draft"),
  progress: z.object({
    scriptGenerated: z.boolean(),
    imagesGenerated: z.number(),
    totalImages: z.number(),
    videosGenerated: z.number(),
    totalVideos: z.number()
  }).optional(),
  tags: z.array(z.string()).default([])
});

router.post('/save', async (req, res) => {
  try {
    logger.log('📥 [SAVE PROJECT] Recibiendo proyecto para guardar...');
    
    const validatedData = saveProjectSchema.parse(req.body);
    logger.log('✅ [SAVE PROJECT] Datos validados:', {
      userEmail: validatedData.userEmail,
      projectName: validatedData.projectName,
      timelineItemsCount: validatedData.timelineItems?.length || 0
    });
    
    // Convert audioDuration number to string for decimal field
    const dbData: any = {
      ...validatedData,
      audioDuration: validatedData.audioDuration !== undefined ? String(validatedData.audioDuration) : undefined
    };
    
    const existingProject = await db
      .select()
      .from(musicVideoProjects)
      .where(
        and(
          eq(musicVideoProjects.userEmail, validatedData.userEmail),
          eq(musicVideoProjects.projectName, validatedData.projectName)
        )
      )
      .limit(1);
    
    if (existingProject.length > 0) {
      logger.log('🔄 [SAVE PROJECT] Actualizando proyecto existente:', existingProject[0].id);
      
      const [updated] = await db
        .update(musicVideoProjects)
        .set({
          ...dbData,
          lastModified: new Date()
        })
        .where(eq(musicVideoProjects.id, existingProject[0].id))
        .returning();
      
      logger.log('✅ [SAVE PROJECT] Proyecto actualizado exitosamente');
      res.json({ success: true, project: updated, isNew: false });
    } else {
      logger.log('➕ [SAVE PROJECT] Creando nuevo proyecto...');
      
      const [newProject] = await db
        .insert(musicVideoProjects)
        .values(dbData)
        .returning();
      
      logger.log('✅ [SAVE PROJECT] Nuevo proyecto creado:', newProject.id);
      res.json({ success: true, project: newProject, isNew: true });
    }
  } catch (error) {
    logger.error('❌ [SAVE PROJECT] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

router.get('/list/:userEmail', async (req, res) => {
  try {
    const { userEmail } = req.params;
    logger.log('📋 [LIST PROJECTS] Listando proyectos para userEmail:', userEmail);
    
    const projects = await db
      .select()
      .from(musicVideoProjects)
      .where(eq(musicVideoProjects.userEmail, userEmail))
      .orderBy(desc(musicVideoProjects.lastModified));
    
    logger.log(`✅ [LIST PROJECTS] Encontrados ${projects.length} proyectos`);
    res.json({ success: true, projects });
  } catch (error) {
    logger.error('❌ [LIST PROJECTS] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

router.get('/load/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    logger.log('📂 [LOAD PROJECT] Cargando proyecto:', projectId);
    
    const [project] = await db
      .select()
      .from(musicVideoProjects)
      .where(eq(musicVideoProjects.id, projectId))
      .limit(1);
    
    if (!project) {
      logger.log('❌ [LOAD PROJECT] Proyecto no encontrado');
      return res.status(404).json({ 
        success: false, 
        error: 'Proyecto no encontrado' 
      });
    }
    
    logger.log('✅ [LOAD PROJECT] Proyecto cargado exitosamente');
    res.json({ success: true, project });
  } catch (error) {
    logger.error('❌ [LOAD PROJECT] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

router.delete('/delete/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    logger.log('🗑️ [DELETE PROJECT] Eliminando proyecto:', projectId);
    
    await db
      .delete(musicVideoProjects)
      .where(eq(musicVideoProjects.id, projectId));
    
    logger.log('✅ [DELETE PROJECT] Proyecto eliminado exitosamente');
    res.json({ success: true });
  } catch (error) {
    logger.error('❌ [DELETE PROJECT] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

export default router;
