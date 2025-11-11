import { Router, Request, Response } from 'express';
import { db } from '../db';
import { merchandise } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// GET /api/merch - Get own merchandise (authenticated)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const userMerch = await db
      .select()
      .from(merchandise)
      .where(eq(merchandise.userId, userId));
      
    res.json(userMerch);
  } catch (error) {
    console.error('Error getting merchandise:', error);
    res.status(500).json({ message: 'Error getting merchandise' });
  }
});

// GET /api/merch/user/:userId - Get merchandise by user ID
router.get('/user/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);
    const userMerch = await db
      .select()
      .from(merchandise)
      .where(eq(merchandise.userId, userId));
      
    res.json(userMerch);
  } catch (error) {
    console.error('Error getting merchandise:', error);
    res.status(500).json({ message: 'Error getting merchandise' });
  }
});

// POST /api/merch - Create new merchandise (authenticated)
router.post('/', authenticate, async (req: any, res: Response) => {
  try {
    const userId = req.user!.id;
    const { name, description, price, category, stock } = req.body;
    
    if (!req.files || !req.files.images) {
      return res.status(400).json({ message: 'No images uploaded' });
    }
    
    // Handle multiple images
    const imageFiles = Array.isArray(req.files.images) ? req.files.images : [req.files.images];
    
    // Create uploads directory
    const uploadsDir = path.join(process.cwd(), 'uploads', 'merch', userId.toString());
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Save images
    const imageUrls: string[] = [];
    for (const imageFile of imageFiles) {
      const filename = `merch-${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(imageFile.name)}`;
      const filepath = path.join(uploadsDir, filename);
      await imageFile.mv(filepath);
      imageUrls.push(`/uploads/merch/${userId}/${filename}`);
    }
    
    // Create merchandise record
    const [newMerch] = await db
      .insert(merchandise)
      .values({
        userId,
        name,
        description,
        price: price.toString(),
        images: imageUrls,
        category: category || 'other',
        stock: stock || 0,
        isAvailable: true
      })
      .returning();
      
    res.json({ message: 'Merchandise created', merchandise: newMerch });
  } catch (error) {
    console.error('Error creating merchandise:', error);
    res.status(500).json({ message: 'Error creating merchandise' });
  }
});

// PUT /api/merch/:id - Update merchandise (authenticated)
router.put('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const merchId = parseInt(req.params.id);
    const { name, description, price, category, stock, isAvailable } = req.body;
    
    // First verify ownership
    const [existing] = await db
      .select()
      .from(merchandise)
      .where(eq(merchandise.id, merchId))
      .limit(1);
      
    if (!existing) {
      return res.status(404).json({ message: 'Merchandise not found' });
    }
    
    if (existing.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to update this merchandise' });
    }
    
    const [updated] = await db
      .update(merchandise)
      .set({
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(price && { price: price.toString() }),
        ...(category && { category }),
        ...(stock !== undefined && { stock }),
        ...(isAvailable !== undefined && { isAvailable })
      })
      .where(eq(merchandise.id, merchId))
      .returning();
    
    res.json({ message: 'Merchandise updated', merchandise: updated });
  } catch (error) {
    console.error('Error updating merchandise:', error);
    res.status(500).json({ message: 'Error updating merchandise' });
  }
});

// DELETE /api/merch/:id - Delete merchandise (authenticated)
router.delete('/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const merchId = parseInt(req.params.id);
    
    // First verify ownership
    const [existing] = await db
      .select()
      .from(merchandise)
      .where(eq(merchandise.id, merchId))
      .limit(1);
      
    if (!existing) {
      return res.status(404).json({ message: 'Merchandise not found' });
    }
    
    if (existing.userId !== userId) {
      return res.status(403).json({ message: 'Not authorized to delete this merchandise' });
    }
    
    await db.delete(merchandise).where(eq(merchandise.id, merchId));
    
    res.json({ message: 'Merchandise deleted' });
  } catch (error) {
    console.error('Error deleting merchandise:', error);
    res.status(500).json({ message: 'Error deleting merchandise' });
  }
});

export default router;
