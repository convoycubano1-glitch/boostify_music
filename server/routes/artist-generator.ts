/**
 * Rutas para la generación de artistas aleatorios
 */
import { Router, Request, Response } from 'express';
import { isAuthenticated } from '../replitAuth';
import { generateRandomArtist } from '../../scripts/generate-random-artist';
import { db } from '../firebase';
import { Timestamp, DocumentData } from 'firebase-admin/firestore';
import { db as pgDb } from '../../db';
import { users, artistNews } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { generateCinematicImage } from '../services/gemini-image-service';
import { GoogleGenAI } from "@google/genai";

const router = Router();

/**
 * Endpoint para obtener todos los artistas de un usuario
 * Incluye: su propio perfil + artistas generados con IA
 */
router.get("/my-artists", isAuthenticated, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Usuario no autenticado' 
      });
    }

    console.log(`🎨 Obteniendo todos los artistas del usuario ${userId}`);

    // Obtener artistas de PostgreSQL
    // 1. Su propio perfil (id = userId AND role = 'artist')
    // 2. Artistas generados por IA (generatedBy = userId)
    const { or } = await import('drizzle-orm');
    
    const artistsFromPg = await pgDb
      .select()
      .from(users)
      .where(
        or(
          eq(users.id, userId),          // Su propio perfil
          eq(users.generatedBy, userId)   // Artistas generados por IA
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
 * Endpoint para generar un artista aleatorio (requiere autenticación)
 * Versión protegida del endpoint anterior
 */
router.post("/generate-artist/secure", isAuthenticated, async (req: Request, res: Response) => {
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
              console.log(`🔄 Regenerando imágenes para: ${artist.artistName}`);
              
              // Generar imágenes usando la descripción existente
              const imageUrls = await generateArtistImages(data.look.description);
              
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
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Usuario no autenticado' });
    }

    console.log(`📝 Actualizando artista ${artistIdParam} por usuario ${userId}`);

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

    // Verificar permisos: debe ser el mismo usuario o un artista generado por él
    if (artist.id !== userId && artist.generatedBy !== userId) {
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

    const apiKeys = [
      process.env.GEMINI_API_KEY,
      process.env.GEMINI_API_KEY2
    ].filter(key => key && key.length > 0);

    if (apiKeys.length === 0) {
      throw new Error('No hay API keys de Gemini configuradas');
    }

    const geminiClient = new GoogleGenAI({ apiKey: apiKeys[0] || "" });

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
    
    const generatedNews = [];

    for (let i = 0; i < newsCategories.length; i++) {
      const { category, prompt } = newsCategories[i];
      
      console.log(`📝 Generando noticia ${i + 1}/${newsCategories.length} (${category})...`);

      try {
        const textResponse = await geminiClient.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          config: {
            temperature: 0.8,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        });

        const textContent = textResponse.candidates?.[0]?.content?.parts?.[0]?.text;
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

        console.log(`🎨 Generando imagen para noticia ${i + 1} con Nano Banana...`);
        
        const imagePrompt = `Professional press photo for music news article: ${artistName}, ${genre} artist, ${newsData.title}. High-quality, editorial photography style, professional lighting, modern aesthetic. Create a compelling visual that captures the essence of this news story. Photorealistic, magazine-quality image.`;
        
        const imageResult = await generateCinematicImage(imagePrompt);

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

export default router;