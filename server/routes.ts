import type { Express } from "express";
import { createServer, type Server as HttpServer } from "http";
import { setupAuth } from "./replitAuth";
import { setupInstagramRoutes } from "./instagram";
import { setupSpotifyRoutes } from "./spotify";
import { setupOpenAIRoutes } from "./routes/openai";
import { setupEducationRoutes } from "./routes/education";
import educationProgressiveRouter from "./routes/education-progressive";
import { setupFilesRoutes } from "./routes/files";
import stripeRouter from "./routes/stripe";
import { setupVideosRoutes } from "./routes/videos";
import { setupEmailRoutes } from "./routes/email";
import { setupApifyRoutes } from "./routes/apify";
import { setupSocialNetworkRoutes } from "./routes/social-network.setup";
import { setupSubscriptionRoutes } from "./routes/subscription-protected-routes";
import firestoreSocialNetworkRouter from "./routes/firestore-social-network";
import { db } from "./db";
import { marketingMetrics, contracts, bookings, payments, analyticsHistory, events, courseEnrollments, users } from "./db/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import Stripe from 'stripe';
import { z } from "zod";
import express from 'express';
import passport from 'passport';
import axios from 'axios';
import OpenAI from "openai";
import { insertBookingSchema } from "./db/schema";
import translationRouter from './routes/translation';
import managerRouter from './routes/manager';
import managerDocumentsRouter from './routes/manager-documents';
import artistRouter from './routes/artist';
import artistGeneratorRouter from './routes/artist-generator'; // Added import
import subscriptionRoutesRouter from './routes/subscription-routes'; // Nuevas rutas específicas por nivel de suscripción
import coursesRouter from './routes/courses';
import achievementsRouter from './routes/achievements';
import klingApiRouter from './routes/kling-api'; // Importamos el router de Kling API
import klingLipsyncRouter from './routes/kling-lipsync'; // Importamos el router de LipSync
import klingTestRouter from './routes/kling-test'; // Importamos el router de pruebas de Kling
import videoGenerationRouter from './routes/video-generation'; // Direct router for PiAPI video generation
import videoUpscaleRouter from './routes/video-upscale'; // Router for video upscaling with Qubico/video-toolkit
import investorsRouter from './routes/investors';
import generatedArtistsRouter from './routes/generated-artists';
import professionalEditorRouter from './routes/admin-routes/professional-editor'; // Router para Editor Profesional con Firebase Admin SDK
import apiProxyRouter from './routes/api-proxy'; // Import the proxy router for external APIs
import videoStatusRouter from './routes/video-status'; // Import the dedicated router for video status
import musicRouter from './routes/music'; // Import the music generation router
import uploadApiRouter from './routes/upload-api'; // Import the upload API router for image processing
import fluxApiRouter from './routes/flux-api-proxy'; // Import the Flux API router
import affiliateRouter from './routes/affiliate'; // Import the affiliate program router
import geminiImageRouter from './routes/gemini-image'; // Import the Gemini image generation router
import artistProfileRouter from './routes/artist-profile'; // Import the artist profile generation router
import imageGalleryRouter from './routes/image-gallery'; // Import the image gallery router
import audioTranscriptionRouter from './routes/audio-transcription'; // Import the audio transcription router
import generatedVideosRouter from './routes/generated-videos'; // Import the generated videos router
import minimaxVideoRouter from './routes/minimax-video'; // Import the MiniMax video generation router
import musiciansRouter from './routes/musicians'; // Import the musicians router
import musicVideoProjectsRouter from './routes/music-video-projects'; // Import the music video projects router
import musicianClipsRouter from './routes/musician-clips'; // Import the musician clips router for timeline
import cameraAnglesRouter from './routes/camera-angles'; // Import the camera angles router
import profileRouter from './routes/profile'; // Import the profile router
import performanceSegmentsRouter from './routes/performance-segments'; // Import the performance segments router
import songsRouter from './routes/songs'; // Import the songs router
import merchRouter from './routes/merch'; // Import the merchandise router
import aiAssistantRouter from './routes/ai-assistant'; // Import the AI assistant router
import geminiAgentsRouter from './routes/gemini-agents'; // Import the Gemini agents router
import contractsRouter from './routes/contracts'; // Import the contracts router with Gemini AI
import falApiRouter from './routes/fal-api'; // Import the FAL AI router for secure backend processing
import creditsRouter from './routes/credits'; // Import the credits and payments router
import faceAnalysisRouter from './routes/face-analysis'; // Import the face analysis router
import videoRenderingRouter from './routes/video-rendering'; // Import the video rendering router with Shotstack
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for tasks
import { authenticate } from './middleware/auth';
import { awardCourseCompletionAchievement } from './achievements';
import apiProxySecure from './routes/api-proxy-secure';
import firebaseTokenRouter from './routes/firebase-token'; // Import Firebase token generator
import artistWalletRouter from './routes/artist-wallet'; // Import Artist Wallet for earnings and credits
import motionDnaImagesRouter from './routes/motion-dna-images'; // Import MotionDNA images router
import printfulRouter from './routes/printful'; // Import Printful integration router
import crowdfundingRouter from './routes/crowdfunding'; // Import Crowdfunding router
import tokenizationRouter from './routes/tokenization'; // Import Tokenization (Web3/Blockchain) router
import adminImportArtistsRouter from './routes/admin-import-artists'; // Import Admin artists import router
import virtualRecordLabelRouter from './routes/virtual-record-label'; // Import Virtual Record Label integration router
import ogImageRouter from './routes/og-image.tsx'; // Import Open Graph image generator
import youtubeToolsRouter from './routes/youtube-tools'; // Import YouTube Growth Tools (Gemini AI + Apify)
import spotifyToolsRouter from './routes/spotify-tools'; // Import Spotify Growth Tools (Gemini AI + Apify)
import instagramToolsRouter from './routes/instagram-tools'; // Import Instagram Boost AI Tools (Gemini AI)
import instagramOAuthRouter from './routes/instagram-oauth'; // Import Instagram OAuth for real API connection
import musicVideoRouter from './routes/music-video'; // Import Music Video Concept Generation (Gemini AI)
import artistProfilesRouter from './routes/artist-profiles'; // Import Artist Profiles auto-generation
import apifyInstagramRouter from './routes/apify-instagram'; // Import Apify Instagram integration for real data
import fashionStudioRouter from './routes/fashion-studio'; // Import Artist Fashion Studio (FAL + Gemini)
import notificationsRouter from './routes/notifications'; // Import Notifications router for internal messaging
import webhookStripeRouter from './routes/webhook-stripe'; // Import Stripe Webhook handler


if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia' as any, // Actualizada marzo 2025
});

// Export the configured server
export function registerRoutes(app: Express): HttpServer {
  // API Proxy seguro para producción
  app.use('/api/proxy', apiProxySecure);
  
  // IMPORTANTE: Configurar rutas públicas antes de cualquier middleware de autenticación
  
  // Ruta pública para obtener la clave publicable de Stripe (fuera de cualquier middleware de autenticación)
  app.get('/api/stripe/publishable-key', (req, res) => {
    console.log('Accediendo a clave publicable de Stripe (ruta global)');
    res.json({
      key: process.env.STRIPE_PUBLISHABLE_KEY || '',
      success: true
    });
  });
  
  // Session middleware is configured in setupAuth() which is called later
  // No need to configure it here to avoid duplication

  // Endpoint público para buscar artista por slug (usado por artist-profile.tsx)
  app.get('/api/artist/by-slug/:slug', async (req, res) => {
    try {
      const { slug } = req.params;
      console.log(`🔍 Buscando artista con slug: ${slug}`);
      
      // Buscar en PostgreSQL
      const artist = await db.select().from(users).where(eq(users.slug, slug)).limit(1);
      
      if (artist.length > 0) {
        const artistData = artist[0];
        console.log(`✅ Artista encontrado en PostgreSQL: ${artistData.artistName}`);
        
        res.json({
          success: true,
          artist: {
            id: artistData.id,
            firestoreId: artistData.firestoreId || String(artistData.id),
            artistName: artistData.artistName,
            slug: artistData.slug,
            biography: artistData.biography,
            profileImage: artistData.profileImage,
            coverImage: artistData.coverImage,
            genres: artistData.genres,
            country: artistData.country,
            location: artistData.location,
            instagramHandle: artistData.instagramHandle,
            twitterHandle: artistData.twitterHandle,
            youtubeHandle: artistData.youtubeHandle,
            spotifyUrl: artistData.spotifyUrl,
            isAIGenerated: artistData.isAIGenerated,
            generatedBy: artistData.generatedBy
          }
        });
      } else {
        console.log(`⚠️ No se encontró artista con slug: ${slug}`);
        res.status(404).json({
          success: false,
          error: 'Artist not found'
        });
      }
    } catch (error) {
      console.error('❌ Error buscando artista por slug:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  });

  // Health check and status endpoints (no authentication required)
  app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  app.get('/api/status', (req, res) => {
    // Check database connection if needed
    const databaseStatus = db ? 'connected' : 'disconnected';
    
    // Basic system information
    const status = {
      server: {
        status: 'ok',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
      },
      database: {
        status: databaseStatus
      },
      serviceStatus: {
        firebase: !!process.env.VITE_FIREBASE_API_KEY ? 'configured' : 'not_configured',
        stripe: !!process.env.STRIPE_SECRET_KEY ? 'configured' : 'not_configured',
        openai: !!process.env.OPENAI_API_KEY ? 'configured' : 'not_configured',
        apify: !!process.env.APIFY_API_TOKEN ? 'configured' : 'not_configured',
      }
    };
    
    res.status(200).json(status);
  });
  
  // Endpoint de diagnóstico para verificar conectividad desde cualquier dispositivo
  app.get('/api/diagnostics', (req, res) => {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
    const isSafari = /Safari/i.test(userAgent) && !/Chrome/i.test(userAgent);
    const cookies = req.headers.cookie || 'no cookies';
    
    res.status(200).json({
      success: true,
      message: '¡Servidor funcionando correctamente!',
      device: {
        userAgent,
        isIOS,
        isSafari,
        platform: isIOS ? 'iOS' : 'other',
      },
      network: {
        ip: req.ip || req.connection.remoteAddress,
        protocol: req.protocol,
        secure: req.secure,
      },
      cookies: {
        present: cookies !== 'no cookies',
        count: cookies.split(';').length,
      },
      timestamp: new Date().toISOString(),
    });
  });

  // Register Firebase token generator (requires Replit Auth)
  app.use(firebaseTokenRouter);

  // Register translation routes
  app.use('/api', translationRouter);

  // Register video generation router (direct implementation)
  app.use('/api/video-generation', videoGenerationRouter);
  
  // Register video upscale router for final rendering with Qubico/video-toolkit
  app.use('/api/proxy/piapi/video-upscale', videoUpscaleRouter);

  app.use('/api/manager', managerRouter);
  app.use('/api/manager/documents', managerDocumentsRouter);
  app.use('/api/artist', artistRouter);

  // Configurar las rutas que NO requieren autenticación primero
  setupOpenAIRoutes(app);
  setupEducationRoutes(app);
  app.use(educationProgressiveRouter);
  setupFilesRoutes(app);

  // Register generated artists routes (no authentication required)
  app.use(generatedArtistsRouter);

  // Register artist generator routes (no authentication required)
  app.use('/api/artist-generator', artistGeneratorRouter); // La URL resultante será /api/artist-generator/generate-artist

  // Registrar el router de proxy API (sin autenticación)
  app.use('/api', apiProxyRouter);
  
  // Registrar el router dedicado para estado de videos (sin autenticación)
  app.use('/api/video', videoStatusRouter);
  
  // Registrar las rutas de la API de Kling (sin autenticación para permitir proceso de imágenes)
  app.use('/api/kling', klingApiRouter);
  
  // Registrar las rutas específicas para LipSync con Kling
  app.use('/api/kling', klingLipsyncRouter);
  
  // Registrar el procesador de imágenes para API de uploads
  app.use('/api', uploadApiRouter);
  
  // Registrar las rutas de prueba de Kling (solo para desarrollo)
  app.use('/api/kling-test', klingTestRouter);
  
  // Registrar el router para generación de música (requiere autenticación parcial)
  app.use('/api/music', musicRouter);
  
  // Registrar el router para Flux API (generación de imágenes avanzada)
  app.use('/api', fluxApiRouter);
  
  // Registrar el router para Gemini Image Generation (Nano Banana)
  app.use('/api/gemini-image', geminiImageRouter);
  
  // MotionDNA images router
  app.use('/api/images', motionDnaImagesRouter);
  
  // Registrar el router para Face Analysis con Gemini Vision
  app.use('/api/gemini', faceAnalysisRouter);
  
  // Registrar el router para Artist Profile Generation (Gemini)
  app.use('/api/artist-profile', artistProfileRouter);
  
  // Registrar el router para Image Gallery (generación de galerías de imágenes)
  app.use('/api/image-gallery', imageGalleryRouter);
  
  app.use('/api/minimax', minimaxVideoRouter);
  
  // Registrar el router para transcripción de audio
  console.log('📢 Registrando router de transcripción de audio en /api/audio');
  app.use('/api/audio', audioTranscriptionRouter);
  console.log('✅ Router de transcripción de audio registrado');
  
  // Registrar el router para videos generados (con autenticación)
  console.log('📢 Registrando router de videos generados en /api/videos');
  app.use('/api/videos', generatedVideosRouter);
  console.log('✅ Router de videos generados registrado');
  
  // Registrar el router para proyectos de music video (guardado/carga)
  console.log('📢 Registrando router de proyectos de music video en /api/music-video-projects');
  app.use('/api/music-video-projects', musicVideoProjectsRouter);
  app.use('/api/music-video', musicVideoRouter);
  app.use('/api/artist-profiles', artistProfilesRouter);
  app.use('/api/video-rendering', videoRenderingRouter);
  console.log('✅ Router de proyectos de music video registrado');
  console.log('✅ Router de perfiles de artista auto-generados registrado');
  
  // Registrar el router para musician clips (timeline musicians)
  console.log('📢 Registrando router de musician clips');
  app.use(musicianClipsRouter);
  console.log('✅ Router de musician clips registrado');
  
  // Registrar el router para camera angles (cinematographic variations)
  console.log('📢 Registrando router de camera angles');
  app.use(cameraAnglesRouter);
  console.log('✅ Router de camera angles registrado');
  
  // Registrar el router para performance segments (lip-sync automation)
  console.log('📢 Registrando router de performance segments en /api/performance-segments');
  app.use('/api/performance-segments', performanceSegmentsRouter);
  console.log('✅ Router de performance segments registrado');
  
  // Registrar rutas de perfil de artista, canciones y merchandise
  console.log('📢 Registrando rutas de perfil de artista');
  app.use('/api/profile', profileRouter);
  app.use('/api/songs', songsRouter);
  app.use('/api/merch', merchRouter);
  app.use('/api/artist-wallet', artistWalletRouter);
  app.use('/api/ai', aiAssistantRouter);
  app.use('/api/fal', falApiRouter); // FAL AI backend routes (MuseTalk lip-sync, etc.)
  app.use('/api/gemini-agents', geminiAgentsRouter);
  app.use('/api/printful', printfulRouter); // Printful integration routes
  app.use('/api/crowdfunding', crowdfundingRouter); // Crowdfunding routes
  app.use('/api/tokenization', tokenizationRouter); // Tokenization (Web3/Blockchain) routes
  app.use('/api/admin/import-artists', adminImportArtistsRouter); // Admin: Import artists from JSON/Excel
  app.use('/api/virtual-label', virtualRecordLabelRouter); // Virtual Record Label integration routes
  app.use('/api/og-image', ogImageRouter); // Open Graph dynamic image generation
  app.use('/api/youtube', youtubeToolsRouter); // YouTube Growth Tools (Pre-Launch Score, Keywords, Title Analyzer, Content Ideas)
  app.use('/api/spotify', spotifyToolsRouter); // Spotify Growth Tools (Listeners Prediction, Playlist Match, Curator Finder, SEO Optimizer)
  app.use('/api/instagram', instagramToolsRouter); // Instagram Boost AI Tools (Caption Generator, Hashtags, Content Ideas, Best Time, Bio Optimizer)
  app.use('/api/instagram/auth', instagramOAuthRouter); // Instagram OAuth for real API connection
  app.use('/api/apify/instagram', apifyInstagramRouter); // Apify Instagram integration for real Instagram data
  app.use('/api/fashion', fashionStudioRouter); // Artist Fashion Studio (Virtual Try-On, AI Advisor, Kling Videos)
  app.use('/api/notifications', notificationsRouter); // Internal notifications system
  app.use(creditsRouter); // Credits and payment routes
  
  // Helper function para obtener features de cada plan
  function getPlanFeatures(plan: string): string[] {
    const features: Record<string, string[]> = {
      free: [
        'Acceso básico a la plataforma',
        'Perfil de artista',
        'Subir canciones',
        'Funcionalidades limitadas'
      ],
      essential: [
        '1 Music Video Premium por mes',
        'Calidad HD 1080p',
        'Generación con IA',
        'Primer mes gratis',
        'Soporte básico'
      ],
      gold: [
        '2 Music Videos Premium por mes',
        'Calidad 4K',
        'Generación avanzada con IA',
        'Efectos visuales premium',
        'Primer mes gratis',
        'Soporte prioritario'
      ],
      platinum: [
        '4 Music Videos Premium por mes',
        'Calidad 4K HDR',
        'Efectos visuales profesionales',
        'Edición personalizada',
        'Primer mes gratis',
        'Soporte 24/7'
      ],
      diamond: [
        '8 Music Videos Premium por mes',
        'Calidad 8K',
        'Efectos visuales cinematográficos',
        'Director de arte dedicado',
        'Revisiones ilimitadas',
        'Primer mes gratis',
        'Soporte VIP 24/7'
      ]
    };
    
    return features[plan] || features.free;
  }
  
  // Endpoint para obtener la suscripción actual del usuario
  app.get('/api/subscriptions/current', async (req, res) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ error: "Usuario no autenticado" });
      }

      const { subscriptions } = await import ('./db/schema');
      const { eq, desc } = await import ('drizzle-orm');
      
      // Obtener la suscripción activa del usuario
      const [subscription] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, userId))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1);

      if (!subscription) {
        // Usuario sin suscripción (free tier)
        return res.json({
          plan: 'free',
          status: 'active',
          price: 0,
          currency: 'usd',
          features: [
            'Acceso básico a la plataforma',
            'Perfil de artista',
            'Subir canciones',
            'Funcionalidades limitadas'
          ]
        });
      }

      // Información completa de la suscripción
      return res.json({
        id: subscription.id,
        plan: subscription.plan,
        status: subscription.status,
        price: subscription.price ? parseFloat(subscription.price.toString()) : 0,
        currency: subscription.currency || 'usd',
        currentPeriodEnd: subscription.currentPeriodEnd,
        currentPeriodStart: subscription.currentPeriodStart,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
        stripeSubscriptionId: subscription.stripeSubscriptionId,
        features: getPlanFeatures(subscription.plan)
      });
    } catch (error) {
      console.error("Error obteniendo suscripción:", error);
      return res.status(500).json({ error: "Error al obtener suscripción" });
    }
  });
  
  // Contracts router moved after setupAuth() to ensure Passport is initialized
  console.log('✅ Rutas de perfil, songs, merch, AI assistant, FAL AI, Gemini agents, y Printful registradas');
  
  // ☑️ Rutas de Kling API ahora están separadas en su propio router
  // Véase server/routes/kling-api.ts para la implementación

  // Ruta específica para generación de video (sin autenticación)
  app.post('/api/video/generate', async (req, res) => {
    try {
      console.log('Recibiendo solicitud de generación de video:', req.body);

      // Obtener parámetros del cuerpo de la solicitud
      const { 
        prompt, 
        apiProvider, 
        duration, 
        style,
        cameraMovements,
        piapiModel,
        image_url
      } = req.body;

      // Validar que tenemos un prompt y un proveedor
      if (!prompt || !apiProvider) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere un prompt y un proveedor API'
        });
      }

      // Si el proveedor es piapi, redireccionar al endpoint de PiAPI
      if (apiProvider === 'piapi') {
        // Preparar el cuerpo de la solicitud para el endpoint de PiAPI
        const requestBody: any = {
          prompt: prompt,
          model: piapiModel || 't2v-01',
          expand_prompt: true
        };

        // Si hay movimientos de cámara y es el modelo director, incluirlos
        if (piapiModel === 't2v-01-director' && cameraMovements?.length) {
          requestBody.camera_movement = cameraMovements.join(',');
        }

        // Si hay una URL de imagen y es un modelo basado en imagen, incluirla
        if (image_url && ['i2v-01', 'i2v-01-live', 's2v-01'].includes(piapiModel)) {
          requestBody.image_url = image_url;
        }

        // Hacer solicitud al endpoint de PiAPI a través del proxy
        const apiResponse = await axios.post('/api/proxy/piapi/video/start', requestBody, {
          baseURL: `${req.protocol}://${req.get('host')}`
        });

        // Devolver la respuesta del endpoint de PiAPI
        console.log('Respuesta del endpoint de PiAPI:', apiResponse.data);
        return res.json({
          success: true,
          url: apiResponse.data.result?.url || null,
          taskId: apiResponse.data.taskId,
          status: apiResponse.data.status,
          provider: 'piapi'
        });
      } else {
        // Si es otro proveedor, devolver error no implementado
        return res.status(400).json({
          success: false,
          error: `Proveedor ${apiProvider} no implementado aún`
        });
      }
    } catch (error: any) {
      console.error('Error generando video:', error.message);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error al generar video'
      });
    }
  });

  // Definir los endpoints adicionales de estado que no requieren autenticación
  /**
   * Endpoint específico para verificar el estado de tareas de generación de video
   * Esta ruta es pública y no requiere autenticación
   */
  app.get('/api/video/status', async (req, res) => {
    try {
      const { taskId, provider } = req.query;
      
      console.log('Procesando solicitud de estado de video:', { taskId, provider });
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID de la tarea'
        });
      }
      
      if (provider === 'piapi') {
        // Verificar estado en PiAPI
        console.log(`Verificando estado de tarea de video ${taskId} con proveedor ${provider}`);
        try {
          const proxyRes = await axios.get(
            `${req.protocol}://${req.get('host')}/api/proxy/piapi/video/status?taskId=${taskId}`
          );
          
          console.log('Respuesta de verificación de estado:', proxyRes.data);
          return res.json(proxyRes.data);
        } catch (proxyError) {
          console.error('Error al verificar estado en proxy:', proxyError);
          return res.status(500).json({
            success: false,
            error: 'Error al verificar estado de la tarea de video'
          });
        }
      } else if (provider === 'luma') {
        // Verificar estado en Luma
        try {
          const proxyRes = await axios.get(
            `${req.protocol}://${req.get('host')}/api/proxy/luma/status?taskId=${taskId}`
          );
          
          return res.json(proxyRes.data);
        } catch (proxyError) {
          return res.status(500).json({
            success: false,
            error: 'Error al verificar estado de la tarea en Luma'
          });
        }
      } else if (provider === 'kling') {
        // Verificar estado en Kling
        try {
          const proxyRes = await axios.get(
            `${req.protocol}://${req.get('host')}/api/proxy/kling/video/status?taskId=${taskId}`
          );
          
          return res.json(proxyRes.data);
        } catch (proxyError) {
          return res.status(500).json({
            success: false,
            error: 'Error al verificar estado de la tarea en Kling'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Proveedor no soportado: ${provider}`
        });
      }
    } catch (error: any) {
      console.error('Error al verificar estado de tarea de video:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  });
  
  /**
   * Endpoint general para verificar el estado de cualquier tarea asíncrona
   * Esta ruta también es pública y no requiere autenticación
   */
  app.get('/api/task/status', async (req, res) => {
    try {
      const { taskId, provider } = req.query;
      
      console.log('Procesando solicitud general de estado de tarea:', { taskId, provider });
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID de la tarea'
        });
      }
      
      // Redirigir a los endpoints específicos según el proveedor
      if (provider === 'piapi' || provider === 'luma' || provider === 'kling') {
        // Para proveedores de video, usar el endpoint de video
        try {
          const proxyUrl = `${req.protocol}://${req.get('host')}/api/video/status?taskId=${taskId}&provider=${provider}`;
          console.log(`Redirigiendo a endpoint de video: ${proxyUrl}`);
          const videoRes = await axios.get(proxyUrl);
          return res.json(videoRes.data);
        } catch (error) {
          console.error('Error al redirigir a endpoint de video:', error);
          return res.status(500).json({
            success: false,
            error: 'Error al verificar estado de la tarea de video'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Proveedor no soportado o no especificado: ${provider}`
        });
      }
    } catch (error: any) {
      console.error('Error verificando estado de tarea:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  });

  // IMPORTANTE: Registrar esta ruta pública antes de cualquier middleware de autenticación global
  // Esta ruta proporciona información pública sobre los planes de suscripción
  app.get('/api/subscription-plans', (req, res) => {
    res.json({
      success: true,
      message: 'Información sobre planes de suscripción',
      plans: [
        { 
          name: 'Free', 
          price: 0,
          features: [
            'Acceso básico a la plataforma',
            'Visualización de tutoriales gratuitos',
            'Comunidad de artistas',
            'Funcionalidades limitadas'
          ]
        },
        { 
          name: 'Basic', 
          price: 59.99,
          features: [
            'Cursos básicos de producción musical',
            'Análisis básico de canciones',
            'Generación básica de audio con IA',
            'Hasta 10 producciones mensuales'
          ]
        },
        { 
          name: 'Pro', 
          price: 99.99,
          features: [
            'Todas las funcionalidades Basic',
            'Cursos avanzados de producción musical',
            'Análisis detallado de canciones con IA',
            'Generación avanzada de audio con IA',
            'Hasta 30 producciones mensuales',
            'Acceso a herramientas de masterización'
          ]
        },
        { 
          name: 'Premium', 
          price: 149.99,
          features: [
            'Todas las funcionalidades Pro',
            'Masterclasses exclusivas con artistas reconocidos',
            'Análisis predictivo de tendencias musicales',
            'Generación ilimitada de audio con IA',
            'Herramientas avanzadas de distribución musical',
            'Soporte personalizado 24/7',
            'Acceso temprano a nuevas funcionalidades'
          ]
        }
      ]
    });
  });
  
  // NOTE: setupAuth() is now called from server/index.ts AFTER registerRoutes() 
  // but BEFORE setupVite() to ensure auth endpoints are registered before Vite's catch-all
  
  // Register contracts router (Passport is initialized in server/index.ts)
  app.use('/api/contracts', contractsRouter);
  console.log('✅ Router de contratos registrado');
  
  setupSpotifyRoutes(app);
  setupInstagramRoutes(app);
  setupVideosRoutes(app);
  setupEmailRoutes(app);
  setupApifyRoutes(app);
  setupSocialNetworkRoutes(app);
  app.use('/api/stripe', stripeRouter);
  
  // Stripe Webhook (debe estar antes de cualquier middleware de autenticación)
  app.use('/api/stripe', webhookStripeRouter);
  
  // Setup subscription-protected routes
  setupSubscriptionRoutes(app);
  
  app.use('/api/subscription', authenticate, subscriptionRoutesRouter);

  // Usar Firestore para la red social
  app.use('/api/firestore-social', firestoreSocialNetworkRouter);

  // Register courses routes
  app.use(coursesRouter);

  // Register achievements routes
  app.use(achievementsRouter);

  // Register investors routes
  app.use('/api/investors', investorsRouter);
  
  // Register Professional Editor routes
  app.use('/api/editor', professionalEditorRouter);
  
  // Register music generation routes - specific routes handling
  // Separate public test endpoint from authenticated routes
  
  // Register affiliate program routes
  app.use('/api/affiliate', affiliateRouter);
  
  // Register musicians routes
  app.use('/api', musiciansRouter);
  
  app.post('/api/music/test-integration', (req, res) => {
    try {
      const { prompt = 'Una melodía suave de piano' } = req.body;
      
      const taskId = uuidv4();
      
      // Solo verificamos si existe la API key para este test público
      if (process.env.PIAPI_API_KEY) {
        return res.status(200).json({ 
          success: true, 
          message: 'API key de PiAPI encontrada, la integración parece estar correctamente configurada',
          test_only: true,
          api_key_present: true
        });
      } else {
        return res.status(200).json({
          success: false,
          message: 'No se encontró API_KEY para PiAPI en variables de entorno'
        });
      }
    } catch (error) {
      console.error('Error en test de integración:', error);
      res.status(500).json({ error: 'Error interno al probar la integración' });
    }
  });
  
  // Eliminamos la línea duplicada que registra las rutas de música
  // (ya está registrada en la línea 125)


  // AI Campaign Suggestions Route
  app.post("/api/ai/campaign-suggestion", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const { name, description, platform, budget } = req.body;

      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a marketing expert specialized in music promotion campaigns. Provide suggestions in Spanish to optimize campaign performance. Format your response as JSON with a 'suggestions' field containing an array of string suggestions."
          },
          {
            role: "user",
            content: `Por favor analiza y proporciona sugerencias para esta campaña:
              Nombre: ${name}
              Descripción: ${description}
              Plataforma: ${platform}
              Presupuesto: $${budget}

              Proporciona sugerencias específicas y prácticas para mejorar la efectividad de la campaña.`
          }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the response and ensure it has the expected structure
      const suggestions = JSON.parse(completion.choices[0].message.content);
      if (!suggestions.suggestions) {
        throw new Error('Formato de respuesta AI inválido');
      }

      res.json({ suggestion: suggestions.suggestions.join('\n\n') });
    } catch (error: any) {
      console.error('Error getting AI suggestions:', error);
      res.status(500).json({
        error: "Error al generar sugerencias para la campaña",
        details: error.message
      });
    }
  });

  app.post("/api/generate-strategy", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a music industry expert specialized in artist growth strategies. Generate 3-5 actionable focus points for the artist's growth strategy in Spanish. Format your response as JSON with a 'strategy' array containing string items. Each strategy point should be specific and actionable."
          },
          {
            role: "user",
            content: "Generate a strategic growth plan for an emerging music artist focusing on social media presence, music releases, and collaborations. Consider aspects like content creation, audience engagement, and promotional activities. Provide the response in Spanish."
          }
        ],
        response_format: { type: "json_object" }
      });

      // Parse the response and ensure it has the expected structure
      const result = JSON.parse(completion.choices[0].message.content);
      if (!Array.isArray(result.strategy)) {
        throw new Error('Invalid AI response format');
      }

      return res.json({ strategy: result.strategy });
    } catch (error: any) {
      console.error('Error generating strategy:', error);
      return res.status(500).json({
        error: "Error al generar estrategia",
        details: error.message
      });
    }
  });

  // Create subscription checkout session
  // Eliminamos esta ruta duplicada ya que ahora usamos '/api/stripe/create-subscription' 
  // definida en server/routes/stripe.ts


  // Create checkout session
  app.post("/api/create-checkout-session", async (req, res) => {
    console.log('Received checkout session request:', {
      body: req.body,
      user: req.user,
      isAuthenticated: req.isAuthenticated()
    });

    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const { musicianId, price, currency } = req.body;

      if (!musicianId || !price || !currency) {
        return res.status(400).json({
          error: "Missing required fields: musicianId, price, or currency"
        });
      }

      console.log('Creating checkout session for:', { musicianId, price, currency });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: currency.toLowerCase(),
              product_data: {
                name: 'Music Session Booking',
                description: `Session booking with musician ID: ${musicianId}`,
              },
              unit_amount: Math.round(price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/booking-confirmation?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/booking-confirmation?canceled=true`,
        metadata: {
          musicianId,
          userId: req.user!.id,
        },
      });

      console.log('Created session:', session.id);

      return res.json({
        sessionId: session.id
      });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      return res.status(500).json({
        error: error.message || "Error creating checkout session"
      });
    }
  });

  // Add the new course checkout route here
  app.post("/api/create-course-checkout", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const { courseId, title, price, thumbnail } = req.body;

      if (!courseId || !title || !price) {
        return res.status(400).json({
          error: "Missing required fields: courseId, title, or price"
        });
      }

      console.log('Creating course checkout session for:', { courseId, title, price });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: title,
                description: `Enrollment for course: ${title}`,
                images: thumbnail ? [thumbnail] : undefined,
              },
              unit_amount: Math.round(price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/course/${courseId}?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/education?canceled=true`,
        metadata: {
          courseId,
          userId: req.user!.id,
        },
      });

      console.log('Created session:', session.id);

      return res.json({
        sessionId: session.id
      });
    } catch (error: any) {
      console.error('Error creating course checkout session:', error);
      return res.status(500).json({
        error: error.message || "Error creating checkout session"
      });
    }
  });

  // Update the webhook handler to handle checkout.session.completed events
  app.post("/api/webhook", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig || '',
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    } catch (err: any) {
      console.error('Webhook Error:', err.message);
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      try {
        const { userId, musicianId } = session.metadata || {};

        if (userId && musicianId) {
          // Create the booking record
          await db.insert(bookings).values({
            userId: parseInt(userId),
            musicianId,
            status: 'pending',
            paymentStatus: 'paid',
            price: session.amount_total! / 100,
            currency: session.currency,
          });
        }
      } catch (error) {
        console.error('Error processing successful payment:', error);
      }
    }

    res.json({ received: true });
  });

  // Get user's metrics
  app.get("/api/metrics", async (req, res) => {
    if (!req.user?.id) return res.sendStatus(401);

    const [metrics] = await db
      .select()
      .from(marketingMetrics)
      .where(eq(marketingMetrics.userId, req.user.id))
      .limit(1);

    res.json(metrics ?? {
      spotifyFollowers: 0,
      instagramFollowers: 0,
      playlistPlacements: 0,
      monthlyListeners: 0
    });
  });

  // Save a new contract
  app.post("/api/contracts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "No token provided" });

    try {
      const contractData = contractSchema.parse(req.body);

      const [result] = await db.insert(contracts).values({
        title: contractData.title,
        type: contractData.type,
        content: contractData.content,
        status: contractData.status,
        userId: req.user!.id,
      }).returning();

      res.status(201).json(result);
    } catch (error) {
      console.error('Error saving contract:', error);
      res.status(400).json({ error: 'Invalid contract data' });
    }
  });

  // Get user's contracts
  app.get("/api/contracts", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "No token provided" });

    try {
      const userContracts = await db.select().from(contracts)
        .where(eq(contracts.userId, req.user!.id))
        .orderBy(desc(contracts.createdAt));

      res.json(userContracts);
    } catch (error) {
      console.error('Error fetching contracts:', error);
      res.status(500).json({ error: 'Failed to fetch contracts' });
    }
  });

  // Get a specific contract
  app.get("/api/contracts/:id", async (req, res) => {
    if (!req.user?.id) return res.sendStatus(401);

    try {
      const [contract] = await db.query.contracts.findMany({
        where: and(
          eq(contracts.id, parseInt(req.params.id)),
          eq(contracts.userId, req.user.id)
        ),
        limit: 1
      });

      if (!contract) {
        return res.status(404).json({ error: 'Contract not found' });
      }

      res.json(contract);
    } catch (error) {
      console.error('Error fetching contract:', error);
      res.status(500).json({ error: 'Failed to fetch contract' });
    }
  });

  // Create a new booking
  app.post("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

    try {
      const bookingData = insertBookingSchema.parse(req.body);

      const [result] = await db
        .insert(bookings)
        .values({
          ...bookingData,
          userId: req.user!.id,
        })
        .returning();

      res.status(201).json(result);
    } catch (error) {
      console.error('Error creating booking:', error);
      res.status(400).json({ error: 'Invalid booking data' });
    }
  });

  // Get user's bookings
  app.get("/api/bookings", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

    try {
      const userBookings = await db
        .select()
        .from(bookings)
        .where(eq(bookings.userId, req.user!.id))
        .orderBy(desc(bookings.createdAt));

      res.json(userBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
      res.status(500).json({ error: 'Failed to fetch bookings' });
    }
  });


  // Add Stripe payment intent creation endpoint
  app.post("/api/create-payment-intent", async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { musicianId, price, currency } = req.body;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(price * 100), // Stripe expects amounts in cents
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          musicianId,
          userId: req.user.id,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
      });
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ error: 'Failed to create payment intent' });
    }
  });

  // Add Stripe webhook handler
  app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;

        // Update booking and payment status
        const [booking] = await db
          .select()
          .from(bookings)
          .where(eq(bookings.id, parseInt(paymentIntent.metadata.bookingId)))
          .limit(1);

        if (booking) {
          await db.transaction(async (tx) => {
            await tx
              .update(bookings)
              .set({ paymentStatus: 'paid' })
              .where(eq(bookings.id, booking.id));

            await tx
              .insert(payments)
              .values({
                bookingId: booking.id,
                stripePaymentIntentId: paymentIntent.id,
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency,
                status: 'succeeded',
              });
          });
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Error handling webhook:', error);
      res.status(400).send(`Webhook Error: ${error.message}`);
    }
  });

  // Get user's current analytics metrics
  app.get("/api/analytics/metrics", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

    try {
      const [metrics] = await db
        .select()
        .from(marketingMetrics)
        .where(eq(marketingMetrics.userId, req.user!.id))
        .limit(1);

      if (!metrics) {
        // Initialize metrics if they don't exist
        const [newMetrics] = await db
          .insert(marketingMetrics)
          .values({
            userId: req.user!.id,
            updatedAt: new Date(),
          })
          .returning();

        return res.json(newMetrics);
      }

      res.json(metrics);
    } catch (error) {
      console.error('Error fetching analytics metrics:', error);
      res.status(500).json({ error: 'Failed to fetch analytics metrics' });
    }
  });

  // Get analytics history with optional date range
  app.get("/api/analytics/history", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

    try {
      const { startDate, endDate, metrics } = req.query;
      let query = db
        .select()
        .from(analyticsHistory)
        .where(eq(analyticsHistory.userId, req.user!.id))
        .orderBy(desc(analyticsHistory.timestamp));

      if (startDate) {
        query = query.where(gte(analyticsHistory.timestamp, new Date(startDate as string)));
      }

      if (endDate) {
        query = query.where(lte(analyticsHistory.timestamp, new Date(endDate as string)));
      }

      if (metrics) {
        const metricsList = (metrics as string).split(',');
        query = query.where(inArray(analyticsHistory.metricName, metricsList));
      }

      const history = await query;

      res.json(history);
    } catch (error) {
      console.error('Error fetching analytics history:', error);
      res.status(500).json({ error: 'Failed to fetch analytics history' });
    }
  });

  // Get analytics summary for dashboard
  app.get("/api/analytics/summary", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

    try {
      const [metrics] = await db
        .select({
          totalEngagement: marketingMetrics.totalEngagement,
          websiteVisits: marketingMetrics.websiteVisits,
          totalRevenue: marketingMetrics.totalRevenue,
          spotifyFollowers: marketingMetrics.spotifyFollowers,
          instagramFollowers: marketingMetrics.instagramFollowers,
          youtubeViews: marketingMetrics.youtubeViews
        })
        .from(marketingMetrics)
        .where(eq(marketingMetrics.userId, req.user!.id))
        .limit(1);

      const last30DaysHistory = await db
        .select()
        .from(analyticsHistory)
        .where(
          and(
            eq(analyticsHistory.userId, req.user!.id),
            gte(analyticsHistory.timestamp, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
          )
        )
        .orderBy(desc(analyticsHistory.timestamp));

      res.json({
        currentMetrics: metrics || {
          totalEngagement: 0,
          websiteVisits: 0,
          totalRevenue: 0,
          spotifyFollowers: 0,
          instagramFollowers: 0,
          youtubeViews: 0
        },
        history: last30DaysHistory
      });
    } catch (error) {
      console.error('Error fetching analytics summary:', error);
      res.status(500).json({ error: 'Failed to fetch analytics summary' });
    }
  });

  // Get all events for a user
  app.get("/api/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

    try {
      const userEvents = await db
        .select()
        .from(events)
        .where(eq(events.userId, req.user!.id))
        .orderBy(desc(events.startDate));

      res.json(userEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
      res.status(500).json({ error: 'Failed to fetch events' });
    }
  });

  // Update the events creation route
  app.post("/api/events", async (req, res) => {
    console.log('Create event request:', {
      body: req.body,
      user: req.user,
      isAuthenticated: req.isAuthenticated()
    });

    if (!req.isAuthenticated()) {
      console.log('User not authenticated');
      return res.status(401).json({ error: "Authentication required" });
    }

    try {
      if (!req.body.title || !req.body.startDate || !req.body.endDate || !req.body.location) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const eventData = {
        ...req.body,
        userId: req.user!.id,
        startDate: new Date(req.body.startDate),
        endDate: new Date(req.body.endDate),
        status: req.body.status || 'upcoming',
        type: req.body.type || 'other'
      };

      console.log('Attempting to create event with data:', eventData);

      const [event] = await db
        .insert(events)
        .values(eventData)
        .returning();

      if (!event) {
        throw new Error('Failed to create event in database');
      }

      console.log('Event created successfully:', event);
      res.status(201).json(event);
    } catch (error: any) {
      console.error('Error creating event:', error);
      res.status(400).json({
        error: error.message || "Failed to create event",
        details: error
      });
    }
  });

  // Delete an event
  app.delete("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

    try {
      const [deletedEvent] = await db
        .delete(events)
        .where(
          and(
            eq(events.id, parseInt(req.params.id)),
            eq(events.userId, req.user!.id)
          )
        )
        .returning();

      if (!deletedEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json({ message: 'Event deleted successfully' });
    } catch (error) {
      console.error('Error deleting event:', error);
      res.status(500).json({ error: 'Failed to delete event' });
    }
  });

  // Update an event
  app.patch("/api/events/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "Authentication required" });

    try {
      const [updatedEvent] = await db
        .update(events)
        .set({
          ...req.body,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(events.id, parseInt(req.params.id)),
            eq(events.userId, req.user!.id)
          )
        )
        .returning();

      if (!updatedEvent) {
        return res.status(404).json({ error: 'Event not found' });
      }

      res.json(updatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      res.status(500).json({ error: 'Failed to update event' });
    }
  });

  // When a course is completed, award the achievement
  app.post("/api/courses/:courseId/complete", authenticate, async (req, res) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    try {
      const courseId = parseInt(req.params.courseId);

      // Update course enrollment status
      await db
        .update(courseEnrollments)
        .set({
          status: 'completed',
          completedAt: new Date(),
          progress: 100
        })
        .where(
          and(
            eq(courseEnrollments.courseId, courseId),
            eq(courseEnrollments.userId, req.user.id)
          )
        );

      // Award achievement
      await awardCourseCompletionAchievement(req.user.id, courseId);

      res.json({ message: 'Course completed successfully' });
    } catch (error) {
      console.error('Error completing course:', error);
      res.status(500).json({ error: 'Failed to complete course' });
    }
  });

  // Endpoint de API para verificación de salud sin interferir con el enrutamiento de frontend
  // Importante: SOLO definimos endpoints que comiencen con '/api' para evitar conflictos
  app.get('/api/status', (req, res) => {
    res.status(200).json({
      status: "online",
      message: "Boostify Music API is running",
      timestamp: new Date().toISOString()
    });
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.status(200).json({ 
      status: "healthy",
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString()
    });
  });
  
  // Eliminamos completamente el manejador de ruta raíz '/'
  // Esto permite que Vite se encargue correctamente de servir la aplicación frontend
  // en modo desarrollo, y en producción se manejará a través de la configuración en server/index.ts

  // Deployment verification endpoint
  app.get("/api/deployment-info", (_req, res) => {
    res.status(200).json({
      status: "online",
      version: "1.0.0",
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      serverPath: __dirname
    });
  });

  /**
   * Endpoint para generar videos con PiAPI/Hailuo
   * Conecta el frontend con el endpoint del proxy
   */
  app.post('/api/video/generate', async (req, res) => {
    try {
      console.log('Recibiendo solicitud de generación de video:', req.body);
      
      // Preparar los parámetros para enviar al proxy
      const apiProvider = req.body.apiProvider;
      
      if (apiProvider === 'piapi') {
        // Preparar parámetros para PiAPI - manejo de nombres de parámetros esperados
        // Extraer el modelo del piapiModel si existe, o usar el campo model, o fallback a t2v-01
        const model = req.body.piapiModel || req.body.model || 't2v-01';
        
        // Extrae los movimientos de cámara que pueden venir en formato array o string
        let cameraMovement = null;
        if (req.body.cameraMovements && Array.isArray(req.body.cameraMovements)) {
          // Si es un array (formato del frontend), lo convertimos a string separado por comas
          cameraMovement = req.body.cameraMovements.join(',');
        } else if (req.body.camera_movement) {
          // Si ya viene como string (camera_movement), lo usamos directamente
          cameraMovement = req.body.camera_movement;
        }
        
        const proxyReq = {
          prompt: req.body.prompt,
          model: model,
          camera_movement: cameraMovement,
          image_url: req.body.image_url
        };
        
        console.log('Enviando solicitud al proxy con parámetros:', proxyReq);
        
        // Realizar la solicitud al proxy interno
        const proxyRes = await axios.post(
          `${req.protocol}://${req.get('host')}/api/proxy/piapi/video/start`,
          proxyReq
        );
        
        // Verificar si la respuesta fue exitosa
        if (proxyRes.data.success) {
          // La generación se inició correctamente, devolver el ID de tarea
          return res.json({
            success: true,
            taskId: proxyRes.data.taskId,
            provider: 'piapi',
            status: 'processing',
            // Para compatibilidad con el frontend actual, también devolvemos una URL temporal
            url: '/temp-processing.mp4'
          });
        } else {
          // Hubo un error en el proxy
          throw new Error(proxyRes.data.error || 'Error desconocido en el proxy de PiAPI');
        }
      } else {
        // Proveedores no soportados
        return res.status(400).json({
          success: false,
          error: `Proveedor no soportado: ${apiProvider}`
        });
      }
    } catch (error: any) {
      console.error('Error generando video:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  });
  
  /**
   * Endpoint específico para verificar el estado de tareas de generación de video
   * Esta ruta es pública y no requiere autenticación
   */
  app.get('/api/video/status', async (req, res) => {
    try {
      const { taskId, provider } = req.query;
      
      console.log('Procesando solicitud de estado de video:', { taskId, provider });
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID de la tarea'
        });
      }
      
      if (provider === 'piapi') {
        // Verificar estado en PiAPI
        console.log(`Verificando estado de tarea de video ${taskId} con proveedor ${provider}`);
        try {
          const proxyRes = await axios.get(
            `${req.protocol}://${req.get('host')}/api/proxy/piapi/video/status?taskId=${taskId}`
          );
          
          console.log('Respuesta de verificación de estado:', proxyRes.data);
          return res.json(proxyRes.data);
        } catch (proxyError) {
          console.error('Error al verificar estado en proxy:', proxyError);
          return res.status(500).json({
            success: false,
            error: 'Error al verificar estado de la tarea de video'
          });
        }
      } else if (provider === 'luma') {
        // Verificar estado en Luma
        try {
          const proxyRes = await axios.get(
            `${req.protocol}://${req.get('host')}/api/proxy/luma/status?taskId=${taskId}`
          );
          
          return res.json(proxyRes.data);
        } catch (proxyError) {
          return res.status(500).json({
            success: false,
            error: 'Error al verificar estado de la tarea en Luma'
          });
        }
      } else if (provider === 'kling') {
        // Verificar estado en Kling
        try {
          const proxyRes = await axios.get(
            `${req.protocol}://${req.get('host')}/api/proxy/kling/video/status?taskId=${taskId}`
          );
          
          return res.json(proxyRes.data);
        } catch (proxyError) {
          return res.status(500).json({
            success: false,
            error: 'Error al verificar estado de la tarea en Kling'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Proveedor no soportado: ${provider}`
        });
      }
    } catch (error: any) {
      console.error('Error al verificar estado de tarea de video:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  });
  
  /**
   * Endpoint general para verificar el estado de cualquier tarea asíncrona
   * Esta ruta también es pública y no requiere autenticación
   */
  app.get('/api/task/status', async (req, res) => {
    try {
      const { taskId, provider } = req.query;
      
      console.log('Procesando solicitud general de estado de tarea:', { taskId, provider });
      
      if (!taskId) {
        return res.status(400).json({
          success: false,
          error: 'Se requiere el ID de la tarea'
        });
      }
      
      // Redirigir a los endpoints específicos según el proveedor
      if (provider === 'piapi' || provider === 'luma' || provider === 'kling') {
        // Para proveedores de video, usar el endpoint de video
        try {
          const proxyUrl = `${req.protocol}://${req.get('host')}/api/video/status?taskId=${taskId}&provider=${provider}`;
          console.log(`Redirigiendo a endpoint de video: ${proxyUrl}`);
          const videoRes = await axios.get(proxyUrl);
          return res.json(videoRes.data);
        } catch (error) {
          console.error('Error al redirigir a endpoint de video:', error);
          return res.status(500).json({
            success: false,
            error: 'Error al verificar estado de la tarea de video'
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          error: `Proveedor no soportado o no especificado: ${provider}`
        });
      }
    } catch (error: any) {
      console.error('Error verificando estado de tarea:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error interno del servidor'
      });
    }
  });

  /**
   * Save Artist Profile Layout
   */
  app.post('/api/profile/:artistId/layout', async (req, res) => {
    try {
      const { artistId } = req.params;
      const { order, visibility } = req.body;

      if (!order || !visibility) {
        return res.status(400).json({
          success: false,
          error: 'Order and visibility are required'
        });
      }

      // Update layout in PostgreSQL
      await db.update(users)
        .set({
          profileLayout: { order, visibility },
          updatedAt: new Date()
        })
        .where(eq(users.id, parseInt(artistId)));

      console.log('✅ Profile layout saved for artist:', artistId);

      return res.json({
        success: true,
        message: 'Layout saved successfully'
      });
    } catch (error: any) {
      console.error('❌ Error saving profile layout:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save layout'
      });
    }
  });

  /**
   * Early Access Signup - Send to Make.com webhook
   */
  app.post('/api/early-access/signup', async (req, res) => {
    try {
      const { name, artistName, phone, email } = req.body;
      
      // Validate input
      if (!name || !artistName || !phone || !email) {
        return res.status(400).json({
          success: false,
          error: 'All fields are required'
        });
      }

      // Send to Make.com webhook
      const webhookUrl = 'https://hook.us2.make.com/fdp25ml6h3r5781gocrujzqyuenp8ms6';
      
      await axios.post(webhookUrl, {
        name,
        artistName,
        phone,
        email,
        timestamp: new Date().toISOString()
      });

      console.log('✅ Early access signup sent to webhook:', { name, artistName, email });

      return res.json({
        success: true,
        message: 'Successfully registered for early access'
      });
    } catch (error: any) {
      console.error('❌ Error sending early access signup to webhook:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to register for early access'
      });
    }
  });

  const httpServer = createServer(app);
  
  // Configurar timeouts largos para soportar transcripciones de audio largas
  // Timeout de 15 minutos (900000ms) para permitir procesamiento de archivos grandes
  httpServer.timeout = 900000; // 15 minutos
  httpServer.keepAliveTimeout = 900000; // 15 minutos
  httpServer.headersTimeout = 910000; // 15 minutos + 10 segundos
  
  console.log('⏱️ Server timeouts configured: 15 minutes for long-running operations');
  
  return httpServer;
}