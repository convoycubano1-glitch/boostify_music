import { Router, Request, Response, Express } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { auth } from '../firebase';
import { DecodedIdToken } from 'firebase-admin/auth';
import { 
  getDocById, setDocument, updateDocument, findUserByStripeCustomerId, queryDocuments
} from '../utils/firestore-helpers';

// Initialize Stripe with the secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16' as any,
});

const router = Router();

/**
 * Setup Stripe routes
 * @param app Express application
 */
export function setupStripeRoutes(app: Express) {
  // Mount the Stripe routes
  app.use('/api', router);
  
  // Log Stripe configuration status
  if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY) {
    console.log('✅ Stripe API keys are configured and ready for use');
  } else {
    console.warn('⚠️ Stripe API keys are not configured properly');
  }
  
  // Add a route to get the publishable key
  app.get('/api/stripe-config', (req, res) => {
    res.json({
      publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    });
  });
}

// Check if Stripe is properly configured
if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PUBLISHABLE_KEY) {
  console.warn('⚠️ Stripe environment variables are not configured properly');
}

// Define schema for subscription request
const createSubscriptionSchema = z.object({
  priceId: z.string(),
});

// Define schema for subscription update request
const updateSubscriptionSchema = z.object({
  priceId: z.string(),
});

// Price IDs for different subscription tiers
// In production, these would come from a database or environment variables
const PRICES = {
  basic: process.env.STRIPE_PRICE_BASIC || 'price_basic',
  pro: process.env.STRIPE_PRICE_PRO || 'price_pro',
  premium: process.env.STRIPE_PRICE_PREMIUM || 'price_premium',
};

// Map price IDs to plan names
const PRICE_TO_PLAN: Record<string, string> = {
  [PRICES.basic]: 'basic',
  [PRICES.pro]: 'pro',
  [PRICES.premium]: 'premium',
};

/**
 * Create a new subscription checkout session
 */
router.post('/create-subscription', async (req: Request, res: Response) => {
  try {
    // Verify the user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken: DecodedIdToken;
    
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.uid;
    
    // Validate request body
    const result = createSubscriptionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request body', details: result.error });
    }
    
    const { priceId } = result.data;
    
    // Get the user's customer ID or create a new customer
    const userDoc = await getDocById('users', userId);
    
    let customerId: string;
    
    if (userDoc && userDoc.stripeCustomerId) {
      customerId = userDoc.stripeCustomerId;
    } else {
      // Create a new customer in Stripe
      const email = decodedToken.email || undefined;
      const name = decodedToken.name || undefined;
      
      const customer = await stripe.customers.create({
        email,
        name,
        metadata: {
          firebaseUserId: userId,
        },
      });
      
      customerId = customer.id;
      
      // Update the user record with the Stripe customer ID
      if (userDoc) {
        await updateDocument('users', userId, {
          stripeCustomerId: customerId,
        });
      } else {
        // Create a new user record with the Stripe customer ID
        await setDocument('users', userId, {
          stripeCustomerId: customerId,
          email: decodedToken.email,
          createdAt: new Date(),
        });
      }
    }
    
    // Create a checkout session for the subscription
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/pricing`,
      metadata: {
        userId,
      },
    });
    
    res.json({ url: session.url });
  } catch (error) {
    console.error('Error creating subscription:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
});

/**
 * Get the current user's subscription status
 */
router.get('/subscription-status', async (req: Request, res: Response) => {
  try {
    // Verify the user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken: DecodedIdToken;
    
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.uid;
    
    // Get the user's customer ID
    const userDoc = await getDocById('users', userId);
    
    if (!userDoc || !userDoc.stripeCustomerId) {
      // If the user doesn't have a Stripe customer ID, they don't have a subscription
      return res.json({
        active: false,
        plan: 'free',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null,
      });
    }
    
    const customerId = userDoc.stripeCustomerId;
    
    // Get the customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
      expand: ['data.default_payment_method'],
    });
    
    if (subscriptions.data.length === 0) {
      // If the user doesn't have any active subscriptions
      return res.json({
        active: false,
        plan: 'free',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null,
      });
    }
    
    // Get the first active subscription
    const subscription = subscriptions.data[0];
    const priceId = subscription.items.data[0].price.id;
    const plan = PRICE_TO_PLAN[priceId] || 'free';
    
    res.json({
      active: true,
      plan,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      priceId,
    });
  } catch (error) {
    console.error('Error getting subscription status:', error);
    res.status(500).json({ error: 'Failed to get subscription status' });
  }
});

/**
 * Cancel the user's subscription
 */
router.post('/cancel-subscription', async (req: Request, res: Response) => {
  try {
    // Verify the user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken: DecodedIdToken;
    
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.uid;
    
    // Get the user's customer ID
    const userDoc = await getDocById('users', userId);
    
    if (!userDoc || !userDoc.stripeCustomerId) {
      return res.status(404).json({ error: 'User does not have a subscription' });
    }
    
    const customerId = userDoc.stripeCustomerId;
    
    // Get the customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });
    
    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }
    
    // Cancel the subscription at the end of the current period
    const subscription = subscriptions.data[0];
    await stripe.subscriptions.update(subscription.id, {
      cancel_at_period_end: true,
    });
    
    res.json({
      success: true,
      message: 'Subscription will be canceled at the end of the billing period',
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

/**
 * Update the user's subscription to a new plan
 */
router.post('/update-subscription', async (req: Request, res: Response) => {
  try {
    // Verify the user is authenticated
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    let decodedToken: DecodedIdToken;
    
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      console.error('Error verifying token:', error);
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userId = decodedToken.uid;
    
    // Validate request body
    const result = updateSubscriptionSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: 'Invalid request body', details: result.error });
    }
    
    const { priceId } = result.data;
    
    // Get the user's customer ID
    const userDoc = await getDocById('users', userId);
    
    if (!userDoc || !userDoc.stripeCustomerId) {
      return res.status(404).json({ error: 'User does not have a subscription' });
    }
    
    const customerId = userDoc.stripeCustomerId;
    
    // Get the customer's subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active',
    });
    
    if (subscriptions.data.length === 0) {
      return res.status(404).json({ error: 'No active subscription found' });
    }
    
    // Update the subscription with the new price
    const subscription = subscriptions.data[0];
    
    // Check if subscription is already set to be canceled
    if (subscription.cancel_at_period_end) {
      // If it is, resume the subscription
      await stripe.subscriptions.update(subscription.id, {
        cancel_at_period_end: false,
      });
    }
    
    // Update the subscription with the new price
    await stripe.subscriptions.update(subscription.id, {
      items: [
        {
          id: subscription.items.data[0].id,
          price: priceId,
        },
      ],
      proration_behavior: 'create_prorations',
    });
    
    res.json({
      success: true,
      message: 'Subscription updated successfully',
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

/**
 * Process the webhook from Stripe
 * This is called by Stripe when a subscription event occurs (created, updated, canceled, etc.)
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];
  
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(400).json({ error: 'Missing Stripe webhook signature' });
  }
  
  let event: Stripe.Event;
  
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Error verifying webhook signature:', err);
    return res.status(400).json({ error: 'Invalid signature' });
  }
  
  // Handle specific Stripe events
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionChange(subscription);
      break;
    case 'customer.subscription.deleted':
      const deletedSubscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeletion(deletedSubscription);
      break;
    // Additional event handling can be added here
  }
  
  res.json({ received: true });
});

/**
 * Handle subscription changes
 */
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Find the user with this customer ID
    const users = await queryDocuments('users', 'stripeCustomerId', '==', customerId);
    
    if (!users || users.length === 0) {
      console.error('No user found with Stripe customer ID:', customerId);
      return;
    }
    
    const userDoc = users[0];
    const userId = userDoc.id;
    
    // Update the user's subscription status
    const priceId = subscription.items.data[0].price.id;
    const plan = PRICE_TO_PLAN[priceId] || 'free';
    
    await updateDocument('users', userId, {
      subscription: {
        status: subscription.status,
        plan,
        priceId,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      },
      updatedAt: new Date(),
    });
    
    console.log(`Updated subscription for user ${userId} to plan ${plan}`);
  } catch (error) {
    console.error('Error handling subscription change:', error);
  }
}

/**
 * Handle subscription deletions
 */
async function handleSubscriptionDeletion(subscription: Stripe.Subscription) {
  try {
    const customerId = subscription.customer as string;
    
    // Find the user with this customer ID
    const users = await queryDocuments('users', 'stripeCustomerId', '==', customerId);
    
    if (!users || users.length === 0) {
      console.error('No user found with Stripe customer ID:', customerId);
      return;
    }
    
    const userDoc = users[0];
    const userId = userDoc.id;
    
    // Update the user's subscription status
    await updateDocument('users', userId, {
      subscription: {
        status: 'canceled',
        plan: 'free',
        priceId: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
      },
      updatedAt: new Date(),
    });
    
    console.log(`Subscription canceled for user ${userId}`);
  } catch (error) {
    console.error('Error handling subscription deletion:', error);
  }
}

export default router;