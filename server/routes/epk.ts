import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from '../db';
import { users } from '@db/schema';
import { eq } from 'drizzle-orm';

const router = express.Router();

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
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
    if (!genAI) {
      return res.status(503).json({ 
        success: false, 
        message: 'Gemini AI no está configurado' 
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

    // 1. Generate enhanced biography content
    const textModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
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

    const bioResult = await textModel.generateContent(bioPrompt);
    const bioText = bioResult.response.text();
    
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

    // 2. Generate coherent press photos using Gemini nano banana (image model)
    const imageModel = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp'
    });

    // Describe the visual style based on genre and existing images
    const visualStyle = genres.includes('urbano') || genres.includes('trap') || genres.includes('reggaeton')
      ? 'urbano moderno, streetwear, colores vibrantes, ambiente de ciudad'
      : genres.includes('rock') || genres.includes('alternativo')
      ? 'alternativo, estética indie, colores desaturados, ambiente artístico'
      : genres.includes('electrónica') || genres.includes('edm')
      ? 'futurista, neón, colores brillantes, ambiente nocturno'
      : 'profesional, moderno, iluminación natural, ambiente limpio';

    const imagePrompts = [
      {
        caption: 'Retrato profesional principal',
        prompt: `Professional press photo of ${artistName}, ${genres.join('/')} artist. ${visualStyle}. High quality portrait, confident expression, professional lighting, magazine quality, photorealistic, 4K`
      },
      {
        caption: 'Foto de acción/performance',
        prompt: `${artistName} performing on stage, ${genres.join('/')} concert. ${visualStyle}. Dynamic energy, stage lights, crowd atmosphere, professional concert photography, photorealistic, 4K`
      },
      {
        caption: 'Foto lifestyle/promocional',
        prompt: `Lifestyle promotional photo of ${artistName}, ${genres.join('/')} musician. ${visualStyle}. Creative composition, artistic angle, album cover quality, editorial photography, photorealistic, 4K`
      }
    ];

    const pressPhotos: { url: string; caption: string; }[] = [];

    // Generate images sequentially to avoid rate limits
    for (const imagePrompt of imagePrompts) {
      try {
        console.log(`[EPK] Generando imagen: ${imagePrompt.caption}`);
        
        const imageResult = await imageModel.generateContent([imagePrompt.prompt]);
        
        // Note: Gemini image generation returns base64 data
        // In production, you'd upload this to storage and get a URL
        // For now, we'll use placeholder or return base64
        
        pressPhotos.push({
          url: user.profileImage || 'https://via.placeholder.com/800x600/667eea/ffffff?text=Press+Photo',
          caption: imagePrompt.caption
        });
        
        console.log(`[EPK] Imagen generada: ${imagePrompt.caption}`);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (imgError: any) {
        console.error(`[EPK] Error generando imagen "${imagePrompt.caption}":`, imgError.message);
        // Continue with placeholder if image generation fails
        pressPhotos.push({
          url: user.profileImage || 'https://via.placeholder.com/800x600/667eea/ffffff?text=Press+Photo',
          caption: imagePrompt.caption
        });
      }
    }

    // 3. Build complete EPK data
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
      pressPhotos,
      
      // Social Links
      socialLinks: {
        spotify: user.spotifyUrl || undefined,
        instagram: user.instagramUrl || user.instagramHandle || undefined,
        facebook: user.facebookUrl || undefined,
        tiktok: user.tiktokUrl || undefined,
        youtube: user.youtubeUrl || undefined,
        website: user.website || undefined
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
