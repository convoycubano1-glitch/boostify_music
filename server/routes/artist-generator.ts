/**
 * Rutas para la generación de artistas aleatorios
 */
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../middleware/clerk-auth';
import { generateRandomArtist } from '../../scripts/generate-random-artist';
import { db } from '../firebase';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';
import { db as pgDb } from '../../db';
import { users, artistNews, songs, tokenizedSongs } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
// FAL AI Nano Banana para imágenes y MiniMax Music para audio
import { 
  generateImageWithNanoBanana, 
  generateImageWithFaceReference as generateImageWithFaceReferenceFAL,
  generateMusicWithMiniMax,
  generateArtistSongWithFAL,
  generateArtistMerchandise
} from '../services/fal-service';
// OpenAI para generación de texto
import OpenAI from "openai";

// Cliente OpenAI para generación de texto
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
import { NotificationTemplates } from '../utils/notifications';
import { generateSocialMediaContent } from '../services/social-media-service';
import axios from 'axios';

const router = Router();

/**
 * Helper function para descargar una imagen y convertirla a base64
 */
async function downloadImageAsBase64(imageUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, { 
      responseType: 'arraybuffer',
      timeout: 10000
    });
    const base64 = Buffer.from(response.data, 'binary').toString('base64');
    return base64;
  } catch (error) {
    console.error('Error descargando imagen:', error);
    return null;
  }
}

/**
 * Endpoint para obtener todos los artistas de un usuario
 * Incluye: su propio perfil + artistas generados con IA
 */
router.get("/my-artists", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.user?.id;
    
    if (!clerkUserId) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado' 
      });
    }

    console.log(`🎨 Obteniendo todos los artistas del usuario Clerk: ${clerkUserId}`);

    // Primero, obtener el ID de PostgreSQL del usuario basado en su clerkId
    const userRecord = await pgDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (userRecord.length === 0) {
      console.log(`⚠️ Usuario con clerkId ${clerkUserId} no encontrado en PostgreSQL`);
      return res.status(200).json({
        success: true,
        count: 0,
        artists: []
      });
    }

    const pgUserId = userRecord[0].id;
    console.log(`📍 Usuario PostgreSQL ID: ${pgUserId} para Clerk ID: ${clerkUserId}`);

    // Obtener artistas de PostgreSQL
    // 1. Su propio perfil (id = pgUserId AND role = 'artist')
    // 2. Artistas generados por IA (generatedBy = pgUserId)
    const { or } = await import('drizzle-orm');
    
    const artistsFromPg = await pgDb
      .select()
      .from(users)
      .where(
        or(
          eq(users.id, pgUserId),          // Su propio perfil
          eq(users.generatedBy, pgUserId)   // Artistas generados por IA
        )
      );

    console.log(`✅ Encontrados ${artistsFromPg.length} artistas en PostgreSQL (propio + IA generados)`);

    // Formatear respuesta
    const formattedArtists = artistsFromPg.map(artist => ({
      id: artist.id,
      firestoreId: artist.firestoreId,
      name: artist.artistName,
      slug: artist.slug,
      biography: artist.biography,
      profileImage: artist.profileImage,
      coverImage: artist.coverImage,
      bannerPosition: artist.bannerPosition,
      loopVideoUrl: artist.loopVideoUrl,
      genres: artist.genres,
      country: artist.country,
      location: artist.location,
      email: artist.email,
      phone: artist.phone,
      isAIGenerated: artist.isAIGenerated,
      createdAt: artist.createdAt,
      instagram: artist.instagramHandle,
      twitter: artist.twitterHandle,
      youtube: artist.youtubeChannel,
      spotify: artist.spotifyUrl
    }));

    res.status(200).json({
      success: true,
      count: formattedArtists.length,
      artists: formattedArtists
    });
  } catch (error) {
    console.error('❌ Error obteniendo artistas del usuario:', error);
    res.status(500).json({ 
      error: 'Error al obtener artistas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Genera un slug único desde el nombre del artista
 */
function generateSlug(artistName: string, attempt = 0): string {
  const baseSlug = artistName
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  return attempt > 0 ? `${baseSlug}-${attempt}` : baseSlug;
}

/**
 * Guarda un artista generado en Firestore
 * @param artistData Datos del artista a guardar
 * @returns ID del documento creado
 */
async function saveArtistToFirestore(artistData: any): Promise<string> {
  try {
    // Usar la API de Firebase Admin correctamente
    const docRef = await db.collection('generated_artists').add({
      ...artistData,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now()
    });

    // Actualizar el documento recién creado para incluir su propio firestoreId
    await docRef.update({
      firestoreId: docRef.id
    });

    console.log(`Artista guardado con ID: ${docRef.id}`);
    return docRef.id;
  } catch (error) {
    console.error('Error al guardar artista en Firestore:', error);
    throw error;
  }
}

/**
 * Guarda un artista generado en PostgreSQL
 * @param artistData Datos del artista desde Firestore
 * @param firestoreId ID del documento en Firestore
 * @param userId ID del usuario creador (opcional)
 * @returns ID del usuario creado en PostgreSQL
 */
async function saveArtistToPostgreSQL(artistData: any, firestoreId: string, clerkUserId?: string): Promise<number> {
  try {
    // Obtener el ID de PostgreSQL del usuario basado en su clerkId
    let postgresUserId: number | null = null;
    if (clerkUserId) {
      const userRecord = await pgDb
        .select({ id: users.id })
        .from(users)
        .where(eq(users.clerkId, clerkUserId))
        .limit(1);
      
      if (userRecord.length > 0) {
        postgresUserId = userRecord[0].id;
        console.log(`📍 Usuario PostgreSQL ID: ${postgresUserId} para Clerk ID: ${clerkUserId}`);
      } else {
        console.log(`⚠️ No se encontró usuario con Clerk ID: ${clerkUserId}`);
      }
    }

    // Generar slug único
    let slug = generateSlug(artistData.name);
    let attempt = 0;
    let slugExists = true;
    
    while (slugExists && attempt < 100) {
      const existing = await pgDb.select().from(users).where(eq(users.slug, slug)).limit(1);
      if (existing.length === 0) {
        slugExists = false;
      } else {
        attempt++;
        slug = generateSlug(artistData.name, attempt);
      }
    }

    // Mapear datos de Firestore a PostgreSQL
    const postgresData = {
      role: 'artist' as const,
      artistName: artistData.name,
      slug,
      biography: artistData.biography || null,
      profileImage: artistData.look?.profile_url || artistData.profileImage || null,
      coverImage: artistData.look?.cover_url || artistData.coverImage || null,
      realName: artistData.realName || null,
      country: artistData.country || null,
      genres: artistData.music_genres || [],
      email: artistData.management?.email || null,
      phone: artistData.management?.phone || null,
      instagramHandle: artistData.social_media?.instagram?.handle || null,
      twitterHandle: artistData.social_media?.twitter?.handle || null,
      youtubeChannel: artistData.social_media?.youtube?.handle || null,
      spotifyUrl: artistData.social_media?.spotify?.url || null,
      // Virtual Record Label fields
      firestoreId,
      isAIGenerated: true,
      generatedBy: postgresUserId,
      recordLabelId: null
    };

    const [newUser] = await pgDb.insert(users).values(postgresData).returning({ id: users.id });
    
    console.log(`Artista guardado en PostgreSQL con ID: ${newUser.id}`);
    return newUser.id;
  } catch (error) {
    console.error('Error al guardar artista en PostgreSQL:', error);
    throw error;
  }
}

/**
 * Endpoint para generar un artista aleatorio
 * Puede ser usado con o sin autenticación
 */
router.post("/generate-artist", async (req: Request, res: Response) => {
  try {
    console.log('Recibida solicitud para generar artista aleatorio');

    // Generar datos del artista aleatorio
    const artistData = await generateRandomArtist();
    console.log('Artista generado exitosamente:', artistData.name);

    // 🖼️ GENERAR IMÁGENES DEL ARTISTA CON FAL AI NANO BANANA PRO
    console.log('🖼️ Generando imágenes del artista con FAL AI Nano Banana Pro...');
    let profileImageUrl = artistData.look?.profile_url || '';
    let coverImageUrl = artistData.look?.cover_url || '';

    try {
      const { generateArtistImagesWithFAL } = await import('../services/fal-service');
      const artistDescription = artistData.look?.description || `${artistData.name}, professional music artist`;
      const genre = artistData.music_genres?.[0] || 'pop';
      
      const imageResult = await generateArtistImagesWithFAL(artistDescription, artistData.name, genre);
      profileImageUrl = imageResult.profileUrl;
      coverImageUrl = imageResult.coverUrl;
      
      // Actualizar artistData con las imágenes generadas
      if (artistData.look) {
        artistData.look.profile_url = profileImageUrl;
        artistData.look.cover_url = coverImageUrl;
      }
      
      console.log(`✅ Imágenes generadas con FAL AI`);
    } catch (imageError) {
      console.error('⚠️ Error generando imágenes:', imageError);
      profileImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(artistData.name)}&size=400&background=random`;
      coverImageUrl = `https://picsum.photos/seed/${artistData.name}/1200/400`;
    }

    // Actualizar artistData con las imágenes
    const artistDataWithImages = {
      ...artistData,
      look: {
        ...artistData.look,
        profile_url: profileImageUrl,
        cover_url: coverImageUrl
      }
    };

    // Guardar artista en Firestore
    const firestoreId = await saveArtistToFirestore(artistDataWithImages);
    console.log(`Artista guardado en Firestore con ID: ${firestoreId}`);

    // NUEVO: Guardar artista en PostgreSQL
    const postgresId = await saveArtistToPostgreSQL(artistDataWithImages, firestoreId);
    console.log(`Artista guardado en PostgreSQL con ID: ${postgresId}`);

    // Actualizar PostgreSQL con las imágenes
    await pgDb.update(users)
      .set({
        profileImage: profileImageUrl,
        coverImage: coverImageUrl
      })
      .where(eq(users.id, postgresId));

    // Actualizar Firestore con el ID de PostgreSQL
    await db.collection('generated_artists').doc(firestoreId).update({ 
      firestoreId,
      postgresId,
      'look.profile_url': profileImageUrl,
      'look.cover_url': coverImageUrl
    });

    // Añadir los IDs al objeto de artista
    const completeArtistData = {
      ...artistDataWithImages,
      firestoreId,
      postgresId,
      profileImage: profileImageUrl,
      coverImage: coverImageUrl
    };

    // Devolver respuesta con datos completos del artista
    res.status(200).json(completeArtistData);
  } catch (error) {
    console.error('Error generando artista aleatorio:', error);
    res.status(500).json({ 
      error: 'Error al generar artista aleatorio',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para crear un artista manualmente
 */
router.post("/create-manual", isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log('📝 Recibida solicitud para crear artista manualmente');
    
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado' 
      });
    }

    const { name, biography, genre, location, slug } = req.body;

    if (!name || !slug) {
      return res.status(400).json({ 
        error: 'Nombre y slug son requeridos' 
      });
    }

    // Verificar que el slug no exista
    const existingUser = await pgDb.select().from(users).where(eq(users.slug, slug)).limit(1);
    if (existingUser.length > 0) {
      return res.status(400).json({ 
        error: 'Ya existe un artista con ese nombre' 
      });
    }

    // Crear artista en PostgreSQL
    const [newArtist] = await pgDb.insert(users).values({
      role: 'artist',
      artistName: name,
      slug,
      biography: biography || null,
      location: location || null,
      genres: genre ? [genre] : [],
      generatedBy: userId, // Asociar al usuario creador
      isAIGenerated: false, // No es generado por IA
      createdAt: new Date()
    }).returning();

    console.log(`✅ Artista creado manualmente con ID: ${newArtist.id}`);

    res.status(200).json({
      success: true,
      artist: {
        id: newArtist.id,
        name: newArtist.artistName,
        slug: newArtist.slug,
        biography: newArtist.biography,
        location: newArtist.location,
        genres: newArtist.genres,
        isAIGenerated: newArtist.isAIGenerated
      }
    });
  } catch (error) {
    console.error('❌ Error creando artista manualmente:', error);
    res.status(500).json({ 
      error: 'Error al crear artista',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Genera un título creativo para una canción basado en el contexto del artista
 */
function generateCreativeSongTitle(artistName: string, genre: string, mood: string): string {
  const titleTemplates: Record<string, string[]> = {
    'pop': ['Neon Dreams', 'Heartbeat', 'Electric Love', 'Midnight Dance', 'Golden Hour', 'Infinite', 'Stardust', 'Wildfire'],
    'hip-hop': ['Crown Me', 'No Cap', 'Real Talk', 'Stack It Up', 'Zone', 'Drip', 'Legacy', 'Grind Mode'],
    'rap': ['Bars on Fire', 'Untouchable', 'Flow State', 'King Shit', 'Never Fold', 'Run It', 'Boss Move', 'Street Dreams'],
    'electronic': ['Synthwave', 'Drop Zone', 'Neon Nights', 'Bass Drop', 'Electric Feel', 'Pulse', 'Euphoria', 'Rave On'],
    'rock': ['Thunder', 'Breaking Free', 'Rise Up', 'Burning Bright', 'Wild Heart', 'Louder', 'Unbreakable', 'Fire Inside'],
    'indie': ['Autumn Leaves', 'Quiet Storm', 'Fading Light', 'Paper Moon', 'Soft Glow', 'Daydream', 'Whispers', 'Gentle Rain'],
    'r&b': ['Silk', 'Midnight Hour', 'Body Talk', 'Sweet Escape', 'After Dark', 'Vibe', 'Slow Motion', 'Chemistry'],
    'latin': ['Fuego', 'Caliente', 'Ritmo', 'Bailar', 'Tropical Heat', 'Sabor', 'Noche Loca', 'Amor Eterno'],
    'reggaeton': ['Perreo', 'Flow Latino', 'Dembow', 'Gasolina', 'Calor', 'Bellaqueo', 'Movimiento', 'La Disco']
  };
  
  const moodPrefixes: Record<string, string[]> = {
    'energetic': ['High Energy', 'Electric', 'Fire', 'Explosive'],
    'mellow': ['Soft', 'Gentle', 'Calm', 'Peaceful'],
    'upbeat': ['Happy', 'Bright', 'Sunny', 'Joyful'],
    'dark': ['Shadow', 'Midnight', 'Dark', 'Deep'],
    'romantic': ['Love', 'Heart', 'Forever', 'Passion']
  };
  
  const genreTitles = titleTemplates[genre.toLowerCase()] || titleTemplates['pop'];
  const randomTitle = genreTitles[Math.floor(Math.random() * genreTitles.length)];
  
  // A veces añadir prefijo de mood
  if (Math.random() > 0.6) {
    const prefixes = moodPrefixes[mood] || moodPrefixes['energetic'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    return `${prefix} ${randomTitle}`;
  }
  
  return randomTitle;
}

/**
 * Endpoint para generar una sola canción con IA
 * USA FAL AI MiniMax Music V2 para generar audio real con voces
 * Si no se proporciona título, genera uno automáticamente basado en el contexto del artista
 */
router.post("/generate-single-song", async (req: Request, res: Response) => {
  try {
    const { artistName, songTitle, genre, mood, artistId, artistGender, artistBio } = req.body;
    
    if (!artistId) {
      return res.status(400).json({ 
        error: 'artistId es requerido' 
      });
    }
    
    const finalGenre = genre || 'pop';
    const finalMood = mood || 'energetic';
    const finalArtistName = artistName || 'Artist';
    const finalGender = artistGender || 'male';
    
    // Si no hay título, generar uno creativo basado en el contexto
    const finalSongTitle = songTitle?.trim() || generateCreativeSongTitle(finalArtistName, finalGenre, finalMood);
    
    console.log(`🎵 Generando canción: "${finalSongTitle}" para ${finalArtistName} (${finalGenre}/${finalMood})`);
    
    // Generar canción con FAL AI MiniMax Music V2
    let audioUrl = '';
    let lyrics = '';
    
    try {
      console.log(`🎵 Llamando a FAL AI para generar: ${finalSongTitle} (${finalMood} ${finalGenre})`);
      
      const musicResult = await generateArtistSongWithFAL(
        finalArtistName, 
        finalSongTitle, 
        finalGenre, 
        finalMood, 
        finalGender
      );
      
      if (musicResult.success && musicResult.audioUrl) {
        audioUrl = musicResult.audioUrl;
        lyrics = musicResult.lyrics || '';
        console.log(`✅ Canción generada: ${audioUrl.substring(0, 60)}...`);
      } else {
        console.warn(`⚠️ No se pudo generar canción: ${musicResult.error}`);
        return res.status(500).json({ 
          error: 'No se pudo generar la canción',
          details: musicResult.error
        });
      }
    } catch (musicError) {
      console.error('❌ Error generando música con FAL:', musicError);
      return res.status(500).json({ 
        error: 'Error al generar música',
        details: musicError instanceof Error ? musicError.message : 'Error desconocido'
      });
    }
    
    // Guardar canción en Firestore
    try {
      const songDoc = await db.collection('songs').add({
        userId: artistId, // artistId aquí es el firestoreId del artista
        artistId: artistId,
        artistName: finalArtistName,
        name: finalSongTitle,
        title: finalSongTitle,
        audioUrl: audioUrl,
        genre: finalGenre,
        mood: finalMood,
        lyrics: lyrics,
        artistGender: finalGender,
        isPublished: true,
        generatedWithAI: true,
        aiProvider: 'fal-minimax-music-v2',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      console.log(`✅ Canción guardada en Firestore con ID: ${songDoc.id}`);
      
      res.status(200).json({
        success: true,
        song: {
          id: songDoc.id,
          title: finalSongTitle,
          audioUrl: audioUrl,
          lyrics: lyrics,
          genre: finalGenre,
          mood: finalMood,
          artistName: finalArtistName
        }
      });
    } catch (firestoreError) {
      console.error('❌ Error guardando en Firestore:', firestoreError);
      // Aún devolver éxito si el audio se generó
      res.status(200).json({
        success: true,
        warning: 'Audio generado pero error al guardar en base de datos',
        song: {
          title: finalSongTitle,
          audioUrl: audioUrl,
          lyrics: lyrics,
          artistName: finalArtistName
        }
      });
    }
  } catch (error) {
    console.error('❌ Error en generate-single-song:', error);
    res.status(500).json({ 
      error: 'Error al generar canción',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Genera 3 canciones tokenizadas automáticas para un artista
 * USA FAL AI MiniMax Music V2 para generar audio real con voces y letras
 * Guarda en PostgreSQL Y en Firestore para sincronización
 */
async function generateTokenizedSongs(
  artistId: number, 
  artistName: string, 
  genre: string, 
  songOwnerId: string, // ID que se usará como userId en Firestore (usar postgresId para artistas generados)
  artistFirestoreId: string,
  artistGender: 'male' | 'female' = 'male'
): Promise<number[]> {
  // Solo 3 canciones para reducir costos y tiempo
  const songConfigs = [
    { title: `${artistName} - Main Single`, mood: 'energetic' },
    { title: `${artistName} - Acoustic Edition`, mood: 'mellow' },
    { title: `${artistName} - Club Mix`, mood: 'upbeat' },
  ];

  const tokenIds: number[] = [];

  console.log(`🎵 Generando ${songConfigs.length} canciones para ${artistName} (${artistGender}) con FAL AI MiniMax Music V2...`);

  for (let i = 0; i < songConfigs.length; i++) {
    const { title, mood } = songConfigs[i];
    let audioUrl = '';
    let lyrics = '';

    // 🎵 Generar audio real con FAL AI MiniMax Music V2 (con voces y letras)
    try {
      console.log(`🎵 Generando canción ${i + 1}/${songConfigs.length}: ${title} (Voz: ${artistGender})...`);
      
      // Pasar artistGender para generar voz correcta
      const musicResult = await generateArtistSongWithFAL(artistName, title, genre, mood, artistGender);
      
      if (musicResult.success && musicResult.audioUrl) {
        audioUrl = musicResult.audioUrl;
        lyrics = musicResult.lyrics || '';
        console.log(`✅ Canción generada con voces: ${audioUrl.substring(0, 60)}...`);
        if (lyrics) {
          console.log(`✅ Letras generadas: ${lyrics.substring(0, 100)}...`);
        }
      } else {
        console.warn(`⚠️ No se pudo generar canción para ${title}: ${musicResult.error}`);
        // Usar placeholder si falla
        audioUrl = `https://storage.googleapis.com/boostify-music/samples/placeholder-${genre}.mp3`;
      }

      // Pausa de 5 segundos para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (musicError) {
      console.error(`❌ Error generando música para ${title}:`, musicError);
      audioUrl = `https://storage.googleapis.com/boostify-music/samples/placeholder-${genre}.mp3`;
    }

    // Guardar en PostgreSQL con letras y metadatos de AI
    const [song] = await pgDb.insert(songs).values({
      userId: artistId,
      title: title,
      description: `Tokenized song by ${artistName} - ${mood} ${genre} track`,
      audioUrl: audioUrl,
      genre: genre,
      mood: mood,
      lyrics: lyrics,
      artistGender: artistGender,
      generatedWithAI: true,
      aiProvider: 'fal-minimax-music-v2',
      isPublished: true
    }).returning({ id: songs.id });

    const tokenId = 1000 + artistId * 100 + i;
    const tokenSymbol = `${artistName.substring(0, 3).toUpperCase()}-${String(i + 1).padStart(3, '0')}`;

    const [tokenizedSong] = await pgDb.insert(tokenizedSongs).values({
      artistId,
      songName: title,
      tokenId: tokenId,
      tokenSymbol: tokenSymbol,
      totalSupply: 1000,
      availableSupply: 1000,
      pricePerTokenUsd: `${10 + Math.random() * 90}`,
      royaltyPercentageArtist: 80,
      royaltyPercentagePlatform: 20,
      contractAddress: `0x${Math.random().toString(16).substring(2).padEnd(40, '0')}`,
      metadataUri: `ipfs://QmMeta${Math.random().toString(36).substring(7)}`,
      description: `Tokenized ${mood} ${genre} music by ${artistName}`,
      benefits: ['Exclusive Access', 'Revenue Share', 'Creator Rights'],
      isActive: true
    }).returning({ id: tokenizedSongs.id });

    // 🔥 Guardar también en Firestore para sincronización (con letras)
    try {
      await db.collection('songs').add({
        userId: songOwnerId, // Usar songOwnerId (postgresId) para que el cliente encuentre las canciones
        artistId: artistFirestoreId,
        name: title,
        title: title,
        audioUrl: audioUrl, // URL real del audio generado
        genre: genre,
        mood: mood,
        lyrics: lyrics, // Letras generadas por AI
        artistGender: artistGender,
        tokenId: tokenId,
        tokenSymbol: tokenSymbol,
        isPublished: true,
        generatedWithAI: true,
        aiProvider: 'fal-minimax-music-v2',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`✅ Canción sincronizada a Firestore #${i + 1}: ${title}`);
    } catch (firebaseError) {
      console.warn(`⚠️ Error guardando en Firestore:`, firebaseError);
    }

    tokenIds.push(tokenId);
    console.log(`✅ Creada canción tokenizada #${i + 1}: ${title} (Token ID: ${tokenId})`);
  }

  console.log(`🎵 Generación de canciones completada: ${tokenIds.length} canciones creadas`);
  return tokenIds;
}

/**
 * Genera contenido de redes sociales para el artista
 */
async function generateArtistSocialContent(artistId: number, artistName: string, biography: string, slug: string): Promise<any> {
  try {
    const profileUrl = `https://boostify.app/artist/${slug}`;
    const socialContent = await generateSocialMediaContent(artistName, biography, profileUrl, artistId);
    console.log('✅ Contenido de redes sociales generado:', socialContent);
    return socialContent;
  } catch (error) {
    console.error('⚠️ Error generando contenido social:', error);
    return { success: false, error: 'No se pudo generar contenido social' };
  }
}

/**
 * Genera EPK automático para el artista
 */
async function generateArtistEPK(artistId: number, artistName: string, artistData: any): Promise<any> {
  try {
    const epkData = {
      artistName,
      genre: artistData.music_genres || ['Pop'],
      biography: artistData.biography,
      profileImage: artistData.look?.profile_url,
      socialLinks: {
        instagram: artistData.social_media?.instagram?.url,
        spotify: artistData.social_media?.spotify?.url,
        youtube: artistData.social_media?.youtube?.url,
        tiktok: artistData.social_media?.tiktok?.url,
        facebook: artistData.social_media?.facebook?.url
      }
    };
    console.log('✅ EPK generado para:', artistName);
    return epkData;
  } catch (error) {
    console.error('⚠️ Error generando EPK:', error);
    return null;
  }
}

/**
 * Endpoint para generar un artista aleatorio (requiere autenticación)
 * Versión protegida del endpoint anterior
 * ✨ COMPLETO: Genera 10 canciones tokenizadas, contenido social y EPK automáticamente
 */
router.post("/generate-artist/secure", isAuthenticated, async (req: Request, res: Response) => {
  try {
    console.log('🎵 Recibida solicitud autenticada para generar artista con TODAS las funciones activadas');

    // Obtener ID del usuario autenticado
    const userId = req.user?.uid || req.user?.id;
    console.log(`Solicitud de usuario: ${userId}`);

    // Generar datos del artista aleatorio
    const artistData = await generateRandomArtist();
    console.log('🎨 Artista generado exitosamente:', artistData.name);

    // 🖼️ GENERAR IMÁGENES DEL ARTISTA CON FAL AI NANO BANANA PRO
    console.log('🖼️ Generando imágenes del artista con FAL AI Nano Banana Pro...');
    let profileImageUrl = artistData.look?.profile_url || '';
    let coverImageUrl = artistData.look?.cover_url || '';

    try {
      const { generateArtistImagesWithFAL } = await import('../services/fal-service');
      const artistDescription = artistData.look?.description || `${artistData.name}, professional music artist`;
      const genre = artistData.music_genres?.[0] || 'pop';
      
      const imageResult = await generateArtistImagesWithFAL(artistDescription, artistData.name, genre);
      profileImageUrl = imageResult.profileUrl;
      coverImageUrl = imageResult.coverUrl;
      
      // Actualizar artistData con las imágenes generadas
      if (artistData.look) {
        artistData.look.profile_url = profileImageUrl;
        artistData.look.cover_url = coverImageUrl;
      }
      
      console.log(`✅ Imágenes generadas - Perfil: ${profileImageUrl.substring(0, 60)}...`);
      console.log(`✅ Imágenes generadas - Portada: ${coverImageUrl.substring(0, 60)}...`);
    } catch (imageError) {
      console.error('⚠️ Error generando imágenes, continuando sin ellas:', imageError);
      // Usar placeholders si falla la generación
      profileImageUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(artistData.name)}&size=400&background=random`;
      coverImageUrl = `https://picsum.photos/seed/${artistData.name}/1200/400`;
    }

    // Guardar artista en Firestore, incluyendo referencia al usuario que lo generó
    const artistDataWithUser = {
      ...artistData,
      generatedBy: userId,
      look: {
        ...artistData.look,
        profile_url: profileImageUrl,
        cover_url: coverImageUrl
      }
    };

    const firestoreId = await saveArtistToFirestore(artistDataWithUser);
    console.log(`✅ Artista guardado en Firestore con ID: ${firestoreId}`);

    // Guardar artista en PostgreSQL con referencia al creador
    const postgresId = await saveArtistToPostgreSQL(artistDataWithUser, firestoreId, userId);
    console.log(`✅ Artista guardado en PostgreSQL con ID: ${postgresId}`);

    // Actualizar PostgreSQL con las imágenes
    await pgDb.update(users)
      .set({
        profileImage: profileImageUrl,
        coverImage: coverImageUrl
      })
      .where(eq(users.id, postgresId));

    // Actualizar Firestore con el ID de PostgreSQL
    await db.collection('generated_artists').doc(firestoreId).update({ 
      firestoreId,
      postgresId,
      'look.profile_url': profileImageUrl,
      'look.cover_url': coverImageUrl
    });

    // 🎵 GENERAR 3 CANCIONES TOKENIZADAS CON AUDIO REAL Y VOCES (FAL AI MiniMax Music V2)
    const artistGender = artistData.gender || 'male'; // Obtener género del artista
    console.log(`🎵 Generando canciones tokenizadas con FAL AI MiniMax Music V2 (Voz: ${artistGender})...`);
    // IMPORTANTE: Pasar postgresId como string para que las canciones se encuentren por el perfil del artista
    const tokenIds = await generateTokenizedSongs(
      postgresId, 
      artistData.name, 
      artistData.music_genres?.[0] || 'Pop', 
      String(postgresId), // Usar postgresId para que el cliente encuentre las canciones por userId
      firestoreId,
      artistGender as 'male' | 'female'
    );
    console.log(`✅ ${tokenIds.length} canciones tokenizadas creadas con voces y letras`);

    // �️ GENERAR 6 PRODUCTOS DE MERCHANDISE CON IA
    console.log('🛍️ Generando 6 productos de merchandise con FAL AI...');
    const merchandiseProducts = await generateArtistMerchandise(
      artistData.name,
      profileImageUrl,
      artistData.music_genres?.[0] || 'Pop'
    );
    console.log(`✅ ${merchandiseProducts.length} productos de merchandise generados`);

    // Guardar merchandise en Firestore (documento del artista)
    await db.collection('generated_artists').doc(firestoreId).update({
      merchandise: merchandiseProducts,
      merchandiseGenerated: true,
      merchandiseGeneratedAt: Timestamp.now()
    });

    // ✅ TAMBIÉN guardar cada producto en la colección 'merchandise' para que el frontend los encuentre
    console.log('🛍️ Guardando productos en colección merchandise...');
    for (const product of merchandiseProducts) {
      const merchDoc = {
        name: product.name,
        description: `Official ${artistData.name} merchandise - ${product.type}`,
        price: product.price,
        imageUrl: product.imageUrl,
        category: product.type === 'T-Shirt' || product.type === 'Hoodie' ? 'Apparel' : 
                  product.type === 'Cap' || product.type === 'Sticker Pack' ? 'Accessories' :
                  product.type === 'Poster' ? 'Art' : 'Music',
        sizes: product.type === 'T-Shirt' || product.type === 'Hoodie' ? ['S', 'M', 'L', 'XL', 'XXL'] :
               product.type === 'Cap' ? ['One Size'] :
               product.type === 'Poster' ? ['18x24"', '24x36"'] :
               product.type === 'Vinyl' ? ['12"'] : ['Standard'],
        userId: postgresId, // Usar el ID de PostgreSQL para consistencia
        artistName: artistData.name,
        createdAt: Timestamp.now(),
        generatedByAI: true
      };
      await db.collection('merchandise').add(merchDoc);
    }
    console.log(`✅ ${merchandiseProducts.length} productos guardados en colección merchandise`);

    // 📱 GENERAR CONTENIDO DE REDES SOCIALES AUTOMÁTICAMENTE
    console.log('📱 Generando contenido para redes sociales...');
    const socialContent = await generateArtistSocialContent(postgresId, artistData.name, artistData.biography, artistDataWithUser.slug || generateSlug(artistData.name));

    // 📄 GENERAR EPK AUTOMÁTICO
    console.log('📄 Generando EPK del artista...');
    const epkData = await generateArtistEPK(postgresId, artistData.name, artistData);

    // Devolver respuesta completa con todos los módulos activados
    res.status(200).json({
      success: true,
      message: '✅ Artista creado con TODOS los módulos activados (imágenes + canciones + merchandise + social)',
      artist: {
        ...artistDataWithUser,
        firestoreId,
        postgresId,
        profileImage: profileImageUrl,
        coverImage: coverImageUrl
      },
      images: {
        status: 'generated',
        profileUrl: profileImageUrl,
        coverUrl: coverImageUrl,
        provider: 'fal-nano-banana-pro'
      },
      tokenization: {
        status: 'activated',
        songsCreated: tokenIds.length,
        tokenIds: tokenIds,
        audioGenerated: true,
        provider: 'fal-minimax-music',
        ready_for_metamask_mint: true
      },
      merchandise: {
        status: 'generated',
        productsCreated: merchandiseProducts.length,
        products: merchandiseProducts,
        provider: 'fal-nano-banana-edit'
      },
      socialMedia: {
        status: socialContent.success ? 'generated' : 'pending',
        posts: socialContent.posts || []
      },
      epk: {
        status: epkData ? 'generated' : 'pending',
        data: epkData
      }
    });
  } catch (error) {
    console.error('❌ Error generando artista con módulos completos:', error);
    res.status(500).json({ 
      error: 'Error al generar artista',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para regenerar campos específicos de un artista
 * Tales como suscripción, compras de videos, o cursos
 */
router.post("/regenerate-artist-field", async (req: Request, res: Response) => {
  try {
    console.log('Recibida solicitud para regenerar campo de artista');

    // Obtener campo y ID del artista
    const { field, artistId } = req.body;
    console.log(`Campo a regenerar: ${field}, Artista ID: ${artistId}`);

    // Validar campo
    const validFields = ['subscription', 'videos', 'courses', 'biography', 'look'];
    if (!validFields.includes(field)) {
      return res.status(400).json({ 
        error: 'Campo no válido',
        details: `El campo debe ser uno de: ${validFields.join(', ')}`
      });
    }

    // Si es subscription, videos, o courses, generar datos nuevos
    let updatedData: any = {};

    if (field === 'subscription') {
      // Datos del plan de suscripción
      const SUBSCRIPTION_PLANS = [
        { name: "Basic", price: 59.99 },
        { name: "Pro", price: 99.99 },
        { name: "Enterprise", price: 149.99 }
      ];
      const selectedPlan = SUBSCRIPTION_PLANS[Math.floor(Math.random() * SUBSCRIPTION_PLANS.length)];

      updatedData.subscription = {
        plan: selectedPlan.name,
        price: selectedPlan.price,
        status: ['active', 'trial', 'expired'][Math.floor(Math.random() * 3)],
        startDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
        renewalDate: new Date(Date.now() + Math.random() * 10000000000).toISOString().split('T')[0]
      };
    } 
    else if (field === 'videos') {
      // Datos de videos generados
      const videoPrice = 199;
      const videosGenerated = Math.floor(Math.random() * 5) + 1;
      const totalVideoSpend = videoPrice * videosGenerated;

      // Generar videos
      const videos = [];
      const VIDEO_TYPES = [
        "Visualizador de audio",
        "Video musical completo",
        "Teaser promocional",
        "Lyric video",
        "Behind the scenes"
      ];

      for (let i = 0; i < videosGenerated; i++) {
        const videoId = `VID-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;
        videos.push({
          id: videoId,
          title: `Video Musical ${i+1}`,
          type: VIDEO_TYPES[Math.floor(Math.random() * VIDEO_TYPES.length)],
          duration: `${Math.floor(Math.random() * 4) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
          creationDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
          resolution: ["720p", "1080p", "4K"][Math.floor(Math.random() * 3)],
          price: videoPrice
        });
      }

      // Actualizar datos de compras
      updatedData.purchases = {
        videos: {
          count: videosGenerated,
          totalSpent: totalVideoSpend,
          lastPurchase: new Date(Date.now() - Math.random() * 1000000000).toISOString().split('T')[0],
          videos: videos
        }
      };
    } 
    else if (field === 'courses') {
      // Datos de cursos
      const courseCount = Math.floor(Math.random() * 3) + 1;
      const courses = [];
      let totalSpent = 0;

      const COURSE_TITLES = [
        "Producción Musical Avanzada",
        "Marketing Digital para Músicos",
        "Composición para Bandas Sonoras",
        "Técnicas Vocales Profesionales",
        "Distribución Musical en la Era Digital",
        "Masterización de Audio",
        "Estrategias de Lanzamiento Musical",
        "Armonía y Teoría Musical",
        "Creación de Beats"
      ];

      for (let i = 0; i < courseCount; i++) {
        const price = Math.floor(Math.random() * 150) + 149; // 149-299
        totalSpent += price;
        courses.push({
          id: `CRS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
          title: COURSE_TITLES[Math.floor(Math.random() * COURSE_TITLES.length)],
          price: price,
          purchaseDate: new Date(Date.now() - Math.random() * 10000000000).toISOString().split('T')[0],
          progress: Math.floor(Math.random() * 101),
          completed: Math.random() > 0.6
        });
      }

      // Actualizar datos de compras
      updatedData.purchases = {
        courses: {
          count: courseCount,
          totalSpent: totalSpent,
          lastPurchase: new Date(Date.now() - Math.random() * 1000000000).toISOString().split('T')[0],
          courses: courses
        }
      };
    }

    console.log(`Datos regenerados para el campo ${field}:`, updatedData);

    // Si hay ID de artista en Firestore, actualizar documento
    if (artistId) {
      const docRef = db.collection('generated_artists').doc(artistId);
      await docRef.update({
        ...updatedData,
        updatedAt: Timestamp.now()
      });
      console.log(`Artista actualizado en Firestore con ID: ${artistId}`);
    }

    // Devolver respuesta con datos regenerados
    res.status(200).json({
      success: true,
      field,
      ...updatedData
    });
  } catch (error) {
    console.error('Error regenerando campo de artista:', error);
    res.status(500).json({ 
      error: 'Error al regenerar campo de artista',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para eliminar un artista por ID de PostgreSQL
 */
router.delete("/delete-artist/:pgId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const pgId = parseInt(req.params.pgId);
    const clerkUserId = req.user?.id;
    
    console.log(`🗑️ Recibida solicitud para eliminar artista con PostgreSQL ID: ${pgId}`);

    if (isNaN(pgId)) {
      return res.status(400).json({
        error: 'ID de artista no válido',
        details: 'Se requiere un ID numérico válido'
      });
    }

    if (!clerkUserId) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado' 
      });
    }

    // Primero obtener el PostgreSQL ID del usuario autenticado desde su Clerk ID
    const userRecord = await pgDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (userRecord.length === 0) {
      console.log(`⚠️ Usuario con clerkId ${clerkUserId} no encontrado en PostgreSQL`);
      return res.status(401).json({ 
        error: 'Usuario no encontrado en la base de datos' 
      });
    }

    const pgUserId = userRecord[0].id;
    console.log(`📍 Usuario PostgreSQL ID: ${pgUserId} para Clerk ID: ${clerkUserId}`);

    // 1. Buscar el artista en PostgreSQL
    const [artist] = await pgDb
      .select()
      .from(users)
      .where(eq(users.id, pgId))
      .limit(1);

    if (!artist) {
      return res.status(404).json({
        error: 'Artista no encontrado',
        details: `No se encontró un artista con ID: ${pgId}`
      });
    }

    // 2. Verificar que el usuario tiene permiso para eliminar este artista
    // Puede eliminar si:
    // - Es su propio perfil (artist.id === pgUserId)
    // - Él lo generó (artist.generatedBy === pgUserId)
    // - Es un artista virtual generado por IA (role === 'virtual_artist' o isAIGenerated === true)
    const isOwnProfile = artist.id === pgUserId;
    const isGeneratedByUser = artist.generatedBy === pgUserId;
    const isVirtualArtist = artist.role === 'virtual_artist' || artist.isAIGenerated === true;
    
    // Permitir eliminar si es el propio perfil, lo generó el usuario, o es un artista AI del usuario
    const canDelete = isOwnProfile || isGeneratedByUser || (isVirtualArtist && artist.generatedBy === null);
    
    console.log(`🔐 Verificando permisos: pgUserId=${pgUserId}, artistId=${artist.id}, generatedBy=${artist.generatedBy}, role=${artist.role}, isAIGenerated=${artist.isAIGenerated}`);
    console.log(`🔐 isOwnProfile=${isOwnProfile}, isGeneratedByUser=${isGeneratedByUser}, isVirtualArtist=${isVirtualArtist}, canDelete=${canDelete}`);
    
    if (!canDelete) {
      return res.status(403).json({
        error: 'No autorizado',
        details: 'No tienes permiso para eliminar este artista'
      });
    }

    // 3. Si tiene firestoreId, eliminar también de Firestore
    if (artist.firestoreId) {
      try {
        const artistRef = db.collection('generated_artists').doc(artist.firestoreId);
        const artistDoc = await artistRef.get();
        
        if (artistDoc.exists) {
          await artistRef.delete();
          console.log(`✅ Artista eliminado de Firestore: ${artist.firestoreId}`);
        }
      } catch (firestoreError) {
        console.error('⚠️ Error eliminando de Firestore (continuando):', firestoreError);
        // Continuamos aunque falle Firestore
      }
    }

    // 4. Eliminar de PostgreSQL
    await pgDb
      .delete(users)
      .where(eq(users.id, pgId));

    console.log(`✅ Artista eliminado de PostgreSQL: ${pgId}`);

    res.status(200).json({
      success: true,
      message: `Artista eliminado correctamente`,
      deletedId: pgId
    });
  } catch (error) {
    console.error('❌ Error eliminando artista:', error);
    res.status(500).json({
      error: 'Error al eliminar artista',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint LEGACY para eliminar un artista por firestoreId (mantener para compatibilidad)
 */
router.delete("/delete-artist-firestore/:firestoreId", async (req: Request, res: Response) => {
  try {
    const firestoreId = req.params.firestoreId;
    console.log(`Recibida solicitud para eliminar artista con Firestore ID: ${firestoreId}`);

    if (!firestoreId) {
      return res.status(400).json({
        error: 'ID de artista no proporcionado',
        details: 'Se requiere un ID de artista válido para eliminar'
      });
    }

    // Verificar que el artista existe
    const artistRef = db.collection('generated_artists').doc(firestoreId);
    const artistDoc = await artistRef.get();

    if (!artistDoc.exists) {
      return res.status(404).json({
        error: 'Artista no encontrado',
        details: `No se encontró un artista con ID: ${firestoreId}`
      });
    }

    // Eliminar el artista
    await artistRef.delete();
    console.log(`Artista eliminado con ID: ${firestoreId}`);

    res.status(200).json({
      success: true,
      message: `Artista con ID ${firestoreId} eliminado correctamente`,
      deletedId: firestoreId
    });
  } catch (error) {
    console.error('Error eliminando artista:', error);
    res.status(500).json({
      error: 'Error al eliminar artista',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para eliminar todos los artistas generados
 */
router.delete("/delete-all-artists", async (req: Request, res: Response) => {
  try {
    console.log('Recibida solicitud para eliminar todos los artistas');

    // Obtener todos los documentos en la colección
    const artistsRef = db.collection('generated_artists');
    const snapshot = await artistsRef.get();

    if (snapshot.empty) {
      return res.status(200).json({
        success: true,
        message: 'No hay artistas para eliminar',
        count: 0
      });
    }

    // Eliminar cada documento en un batch
    const batch = db.batch();
    let count = 0;

    snapshot.forEach((doc: DocumentData) => {
      batch.delete(doc.ref);
      count++;
    });

    // Ejecutar el batch
    await batch.commit();
    console.log(`${count} artistas eliminados correctamente`);

    res.status(200).json({
      success: true,
      message: `${count} artistas eliminados correctamente`,
      count
    });
  } catch (error) {
    console.error('Error eliminando todos los artistas:', error);
    res.status(500).json({
      error: 'Error al eliminar todos los artistas',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para regenerar imágenes de artistas existentes sin imágenes
 */
router.post("/regenerate-artist-images", async (req: Request, res: Response) => {
  try {
    const { generateArtistImages } = await import('../../scripts/generate-artist-images');
    
    console.log('🎨 Iniciando regeneración de imágenes...');

    // Obtener artistas AI sin imágenes en Firestore
    const artistsToUpdate = await pgDb.select()
      .from(users)
      .where(eq(users.isAIGenerated, true));

    console.log(`📊 Encontrados ${artistsToUpdate.length} artistas virtuales`);

    let regenerated = 0;
    for (const artist of artistsToUpdate) {
      if (artist.firestoreId) {
        try {
          const firestoreDoc = await db.collection('generated_artists').doc(artist.firestoreId).get();
          
          if (firestoreDoc.exists) {
            const data = firestoreDoc.data();
            
            // Solo regenerar si NO tiene imágenes
            if (!data?.look?.profile_url || !data?.look?.cover_url) {
              console.log(`🔄 Regenerando imágenes para: ${artist.artistName} con FAL AI Nano Banana Pro`);
              
              // Generar imágenes usando la descripción existente
              const artistGenres = artist.genres || ['pop'];
              const genre = Array.isArray(artistGenres) ? artistGenres[0] : artistGenres;
              const imageUrls = await generateArtistImages(
                data.look.description, 
                artist.artistName || 'Unknown Artist',
                genre
              );
              
              // Actualizar Firestore con las nuevas imágenes
              await db.collection('generated_artists').doc(artist.firestoreId).update({
                'look.profile_url': imageUrls.profileUrl,
                'look.cover_url': imageUrls.coverUrl
              });
              
              // Actualizar PostgreSQL
              await pgDb.update(users)
                .set({
                  profileImage: imageUrls.profileUrl,
                  coverImage: imageUrls.coverUrl
                })
                .where(eq(users.id, artist.id));
              
              console.log(`✅ Imágenes regeneradas para: ${artist.artistName}`);
              regenerated++;
            }
          }
        } catch (error) {
          console.error(`❌ Error regenerando imágenes para ${artist.artistName}:`, error);
        }
      }
    }

    res.json({
      success: true,
      message: `Regeneración completada: ${regenerated} artistas actualizados`,
      regenerated
    });
  } catch (error) {
    console.error('Error en regeneración:', error);
    res.status(500).json({
      error: 'Error al regenerar imágenes',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint temporal para sincronizar imágenes de artistas desde Firestore
 */
router.post("/sync-artist-images", async (req: Request, res: Response) => {
  try {
    console.log('🔄 Iniciando sincronización de imágenes de artistas...');

    // Obtener todos los artistas AI sin imágenes
    const artistsWithoutImages = await pgDb.select()
      .from(users)
      .where(eq(users.isAIGenerated, true));

    console.log(`📊 Encontrados ${artistsWithoutImages.length} artistas virtuales`);

    let updated = 0;
    for (const artist of artistsWithoutImages) {
      console.log(`\n🔍 Procesando: ${artist.artistName} (ID: ${artist.id})`);
      console.log(`   firestoreId: ${artist.firestoreId}`);
      
      if (artist.firestoreId) {
        try {
          const firestoreDoc = await db.collection('generated_artists').doc(artist.firestoreId).get();
          console.log(`   Documento existe: ${firestoreDoc.exists}`);
          
          if (firestoreDoc.exists) {
            const data = firestoreDoc.data();
            console.log(`   Estructura look:`, data?.look ? 'SÍ' : 'NO');
            
            const profileImage = data?.look?.profile_url;
            const coverImage = data?.look?.cover_url;
            
            console.log(`   profile_url: ${profileImage ? 'ENCONTRADO' : 'VACÍO'}`);
            console.log(`   cover_url: ${coverImage ? 'ENCONTRADO' : 'VACÍO'}`);

            if (profileImage || coverImage) {
              await pgDb.update(users)
                .set({
                  profileImage: profileImage || artist.profileImage,
                  coverImage: coverImage || artist.coverImage
                })
                .where(eq(users.id, artist.id));

              console.log(`   ✅ ACTUALIZADO`);
              updated++;
            } else {
              console.log(`   ⚠️ No se encontraron URLs de imágenes`);
            }
          } else {
            console.log(`   ❌ Documento no existe en Firestore`);
          }
        } catch (error) {
          console.error(`   ❌ Error:`, error);
        }
      } else {
        console.log(`   ⚠️ Sin firestoreId`);
      }
    }

    res.json({
      success: true,
      message: `Sincronización completada: ${updated} artistas actualizados`,
      updated
    });
  } catch (error) {
    console.error('Error en sincronización:', error);
    res.status(500).json({
      error: 'Error al sincronizar imágenes',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para actualizar el perfil de un artista
 * Actualiza TANTO PostgreSQL COMO Firebase
 * Acepta tanto ID numérico como firestoreId
 */
router.put("/update-artist/:artistId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const artistIdParam = req.params.artistId;
    const clerkUserId = req.user?.id;

    if (!clerkUserId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    // Obtener el PostgreSQL ID del usuario autenticado desde su Clerk ID
    const userRecord = await pgDb
      .select({ id: users.id })
      .from(users)
      .where(eq(users.clerkId, clerkUserId))
      .limit(1);

    if (userRecord.length === 0) {
      console.log(`⚠️ Usuario con clerkId ${clerkUserId} no encontrado en PostgreSQL`);
      return res.status(401).json({ error: 'Usuario no encontrado en la base de datos' });
    }

    const pgUserId = userRecord[0].id;
    console.log(`📝 Actualizando artista ${artistIdParam} por usuario pgId=${pgUserId} (clerkId=${clerkUserId})`);

    const {
      displayName,
      biography,
      genre,
      location,
      profileImage,
      bannerImage,
      bannerPosition,
      loopVideoUrl,
      slug,
      contactEmail,
      contactPhone,
      instagram,
      twitter,
      youtube,
      spotify
    } = req.body;

    // Buscar artista por ID numérico o firestoreId
    let artist;
    const numericId = parseInt(artistIdParam);
    
    if (!isNaN(numericId)) {
      // Es un ID numérico
      [artist] = await pgDb.select().from(users).where(eq(users.id, numericId)).limit(1);
    } else {
      // Es un firestoreId
      [artist] = await pgDb.select().from(users).where(eq(users.firestoreId, artistIdParam)).limit(1);
    }
    
    if (!artist) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }

    // Verificar permisos: debe ser el mismo usuario, un artista generado por él, o un artista virtual
    const isOwnProfile = artist.id === pgUserId;
    const isGeneratedByUser = artist.generatedBy === pgUserId;
    const isVirtualArtist = artist.role === 'virtual_artist' || artist.isAIGenerated === true;
    
    console.log(`🔐 Verificando permisos edición: pgUserId=${pgUserId}, artistId=${artist.id}, generatedBy=${artist.generatedBy}, role=${artist.role}`);
    console.log(`🔐 isOwnProfile=${isOwnProfile}, isGeneratedByUser=${isGeneratedByUser}, isVirtualArtist=${isVirtualArtist}`);
    
    // Permitir editar si es el propio perfil, lo generó el usuario, o es un artista AI
    const canEdit = isOwnProfile || isGeneratedByUser || (isVirtualArtist && artist.generatedBy === null);
    
    if (!canEdit) {
      return res.status(403).json({ error: 'No tienes permiso para editar este artista' });
    }

    // Actualizar PostgreSQL
    await pgDb.update(users)
      .set({
        artistName: displayName,
        biography: biography || null,
        genres: genre ? [genre] : artist.genres,
        location: location || null,
        profileImage: profileImage || null,
        coverImage: bannerImage || null,
        bannerPosition: bannerPosition !== undefined && bannerPosition !== null ? String(bannerPosition) : artist.bannerPosition,
        loopVideoUrl: loopVideoUrl || null,
        slug: slug || artist.slug,
        email: contactEmail || null,
        phone: contactPhone || null,
        instagramHandle: instagram || null,
        twitterHandle: twitter || null,
        youtubeChannel: youtube || null,
        spotifyUrl: spotify || null,
        updatedAt: new Date()
      })
      .where(eq(users.id, artist.id));

    console.log(`✅ PostgreSQL actualizado - Biography: ${biography ? 'SI' : 'NO'}, BannerPos: ${bannerPosition}, LoopVideo: ${loopVideoUrl ? 'SI' : 'NO'}`);

    console.log(`✅ Artista ${artist.id} actualizado en PostgreSQL`);

    // Actualizar Firebase si tiene firestoreId
    if (artist.firestoreId) {
      try {
        const userDocRef = db.collection('users').doc(artist.firestoreId);
        await userDocRef.set({
          uid: artist.firestoreId,
          displayName,
          name: displayName,
          biography: biography || "",
          genre: genre || "",
          location: location || "",
          profileImage: profileImage || "",
          photoURL: profileImage || "",
          bannerImage: bannerImage || "",
          bannerPosition: bannerPosition !== undefined && bannerPosition !== null ? String(bannerPosition) : "50",
          loopVideoUrl: loopVideoUrl || "",
          slug: slug || artist.slug,
          contactEmail: contactEmail || "",
          contactPhone: contactPhone || "",
          instagram: instagram || "",
          twitter: twitter || "",
          youtube: youtube || "",
          spotify: spotify || "",
          updatedAt: new Date()
        }, { merge: true });
        
        console.log(`✅ Artista ${artist.id} actualizado en Firebase`);
      } catch (firebaseError) {
        console.warn(`⚠️ No se pudo actualizar Firebase para artista ${artist.id}:`, firebaseError);
        // No bloqueamos si Firebase falla
      }
    }

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado correctamente'
    });
  } catch (error) {
    console.error('❌ Error actualizando perfil del artista:', error);
    res.status(500).json({ 
      error: 'Error al actualizar perfil',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para generar noticias del artista usando Gemini + Nano Banana
 * Genera 5 noticias con diferentes categorías y contextos relevantes
 */
router.post("/generate-news/:artistId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const artistIdParam = req.params.artistId;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log(`📰 Generando noticias para artista ${artistIdParam}`);

    let artist;
    const numericId = parseInt(artistIdParam);
    
    if (!isNaN(numericId)) {
      [artist] = await pgDb.select().from(users).where(eq(users.id, numericId)).limit(1);
    } else {
      [artist] = await pgDb.select().from(users).where(eq(users.firestoreId, artistIdParam)).limit(1);
    }
    
    if (!artist) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }

    if (artist.id !== userId && artist.generatedBy !== userId) {
      return res.status(403).json({ error: 'No tienes permiso para generar noticias de este artista' });
    }

    const artistName = artist.artistName || artist.firstName || 'Unknown Artist';
    const genre = artist.genres?.[0] || artist.genre || 'music';
    const location = artist.location || artist.country || 'international';
    const biography = artist.biography || 'Emerging artist';

    // Verificar que OpenAI está configurado
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No hay API key de OpenAI configurada');
    }

    const newsCategories = [
      {
        category: "release",
        prompt: `Write a compelling news article about ${artistName}, a ${genre} artist, announcing their latest single or album release. Make it exciting and professional, as if written by a music journalist. Include specific release details and what makes this music special. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`
      },
      {
        category: "performance",
        prompt: `Write a news article about ${artistName}'s upcoming or recent live performance. Describe the venue, the energy, fan reactions, and what made this show memorable. Make it vivid and engaging. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`
      },
      {
        category: "collaboration",
        prompt: `Write a news article about ${artistName} collaborating with other artists or producers in the ${genre} scene. Make it newsworthy and exciting, highlighting the creative synergy. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`
      },
      {
        category: "achievement",
        prompt: `Write a news article celebrating ${artistName}'s recent achievement - could be streaming milestones, chart positions, or industry recognition. Make it celebratory and inspirational. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`
      },
      {
        category: "lifestyle",
        prompt: `Write a lifestyle feature article about ${artistName}'s creative process, inspirations, or behind-the-scenes insights. Make it personal and relatable, showing the human side of the artist. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`
      }
    ];

    console.log(`🤖 Generando ${newsCategories.length} noticias con Gemini...`);
    
    // Descargar imagen del perfil del artista para usar como referencia
    let profileImageBase64: string | null = null;
    if (artist.profileImage) {
      console.log(`📸 Descargando imagen del perfil del artista para usar como referencia...`);
      profileImageBase64 = await downloadImageAsBase64(artist.profileImage);
      if (profileImageBase64) {
        console.log(`✅ Imagen del perfil descargada exitosamente`);
      } else {
        console.warn(`⚠️ No se pudo descargar la imagen del perfil, se generarán imágenes sin referencia`);
      }
    }
    
    const generatedNews = [];

    for (let i = 0; i < newsCategories.length; i++) {
      const { category, prompt } = newsCategories[i];
      
      console.log(`📝 Generando noticia ${i + 1}/${newsCategories.length} (${category}) con OpenAI...`);

      try {
        const textResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a professional music journalist. Always respond with valid JSON in the exact format requested."
            },
            {
              role: "user",
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1024,
        });

        const textContent = textResponse.choices[0]?.message?.content;
        if (!textContent) {
          throw new Error('No se recibió contenido de texto');
        }

        let newsData;
        try {
          const jsonMatch = textContent.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            newsData = JSON.parse(jsonMatch[0]);
          } else {
            newsData = {
              title: `${artistName} - ${category}`,
              content: textContent,
              summary: textContent.substring(0, 150) + '...'
            };
          }
        } catch (parseError) {
          newsData = {
            title: `${artistName} - ${category}`,
            content: textContent,
            summary: textContent.substring(0, 150) + '...'
          };
        }

        console.log(`🎨 Generando imagen para noticia ${i + 1} con FAL AI Nano Banana Pro...`);
        
        const imagePrompt = `Professional press photo for music news article: ${artistName}, ${genre} artist, ${newsData.title}. High-quality, editorial photography style, professional lighting, modern aesthetic. Create a compelling visual that captures the essence of this news story. Photorealistic, magazine-quality image.`;
        
        let imageResult;
        if (profileImageBase64) {
          // Generar con referencia facial del artista usando FAL
          console.log(`👤 Usando imagen del perfil del artista como referencia facial`);
          imageResult = await generateImageWithFaceReferenceFAL(imagePrompt, `data:image/jpeg;base64,${profileImageBase64}`);
        } else {
          // Generar sin referencia usando FAL Nano Banana
          imageResult = await generateImageWithNanoBanana(imagePrompt, { aspectRatio: '16:9' });
        }

        if (!imageResult.success || !imageResult.imageUrl) {
          console.warn(`⚠️ Error generando imagen para noticia ${i + 1}, usando placeholder`);
        }

        const newsItem = {
          userId: artist.id,
          title: newsData.title,
          content: newsData.content,
          summary: newsData.summary,
          imageUrl: imageResult.imageUrl || 'https://via.placeholder.com/800x600/FF6B35/FFFFFF?text=News',
          category: category as "release" | "performance" | "collaboration" | "achievement" | "lifestyle",
          isPublished: true,
          views: 0
        };

        const [insertedNews] = await pgDb.insert(artistNews).values(newsItem).returning();
        generatedNews.push(insertedNews);

        console.log(`✅ Noticia ${i + 1}/${newsCategories.length} generada y guardada`);

        if (i < newsCategories.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

      } catch (error) {
        console.error(`❌ Error generando noticia ${i + 1}:`, error);
      }
    }

    console.log(`✅ ${generatedNews.length} noticias generadas exitosamente`);

    // Enviar notificación al usuario sobre la primera noticia generada
    if (generatedNews.length > 0) {
      try {
        await NotificationTemplates.newsArticleGenerated(
          artist.id,
          generatedNews[0].title,
          generatedNews[0].id
        );
      } catch (notifError) {
        console.error('Error enviando notificación de noticias generadas:', notifError);
      }
    }

    res.status(200).json({
      success: true,
      message: `${generatedNews.length} noticias generadas exitosamente`,
      news: generatedNews,
      count: generatedNews.length
    });

  } catch (error) {
    console.error('❌ Error generando noticias:', error);
    res.status(500).json({ 
      error: 'Error al generar noticias',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para obtener las noticias de un artista
 */
router.get("/news/:artistId", async (req: Request, res: Response) => {
  try {
    const artistIdParam = req.params.artistId;

    console.log(`📰 Obteniendo noticias para artista ${artistIdParam}`);

    let userId: number;
    const numericId = parseInt(artistIdParam);
    
    if (!isNaN(numericId)) {
      userId = numericId;
    } else {
      const [artist] = await pgDb.select().from(users).where(eq(users.firestoreId, artistIdParam)).limit(1);
      if (!artist) {
        return res.status(404).json({ error: 'Artista no encontrado' });
      }
      userId = artist.id;
    }

    const news = await pgDb
      .select()
      .from(artistNews)
      .where(eq(artistNews.userId, userId))
      .orderBy(desc(artistNews.createdAt));

    console.log(`✅ Encontradas ${news.length} noticias para artista ${userId}`);

    res.status(200).json({
      success: true,
      news: news,
      count: news.length
    });

  } catch (error) {
    console.error('❌ Error obteniendo noticias:', error);
    res.status(500).json({ 
      error: 'Error al obtener noticias',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para obtener una noticia individual por ID
 */
router.get("/news-item/:newsId", async (req: Request, res: Response) => {
  try {
    const newsId = parseInt(req.params.newsId);

    if (isNaN(newsId)) {
      return res.status(400).json({ error: 'ID de noticia inválido' });
    }

    console.log(`📰 Obteniendo noticia ${newsId}`);

    // Obtener noticia con información del artista
    const [newsItem] = await pgDb
      .select({
        id: artistNews.id,
        userId: artistNews.userId,
        title: artistNews.title,
        content: artistNews.content,
        summary: artistNews.summary,
        imageUrl: artistNews.imageUrl,
        category: artistNews.category,
        views: artistNews.views,
        createdAt: artistNews.createdAt,
        artistName: users.artistName,
        profileImage: users.profileImage
      })
      .from(artistNews)
      .leftJoin(users, eq(artistNews.userId, users.id))
      .where(eq(artistNews.id, newsId))
      .limit(1);

    if (!newsItem) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }

    // Incrementar contador de vistas
    await pgDb
      .update(artistNews)
      .set({ views: newsItem.views + 1 })
      .where(eq(artistNews.id, newsId));

    console.log(`✅ Noticia ${newsId} encontrada`);

    res.status(200).json({
      success: true,
      ...newsItem,
      views: newsItem.views + 1,
      user: {
        artistName: newsItem.artistName,
        profileImage: newsItem.profileImage
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo noticia:', error);
    res.status(500).json({ 
      error: 'Error al obtener noticia',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para editar una noticia individual
 */
router.patch("/news/:newsId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const newsId = parseInt(req.params.newsId);
    const userId = req.user?.id;
    const { title, content, summary, category } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log(`📝 Editando noticia ${newsId}`);

    // Verificar que la noticia existe y pertenece al usuario
    const [existingNews] = await pgDb
      .select()
      .from(artistNews)
      .where(eq(artistNews.id, newsId))
      .limit(1);

    if (!existingNews) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }

    // Verificar propiedad
    const [artist] = await pgDb
      .select()
      .from(users)
      .where(eq(users.id, existingNews.userId))
      .limit(1);

    if (!artist || (artist.id !== userId && artist.generatedBy !== userId)) {
      return res.status(403).json({ error: 'No tienes permiso para editar esta noticia' });
    }

    // Actualizar noticia
    const updateData: any = {
      updatedAt: new Date()
    };

    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (summary) updateData.summary = summary;
    if (category) updateData.category = category;

    await pgDb
      .update(artistNews)
      .set(updateData)
      .where(eq(artistNews.id, newsId));

    console.log(`✅ Noticia ${newsId} actualizada exitosamente`);

    res.status(200).json({
      success: true,
      message: 'Noticia actualizada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error editando noticia:', error);
    res.status(500).json({ 
      error: 'Error al editar noticia',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para eliminar una noticia individual
 */
router.delete("/news/:newsId", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const newsId = parseInt(req.params.newsId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log(`🗑️ Eliminando noticia ${newsId}`);

    // Verificar que la noticia existe y pertenece al usuario
    const [existingNews] = await pgDb
      .select()
      .from(artistNews)
      .where(eq(artistNews.id, newsId))
      .limit(1);

    if (!existingNews) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }

    // Verificar propiedad
    const [artist] = await pgDb
      .select()
      .from(users)
      .where(eq(users.id, existingNews.userId))
      .limit(1);

    if (!artist || (artist.id !== userId && artist.generatedBy !== userId)) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta noticia' });
    }

    // Eliminar noticia
    await pgDb
      .delete(artistNews)
      .where(eq(artistNews.id, newsId));

    console.log(`✅ Noticia ${newsId} eliminada exitosamente`);

    res.status(200).json({
      success: true,
      message: 'Noticia eliminada exitosamente'
    });

  } catch (error) {
    console.error('❌ Error eliminando noticia:', error);
    res.status(500).json({ 
      error: 'Error al eliminar noticia',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para regenerar una noticia individual con IA
 */
router.post("/news/:newsId/regenerate", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const newsId = parseInt(req.params.newsId);
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log(`🔄 Regenerando noticia ${newsId}`);

    // Verificar que la noticia existe y pertenece al usuario
    const [existingNews] = await pgDb
      .select()
      .from(artistNews)
      .where(eq(artistNews.id, newsId))
      .limit(1);

    if (!existingNews) {
      return res.status(404).json({ error: 'Noticia no encontrada' });
    }

    // Verificar propiedad y obtener datos del artista
    const [artist] = await pgDb
      .select()
      .from(users)
      .where(eq(users.id, existingNews.userId))
      .limit(1);

    if (!artist || (artist.id !== userId && artist.generatedBy !== userId)) {
      return res.status(403).json({ error: 'No tienes permiso para regenerar esta noticia' });
    }

    const artistName = artist.artistName || artist.firstName || 'Unknown Artist';
    const genre = artist.genres?.[0] || artist.genre || 'music';
    const biography = artist.biography || 'Emerging artist';

    // Verificar que OpenAI está configurado
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('No hay API key de OpenAI configurada');
    }

    // Prompts según categoría
    const categoryPrompts: Record<string, string> = {
      release: `Write a compelling news article about ${artistName}, a ${genre} artist, announcing their latest single or album release. Make it exciting and professional, as if written by a music journalist. Include specific release details and what makes this music special. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`,
      performance: `Write a news article about ${artistName}'s upcoming or recent live performance. Describe the venue, the energy, fan reactions, and what made this show memorable. Make it vivid and engaging. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`,
      collaboration: `Write a news article about ${artistName} collaborating with another artist or brand. Describe the partnership, what it means for fans, and what to expect from this collaboration. Make it exciting and newsworthy. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`,
      achievement: `Write a news article about ${artistName} achieving a major milestone (awards, chart success, streaming records, etc). Celebrate their success while maintaining journalistic objectivity. Make it inspiring and compelling. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`,
      lifestyle: `Write a news article about ${artistName}'s lifestyle, creative process, or personal journey as an artist. Give fans insight into who they are beyond the music. Make it personal yet professional. Write in a journalistic style with a catchy headline and 2-3 paragraphs. Format: {"title": "...", "content": "...", "summary": "..."}`
    };

    const prompt = categoryPrompts[existingNews.category] || categoryPrompts.release;

    console.log(`🤖 Generando nuevo contenido con OpenAI para categoría: ${existingNews.category}`);

    // Generar nuevo contenido con OpenAI
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a professional music journalist. Always respond with valid JSON in the exact format requested."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.9,
      max_tokens: 1024
    });

    let newsData;
    try {
      const responseText = response.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error('No se recibió respuesta de OpenAI');
      }
      const cleanedResponse = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      newsData = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Error parseando respuesta de OpenAI:', parseError);
      throw new Error('Error parseando contenido generado');
    }

    // Generar nueva imagen con contexto del artista usando FAL AI
    console.log('🎨 Generando nueva imagen con FAL AI Nano Banana Pro...');
    
    // Descargar imagen del perfil del artista para usar como referencia
    let profileImageBase64: string | null = null;
    if (artist.profileImage) {
      console.log(`📸 Descargando imagen del perfil del artista para usar como referencia...`);
      profileImageBase64 = await downloadImageAsBase64(artist.profileImage);
    }
    
    const imagePrompt = `Professional music journalism photo: ${newsData.title}, ${artistName} ${genre} artist, high quality, cinematic lighting, photorealistic`;
    
    let imageResult;
    if (profileImageBase64) {
      console.log(`👤 Usando imagen del perfil del artista como referencia facial`);
      imageResult = await generateImageWithFaceReferenceFAL(imagePrompt, `data:image/jpeg;base64,${profileImageBase64}`);
    } else {
      imageResult = await generateImageWithNanoBanana(imagePrompt, { aspectRatio: '16:9' });
    }
    
    const newImageUrl = imageResult.success ? imageResult.imageUrl : existingNews.imageUrl;

    // Actualizar noticia
    await pgDb
      .update(artistNews)
      .set({
        title: newsData.title,
        content: newsData.content,
        summary: newsData.summary,
        imageUrl: newImageUrl,
        updatedAt: new Date()
      })
      .where(eq(artistNews.id, newsId));

    console.log(`✅ Noticia ${newsId} regenerada exitosamente`);

    // Obtener noticia actualizada
    const [updatedNews] = await pgDb
      .select()
      .from(artistNews)
      .where(eq(artistNews.id, newsId))
      .limit(1);

    res.status(200).json({
      success: true,
      message: 'Noticia regenerada exitosamente',
      news: updatedNews
    });

  } catch (error) {
    console.error('❌ Error regenerando noticia:', error);
    res.status(500).json({ 
      error: 'Error al regenerar noticia',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;