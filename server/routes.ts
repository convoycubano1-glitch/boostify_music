import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupInstagramRoutes } from "./instagram";
import { setupSpotifyRoutes } from "./spotify";
import { db } from "@db";
import { marketingMetrics } from "@db/schema";
import { eq } from "drizzle-orm";
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY must be defined');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

export function registerRoutes(app: Express): Server {
  setupAuth(app);
  setupInstagramRoutes(app);
  setupSpotifyRoutes(app);

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

  // Stripe subscription session creation
  app.post("/api/create-subscription", async (req, res) => {
    try {
      // Validate authentication
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Authentication token not provided' });
      }

      // Extract token
      const token = authHeader.split(' ')[1];
      if (!token) {
        return res.status(401).json({ error: 'Invalid authentication token' });
      }

      const { planId, priceId } = req.body;

      // Validate required fields
      if (!planId || !priceId) {
        return res.status(400).json({ 
          error: "Incomplete data. Plan ID and price are required." 
        });
      }

      // Create subscription session
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'subscription',
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${planId.charAt(0).toUpperCase() + planId.slice(1)} Plan`,
                description: 'Monthly subscription plan',
              },
              unit_amount: parseInt(priceId) * 100, // Convert to cents
              recurring: {
                interval: 'month'
              }
            },
            quantity: 1,
          },
        ],
        success_url: `${req.protocol}://${req.get('host')}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/?canceled=true`,
        client_reference_id: req.headers['user-id'] as string,
        metadata: {
          planId,
          userId: req.headers['user-id'],
        },
      });

      // Return session ID
      return res.status(200).json({ id: session.id });
    } catch (error: any) {
      console.error('Error creating subscription session:', error);
      return res.status(500).json({ 
        error: error.message || "Error creating subscription session" 
      });
    }
  });

  // Stripe webhook handler for subscriptions
  app.post("/api/webhook", async (req, res) => {
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

    // Handle subscription events
    try {
      if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('Subscription successful:', session);

        // Here you would typically update the user's subscription status in your database
        // For example, store the subscription details in Firestore
        if (session.metadata?.userId) {
          // Update subscription status in your database
          console.log('Updating subscription for user:', session.metadata.userId);
        }
      }

      res.json({ received: true });
    } catch (err: any) {
      console.error('Error handling webhook:', err);
      res.status(500).json({ error: 'Error handling webhook' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}