import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupInstagramRoutes } from "./instagram";
import { setupSpotifyRoutes } from "./spotify";
import { db } from "@db";
import { marketingMetrics } from "@db/schema";
import { eq, and, desc } from "drizzle-orm";
import Stripe from 'stripe';
import { z } from "zod";
import { contracts } from "@db/schema";
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import OpenAI from "openai";

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('Error: STRIPE_SECRET_KEY no está configurada');
  throw new Error('STRIPE_SECRET_KEY must be defined');
}

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Validate contract data
const contractSchema = z.object({
  title: z.string(),
  type: z.string(),
  content: z.string(),
  status: z.string().default('draft')
});

// Validate subscription data
const subscriptionSchema = z.object({
  priceId: z.string(),
  planName: z.string()
});

// Export the configured server
export function registerRoutes(app: Express): Server {
  // Initialize session and passport middleware
  app.use(session({
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());

  setupAuth(app);
  setupInstagramRoutes(app);
  setupSpotifyRoutes(app);

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
              content: "You are a music industry expert specialized in artist growth strategies. Generate 3-5 actionable focus points for the artist's growth strategy. Format your response as JSON with a 'strategy' array containing string items."
            },
            {
              role: "user",
              content: "Generate a strategic growth plan for an emerging music artist focusing on social media presence, music releases, and collaborations."
            }
          ],
          response_format: { type: "json_object" }
        });
    
        // Parse the response and ensure it has the expected structure
        const result = JSON.parse(completion.choices[0].message.content);
        if (!Array.isArray(result.strategy)) {
          throw new Error('Invalid AI response format');
        }
    
        res.json({ strategy: result.strategy });
      } catch (error: any) {
        console.error('Error generating strategy:', error);
        res.status(500).json({ 
          error: "Failed to generate strategy",
          details: error.message 
        });
      }
    });

  // Required for Stripe webhook
  app.post("/api/webhook", express.raw({type: 'application/json'}), async (req, res) => {
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
      const session = event.data.object as Stripe.Checkout.Session;

      try {
        const { userId, planName } = session.metadata || {};

        if (userId && planName) {
          console.log('Subscription successful for user:', userId, 'plan:', planName);
          // Additional subscription processing logic here
        }

      } catch (error) {
        console.error('Error processing successful payment:', error);
      }
    }

    res.json({ received: true });
  });

  // Create subscription checkout session
  app.post("/api/create-subscription", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const result = subscriptionSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ 
          error: "Invalid subscription data" 
        });
      }

      const { priceId, planName } = result.data;

      console.log('Creating subscription session for:', { priceId, planName });

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.protocol}://${req.get('host')}/dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/dashboard?canceled=true`,
        metadata: {
          userId: req.user!.id,
          planName,
        },
      });

      console.log('Created session:', session.id);

      return res.json({
        sessionId: session.id
      });
    } catch (error: any) {
      console.error('Error creating subscription session:', error);
      if (error.type === 'StripeInvalidRequestError') {
        return res.status(400).json({ 
          error: "Invalid Stripe configuration. Please try again later." 
        });
      }
      return res.status(500).json({ 
        error: "Error creating subscription session" 
      });
    }
  });

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ error: 'Authentication required' });
      }

      const { videoUrl, views, price, orderId } = req.body;

      if (!videoUrl || !views || !price || !orderId) {
        return res.status(400).json({ 
          error: "Missing required fields" 
        });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `${views.toLocaleString()} YouTube Views`,
                description: `Views for video: ${videoUrl}`,
              },
              unit_amount: Math.round(price * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `${req.protocol}://${req.get('host')}/youtube-views?session_id={CHECKOUT_SESSION_ID}&success=true`,
        cancel_url: `${req.protocol}://${req.get('host')}/youtube-views?canceled=true`,
        metadata: {
          orderId,
          videoUrl,
          views: views.toString(),
          userId: req.user!.id,
        },
      });

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

  const httpServer = createServer(app);
  return httpServer;
}