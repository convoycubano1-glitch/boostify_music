import { Router } from 'express';
import { db } from '../db';
import { musicianClips, musicVideoProjects } from '../../db/schema';
import { insertMusicianClipSchema, type InsertMusicianClip } from '../../db/schema';
import { eq, and } from 'drizzle-orm';
import { GoogleGenerativeAI } from '@google/genai';

const router = Router();

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY || '');

router.post('/api/musician-clips/generate-description', async (req, res) => {
  try {
    const { instrument, scriptContext, timestamp, director, concept } = req.body;

    if (!instrument || !scriptContext) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const prompt = `You are creating a musician character for a music video.

Video Concept: ${concept || 'Not specified'}
Director Style: ${director?.name || 'Not specified'} - ${director?.style || 'Modern cinematic'}
Instrument: ${instrument}
Scene Context: ${scriptContext}
Timestamp: ${timestamp}s

Generate a detailed, vivid description for a ${instrument} player that fits perfectly into this scene. The description should be ready to use for AI image generation.

Include:
- Physical appearance (age, gender, style)
- Outfit/clothing style that matches the video's aesthetic
- Instrument details (color, brand, style)
- Lighting and mood
- Camera angle (close-up, medium shot, etc.)
- Background/setting
- Pose and expression while playing

Keep it consistent with the video's overall aesthetic and make it cinematic.
Format as a single, detailed paragraph optimized for Gemini image generation.`;

    const result = await model.generateContent(prompt);
    const description = result.response.text();

    res.json({
      description,
      instrument,
      timestamp,
    });
  } catch (error: any) {
    console.error('Error generating musician description:', error);
    res.status(500).json({ error: error.message || 'Failed to generate description' });
  }
});

router.post('/api/musician-clips/generate-image', async (req, res) => {
  try {
    const { description, faceReferenceUrl } = req.body;

    if (!description) {
      return res.status(400).json({ error: 'Description is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    let finalPrompt = description;
    
    if (faceReferenceUrl) {
      finalPrompt += `\n\nIMPORTANT: Use the facial features from the reference image for the musician's face.`;
    }

    const result = await model.generateContent([
      finalPrompt,
      {
        inlineData: {
          mimeType: 'image/jpeg',
          data: ''
        }
      }
    ]);

    const imageUrl = result.response.text();

    res.json({
      imageUrl,
      success: true,
    });
  } catch (error: any) {
    console.error('Error generating musician image:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
});

router.post('/api/musician-clips/save', async (req, res) => {
  try {
    const validatedData = insertMusicianClipSchema.parse(req.body);

    const [musicianClip] = await db
      .insert(musicianClips)
      .values({
        ...validatedData,
        status: 'completed',
      })
      .returning();

    res.json({
      success: true,
      musicianClip,
    });
  } catch (error: any) {
    console.error('Error saving musician clip:', error);
    res.status(500).json({ error: error.message || 'Failed to save musician clip' });
  }
});

router.get('/api/musician-clips/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    const clips = await db
      .select()
      .from(musicianClips)
      .where(eq(musicianClips.projectId, parseInt(projectId)));

    res.json(clips);
  } catch (error: any) {
    console.error('Error fetching musician clips:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch musician clips' });
  }
});

router.delete('/api/musician-clips/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db
      .delete(musicianClips)
      .where(eq(musicianClips.id, parseInt(id)));

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting musician clip:', error);
    res.status(500).json({ error: error.message || 'Failed to delete musician clip' });
  }
});

export default router;
