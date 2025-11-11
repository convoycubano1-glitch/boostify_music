import { Router, Request, Response } from 'express';
import { db } from '../db';
import { users, songs, merchandise, artistMedia } from '../db/schema';
import { eq } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import fileUpload from 'express-fileupload';
import path from 'path';
import fs from 'fs/promises';
import { z } from 'zod';
import { insertSongSchema, insertMerchandiseSchema } from '../../db/schema';

const router = Router();

// Helper function to generate unique slug
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// GET /api/user/profile - Get current user's profile (authenticated)
router.get('/user/profile', authenticate, async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user!.uid || req.user!.id;
    const email = req.user!.email;
    
    // Try to find user by Firebase UID (stored as username initially)
    let [user] = await db
      .select({
        id: users.id,
        username: users.username,
        artistName: users.artistName,
        slug: users.slug,
        profileImage: users.profileImage,
        coverImage: users.coverImage,
      })
      .from(users)
      .where(eq(users.username, firebaseUid))
      .limit(1);
      
    // If user doesn't exist in PostgreSQL, create one
    if (!user) {
      const defaultUsername = email?.split('@')[0] || firebaseUid.substring(0, 8);
      const defaultSlug = generateSlug(defaultUsername);
      
      const [newUser] = await db
        .insert(users)
        .values({
          username: firebaseUid, // Use Firebase UID as username for now
          password: 'firebase-user', // Placeholder since Firebase handles auth
          artistName: defaultUsername,
          slug: defaultSlug,
          email: email,
        })
        .returning({
          id: users.id,
          username: users.username,
          artistName: users.artistName,
          slug: users.slug,
          profileImage: users.profileImage,
          coverImage: users.coverImage,
        });
      
      user = newUser;
    }
    
    res.json(user);
  } catch (error) {
    console.error('Error getting user profile:', error);
    res.status(500).json({ message: 'Error getting user profile' });
  }
});

// GET /api/profile/:slug - Get public profile by slug or UID
router.get('/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;
    
    // First, try to get user by slug
    let [user] = await db
      .select()
      .from(users)
      .where(eq(users.slug, slug))
      .limit(1);
    
    // If not found by slug, try by username (which stores Firebase UID)
    if (!user) {
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.username, slug))
        .limit(1);
      
      // If user exists but doesn't have a slug yet, create one
      if (user && !user.slug) {
        const defaultSlug = generateSlug(user.artistName || user.username || slug);
        const [updated] = await db
          .update(users)
          .set({ slug: defaultSlug })
          .where(eq(users.id, user.id))
          .returning();
        user = updated;
      }
    }
      
    if (!user) {
      return res.status(404).json({ message: 'Artist not found' });
    }
    
    // Get all published content for this user
    const [userSongs, userMerch, userVideos] = await Promise.all([
      db.select().from(songs).where(eq(songs.userId, user.id)),
      db.select().from(merchandise).where(eq(merchandise.userId, user.id)),
      db.select().from(artistMedia).where(eq(artistMedia.userId, user.id))
    ]);
    
    // Return profile data without sensitive information
    const profile = {
      id: user.id,
      username: user.username,
      artistName: user.artistName || user.username,
      slug: user.slug,
      biography: user.biography,
      genre: user.genre,
      location: user.location,
      website: user.website,
      profileImage: user.profileImage,
      coverImage: user.coverImage,
      instagramHandle: user.instagramHandle,
      twitterHandle: user.twitterHandle,
      youtubeChannel: user.youtubeChannel,
      songs: userSongs,
      merchandise: userMerch,
      videos: userVideos
    };
    
    res.json(profile);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: 'Error getting profile' });
  }
});

// PUT /api/profile - Update own profile (authenticated)
router.put('/', authenticate, async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user!.uid || req.user!.id;
    const { artistName, biography, genre, location, website, instagramHandle, twitterHandle, youtubeChannel, slug: requestedSlug } = req.body;
    
    // Find user by Firebase UID (stored in username)
    const [currentUser] = await db.select().from(users).where(eq(users.username, firebaseUid)).limit(1);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = currentUser.id;
    
    // Handle slug update
    let slug = undefined;
    if (requestedSlug !== undefined && requestedSlug.trim() !== '') {
      // Normalize the slug
      slug = generateSlug(requestedSlug);
      
      // Validate slug is not empty after normalization
      if (!slug) {
        return res.status(400).json({ message: 'Invalid slug' });
      }
      
      // Check if slug is already taken by another user
      const [existingUser] = await db.select().from(users).where(eq(users.slug, slug)).limit(1);
      if (existingUser && existingUser.id !== userId) {
        return res.status(409).json({ message: 'This URL is already taken. Please choose a different one.' });
      }
    } else if (artistName) {
      // Auto-generate slug if artistName is provided and user doesn't have one
      if (!currentUser.slug) {
        slug = generateSlug(artistName);
        
        // Check if slug already exists
        const [existingUser] = await db.select().from(users).where(eq(users.slug, slug)).limit(1);
        if (existingUser) {
          slug = `${slug}-${userId}`;
        }
      }
    }
    
    const updateData: any = {
      ...(artistName !== undefined && { artistName }),
      ...(biography !== undefined && { biography }),
      ...(genre !== undefined && { genre }),
      ...(location !== undefined && { location }),
      ...(website !== undefined && { website }),
      ...(instagramHandle !== undefined && { instagramHandle }),
      ...(twitterHandle !== undefined && { twitterHandle }),
      ...(youtubeChannel !== undefined && { youtubeChannel }),
      ...(slug && { slug })
    };
    
    const [updated] = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, userId))
      .returning();
      
    res.json({ message: 'Profile updated', profile: updated });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// POST /api/profile/upload - Upload profile images (authenticated)
router.post('/upload', authenticate, async (req: any, res: Response) => {
  try {
    const firebaseUid = req.user!.uid || req.user!.id;
    
    // Find user by Firebase UID
    const [user] = await db.select().from(users).where(eq(users.username, firebaseUid)).limit(1);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const userId = user.id;
    
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(400).json({ message: 'No files uploaded' });
    }
    
    const uploadedFiles: any = {};
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', 'profiles', userId.toString());
    await fs.mkdir(uploadsDir, { recursive: true });
    
    // Handle profileImage
    if (req.files.profileImage) {
      const file = Array.isArray(req.files.profileImage) ? req.files.profileImage[0] : req.files.profileImage;
      const filename = `profile-${Date.now()}${path.extname(file.name)}`;
      const filepath = path.join(uploadsDir, filename);
      await file.mv(filepath);
      uploadedFiles.profileImage = `/uploads/profiles/${userId}/${filename}`;
    }
    
    // Handle coverImage
    if (req.files.coverImage) {
      const file = Array.isArray(req.files.coverImage) ? req.files.coverImage[0] : req.files.coverImage;
      const filename = `cover-${Date.now()}${path.extname(file.name)}`;
      const filepath = path.join(uploadsDir, filename);
      await file.mv(filepath);
      uploadedFiles.coverImage = `/uploads/profiles/${userId}/${filename}`;
    }
    
    // Update user profile with new images
    if (Object.keys(uploadedFiles).length > 0) {
      await db
        .update(users)
        .set(uploadedFiles)
        .where(eq(users.id, userId));
    }
    
    res.json({ message: 'Files uploaded', files: uploadedFiles });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({ message: 'Error uploading files' });
  }
});

export default router;
