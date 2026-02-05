/**
 * Stripe Webhook Handler
 * 
 * Maneja eventos de Stripe para sincronizar suscripciones automáticamente
 * Eventos soportados:
 * - checkout.session.completed: Nueva suscripción creada
 * - customer.subscription.updated: Suscripción actualizada
 * - customer.subscription.deleted: Suscripción cancelada
 * - invoice.payment_succeeded: Pago exitoso
 * - invoice.payment_failed: Pago fallido
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { subscriptions, users, notifications, platformRevenue } from '../db/schema';
import { eq } from 'drizzle-orm';
import { PRICE_ID_TO_PLAN, isAdminEmail } from '../../shared/constants';

const router = Router();

// Inicializar Stripe
const stripeKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey!, {
  apiVersion: '2025-01-27.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Make webhook URL para enviar eventos de suscripción
const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/ow1m732j9t4mjmnod9cyahk6im7w6uet';

/**
 * Enviar evento a Make para que maneje los emails
 */
async function sendToMake(eventType: string, data: any) {
  try {
    const response = await fetch(MAKE_WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        event: eventType,
        timestamp: new Date().toISOString(),
        data: data
      })
    });

    if (!response.ok) {
      console.error(`❌ Error sending to Make: ${response.statusText}`);
    } else {
      console.log(`✅ Event sent to Make: ${eventType}`);
    }
  } catch (error) {
    console.error('❌ Error connecting to Make:', error);
  }
}

/**
 * Endpoint para recibir webhooks de Stripe
 * IMPORTANTE: Este endpoint debe usar raw body (no JSON parsed)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  
  if (!sig) {
    console.error('❌ Webhook Error: No signature provided');
    return res.status(400).send('Webhook Error: No signature');
  }
  
  if (!webhookSecret) {
    console.error('❌ Webhook Error: STRIPE_WEBHOOK_SECRET not configured');
    return res.status(500).send('Webhook Error: Server configuration error');
  }
  
  let event: Stripe.Event;
  
  try {
    // Verificar firma del webhook
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err);
    return res.status(400).send(`Webhook Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
  }
  
  console.log(`✅ Received webhook event: ${event.type}`);
  
  // Manejar diferentes tipos de eventos
  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
        
      default:
        console.log(`ℹ️ Unhandled event type: ${event.type}`);
    }
    
    res.json({ received: true });
  } catch (error) {
    console.error('❌ Error processing webhook:', error);
    res.status(500).send('Webhook processing error');
  }
});

/**
 * Mapear bundle tier a plan tier
 */
function mapBundleToPlan(bundleTier: string): 'free' | 'creator' | 'professional' | 'enterprise' {
  const mapping: Record<string, 'free' | 'creator' | 'professional' | 'enterprise'> = {
    'essential': 'creator',
    'gold': 'professional',
    'platinum': 'enterprise',
    'diamond': 'enterprise'
  };
  return mapping[bundleTier] || 'free';
}

/**
 * Manejar checkout completado (nueva suscripción O bundle)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Processing checkout.session.completed:', session.id);
  
  const { customer, subscription: subscriptionId, client_reference_id, metadata } = session;
  
  // Verificar si es un bundle de music video (metadata.type = 'music_video_bundle')
  const isMusicVideoBundle = metadata?.type === 'music_video_bundle';
  const bundleTier = metadata?.tier;
  
  if (isMusicVideoBundle && bundleTier) {
    console.log(`🎵 Processing music video bundle purchase: ${bundleTier}`);
    
    // Buscar usuario
    const userEmail = session.customer_details?.email;
    const userId = client_reference_id ? parseInt(client_reference_id) : null;
    
    let user;
    if (userId) {
      const users_result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
      user = users_result[0];
    } else if (userEmail) {
      const users_result = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
      user = users_result[0];
    }
    
    if (!user) {
      console.error('❌ User not found for bundle purchase:', userEmail || userId);
      return;
    }
    
    // Activar suscripción trial automáticamente según el bundle
    const planTier = mapBundleToPlan(bundleTier);
    const now = new Date();
    const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 días
    
    await db.insert(subscriptions).values({
      userId: user.id,
      plan: planTier,
      status: 'trialing',
      currentPeriodStart: now,
      currentPeriodEnd: trialEndDate,
      cancelAtPeriodEnd: false,
      interval: 'monthly',
      isTrial: true,
      trialEndsAt: trialEndDate,
      grantedByBundle: `${bundleTier}_bundle_${session.id}`,
      stripeCustomerId: customer as string
    });
    
    console.log(`✅ Music video bundle ${bundleTier} purchased! Trial subscription activated for user ${user.email}: ${planTier} (30 days)`);
    
    // Enviar notificación IN-APP
    await db.insert(notifications).values({
      userId: user.id,
      type: 'subscription_activated',
      title: `🎉 Welcome to ${planTier.charAt(0).toUpperCase() + planTier.slice(1)}!`,
      message: `Your ${bundleTier} bundle trial has been activated. You now have access to all features for 30 days.`,
      read: false,
      createdAt: new Date()
    }).catch(err => console.error('Error creating notification:', err));
    
    // Enviar a Make para email
    await sendToMake('subscription_activated', {
      userEmail: user.email,
      userName: user.artistName || user.email,
      planTier: planTier,
      bundleTier: bundleTier,
      trialDays: 30,
      type: 'bundle_trial'
    });
    
    return;
  }
  
  // Flujo normal de suscripción
  if (!subscriptionId || !customer) {
    console.log('⚠️ Checkout session without subscription or customer');
    return;
  }
  
  // Obtener datos completos de la suscripción
  const subscription = await stripe.subscriptions.retrieve(subscriptionId as string);
  
  // Determinar el tier del plan
  const priceId = subscription.items.data[0]?.price.id;
  const planTier = determinePlanTier(priceId);
  
  // Buscar usuario por email o client_reference_id
  const userEmail = session.customer_details?.email;
  const userId = client_reference_id ? parseInt(client_reference_id) : null;
  
  let user;
  if (userId) {
    const users_result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    user = users_result[0];
  } else if (userEmail) {
    const users_result = await db.select().from(users).where(eq(users.email, userEmail)).limit(1);
    user = users_result[0];
  }
  
  if (!user) {
    console.error('❌ User not found for subscription:', userEmail || userId);
    return;
  }
  
  // Determinar intervalo (monthly o yearly)
  const interval = subscription.items.data[0]?.price.recurring?.interval || 'monthly';
  
  // Crear o actualizar suscripción en la base de datos
  await db.insert(subscriptions).values({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customer as string,
    plan: planTier,
    status: subscription.status as any,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    interval: interval as 'monthly' | 'yearly',
    price: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
    currency: subscription.currency,
    isTrial: subscription.status === 'trialing'
  }).onConflictDoUpdate({
    target: subscriptions.stripeSubscriptionId,
    set: {
      status: subscription.status as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date()
    }
  });
  
  console.log(`✅ Subscription created/updated for user ${user.email}: ${planTier}`);
  
  // Enviar notificación IN-APP
  await db.insert(notifications).values({
    userId: user.id,
    type: 'subscription_created',
    title: `✅ Payment Successful - Welcome to ${planTier.charAt(0).toUpperCase() + planTier.slice(1)}!`,
    message: `Your subscription has been activated. You now have access to all ${planTier} features until ${new Date(subscription.current_period_end * 1000).toLocaleDateString()}.`,
    read: false,
    createdAt: new Date()
  }).catch(err => console.error('Error creating notification:', err));

  // Enviar a Make para email
  await sendToMake('subscription_created', {
    userEmail: user.email,
    userName: user.artistName || user.email,
    planTier: planTier,
    priceAmount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
    currency: subscription.currency,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
    interval: interval
  });
}

/**
 * Manejar creación de suscripción
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('🆕 Processing customer.subscription.created:', subscription.id);
  
  const priceId = subscription.items.data[0]?.price.id;
  const planTier = determinePlanTier(priceId);
  const customer = subscription.customer as string;
  
  // Buscar usuario por Stripe Customer ID
  const users_result = await db.select().from(users).where(eq(users.stripeCustomerId, customer)).limit(1);
  const user = users_result[0];
  
  if (!user) {
    console.error('❌ User not found for customer:', customer);
    return;
  }
  
  const interval = subscription.items.data[0]?.price.recurring?.interval || 'monthly';
  
  await db.insert(subscriptions).values({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customer,
    plan: planTier,
    status: subscription.status as any,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    interval: interval as 'monthly' | 'yearly',
    price: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
    currency: subscription.currency,
    isTrial: subscription.status === 'trialing'
  }).onConflictDoUpdate({
    target: subscriptions.stripeSubscriptionId,
    set: {
      status: subscription.status as any,
      updatedAt: new Date()
    }
  });
  
  console.log(`✅ Subscription created for user ${user.email}`);
  
  // 💰 Registrar ingreso por suscripción en platformRevenue
  const subscriptionAmount = (subscription.items.data[0]?.price.unit_amount || 0) / 100;
  if (subscriptionAmount > 0) {
    try {
      await db.insert(platformRevenue).values({
        revenueType: 'subscription',
        amount: subscriptionAmount.toString(),
        currency: subscription.currency.toUpperCase(),
        sourceUserId: user.id,
        metadata: {
          stripeSubscriptionId: subscription.id,
          plan: planTier,
          interval: interval,
          priceId: priceId
        }
      });
      console.log(`💰 [REVENUE] Subscription revenue recorded: $${subscriptionAmount} for plan ${planTier}`);
    } catch (revError) {
      console.error('❌ Error recording subscription revenue:', revError);
    }
  }
  
  // Enviar a Make para email
  await sendToMake('subscription_created_webhook', {
    userEmail: user.email,
    userName: user.email,
    planTier: planTier,
    priceAmount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
    currency: subscription.currency,
    currentPeriodEnd: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
    interval: interval
  });
}

/**
 * Manejar actualización de suscripción
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Processing customer.subscription.updated:', subscription.id);
  
  const priceId = subscription.items.data[0]?.price.id;
  const planTier = determinePlanTier(priceId);
  const interval = subscription.items.data[0]?.price.recurring?.interval || 'monthly';
  
  await db.update(subscriptions)
    .set({
      plan: planTier,
      status: subscription.status as any,
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      interval: interval as 'monthly' | 'yearly',
      price: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
      isTrial: subscription.status === 'trialing',
      updatedAt: new Date()
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  
  console.log(`✅ Subscription updated: ${subscription.id}`);
  
  // Enviar notificación si es cambio de plan
  const oldSub = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, subscription.id)).limit(1);
  if (oldSub.length > 0 && oldSub[0].plan !== planTier) {
    const user_result = await db.select().from(users).where(eq(users.id, oldSub[0].userId)).limit(1);
    if (user_result.length > 0) {
      await db.insert(notifications).values({
        userId: oldSub[0].userId,
        type: 'plan_changed',
        title: `🚀 Plan Updated to ${planTier.charAt(0).toUpperCase() + planTier.slice(1)}!`,
        message: `Your subscription plan has been upgraded. Enjoy all your new features!`,
        read: false,
        createdAt: new Date()
      }).catch(err => console.error('Error creating notification:', err));

      // Enviar a Make para email
      await sendToMake('plan_changed', {
        userEmail: user_result[0].email,
        userName: user_result[0].artistName || user_result[0].email,
        oldPlan: oldSub[0].plan,
        newPlan: planTier,
        priceAmount: (subscription.items.data[0]?.price.unit_amount || 0) / 100,
        currency: subscription.currency
      });
    }
  }
}

/**
 * Manejar cancelación de suscripción
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('❌ Processing customer.subscription.deleted:', subscription.id);
  
  await db.update(subscriptions)
    .set({
      status: 'canceled',
      cancelAtPeriodEnd: true,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  
  console.log(`✅ Subscription canceled: ${subscription.id}`);
}

/**
 * Manejar pago exitoso
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('💰 Processing invoice.payment_succeeded:', invoice.id);
  
  if (!invoice.subscription) {
    console.log('⚠️ Invoice without subscription');
    return;
  }
  
  // Actualizar última fecha de pago
  await db.update(subscriptions)
    .set({
      status: 'active',
      updatedAt: new Date()
    })
    .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string));
  
  console.log(`✅ Payment succeeded for subscription: ${invoice.subscription}`);
  
  // 💰 Registrar ingreso por pago de suscripción (renovaciones)
  const paymentAmount = (invoice.amount_paid || 0) / 100;
  if (paymentAmount > 0) {
    // Obtener la suscripción para el userId
    const subs = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string)).limit(1);
    if (subs.length > 0) {
      try {
        await db.insert(platformRevenue).values({
          revenueType: 'subscription',
          amount: paymentAmount.toString(),
          currency: invoice.currency.toUpperCase(),
          sourceUserId: subs[0].userId,
          metadata: {
            stripeSubscriptionId: invoice.subscription,
            invoiceId: invoice.id,
            plan: subs[0].plan,
            interval: subs[0].interval,
            isRenewal: true
          }
        });
        console.log(`💰 [REVENUE] Subscription renewal recorded: $${paymentAmount}`);
      } catch (revError) {
        console.error('❌ Error recording subscription revenue:', revError);
      }
    }
  }
  
  // Enviar notificación de pago exitoso
  const subs_notification = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string)).limit(1);
  if (subs_notification.length > 0) {
    await db.insert(notifications).values({
      userId: subs_notification[0].userId,
      type: 'payment_succeeded',
      title: '💰 Payment Received',
      message: `Thank you! Your payment of $${(invoice.amount_paid || 0) / 100} has been processed successfully.`,
      read: false,
      createdAt: new Date()
    }).catch(err => console.error('Error creating notification:', err));

    // Enviar a Make para email
    const user_result = await db.select().from(users).where(eq(users.id, subs_notification[0].userId)).limit(1);
    if (user_result.length > 0) {
      await sendToMake('payment_succeeded', {
        userEmail: user_result[0].email,
        userName: user_result[0].artistName || user_result[0].email,
        amount: (invoice.amount_paid || 0) / 100,
        currency: invoice.currency,
        invoiceId: invoice.id,
        paidDate: new Date(invoice.created * 1000).toLocaleDateString()
      });
    }
  }
}

/**
 * Manejar pago fallido
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('⚠️ Processing invoice.payment_failed:', invoice.id);
  
  if (!invoice.subscription) {
    console.log('⚠️ Invoice without subscription');
    return;
  }
  
  // Marcar como past_due
  await db.update(subscriptions)
    .set({
      status: 'past_due',
      updatedAt: new Date()
    })
    .where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string));
  
  console.log(`⚠️ Payment failed for subscription: ${invoice.subscription}`);
  
  // Enviar notificación de pago fallido
  const subs = await db.select().from(subscriptions).where(eq(subscriptions.stripeSubscriptionId, invoice.subscription as string)).limit(1);
  if (subs.length > 0) {
    await db.insert(notifications).values({
      userId: subs[0].userId,
      type: 'payment_failed',
      title: '❌ Payment Failed',
      message: 'Your recent payment could not be processed. Please update your payment method to keep your subscription active.',
      read: false,
      createdAt: new Date()
    }).catch(err => console.error('Error creating notification:', err));

    // Enviar a Make para email
    const user_result = await db.select().from(users).where(eq(users.id, subs[0].userId)).limit(1);
    if (user_result.length > 0) {
      await sendToMake('payment_failed', {
        userEmail: user_result[0].email,
        userName: user_result[0].artistName || user_result[0].email,
        amount: (invoice.amount_due || 0) / 100,
        currency: invoice.currency,
        failedDate: new Date(invoice.created * 1000).toLocaleDateString()
      });
    }
  }
}

/**
 * Determinar tier del plan basado en Price ID
 * Usa constantes centralizadas de shared/constants.ts
 */
function determinePlanTier(priceId: string): 'free' | 'creator' | 'professional' | 'enterprise' {
  const plan = PRICE_ID_TO_PLAN[priceId];
  if (plan === 'creator' || plan === 'professional' || plan === 'enterprise') {
    return plan;
  }
  return 'free';
}

/**
 * TEST ENDPOINTS - Sin firma requerida
 * Usa estos para simular webhooks SIN pagar
 */

// Test: Simular pago exitoso
router.post('/test/simulate-payment-success', async (req: Request, res: Response) => {
  try {
    console.log('🧪 TEST: Simulando pago exitoso...');
    
    // Obtener usuario existente o usar el primero disponible
    let userId = 1;
    try {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
      }
    } catch (e) {
      console.log('📝 No user found, using userId 1 for test');
    }
    
    // Crear notificación de prueba
    const result = await db.insert(notifications).values({
      userId: userId,
      type: 'PAYMENT_SUCCESS',
      title: '✅ TEST: Pago Exitoso',
      message: 'Este es un evento de prueba - No es un pago real',
      metadata: {
        amount: 99.99,
        currency: 'USD',
        tier: 'professional',
        eventType: 'PAYMENT_SUCCESS'
      },
      read: false,
      createdAt: new Date()
    }).catch(err => {
      console.error('❌ Error creating test notification:', err);
      throw err;
    });

    // Enviar a Make para email
    await sendToMake('PAYMENT_SUCCESS', {
      userEmail: 'test@boostify.dev',
      userName: 'Test User',
      amount: 99.99,
      currency: 'USD',
      tier: 'professional',
      isTest: true
    });

    return res.json({
      success: true,
      message: '✅ Pago de prueba simulado correctamente',
      info: 'Revisa tu DB en notifications y Check Make webhook'
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en simulación'
    });
  }
});

// Test: Simular nueva suscripción
router.post('/test/simulate-subscription', async (req: Request, res: Response) => {
  try {
    console.log('🧪 TEST: Simulando nueva suscripción...');
    
    // Obtener usuario existente
    let userId = 1;
    try {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
      }
    } catch (e) {
      console.log('📝 No user found, using userId 1 for test');
    }
    
    const result = await db.insert(notifications).values({
      userId: userId,
      type: 'SUBSCRIPTION_CREATED',
      title: '✅ TEST: Suscripción Creada',
      message: 'Este es un evento de prueba - No es una suscripción real',
      metadata: {
        amount: 59.99,
        currency: 'USD',
        tier: 'creator',
        eventType: 'SUBSCRIPTION_CREATED'
      },
      read: false,
      createdAt: new Date()
    }).catch(err => {
      console.error('❌ Error creating test notification:', err);
      throw err;
    });

    await sendToMake('SUBSCRIPTION_CREATED', {
      userEmail: 'test@boostify.dev',
      userName: 'Test User',
      planTier: 'creator',
      amount: 59.99,
      isTest: true
    });

    return res.json({
      success: true,
      message: '✅ Suscripción de prueba simulada correctamente',
      info: 'Revisa tu DB en notifications y Check Make webhook'
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en simulación'
    });
  }
});

// Test: Simular pago fallido
router.post('/test/simulate-payment-failed', async (req: Request, res: Response) => {
  try {
    console.log('🧪 TEST: Simulando pago fallido...');
    
    // Obtener usuario existente
    let userId = 1;
    try {
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        userId = existingUsers[0].id;
      }
    } catch (e) {
      console.log('📝 No user found, using userId 1 for test');
    }
    
    const result = await db.insert(notifications).values({
      userId: userId,
      type: 'PAYMENT_FAILED',
      title: '❌ TEST: Pago Fallido',
      message: 'Este es un evento de prueba - No es un pago fallido real',
      metadata: {
        amount: 99.99,
        currency: 'USD',
        tier: 'professional',
        eventType: 'PAYMENT_FAILED'
      },
      read: false,
      createdAt: new Date()
    }).catch(err => {
      console.error('❌ Error creating test notification:', err);
      throw err;
    });

    await sendToMake('PAYMENT_FAILED', {
      userEmail: 'test@boostify.dev',
      userName: 'Test User',
      amount: 99.99,
      failedDate: new Date().toLocaleDateString(),
      isTest: true
    });

    return res.json({
      success: true,
      message: '✅ Pago fallido de prueba simulado correctamente',
      info: 'Revisa tu DB en notifications y Check Make webhook'
    });
  } catch (error) {
    console.error('❌ Test error:', error);
    return res.status(500).json({
      success: false,
      error: 'Error en simulación'
    });
  }
});

export default router;
