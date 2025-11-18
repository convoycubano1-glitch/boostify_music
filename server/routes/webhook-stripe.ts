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
import { subscriptions, users } from '../db/schema';
import { eq } from 'drizzle-orm';

const router = Router();

// Inicializar Stripe
const stripeKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey!, {
  apiVersion: '2025-01-27.acacia' as any,
});

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

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
 * Manejar checkout completado (nueva suscripción)
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('💳 Processing checkout.session.completed:', session.id);
  
  const { customer, subscription: subscriptionId, client_reference_id } = session;
  
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
  
  // Crear o actualizar suscripción en la base de datos
  await db.insert(subscriptions).values({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customer as string,
    stripePriceId: priceId,
    plan: planTier,
    status: subscription.status as 'active' | 'canceled' | 'past_due',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  }).onConflictDoUpdate({
    target: subscriptions.stripeSubscriptionId,
    set: {
      status: subscription.status as 'active' | 'canceled' | 'past_due',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      updatedAt: new Date()
    }
  });
  
  console.log(`✅ Subscription created/updated for user ${user.email}: ${planTier}`);
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
  
  await db.insert(subscriptions).values({
    userId: user.id,
    stripeSubscriptionId: subscription.id,
    stripeCustomerId: customer,
    stripePriceId: priceId,
    plan: planTier,
    status: subscription.status as 'active' | 'canceled' | 'past_due',
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000),
    cancelAtPeriodEnd: subscription.cancel_at_period_end
  }).onConflictDoUpdate({
    target: subscriptions.stripeSubscriptionId,
    set: {
      status: subscription.status as 'active' | 'canceled' | 'past_due',
      updatedAt: new Date()
    }
  });
  
  console.log(`✅ Subscription created for user ${user.email}`);
}

/**
 * Manejar actualización de suscripción
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('🔄 Processing customer.subscription.updated:', subscription.id);
  
  const priceId = subscription.items.data[0]?.price.id;
  const planTier = determinePlanTier(priceId);
  
  await db.update(subscriptions)
    .set({
      plan: planTier,
      stripePriceId: priceId,
      status: subscription.status as 'active' | 'canceled' | 'past_due',
      currentPeriodStart: new Date(subscription.current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date()
    })
    .where(eq(subscriptions.stripeSubscriptionId, subscription.id));
  
  console.log(`✅ Subscription updated: ${subscription.id}`);
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
  
  // TODO: Enviar email de notificación al usuario
}

/**
 * Determinar tier del plan basado en Price ID
 */
function determinePlanTier(priceId: string): 'free' | 'creator' | 'professional' | 'enterprise' {
  // Mapping de Price IDs a tiers
  const priceToTierMap: Record<string, 'creator' | 'professional' | 'enterprise'> = {
    // Monthly
    'price_1R0lay2LyFplWimfQxUL6Hn0': 'creator',
    'price_1R0laz2LyFplWimfsBd5ASoa': 'professional',
    'price_1R0lb12LyFplWimf7JpMynKA': 'enterprise',
    
    // Yearly (Pendientes - actualizar cuando se creen)
    'price_PENDING_CREATOR_YEARLY': 'creator',
    'price_PENDING_PROFESSIONAL_YEARLY': 'professional',
    'price_PENDING_ENTERPRISE_YEARLY': 'enterprise'
  };
  
  return priceToTierMap[priceId] || 'free';
}

export default router;
