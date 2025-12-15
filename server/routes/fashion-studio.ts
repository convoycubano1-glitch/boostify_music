/**
 * Fashion Studio API Routes
 * 
 * Endpoints para Artist Fashion Studio:
 * - Sessions management
 * - Fashion analysis con OpenAI Vision
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

    console.log('📝 Creating session - Body:', req.body);
    console.log('📝 sessionType:', sessionType);
    console.log('📝 metadata:', metadata);

    if (!sessionType) {
      return res.status(400).json({ error: 'sessionType is required' });
    }

    const validSessionTypes = ['tryon', 'generation', 'analysis', 'video', 'portfolio'];
    if (!validSessionTypes.includes(sessionType)) {
      return res.status(400).json({ 
        error: `Invalid sessionType: ${sessionType}. Must be one of: ${validSessionTypes.join(', ')}` 
      });
    }

    const [session] = await db.insert(fashionSessions).values({
      userId: userId.toString(),
      sessionType,
      metadata,
      status: 'active'
    }).returning();

    console.log('✅ Session created:', session);

    res.json({ success: true, session });
  } catch (error: any) {
    console.error('❌ Error creando sesión:', error);
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
    console.log('📸 Model Image URL:', modelImage?.substring(0, 100) + '...');
    console.log('👕 Clothing Image URL:', clothingImage?.substring(0, 100) + '...');

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

    console.log('✅ FAL Try-On result:', { 
      hasImage: !!result.image, 
      hasUrl: !!result.image?.url,
      imageUrl: result.image?.url?.substring(0, 100)
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
      console.error('❌ No image generated in result:', result);
      res.status(500).json({ error: 'No se generó imagen' });
    }

  } catch (error: any) {
    console.error('❌ ERROR COMPLETO en try-on:');
    console.error('Message:', error.message);
    console.error('Status:', error.status || error.statusCode);
    console.error('Response:', error.response?.data || error.data);
    console.error('Full error:', JSON.stringify(error, null, 2));
    
    res.status(500).json({ 
      error: error.message || 'Error en try-on',
      details: error.response?.data || error.data
    });
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
// FASHION ANALYSIS CON OPENAI VISION
// ============================================

router.post('/analyze', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { imageUrl, prompt, genre, occasion, sessionId } = req.body;

    console.log('🎨 Analizando moda con OpenAI Vision...');

    // Usar OpenAI para análisis de moda
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const fullPrompt = `Analyze this fashion image and provide detailed style recommendations.
    
${prompt}

Genre context: ${genre || 'N/A'}
Occasion: ${occasion || 'N/A'}

Respond in JSON format with:
{
  "styleScore": number (0-100),
  "colorPalette": array of hex colors,
  "bodyType": string,
  "genreCoherence": number (0-100),
  "suggestions": array of 4 strings with improvement suggestions,
  "moodBoard": {
    "keywords": array of style keywords,
    "artistReferences": array of artist style references,
    "trendReferences": array of current trend references
  },
  "detailedAnalysis": detailed text analysis
}`;

    const messages: any[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: fullPrompt },
          { 
            type: 'image_url', 
            image_url: { 
              url: imageUrl,
              detail: 'high'
            } 
          }
        ]
      }
    ];

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages,
      max_tokens: 2000,
      response_format: { type: 'json_object' }
    });

    const responseText = response.choices[0]?.message?.content || '';

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

// Obtener productos para try-on (del artista seleccionado o del usuario)
router.get('/products', authenticate, async (req: Request, res: Response) => {
  try {
    const user = req.user || req.session?.user;
    if (!user) {
      return res.status(401).json({ error: 'No autenticado' });
    }

    const { artistId } = req.query;
    const userId = user.uid || user.id;

    console.log('🛍️ Fetching products from Firestore - artistId:', artistId, 'userId:', userId);

    // Importar Firestore Admin
    const { db: firestoreDb } = await import('../firebase');
    
    if (!firestoreDb) {
      console.log('⚠️ Firestore not available, falling back to PostgreSQL');
      // Fallback a PostgreSQL si Firestore no está disponible
      const targetUserId = artistId ? parseInt(artistId as string) : (typeof userId === 'string' ? parseInt(userId) : userId);
      const products = await db
        .select()
        .from(merchandise)
        .where(and(
          eq(merchandise.userId, targetUserId),
          eq(merchandise.category, 'apparel')
        ))
        .orderBy(desc(merchandise.createdAt));
      
      return res.json({ success: true, products });
    }

    // Buscar productos en Firestore colección "merchandise"
    const targetFirestoreUserId = artistId || userId.toString();
    console.log('🔍 Searching Firestore merchandise for userId:', targetFirestoreUserId);

    const merchandiseRef = firestoreDb.collection('merchandise');
    const merchandiseSnapshot = await merchandiseRef
      .where('userId', '==', targetFirestoreUserId)
      .where('category', '==', 'Apparel')
      .get();

    const products = merchandiseSnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        description: data.description,
        price: data.price,
        category: data.category,
        userId: data.userId,
        sizes: data.sizes,
        // Mapear imageUrl de Firestore a images array esperado por el frontend
        images: data.imageUrl ? [data.imageUrl] : [],
        createdAt: data.createdAt
      };
    });

    console.log(`✅ Found ${products.length} apparel products in Firestore for userId: ${targetFirestoreUserId}`);

    res.json({ success: true, products });
  } catch (error: any) {
    console.error('❌ Error obteniendo productos:', error);
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
