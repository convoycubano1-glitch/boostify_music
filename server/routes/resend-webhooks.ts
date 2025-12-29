/**
 * Resend Webhook Routes
 * Handles incoming webhooks from Resend for email events
 * Webhook URL: https://boostifymusic.com/api/webhooks/resend
 */

import express, { Request, Response, Router } from 'express';
import crypto from 'crypto';

const router: Router = express.Router();

// Webhook secret for signature verification
const RESEND_WEBHOOK_SECRET = process.env.RESEND_WEBHOOK_SECRET || '';

/**
 * Verify Resend webhook signature
 */
function verifyWebhookSignature(payload: string, signature: string, secret: string): boolean {
  if (!secret) {
    console.warn('⚠️ RESEND_WEBHOOK_SECRET not configured, skipping signature verification');
    return true; // Allow in development without secret
  }
  
  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    console.error('❌ Error verifying webhook signature:', error);
    return false;
  }
}

// Webhook event types from Resend
interface ResendWebhookEvent {
  type: 'email.sent' | 'email.delivered' | 'email.delivery_delayed' | 'email.complained' | 'email.bounced' | 'email.opened' | 'email.clicked';
  created_at: string;
  data: {
    created_at: string;
    email_id: string;
    from: string;
    to: string[];
    subject: string;
    // Additional fields based on event type
    click?: { link: string };
    bounce?: { type: string };
  };
}

/**
 * POST /api/webhooks/resend
 * Main webhook endpoint for Resend events
 */
router.post('/', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  try {
    // Get the signature from headers
    const signature = req.headers['resend-signature'] as string || '';
    const payload = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    
    // Verify signature in production
    if (RESEND_WEBHOOK_SECRET && signature) {
      const isValid = verifyWebhookSignature(payload, signature, RESEND_WEBHOOK_SECRET);
      if (!isValid) {
        console.error('❌ [Resend Webhook] Invalid signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }
      console.log('✅ [Resend Webhook] Signature verified');
    }
    
    const event: ResendWebhookEvent = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    
    console.log(`📧 [Resend Webhook] Event received: ${event.type}`);
    console.log(`   Email ID: ${event.data.email_id}`);
    console.log(`   To: ${event.data.to?.join(', ')}`);
    console.log(`   Subject: ${event.data.subject}`);
    
    switch (event.type) {
      case 'email.sent':
        console.log('✅ Email sent successfully');
        // Track email sent metrics
        break;
        
      case 'email.delivered':
        console.log('✅ Email delivered to recipient');
        // Update delivery status in database if needed
        break;
        
      case 'email.opened':
        console.log('👀 Email was opened');
        // Track email open rates
        break;
        
      case 'email.clicked':
        console.log(`🔗 Link clicked: ${event.data.click?.link}`);
        // Track click-through rates
        break;
        
      case 'email.bounced':
        console.log(`⚠️ Email bounced: ${event.data.bounce?.type}`);
        // Handle bounced emails - maybe flag user's email as invalid
        // TODO: Update user record to mark email as bounced
        break;
        
      case 'email.complained':
        console.log('🚫 Email marked as spam');
        // Handle spam complaints - important for email reputation
        // TODO: Remove user from mailing list
        break;
        
      case 'email.delivery_delayed':
        console.log('⏳ Email delivery delayed');
        break;
        
      default:
        console.log(`ℹ️ Unknown event type: ${event.type}`);
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true, event: event.type });
    
  } catch (error: any) {
    console.error('❌ [Resend Webhook] Error processing event:', error.message);
    // Still return 200 to prevent Resend from retrying
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * GET /api/webhooks/resend/health
 * Health check endpoint for webhook
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'resend-webhooks',
    timestamp: new Date().toISOString(),
    webhookUrl: 'https://boostifymusic.com/api/webhooks/resend'
  });
});

export default router;
