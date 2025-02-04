import { Router } from 'express';
import Stripe from 'stripe';
import { db } from '@db';
import { bookings, payments } from '@db/schema';
import { eq } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

const router = Router();

router.post('/api/create-payment-intent', async (req, res) => {
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

router.post('/api/stripe-webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
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
  } catch (error) {
    console.error('Error handling webhook:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});

export default router;
