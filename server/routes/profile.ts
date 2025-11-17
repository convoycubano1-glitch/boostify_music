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
import { 
  ensureArtistProfile, 
  saveSongToProfile, 
  saveVideoToProfile,
  updateProfileImages 
} from '../services/artist-profile-auto';

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

// GET /api/profile/:slugOrId - Get public profile by slug or ID
router.get('/:slugOrId', async (req: Request, res: Response) => {
  try {
    const { slugOrId } = req.params;
    
    // Check if it's a numeric ID or a slug
    const isNumericId = /^\d+$/.test(slugOrId);
    
    let user;
    if (isNumericId) {
      // Search by ID
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, parseInt(slugOrId)))
        .limit(1);
    } else {
      // Search by slug
      [user] = await db
        .select()
        .from(users)
        .where(eq(users.slug, slugOrId))
        .limit(1);
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
      bannerPosition: user.bannerPosition,
      loopVideoUrl: user.loopVideoUrl,
      email: user.email,
      phone: user.phone,
      instagramHandle: user.instagramHandle,
      twitterHandle: user.twitterHandle,
      youtubeChannel: user.youtubeChannel,
      spotifyUrl: user.spotifyUrl,
      isAIGenerated: user.isAIGenerated,
      firestoreId: user.firestoreId,
      generatedBy: user.generatedBy,
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

// POST /api/profile/ensure - Ensure user has a profile (auto-create if needed)
router.post('/ensure', authenticate, async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user!.uid || req.user!.id;
    const email = req.user!.email;
    const displayName = (req.user as any)?.displayName || (req.user as any)?.name;
    const { genre } = req.body;
    
    console.log('🔍 Verificando perfil para usuario:', firebaseUid);
    
    const result = await ensureArtistProfile({
      firebaseUid,
      email,
      displayName,
      genre
    });
    
    res.json({
      success: true,
      profile: result,
      message: result.isNew ? 'Perfil creado automáticamente' : 'Perfil existente'
    });
  } catch (error) {
    console.error('Error ensuring profile:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error verificando perfil' 
    });
  }
});

// POST /api/profile/save-song - Save a song to user's profile
router.post('/save-song', authenticate, async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user!.uid || req.user!.id;
    const { title, audioUrl, lyrics, genre, duration, fileName, format } = req.body;
    
    // Ensure user has profile first (in PostgreSQL)
    const profile = await ensureArtistProfile({ firebaseUid });
    
    // Save song to Firestore
    const song = await saveSongToProfile({
      artistId: firebaseUid, // Use Firebase UID for Firestore
      title,
      audioUrl,
      lyrics,
      genre,
      duration,
      fileName,
      format
    });
    
    res.json({
      success: true,
      song,
      profileSlug: profile.slug,
      message: 'Canción guardada exitosamente'
    });
  } catch (error) {
    console.error('Error saving song:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error guardando canción' 
    });
  }
});

// POST /api/profile/save-video - Save a video to user's profile
router.post('/save-video', authenticate, async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user!.uid || req.user!.id;
    const { title, videoUrl, thumbnailUrl, songId, description, duration } = req.body;
    
    // Ensure user has profile first (in PostgreSQL)
    const profile = await ensureArtistProfile({ firebaseUid });
    
    // Save video to Firestore
    const video = await saveVideoToProfile({
      artistId: firebaseUid, // Use Firebase UID for Firestore
      title,
      videoUrl,
      thumbnailUrl,
      songId,
      description,
      duration
    });
    
    res.json({
      success: true,
      video,
      profileSlug: profile.slug,
      message: 'Video guardado exitosamente'
    });
  } catch (error) {
    console.error('Error saving video:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error guardando video' 
    });
  }
});

// POST /api/profile/update-images - Update profile images automatically
router.post('/update-images', authenticate, async (req: Request, res: Response) => {
  try {
    const firebaseUid = req.user!.uid || req.user!.id;
    const { profileImageUrl, coverImageUrl, onlyIfEmpty = true } = req.body;
    
    // Ensure user has profile first
    const profile = await ensureArtistProfile({ firebaseUid });
    
    const updated = await updateProfileImages({
      userId: profile.userId,
      profileImageUrl,
      coverImageUrl,
      onlyIfEmpty
    });
    
    res.json({
      success: true,
      updated,
      message: updated ? 'Imágenes actualizadas' : 'No se requirió actualización'
    });
  } catch (error) {
    console.error('Error updating images:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error actualizando imágenes' 
    });
  }
});

export default router;
