import express from 'express';
import { db } from '../db';
import { musicians, insertMusicianSchema, selectMusicianSchema } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { z } from 'zod';

const router = express.Router();

router.post('/musicians', async (req, res) => {
  try {
    const validatedData = insertMusicianSchema.parse(req.body);
    
    const [newMusician] = await db
      .insert(musicians)
      .values(validatedData)
      .returning();

    res.status(201).json({ success: true, data: newMusician });
  } catch (error) {
    console.error('Error creating musician:', error);
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        details: error.errors
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to create musician'
    });
  }
});

router.get('/musicians', async (req, res) => {
  try {
    const { category, isActive = 'true' } = req.query;
    
    let query = db.select().from(musicians);
    
    if (isActive === 'true') {
      query = query.where(eq(musicians.isActive, true));
    }
    
    const allMusicians = await query.orderBy(desc(musicians.createdAt));
    
    const filteredMusicians = category && category !== 'all'
      ? allMusicians.filter(m => m.category === category)
      : allMusicians;

    res.json({ success: true, data: filteredMusicians });
  } catch (error) {
    console.error('Error fetching musicians:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch musicians'
    });
  }
});

router.get('/musicians/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [musician] = await db
      .select()
      .from(musicians)
      .where(eq(musicians.id, parseInt(id)));

    if (!musician) {
      return res.status(404).json({
        success: false,
        error: 'Musician not found'
      });
    }

    res.json({ success: true, data: musician });
  } catch (error) {
    console.error('Error fetching musician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch musician'
    });
  }
});

router.patch('/musicians/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const [updatedMusician] = await db
      .update(musicians)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(musicians.id, parseInt(id)))
      .returning();

    if (!updatedMusician) {
      return res.status(404).json({
        success: false,
        error: 'Musician not found'
      });
    }

    res.json({ success: true, data: updatedMusician });
  } catch (error) {
    console.error('Error updating musician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update musician'
    });
  }
});

router.delete('/musicians/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const [deletedMusician] = await db
      .delete(musicians)
      .where(eq(musicians.id, parseInt(id)))
      .returning();

    if (!deletedMusician) {
      return res.status(404).json({
        success: false,
        error: 'Musician not found'
      });
    }

    res.json({ success: true, message: 'Musician deleted successfully' });
  } catch (error) {
    console.error('Error deleting musician:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete musician'
    });
  }
});

export default router;
