import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { bookings, payments } from '../db/schema';
import { eq } from 'drizzle-orm';
import { NotificationTemplates } from '../utils/notifications';

const router = Router();

// Inicializar Stripe con la clave secreta (usar testing key si está disponible)
const stripeKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey!, {
  apiVersion: '2025-01-27.acacia' as any, // Usar la última versión de la API
});

console.log('🔑 Using Stripe key:', stripeKey ? (stripeKey.startsWith('sk_test_') ? 'TEST MODE' : 'LIVE MODE') : 'NOT FOUND');

/**
 * URL base para redirecciones de Stripe
 * En producción, esta URL debería ser configurable y apuntar al dominio real
 */
const getBaseUrl = () => {
  // En producción, usar el dominio de producción
  if (process.env.NODE_ENV === 'production') {
    return 'https://boostify.replit.app';
  }
  
  // En desarrollo, construir la URL usando las variables de entorno de Replit
  const replId = process.env.REPL_ID;
  const replSlug = process.env.REPL_SLUG;
  const replOwner = process.env.REPL_OWNER;
  
  // Si tenemos REPLIT_DOMAINS (variable que contiene el dominio actual), usarla
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    return `https://${domains[0]}`;
  }
  
  // Construir URL de desarrollo manualmente
  if (replSlug && replOwner) {
    return `https://${replSlug}.${replOwner}.repl.co`;
  }
  
  // Fallback a localhost si nada más funciona
  return 'http://localhost:5000';
};

const BASE_URL = getBaseUrl();
console.log('🔗 Stripe BASE_URL configurada:', BASE_URL);

/**
 * MUSIC VIDEO BUNDLES - Video + First Month Subscription Included
 * Each tier includes video generation + 1 month free subscription to Boostify tools
 */
interface TierConfig {
  name: string;
  price: number;
  videoModel: string;
  resolution: string;
  images: number;
  videos: number;
  lipsyncClips: number;
  regenerations: number;
  subscriptionTier: string;
  subscriptionValue: number;
  features: string[];
}

const MUSIC_VIDEO_TIERS: Record<string, TierConfig> = {
  essential: {
    name: 'ESSENTIAL',
    price: 99,
    videoModel: 'standard',
    resolution: '720p',
    images: 40,
    videos: 40,
    lipsyncClips: 15,
    regenerations: 1,
    subscriptionTier: 'starter',
    subscriptionValue: 19.99,
    features: [
      '40 unique AI-generated scenes',
      '720p HD quality',
      'Lip-sync on 15 close-up shots',
      'No watermark',
      'MP4 download',
      '1 free regeneration',
      '🎁 First month Boostify STARTER free ($19.99 value)',
      'Artist profile page',
      '500 contact database',
      'Instagram tools (20/month)',
      'YouTube tools (10/month)',
      'Spotify tools (10/month)'
    ]
  },
  gold: {
    name: 'GOLD',
    price: 149,
    videoModel: 'professional',
    resolution: '1080p',
    images: 40,
    videos: 40,
    lipsyncClips: 15,
    regenerations: 2,
    subscriptionTier: 'creator',
    subscriptionValue: 59.99,
    features: [
      '40 unique AI-generated scenes',
      '1080p Full HD quality',
      'Professional-grade video model',
      'Lip-sync on 15 close-up shots',
      'No watermark',
      'HD download',
      '2 free regenerations',
      'Email support',
      '🎁 First month Boostify CREATOR free ($59.99 value)',
      'PRO artist profile with analytics',
      '2,000 contact database',
      'Digital smart cards',
      'Instagram tools (50/month)',
      'YouTube tools (50/month)',
      'Spotify tools (30/month)',
      'Email campaigns (2/month)'
    ]
  },
  platinum: {
    name: 'PLATINUM',
    price: 249,
    videoModel: 'professional_plus',
    resolution: '1080p',
    images: 40,
    videos: 40,
    lipsyncClips: 40,
    regenerations: 3,
    subscriptionTier: 'pro',
    subscriptionValue: 99.99,
    features: [
      '40 unique AI-generated scenes',
      '1080p Full HD quality',
      'Premium video model',
      'Lip-sync on ALL 40 clips',
      'No watermark',
      'HD download',
      'Automatic color grading',
      '3 free regenerations',
      'Priority chat support',
      '🎁 First month Boostify PRO free ($99.99 value)',
      'PRO profile with video background',
      '5,000 contact database',
      'NFC smart cards',
      'Booking calendar',
      'Basic merchandise store',
      'Instagram tools (100/month)',
      'YouTube PRO tools (100/month + thumbnails)',
      'Spotify tools (100/month)',
      'Email campaigns (10/month)',
      'SMS campaigns (5/month)',
      'A/B testing tools'
    ]
  },
  diamond: {
    name: 'DIAMOND',
    price: 399,
    videoModel: 'premium_4k',
    resolution: '4K',
    images: 60,
    videos: 60,
    lipsyncClips: 60,
    regenerations: -1, // unlimited for 30 days
    subscriptionTier: 'enterprise',
    subscriptionValue: 149.99,
    features: [
      '60 unique AI-generated scenes (extended video)',
      '4K Ultra HD quality',
      'Premium video model + 4K upscaling',
      'Lip-sync on ALL 60 clips',
      '3 alternative visual concepts',
      'Director AI: 5 cinematic styles',
      'Professional color grading',
      'UNLIMITED regenerations (30 days)',
      'Multi-format export',
      '10x priority generation',
      'Dedicated account manager',
      '24/7 support',
      '🎁 First month Boostify ENTERPRISE free ($149.99 value)',
      'ENTERPRISE profile with custom domain',
      'UNLIMITED contact database',
      'Premium smart cards with analytics',
      'PRO booking calendar with payments',
      'Full merchandise store + fulfillment',
      'ALL tools UNLIMITED',
      'Multi-channel tracking',
      'Content Calendar AI',
      'Auto-optimization engine',
      'API access',
      'White-label options'
    ]
  }
};

/**
 * Mapeo de planes a IDs de precio en Stripe
 * Estos IDs deben coincidir con los configurados en el dashboard de Stripe
 */
const PLAN_PRICE_IDS = {
  'basic': 'price_1R0lay2LyFplWimfQxUL6Hn0',
  'pro': 'price_1R0laz2LyFplWimfsBd5ASoa',
  'premium': 'price_1R0lb12LyFplWimf7JpMynKA'
};

/**
 * Mapeo de IDs de precio a nombres de plan
 */
const PRICE_ID_TO_PLAN = {
  'price_1R0lay2LyFplWimfQxUL6Hn0': 'basic',
  'price_1R0laz2LyFplWimfsBd5ASoa': 'pro',
  'price_1R0lb12LyFplWimf7JpMynKA': 'premium'
};

/**
 * Music Video Bundle Price IDs (to be created in Stripe)
 * These are one-time payment bundles that include video + 1 month free subscription
 */
const MUSIC_VIDEO_BUNDLE_PRICE_IDS = {
  'essential': 'price_music_video_essential_99',
  'gold': 'price_music_video_gold_149',
  'platinum': 'price_music_video_platinum_249',
  'diamond': 'price_music_video_diamond_399'
};

/**
 * Subscription-only Price IDs (recurring monthly, for after free trial)
 */
const SUBSCRIPTION_PRICE_IDS = {
  'starter': 'price_subscription_starter_1999',
  'creator': 'price_subscription_creator_5999',
  'pro': 'price_subscription_pro_9999',
  'enterprise': 'price_subscription_enterprise_14999'
};

/**
 * Colección donde se guardan los productos disponibles
 */
const PRODUCTS_COLLECTION = 'products';

/**
 * Colección donde se guardan las compras de productos
 */
const PRODUCT_PURCHASES_COLLECTION = 'product_purchases';

/**
 * Crear una sesión de checkout para una nueva suscripción
 */
router.post('/create-subscription', authenticate, async (req: Request, res: Response) => {
  try {
    // Aceptar tanto priceId como planId para mayor compatibilidad
    const { priceId, planId } = req.body;
    const userId = req.user?.uid;
    
    // Usar el ID que venga, priorizando priceId (enviado desde el cliente)
    const selectedId = priceId || planId;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    // Si es un plan conocido, usar su priceId, de lo contrario usar el ID directamente
    const isKnownPlan = !!PLAN_PRICE_IDS[selectedId as keyof typeof PLAN_PRICE_IDS];
    
    if (!selectedId) {
      return res.status(400).json({ success: false, message: 'Plan o precio no especificado' });
    }

    // Buscar o crear cliente en Stripe usando el email del usuario autenticado
    const userEmail = req.user?.email;
    let customerId: string;
    
    // Si no hay email, usar un email placeholder basado en el UID
    const emailToUse = userEmail || `${userId}@placeholder.boostify.app`;
    
    console.log(`Creating Stripe customer for user ${userId} with email ${emailToUse}`);
    
    // Buscar cliente existente en Stripe por email o por metadata
    const existingCustomers = await stripe.customers.list({
      email: emailToUse,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Buscar por metadata si no se encontró por email
      const customersByMetadata = await stripe.customers.search({
        query: `metadata['firebaseUserId']:'${userId}'`,
        limit: 1
      });
      
      if (customersByMetadata.data.length > 0) {
        customerId = customersByMetadata.data[0].id;
      } else {
        // Crear un nuevo cliente en Stripe si no existe
        const customer = await stripe.customers.create({
          email: emailToUse,
          metadata: { firebaseUserId: userId }
        });
        
        customerId = customer.id;
      }
    }
    
    // Crear sesión de checkout
    // Determinar el precio a usar - si es un ID de precio directo o una clave de plan
    const priceToUse = isKnownPlan 
      ? PLAN_PRICE_IDS[selectedId as keyof typeof PLAN_PRICE_IDS] 
      : selectedId;
    
    const planKey = isKnownPlan ? selectedId : PRICE_ID_TO_PLAN[selectedId as keyof typeof PRICE_ID_TO_PLAN] || 'custom';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceToUse,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${BASE_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/subscription/cancelled`,
      metadata: {
        userId,
        planId: planKey
      },
      subscription_data: {
        metadata: {
          userId,
          planId: planKey
        }
      }
    });
    
    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('Error al crear sesión de checkout:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear sesión de checkout'
    });
  }
});

/**
 * Obtener el estado de la suscripción del usuario actual
 */
router.get('/subscription-status', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    
    // Obtener información del usuario de Firestore
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    
    // Si el usuario no tiene customerId, no tiene suscripción
    if (!userData?.stripeCustomerId) {
      return res.json({
        id: null,
        plan: null,
        currentPlan: 'free',
        status: null,
        active: false,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        priceId: null
      });
    }
    
    // Buscar suscripciones activas
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'active',
      expand: ['data.default_payment_method']
    });
    
    // Si no hay suscripciones activas, devolver plan gratuito
    if (subscriptions.data.length === 0) {
      return res.json({
        id: null,
        plan: null,
        currentPlan: 'free',
        status: null,
        active: false,
        cancelAtPeriodEnd: false,
        currentPeriodEnd: null,
        priceId: null
      });
    }
    
    // Obtener la primera suscripción activa
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    const plan = PRICE_ID_TO_PLAN[priceId as keyof typeof PRICE_ID_TO_PLAN] || 'free';
    
    // Devolver información de la suscripción
    res.json({
      id: subscription.id,
      plan: subscription.items.data[0].price.nickname || plan,
      currentPlan: plan,
      status: subscription.status,
      active: subscription.status === 'active',
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      priceId
    });
  } catch (error: any) {
    console.error('Error al obtener el estado de la suscripción:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al obtener el estado de la suscripción'
    });
  }
});

/**
 * Cancelar la suscripción actual
 */
router.post('/cancel-subscription', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    
    // Obtener información del usuario de Firestore
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    
    // Si el usuario no tiene customerId, no tiene suscripción para cancelar
    if (!userData?.stripeCustomerId) {
      return res.status(400).json({ success: false, message: 'No hay suscripción activa' });
    }
    
    // Buscar suscripciones activas
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'active'
    });
    
    // Si no hay suscripciones activas, no hay nada que cancelar
    if (subscriptions.data.length === 0) {
      return res.status(400).json({ success: false, message: 'No hay suscripción activa' });
    }
    
    // Obtener la primera suscripción activa
    const subscription = subscriptions.data[0];
    
    // Cancelar la suscripción al final del período actual
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true
    });
    
    res.json({ success: true, message: 'Suscripción cancelada correctamente' });
  } catch (error: any) {
    console.error('Error al cancelar la suscripción:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al cancelar la suscripción'
    });
  }
});

/**
 * Crear sesión del portal de Stripe para gestionar suscripción
 * Permite al usuario actualizar método de pago, ver facturas, cancelar suscripción, etc.
 */
router.post('/create-portal-session', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    
    // Obtener información del usuario de Firestore
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    
    // Si el usuario no tiene customerId, no puede acceder al portal
    if (!userData?.stripeCustomerId) {
      return res.status(400).json({ 
        success: false, 
        message: 'No tienes una suscripción activa para gestionar' 
      });
    }
    
    // Crear sesión del portal del cliente
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: userData.stripeCustomerId,
      return_url: `${BASE_URL}/profile`,
    });
    
    res.json({ 
      success: true, 
      url: portalSession.url 
    });
  } catch (error: any) {
    console.error('Error al crear sesión del portal:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear sesión del portal'
    });
  }
});

/**
 * Verificar si un video ha sido comprado por el usuario
 * Esta ruta permite al frontend saber si mostrar la versión completa o la previsualización
 */
router.get('/video-purchase-status/:videoId', authenticate, async (req: Request, res: Response) => {
  try {
    const { videoId } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    
    if (!videoId) {
      return res.status(400).json({ success: false, message: 'ID de video no especificado' });
    }
    
    // Verificar si el usuario ha comprado este video
    const purchasesRef = db.collection('purchases');
    const purchaseQuery = await purchasesRef
      .where('userId', '==', userId)
      .where('videoId', '==', videoId)
      .where('status', '==', 'completed')
      .get();
    
    // Determinar si el video fue comprado
    const isPurchased = !purchaseQuery.empty;
    
    res.json({
      success: true,
      isPurchased,
      videoId
    });
  } catch (error: any) {
    console.error('Error al verificar estado de compra del video:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al verificar estado de compra'
    });
  }
});

/**
 * Crear un pago único para un video musical
 * Esta ruta permite comprar el acceso completo a un video musical generado con IA
 */
router.post('/create-music-video-payment', authenticate, async (req: Request, res: Response) => {
  try {
    const { videoId } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    
    if (!videoId) {
      return res.status(400).json({ success: false, message: 'ID de video no especificado' });
    }
    
    // Buscar o crear cliente en Stripe usando el email del usuario autenticado
    const userEmail = req.user?.email;
    let customerId: string;
    
    if (!userEmail) {
      return res.status(400).json({ success: false, message: 'Email del usuario no disponible' });
    }
    
    // Buscar cliente existente en Stripe por email
    const existingCustomers = await stripe.customers.list({
      email: userEmail,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Buscar por metadata si no se encontró por email
      const customersByMetadata = await stripe.customers.search({
        query: `metadata['firebaseUserId']:'${userId}'`,
        limit: 1
      });
      
      if (customersByMetadata.data.length > 0) {
        customerId = customersByMetadata.data[0].id;
      } else {
        // Crear un nuevo cliente en Stripe si no existe
        const customer = await stripe.customers.create({
          email: emailToUse,
          metadata: { firebaseUserId: userId }
        });
        
        customerId = customer.id;
      }
    }
    
    // Verificar si el usuario ya ha comprado este video
    const purchasesRef = db.collection('purchases');
    const existingPurchase = await purchasesRef
      .where('userId', '==', userId)
      .where('videoId', '==', videoId)
      .where('status', '==', 'completed')
      .get();
    
    if (!existingPurchase.empty) {
      return res.json({
        success: true,
        alreadyPurchased: true,
        message: 'Este video ya ha sido comprado anteriormente'
      });
    }
    
    // Crear sesión de checkout para pago único
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: MUSIC_VIDEO_PRICE_ID,
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/music-video-success?session_id={CHECKOUT_SESSION_ID}&video_id=${videoId}`,
      cancel_url: `${BASE_URL}/music-video-cancelled?video_id=${videoId}`,
      metadata: {
        userId,
        videoId,
        type: 'music_video'
      }
    });
    
    // Crear un registro de la transacción pendiente
    await purchasesRef.add({
      userId,
      videoId,
      sessionId: session.id,
      amount: 199.00, // Precio fijo en USD
      currency: 'usd',
      status: 'pending',
      createdAt: new Date(),
      type: 'music_video'
    });
    
    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('Error al crear sesión de checkout para video:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear sesión de checkout'
    });
  }
});

/**
 * Crear un pago único para un booking de músico
 * Esta ruta permite reservar servicios de músicos con split de pagos
 * La plataforma cobra 20% de comisión y el músico recibe 80%
 */
router.post('/create-musician-booking', authenticate, async (req: Request, res: Response) => {
  try {
    const {
      musicianId,
      musicianName,
      price,
      tempo,
      musicalKey,
      style,
      projectDeadline,
      additionalNotes
    } = req.body;
    
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    
    if (!musicianId) {
      return res.status(400).json({ success: false, message: 'ID de músico no especificado' });
    }
    
    if (!price || price <= 0) {
      return res.status(400).json({ success: false, message: 'Precio inválido' });
    }
    
    // Calcular la comisión de la plataforma (20%) y el monto del músico (80%)
    const totalAmount = parseFloat(price);
    const platformFee = totalAmount * 0.20; // 20% para la plataforma
    const musicianAmount = totalAmount * 0.80; // 80% para el músico
    
    console.log(`💰 Booking - Total: $${totalAmount}, Platform fee: $${platformFee}, Musician: $${musicianAmount}`);
    
    // TODO: Aquí deberías buscar el userId de PostgreSQL basado en el userId de Firebase
    // Por ahora usaremos un valor temporal
    const tempUserId = 1; // Esto debe ser reemplazado con la búsqueda real del user.id
    
    // Crear el booking en la base de datos
    const [booking] = await db.insert(bookings).values({
      userId: tempUserId,
      musicianId,
      price: totalAmount.toFixed(2),
      currency: 'usd',
      tempo,
      musicalKey,
      style,
      projectDeadline: projectDeadline ? new Date(projectDeadline) : null,
      additionalNotes,
      status: 'pending',
      paymentStatus: 'pending'
    }).returning();
    
    console.log(`📝 Booking creado con ID: ${booking.id}`);
    
    // Buscar o crear cliente en Stripe
    const userEmail = req.user?.email;
    let customerId: string;
    
    const emailToUse = userEmail || `${userId}@placeholder.boostify.app`;
    
    // Buscar cliente existente
    const existingCustomers = await stripe.customers.list({
      email: emailToUse,
      limit: 1
    });
    
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      // Crear nuevo cliente
      const customer = await stripe.customers.create({
        email: emailToUse,
        metadata: { firebaseUserId: userId }
      });
      customerId = customer.id;
    }
    
    // Crear sesión de checkout para el pago
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Booking con ${musicianName || 'Músico'}`,
              description: `Servicio de ${style || 'música'} - Sesión profesional`
            },
            unit_amount: Math.round(totalAmount * 100) // Convertir a centavos
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/booking-success?session_id={CHECKOUT_SESSION_ID}&booking_id=${booking.id}`,
      cancel_url: `${BASE_URL}/booking-cancelled?booking_id=${booking.id}`,
      metadata: {
        userId,
        bookingId: booking.id.toString(),
        musicianId,
        type: 'musician_booking',
        platformFee: platformFee.toFixed(2),
        musicianAmount: musicianAmount.toFixed(2)
      }
    });
    
    // Crear registro de pago pendiente
    await db.insert(payments).values({
      bookingId: booking.id,
      stripePaymentIntentId: session.payment_intent as string || 'pending',
      stripeCheckoutSessionId: session.id,
      amount: totalAmount.toFixed(2),
      platformFee: platformFee.toFixed(2),
      musicianAmount: musicianAmount.toFixed(2),
      currency: 'usd',
      status: 'pending'
    });
    
    console.log(`✅ Sesión de checkout creada: ${session.id}`);
    
    res.json({ success: true, url: session.url, bookingId: booking.id });
  } catch (error: any) {
    console.error('Error al crear booking de músico:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear booking'
    });
  }
});

/**
 * Crear un pago único para un producto de la tienda
 * Esta ruta permite comprar productos como bots de automatización o aplicaciones móviles
 * Versión pública que también funciona sin autenticación
 */
router.post('/create-product-payment', async (req: Request, res: Response) => {
  try {
    const { productId, productType, amount, name } = req.body;
    let userId = null;
    
    // Intentar obtener el ID de usuario si está autenticado
    if (req.user && req.user.uid) {
      userId = req.user.uid;
    }
    
    // Si no hay usuario autenticado, continuamos con el flujo de checkout público
    // No es necesario bloquear; cualquiera puede comprar como invitado
    
    if (!productId) {
      return res.status(400).json({ success: false, message: 'ID de producto no especificado' });
    }

    if (!amount) {
      return res.status(400).json({ success: false, message: 'Precio del producto no especificado' });
    }
    
    if (!name) {
      return res.status(400).json({ success: false, message: 'Nombre del producto no especificado' });
    }
    
    // Variable para almacenar el ID de cliente de Stripe y los datos del usuario
    let customerId = null;
    let userData = null;
    
    // Solo intentar obtener información del usuario si está autenticado
    if (userId) {
      // Obtener información del usuario de Firestore
      const userSnap = await db.collection('users').doc(userId).get();
      userData = userSnap.data();
      
      // Verificar si el usuario ya tiene un customerID en Stripe
      customerId = userData?.stripeCustomerId;
      
      if (!customerId) {
        // Crear un nuevo cliente en Stripe si no existe
        const customer = await stripe.customers.create({
          email: userData?.email || undefined,
          name: userData?.displayName || undefined,
          metadata: { firebaseUserId: userId }
        });
        
        customerId = customer.id;
        
        // Guardar el customerId en Firestore
        await db.collection('users').doc(userId).update({
          stripeCustomerId: customerId
        });
      }
    }
    // Para compras como invitado, no se requiere customerId ni registro de usuario
    
    // Verificar si el usuario ya ha comprado este producto (solo para usuarios autenticados)
    let alreadyPurchased = false;
    if (userId) {
      const purchasesRef = db.collection(PRODUCT_PURCHASES_COLLECTION);
      const existingPurchase = await purchasesRef
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('status', '==', 'completed')
        .get();
      
      alreadyPurchased = !existingPurchase.empty;
    }
    
    if (alreadyPurchased) {
      return res.json({
        success: true,
        alreadyPurchased: true,
        message: 'Este producto ya ha sido comprado anteriormente'
      });
    }
    
    // Convertir el precio a centavos para Stripe (Stripe trabaja con centavos)
    const amountInCents = Math.round(amount * 100);
    
    // Configuración para la sesión de checkout
    const sessionConfig: any = {
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: name,
              description: `Compra de ${productType || 'producto'} en Boostify Store`
            },
            unit_amount: amountInCents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/product-success?session_id={CHECKOUT_SESSION_ID}&product_id=${productId}`,
      cancel_url: `${BASE_URL}/product-cancelled?product_id=${productId}`,
      metadata: {
        productId,
        productType: productType || 'store_product',
        productName: name,
        type: 'store_product',
        guestPurchase: userId ? 'false' : 'true'  // Indicar si es una compra de invitado
      }
    };
    
    // Añadir customerId solo si el usuario está autenticado
    if (customerId) {
      sessionConfig.customer = customerId;
      sessionConfig.metadata.userId = userId;
    }
    
    // Crear sesión de checkout para pago único
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    // Crear un registro de la transacción pendiente
    const purchaseData = {
      productId,
      sessionId: session.id,
      amount,
      currency: 'usd',
      status: 'pending',
      createdAt: new Date(),
      type: productType || 'store_product',
      isGuestPurchase: !userId
    };
    
    // Solo añadir userId si existe (compra autenticada)
    if (userId) {
      purchaseData.userId = userId;
    }
    
    await db.collection(PRODUCT_PURCHASES_COLLECTION).add(purchaseData);
    
    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('Error al crear sesión de checkout para producto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear sesión de checkout'
    });
  }
});

/**
 * Verificar si un producto ha sido comprado por el usuario
 * Esta ruta permite al frontend saber si mostrar la compra o el botón de compra
 * Versión pública que también funciona sin autenticación
 */
router.get('/product-purchase-status/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    let userId = null;
    
    // Intentar obtener el ID de usuario si está autenticado
    if (req.user && req.user.uid) {
      userId = req.user.uid;
    }
    
    if (!productId) {
      return res.status(400).json({ success: false, message: 'ID de producto no especificado' });
    }
    
    // Verificar si el usuario ha comprado este producto
    let isPurchased = false;
    
    if (userId) {
      // Si hay usuario autenticado, buscar en sus compras
      const purchasesRef = db.collection(PRODUCT_PURCHASES_COLLECTION);
      const purchaseQuery = await purchasesRef
        .where('userId', '==', userId)
        .where('productId', '==', productId)
        .where('status', '==', 'completed')
        .get();
      
      isPurchased = !purchaseQuery.empty;
    }
    
    // Obtener información del producto para verificar si requiere autenticación
    const productRef = db.collection(PRODUCTS_COLLECTION).doc(productId);
    const productDoc = await productRef.get();
    
    // Si el producto no existe, asumimos que no requiere autenticación
    const requiresAuth = productDoc.exists ? (productDoc.data()?.requiresAuth || false) : false;
    
    // Un producto puede ser comprado como invitado si no requiere autenticación
    const canPurchaseAsGuest = !requiresAuth;
    
    res.json({
      success: true,
      isPurchased,
      productId,
      requiresAuth,
      canPurchaseAsGuest,
      message: canPurchaseAsGuest ? 'Puede proceder a la compra sin autenticación' : 'Se requiere autenticación para comprar este producto'
    });
  } catch (error: any) {
    console.error('Error al verificar estado de compra del producto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al verificar estado de compra'
    });
  }
});

/**
 * Activar suscripción manualmente después del checkout
 * Este endpoint se usa cuando no se puede usar webhook (desarrollo)
 */
router.post('/activate-subscription', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'sessionId requerido' });
    }
    
    // Obtener la sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid') {
      return res.status(400).json({ 
        success: false, 
        message: 'El pago no se ha completado' 
      });
    }
    
    // Activar la suscripción
    await handleSuccessfulSubscription(session);
    
    return res.json({ 
      success: true, 
      message: 'Suscripción activada exitosamente' 
    });
    
  } catch (error: any) {
    console.error('Error al activar suscripción:', error);
    return res.status(500).json({ 
      success: false, 
      message: error.message 
    });
  }
});

/**
 * Webhook para manejar eventos de pago de Stripe
 * Esta ruta recibe notificaciones de Stripe cuando se completan o fallan pagos
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  
  // Usar el webhook secret correspondiente al entorno
  const endpointSecret = process.env.NODE_ENV === 'production'
    ? process.env.STRIPE_WEBHOOK_SECRET
    : (process.env.STRIPE_WEBHOOK_SECRET_DEV || process.env.STRIPE_WEBHOOK_SECRET);
  
  if (!endpointSecret) {
    console.error('Webhook secret no configurado');
    return res.status(500).json({ success: false, message: 'Webhook secret no configurado' });
  }
  
  console.log(`🔔 Webhook recibido en modo ${process.env.NODE_ENV || 'development'}`);
  
  let event;
  
  try {
    // Verificar la firma del webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      endpointSecret
    );
  } catch (err: any) {
    console.error(`Error de firma: ${err.message}`);
    return res.status(400).json({ success: false, message: 'Error de firma' });
  }
  
  // Manejar diferentes tipos de eventos
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      
      // Determinar el tipo de pago (suscripción, video musical, producto o booking de músico)
      if (session.metadata.type === 'music_video') {
        await handleSuccessfulVideoPayment(session);
      } else if (session.metadata.type === 'store_product') {
        await handleSuccessfulProductPayment(session);
      } else if (session.metadata.type === 'musician_booking') {
        await handleSuccessfulMusicianBooking(session);
      } else {
        // Asumimos que es una suscripción si no tiene un tipo específico
        await handleSuccessfulSubscription(session);
      }
      break;
      
    case 'customer.subscription.deleted':
      const subscription = event.data.object;
      await handleCancelledSubscription(subscription);
      break;
  }
  
  res.json({ received: true });
});

/**
 * Manejar pago exitoso de suscripción
 * Actualiza Firestore con la información de la suscripción
 */
async function handleSuccessfulSubscription(session: any) {
  try {
    const { userId, planId } = session.metadata;
    
    if (!userId) {
      console.error('No se encontró userId en los metadatos de la sesión');
      return;
    }
    
    const plan = planId || 'basic';
    const subscriptionId = session.subscription;
    const customerId = session.customer;
    
    console.log(`✅ Procesando suscripción para usuario ${userId}, plan: ${plan}`);
    
    // Obtener detalles de la suscripción de Stripe
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
    
    const currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000);
    const currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000);
    
    // Crear documento de suscripción en Firestore
    const subscriptionData = {
      userId: userId,
      plan: plan,
      status: 'active',
      currentPeriodStart: currentPeriodStart,
      currentPeriodEnd: currentPeriodEnd,
      cancelAtPeriodEnd: false,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Guardar la suscripción en la colección 'subscriptions'
    const subscriptionRef = await db.collection('subscriptions').add(subscriptionData);
    
    console.log(`  📝 Suscripción creada en Firestore: ${subscriptionRef.id}`);
    
    // Actualizar o crear el documento user_subscriptions para vincular al usuario
    await db.collection('user_subscriptions').doc(userId).set({
      activeSubscriptionId: subscriptionRef.id,
      updatedAt: new Date()
    }, { merge: true });
    
    console.log(`  ✅ Usuario ${userId} ahora tiene acceso al plan ${plan}`);
    
    // Enviar notificación al usuario
    try {
      const tierName = plan.toUpperCase();
      const nextBillingDate = currentPeriodEnd.toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      await NotificationTemplates.subscriptionCreated(
        parseInt(userId), 
        tierName, 
        nextBillingDate
      );
    } catch (notifError) {
      console.error('Error enviando notificación de suscripción:', notifError);
    }
    
  } catch (error) {
    console.error('Error al procesar pago de suscripción:', error);
  }
}

/**
 * Manejar pago exitoso de video musical
 */
async function handleSuccessfulVideoPayment(session: any) {
  try {
    const { userId, videoId } = session.metadata;
    
    if (!userId || !videoId) {
      console.error('No se encontró userId o videoId en los metadatos de la sesión');
      return;
    }
    
    // Buscar la transacción pendiente por sessionId
    const purchasesRef = db.collection('purchases');
    const purchaseQuery = await purchasesRef
      .where('sessionId', '==', session.id)
      .limit(1)
      .get();
    
    if (purchaseQuery.empty) {
      console.error(`No se encontró transacción pendiente para sessionId ${session.id}`);
      
      // Crear un nuevo registro si no existe
      await purchasesRef.add({
        userId,
        videoId,
        sessionId: session.id,
        amount: session.amount_total / 100, // Convertir de centavos a dólares
        currency: session.currency,
        status: 'completed',
        completedAt: new Date(),
        createdAt: new Date(),
        type: 'music_video'
      });
      
      return;
    }
    
    // Actualizar el estado de la transacción a completado
    await purchasesRef.doc(purchaseQuery.docs[0].id).update({
      status: 'completed',
      completedAt: new Date()
    });
    
    console.log(`Compra de video ${videoId} completada para el usuario ${userId}`);
    
    // Enviar notificación al usuario
    try {
      const amount = session.amount_total / 100; // Convertir de centavos a dólares
      const tierName = session.metadata.tier || 'Music Video Bundle';
      await NotificationTemplates.paymentReceived(
        parseInt(userId),
        amount,
        `${tierName} - Video generado próximamente`
      );
    } catch (notifError) {
      console.error('Error enviando notificación de pago:', notifError);
    }
    
  } catch (error) {
    console.error('Error al procesar pago de video:', error);
  }
}

/**
 * Manejar pago exitoso de producto de la tienda
 */
async function handleSuccessfulProductPayment(session: any) {
  try {
    const { productId, guestPurchase } = session.metadata;
    let { userId } = session.metadata;
    
    if (!productId) {
      console.error('No se encontró productId en los metadatos de la sesión');
      return;
    }
    
    // Para compras de invitados, userId será null o undefined
    const isGuestPurchase = guestPurchase === 'true' || !userId;
    
    // Buscar la transacción pendiente por sessionId
    const purchasesRef = db.collection(PRODUCT_PURCHASES_COLLECTION);
    let purchaseQuery;
    
    if (isGuestPurchase) {
      // Para compras de invitados, buscar solo por sessionId y productId
      purchaseQuery = await purchasesRef
        .where('sessionId', '==', session.id)
        .where('productId', '==', productId)
        .limit(1)
        .get();
    } else {
      // Para compras autenticadas, incluir userId en la búsqueda
      purchaseQuery = await purchasesRef
        .where('sessionId', '==', session.id)
        .where('userId', '==', userId)
        .limit(1)
        .get();
    }
    
    if (purchaseQuery.empty) {
      console.log(`No se encontró transacción pendiente para sessionId ${session.id}, creando nuevo registro`);
      
      // Crear un nuevo registro si no existe
      const newPurchaseData = {
        productId,
        sessionId: session.id,
        amount: session.amount_total / 100, // Convertir de centavos a dólares
        currency: session.currency,
        status: 'completed',
        completedAt: new Date(),
        createdAt: new Date(),
        type: session.metadata.productType || 'store_product',
        isGuestPurchase: isGuestPurchase
      };
      
      // Solo añadir userId si no es una compra de invitado
      if (!isGuestPurchase && userId) {
        newPurchaseData.userId = userId;
      }
      
      await purchasesRef.add(newPurchaseData);
      return;
    }
    
    // Actualizar el estado de la transacción a completado
    await purchasesRef.doc(purchaseQuery.docs[0].id).update({
      status: 'completed',
      completedAt: new Date()
    });
    
    const userIdForLog = isGuestPurchase ? "invitado" : userId;
    console.log(`Compra de producto ${productId} completada para ${userIdForLog}`);
  } catch (error) {
    console.error('Error al procesar pago de producto:', error);
  }
}

/**
 * Manejar pago exitoso de booking de músico
 * Actualiza el booking y el pago en PostgreSQL con los detalles de la comisión
 */
async function handleSuccessfulMusicianBooking(session: any) {
  try {
    const { bookingId, userId, musicianId, platformFee, musicianAmount } = session.metadata;
    
    if (!bookingId) {
      console.error('No se encontró bookingId en los metadatos de la sesión');
      return;
    }
    
    console.log(`💰 Procesando pago exitoso de booking #${bookingId}`);
    console.log(`   Total: $${session.amount_total / 100}`);
    console.log(`   Platform fee (20%): $${platformFee}`);
    console.log(`   Musician amount (80%): $${musicianAmount}`);
    
    // Buscar el payment pendiente por sessionId
    const [payment] = await db
      .select()
      .from(payments)
      .where(eq(payments.stripeCheckoutSessionId, session.id))
      .limit(1);
    
    if (!payment) {
      console.log(`No se encontró payment pendiente para sessionId ${session.id}, creando nuevo registro`);
      
      // Crear un nuevo registro si no existe
      await db.insert(payments).values({
        bookingId: parseInt(bookingId),
        stripePaymentIntentId: session.payment_intent as string,
        stripeCheckoutSessionId: session.id,
        amount: (session.amount_total / 100).toFixed(2),
        platformFee: platformFee,
        musicianAmount: musicianAmount,
        currency: session.currency,
        status: 'completed'
      });
    } else {
      // Actualizar el payment existente
      await db
        .update(payments)
        .set({
          stripePaymentIntentId: session.payment_intent as string,
          status: 'completed'
        })
        .where(eq(payments.id, payment.id));
    }
    
    // Actualizar el booking
    await db
      .update(bookings)
      .set({
        status: 'confirmed',
        paymentStatus: 'paid'
      })
      .where(eq(bookings.id, parseInt(bookingId)));
    
    console.log(`✅ Booking #${bookingId} confirmado y pago procesado exitosamente`);
    console.log(`   Musician ID: ${musicianId}`);
    console.log(`   Platform earned: $${platformFee}`);
    console.log(`   Musician will receive: $${musicianAmount}`);
  } catch (error) {
    console.error('Error al procesar pago de booking de músico:', error);
  }
}

/**
 * Manejar cancelación de suscripción
 * Nota: No usamos Firestore del servidor. El cliente consultará directamente a Stripe.
 */
async function handleCancelledSubscription(subscription: any) {
  try {
    const { userId } = subscription.metadata;
    const customerId = subscription.customer;
    
    // Registrar el evento (Stripe mantiene el estado de la suscripción)
    console.log(`❌ Suscripción cancelada`);
    console.log(`   Subscription ID: ${subscription.id}`);
    console.log(`   Customer ID: ${customerId}`);
    if (userId) {
      console.log(`   User ID: ${userId}`);
    }
    console.log(`   ℹ️ El cliente consultará el estado directamente desde Stripe`);
    
    // No se necesita actualizar Firestore - el cliente usa Stripe como fuente de verdad
  } catch (error) {
    console.error('Error al procesar cancelación de suscripción:', error);
  }
}

/**
 * Get available music video tiers
 * Returns tier configurations for pricing page
 */
router.get('/music-video-tiers', (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      tiers: MUSIC_VIDEO_TIERS
    });
  } catch (error: any) {
    console.error('Error getting music video tiers:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error getting music video tiers'
    });
  }
});

/**
 * Create checkout session for music video bundle
 * Bundle includes: video generation + 1 month free subscription
 */
router.post('/create-music-video-bundle-checkout', authenticate, async (req: Request, res: Response) => {
  try {
    const { tier, songName, duration } = req.body;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!tier || !MUSIC_VIDEO_TIERS[tier]) {
      return res.status(400).json({ success: false, message: 'Invalid tier selected' });
    }

    const tierConfig = MUSIC_VIDEO_TIERS[tier];
    const userEmail = req.user?.email;
    const emailToUse = userEmail || `${userId}@placeholder.boostify.app`;

    // Find or create Stripe customer
    const existingCustomers = await stripe.customers.list({
      email: emailToUse,
      limit: 1
    });

    let customerId: string;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customersByMetadata = await stripe.customers.search({
        query: `metadata['firebaseUserId']:'${userId}'`,
        limit: 1
      });

      if (customersByMetadata.data.length > 0) {
        customerId = customersByMetadata.data[0].id;
      } else {
        const customer = await stripe.customers.create({
          email: emailToUse,
          metadata: { firebaseUserId: userId }
        });
        customerId = customer.id;
      }
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${tierConfig.name} Music Video Bundle`,
              description: `${tierConfig.resolution} music video + ${tierConfig.subscriptionTier.toUpperCase()} subscription (first month free)`,
              metadata: {
                tier,
                songName: songName || 'Music Video',
                duration: duration?.toString() || '0',
                videoModel: tierConfig.videoModel,
                subscriptionTier: tierConfig.subscriptionTier
              }
            },
            unit_amount: tierConfig.price * 100 // Convert to cents
          },
          quantity: 1
        }
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/music-video/success?session_id={CHECKOUT_SESSION_ID}&tier=${tier}`,
      cancel_url: `${BASE_URL}/music-video/cancelled`,
      metadata: {
        userId,
        tier,
        songName: songName || 'Music Video',
        duration: duration?.toString() || '0',
        bundleType: 'music_video',
        subscriptionTier: tierConfig.subscriptionTier,
        subscriptionValue: tierConfig.subscriptionValue.toString()
      }
    });

    res.json({ 
      success: true, 
      url: session.url,
      sessionId: session.id
    });
  } catch (error: any) {
    console.error('Error creating music video bundle checkout:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating checkout session'
    });
  }
});

export default router;