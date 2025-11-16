/**
 * Rutas para la generación de artistas aleatorios
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { generateRandomArtist } from '../../scripts/generate-random-artist';
import { db } from '../firebase';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';
import { db as pgDb } from '../../db';
import { users } from '../../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

/**
 * Endpoint para obtener todos los artistas creados por un usuario
 */
router.get("/my-artists", authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado' 
      });
    }

    console.log(`🎨 Obteniendo artistas creados por usuario ${userId}`);

    // Obtener artistas de PostgreSQL
    const artistsFromPg = await pgDb
      .select()
      .from(users)
      .where(eq(users.generatedBy, userId));

    console.log(`✅ Encontrados ${artistsFromPg.length} artistas en PostgreSQL`);

    // Formatear respuesta
    const formattedArtists = artistsFromPg.map(artist => ({
      id: artist.id,
      firestoreId: artist.firestoreId,
      name: artist.artistName,
      slug: artist.slug,
      biography: artist.biography,
      profileImage: artist.profileImage,
      coverImage: artist.coverImage,
      genres: artist.genres,
      country: artist.country,
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
async function saveArtistToPostgreSQL(artistData: any, firestoreId: string, userId?: string): Promise<number> {
  try {
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
      profileImage: artistData.profileImage || null,
      coverImage: artistData.coverImage || null,
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
      generatedBy: userId ? parseInt(userId) : null,
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

    // Guardar artista en Firestore
    const firestoreId = await saveArtistToFirestore(artistData);
    console.log(`Artista guardado en Firestore con ID: ${firestoreId}`);

    // NUEVO: Guardar artista en PostgreSQL
    const postgresId = await saveArtistToPostgreSQL(artistData, firestoreId);
    console.log(`Artista guardado en PostgreSQL con ID: ${postgresId}`);

    // Actualizar Firestore con el ID de PostgreSQL
    await db.collection('generated_artists').doc(firestoreId).update({ 
      firestoreId,
      postgresId
    });

    // Añadir los IDs al objeto de artista
    const completeArtistData = {
      ...artistData,
      firestoreId,
      postgresId
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
 * Endpoint para generar un artista aleatorio (requiere autenticación)
 * Versión protegida del endpoint anterior
 */
router.post("/generate-artist/secure", authenticate, async (req: Request, res: Response) => {
  try {
    console.log('Recibida solicitud autenticada para generar artista aleatorio');

    // Obtener ID del usuario autenticado
    const userId = req.user?.uid || req.user?.id;
    console.log(`Solicitud de usuario: ${userId}`);

    // Generar datos del artista aleatorio
    const artistData = await generateRandomArtist();
    console.log('Artista generado exitosamente:', artistData.name);

    // Guardar artista en Firestore, incluyendo referencia al usuario que lo generó
    const artistDataWithUser = {
      ...artistData,
      generatedBy: userId
    };

    const firestoreId = await saveArtistToFirestore(artistDataWithUser);
    console.log(`Artista guardado en Firestore con ID: ${firestoreId}`);

    // NUEVO: Guardar artista en PostgreSQL con referencia al creador
    const postgresId = await saveArtistToPostgreSQL(artistDataWithUser, firestoreId, userId);
    console.log(`Artista guardado en PostgreSQL con ID: ${postgresId}`);

    // Actualizar Firestore con el ID de PostgreSQL
    await db.collection('generated_artists').doc(firestoreId).update({ 
      firestoreId,
      postgresId
    });

    // Devolver respuesta con datos del artista y ambos IDs
    res.status(200).json({
      ...artistDataWithUser,
      firestoreId,
      postgresId
    });
  } catch (error) {
    console.error('Error generando artista aleatorio (ruta segura):', error);
    res.status(500).json({ 
      error: 'Error al generar artista aleatorio',
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
 * Endpoint para eliminar un artista
 */
router.delete("/delete-artist/:id", async (req: Request, res: Response) => {
  try {
    const artistId = req.params.id;
    console.log(`Recibida solicitud para eliminar artista con ID: ${artistId}`);

    if (!artistId) {
      return res.status(400).json({
        error: 'ID de artista no proporcionado',
        details: 'Se requiere un ID de artista válido para eliminar'
      });
    }

    // Verificar que el artista existe
    const artistRef = db.collection('generated_artists').doc(artistId);
    const artistDoc = await artistRef.get();

    if (!artistDoc.exists) {
      return res.status(404).json({
        error: 'Artista no encontrado',
        details: `No se encontró un artista con ID: ${artistId}`
      });
    }

    // Eliminar el artista
    await artistRef.delete();
    console.log(`Artista eliminado con ID: ${artistId}`);

    res.status(200).json({
      success: true,
      message: `Artista con ID ${artistId} eliminado correctamente`,
      deletedId: artistId
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

    snapshot.forEach((doc) => {
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

export default router;