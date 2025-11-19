import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { GoogleGenerativeAI } from '@google/generative-ai';

const router = express.Router();

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY 
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

/**
 * POST /api/pr-ai/generate-pitch
 * Genera un mensaje pitch profesional usando Gemini AI
 */
router.post('/generate-pitch', authenticate, async (req: Request, res: Response) => {
  try {
    if (!genAI) {
      return res.status(503).json({ 
        success: false, 
        message: 'Gemini AI no está configurado' 
      });
    }

    const { artistName, contentType, contentTitle, genre, biography } = req.body;

    if (!artistName || !contentType || !contentTitle) {
      return res.status(400).json({ 
        success: false, 
        message: 'Faltan campos requeridos' 
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Eres un experto en relaciones públicas para la industria musical.

Genera un mensaje pitch profesional y atractivo de 2-3 frases para contactar medios de comunicación (radios, podcasts, TV, blogs).

Información del artista:
- Nombre: ${artistName}
- Tipo de contenido: ${contentType}
- Título: ${contentTitle}
- Género: ${genre || 'música urbana'}
${biography ? `- Biografía: ${biography.substring(0, 200)}` : ''}

El pitch debe:
1. Ser conciso y directo (2-3 frases máximo)
2. Destacar lo único o interesante del lanzamiento
3. Generar interés inmediato
4. Ser profesional pero cercano
5. Incluir que está disponible ahora en plataformas

NO uses lenguaje demasiado florido o exagerado.
NO incluyas saludos ni despedidas.
Solo el pitch en sí.`;

    const result = await model.generateContent(prompt);
    const generatedText = result.response.text();

    res.json({
      success: true,
      pitch: generatedText.trim()
    });

  } catch (error: any) {
    console.error('[PR AI GENERATE PITCH ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al generar pitch' 
    });
  }
});

/**
 * POST /api/pr-ai/improve-text
 * Mejora cualquier texto usando Gemini AI
 */
router.post('/improve-text', authenticate, async (req: Request, res: Response) => {
  try {
    if (!genAI) {
      return res.status(503).json({ 
        success: false, 
        message: 'Gemini AI no está configurado' 
      });
    }

    const { text, context } = req.body;

    if (!text) {
      return res.status(400).json({ 
        success: false, 
        message: 'Texto requerido' 
      });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Mejora el siguiente texto para que sea más profesional, conciso y efectivo para ${context || 'comunicación con medios'}:

Texto original:
"${text}"

Instrucciones:
1. Mantén el mensaje principal
2. Hazlo más profesional y pulido
3. Elimina redundancias
4. Mejora la claridad
5. Máximo 3 frases

Solo devuelve el texto mejorado, sin explicaciones.`;

    const result = await model.generateContent(prompt);
    const improvedText = result.response.text();

    res.json({
      success: true,
      improvedText: improvedText.trim()
    });

  } catch (error: any) {
    console.error('[PR AI IMPROVE TEXT ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al mejorar texto' 
    });
  }
});

/**
 * POST /api/pr-ai/generate-press-photo
 * Genera una imagen profesional para PR usando FAL AI
 */
router.post('/generate-press-photo', authenticate, async (req: Request, res: Response) => {
  try {
    const FAL_KEY = process.env.FAL_KEY;
    if (!FAL_KEY) {
      return res.status(503).json({ 
        success: false, 
        message: 'FAL AI no está configurado' 
      });
    }

    const { artistName, genre, style, profileImageUrl } = req.body;

    if (!artistName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nombre de artista requerido' 
      });
    }

    // Generar prompt basado en el perfil del artista
    const imagePrompt = `Professional press photo for ${genre || 'music'} artist ${artistName}, ${style || 'studio photography'}, high-quality, professional lighting, music industry standard, cinematic, editorial style, 4K resolution`;

    // Llamar a FAL AI para generar la imagen
    const response = await fetch('https://fal.run/fal-ai/flux/schnell', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        image_size: 'landscape_16_9',
        num_inference_steps: 4,
        num_images: 1,
        enable_safety_checker: true
      })
    });

    if (!response.ok) {
      throw new Error(`FAL API error: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.images && data.images.length > 0) {
      res.json({
        success: true,
        imageUrl: data.images[0].url,
        prompt: imagePrompt
      });
    } else {
      throw new Error('No se generó ninguna imagen');
    }

  } catch (error: any) {
    console.error('[PR AI GENERATE PHOTO ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al generar imagen' 
    });
  }
});

/**
 * POST /api/pr-ai/suggest-campaign-title
 * Sugiere un título creativo para la campaña
 */
router.post('/suggest-campaign-title', authenticate, async (req: Request, res: Response) => {
  try {
    if (!genAI) {
      return res.status(503).json({ 
        success: false, 
        message: 'Gemini AI no está configurado' 
      });
    }

    const { artistName, contentType, contentTitle } = req.body;

    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `Sugiere 3 títulos creativos y profesionales para una campaña de PR.

Información:
- Artista: ${artistName}
- Tipo: ${contentType}
- Contenido: ${contentTitle}

Los títulos deben:
1. Ser descriptivos pero creativos
2. Incluir el tipo de contenido
3. Ser memorables
4. Máximo 60 caracteres

Formato: devuelve solo 3 títulos, uno por línea, sin numeración ni explicaciones.`;

    const result = await model.generateContent(prompt);
    const suggestions = result.response.text().trim().split('\n').filter(s => s.trim());

    res.json({
      success: true,
      suggestions: suggestions.slice(0, 3)
    });

  } catch (error: any) {
    console.error('[PR AI SUGGEST TITLE ERROR]', error);
    res.status(500).json({ 
      success: false, 
      message: error.message || 'Error al sugerir títulos' 
    });
  }
});

export default router;
