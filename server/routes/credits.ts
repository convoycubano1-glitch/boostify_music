import express from 'express';
import Stripe from 'stripe';
import { db } from '../db';
import { userCredits, creditTransactions, musicVideoProjects } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing Stripe secret key');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
});

const router = express.Router();

router.get('/api/credits/balance', async (req, res) => {
  try {
    const userEmail = req.query.email as string;
    
    if (!userEmail) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (userEmail === 'convoycubano@gmail.com') {
      return res.json({ credits: 999999, isAdmin: true });
    }

    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userEmail, userEmail));

    if (!userCredit) {
      const [newCredit] = await db
        .insert(userCredits)
        .values({ userEmail, credits: 0 })
        .returning();
      return res.json({ credits: newCredit.credits });
    }

    res.json({ credits: userCredit.credits });
  } catch (error: any) {
    console.error('Error fetching credits:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/credits/create-payment-intent', async (req, res) => {
  try {
    const { email, amount = 199 } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: 'usd',
      metadata: {
        userEmail: email,
        credits: amount.toString(),
      },
    });

    res.json({ clientSecret: paymentIntent.client_secret });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/credits/verify-payment', async (req, res) => {
  try {
    const { paymentIntentId, email } = req.body;

    if (!paymentIntentId || !email) {
      return res.status(400).json({ error: 'Payment intent ID and email are required' });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not successful' });
    }

    const credits = parseInt(paymentIntent.metadata.credits || '199');

    const [existingCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userEmail, email));

    if (existingCredit) {
      await db
        .update(userCredits)
        .set({ 
          credits: existingCredit.credits + credits,
          updatedAt: new Date()
        })
        .where(eq(userCredits.userEmail, email));
    } else {
      await db
        .insert(userCredits)
        .values({ userEmail: email, credits });
    }

    await db.insert(creditTransactions).values({
      userEmail: email,
      amount: credits,
      type: 'purchase',
      description: `Purchased ${credits} credits`,
      stripePaymentIntentId: paymentIntentId,
    });

    res.json({ success: true, credits });
  } catch (error: any) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/credits/deduct', async (req, res) => {
  try {
    const { email, amount, projectId, description } = req.body;

    if (!email || !amount) {
      return res.status(400).json({ error: 'Email and amount are required' });
    }

    if (email === 'convoycubano@gmail.com') {
      return res.json({ success: true, remainingCredits: 999999 });
    }

    const [userCredit] = await db
      .select()
      .from(userCredits)
      .where(eq(userCredits.userEmail, email));

    if (!userCredit || userCredit.credits < amount) {
      return res.status(400).json({ error: 'Insufficient credits' });
    }

    await db
      .update(userCredits)
      .set({ 
        credits: userCredit.credits - amount,
        updatedAt: new Date()
      })
      .where(eq(userCredits.userEmail, email));

    await db.insert(creditTransactions).values({
      userEmail: email,
      amount: -amount,
      type: 'deduction',
      description: description || `Deducted ${amount} credits`,
      relatedProjectId: projectId,
    });

    res.json({ success: true, remainingCredits: userCredit.credits - amount });
  } catch (error: any) {
    console.error('Error deducting credits:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/credits/transactions', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const transactions = await db
      .select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userEmail, email as string))
      .orderBy(desc(creditTransactions.createdAt))
      .limit(50);

    res.json(transactions);
  } catch (error: any) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/projects/save', async (req, res) => {
  try {
    const projectData = req.body;

    if (!projectData.userEmail) {
      return res.status(400).json({ error: 'User email is required' });
    }

    const [project] = await db
      .insert(musicVideoProjects)
      .values(projectData)
      .returning();

    res.json(project);
  } catch (error: any) {
    console.error('Error saving project:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/projects/update', async (req, res) => {
  try {
    const { id, ...updateData } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const [project] = await db
      .update(musicVideoProjects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(musicVideoProjects.id, id))
      .returning();

    res.json(project);
  } catch (error: any) {
    console.error('Error updating project:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/projects/latest', async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const [project] = await db
      .select()
      .from(musicVideoProjects)
      .where(eq(musicVideoProjects.userEmail, email as string))
      .orderBy(desc(musicVideoProjects.createdAt))
      .limit(1);

    res.json(project || null);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [project] = await db
      .select()
      .from(musicVideoProjects)
      .where(eq(musicVideoProjects.id, parseInt(id)));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json(project);
  } catch (error: any) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
