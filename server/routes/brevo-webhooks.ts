/**
 * Brevo Webhook Routes
 * Handles incoming webhooks from Brevo for email events
 * Webhook URL: https://boostifymusic.com/api/webhooks/brevo
 */

import express, { Request, Response, Router } from 'express';

const router: Router = express.Router();

// Brevo webhook event types
interface BrevoWebhookEvent {
  event: 'sent' | 'delivered' | 'request' | 'soft_bounce' | 'hard_bounce' | 'opened' | 'click' | 'spam' | 'unsubscribed' | 'blocked' | 'invalid_email' | 'deferred';
  email: string;
  id: number;
  date: string;
  ts: number;
  'message-id': string;
  subject?: string;
  tag?: string;
  link?: string;
  reason?: string;
}

/**
 * POST /api/webhooks/brevo
 * Main webhook endpoint for Brevo events
 */
router.post('/', express.json(), async (req: Request, res: Response) => {
  try {
    const event: BrevoWebhookEvent = req.body;
    
    console.log(`📧 [Brevo Webhook] Event received: ${event.event}`);
    console.log(`   Email: ${event.email}`);
    console.log(`   Message ID: ${event['message-id']}`);
    console.log(`   Subject: ${event.subject || 'N/A'}`);
    
    switch (event.event) {
      case 'sent':
      case 'request':
        console.log('✅ Email sent successfully');
        break;
        
      case 'delivered':
        console.log('✅ Email delivered to recipient');
        break;
        
      case 'opened':
        console.log('👀 Email was opened');
        break;
        
      case 'click':
        console.log(`🔗 Link clicked: ${event.link}`);
        break;
        
      case 'soft_bounce':
        console.log(`⚠️ Soft bounce: ${event.reason}`);
        break;
        
      case 'hard_bounce':
        console.log(`❌ Hard bounce: ${event.reason}`);
        // TODO: Mark email as invalid in database
        break;
        
      case 'spam':
        console.log('🚫 Email marked as spam');
        // TODO: Remove user from mailing list
        break;
        
      case 'unsubscribed':
        console.log('📤 User unsubscribed');
        // TODO: Update user preferences
        break;
        
      case 'blocked':
        console.log(`🚫 Email blocked: ${event.reason}`);
        break;
        
      case 'invalid_email':
        console.log('❌ Invalid email address');
        // TODO: Mark email as invalid
        break;
        
      case 'deferred':
        console.log('⏳ Email deferred');
        break;
        
      default:
        console.log(`ℹ️ Unknown event type: ${event.event}`);
    }
    
    // Always respond with 200 to acknowledge receipt
    res.status(200).json({ received: true, event: event.event });
    
  } catch (error: any) {
    console.error('❌ [Brevo Webhook] Error processing event:', error.message);
    res.status(200).json({ received: true, error: error.message });
  }
});

/**
 * GET /api/webhooks/brevo/health
 * Health check endpoint for webhook
 */
router.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'brevo-webhooks',
    timestamp: new Date().toISOString(),
    webhookUrl: 'https://boostifymusic.com/api/webhooks/brevo'
  });
});

export default router;
