/**
 * 🎵 ARTIST SEQUENCE SENDER
 * Envía emails HTML de la secuencia de 10 emails para artistas
 * Usa los templates de artist-email-templates.ts
 */

const { Pool } = require('pg');
const { Resend } = require('resend');
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.secrets') });

// Parse arguments
const args = process.argv.slice(2).reduce((acc, arg) => {
  const [key, value] = arg.replace('--', '').split('=');
  acc[key] = value;
  return acc;
}, {});

const SEQUENCE_NUMBER = parseInt(args.sequence || '1');
const MAX_EMAILS = parseInt(args.max || '50');
const PREVIEW_MODE = args.preview === 'true';
const PREVIEW_EMAIL = 'convoycubano@gmail.com';

// Database
const pool = new Pool({
  connectionString: process.env.SUPABASE_CONNECTION_STRING,
  ssl: { rejectUnauthorized: false }
});

// Resend (usar dominio principal para secuencia HTML)
const resend = new Resend(process.env.RESEND_API_INDUSTRY);
const FROM_EMAIL = 'artists@boostifymusic.com';
const FROM_NAME = 'Boostify Music';

// Email sequence subjects and preheaders
const EMAIL_SEQUENCE = [
  { 
    num: 1, 
    subject: '🎵 {{artistName}}, Your Professional Artist Page is Ready (FREE)',
    preheader: 'Create your artist page in 2 minutes',
    cta: 'Create My Artist Page',
    ctaUrl: 'https://boostifymusic.com/my-artists'
  },
  { 
    num: 2, 
    subject: '{{artistName}}, See How Other Artists Are Growing with Boostify',
    preheader: 'Real results from real artists',
    cta: 'See Artist Examples',
    ctaUrl: 'https://boostifymusic.com/artist/birdie-krajcik'
  },
  { 
    num: 3, 
    subject: '{{artistName}}, Connect with Artists Who Want to Collaborate',
    preheader: 'BoostiSwap: Exchange support with other artists',
    cta: 'Try BoostiSwap',
    ctaUrl: 'https://boostifymusic.com/boostiswap'
  },
  { 
    num: 4, 
    subject: '{{artistName}}, Multiply Your YouTube Views 📈',
    preheader: 'Organic growth for your music videos',
    cta: 'Boost My Videos',
    ctaUrl: 'https://boostifymusic.com/youtube-views'
  },
  { 
    num: 5, 
    subject: '{{artistName}}, Your Artist Page Is Still Waiting...',
    preheader: 'Takes just 2 minutes to set up',
    cta: 'Claim My Page',
    ctaUrl: 'https://boostifymusic.com/my-artists'
  },
  { 
    num: 6, 
    subject: '"Boostify Changed My Career" — Read What Other Artists Say',
    preheader: 'Testimonials from our artist community',
    cta: 'Join the Community',
    ctaUrl: 'https://boostifymusic.com/my-artists'
  },
  { 
    num: 7, 
    subject: '{{artistName}}, Know Your Fans Like Never Before 📊',
    preheader: 'Analytics dashboard for your artist page',
    cta: 'See Analytics Demo',
    ctaUrl: 'https://boostifymusic.com/artist/birdie-krajcik'
  },
  { 
    num: 8, 
    subject: '{{artistName}}, Last Chance: Premium FREE for 1 Year 🎁',
    preheader: 'Exclusive offer for early adopters',
    cta: 'Claim Premium Free',
    ctaUrl: 'https://boostifymusic.com/my-artists'
  },
  { 
    num: 9, 
    subject: '{{artistName}}, We Are Now +5,000 Artists Growing Together',
    preheader: 'Join our artist community',
    cta: 'Join 5,000+ Artists',
    ctaUrl: 'https://boostifymusic.com/my-artists'
  },
  { 
    num: 10, 
    subject: '{{artistName}}, This Is My Last Message (For Now) 👋',
    preheader: 'Final invitation to join Boostify',
    cta: 'One Last Chance',
    ctaUrl: 'https://boostifymusic.com/my-artists'
  }
];

// Generate HTML email
function generateEmailHTML(lead, sequence) {
  const artistName = lead.artist_name || lead.first_name || lead.name || 'Artist';
  const subject = sequence.subject.replace('{{artistName}}', artistName);
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #0f172a;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Card -->
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="background-color: #1e293b; border-radius: 16px; overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 800;">
                🎵 BOOSTIFY
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                The Platform for Independent Artists
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px 0; color: #ffffff; font-size: 22px;">
                Hey ${artistName}! 👋
              </h2>
              
              <p style="margin: 0 0 20px 0; color: #94a3b8; font-size: 16px; line-height: 1.6;">
                ${getEmailBody(sequence.num, artistName)}
              </p>
              
              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin: 30px 0;">
                <tr>
                  <td align="center">
                    <a href="${sequence.ctaUrl}?ref=email_seq_${sequence.num}" 
                       style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 700; font-size: 16px;">
                      ${sequence.cta} →
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 20px 0 0 0; color: #64748b; font-size: 14px;">
                Best,<br>
                <strong style="color: #f97316;">Alex from Boostify</strong>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #0f172a; padding: 25px; text-align: center; border-top: 1px solid #334155;">
              <p style="margin: 0 0 10px 0; color: #64748b; font-size: 12px;">
                🎵 Boostify Music | The Platform for Independent Artists
              </p>
              <p style="margin: 0; color: #475569; font-size: 11px;">
                <a href="https://boostifymusic.com" style="color: #f97316; text-decoration: none;">boostifymusic.com</a>
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Get email body based on sequence number
function getEmailBody(num, artistName) {
  const bodies = {
    1: `I found your music and I'm really impressed with your sound. We built Boostify specifically for artists like you who deserve better tools to grow their career.\n\nCreate your FREE professional artist page in just 2 minutes. It includes streaming links, social media integration, and analytics to track your growth.`,
    2: `Artists on Boostify are seeing real results. Check out some example artist pages to see what's possible. Your music deserves the same professional presence.`,
    3: `BoostiSwap is our artist collaboration feature. Connect with other artists in your genre, exchange playlist adds, share each other's music, and grow together.`,
    4: `We have tools to help boost your YouTube music video views organically. More views = more exposure = more fans. Simple as that.`,
    5: `Just a quick reminder - your free artist page is waiting. I know you're busy making music, but this takes just 2 minutes and could really help your career.`,
    6: `Here's what artists are saying about Boostify: "Finally a platform that understands independent artists." Join them and see for yourself.`,
    7: `Know exactly who's listening to your music. Our analytics dashboard shows you visitor data, play counts, and engagement metrics. Data-driven growth.`,
    8: `As an early adopter, you can get Premium features FREE for 1 year. This is a limited time offer. Don't miss out!`,
    9: `We just crossed 5,000 artists on the platform. The community is growing fast. Don't get left behind - join us while it's still early.`,
    10: `This is my last email for now, ${artistName}. I truly believe Boostify could help your music career. The door is always open. 🎵`
  };
  return bodies[num] || bodies[1];
}

// Random delay between emails
function randomDelay(minSeconds, maxSeconds) {
  const delay = Math.floor(Math.random() * (maxSeconds - minSeconds + 1) + minSeconds) * 1000;
  return new Promise(resolve => setTimeout(resolve, delay));
}

async function sendArtistSequence() {
  console.log('\n' + '='.repeat(60));
  console.log(`🎵 ARTIST SEQUENCE SENDER - Email #${SEQUENCE_NUMBER}/10`);
  console.log('='.repeat(60));
  console.log(`📧 Mode: ${PREVIEW_MODE ? 'PREVIEW (convoycubano@gmail.com)' : '🔴 PRODUCTION'}`);
  console.log(`📊 Max emails: ${MAX_EMAILS}`);
  console.log('─'.repeat(60));

  const sequence = EMAIL_SEQUENCE.find(s => s.num === SEQUENCE_NUMBER);
  if (!sequence) {
    console.error('❌ Invalid sequence number');
    return;
  }

  const client = await pool.connect();

  try {
    // For sequence 1, get leads that completed warmup or any lead with lead_status
    // For sequences 2-10, get leads that received previous sequence (tracked by emails_sent)
    let leads = [];
    
    if (SEQUENCE_NUMBER === 1) {
      // Get leads that completed warmup (warmup_stage >= 3) or have status 'new'
      const leadsResult = await client.query(`
        SELECT l.*, ls.warmup_stage, ls.emails_sent, ls.id as status_id
        FROM leads l
        JOIN lead_status ls ON l.id = ls.lead_id
        WHERE (ls.warmup_stage >= 3 OR ls.status = 'new')
          AND (ls.emails_sent IS NULL OR ls.emails_sent < 4)
        ORDER BY l.created_at ASC
        LIMIT $1
      `, [MAX_EMAILS]);
      leads = leadsResult.rows;
    } else {
      // Get leads that have received the previous sequence email
      const leadsResult = await client.query(`
        SELECT l.*, ls.warmup_stage, ls.emails_sent, ls.id as status_id
        FROM leads l
        JOIN lead_status ls ON l.id = ls.lead_id
        WHERE ls.emails_sent = $1 + 2
          AND ls.last_email_at < NOW() - INTERVAL '2 days'
        ORDER BY l.created_at ASC
        LIMIT $2
      `, [SEQUENCE_NUMBER, MAX_EMAILS]);
      leads = leadsResult.rows;
    }

    console.log(`\n📋 Leads encontrados: ${leads.length}`);

    if (leads.length === 0) {
      console.log('✅ No hay leads listos para esta secuencia');
      return;
    }

    let sent = 0;
    let errors = 0;

    for (const lead of leads) {
      const artistName = lead.artist_name || lead.first_name || lead.name || 'Artist';
      const subject = sequence.subject.replace('{{artistName}}', artistName);
      const targetEmail = PREVIEW_MODE ? PREVIEW_EMAIL : lead.email;

      console.log(`\n📧 [${sent + 1}/${leads.length}] ${artistName}`);
      console.log(`   📨 To: ${targetEmail}`);
      console.log(`   📝 Subject: ${subject}`);

      try {
        const html = generateEmailHTML(lead, sequence);

        const result = await resend.emails.send({
          from: `${FROM_NAME} <${FROM_EMAIL}>`,
          to: [targetEmail],
          subject: subject,
          html: html
        });

        if (result.error) {
          throw new Error(result.error.message);
        }

        console.log(`   ✅ Enviado: ${result.data?.id}`);

        // Update lead status
        if (!PREVIEW_MODE) {
          await client.query(`
            UPDATE lead_status 
            SET status = 'sequence',
                emails_sent = COALESCE(emails_sent, 0) + 1,
                last_email_at = NOW(),
                next_email_at = NOW() + INTERVAL '3 days',
                notes = COALESCE(notes, '') || ' | Seq #' || $1
            WHERE id = $2
          `, [SEQUENCE_NUMBER, lead.status_id]);

          // Log the send
          await client.query(`
            INSERT INTO email_sends (lead_id, domain, template, subject, status)
            VALUES ($1, 'boostifymusic.com', $2, $3, 'sent')
          `, [lead.id, `artist_sequence_${SEQUENCE_NUMBER}`, subject]);
        }

        sent++;

        // Random delay between emails (30-90 seconds)
        if (sent < leads.length) {
          const delaySeconds = Math.floor(Math.random() * 60) + 30;
          console.log(`   ⏳ Esperando ${delaySeconds}s...`);
          await randomDelay(30, 90);
        }

      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
        errors++;
        await randomDelay(5, 15);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 RESUMEN');
    console.log('='.repeat(60));
    console.log(`✅ Enviados: ${sent}`);
    console.log(`❌ Errores: ${errors}`);
    console.log(`📧 Secuencia: #${SEQUENCE_NUMBER}/10`);

  } finally {
    client.release();
    await pool.end();
  }
}

sendArtistSequence().catch(console.error);
