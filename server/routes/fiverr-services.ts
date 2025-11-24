import { Router } from 'express';
import { db } from '../db';
import { fiverr_services, pending_orders } from '../../shared/fiverr-services-schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';

const router = Router();

// GET services by category
router.get('/api/services', async (req, res) => {
  try {
    const { category } = req.query;
    
    const query = db
      .select()
      .from(fiverr_services)
      .where(eq(fiverr_services.isActive, true));

    if (category) {
      const services = await query.where(eq(fiverr_services.category, category as string));
      res.json(services);
    } else {
      const services = await query;
      res.json(services);
    }
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
});

// POST create order (requires auth - all users can order)
router.post('/api/services/order', authenticate, async (req, res) => {
  try {
    const { serviceId, quantity, category } = req.body;
    const userId = req.user?.id;

    if (!userId || !serviceId || !quantity) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Services are available to ALL users (free, basic, pro, premium)
    // They are charged separately via Stripe

    // Fetch service
    const service = await db
      .select()
      .from(fiverr_services)
      .where(eq(fiverr_services.id, parseInt(serviceId)))
      .limit(1);

    if (!service || service.length === 0) {
      return res.status(404).json({ error: 'Service not found' });
    }

    const svc = service[0];
    const totalPrice = parseFloat(svc.boostifyPrice) * quantity;

    // Create pending order
    const order = await db.insert(pending_orders).values({
      userId,
      serviceId: parseInt(serviceId),
      quantity,
      boostifyPrice: totalPrice.toString(),
      status: 'pending',
      webhook_token: `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    res.json({
      success: true,
      orderId: order.insertId || order[0],
      message: 'Order created successfully',
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET orders for user
router.get('/api/services/orders', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const orders = await db
      .select()
      .from(pending_orders)
      .where(eq(pending_orders.userId, userId));

    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST webhook from Fiverr (would be called by Fiverr when order completes)
router.post('/api/webhooks/fiverr', async (req, res) => {
  try {
    const { webhook_token, status, fiverr_order_id } = req.body;

    // Validate webhook token
    const order = await db
      .select()
      .from(pending_orders)
      .where(eq(pending_orders.webhook_token, webhook_token))
      .limit(1);

    if (!order || order.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Update order status
    await db
      .update(pending_orders)
      .set({
        status,
        fiverr_order_id,
        completedAt: new Date(),
      })
      .where(eq(pending_orders.webhook_token, webhook_token));

    res.json({ success: true, message: 'Order updated' });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

export const setupFiverServicesRoutes = (app: any) => {
  app.use(router);
};
