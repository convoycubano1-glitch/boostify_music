/**
 * Fashion Studio API Routes
 * 
 * Endpoints para Artist Fashion Studio:
 * - Sessions management
 * - Fashion analysis con Gemini
 * - Results storage
 * - Portfolio management
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  fashionSessions, 
  fashionResults,
  fashionAnalysis,
  fashionPortfolio,
  productTryOnHistory,
  fashionVideos,
  merchandise
} from '../../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import * as fal from '@fal-ai/serverless-client';

const router = Router();

// Configurar FAL
fal.config({
  credentials: process.env.FAL_KEY
});

// ============================================
// FASHION SESSIONS
// ============================================

// Crear sesión de moda
router.post('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userId = user.uid || user.id;
    if (!userId) {
      return res.status(401).json({ error: 'User ID not found' });
    }

    const { sessionType, metadata } = req.body;

    const [session] = await db.insert(fashionSessions).values({
      userId: userId.toString(),
      sessionType,
      metadata,
      status: 'active'
    }).returning();

    res.json({ success: true, session });
  } catch (error: any) {
    console.error('Error creando sesión:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener sesiones del usuario
router.get('/sessions', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userId = user.uid || user.id;
    const sessions = await db
      .select()
      .from(fashionSessions)
      .where(eq(fashionSessions.userId, userId.toString()))
      .orderBy(desc(fashionSessions.createdAt))
      .limit(20);

    res.json({ success: true, sessions });
  } catch (error: any) {
    console.error('Error obteniendo sesiones:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FAL VIRTUAL TRY-ON
// ============================================

router.post('/tryon', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userId = user.uid || user.id;
    const { modelImage, clothingImage, sessionId, merchandiseId } = req.body;

    console.log('🎨 Iniciando Virtual Try-On con FAL...');

    const result: any = await fal.subscribe("fal-ai/idm-vton", {
      input: {
        human_image_url: modelImage,
        garment_image_url: clothingImage,
        category: 'tops',
        auto_mask: true,
        auto_crop: true,
      },
      logs: true,
    });

    if (result.image && result.image.url) {
      // Guardar resultado en DB
      const [fashionResult] = await db.insert(fashionResults).values({
        sessionId: sessionId || null,
        userId: userId.toString(),
        resultType: 'tryon',
        imageUrl: result.image.url,
        metadata: {
          modelImage,
          clothingImage,
          falModel: 'fal-ai/idm-vton'
        }
      }).returning();

      // Si está asociado a un producto, guardar en historial
      if (merchandiseId) {
        await db.insert(productTryOnHistory).values({
          userId: userId.toString(),
          merchandiseId,
          modelImage,
          resultImage: result.image.url,
          falModel: 'fal-ai/idm-vton'
        });
      }

      res.json({
        success: true,
        imageUrl: result.image.url,
        resultId: fashionResult.id
      });
    } else {
      res.status(500).json({ error: 'No se generó imagen' });
    }

  } catch (error: any) {
    console.error('Error en try-on:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FASHION VIDEO CON KLING
// ============================================

router.post('/generate-video', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userId = user.uid || user.id;
    const { imageUrl, prompt, sessionId, duration = 5, aspectRatio = '16:9' } = req.body;

    console.log('🎬 Generando video fashion con Kling...');

    // Crear registro de video en DB (estado: processing)
    const [video] = await db.insert(fashionVideos).values({
      userId: userId.toString(),
      sessionId: sessionId || null,
      videoUrl: '', // Se actualizará cuando termine
      prompt,
      modelImage: imageUrl,
      duration,
      status: 'processing',
      metadata: {
        falModel: 'fal-ai/kling-video',
        aspectRatio
      }
    }).returning();

    // Generar video asíncronamente
    fal.subscribe("fal-ai/kling-video/v1/standard/image-to-video", {
      input: {
        image_url: imageUrl,
        prompt,
        duration,
        aspect_ratio: aspectRatio,
        cfg_scale: 0.5,
      },
      logs: true,
    }).then(async (result: any) => {
      if (result.video && result.video.url) {
        // Actualizar registro con video completado
        await db.update(fashionVideos)
          .set({
            videoUrl: result.video.url,
            thumbnailUrl: result.video.thumbnail_url,
            status: 'completed'
          })
          .where(eq(fashionVideos.id, video.id));

        console.log('✅ Video completado:', video.id);
      } else {
        await db.update(fashionVideos)
          .set({ status: 'failed' })
          .where(eq(fashionVideos.id, video.id));
      }
    }).catch(async (error) => {
      console.error('Error generando video:', error);
      await db.update(fashionVideos)
        .set({ status: 'failed' })
        .where(eq(fashionVideos.id, video.id));
    });

    // Responder inmediatamente con el ID del video
    res.json({
      success: true,
      videoId: video.id,
      status: 'processing',
      message: 'Video en proceso. Verifica el estado en unos minutos.'
    });

  } catch (error: any) {
    console.error('Error iniciando video:', error);
    res.status(500).json({ error: error.message });
  }
});

// Verificar estado de video
router.get('/video-status/:videoId', authenticate, async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;

    const [video] = await db
      .select()
      .from(fashionVideos)
      .where(eq(fashionVideos.id, parseInt(videoId)));

    if (!video) {
      return res.status(404).json({ error: 'Video no encontrado' });
    }

    res.json({
      success: true,
      video
    });

  } catch (error: any) {
    console.error('Error verificando video:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// FASHION ANALYSIS CON GEMINI
// ============================================

router.post('/analyze', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { imageUrl, prompt, genre, occasion, sessionId } = req.body;

    console.log('🎨 Analizando moda con Gemini...');

    // Usar servicio Gemini del proyecto
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const genai = new GoogleGenerativeAI(process.env.VITE_GEMINI_API_KEY);
    const model = genai.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

    const fullPrompt = `${prompt}\n\nGenre: ${genre || 'N/A'}\nOccasion: ${occasion || 'N/A'}`;

    const result = await model.generateContent(fullPrompt);
    const responseText = result.response.text();

    // Intentar parsear JSON
    let analysis;
    try {
      analysis = JSON.parse(responseText);
    } catch (e) {
      // Si no es JSON, crear estructura
      analysis = {
        styleScore: 75,
        colorPalette: ['#000000', '#FFFFFF', '#FF6B6B', '#4ECDC4', '#FFE66D'],
        bodyType: 'Unknown',
        genreCoherence: 70,
        suggestions: [
          responseText.substring(0, 200),
          'Consider adding more genre-specific elements',
          'Experiment with bold accessories',
          'Focus on color coordination'
        ],
        moodBoard: {
          keywords: genre ? [genre, 'modern', 'stylish'] : ['modern', 'stylish'],
          artistReferences: [],
          trendReferences: []
        },
        detailedAnalysis: responseText
      };
    }

    const userId = user.uid || user.id;

    // Guardar análisis en DB
    const [analysisRecord] = await db.insert(fashionAnalysis).values({
      sessionId: sessionId || null,
      userId: userId.toString(),
      analysisType: 'style',
      imageUrl,
      recommendations: {
        styleScore: analysis.styleScore,
        colorPalette: analysis.colorPalette,
        bodyType: analysis.bodyType,
        genreCoherence: analysis.genreCoherence,
        suggestions: analysis.suggestions
      },
      moodBoard: analysis.moodBoard,
      geminiResponse: responseText
    }).returning();

    res.json({
      success: true,
      analysis,
      analysisId: analysisRecord.id
    });

  } catch (error: any) {
    console.error('Error en análisis:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PORTFOLIO
// ============================================

// Crear item de portfolio
router.post('/portfolio', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userId = user.uid || user.id;
    const { title, description, images, products, category, season, tags, isPublic } = req.body;

    const [portfolioItem] = await db.insert(fashionPortfolio).values({
      userId: userId.toString(),
      title,
      description,
      images,
      products,
      category,
      season,
      tags,
      isPublic: isPublic || false
    }).returning();

    res.json({ success: true, portfolioItem });
  } catch (error: any) {
    console.error('Error creando portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener portfolio del usuario
router.get('/portfolio', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userId = user.uid || user.id;
    const portfolio = await db
      .select()
      .from(fashionPortfolio)
      .where(eq(fashionPortfolio.userId, userId.toString()))
      .orderBy(desc(fashionPortfolio.createdAt));

    res.json({ success: true, portfolio });
  } catch (error: any) {
    console.error('Error obteniendo portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// PRODUCTOS DEL ARTISTA
// ============================================

// Obtener productos para try-on
router.get('/products', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userId = user.uid || user.id;
    const products = await db
      .select()
      .from(merchandise)
      .where(and(
        eq(merchandise.userId, userId.toString()),
        eq(merchandise.category, 'apparel')
      ))
      .orderBy(desc(merchandise.createdAt));

    res.json({ success: true, products });
  } catch (error: any) {
    console.error('Error obteniendo productos:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de try-on con productos
router.get('/tryon-history', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const userId = user.uid || user.id;
    const history = await db
      .select()
      .from(productTryOnHistory)
      .where(eq(productTryOnHistory.userId, userId.toString()))
      .orderBy(desc(productTryOnHistory.createdAt))
      .limit(50);

    res.json({ success: true, history });
  } catch (error: any) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
