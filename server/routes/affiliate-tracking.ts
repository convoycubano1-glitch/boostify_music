import express, { Request, Response } from 'express';
import { db } from '../db';
import { affiliateLinks, affiliates, affiliateTracking } from '../../db/schema';
import { eq, sql, and } from 'drizzle-orm';

const router = express.Router();

/**
 * GET /ref/:code
 * Tracks a click and redirects to the destination
 */
router.get('/ref/:code', async (req: Request, res: Response) => {
  try {
    const { code } = req.params;
    const userAgent = req.headers['user-agent'] || 'unknown';
    const referrer = req.headers['referer'] || req.headers['referrer'] || null;
    
    // Get client IP
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() 
      || req.headers['x-real-ip'] as string
      || req.socket.remoteAddress
      || 'unknown';

    // Find the affiliate link
    const [link] = await db.select().from(affiliateLinks)
      .where(eq(affiliateLinks.trackingCode, code.toUpperCase()))
      .limit(1);

    if (!link) {
      return res.redirect('/');
    }

    // Determine device type
    let device: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    if (userAgent) {
      if (/mobile/i.test(userAgent) && !/tablet/i.test(userAgent)) {
        device = 'mobile';
      } else if (/tablet|ipad/i.test(userAgent)) {
        device = 'tablet';
      }
    }

    // Record the click
    await db.insert(affiliateTracking).values({
      affiliateId: link.affiliateId,
      eventType: 'click',
      metadata: {
        ipAddress,
        userAgent,
        referrer: referrer ? referrer.substring(0, 500) : null,
        device,
        linkId: link.id
      },
      linkId: link.id
    });

    // Update link clicks count
    await db.update(affiliateLinks)
      .set({ clicks: sql`${affiliateLinks.clicks} + 1` })
      .where(eq(affiliateLinks.id, link.id));

    // Update affiliate total clicks
    await db.update(affiliates)
      .set({ 
        totalClicks: sql`${affiliates.totalClicks} + 1`,
        updatedAt: new Date()
      })
      .where(eq(affiliates.id, link.affiliateId));

    // Redirect to the actual URL
    res.redirect(link.url || '/');
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

/**
 * POST /track/conversion
 * Records a conversion event
 */
router.post('/track/conversion', async (req: Request, res: Response) => {
  try {
    const { linkId, orderId, amount } = req.body;

    if (!linkId) {
      return res.status(400).json({ error: 'linkId is required' });
    }

    // Get the link
    const [link] = await db.select().from(affiliateLinks)
      .where(eq(affiliateLinks.id, linkId))
      .limit(1);

    if (!link) {
      return res.status(404).json({ error: 'Link not found' });
    }

    // Record conversion
    await db.insert(affiliateTracking).values({
      affiliateId: link.affiliateId,
      eventType: 'conversion',
      metadata: {
        orderId: orderId || null,
        amount: amount || 0,
        linkId
      },
      linkId
    });

    // Update link conversions
    await db.update(affiliateLinks)
      .set({ conversions: sql`${affiliateLinks.conversions} + 1` })
      .where(eq(affiliateLinks.id, linkId));

    // Update affiliate conversions
    await db.update(affiliates)
      .set({ 
        totalConversions: sql`${affiliates.totalConversions} + 1`,
        updatedAt: new Date()
      })
      .where(eq(affiliates.id, link.affiliateId));

    res.json({ success: true, message: 'Conversion recorded' });
  } catch (error) {
    console.error('Error recording conversion:', error);
    res.status(500).json({ error: 'Failed to record conversion' });
  }
});

/**
 * POST /track/coupon-use
 * Records when an affiliate's coupon is used
 */
router.post('/track/coupon-use', async (req: Request, res: Response) => {
  try {
    const { affiliateId, couponCode, amount } = req.body;

    if (!affiliateId) {
      return res.status(400).json({ error: 'affiliateId is required' });
    }

    // Record coupon usage
    await db.insert(affiliateTracking).values({
      affiliateId,
      eventType: 'coupon_use',
      metadata: {
        couponCode: couponCode || null,
        amount: amount || 0
      }
    });

    res.json({ success: true, message: 'Coupon use recorded' });
  } catch (error) {
    console.error('Error recording coupon use:', error);
    res.status(500).json({ error: 'Failed to record coupon use' });
  }
});

/**
 * GET /stats/:affiliateId
 * Get tracking stats for an affiliate
 */
router.get('/stats/:affiliateId', async (req: Request, res: Response) => {
  try {
    const affiliateId = parseInt(req.params.affiliateId);
    if (isNaN(affiliateId)) {
      return res.status(400).json({ error: 'Invalid affiliate ID' });
    }

    const [affiliate] = await db.select().from(affiliates)
      .where(eq(affiliates.id, affiliateId))
      .limit(1);

    if (!affiliate) {
      return res.status(404).json({ error: 'Affiliate not found' });
    }

    // Get tracking data
    const links = await db.select().from(affiliateLinks)
      .where(eq(affiliateLinks.affiliateId, affiliateId));

    res.json({
      success: true,
      stats: {
        totalClicks: affiliate.totalClicks || 0,
        totalConversions: affiliate.totalConversions || 0,
        totalEarnings: affiliate.totalEarnings || '0',
        links: links.length
      }
    });
  } catch (error) {
    console.error('Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
