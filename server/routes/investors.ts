import { Router } from 'express';
import { db } from '../firebase';
import { FieldValue } from 'firebase-admin/firestore';
import { z } from 'zod';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const router = Router();
const BASE_URL = process.env.BASE_URL || 'https://workspace.replit.app';

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

// Schema para la creación de pagos de inversión
const investmentPaymentSchema = z.object({
  amount: z.number().min(1000, { message: "La inversión mínima es de $1,000" }),
  duration: z.number().min(6, { message: "La duración mínima es de 6 meses" }),
  rate: z.number(),
  userId: z.string().optional(), // Opcional para permitir pagos sin autenticación
  name: z.string().default("Inversión en Boostify Music"),
  email: z.string().email().optional(),
});

type InvestorData = z.infer<typeof investorSchema>;
type InvestmentPayment = z.infer<typeof investmentPaymentSchema>;

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

// Route para crear una sesión de pago de inversión con Stripe
router.post('/create-payment', async (req, res) => {
  try {
    // Validar los datos de la solicitud
    const validationResult = investmentPaymentSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        success: false,
        error: 'Validation failed', 
        details: validationResult.error.format()
      });
    }
    
    const paymentData = validationResult.data;
    const userId = paymentData.userId || 'guest-' + Date.now(); // Generar un ID para usuarios no autenticados
    
    // Preparar metadatos para el seguimiento del pago
    const metadata = {
      type: 'investment',
      userId: userId,
      amount: paymentData.amount.toString(),
      duration: paymentData.duration.toString(),
      rate: paymentData.rate.toString(),
      investmentId: `inv-${Date.now()}-${Math.floor(Math.random() * 1000)}`
    };
    
    // Convertir el precio a centavos para Stripe
    const amountInCents = Math.round(paymentData.amount * 100);
    
    // Crear una sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: paymentData.name,
              description: `Inversión por ${paymentData.duration} meses con retorno estimado del ${paymentData.rate}%`,
            },
            unit_amount: amountInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/investment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/investment-cancelled`,
      metadata: metadata,
      customer_email: paymentData.email,
    });
    
    // Guardar registro preliminar en Firestore
    await db.collection('investments').doc(metadata.investmentId).set({
      userId: userId,
      amount: paymentData.amount,
      duration: paymentData.duration,
      rate: paymentData.rate,
      status: 'pending',
      stripeSessionId: session.id,
      createdAt: FieldValue.serverTimestamp(),
      estimatedReturn: (paymentData.amount * paymentData.rate * paymentData.duration) / 100
    });
    
    // Devolver la URL de la sesión de checkout
    return res.status(200).json({
      success: true,
      url: session.url,
      sessionId: session.id
    });
    
  } catch (error: any) {
    console.error('Error creating investment payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create payment session',
      details: error.message || 'Unknown error'
    });
  }
});

// Route para verificar el estado de una inversión por ID
router.get('/status/:investmentId', async (req, res) => {
  try {
    const { investmentId } = req.params;
    
    // Obtener la inversión de Firestore
    const investmentDoc = await db.collection('investments').doc(investmentId).get();
    
    if (!investmentDoc.exists) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found'
      });
    }
    
    const investmentData = investmentDoc.data();
    
    return res.status(200).json({
      success: true,
      investment: {
        id: investmentId,
        ...investmentData
      }
    });
    
  } catch (error: any) {
    console.error('Error checking investment status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check investment status',
      details: error.message || 'Unknown error'
    });
  }
});

// Route para verificar el estado de una inversión por sessionId de Stripe
router.get('/status/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required'
      });
    }
    
    // Primero, verificar si la sesión existe en Stripe
    let session;
    try {
      session = await stripe.checkout.sessions.retrieve(sessionId);
    } catch (stripeError: any) {
      console.error('Error retrieving Stripe session:', stripeError);
      return res.status(404).json({
        success: false,
        error: 'Stripe session not found',
        details: stripeError.message
      });
    }
    
    // Obtener la inversión de Firestore usando el sessionId
    const investmentsSnapshot = await db.collection('investments')
      .where('stripeSessionId', '==', sessionId)
      .limit(1)
      .get();
    
    if (investmentsSnapshot.empty) {
      return res.status(404).json({
        success: false,
        error: 'Investment not found for this session',
        session: {
          id: session.id,
          status: session.status,
          payment_status: session.payment_status
        }
      });
    }
    
    const investmentDoc = investmentsSnapshot.docs[0];
    const investmentData = investmentDoc.data();
    
    // Si el pago fue exitoso en Stripe pero no se ha actualizado en Firestore
    if (session.payment_status === 'paid' && investmentData.status === 'pending') {
      // Actualizar el estado de la inversión
      await db.collection('investments').doc(investmentDoc.id).update({
        status: 'active',
        paymentCompleted: true,
        paymentDate: FieldValue.serverTimestamp(),
        paymentAmount: session.amount_total ? session.amount_total / 100 : investmentData.amount,
        paymentCurrency: session.currency || 'usd'
      });
      
      // Actualizar investmentData con los cambios
      investmentData.status = 'active';
      investmentData.paymentCompleted = true;
    }
    
    return res.status(200).json({
      success: true,
      investment: {
        id: investmentDoc.id,
        ...investmentData
      },
      session: {
        id: session.id,
        status: session.status,
        payment_status: session.payment_status
      }
    });
    
  } catch (error: any) {
    console.error('Error checking investment session status:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to check investment session status',
      details: error.message || 'Unknown error'
    });
  }
});

// Route para obtener todas las inversiones de un usuario
router.get('/user-investments', async (req, res) => {
  try {
    // Verificar autenticación
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const userId = req.user.uid;
    
    // Consultar inversiones del usuario
    const investmentsSnapshot = await db.collection('investments')
      .where('userId', '==', userId)
      .orderBy('createdAt', 'desc')
      .get();
    
    const investments = investmentsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return res.status(200).json({
      success: true,
      investments
    });
    
  } catch (error: any) {
    console.error('Error fetching user investments:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch investments',
      details: error.message || 'Unknown error'
    });
  }
});

export default router;