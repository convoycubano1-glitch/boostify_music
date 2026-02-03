import { Router, Request, Response } from 'express';
import { db } from '../db';
import { merchandise, users } from '../db/schema';
import { eq, inArray, or, desc } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import path from 'path';
import fs from 'fs/promises';

const router = Router();

// Helper para obtener el PostgreSQL user ID desde Clerk ID
async function getPostgresUserId(clerkId: string): Promise<number | null> {
  const userRecord = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.clerkId, clerkId))
    .limit(1);
  return userRecord.length > 0 ? userRecord[0].id : null;
}

// GET /api/merch - Get own merchandise (authenticated)
router.get('/', authenticate, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.user?.id;
    if (!clerkUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const pgUserId = await getPostgresUserId(clerkUserId);
    if (!pgUserId) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const userMerch = await db
      .select()
      .from(merchandise)
      .where(eq(merchandise.userId, pgUserId));
      
    res.json(userMerch);
  } catch (error) {
    console.error('Error getting merchandise:', error);
    res.status(500).json({ message: 'Error getting merchandise' });
  }
});

// GET /api/merch/my-artists - Get merchandise from all my artists (from Firestore)
router.get('/my-artists', authenticate, async (req: Request, res: Response) => {
  try {
    console.log('[MERCH MY-ARTISTS] Request received');
    const clerkUserId = req.user?.id;
    console.log('[MERCH MY-ARTISTS] Clerk user ID:', clerkUserId);
    
    if (!clerkUserId) {
      console.log('[MERCH MY-ARTISTS] No clerk user ID found');
      return res.status(401).json({ message: 'Unauthorized' });
    }
    
    const pgUserId = await getPostgresUserId(clerkUserId);
    console.log('[MERCH MY-ARTISTS] PostgreSQL user ID:', pgUserId);
    
    if (!pgUserId) {
      console.log('[MERCH MY-ARTISTS] User not found in PostgreSQL');
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get all artists belonging to this user (own profile + AI-generated)
    const myArtists = await db
      .select({
        id: users.id,
        name: users.artistName,
        slug: users.slug,
        profileImage: users.profileImage,
        genres: users.genres,
        isAIGenerated: users.isAIGenerated
      })
      .from(users)
      .where(
        or(
          eq(users.id, pgUserId),
          eq(users.generatedBy, pgUserId)
        )
      )
      .orderBy(desc(users.createdAt));
    
    console.log('[MERCH MY-ARTISTS] Found artists:', myArtists.length);
    
    if (myArtists.length === 0) {
      return res.json({ artists: [], merchandiseByArtist: [], totalProducts: 0 });
    }
    
    const artistIds = myArtists.map(a => a.id);
    console.log('[MERCH MY-ARTISTS] Artist IDs:', artistIds);
    
    // Import Firestore and get merchandise from there
    const { db: firestoreDb } = await import('../firebase');
    
    if (!firestoreDb) {
      console.log('[MERCH MY-ARTISTS] Firestore not available');
      return res.status(500).json({ message: 'Firestore not available' });
    }
    
    // Get merchandise from Firestore for all these artists
    const merchandiseRef = firestoreDb.collection('merchandise');
    const allMerch: any[] = [];
    
    // Query for each artist ID (Firestore stores userId as string or number)
    for (const artistId of artistIds) {
      // Try with number
      const queryByNumber = await merchandiseRef
        .where('userId', '==', artistId)
        .get();
      
      queryByNumber.docs.forEach((doc: any) => {
        const data = doc.data();
        allMerch.push({
          id: doc.id,
          userId: artistId,
          name: data.name,
          description: data.description,
          price: data.price,
          images: data.imageUrl ? [data.imageUrl] : (data.images || []),
          category: data.category,
          stock: data.stock || 100,
          isAvailable: data.isAvailable !== false,
          artistName: data.artistName,
          createdAt: data.createdAt?.toDate?.() || new Date()
        });
      });
      
      // Try with string
      const queryByString = await merchandiseRef
        .where('userId', '==', artistId.toString())
        .get();
      
      queryByString.docs.forEach((doc: any) => {
        // Avoid duplicates
        if (!allMerch.find(m => m.id === doc.id)) {
          const data = doc.data();
          allMerch.push({
            id: doc.id,
            userId: artistId,
            name: data.name,
            description: data.description,
            price: data.price,
            images: data.imageUrl ? [data.imageUrl] : (data.images || []),
            category: data.category,
            stock: data.stock || 100,
            isAvailable: data.isAvailable !== false,
            artistName: data.artistName,
            createdAt: data.createdAt?.toDate?.() || new Date()
          });
        }
      });
    }
    
    console.log('[MERCH MY-ARTISTS] Total products found in Firestore:', allMerch.length);
    
    // Group merchandise by artist
    const merchandiseByArtist = myArtists.map(artist => ({
      artist,
      products: allMerch.filter(m => m.userId === artist.id)
    }));
    
    res.json({
      artists: myArtists,
      merchandiseByArtist,
      totalProducts: allMerch.length
    });
  } catch (error) {
    console.error('Error getting my artists merchandise:', error);
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

// ==================== FIRESTORE MERCHANDISE MANAGEMENT ====================

// POST /api/merch/firestore - Create new merchandise in Firestore
router.post('/firestore', authenticate, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.user?.id;
    if (!clerkUserId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name, description, price, category, stock, artistId, artistName, imageUrl, productType } = req.body;

    if (!name || !price || !artistId) {
      return res.status(400).json({ message: 'Missing required fields: name, price, artistId' });
    }

    const { db: firestoreDb } = await import('../firebase');
    
    if (!firestoreDb) {
      return res.status(500).json({ message: 'Firestore not available' });
    }

    // Create new product document
    const newProduct = {
      userId: parseInt(artistId),
      name,
      description: description || '',
      price: parseFloat(price),
      category: category || 'clothing',
      stock: parseInt(stock) || 100,
      isAvailable: true,
      artistName: artistName || null,
      imageUrl: imageUrl || '',
      images: imageUrl ? [imageUrl] : [],
      productType: productType || 'custom',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const docRef = await firestoreDb.collection('merchandise').add(newProduct);
    
    res.json({ 
      success: true, 
      message: 'Product created successfully',
      product: { id: docRef.id, ...newProduct }
    });
  } catch (error: any) {
    console.error('Error creating Firestore merchandise:', error);
    res.status(500).json({ message: error.message || 'Error creating product' });
  }
});

// PUT /api/merch/firestore/:id - Update merchandise in Firestore
router.put('/firestore/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const merchId = req.params.id;
    const { name, description, price, stock, category, isAvailable } = req.body;
    
    const { db: firestoreDb } = await import('../firebase');
    
    if (!firestoreDb) {
      return res.status(500).json({ message: 'Firestore not available' });
    }
    
    // Update the document
    const merchRef = firestoreDb.collection('merchandise').doc(merchId);
    const doc = await merchRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    const updates: any = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (price !== undefined) updates.price = parseFloat(price);
    if (stock !== undefined) updates.stock = parseInt(stock);
    if (category !== undefined) updates.category = category;
    if (isAvailable !== undefined) updates.isAvailable = isAvailable;
    updates.updatedAt = new Date();
    
    await merchRef.update(updates);
    
    const updated = await merchRef.get();
    
    res.json({ 
      success: true, 
      message: 'Product updated successfully',
      product: { id: merchId, ...updated.data() }
    });
  } catch (error: any) {
    console.error('Error updating Firestore merchandise:', error);
    res.status(500).json({ message: error.message || 'Error updating product' });
  }
});

// DELETE /api/merch/firestore/:id - Delete merchandise from Firestore
router.delete('/firestore/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const merchId = req.params.id;
    
    const { db: firestoreDb } = await import('../firebase');
    
    if (!firestoreDb) {
      return res.status(500).json({ message: 'Firestore not available' });
    }
    
    const merchRef = firestoreDb.collection('merchandise').doc(merchId);
    const doc = await merchRef.get();
    
    if (!doc.exists) {
      return res.status(404).json({ message: 'Product not found' });
    }
    
    await merchRef.delete();
    
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting Firestore merchandise:', error);
    res.status(500).json({ message: error.message || 'Error deleting product' });
  }
});

// POST /api/merch/sync-printful - Sync a product to Printful
router.post('/sync-printful', authenticate, async (req: Request, res: Response) => {
  try {
    const { productId, productName, imageUrl, variantId, retailPrice } = req.body;
    
    if (!productName || !imageUrl || !variantId) {
      return res.status(400).json({ 
        message: 'Missing required fields: productName, imageUrl, variantId' 
      });
    }
    
    // Import Printful service
    const { getPrintfulService } = await import('../services/printful-service');
    const printful = getPrintfulService();
    
    // Create sync product in Printful
    const syncProduct = await printful.createSyncProduct({
      sync_product: {
        name: productName,
        thumbnail: imageUrl
      },
      sync_variants: [{
        variant_id: parseInt(variantId),
        retail_price: retailPrice?.toString() || '29.99',
        files: [{
          url: imageUrl,
          type: 'default'
        }]
      }]
    });
    
    // Update Firestore with Printful sync ID
    if (productId) {
      const { db: firestoreDb } = await import('../firebase');
      if (firestoreDb) {
        await firestoreDb.collection('merchandise').doc(productId).update({
          printfulSyncId: syncProduct.id,
          printfulSynced: true,
          printfulSyncedAt: new Date()
        });
      }
    }
    
    res.json({ 
      success: true, 
      message: 'Product synced to Printful successfully',
      printfulProduct: syncProduct
    });
  } catch (error: any) {
    console.error('Error syncing to Printful:', error);
    res.status(500).json({ 
      message: error.response?.data?.error?.message || error.message || 'Error syncing to Printful' 
    });
  }
});

// POST /api/merch/bulk-update - Bulk update products
router.post('/bulk-update', authenticate, async (req: Request, res: Response) => {
  try {
    const { products } = req.body; // Array of { id, price, stock, isAvailable }
    
    if (!products || !Array.isArray(products)) {
      return res.status(400).json({ message: 'Products array is required' });
    }
    
    const { db: firestoreDb } = await import('../firebase');
    
    if (!firestoreDb) {
      return res.status(500).json({ message: 'Firestore not available' });
    }
    
    const batch = firestoreDb.batch();
    const results: any[] = [];
    
    for (const product of products) {
      const { id, price, stock, isAvailable } = product;
      const merchRef = firestoreDb.collection('merchandise').doc(id);
      
      const updates: any = { updatedAt: new Date() };
      if (price !== undefined) updates.price = parseFloat(price);
      if (stock !== undefined) updates.stock = parseInt(stock);
      if (isAvailable !== undefined) updates.isAvailable = isAvailable;
      
      batch.update(merchRef, updates);
      results.push({ id, ...updates });
    }
    
    await batch.commit();
    
    res.json({ 
      success: true, 
      message: `${products.length} products updated successfully`,
      updated: results
    });
  } catch (error: any) {
    console.error('Error bulk updating products:', error);
    res.status(500).json({ message: error.message || 'Error updating products' });
  }
});

export default router;
