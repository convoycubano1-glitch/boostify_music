import express, { Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { db } from '../db';
import { 
  affiliates, 
  affiliateLinks, 
  affiliateClicks, 
  affiliateConversions,
  affiliateEarnings,
  affiliateCoupons,
  affiliatePromotions,
  affiliateBadges,
  affiliateReferrals,
  affiliateMarketingMaterials,
  insertAffiliateSchema,
  insertAffiliateLinkSchema,
  insertAffiliateCouponSchema,
  insertAffiliatePromotionSchema,
  insertAffiliateReferralSchema
} from '../../db/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { z } from 'zod';
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

    // Get recent conversions
    const conversions = await db.select().from(affiliateConversions)
      .where(eq(affiliateConversions.affiliateId, affiliate.id))
      .orderBy(desc(affiliateConversions.convertedAt))
      .limit(10);

    // Get badges
    const badges = await db.select().from(affiliateBadges)
      .where(eq(affiliateBadges.affiliateId, affiliate.id));

    res.json({
      success: true,
      affiliate: {
        ...affiliate,
        stats: {
          totalClicks: affiliate.totalClicks,
          conversions: affiliate.totalConversions,
          earnings: Number(affiliate.totalEarnings),
          pendingPayment: Number(affiliate.pendingPayment),
        },
        links,
        conversions,
        badges
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

    // Validate input
    const validatedData = insertAffiliateSchema.parse({
      userId,
      fullName: req.body.fullName,
      email: req.body.email,
      website: req.body.website || null,
      socialMedia: req.body.socialMedia || null,
      audienceSize: req.body.audienceSize,
      marketingExperience: req.body.marketingExperience,
      promotionStrategy: req.body.promotionStrategy,
      level: 'Básico',
      status: 'pending'
    });

    const [newAffiliate] = await db.insert(affiliates).values(validatedData).returning();

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

    if (affiliate.status !== 'approved') {
      return res.status(403).json({ success: false, message: 'Tu cuenta de afiliado debe estar aprobada para crear enlaces' });
    }

    const uniqueCode = generateUniqueCode();
    const validatedData = insertAffiliateLinkSchema.parse({
      affiliateId: affiliate.id,
      uniqueCode,
      title: req.body.title,
      description: req.body.description || null,
      productType: req.body.productType || 'general',
      productId: req.body.productId || null,
      customPath: req.body.customPath || null
    });

    const [newLink] = await db.insert(affiliateLinks).values(validatedData).returning();

    const trackingUrl = `${process.env.REPLIT_DEV_DOMAIN || 'https://yourdomain.com'}/ref/${uniqueCode}`;

    res.json({
      success: true,
      link: {
        ...newLink,
        fullUrl: trackingUrl
      }
    });
  } catch (error: any) {
    console.error('[AFFILIATE CREATE LINK ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Error al crear enlace' });
  }
});

/**
 * GET /api/affiliate/coupons
 * Obtiene todos los cupones del afiliado
 */
router.get('/coupons', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const coupons = await db.select().from(affiliateCoupons)
      .where(eq(affiliateCoupons.affiliateId, affiliate.id))
      .orderBy(desc(affiliateCoupons.createdAt));

    res.json({ success: true, coupons });
  } catch (error) {
    console.error('[AFFILIATE COUPONS ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener cupones' });
  }
});

/**
 * POST /api/affiliate/coupons
 * Crea un nuevo cupón
 */
router.post('/coupons', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const code = req.body.code || `${affiliate.fullName.substring(0, 3).toUpperCase()}${generateUniqueCode(6)}`;
    
    const validatedData = insertAffiliateCouponSchema.parse({
      affiliateId: affiliate.id,
      code,
      description: req.body.description,
      discountType: req.body.discountType,
      discountValue: req.body.discountValue,
      minimumPurchase: req.body.minimumPurchase || null,
      maxUses: req.body.maxUses || null,
      expiresAt: req.body.expiresAt ? new Date(req.body.expiresAt) : null,
      applicableProducts: req.body.applicableProducts || null
    });

    const [newCoupon] = await db.insert(affiliateCoupons).values(validatedData).returning();

    res.json({ success: true, coupon: newCoupon });
  } catch (error: any) {
    console.error('[AFFILIATE CREATE COUPON ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Error al crear cupón' });
  }
});

/**
 * GET /api/affiliate/promotions
 * Obtiene todas las promociones del afiliado
 */
router.get('/promotions', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const promotions = await db.select().from(affiliatePromotions)
      .where(eq(affiliatePromotions.affiliateId, affiliate.id))
      .orderBy(desc(affiliatePromotions.createdAt));

    res.json({ success: true, promotions });
  } catch (error) {
    console.error('[AFFILIATE PROMOTIONS ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener promociones' });
  }
});

/**
 * POST /api/affiliate/promotions
 * Crea una nueva promoción
 */
router.post('/promotions', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const validatedData = insertAffiliatePromotionSchema.parse({
      affiliateId: affiliate.id,
      title: req.body.title,
      description: req.body.description,
      bannerUrl: req.body.bannerUrl || null,
      landingPageUrl: req.body.landingPageUrl,
      startDate: new Date(req.body.startDate),
      endDate: new Date(req.body.endDate)
    });

    const [newPromotion] = await db.insert(affiliatePromotions).values(validatedData).returning();

    res.json({ success: true, promotion: newPromotion });
  } catch (error: any) {
    console.error('[AFFILIATE CREATE PROMOTION ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Error al crear promoción' });
  }
});

/**
 * GET /api/affiliate/badges
 * Obtiene todas las insignias del afiliado
 */
router.get('/badges', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const badges = await db.select().from(affiliateBadges)
      .where(eq(affiliateBadges.affiliateId, affiliate.id))
      .orderBy(desc(affiliateBadges.earnedAt));

    res.json({ success: true, badges });
  } catch (error) {
    console.error('[AFFILIATE BADGES ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener insignias' });
  }
});

/**
 * GET /api/affiliate/referrals
 * Obtiene todos los referidos del afiliado
 */
router.get('/referrals', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const referrals = await db.select().from(affiliateReferrals)
      .where(eq(affiliateReferrals.referrerId, affiliate.id))
      .orderBy(desc(affiliateReferrals.createdAt));

    res.json({ success: true, referrals });
  } catch (error) {
    console.error('[AFFILIATE REFERRALS ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener referidos' });
  }
});

/**
 * POST /api/affiliate/referrals
 * Invita un nuevo referido
 */
router.post('/referrals', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const validatedData = insertAffiliateReferralSchema.parse({
      referrerId: affiliate.id,
      referredEmail: req.body.email,
      status: 'pending'
    });

    const [newReferral] = await db.insert(affiliateReferrals).values(validatedData).returning();

    // TODO: Send invitation email

    res.json({ 
      success: true, 
      referral: newReferral,
      message: 'Invitación enviada exitosamente'
    });
  } catch (error: any) {
    console.error('[AFFILIATE CREATE REFERRAL ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Error al crear referido' });
  }
});

/**
 * GET /api/affiliate/materials
 * Obtiene todos los materiales de marketing
 */
router.get('/materials', authenticate, async (req: Request, res: Response) => {
  try {
    const materials = await db.select().from(affiliateMarketingMaterials)
      .where(eq(affiliateMarketingMaterials.isActive, true))
      .orderBy(desc(affiliateMarketingMaterials.createdAt));

    res.json({ success: true, materials });
  } catch (error) {
    console.error('[AFFILIATE MATERIALS ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener materiales' });
  }
});

/**
 * POST /api/affiliate/materials/:id/download
 * Incrementa el contador de descargas de un material
 */
router.post('/materials/:id/download', authenticate, async (req: Request, res: Response) => {
  try {
    const materialId = parseInt(req.params.id);
    
    await db.update(affiliateMarketingMaterials)
      .set({ downloadCount: sql`${affiliateMarketingMaterials.downloadCount} + 1` })
      .where(eq(affiliateMarketingMaterials.id, materialId));

    res.json({ success: true, message: 'Descarga registrada' });
  } catch (error) {
    console.error('[AFFILIATE DOWNLOAD MATERIAL ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al registrar descarga' });
  }
});

/**
 * GET /api/affiliate/earnings
 * Obtiene el historial de ganancias
 */
router.get('/earnings', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const earnings = await db.select().from(affiliateEarnings)
      .where(eq(affiliateEarnings.affiliateId, affiliate.id))
      .orderBy(desc(affiliateEarnings.createdAt));

    res.json({ success: true, earnings });
  } catch (error) {
    console.error('[AFFILIATE EARNINGS ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener ganancias' });
  }
});

/**
 * GET /api/affiliate/stats
 * Obtiene estadísticas detalladas del afiliado
 */
router.get('/stats', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    // Get last 30 days clicks by day
    const last30DaysClicks = await db.execute(sql`
      SELECT 
        DATE(clicked_at) as date, 
        COUNT(*) as clicks
      FROM affiliate_clicks
      WHERE affiliate_id = ${affiliate.id}
        AND clicked_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE(clicked_at)
      ORDER BY date ASC
    `);

    // Get conversion rate
    const conversionRate = affiliate.totalClicks > 0 
      ? (affiliate.totalConversions / affiliate.totalClicks * 100).toFixed(2)
      : '0.00';

    res.json({
      success: true,
      stats: {
        totalClicks: affiliate.totalClicks,
        totalConversions: affiliate.totalConversions,
        totalEarnings: Number(affiliate.totalEarnings),
        pendingPayment: Number(affiliate.pendingPayment),
        paidAmount: Number(affiliate.paidAmount),
        conversionRate: Number(conversionRate),
        clicksLast30Days: last30DaysClicks.rows
      }
    });
  } catch (error) {
    console.error('[AFFILIATE STATS ERROR]', error);
    res.status(500).json({ success: false, message: 'Error al obtener estadísticas' });
  }
});

/**
 * PUT /api/affiliate/settings
 * Actualiza la configuración del afiliado
 */
router.put('/settings', authenticate, async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: 'Autenticación requerida' });
    }

    const [affiliate] = await db.select().from(affiliates).where(eq(affiliates.userId, req.user.id)).limit(1);
    if (!affiliate) {
      return res.status(404).json({ success: false, message: 'Afiliado no encontrado' });
    }

    const updates: any = {};
    if (req.body.paymentMethod) updates.paymentMethod = req.body.paymentMethod;
    if (req.body.paymentEmail) updates.paymentEmail = req.body.paymentEmail;
    if (req.body.bankDetails) updates.bankDetails = req.body.bankDetails;
    if (req.body.website) updates.website = req.body.website;
    if (req.body.socialMedia) updates.socialMedia = req.body.socialMedia;
    
    updates.updatedAt = new Date();

    const [updated] = await db.update(affiliates)
      .set(updates)
      .where(eq(affiliates.id, affiliate.id))
      .returning();

    res.json({ success: true, affiliate: updated });
  } catch (error: any) {
    console.error('[AFFILIATE UPDATE SETTINGS ERROR]', error);
    res.status(400).json({ success: false, message: error.message || 'Error al actualizar configuración' });
  }
});

export default router;
