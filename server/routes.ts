import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupInstagramRoutes } from "./instagram";
import { setupSpotifyRoutes } from "./spotify";
import { setupOpenAIRoutes } from "./routes/openai";
import { setupEducationRoutes } from "./routes/education";
import { setupFilesRoutes } from "./routes/files";
import stripeRouter from "./routes/stripe";
import { setupVideosRoutes } from "./routes/videos";
import { setupEmailRoutes } from "./routes/email";
import { setupApifyRoutes } from "./routes/apify";
import { setupSocialNetworkRoutes } from "./routes/social-network.setup";
import { setupSubscriptionRoutes } from "./routes/subscription-protected-routes";
import firestoreSocialNetworkRouter from "./routes/firestore-social-network";
import { db } from "./db";
import { marketingMetrics, contracts, bookings, payments, analyticsHistory, events, courseEnrollments } from "./db/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import Stripe from 'stripe';
import { z } from "zod";
import express from 'express';
import passport from 'passport';
import axios from 'axios';
import session from 'express-session';
import OpenAI from "openai";
import { insertBookingSchema } from "./db/schema";
import translationRouter from './routes/translation';
import managerRouter from './routes/manager';
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
import { v4 as uuidv4 } from 'uuid'; // For generating unique IDs for tasks
import { authenticate } from './middleware/auth';
import { awardCourseCompletionAchievement } from './achievements';
import { Express, Server } from 'express';
import apiProxySecure from './routes/api-proxy-secure';;


if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-01-27.acacia' as any, // Actualizada marzo 2025
});

// Export the configured server
export function registerRoutes(app: Express): Server {
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
  
  // Initialize session middleware después de rutas públicas
  app.use(session({
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

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

  // Register translation routes
  app.use('/api', translationRouter);

  // Register video generation router (direct implementation)
  app.use('/api/video-generation', videoGenerationRouter);
  
  // Register video upscale router for final rendering with Qubico/video-toolkit
  app.use('/api/proxy/piapi/video-upscale', videoUpscaleRouter);

  app.use('/api/manager', managerRouter);
  app.use('/api/artist', artistRouter);

  // Configurar las rutas que NO requieren autenticación primero
  setupOpenAIRoutes(app);
  setupEducationRoutes(app);
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
  
  // Registrar rutas protegidas por control de acceso por suscripción
  // Servicios que requieren autenticación - después de definir todas las rutas públicas
  setupAuth(app);
  setupSpotifyRoutes(app);
  setupInstagramRoutes(app);
  setupVideosRoutes(app);
  setupEmailRoutes(app);
  setupApifyRoutes(app);
  setupSocialNetworkRoutes(app);
  app.use('/api/stripe', stripeRouter);
  
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

  const httpServer = createServer(app);
  return httpServer;
}