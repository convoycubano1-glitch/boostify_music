import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupInstagramRoutes } from "./instagram";
import { setupSpotifyRoutes } from "./spotify";
import { setupOpenAIRoutes } from "./routes/openai";
import { setupEducationRoutes } from "./routes/education";
import { setupFilesRoutes } from "./routes/files";
import { setupVideosRoutes } from "./routes/videos";
import { db } from "@db";
import { marketingMetrics, contracts, bookings, payments, analyticsHistory, events, courseEnrollments } from "@db/schema";
import { eq, and, desc, gte, lte, inArray } from "drizzle-orm";
import Stripe from 'stripe';
import { z } from "zod";
import express from 'express';
import passport from 'passport';
import session from 'express-session';
import OpenAI from "openai";
import { insertBookingSchema } from "@db/schema";
import translationRouter from './routes/translation';
import managerRouter from './routes/manager';
import artistRouter from './routes/artist';
import coursesRouter from './routes/courses';
import achievementsRouter from './routes/achievements';
import investorsRouter from './routes/investors';
import { authenticate } from './middleware/auth'; // Fixed import path
import { awardCourseCompletionAchievement } from './achievements';


if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

// Initialize OpenAI
const openai = new OpenAI({ apiKey: process.env.VITE_OPENAI_API_KEY });

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// Export the configured server
export function registerRoutes(app: Express): Server {
  // Initialize session middleware
  app.use(session({
    secret: process.env.REPL_ID!,
    resave: false,
    saveUninitialized: false,
  }));

  app.use(passport.initialize());
  app.use(passport.session());

  // Register translation routes
  app.use('/api', translationRouter);

  app.use('/api/manager', managerRouter);
  app.use('/api/artist', artistRouter);

  // Configurar las rutas que NO requieren autenticación primero
  setupOpenAIRoutes(app);
  setupEducationRoutes(app);
  setupFilesRoutes(app);
  
  // Servicios que requieren autenticación
  setupAuth(app);
  setupSpotifyRoutes(app);
  setupInstagramRoutes(app);
  setupVideosRoutes(app);

  // Register courses routes
  app.use(coursesRouter);

  // Register achievements routes
  app.use(achievementsRouter);
  
  // Register investors routes
  app.use('/api/investors', investorsRouter);


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

  const httpServer = createServer(app);
  return httpServer;
}