import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { affiliates, affiliateLinks } from '../../db/schema';
import { eq, desc } from 'drizzle-orm';
import crypto from 'crypto';

const router = express.Router();

// Helper function to generate unique code
function generateUniqueCode(length: number = 8): string {
  return crypto.randomBytes(length).toString('hex').substring(0, length).toUpperCase();
}

/**
 * GET /api/affiliate/me
 * Obtiene la información del afiliado actual
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = req.user.id;
    
    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, userId)).limit(1);
    
    if (!affiliate) {
      return res.status(404).json({ 
        success: false, 
        message: 'No estás registrado como afiliado. Por favor registrate primero.' 
      });
    }

    // Get links
    const links = await db.select().from(affiliateLinks)
      .where(eq(affiliateLinks.affiliateId, affiliate.id));

    res.json({
      success: true,
      affiliate: {
        ...affiliate,
        stats: {
          totalClicks: affiliate.totalClicks || 0,
          conversions: affiliate.totalConversions || 0,
          earnings: Number(affiliate.totalEarnings || 0),
          pendingPayment: Number(affiliate.pendingPayment || 0),
        },
        links
      }
    });
  } catch (error) {
    console.error('[AFFILIATE ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener información del afiliado' });
  }
});

/**
 * POST /api/affiliate/register
 * Registra un nuevo afiliado
 */
router.post('/register', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const userId = req.user.id;

    // Check if already registered
    const [existing] = await db.select().from(affiliates).where(eq(affiliates.userId, userId)).limit(1);
    if (existing) {
      return res.status(400).json({ success: false, message: 'Ya estás registrado como afiliado' });
    }

    // Generate unique referral code
    let referralCode = generateUniqueCode(8);
    let codeExists = true;
    
    while (codeExists) {
      const existingCode = await db.query.affiliates.findFirst({
        where: (affiliates, { eq }) => eq(affiliates.referralCode, referralCode)
      });
      if (!existingCode) {
        codeExists = false;
      } else {
        referralCode = generateUniqueCode(8);
      }
    }

    const [newAffiliate] = await db.insert(affiliates).values({
      userId,
      fullName: req.body.fullName || 'Affiliate',
      email: req.body.email || '',
      website: req.body.website || null,
      socialMedia: req.body.socialMedia || null,
      audienceSize: req.body.audienceSize || 0,
      marketingExperience: req.body.marketingExperience || '',
      promotionStrategy: req.body.promotionStrategy || '',
      level: 'Básico',
      status: 'pending',
      referralCode,
      totalClicks: 0,
      totalConversions: 0,
      totalEarnings: '0',
      pendingPayment: '0'
    }).returning();

    res.json({
      success: true,
      message: 'Registro exitoso! Tu solicitud está siendo revisada.',
      affiliate: newAffiliate
    });
  } catch (error: any) {
    console.error('[AFFILIATE REGISTER ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Error al registrar afiliado' });
  }
});

/**
 * GET /api/affiliate/links
 * Obtiene todos los enlaces del afiliado
 */
router.get('/links', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const links = await db.select().from(affiliateLinks)
      .where(eq(affiliateLinks.affiliateId, affiliate.id))
      .orderBy(desc(affiliateLinks.createdAt));

    res.json({ success: true, links });
  } catch (error) {
    console.error('[AFFILIATE LINKS ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener enlaces' });
  }
});

/**
 * POST /api/affiliate/links
 * Crea un nuevo enlace de afiliado
 */
router.post('/links', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const trackingCode = generateUniqueCode(12);

    const [newLink] = await db.insert(affiliateLinks).values({
      affiliateId: affiliate.id,
      url: req.body.url || '',
      trackingCode,
      description: req.body.description || null,
      clicks: 0,
      conversions: 0,
      earnings: '0'
    }).returning();

    res.json({ success: true, link: newLink });
  } catch (error: any) {
    console.error('[AFFILIATE CREATE LINK ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Error al crear enlace' });
  }
});

/**
 * Export router
 */
export default router;
