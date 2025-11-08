import { Router } from 'express';
import { db } from '../db';
import { musicVideoProjects } from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = Router();

const saveProjectSchema = z.object({
  userId: z.string(),
  projectName: z.string().min(1),
  audioUrl: z.string().optional(),
  audioDuration: z.number().optional(),
  transcription: z.string().optional(),
  scriptContent: z.string().optional(),
  timelineItems: z.array(z.any()),
  selectedDirector: z.any().optional(),
  videoStyle: z.any().optional(),
  artistReferenceImages: z.array(z.string()).default([]),
  selectedEditingStyle: z.any().optional(),
  status: z.enum(["draft", "generating_script", "generating_images", "generating_videos", "completed"]).default("draft"),
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
    console.log('📥 [SAVE PROJECT] Recibiendo proyecto para guardar...');
    
    const validatedData = saveProjectSchema.parse(req.body);
    console.log('✅ [SAVE PROJECT] Datos validados:', {
      userId: validatedData.userId,
      projectName: validatedData.projectName,
      timelineItemsCount: validatedData.timelineItems.length
    });
    
    const existingProject = await db
      .select()
      .from(musicVideoProjects)
      .where(
        and(
          eq(musicVideoProjects.userId, validatedData.userId),
          eq(musicVideoProjects.projectName, validatedData.projectName)
        )
      )
      .limit(1);
    
    if (existingProject.length > 0) {
      console.log('🔄 [SAVE PROJECT] Actualizando proyecto existente:', existingProject[0].id);
      
      const [updated] = await db
        .update(musicVideoProjects)
        .set({
          ...validatedData,
          lastModified: new Date()
        })
        .where(eq(musicVideoProjects.id, existingProject[0].id))
        .returning();
      
      console.log('✅ [SAVE PROJECT] Proyecto actualizado exitosamente');
      res.json({ success: true, project: updated, isNew: false });
    } else {
      console.log('➕ [SAVE PROJECT] Creando nuevo proyecto...');
      
      const [newProject] = await db
        .insert(musicVideoProjects)
        .values(validatedData)
        .returning();
      
      console.log('✅ [SAVE PROJECT] Nuevo proyecto creado:', newProject.id);
      res.json({ success: true, project: newProject, isNew: true });
    }
  } catch (error) {
    console.error('❌ [SAVE PROJECT] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

router.get('/list/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log('📋 [LIST PROJECTS] Listando proyectos para userId:', userId);
    
    const projects = await db
      .select()
      .from(musicVideoProjects)
      .where(eq(musicVideoProjects.userId, userId))
      .orderBy(desc(musicVideoProjects.lastModified));
    
    console.log(`✅ [LIST PROJECTS] Encontrados ${projects.length} proyectos`);
    res.json({ success: true, projects });
  } catch (error) {
    console.error('❌ [LIST PROJECTS] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

router.get('/load/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log('📂 [LOAD PROJECT] Cargando proyecto:', projectId);
    
    const [project] = await db
      .select()
      .from(musicVideoProjects)
      .where(eq(musicVideoProjects.id, projectId))
      .limit(1);
    
    if (!project) {
      console.log('❌ [LOAD PROJECT] Proyecto no encontrado');
      return res.status(404).json({ 
        success: false, 
        error: 'Proyecto no encontrado' 
      });
    }
    
    console.log('✅ [LOAD PROJECT] Proyecto cargado exitosamente');
    res.json({ success: true, project });
  } catch (error) {
    console.error('❌ [LOAD PROJECT] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

router.delete('/delete/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    console.log('🗑️ [DELETE PROJECT] Eliminando proyecto:', projectId);
    
    await db
      .delete(musicVideoProjects)
      .where(eq(musicVideoProjects.id, projectId));
    
    console.log('✅ [DELETE PROJECT] Proyecto eliminado exitosamente');
    res.json({ success: true });
  } catch (error) {
    console.error('❌ [DELETE PROJECT] Error:', error);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error desconocido' 
    });
  }
});

export default router;
