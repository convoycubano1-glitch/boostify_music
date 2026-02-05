/**
 * Brevo Webhook Routes
 * Handles incoming webhooks from Brevo for email events
 * Webhook URL: https://boostifymusic.com/api/webhooks/brevo
 * 
 * ACTUALIZADO: Ahora registra bounces en el servicio de verificación
 * y actualiza la base de datos automáticamente
 */

import express, { Request, Response, Router } from 'express';
import { Pool } from 'pg';
import { registerBounce } from '../services/email-verification-service.js';

const router: Router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

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
        await handleSoftBounce(event.email, event.reason || 'Soft bounce');
        break;
        
      case 'hard_bounce':
        console.log(`❌ Hard bounce: ${event.reason}`);
        await handleHardBounce(event.email, event.reason || 'Hard bounce');
        break;
        
      case 'spam':
        console.log('🚫 Email marked as spam');
        await handleSpamComplaint(event.email);
        break;
        
      case 'unsubscribed':
        console.log('📤 User unsubscribed');
        await handleUnsubscribe(event.email);
        break;
        
      case 'blocked':
        console.log(`🚫 Email blocked: ${event.reason}`);
        await handleHardBounce(event.email, `Blocked: ${event.reason}`);
        break;
        
      case 'invalid_email':
        console.log('❌ Invalid email address');
        await handleHardBounce(event.email, 'Invalid email address');
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

// === BOUNCE HANDLERS ===

/**
 * Handle hard bounce - email doesn't exist
 */
async function handleHardBounce(email: string, reason: string): Promise<void> {
  console.log(`📛 HANDLING HARD BOUNCE: ${email}`);
  
  // 1. Register in memory for future verifications
  registerBounce(email);
  
  // 2. Update database
  const client = await pool.connect();
  try {
    // Update artist_leads
    await client.query(`
      UPDATE artist_leads 
      SET lead_status = 'bounced',
          updated_at = NOW()
      WHERE LOWER(email) = LOWER($1)
    `, [email]);
    
    // Update investor_leads if exists
    await client.query(`
      UPDATE investor_leads 
      SET status = 'bounced',
          updated_at = NOW()
      WHERE LOWER(email) = LOWER($1)
    `, [email]).catch(() => {});
    
    // Log the bounce
    await client.query(`
      INSERT INTO email_logs (to_email, status, error_message, sent_at)
      VALUES ($1, 'bounced', $2, NOW())
    `, [email, reason]).catch(() => {});
    
    console.log(`   ✅ Database updated for ${email}`);
  } catch (error) {
    console.log(`   ⚠️ Could not update all tables`);
  } finally {
    client.release();
  }
}

/**
 * Handle soft bounce - temporary delivery failure
 */
async function handleSoftBounce(email: string, reason: string): Promise<void> {
  console.log(`⚠️ HANDLING SOFT BOUNCE: ${email}`);
  
  const client = await pool.connect();
  try {
    // Count previous soft bounces
    const result = await client.query(`
      SELECT COUNT(*) as count FROM email_logs 
      WHERE LOWER(to_email) = LOWER($1) AND status = 'soft_bounce'
      AND sent_at > NOW() - INTERVAL '7 days'
    `, [email]);
    
    const previousCount = parseInt(result.rows[0]?.count || '0');
    
    // If 3+ soft bounces in a week, treat as hard bounce
    if (previousCount >= 2) {
      console.log(`   ⚠️ 3rd soft bounce in 7 days, treating as hard bounce`);
      await handleHardBounce(email, '3 consecutive soft bounces');
      return;
    }
    
    // Log soft bounce
    await client.query(`
      INSERT INTO email_logs (to_email, status, error_message, sent_at)
      VALUES ($1, 'soft_bounce', $2, NOW())
    `, [email, reason]).catch(() => {});
    
    console.log(`   📊 Soft bounce logged (${previousCount + 1}/3)`);
  } catch (error) {
    console.log(`   ⚠️ Could not log soft bounce`);
  } finally {
    client.release();
  }
}

/**
 * Handle spam complaint - never send again
 */
async function handleSpamComplaint(email: string): Promise<void> {
  console.log(`🔴 HANDLING SPAM COMPLAINT: ${email}`);
  
  // Register as bounce to never send again
  registerBounce(email);
  
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE artist_leads 
      SET lead_status = 'spam_complaint',
          updated_at = NOW()
      WHERE LOWER(email) = LOWER($1)
    `, [email]);
    
    await client.query(`
      UPDATE investor_leads 
      SET status = 'spam_complaint',
          updated_at = NOW()
      WHERE LOWER(email) = LOWER($1)
    `, [email]).catch(() => {});
    
    console.log(`   ✅ Marked as spam complaint`);
  } catch (error) {
    console.log(`   ⚠️ Partial update`);
  } finally {
    client.release();
  }
}

/**
 * Handle unsubscribe
 */
async function handleUnsubscribe(email: string): Promise<void> {
  console.log(`📭 HANDLING UNSUBSCRIBE: ${email}`);
  
  const client = await pool.connect();
  try {
    await client.query(`
      UPDATE artist_leads 
      SET lead_status = 'unsubscribed',
          updated_at = NOW()
      WHERE LOWER(email) = LOWER($1)
    `, [email]);
    
    await client.query(`
      UPDATE investor_leads 
      SET status = 'unsubscribed',
          updated_at = NOW()
      WHERE LOWER(email) = LOWER($1)
    `, [email]).catch(() => {});
    
    console.log(`   ✅ Marked as unsubscribed`);
  } catch (error) {
    console.log(`   ⚠️ Partial update`);
  } finally {
    client.release();
  }
}

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
