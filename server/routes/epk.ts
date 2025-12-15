import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import OpenAI from 'openai';
import { db } from '../db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';
import { generateImageWithNanoBanana } from '../services/fal-service';

const router = express.Router();

// Initialize OpenAI
const openai = process.env.OPENAI_API_KEY 
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

interface EPKData {
  // Basic Info
  artistName: string;
  realName?: string;
  genre: string[];
  location?: string;
  
  // Bio & Content
  biography: string;
  artistQuote?: string;
  achievements: string[];
  factSheet: {
    label: string;
    value: string;
  }[];
  
  // Images
  profileImage?: string;
  coverImage?: string;
  referenceImage?: string;
  pressPhotos: {
    url: string;
    caption: string;
  }[];
  
  // Links
  socialLinks: {
    spotify?: string;
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    youtube?: string;
    website?: string;
  };
  
  // Boostify Links
  boostifyLinks?: {
    profile?: string;
    mainSong?: {
      name: string;
      url: string;
    };
    mainVideo?: {
      title: string;
      url: string;
    };
  };
  
  // Generated content
  pressRelease?: string;
  oneLineBio?: string;
  shortBio?: string;
}

/**
 * POST /api/epk/generate
 * Genera un EPK profesional completo usando Gemini AI con imágenes coherentes (nano banana)
 */
router.post('/generate', authenticate, async (req: Request, res: Response) => {
  try {
    if (!openai) {
      return res.status(503).json({ 
        success: false, 
        message: 'OpenAI no está configurado' 
      });
    }

    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autorizado' 
      });
    }

    // Get user data from database
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Prepare artist data
    const artistName = user.artistName || user.email?.split('@')[0] || 'Artista';
    const biography = user.biography || user.bio || '';
    const genres = user.genres || [];
    const location = user.location || '';
    
    console.log(`[EPK] Generando EPK para: ${artistName}`);

    // 1. Generate enhanced biography content with OpenAI GPT-4o
    const bioPrompt = `Eres un experto en crear EPKs (Electronic Press Kits) profesionales para artistas musicales.

Información del artista:
- Nombre artístico: ${artistName}
${user.realName ? `- Nombre real: ${user.realName}` : ''}
- Género(s): ${genres.join(', ') || 'música urbana'}
${location ? `- Ubicación: ${location}` : ''}
${biography ? `- Biografía actual: ${biography}` : ''}

Genera un objeto JSON con el siguiente formato (SOLO devuelve JSON válido, sin texto adicional):

{
  "oneLineBio": "Una frase impactante de máximo 20 palabras que capture la esencia del artista",
  "shortBio": "Biografía corta de 2-3 frases (50-80 palabras) perfecta para redes sociales y programas",
  "pressRelease": "Biografía profesional completa de 3-4 párrafos (200-300 palabras) estilo press release que cuente la historia del artista, su sonido único, logros e influencias",
  "artistQuote": "Una cita inspiradora del artista en primera persona sobre su música o visión artística",
  "achievements": [
    "Logro destacado 1",
    "Logro destacado 2",
    "Logro destacado 3"
  ],
  "factSheet": [
    {"label": "Género", "value": "${genres.join(', ') || 'Música Urbana'}"},
    {"label": "Origen", "value": "${location || 'Internacional'}"},
    {"label": "Años activo", "value": "2020-presente"},
    {"label": "Sello", "value": "Independiente"}
  ]
}

Importante:
- Sé creativo pero realista
- Usa lenguaje profesional de la industria musical
- Genera contenido coherente con el género musical
- Si no hay biografía, crea una narrativa convincente basada en el género
- Los logros deben ser creíbles para un artista emergente/independiente`;

    const bioResult = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Eres un experto en crear EPKs profesionales para artistas musicales. Responde SOLO con JSON válido.' },
        { role: 'user', content: bioPrompt }
      ],
      temperature: 0.7,
      response_format: { type: 'json_object' }
    });
    
    const bioText = bioResult.choices[0]?.message?.content || '{}';
    
    // Extract JSON from response (remove markdown code blocks if present)
    let generatedContent;
    try {
      const jsonMatch = bioText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        generatedContent = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('[EPK] Error parsing JSON:', parseError);
      console.log('[EPK] Raw response:', bioText);
      throw new Error('Error al procesar la respuesta de IA');
    }

    console.log('[EPK] Contenido textual generado');

    // 2. Get artist data from Firestore for reference image and links
    let referenceImageUrl: string | undefined;
    let artistSlug: string | undefined;
    let mainSong: { name: string; url: string } | undefined;
    let mainVideo: { title: string; url: string } | undefined;

    try {
      const { getFirestore, collection: fsCollection, query: fsQuery, where: fsWhere, getDocs: fsGetDocs, limit: fsLimit } = await import('firebase-admin/firestore');
      const admin = await import('firebase-admin');
      
      // Initialize Firebase Admin if not already initialized
      if (!admin.default.apps.length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT || '{}');
        admin.default.initializeApp({
          credential: admin.default.credential.cert(serviceAccount)
        });
      }

      const firestore = getFirestore();
      
      // Get artist Firestore data
      const usersRef = fsCollection(firestore, 'users');
      const q = fsQuery(usersRef, fsWhere('uid', '==', String(userId)), fsLimit(1));
      const snapshot = await fsGetDocs(q);
      
      if (!snapshot.empty) {
        const artistData = snapshot.docs[0].data();
        referenceImageUrl = artistData.referenceImage;
        artistSlug = artistData.slug;
        console.log(`[EPK] Imagen de referencia encontrada: ${referenceImageUrl ? 'Sí' : 'No'}`);
        console.log(`[EPK] Slug del artista: ${artistSlug}`);
      }

      // Get main song
      const songsRef = fsCollection(firestore, 'songs');
      const songsQ = fsQuery(songsRef, fsWhere('userId', '==', String(userId)), fsLimit(1));
      const songsSnapshot = await fsGetDocs(songsQ);
      
      if (!songsSnapshot.empty) {
        const songData = songsSnapshot.docs[0].data();
        mainSong = {
          name: songData.name || 'Canción Principal',
          url: songData.audioUrl || ''
        };
        console.log(`[EPK] Canción principal: ${mainSong.name}`);
      }

      // Get main video
      const videosRef = fsCollection(firestore, 'videos');
      const videosQ = fsQuery(videosRef, fsWhere('userId', '==', String(userId)), fsLimit(1));
      const videosSnapshot = await fsGetDocs(videosQ);
      
      if (!videosSnapshot.empty) {
        const videoData = videosSnapshot.docs[0].data();
        mainVideo = {
          title: videoData.title || 'Video Principal',
          url: videoData.url || ''
        };
        console.log(`[EPK] Video principal: ${mainVideo.title}`);
      }
    } catch (firestoreError) {
      console.error('[EPK] Error obteniendo datos de Firestore:', firestoreError);
    }

    // 3. Generate professional press photos using Gemini (nano banana) as first option
    const pressPhotos: { url: string; caption: string; }[] = [];

    // Describe the visual style based on genre
    const genreStyles: Record<string, string> = {
      'urbano': 'urban modern style, streetwear fashion, vibrant colors, city environment, confident pose, professional street photography',
      'trap': 'trap artist aesthetic, designer clothing, luxury accessories, dramatic lighting, moody atmosphere, high-end photography',
      'reggaeton': 'reggaeton star style, tropical vibes, colorful setting, energetic pose, Latin music industry standard',
      'rock': 'rock musician aesthetic, edgy style, leather jacket, artistic composition, concert venue, professional music photography',
      'alternativo': 'alternative artist look, indie aesthetic, creative lighting, artistic background, editorial style photography',
      'pop': 'pop star glamour, fashion-forward styling, bright lighting, clean background, commercial photography quality',
      'electrónica': 'electronic music artist, futuristic aesthetic, neon lights, modern technology vibe, club atmosphere',
      'hip hop': 'hip hop artist style, urban fashion, street credibility, professional rap photography, authentic vibe',
      'latin soul': 'Latin soul artist, sophisticated style, warm tones, elegant setting, professional portrait photography'
    };

    const mainGenre = genres[0]?.toLowerCase() || 'urbano';
    const visualStyle = genreStyles[mainGenre] || 'professional musician portrait, modern aesthetic, high-quality photography, magazine cover worthy';

    const imagePrompts = [
      {
        caption: 'Hero Portrait - Retrato Principal para Press Kit',
        description: 'Professional press kit hero image, high-resolution portrait',
        prompt: `Professional EPK hero portrait photography of ${artistName}, ${visualStyle}, high-end fashion magazine quality, dramatic professional lighting, sharp focus, confident expression, music industry standard, editorial photography, photorealistic, award-winning portrait`
      },
      {
        caption: 'Performance Shot - Foto en Acción',
        description: 'Dynamic performance or stage photo',
        prompt: `${artistName} as ${mainGenre} artist performing on professional stage, ${visualStyle}, dynamic energy, professional concert photography, dramatic stage lighting, crowd atmosphere, music festival quality, photojournalism style, action shot, photorealistic`
      },
      {
        caption: 'Creative Editorial - Sesión Artística',
        description: 'Artistic promotional photo for magazines',
        prompt: `Creative editorial photo session of ${artistName}, ${visualStyle}, artistic composition, unique angle, album cover quality, fashion photography meets music industry, creative lighting setup, professional art direction, magazine spread worthy, photorealistic`
      }
    ];

    console.log('[EPK] 🍌 Generando imágenes profesionales con FAL nano-banana');

    // Use FAL nano-banana for image generation
    for (const imagePrompt of imagePrompts) {
      try {
        console.log(`[EPK] 🖼️ Generando imagen con FAL nano-banana: ${imagePrompt.caption}`);
        
        // Generate image with FAL nano-banana service
        const imageResult = await generateImageWithNanoBanana(imagePrompt.prompt, {
          aspectRatio: '16:9', // Landscape format for press photos
          numImages: 1,
          outputFormat: 'png'
        });

        if (imageResult.success && imageResult.imageUrl) {
          console.log(`[EPK] ✅ Imagen generada por FAL nano-banana: ${imagePrompt.caption}`);
          pressPhotos.push({
            url: imageResult.imageUrl,
            caption: imagePrompt.caption
          });
        } else {
          throw new Error(imageResult.error || 'FAL nano-banana no devolvió imagen');
        }
        
        // Delay to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (imgError: any) {
        console.error(`[EPK] ❌ Error generando con FAL nano-banana "${imagePrompt.caption}":`, imgError.message);
        // Use reference image or profile image as fallback
        pressPhotos.push({
          url: referenceImageUrl || user.profileImage || user.coverImage || 'https://via.placeholder.com/1920x1080/667eea/ffffff?text=Press+Photo',
          caption: imagePrompt.caption
        });
      }
    }

    // 4. Build complete EPK data with all links
    const baseUrl = process.env.NODE_ENV === 'production' 
      ? 'https://boostify.com' 
      : 'https://ecb7959a-10a2-43c2-b3de-f9c2a2fb7282-00-5xhhuxyy3b9j.kirk.replit.dev';

    const epkData: EPKData = {
      // Basic Info
      artistName,
      realName: user.realName || undefined,
      genre: genres,
      location: location || undefined,
      
      // Generated Content
      biography: generatedContent.pressRelease,
      oneLineBio: generatedContent.oneLineBio,
      shortBio: generatedContent.shortBio,
      artistQuote: generatedContent.artistQuote,
      achievements: generatedContent.achievements || [],
      factSheet: generatedContent.factSheet || [],
      pressRelease: generatedContent.pressRelease,
      
      // Images
      profileImage: user.profileImage || user.profileImageUrl || undefined,
      coverImage: user.coverImage || undefined,
      referenceImage: referenceImageUrl,
      pressPhotos,
      
      // Social Links
      socialLinks: {
        spotify: user.spotifyUrl || undefined,
        instagram: user.instagramUrl || user.instagramHandle || undefined,
        facebook: user.facebookUrl || undefined,
        tiktok: user.tiktokUrl || undefined,
        youtube: user.youtubeUrl || undefined,
        website: user.website || undefined
      },

      // Boostify Links
      boostifyLinks: {
        profile: artistSlug ? `${baseUrl}/artist/${artistSlug}` : undefined,
        mainSong: mainSong,
        mainVideo: mainVideo
      }
    };

    console.log('[EPK] EPK completo generado exitosamente');

    res.json({
      success: true,
      epk: epkData
    });

  } catch (error: any) {
    console.error('[EPK GENERATION ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al generar EPK' 
    });
  }
});

/**
 * GET /api/epk/preview/:userId
 * Obtiene una vista previa del EPK del usuario (público)
 */
router.get('/preview/:userId', async (req: Request, res: Response) => {
  try {
    const userId = parseInt(req.params.userId);

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    // Return basic EPK structure (without AI generation)
    const basicEPK: Partial<EPKData> = {
      artistName: user.artistName || user.email?.split('@')[0] || 'Artista',
      realName: user.realName || undefined,
      genre: user.genres || [],
      location: user.location || undefined,
      biography: user.biography || user.bio || '',
      profileImage: user.profileImage || user.profileImageUrl || undefined,
      coverImage: user.coverImage || undefined,
      socialLinks: {
        spotify: user.spotifyUrl || undefined,
        instagram: user.instagramUrl || user.instagramHandle || undefined,
        facebook: user.facebookUrl || undefined,
        tiktok: user.tiktokUrl || undefined,
        youtube: user.youtubeUrl || undefined,
        website: user.website || undefined
      }
    };

    res.json({
      success: true,
      epk: basicEPK
    });

  } catch (error: any) {
    console.error('[EPK PREVIEW ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error al obtener vista previa del EPK' 
    });
  }
});

export default router;
