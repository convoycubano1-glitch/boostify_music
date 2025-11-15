import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import { db as firestore } from '../firebase';
import { FieldValue } from '../firebase';

// Helper function to generate unique slug
function generateSlug(name: string, userId?: number): string {
  const baseSlug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  // Add user ID suffix to ensure uniqueness
  return userId ? `${baseSlug}-${userId}` : baseSlug;
}

// Generate a basic bio using artist name and genre
function generateBasicBio(artistName: string, genre?: string): string {
  const genreText = genre ? ` especializado en ${genre}` : '';
  return `${artistName} es un artista${genreText} en Boostify Music. Descubre su música y videos exclusivos.`;
}

export interface EnsureProfileOptions {
  firebaseUid: string;
  email?: string;
  displayName?: string;
  genre?: string;
}

export interface AutoProfileResult {
  userId: number;
  slug: string;
  artistName: string;
  isNew: boolean;
}

/**
 * Ensures a user has a profile in PostgreSQL.
 * Creates one automatically if it doesn't exist.
 */
export async function ensureArtistProfile(options: EnsureProfileOptions): Promise<AutoProfileResult> {
  const { firebaseUid, email, displayName, genre } = options;
  
  try {
    // Try to find existing user by Firebase UID (stored in username)
    let [user] = await db
      .select({
        id: users.id,
        username: users.username,
        artistName: users.artistName,
        slug: users.slug,
        biography: users.biography,
        profileImage: users.profileImage,
        coverImage: users.coverImage,
      })
      .from(users)
      .where(eq(users.username, firebaseUid))
      .limit(1);
    
    // If user exists, return their info
    if (user) {
      console.log('✅ Usuario existente encontrado:', user.slug);
      return {
        userId: user.id,
        slug: user.slug || `user-${user.id}`,
        artistName: user.artistName || user.username || `Artist ${user.id}`,
        isNew: false
      };
    }
    
    // Create new user profile automatically
    console.log('🎨 Creando perfil automático para usuario:', firebaseUid);
    
    const defaultArtistName = displayName || email?.split('@')[0] || firebaseUid.substring(0, 8);
    const tempSlug = generateSlug(defaultArtistName);
    
    // Insert new user
    const [newUser] = await db
      .insert(users)
      .values({
        username: firebaseUid,
        password: 'replit-auth-user',
        artistName: defaultArtistName,
        slug: tempSlug, // Temporary, will update with ID
        biography: generateBasicBio(defaultArtistName, genre),
        genre: genre || '',
      })
      .returning({
        id: users.id,
        username: users.username,
        artistName: users.artistName,
        slug: users.slug,
      });
    
    // Update slug to include user ID for uniqueness
    const finalSlug = generateSlug(defaultArtistName, newUser.id);
    await db
      .update(users)
      .set({ slug: finalSlug })
      .where(eq(users.id, newUser.id));
    
    console.log('✅ Perfil creado:', finalSlug);
    
    return {
      userId: newUser.id,
      slug: finalSlug,
      artistName: newUser.artistName || defaultArtistName,
      isNew: true
    };
  } catch (error) {
    console.error('❌ Error ensuring artist profile:', error);
    throw error;
  }
}

export interface SaveSongOptions {
  artistId: string; // Firebase UID
  title: string;
  audioUrl: string;
  lyrics?: string;
  genre?: string;
  duration?: number;
  fileName?: string;
  format?: string;
}

/**
 * Saves a song to Firestore (artist_music collection)
 */
export async function saveSongToProfile(options: SaveSongOptions) {
  const { artistId, title, audioUrl, lyrics, genre, duration, fileName, format } = options;
  
  try {
    if (!firestore) {
      console.error('❌ Firestore no está disponible');
      throw new Error('Firestore no está inicializado');
    }

    const songData = {
      artistId,
      title,
      fileUrl: audioUrl,
      fileName: fileName || title,
      format: format || 'audio/mpeg',
      lyrics: lyrics || '',
      genre: genre || '',
      duration: duration || '',
      uploadedAt: FieldValue.serverTimestamp(),
      plays: 0,
      isPublished: true
    };
    
    const docRef = await firestore.collection('artist_music').add(songData);
    
    console.log('✅ Canción guardada en Firestore:', docRef.id);
    return { id: docRef.id, ...songData };
  } catch (error) {
    console.error('❌ Error saving song to Firestore:', error);
    throw error;
  }
}

export interface SaveVideoOptions {
  artistId: string; // Firebase UID
  title: string;
  videoUrl: string;
  thumbnailUrl?: string;
  songId?: string; // Firestore document ID
  description?: string;
  duration?: string;
}

/**
 * Saves a video to Firestore (artist_videos collection)
 */
export async function saveVideoToProfile(options: SaveVideoOptions) {
  const { artistId, title, videoUrl, thumbnailUrl, songId, description, duration } = options;
  
  try {
    if (!firestore) {
      console.error('❌ Firestore no está disponible');
      throw new Error('Firestore no está inicializado');
    }

    const videoData = {
      artistId,
      title,
      videoUrl,
      thumbnailUrl: thumbnailUrl || '',
      songId: songId || '',
      description: description || '',
      duration: duration || '',
      uploadedAt: FieldValue.serverTimestamp(),
      views: 0,
      isPublished: true
    };
    
    const docRef = await firestore.collection('artist_videos').add(videoData);
    
    console.log('✅ Video guardado en Firestore:', docRef.id);
    return { id: docRef.id, ...videoData };
  } catch (error) {
    console.error('❌ Error saving video to Firestore:', error);
    throw error;
  }
}

export interface UpdateProfileImagesOptions {
  userId: number;
  profileImageUrl?: string;
  coverImageUrl?: string;
  onlyIfEmpty?: boolean; // Only update if user doesn't have images
}

/**
 * Updates profile images (profile photo and cover banner)
 */
export async function updateProfileImages(options: UpdateProfileImagesOptions) {
  const { userId, profileImageUrl, coverImageUrl, onlyIfEmpty = true } = options;
  
  try {
    // Get current user to check if they have images
    const [currentUser] = await db
      .select({
        profileImage: users.profileImage,
        coverImage: users.coverImage,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    const updateData: any = {};
    
    // Only update profileImage if empty or onlyIfEmpty is false
    if (profileImageUrl && (!onlyIfEmpty || !currentUser.profileImage)) {
      updateData.profileImage = profileImageUrl;
      console.log('📸 Actualizando foto de perfil');
    }
    
    // Only update coverImage if empty or onlyIfEmpty is false
    if (coverImageUrl && (!onlyIfEmpty || !currentUser.coverImage)) {
      updateData.coverImage = coverImageUrl;
      console.log('🖼️ Actualizando imagen de portada');
    }
    
    // Only update if there's something to update
    if (Object.keys(updateData).length > 0) {
      await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId));
      
      console.log('✅ Imágenes de perfil actualizadas');
      return true;
    } else {
      console.log('ℹ️ No se requiere actualización de imágenes');
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating profile images:', error);
    throw error;
  }
}

/**
 * Gets user profile by user ID
 */
export async function getProfileByUserId(userId: number) {
  try {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    
    return user || null;
  } catch (error) {
    console.error('❌ Error getting profile:', error);
    return null;
  }
}
