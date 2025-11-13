import { Router } from 'express';
import { db } from '../db';
import { investors } from '../db/schema';
import { insertInvestorSchema } from '../../db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import Stripe from 'stripe';
import axios from 'axios';

const router = Router();

// Initialize Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

// Make.com webhook URL
const MAKE_WEBHOOK_URL = 'https://hook.us2.make.com/hfnbfse1q9gtm71xeamn5p5tj48fyv8x';

// Route to register a new investor
router.post('/register', async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  
  try {
    // Validate the request body
    const validationResult = insertInvestorSchema.safeParse({
      ...req.body,
      userId: req.user.id
    });
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationResult.error.format()
      });
    }
    
    // Insert into PostgreSQL database
    const [newInvestor] = await db
      .insert(investors)
      .values(validationResult.data)
      .returning();
    
    console.log("New investor registered with ID:", newInvestor.id);
    
    // Send data to Make.com webhook
    try {
      await axios.post(MAKE_WEBHOOK_URL, {
        investorId: newInvestor.id,
        userId: req.user.id,
        fullName: newInvestor.fullName,
        email: newInvestor.email,
        phone: newInvestor.phone,
        country: newInvestor.country,
        investmentAmount: newInvestor.investmentAmount,
        investmentGoals: newInvestor.investmentGoals,
        riskTolerance: newInvestor.riskTolerance,
        investorType: newInvestor.investorType,
        termsAccepted: newInvestor.termsAccepted,
        status: newInvestor.status,
        registrationDate: newInvestor.createdAt
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log("Webhook notification sent to Make.com successfully");
    } catch (webhookError: any) {
      console.error('Failed to send webhook to Make.com:', webhookError.message);
      // Continue execution even if webhook fails
    }
    
    return res.status(201).json({ 
      success: true, 
      message: 'Investor registration successful',
      id: newInvestor.id
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
    const userId = req.user.id;

    const [investor] = await db
      .select()
      .from(investors)
      .where(eq(investors.userId, userId))
      .limit(1);

    if (!investor) {
      return res.status(404).json({ 
        success: false, 
        message: 'Inversor no encontrado',
        registered: false
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        ...investor,
        registered: true
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
    const userId = req.user.id;
    const { amount, planType, duration } = req.body;

    // Validate investor is registered
    const [investor] = await db
      .select()
      .from(investors)
      .where(eq(investors.userId, userId))
      .limit(1);

    if (!investor) {
      return res.status(403).json({ 
        success: false, 
        message: 'Debes registrarte como inversor primero' 
      });
    }

    if (investor.status !== 'approved' && investor.status !== 'pending') {
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
        userId: userId.toString(),
        investorId: investor.id.toString(),
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
 * GET /api/investors/stats
 * Get global investment statistics
 */
router.get('/stats', async (req, res) => {
  try {
    const allInvestors = await db
      .select()
      .from(investors);

    const totalInvestors = allInvestors.length;
    const totalCapital = allInvestors.reduce((sum, inv) => {
      const amount = typeof inv.investmentAmount === 'string' 
        ? parseFloat(inv.investmentAmount) 
        : Number(inv.investmentAmount);
      return sum + (amount || 0);
    }, 0);

    return res.status(200).json({
      success: true,
      data: {
        totalInvestors,
        totalCapital,
        pendingInvestors: allInvestors.filter(inv => inv.status === 'pending').length,
        approvedInvestors: allInvestors.filter(inv => inv.status === 'approved').length
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