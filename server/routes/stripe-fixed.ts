import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';
import { findUserByStripeCustomerId } from '../utils/firestore-helpers';
import { db } from '../firebase';

const router = Router();

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-01-27.acacia' as any, // Usar la última versión de la API
});

/**
 * URL base para redirecciones de Stripe
 * En producción, esta URL debería ser configurable y apuntar al dominio real
 */
const BASE_URL = process.env.NODE_ENV === 'production'
  ? 'https://artistboost.replit.app'
  : 'https://workspace.replit.app';

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
 * ID del precio para la compra del video musical completo
 */
const MUSIC_VIDEO_PRICE_ID = 'price_1Rx28w2LyFplWimfQKxDIuZ3'; // Este ID se debe crear en Stripe

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

    // Obtener información del usuario de Firestore
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    
    // Verificar si el usuario ya tiene un customerID en Stripe
    let customerId = userData?.stripeCustomerId;
    
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
      success_url: `${BASE_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/subscription-cancelled`,
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
 * Crear payment intent para video musical completo ($199)
 */
router.post('/create-music-video-payment', authenticate, async (req: Request, res: Response) => {
  try {
    const { songName, duration, metadata } = req.body;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    if (!songName) {
      return res.status(400).json({ success: false, message: 'Nombre de canción requerido' });
    }

    // Obtener información del usuario de Firestore
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    
    // Verificar si el usuario ya tiene un customerID en Stripe
    let customerId = userData?.stripeCustomerId;
    
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
    
    // Crear sesión de checkout para pago único de $199
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Video Musical Completo - ${songName}`,
              description: 'Generación de video musical completo con IA para toda la canción',
            },
            unit_amount: 19900, // $199.00 en centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/music-video-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/music-video-cancelled`,
      metadata: {
        userId,
        songName,
        duration: duration?.toString() || '',
        productType: 'music_video_full',
        ...metadata
      },
    });
    
    res.json({ success: true, url: session.url, sessionId: session.id });
  } catch (error: any) {
    console.error('Error al crear sesión de pago de video musical:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al crear sesión de pago'
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
    
    // Obtener información del usuario de Firestore
    const userSnap = await db.collection('users').doc(userId).get();
    const userData = userSnap.data();
    
    // Verificar si el usuario ya tiene un customerID en Stripe
    let customerId = userData?.stripeCustomerId;
    
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
 * Webhook para manejar eventos de pago de Stripe
 * Esta ruta recibe notificaciones de Stripe cuando se completan o fallan pagos
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!endpointSecret) {
    console.error('Webhook secret no configurado');
    return res.status(500).json({ success: false, message: 'Webhook secret no configurado' });
  }
  
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
      
      // Determinar el tipo de pago (suscripción, video musical o producto)
      if (session.metadata.type === 'music_video') {
        await handleSuccessfulVideoPayment(session);
      } else if (session.metadata.type === 'store_product') {
        await handleSuccessfulProductPayment(session);
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
 */
async function handleSuccessfulSubscription(session: any) {
  try {
    const { userId, planId } = session.metadata;
    
    if (!userId) {
      console.error('No se encontró userId en los metadatos de la sesión');
      return;
    }
    
    // Actualizar plan del usuario en Firestore
    await db.collection('users').doc(userId).update({
      plan: planId || 'basic',
      subscriptionId: session.subscription,
      subscriptionStatus: 'active',
      subscriptionUpdatedAt: new Date()
    });
    
    console.log(`Suscripción actualizada para el usuario ${userId} al plan ${planId}`);
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
 * Manejar cancelación de suscripción
 */
async function handleCancelledSubscription(subscription: any) {
  try {
    const { userId } = subscription.metadata;
    
    if (!userId) {
      // Intentar encontrar el usuario por su customer ID
      const user = await findUserByStripeCustomerId(subscription.customer);
      
      if (!user) {
        console.error(`No se encontró el usuario para la suscripción ${subscription.id}`);
        return;
      }
      
      // Actualizar el estado de la suscripción en Firestore
      await db.collection('users').doc(user.id).update({
        subscriptionStatus: 'cancelled',
        subscriptionCancelledAt: new Date()
      });
      
      console.log(`Suscripción cancelada para el usuario ${user.id}`);
      return;
    }
    
    // Actualizar el estado de la suscripción en Firestore
    await db.collection('users').doc(userId).update({
      subscriptionStatus: 'cancelled',
      subscriptionCancelledAt: new Date()
    });
    
    console.log(`Suscripción cancelada para el usuario ${userId}`);
  } catch (error) {
    console.error('Error al procesar cancelación de suscripción:', error);
  }
}

export default router;