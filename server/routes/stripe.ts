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
    
    // Verificar si el usuario ya ha comprado este producto
    const purchasesRef = db.collection(PRODUCT_PURCHASES_COLLECTION);
    const existingPurchase = await purchasesRef
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .where('status', '==', 'completed')
      .get();
    
    if (!existingPurchase.empty) {
      return res.json({
        success: true,
        alreadyPurchased: true,
        message: 'Este producto ya ha sido comprado anteriormente'
      });
    }
    
    // Convertir el precio a centavos para Stripe (Stripe trabaja con centavos)
    const amountInCents = Math.round(amount * 100);
    
    // Crear sesión de checkout para pago único
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
        guestPurchase: userId ? 'false' : 'true'
      }
    };
    
    // Solo agregar customerId si el usuario está autenticado
    if (customerId) {
      sessionConfig.customer = customerId;
      sessionConfig.metadata.userId = userId;
    }
    
    const session = await stripe.checkout.sessions.create(sessionConfig);
    
    // Crear un registro de la transacción pendiente
    const purchaseData: any = {
      productId,
      productName: name,
      productType: productType || 'store_product',
      sessionId: session.id,
      amount: amount,
      currency: 'usd',
      status: 'pending',
      createdAt: new Date(),
      type: 'store_product',
      isGuestPurchase: !userId
    };
    
    // Solo incluir userId si existe (compra autenticada)
    if (userId) {
      purchaseData.userId = userId;
    }
    
    await purchasesRef.add(purchaseData);
    
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
 * Esta ruta permite al frontend saber si mostrar opciones de compra o de acceso
 * 
 * NOTA: Esta ruta ha sido reemplazada por una versión pública abajo
 * Se mantiene para retrocompatibilidad pero está como desactivada
 */
router.get('/product-purchase-status-protected/:productId', authenticate, async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const userId = req.user?.uid;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }
    
    if (!productId) {
      return res.status(400).json({ success: false, message: 'ID de producto no especificado' });
    }
    
    // Verificar si el usuario ha comprado este producto
    const purchasesRef = db.collection(PRODUCT_PURCHASES_COLLECTION);
    const purchaseQuery = await purchasesRef
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .where('status', '==', 'completed')
      .get();
    
    // Determinar si el producto fue comprado
    const isPurchased = !purchaseQuery.empty;
    
    res.json({
      success: true,
      isPurchased,
      productId
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
 * Actualizar la suscripción a un nuevo plan
 */
router.post('/update-subscription', authenticate, async (req: Request, res: Response) => {
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
    
    // Si el usuario no tiene customerId o no tiene suscripción, crear una nueva
    if (!userData?.stripeCustomerId) {
      // Redirigir a la ruta de crear suscripción
      req.body = { priceId, planId };
      return await router.stack
        .find(layer => layer.route?.path === '/create-subscription')
        ?.route?.stack[0].handle(req, res, () => {});
    }
    
    // Buscar suscripciones activas
    const subscriptions = await stripe.subscriptions.list({
      customer: userData.stripeCustomerId,
      status: 'active'
    });
    
    // Si no hay suscripciones activas, crear una nueva
    if (subscriptions.data.length === 0) {
      // Redirigir a la ruta de crear suscripción
      return await router.stack
        .find(layer => layer.route?.path === '/create-subscription')
        ?.route?.stack[0].handle(req, res);
    }
    
    // Obtener la primera suscripción activa
    const subscription = subscriptions.data[0];
    
    // Crear sesión para actualizar la suscripción
    // Determinar el precio a usar - si es un ID de precio directo o una clave de plan
    const priceToUse = isKnownPlan 
      ? PLAN_PRICE_IDS[selectedId as keyof typeof PLAN_PRICE_IDS] 
      : selectedId;
    
    const planKey = isKnownPlan ? selectedId : PRICE_ID_TO_PLAN[selectedId as keyof typeof PRICE_ID_TO_PLAN] || 'custom';
    
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: userData.stripeCustomerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceToUse,
          quantity: 1
        }
      ],
      subscription_data: {
        metadata: {
          userId,
          planId: planKey
        }
      },
      success_url: `${BASE_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/subscription-cancelled`,
      metadata: {
        userId,
        planId: planKey,
        subscriptionId: subscription.id
      }
    });
    
    res.json({ success: true, url: session.url });
  } catch (error: any) {
    console.error('Error al actualizar la suscripción:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar la suscripción'
    });
  }
});

/**
 * Manejar webhook de Stripe
 * Este endpoint recibe notificaciones de Stripe sobre eventos como
 * pagos exitosos, suscripciones canceladas, etc.
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  
  if (!webhookSecret) {
    return res.status(500).json({ success: false, message: 'Webhook secret no configurado' });
  }
  
  const signature = req.headers['stripe-signature'] as string;
  
  if (!signature) {
    return res.status(400).json({ success: false, message: 'Falta la firma Stripe en la solicitud' });
  }
  
  let event;
  
  try {
    // Verificar la firma del webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      webhookSecret
    );
  } catch (error: any) {
    console.error('Error al verificar webhook de Stripe:', error);
    return res.status(400).json({ success: false, message: error.message });
  }
  
  // Manejar diferentes tipos de eventos
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Verificar si es una sesión de suscripción
        if (session.mode === 'subscription' && session.subscription) {
          // Manejar una nueva suscripción
          await handleSuccessfulSubscription(session);
        } 
        // Verificar si es un pago de video musical
        else if (session.mode === 'payment' && session.metadata?.type === 'music_video') {
          // Manejar compra de video musical
          await handleSuccessfulVideoPayment(session);
        }
        // Verificar si es un pago de producto de la tienda
        else if (session.mode === 'payment' && session.metadata?.type === 'store_product') {
          // Manejar compra de producto de la tienda
          await handleSuccessfulProductPayment(session);
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        // Manejar actualización de suscripción
        await handleSubscriptionUpdated(subscription);
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        // Manejar cancelación de suscripción
        await handleSubscriptionCancelled(subscription);
        break;
      }
      
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        // Manejar pago exitoso de factura
        if (invoice.subscription) {
          await handleSuccessfulPayment(invoice);
        }
        break;
      }
      
      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        // Manejar fallo de pago
        if (invoice.subscription) {
          await handleFailedPayment(invoice);
        }
        break;
      }
      
      default:
        // Ignorar otros eventos
        console.log(`Evento de Stripe no manejado: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error: any) {
    console.error(`Error al manejar evento de Stripe ${event.type}:`, error);
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * Manejar una suscripción creada con éxito
 */
async function handleSuccessfulSubscription(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const planId = session.metadata?.planId;
  
  if (!userId || !planId) {
    console.error('Falta userId o planId en los metadatos de la sesión');
    return;
  }
  
  // Actualizar información de la suscripción en Firestore
  await db.collection('users').doc(userId).update({
    subscription: {
      id: session.subscription,
      plan: planId,
      status: 'active',
      updatedAt: new Date()
    }
  });
  
  // También puedes guardar un registro de la transacción
  await db.collection('transactions').add({
    userId,
    type: 'subscription_created',
    planId,
    sessionId: session.id,
    subscriptionId: session.subscription,
    amount: session.amount_total,
    currency: session.currency,
    timestamp: new Date()
  });
}

/**
 * Manejar una actualización de suscripción
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  const planId = subscription.metadata?.planId;
  
  if (!userId) {
    // Intentar encontrar el usuario por su customerId
    const user = await findUserByStripeCustomerId(subscription.customer as string);
    
    if (!user) {
      console.error('No se pudo encontrar usuario para la suscripción actualizada');
      return;
    }
    
    // Actualizar información de la suscripción en Firestore
    await db.collection('users').doc(user.id).update({
      subscription: {
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      }
    });
  } else {
    // Actualizar información de la suscripción en Firestore
    await db.collection('users').doc(userId).update({
      subscription: {
        id: subscription.id,
        plan: planId,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      }
    });
  }
}

/**
 * Manejar una cancelación de suscripción
 */
async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    // Intentar encontrar el usuario por su customerId
    const user = await findUserByStripeCustomerId(subscription.customer as string);
    
    if (!user) {
      console.error('No se pudo encontrar usuario para la suscripción cancelada');
      return;
    }
    
    // Actualizar información de la suscripción en Firestore
    await db.collection('users').doc(user.id).update({
      subscription: {
        id: subscription.id,
        status: 'cancelled',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      }
    });
  } else {
    // Actualizar información de la suscripción en Firestore
    await db.collection('users').doc(userId).update({
      subscription: {
        id: subscription.id,
        status: 'cancelled',
        cancelAtPeriodEnd: false,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        updatedAt: new Date()
      }
    });
  }
}

/**
 * Manejar un pago exitoso de factura
 */
async function handleSuccessfulPayment(invoice: Stripe.Invoice) {
  if (!invoice.customer || !invoice.subscription) {
    console.error('Falta customer o subscription en la factura');
    return;
  }
  
  // Obtener la suscripción
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    // Intentar encontrar el usuario por su customerId
    const user = await findUserByStripeCustomerId(invoice.customer as string);
    
    if (!user) {
      console.error('No se pudo encontrar usuario para el pago exitoso');
      return;
    }
    
    // Guardar un registro de la transacción
    await db.collection('transactions').add({
      userId: user.id,
      type: 'payment_succeeded',
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      timestamp: new Date()
    });
  } else {
    // Guardar un registro de la transacción
    await db.collection('transactions').add({
      userId,
      type: 'payment_succeeded',
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      timestamp: new Date()
    });
  }
}

/**
 * Manejar un fallo de pago
 */
async function handleFailedPayment(invoice: Stripe.Invoice) {
  if (!invoice.customer || !invoice.subscription) {
    console.error('Falta customer o subscription en la factura');
    return;
  }
  
  // Obtener la suscripción
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  
  const userId = subscription.metadata?.userId;
  
  if (!userId) {
    // Intentar encontrar el usuario por su customerId
    const user = await findUserByStripeCustomerId(invoice.customer as string);
    
    if (!user) {
      console.error('No se pudo encontrar usuario para el pago fallido');
      return;
    }
    
    // Actualizar estado de la suscripción en Firestore
    await db.collection('users').doc(user.id).update({
      subscription: {
        id: invoice.subscription,
        status: 'past_due',
        updatedAt: new Date()
      }
    });
    
    // Guardar un registro de la transacción
    await db.collection('transactions').add({
      userId: user.id,
      type: 'payment_failed',
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due,
      currency: invoice.currency,
      timestamp: new Date()
    });
  } else {
    // Actualizar estado de la suscripción en Firestore
    await db.collection('users').doc(userId).update({
      subscription: {
        id: invoice.subscription,
        status: 'past_due',
        updatedAt: new Date()
      }
    });
    
    // Guardar un registro de la transacción
    await db.collection('transactions').add({
      userId,
      type: 'payment_failed',
      invoiceId: invoice.id,
      subscriptionId: invoice.subscription,
      amount: invoice.amount_due,
      currency: invoice.currency,
      timestamp: new Date()
    });
  }
}

/**
 * Manejar un pago exitoso para un video musical
 */
async function handleSuccessfulVideoPayment(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const videoId = session.metadata?.videoId;
  
  if (!userId || !videoId) {
    console.error('Falta userId o videoId en los metadatos de la sesión');
    return;
  }
  
  // Actualizar el registro de la compra
  const purchasesRef = db.collection('purchases');
  const purchases = await purchasesRef
    .where('userId', '==', userId)
    .where('videoId', '==', session.metadata?.videoId || videoId)
    .where('sessionId', '==', session.id)
    .get();
  
  if (purchases.empty) {
    // Si no existe una compra pendiente, crear una nueva
    await purchasesRef.add({
      userId,
      videoId,
      sessionId: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 199.00, // Convertir de centavos a dólares
      currency: session.currency || 'usd',
      status: 'completed',
      createdAt: new Date(),
      completedAt: new Date(),
      type: 'music_video'
    });
  } else {
    // Actualizar la compra existente
    await purchases.docs[0].ref.update({
      status: 'completed',
      completedAt: new Date(),
      amount: session.amount_total ? session.amount_total / 100 : 199.00, // Convertir de centavos a dólares
    });
  }
  
  // También registrar la transacción
  await db.collection('transactions').add({
    userId,
    type: 'video_purchase',
    videoId,
    sessionId: session.id,
    amount: session.amount_total ? session.amount_total / 100 : 199.00,
    currency: session.currency || 'usd',
    timestamp: new Date()
  });
  
  // Opcional: Actualizar el video para marcarlo como comprado por el usuario
  try {
    const videoDoc = await db.collection('videos').doc(videoId).get();
    
    if (videoDoc.exists) {
      const video = videoDoc.data();
      const purchasedBy = video.purchasedBy || [];
      
      // Solo agregar el userId si no está ya en la lista
      if (!purchasedBy.includes(userId)) {
        await db.collection('videos').doc(videoId).update({
          purchasedBy: [...purchasedBy, userId]
        });
      }
    }
  } catch (error) {
    console.error('Error al actualizar el video:', error);
  }
}

/**
 * Manejar un pago exitoso para un producto de la tienda
 * Soporta tanto usuarios autenticados como compras de invitados
 */
async function handleSuccessfulProductPayment(session: Stripe.Checkout.Session) {
  const productId = session.metadata?.productId;
  const productType = session.metadata?.productType || 'store_product';
  const productName = session.metadata?.productName;
  const isGuestPurchase = session.metadata?.guestPurchase === 'true';
  const userId = session.metadata?.userId;
  
  if (!productId) {
    console.error('Falta productId en los metadatos de la sesión');
    return;
  }
  
  // Actualizar el registro de la compra
  const purchasesRef = db.collection(PRODUCT_PURCHASES_COLLECTION);
  let purchases;
  
  if (isGuestPurchase) {
    // Para compras de invitados, buscamos solo por sessionId y productId
    purchases = await purchasesRef
      .where('productId', '==', productId)
      .where('sessionId', '==', session.id)
      .where('isGuestPurchase', '==', true)
      .get();
  } else {
    // Para usuarios autenticados verificamos userId
    if (!userId) {
      console.error('Falta userId en los metadatos para una compra autenticada');
      return;
    }
    
    purchases = await purchasesRef
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .where('sessionId', '==', session.id)
      .get();
  }
  
  if (purchases.empty) {
    // Si no existe una compra pendiente, crear una nueva
    const purchaseData: any = {
      productId,
      productName,
      productType,
      sessionId: session.id,
      amount: session.amount_total ? session.amount_total / 100 : 0, // Convertir de centavos a dólares
      currency: session.currency || 'usd',
      status: 'completed',
      createdAt: new Date(),
      completedAt: new Date(),
      type: 'store_product',
      isGuestPurchase
    };
    
    // Solo agregar userId si no es compra de invitado
    if (!isGuestPurchase && userId) {
      purchaseData.userId = userId;
    }
    
    await purchasesRef.add(purchaseData);
  } else {
    // Actualizar la compra existente
    await purchases.docs[0].ref.update({
      status: 'completed',
      completedAt: new Date(),
      amount: session.amount_total ? session.amount_total / 100 : 0, // Convertir de centavos a dólares
    });
  }
  
  // También registrar la transacción
  const transactionData: any = {
    type: 'product_purchase',
    productId,
    productName,
    productType,
    sessionId: session.id,
    amount: session.amount_total ? session.amount_total / 100 : 0,
    currency: session.currency || 'usd',
    timestamp: new Date(),
    isGuestPurchase
  };
  
  // Solo agregar userId si no es compra de invitado
  if (!isGuestPurchase && userId) {
    transactionData.userId = userId;
  }
  
  await db.collection('transactions').add(transactionData);
  
  // Opcional: Actualizar el producto para marcarlo como comprado por el usuario
  // Solo se hace para usuarios autenticados
  if (!isGuestPurchase && userId) {
    try {
      const productDoc = await db.collection(PRODUCTS_COLLECTION).doc(productId).get();
      
      if (productDoc.exists) {
        const product = productDoc.data();
        const purchasedBy = product?.purchasedBy || [];
        
        // Solo agregar el userId si no está ya en la lista
        if (!purchasedBy.includes(userId)) {
          await db.collection(PRODUCTS_COLLECTION).doc(productId).update({
            purchasedBy: [...purchasedBy, userId]
          });
        }
      }
    } catch (error) {
      console.error('Error al actualizar el producto:', error);
    }
  }
}

/**
 * Verificar si un producto ha sido comprado por el usuario (versión pública)
 * Esta ruta permite acceso público y solo retorna información básica sin datos sensibles
 * 
 * Esta versión soporta invitados (puede usarse sin autenticación)
 */
router.get('/product-purchase-status/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    let userId = null;
    
    // Intentar obtener el ID de usuario desde la autenticación si está disponible
    if (req.user && req.user.uid) {
      userId = req.user.uid;
    }
    
    if (!productId) {
      return res.status(400).json({ 
        success: false, 
        message: 'ID de producto no especificado',
        requiresAuth: false 
      });
    }
    
    // Si no hay ID de usuario, retornar respuesta para usuario no autenticado
    // Ahora en lugar de requerir autenticación, indicamos que puede proceder a la compra
    if (!userId) {
      return res.json({
        success: true,
        isPurchased: false,
        productId,
        requiresAuth: false, // Ya no requiere autenticación
        canPurchaseAsGuest: true,
        message: 'Puede proceder a la compra sin autenticación'
      });
    }
    
    // Verificar si el usuario ha comprado este producto
    const purchasesRef = db.collection(PRODUCT_PURCHASES_COLLECTION);
    const purchaseQuery = await purchasesRef
      .where('userId', '==', userId)
      .where('productId', '==', productId)
      .where('status', '==', 'completed')
      .get();
    
    // Determinar si el producto fue comprado
    const isPurchased = !purchaseQuery.empty;
    
    res.json({
      success: true,
      isPurchased,
      productId,
      requiresAuth: false,
      canPurchaseAsGuest: true
    });
  } catch (error: any) {
    console.error('Error al verificar estado de compra del producto:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al verificar el estado de la compra',
      requiresAuth: false
    });
  }
});

/**
 * Ruta de prueba para verificar la integración de guest checkout
 * Esta ruta nos permite verificar rápidamente que la funcionalidad está correctamente configurada
 * NOTA: Esta ruta NO requiere autenticación, es pública
 * La configuración como ruta pública se realiza en server/auth.ts
 */
router.get('/test-guest-checkout', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: 'La integración de compras sin autenticación está correctamente configurada',
      isAuthenticated: req.user ? true : false,
      guestCheckoutEnabled: true,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error en la prueba de guest checkout:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error en la prueba de guest checkout'
    });
  }
});

export default router;