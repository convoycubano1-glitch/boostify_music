import { Router } from 'express';
import { db } from '../db';
import { invoices, subscriptions, transactions, users } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import { isAuthenticated } from '../replitAuth';

const router = Router();

/**
 * GET /api/billing/subscription/:userId
 * Obtener suscripción activa del usuario
 */
router.get('/subscription/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    if (!subscription || subscription.length === 0) {
      return res.status(404).json({ 
        error: 'No subscription found',
        plan: 'free'
      });
    }

    return res.json(subscription[0]);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return res.status(500).json({ error: 'Failed to fetch subscription' });
  }
});

/**
 * GET /api/billing/invoices/:userId
 * Obtener facturas del usuario
 */
router.get('/invoices/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const limit = parseInt(req.query.limit as string) || 10;
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit);

    return res.json(userInvoices);
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

/**
 * GET /api/billing/invoice/:invoiceId
 * Obtener detalles de una factura
 */
router.get('/invoice/:invoiceId', isAuthenticated, async (req, res) => {
  try {
    const invoiceId = parseInt(req.params.invoiceId);
    
    if (isNaN(invoiceId)) {
      return res.status(400).json({ error: 'Invalid invoice ID' });
    }

    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.id, invoiceId))
      .limit(1);

    if (!invoice || invoice.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    return res.json(invoice[0]);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

/**
 * GET /api/billing/payment-method/:userId
 * Obtener método de pago del usuario
 */
router.get('/payment-method/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    // Para demo, retornamos método de pago mock
    // En producción, integrar con Stripe para obtener datos reales
    return res.json({
      type: 'card',
      brand: 'visa',
      last4: '4242',
      expMonth: 12,
      expYear: 2026,
      isDefault: true
    });
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return res.status(500).json({ error: 'Failed to fetch payment method' });
  }
});

/**
 * GET /api/billing/summary/:userId
 * Obtener resumen de facturación
 */
router.get('/summary/:userId', isAuthenticated, async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    
    if (isNaN(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1);

    const userInvoices = await db
      .select()
      .from(invoices)
      .where(eq(invoices.userId, userId))
      .orderBy(desc(invoices.createdAt));

    const paidInvoices = userInvoices.filter(inv => inv.status === 'paid');
    const totalSpent = paidInvoices.reduce((sum, inv) => {
      return sum + parseFloat(inv.amount || '0');
    }, 0);

    const nextBillingDate = subscription?.currentPeriodEnd || null;

    return res.json({
      currentPlan: subscription?.plan || 'free',
      planStatus: subscription?.status || 'inactive',
      monthlyPrice: subscription?.price || 0,
      nextBillingDate,
      totalInvoices: userInvoices.length,
      totalSpent: totalSpent.toFixed(2),
      lastInvoice: userInvoices[0] || null,
      paymentMethod: {
        type: 'card',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2026
      }
    });
  } catch (error) {
    console.error('Error fetching billing summary:', error);
    return res.status(500).json({ error: 'Failed to fetch billing summary' });
  }
});

/**
 * POST /api/billing/update-payment-method
 * Actualizar método de pago (integración con Stripe)
 */
router.post('/update-payment-method', isAuthenticated, async (req, res) => {
  try {
    const { userId, token } = req.body;

    if (!userId || !token) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: Integrar con Stripe para actualizar método de pago
    return res.json({
      success: true,
      message: 'Payment method updated successfully'
    });
  } catch (error) {
    console.error('Error updating payment method:', error);
    return res.status(500).json({ error: 'Failed to update payment method' });
  }
});

/**
 * POST /api/billing/upgrade-plan
 * Upgrade de plan
 */
router.post('/upgrade-plan', isAuthenticated, async (req, res) => {
  try {
    const { userId, newPlan } = req.body;

    if (!userId || !newPlan) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // TODO: Integrar con Stripe para procesar upgrade
    return res.json({
      success: true,
      message: `Plan upgraded to ${newPlan}`,
      newPlan
    });
  } catch (error) {
    console.error('Error upgrading plan:', error);
    return res.status(500).json({ error: 'Failed to upgrade plan' });
  }
});

/**
 * POST /api/billing/cancel-subscription
 * Cancelar suscripción
 */
router.post('/cancel-subscription', isAuthenticated, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Missing user ID' });
    }

    // TODO: Integrar con Stripe para cancelar suscripción
    return res.json({
      success: true,
      message: 'Subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return res.status(500).json({ error: 'Failed to cancel subscription' });
  }
});

export default router;
