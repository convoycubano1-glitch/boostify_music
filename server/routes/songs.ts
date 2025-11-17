import { Router, Request, Response } from 'express';
import { db } from '../db';
import { songs } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import path from 'path';
import fs from 'fs/promises';
import { insertSongSchema } from '../../db/schema';

const router = Router();

// GET /api/songs - Get own songs (authenticated)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userSongs = await db
      .select()
      .from(songs)
      .where(eq(songs.userId, userId));
      
    res.json(userSongs);
  } catch (error) {
    console.error('Error getting songs:', error);
    res.status(500).json({ message: 'Error getting songs' });
  }
});

// GET /api/songs/user/:userId - Get songs by user ID
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const userSongs = await db
      .select()
      .from(songs)
      .where(eq(songs.userId, userId));
      
    res.json(userSongs);
  } catch (error) {
    console.error('Error getting songs:', error);
    res.status(500).json({ message: 'Error getting songs' });
  }
});

// POST /api/songs/generated - Save AI-generated song with URL (authenticated)
router.post('/generated', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, audioUrl, genre, duration, prompt, coverArt } = req.body;
    
    if (!audioUrl) {
      return res.status(400).json({ message: 'Audio URL is required' });
    }
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Create song record with AI-generated audio URL
    const [newSong] = await db
      .insert(songs)
      .values({
        userId,
        title,
        description: description || prompt || 'AI-generated music',
        audioUrl,
        genre: genre || 'AI Generated',
        coverArt: coverArt || null,
        duration: duration || null,
        releaseDate: new Date(),
        isPublished: true,
        plays: 0
      })
      .returning();
      
    res.json({ 
      success: true,
      message: 'AI-generated song saved to profile', 
      song: newSong 
    });
  } catch (error) {
    console.error('Error saving generated song:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error saving generated song' 
    });
  }
});

// POST /api/songs - Create new song (authenticated)
router.post('/', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user!.id;
    const { title, description, genre, releaseDate } = req.body;
    
    if (!req.files || !req.files.audio) {
      return res.status(400).json({ message: 'No audio file uploaded' });
    }
    
    const audioFile = Array.isArray(req.files.audio) ? req.files.audio[0] : req.files.audio;
    
    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'songs', userId.toString());
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Save audio file
    const audioFilename = `song-${Date.now()}${path.extname(audioFile.name)}`;
    const audioPath = path.join(uploadsDir, audioFilename);
    await audioFile.mv(audioPath);
    const audioUrl = `/uploads/songs/${userId}/${audioFilename}`;
    
    // Handle cover art if provided
    let coverArt = null;
    if (req.files.coverArt) {
      const coverFile = Array.isArray(req.files.coverArt) ? req.files.coverArt[0] : req.files.coverArt;
      const coverFilename = `cover-${Date.now()}${path.extname(coverFile.name)}`;
      const coverPath = path.join(uploadsDir, coverFilename);
      await coverFile.mv(coverPath);
      coverArt = `/uploads/songs/${userId}/${coverFilename}`;
    }
    
    // Create song record
    const [newSong] = await db
      .insert(songs)
      .values({
        userId,
        title,
        description,
        audioUrl,
        genre,
        coverArt,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
        isPublished: true,
        plays: 0
      })
      .returning();
      
    res.json({ message: 'Song created', song: newSong });
  } catch (error) {
    console.error('Error creating song:', error);
    res.status(500).json({ message: 'Error creating song' });
  }
});

// PUT /api/songs/:id - Update song (authenticated)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const songId = parseInt(req.params.id);
    const { title, description, genre, releaseDate, isPublished } = req.body;
    
    // First verify ownership
    const [existing] = await db
      .select()
      .from(songs)
      .where(eq(songs.id, songId))
      .limit(1);
      
    if (!existing) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    if (existing.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this song' });
    }
    
    const [updated] = await db
      .update(songs)
      .set({
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(genre && { genre }),
        ...(releaseDate && { releaseDate: new Date(releaseDate) }),
        ...(isPublished !== undefined && { isPublished })
      })
      .where(eq(songs.id, songId))
      .returning();
    
    res.json({ message: 'Song updated', song: updated });
  } catch (error) {
    console.error('Error updating song:', error);
    res.status(500).json({ message: 'Error updating song' });
  }
});

// DELETE /api/songs/:id - Delete song (authenticated)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const songId = parseInt(req.params.id);
    
    // First verify ownership
    const [existing] = await db
      .select()
      .from(songs)
      .where(eq(songs.id, songId))
      .limit(1);
      
    if (!existing) {
      return res.status(404).json({ message: 'Song not found' });
    }
    
    if (existing.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this song' });
    }
    
    await db.delete(songs).where(eq(songs.id, songId));
    
    res.json({ message: 'Song deleted' });
  } catch (error) {
    console.error('Error deleting song:', error);
    res.status(500).json({ message: 'Error deleting song' });
  }
});

export default router;
