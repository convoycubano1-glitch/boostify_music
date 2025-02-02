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
    if (!req.isAuthenticated()) return res.sendStatus(401);

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

  // Stripe checkout session creation
  app.post("/api/create-checkout-session", async (req, res) => {
    if (!req.isAuthenticated()) return res.status(401).json({ error: "No autorizado" });

    try {
      const { packageId, videoUrl, views, price } = req.body;

      if (!videoUrl || !views || !price) {
        return res.status(400).json({ error: "Faltan datos requeridos" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${views.toLocaleString()} YouTube Views`,
                description: `Para el video: ${videoUrl}`,
              },
              unit_amount: price * 100, // Stripe usa centavos
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/youtube-views?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get('host')}/youtube-views?canceled=true`,
        metadata: {
          videoUrl,
          views,
          userId: req.user.id,
        },
      });

      res.status(200).json({ id: session.id });
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      res.status(500).json({ error: error.message });
    }
  });

  // Stripe webhook handler
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
      res.status(400).json({ error: `Webhook Error: ${err.message}` });
      return;
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('Payment successful:', session);
    }

    res.json({ received: true });
  });

  const httpServer = createServer(app);
  return httpServer;
}