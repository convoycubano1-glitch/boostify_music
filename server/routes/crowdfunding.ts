import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { 
  crowdfundingCampaigns, 
  crowdfundingContributions, 
  users, 
  artistWallet,
  walletTransactions 
} from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

const router = Router();

const stripeKey = process.env.TESTING_STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
const stripe = new Stripe(stripeKey!, {
  apiVersion: '2025-01-27.acacia' as any,
});

// Crear o actualizar campaña de crowdfunding
router.post('/campaign', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const { title, description, goalAmount, isActive, endDate } = req.body;

    // Buscar usuario en PostgreSQL por replitId
    const user = await db
      .select()
      .from(users)
      .where(eq(users.replitId, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const dbUserId = user[0].id;

    // Verificar si ya existe una campaña
    const existingCampaign = await db
      .select()
      .from(crowdfundingCampaigns)
      .where(eq(crowdfundingCampaigns.userId, dbUserId))
      .limit(1);

    let campaign;

    if (existingCampaign && existingCampaign.length > 0) {
      // Actualizar campaña existente
      const [updatedCampaign] = await db
        .update(crowdfundingCampaigns)
        .set({
          title,
          description,
          goalAmount,
          isActive: isActive ?? existingCampaign[0].isActive,
          endDate: endDate ? new Date(endDate) : null,
          updatedAt: new Date(),
        })
        .where(eq(crowdfundingCampaigns.id, existingCampaign[0].id))
        .returning();

      campaign = updatedCampaign;
    } else {
      // Crear nueva campaña
      const [newCampaign] = await db
        .insert(crowdfundingCampaigns)
        .values({
          userId: dbUserId,
          title,
          description,
          goalAmount,
          currentAmount: '0.00',
          isActive: isActive ?? false,
          endDate: endDate ? new Date(endDate) : null,
          contributorsCount: 0,
        })
        .returning();

      campaign = newCampaign;
    }

    res.json({ success: true, campaign });
  } catch (error) {
    console.error('Error creando/actualizando campaña:', error);
    res.status(500).json({ success: false, message: 'Error al crear/actualizar campaña' });
  }
});

// Obtener campaña activa de un artista por slug
router.get('/campaign/:slug', async (req: Request, res: Response) => {
  try {
    const { slug } = req.params;

    // Buscar usuario por slug
    const user = await db
      .select()
      .from(users)
      .where(eq(users.slug, slug))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: 'Artista no encontrado' });
    }

    const dbUserId = user[0].id;

    // Buscar campaña activa
    const campaign = await db
      .select()
      .from(crowdfundingCampaigns)
      .where(
        and(
          eq(crowdfundingCampaigns.userId, dbUserId),
          eq(crowdfundingCampaigns.isActive, true)
        )
      )
      .limit(1);

    if (!campaign || campaign.length === 0) {
      return res.json({ success: true, campaign: null });
    }

    res.json({ success: true, campaign: campaign[0] });
  } catch (error) {
    console.error('Error obteniendo campaña:', error);
    res.status(500).json({ success: false, message: 'Error al obtener campaña' });
  }
});

// Obtener campaña del usuario autenticado
router.get('/my-campaign', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    const user = await db
      .select()
      .from(users)
      .where(eq(users.replitId, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const dbUserId = user[0].id;

    const campaign = await db
      .select()
      .from(crowdfundingCampaigns)
      .where(eq(crowdfundingCampaigns.userId, dbUserId))
      .limit(1);

    if (!campaign || campaign.length === 0) {
      return res.json({ success: true, campaign: null });
    }

    res.json({ success: true, campaign: campaign[0] });
  } catch (error) {
    console.error('Error obteniendo campaña del usuario:', error);
    res.status(500).json({ success: false, message: 'Error al obtener campaña' });
  }
});

// Crear Payment Intent para contribución
router.post('/create-payment-intent', async (req: Request, res: Response) => {
  try {
    const { campaignId, amount, contributorEmail, contributorName } = req.body;

    if (!campaignId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Datos inválidos' });
    }

    // Verificar que la campaña existe y está activa
    const campaign = await db
      .select()
      .from(crowdfundingCampaigns)
      .where(
        and(
          eq(crowdfundingCampaigns.id, campaignId),
          eq(crowdfundingCampaigns.isActive, true)
        )
      )
      .limit(1);

    if (!campaign || campaign.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaña no encontrada o inactiva' });
    }

    // Calcular fees: 30% plataforma, 70% artista
    const totalAmount = parseFloat(amount);
    const platformFee = totalAmount * 0.30;
    const artistAmount = totalAmount * 0.70;

    // Crear Payment Intent en Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe usa centavos
      currency: 'usd',
      metadata: {
        campaignId: campaignId.toString(),
        platformFee: platformFee.toFixed(2),
        artistAmount: artistAmount.toFixed(2),
        contributorEmail: contributorEmail || '',
        contributorName: contributorName || '',
      },
      description: `Crowdfunding: ${campaign[0].title}`,
      receipt_email: contributorEmail || undefined,
    });

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('Error creando Payment Intent:', error);
    res.status(500).json({ success: false, message: 'Error al crear Payment Intent' });
  }
});

// Confirmar contribución después de pago exitoso
router.post('/confirm-contribution', async (req: Request, res: Response) => {
  try {
    const { 
      paymentIntentId, 
      campaignId, 
      amount, 
      contributorEmail, 
      contributorName, 
      message, 
      isAnonymous 
    } = req.body;

    if (!paymentIntentId || !campaignId || !amount) {
      return res.status(400).json({ success: false, message: 'Datos inválidos' });
    }

    // Verificar el estado del pago en Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ success: false, message: 'Pago no completado' });
    }

    const totalAmount = parseFloat(amount);
    const platformFee = totalAmount * 0.30;
    const artistAmount = totalAmount * 0.70;

    // Registrar la contribución
    const [contribution] = await db
      .insert(crowdfundingContributions)
      .values({
        campaignId,
        contributorEmail: isAnonymous ? null : contributorEmail,
        contributorName: isAnonymous ? null : contributorName,
        isAnonymous: isAnonymous ?? false,
        amount: totalAmount.toFixed(2),
        platformFee: platformFee.toFixed(2),
        artistAmount: artistAmount.toFixed(2),
        stripePaymentIntentId: paymentIntentId,
        paymentStatus: 'succeeded',
        message: message || null,
      })
      .returning();

    // Actualizar la campaña
    const campaign = await db
      .select()
      .from(crowdfundingCampaigns)
      .where(eq(crowdfundingCampaigns.id, campaignId))
      .limit(1);

    if (campaign && campaign.length > 0) {
      const currentAmount = parseFloat(campaign[0].currentAmount || '0');
      const newCurrentAmount = currentAmount + totalAmount;
      const currentContributors = campaign[0].contributorsCount || 0;

      await db
        .update(crowdfundingCampaigns)
        .set({
          currentAmount: newCurrentAmount.toFixed(2),
          contributorsCount: currentContributors + 1,
          updatedAt: new Date(),
        })
        .where(eq(crowdfundingCampaigns.id, campaignId));

      // Actualizar wallet del artista
      const wallet = await db
        .select()
        .from(artistWallet)
        .where(eq(artistWallet.userId, campaign[0].userId))
        .limit(1);

      if (wallet && wallet.length > 0) {
        const currentBalance = parseFloat(wallet[0].balance || '0');
        const newBalance = currentBalance + artistAmount;
        const currentEarnings = parseFloat(wallet[0].totalEarnings || '0');
        const newEarnings = currentEarnings + artistAmount;

        await db
          .update(artistWallet)
          .set({
            balance: newBalance.toFixed(2),
            totalEarnings: newEarnings.toFixed(2),
            updatedAt: new Date(),
          })
          .where(eq(artistWallet.id, wallet[0].id));

        // Registrar transacción en el wallet
        await db
          .insert(walletTransactions)
          .values({
            userId: campaign[0].userId,
            type: 'earning',
            amount: artistAmount.toFixed(2),
            balanceBefore: currentBalance.toFixed(2),
            balanceAfter: newBalance.toFixed(2),
            description: `Crowdfunding contribution: ${campaign[0].title}`,
            metadata: {
              contributionId: contribution.id,
              campaignId: campaignId,
            },
          });
      } else {
        // Crear wallet si no existe
        await db
          .insert(artistWallet)
          .values({
            userId: campaign[0].userId,
            balance: artistAmount.toFixed(2),
            totalEarnings: artistAmount.toFixed(2),
            totalSpent: '0.00',
            currency: 'usd',
          });

        // Registrar transacción inicial
        await db
          .insert(walletTransactions)
          .values({
            userId: campaign[0].userId,
            type: 'earning',
            amount: artistAmount.toFixed(2),
            balanceBefore: '0.00',
            balanceAfter: artistAmount.toFixed(2),
            description: `Crowdfunding contribution: ${campaign[0].title}`,
            metadata: {
              contributionId: contribution.id,
              campaignId: campaignId,
            },
          });
      }
    }

    res.json({ success: true, contribution });
  } catch (error) {
    console.error('Error confirmando contribución:', error);
    res.status(500).json({ success: false, message: 'Error al confirmar contribución' });
  }
});

// Obtener contribuciones de una campaña
router.get('/contributions/:campaignId', authenticate, async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'Usuario no autenticado' });
    }

    // Verificar que la campaña pertenece al usuario
    const user = await db
      .select()
      .from(users)
      .where(eq(users.replitId, userId))
      .limit(1);

    if (!user || user.length === 0) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    const campaign = await db
      .select()
      .from(crowdfundingCampaigns)
      .where(
        and(
          eq(crowdfundingCampaigns.id, parseInt(campaignId)),
          eq(crowdfundingCampaigns.userId, user[0].id)
        )
      )
      .limit(1);

    if (!campaign || campaign.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
    }

    // Obtener contribuciones
    const contributions = await db
      .select()
      .from(crowdfundingContributions)
      .where(eq(crowdfundingContributions.campaignId, parseInt(campaignId)))
      .orderBy(desc(crowdfundingContributions.createdAt));

    res.json({ success: true, contributions });
  } catch (error) {
    console.error('Error obteniendo contribuciones:', error);
    res.status(500).json({ success: false, message: 'Error al obtener contribuciones' });
  }
});

// Estadísticas de la campaña
router.get('/stats/:campaignId', async (req: Request, res: Response) => {
  try {
    const { campaignId } = req.params;

    const campaign = await db
      .select()
      .from(crowdfundingCampaigns)
      .where(eq(crowdfundingCampaigns.id, parseInt(campaignId)))
      .limit(1);

    if (!campaign || campaign.length === 0) {
      return res.status(404).json({ success: false, message: 'Campaña no encontrada' });
    }

    const contributions = await db
      .select()
      .from(crowdfundingContributions)
      .where(eq(crowdfundingContributions.campaignId, parseInt(campaignId)));

    const totalRaised = parseFloat(campaign[0].currentAmount || '0');
    const goalAmount = parseFloat(campaign[0].goalAmount || '0');
    const percentageReached = goalAmount > 0 ? (totalRaised / goalAmount) * 100 : 0;
    const averageContribution = contributions.length > 0 
      ? totalRaised / contributions.length 
      : 0;

    res.json({
      success: true,
      stats: {
        totalRaised,
        goalAmount,
        percentageReached: Math.min(percentageReached, 100),
        contributorsCount: campaign[0].contributorsCount || 0,
        averageContribution,
        isActive: campaign[0].isActive,
        endDate: campaign[0].endDate,
      },
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

export default router;
