import { Router } from 'express';
import { db } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import Stripe from 'stripe';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Validation schema for investor registration
const investorSchema = z.object({
  fullName: z.string().min(2, { message: "Full name is required" }),
  email: z.string().email({ message: "Valid email is required" }),
  phone: z.string().optional(),
  country: z.string().min(2, { message: "Country is required" }),
  investmentAmount: z.number().min(1, { message: "Investment amount is required" }),
  investorType: z.enum(["individual", "corporate", "institutional"]),
  riskTolerance: z.enum(["low", "medium", "high"]),
  investmentGoals: z.string().optional(),
  termsAccepted: z.boolean().refine(val => val === true, {
    message: "You must accept the terms and conditions"
  })
});

type InvestorData = z.infer<typeof investorSchema>;

// Route to register a new investor
router.post('/register', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Validate the request body
    const validationResult = investorSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.format()
      });
    }
    
    const investorData = {
      ...validationResult.data,
      userId: req.user.uid,
      status: "pending",
      createdAt: FieldValue.serverTimestamp()
    };
    
    // Use Firebase Admin SDK to add document
    const docRef = await db.collection('investors').add(investorData);
    
    console.log("New investor registered with ID:", docRef.id);
    
    return res.status(201).json({ 
      success: true, 
      message: 'Investor registration successful',
      id: docRef.id
    });
    
  } catch (error: any) {
    console.error('Error registering investor:', error);
    return res.status(500).json({ 
      error: 'Failed to register investor',
      details: error.message || 'Unknown error'
    });
  }
});

/**
 * GET /api/investors/me
 * Get current investor data
 */
router.get('/me', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
  }
  
  try {
    const userId = req.user.uid;

    const investorSnapshot = await db.collection('investors')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (investorSnapshot.empty) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inversor no encontrado',
        registered: false
      });
    }

    const investorDoc = investorSnapshot.docs[0];
    const investorData = investorDoc.data();

    // Get investor's investments
    const investmentsSnapshot = await db.collection('investments')
      .where('investorId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();

    const investments = investmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Calculate stats
    const totalInvested = investments.reduce((sum: number, inv: any) => sum + (inv.amount || 0), 0);
    const totalReturns = investments.reduce((sum: number, inv: any) => sum + (inv.totalReturns || 0), 0);
    const currentValue = totalInvested + totalReturns;

    return res.status(200).json({
      success: true,
      data: {
        id: investorDoc.id,
        ...investorData,
        registered: true,
        stats: {
          totalInvested,
          totalReturns,
          currentValue,
          investmentCount: investments.length
        },
        investments
      }
    });

  } catch (error: any) {
    console.error('Error getting investor data:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener datos del inversor' 
    });
  }
});

/**
 * POST /api/investors/investment/create-checkout
 * Create Stripe checkout session for investment
 */
router.post('/investment/create-checkout', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
  }
  
  try {
    const userId = req.user.uid;
    const { amount, planType, duration } = req.body;

    // Validate investor is registered
    const investorSnapshot = await db.collection('investors')
      .where('userId', '==', userId)
      .limit(1)
      .get();

    if (investorSnapshot.empty) {
      return res.status(403).json({ 
        success: false, 
        message: 'Debes registrarte como inversor primero' 
      });
    }

    const investorData = investorSnapshot.docs[0].data();

    if (investorData?.status !== 'approved' && investorData?.status !== 'pending') {
      return res.status(403).json({ 
        success: false, 
        message: 'Tu cuenta de inversor está pendiente de aprobación' 
      });
    }

    // Minimum investment validation
    if (amount < 2000) {
      return res.status(400).json({ 
        success: false, 
        message: 'La inversión mínima es de $2,000 USD' 
      });
    }

    // Calculate return rate based on amount
    let returnRate = 0.04; // 4% default
    if (amount >= 10000) returnRate = 0.06; // 6%
    else if (amount >= 5000) returnRate = 0.05; // 5%

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Boostify Investment - ${planType || 'Standard'} Plan`,
              description: `Investment for ${duration || 12} months with ${(returnRate * 100).toFixed(0)}% monthly returns`,
            },
            unit_amount: amount * 100, // Stripe uses cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin || 'http://localhost:5000'}/investors-dashboard?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${req.headers.origin || 'http://localhost:5000'}/investors-dashboard?canceled=true`,
      metadata: {
        userId,
        investorId: userId,
        amount: amount.toString(),
        planType: planType || 'standard',
        duration: (duration || 12).toString(),
        returnRate: returnRate.toString(),
        type: 'investment'
      }
    });

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al crear sesión de pago' 
    });
  }
});

/**
 * POST /api/investors/webhook
 * Handle Stripe webhooks for investment payments
 */
router.post('/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return res.status(400).send('Missing signature or webhook secret');
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.metadata?.type === 'investment') {
      const { userId, amount, planType, duration, returnRate } = session.metadata;

      const numAmount = parseFloat(amount);
      const numReturnRate = parseFloat(returnRate);
      const numDuration = parseInt(duration) || 12;

      // Create investment record
      const investmentData = {
        investorId: userId,
        amount: numAmount,
        planType: planType || 'standard',
        duration: numDuration,
        returnRate: numReturnRate,
        status: 'active',
        startDate: FieldValue.serverTimestamp(),
        nextPaymentDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        totalReturns: 0,
        paymentsMade: 0,
        stripeSessionId: session.id,
        stripePaymentIntent: session.payment_intent,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      await db.collection('investments').add(investmentData);

      // Update investor stats
      const investorSnapshot = await db.collection('investors')
        .where('userId', '==', userId)
        .limit(1)
        .get();

      if (!investorSnapshot.empty) {
        const investorDoc = investorSnapshot.docs[0];
        await investorDoc.ref.update({
          status: 'approved', // Auto-approve on successful payment
          lastInvestmentDate: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        });
      }
    }
  }

  res.json({ received: true });
});

/**
 * GET /api/investors/investments/:id
 * Get specific investment details
 */
router.get('/investments/:id', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
  }
  
  try {
    const userId = req.user.uid;
    const { id } = req.params;

    const investmentDoc = await db.collection('investments').doc(id).get();

    if (!investmentDoc.exists) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inversión no encontrada' 
      });
    }

    const investmentData = investmentDoc.data();

    // Verify ownership
    if (investmentData?.investorId !== userId) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permiso para ver esta inversión' 
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        id: investmentDoc.id,
        ...investmentData
      }
    });

  } catch (error: any) {
    console.error('Error getting investment:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener inversión' 
    });
  }
});

/**
 * GET /api/investors/stats
 * Get global investment statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const investmentsSnapshot = await db.collection('investments')
      .where('status', '==', 'active')
      .get();

    const totalInvestments = investmentsSnapshot.size;
    const totalCapital = investmentsSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.amount || 0);
    }, 0);

    const totalReturns = investmentsSnapshot.docs.reduce((sum, doc) => {
      const data = doc.data();
      return sum + (data.totalReturns || 0);
    }, 0);

    const investorsSnapshot = await db.collection('investors').get();
    const totalInvestors = investorsSnapshot.size;

    return res.status(200).json({
      success: true,
      data: {
        totalInvestments,
        totalInvestors,
        totalCapital,
        totalReturns,
        currentValue: totalCapital + totalReturns
      }
    });

  } catch (error: any) {
    console.error('Error getting stats:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error al obtener estadísticas' 
    });
  }
});

export default router;