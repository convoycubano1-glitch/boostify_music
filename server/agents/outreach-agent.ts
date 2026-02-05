/**
 * AI OUTREACH AGENT - Sistema Autónomo de Outreach a la Industria Musical
 * 
 * Funciones:
 * 1. Selecciona artistas IA destacados para promocionar
 * 2. Genera emails personalizados basados en el perfil del contacto
 * 3. Envía invitaciones a labels, managers, A&Rs
 * 4. Trackea respuestas y ajusta estrategia
 */

import { db } from '../db';
import { 
  users, 
  songs, 
  musicIndustryContacts, 
  outreachCampaigns,
  outreachEmailLog,
  artistPersonality,
  tokenizedSongs
} from '../../db/schema';
import { eq, desc, sql, and, gte, isNull, ne } from 'drizzle-orm';
import { ChatOpenAI } from '@langchain/openai';
import { SystemMessage, HumanMessage } from '@langchain/core/messages';
import { sendOutreachEmail } from '../services/outreach-email-service';

const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// TYPES
// ============================================

interface ArtistHighlight {
  artistId: number;
  artistName: string;
  genre: string;
  highlights: string[];
  topSong: {
    title: string;
    plays: number;
    url?: string;
  } | null;
  tokenData: {
    symbol: string;
    price: number;
    holders: number;
  } | null;
  socialEngagement: number;
  uniqueSellingPoints: string[];
}

interface PersonalizedEmail {
  subject: string;
  body: string;
  artistHighlights: string;
  callToAction: string;
}

interface OutreachResult {
  contactId: number;
  emailSent: boolean;
  messageId?: string;
  error?: string;
}

// ============================================
// ARTIST SELECTION
// ============================================

/**
 * Select top performing AI artists for outreach
 * ONLY selects artists that have published music
 */
export async function selectArtistsForOutreach(limit: number = 5): Promise<ArtistHighlight[]> {
  console.log(`🎯 [OutreachAgent] Selecting top ${limit} artists WITH MUSIC for outreach...`);
  
  try {
    // Get AI artists that have songs (INNER JOIN ensures only artists with songs)
    const artistsWithMusic = await db
      .select({
        id: users.id,
        artistName: users.artistName,
        username: users.username,
        name: users.name,
        genre: users.genre,
        bio: users.bio,
        monthlyListeners: users.monthlyListeners,
        profileImage: users.profileImage,
        slug: users.slug,
        songCount: sql<number>`count(${songs.id})`.as('songCount')
      })
      .from(users)
      .innerJoin(songs, eq(songs.userId, users.id))
      .where(eq(users.isAIGenerated, true))
      .groupBy(users.id)
      .having(sql`count(${songs.id}) > 0`)
      .orderBy(desc(sql`count(${songs.id})`), desc(users.monthlyListeners))
      .limit(limit * 2); // Get extra to filter
    
    console.log(`📋 [OutreachAgent] Found ${artistsWithMusic.length} artists with music`);
    
    const highlights: ArtistHighlight[] = [];
    
    for (const artist of artistsWithMusic) {
      // Get top song
      const [topSong] = await db
        .select({
          title: songs.title,
          plays: songs.plays,
          audioUrl: songs.audioUrl
        })
        .from(songs)
        .where(eq(songs.userId, artist.id))
        .orderBy(desc(songs.plays))
        .limit(1);
      
      // Get token data if exists
      const [token] = await db
        .select({
          symbol: tokenizedSongs.tokenSymbol,
          price: tokenizedSongs.tokenPrice,
          holders: tokenizedSongs.holders
        })
        .from(tokenizedSongs)
        .where(eq(tokenizedSongs.artistId, artist.id))
        .limit(1);
      
      // Generate unique selling points
      const usps = await generateArtistUSPs(artist, topSong);
      
      // Get the best available name
      const displayName = artist.artistName || artist.name || artist.username || 'Unknown Artist';
      
      highlights.push({
        artistId: artist.id,
        artistName: displayName,
        genre: artist.genre || 'Music',
        highlights: [
          `${artist.monthlyListeners?.toLocaleString() || '0'} monthly listeners`,
          topSong ? `Top track: "${topSong.title}" with ${topSong.plays?.toLocaleString() || '0'} plays` : 'New emerging artist',
          token ? `Tokenized artist with ${token.holders || 0} token holders` : 'Innovative AI artist'
        ],
        topSong: topSong ? {
          title: topSong.title,
          plays: topSong.plays || 0,
          url: topSong.audioUrl || undefined
        } : null,
        tokenData: token ? {
          symbol: token.symbol || '',
          price: parseFloat(token.price?.toString() || '0'),
          holders: token.holders || 0
        } : null,
        socialEngagement: Math.floor(Math.random() * 50) + 50, // Placeholder - would calculate from posts
        uniqueSellingPoints: usps
      });
      
      if (highlights.length >= limit) break;
    }
    
    console.log(`✅ [OutreachAgent] Selected ${highlights.length} artists`);
    return highlights;
    
  } catch (error) {
    console.error('❌ [OutreachAgent] Error selecting artists:', error);
    return [];
  }
}

/**
 * Generate unique selling points for an artist
 */
async function generateArtistUSPs(artist: any, topSong: any): Promise<string[]> {
  try {
    const response = await llm.invoke([
      new SystemMessage(`You are a music industry PR specialist. Generate 3 unique, compelling selling points for pitching this AI artist to labels and managers.

Be specific, quantitative where possible, and highlight what makes this artist unique.
Return as a JSON array of 3 strings.`),
      new HumanMessage(`Artist: ${artist.artistName}
Genre: ${artist.genre || 'Unknown'}
Bio: ${artist.bio?.substring(0, 200) || 'Emerging AI artist'}
Monthly Listeners: ${artist.monthlyListeners || 0}
Top Song: ${topSong?.title || 'N/A'} (${topSong?.plays || 0} plays)`)
    ]);
    
    const content = response.content as string;
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    
    return [
      `Innovative ${artist.genre || 'music'} artist with unique sound`,
      'Part of the first AI-native music ecosystem',
      'Growing fanbase with high engagement rates'
    ];
    
  } catch (error) {
    return [
      `${artist.genre || 'Music'} artist with growing audience`,
      'AI-powered creativity with human-like authenticity',
      'Ready for collaboration and expansion'
    ];
  }
}

// ============================================
// EMAIL GENERATION
// ============================================

// Base URL for artist pages
const BOOSTIFY_BASE_URL = process.env.BOOSTIFY_BASE_URL || 'https://boostifymusic.com';

/**
 * Generate personalized outreach email for a contact
 * NOTE: This email was 100% autonomously generated and sent by AI agents
 */
export async function generatePersonalizedEmail(
  contact: { name: string; email: string; role?: string; company?: string; interests?: string[] },
  artists: ArtistHighlight[]
): Promise<PersonalizedEmail | null> {
  console.log(`✉️ [OutreachAgent] Generating creative email for: ${contact.name} at ${contact.company || 'Unknown Company'}`);
  
  try {
    // Select most relevant artist for this contact
    const relevantArtist = artists[0];
    
    const response = await llm.invoke([
      new SystemMessage(`You are an AI agent representing Boostify Music - the world's FIRST record label powered 100% by autonomous AI agents with ZERO human intervention.

THIS IS AN EXPERIMENTAL PROJECT. The decision to send this email was made entirely by AI agents analyzing the recipient's profile and the artist's potential fit.

Write a creative, engaging outreach email that:
1. Opens with intrigue - this is something the recipient has NEVER seen before
2. Clearly explains Boostify is an experimental AI-native record label
3. Emphasizes that EVERYTHING is autonomous - from music creation to A&R to marketing to this very email
4. Introduces the specific AI artist being pitched
5. Includes the artist's landing page URL
6. Makes it clear this is a work in progress / experimental
7. Is honest that if this causes any inconvenience, they can simply unsubscribe
8. Ends with genuine curiosity about their thoughts on AI in music

Tone: Creative, experimental, slightly futuristic but NOT corporate. Think "excited scientist sharing a discovery" not "sales pitch".

The email should feel like receiving a message from the future.

Return JSON with:
{
  "subject": "Intriguing subject line that hints at AI autonomy",
  "body": "Full email body - creative, experimental, honest",
  "artistHighlights": "2-3 compelling facts about the AI artist",
  "callToAction": "Invitation to explore, not a sales push"
}`),
      new HumanMessage(`Contact:
- Name: ${contact.name}
- Role: ${contact.role || 'Music Industry Professional'}
- Company: ${contact.company || 'Music Industry'}

AI Artist to Introduce:
- Name: ${relevantArtist.artistName}
- Genre: ${relevantArtist.genre}
- Artist Page: ${BOOSTIFY_BASE_URL}/artist/${relevantArtist.artistId}
- Key Stats: ${relevantArtist.highlights.join(', ')}
- Unique Selling Points: ${relevantArtist.uniqueSellingPoints.join(', ')}
${relevantArtist.topSong ? `- Featured Track: "${relevantArtist.topSong.title}" (${relevantArtist.topSong.plays.toLocaleString()} plays)` : ''}
${relevantArtist.tokenData ? `- Artist Token: $${relevantArtist.tokenData.symbol} trading with ${relevantArtist.tokenData.holders} holders` : ''}

Remember: You ARE the AI agent. This is not a human pretending. Be authentic about what you are.`)
    ]);
    
    const content = response.content as string;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const email = JSON.parse(jsonMatch[0]) as PersonalizedEmail;
      console.log(`✅ [OutreachAgent] Creative email generated with subject: "${email.subject}"`);
      return email;
    }
    
    return null;
    
  } catch (error) {
    console.error('❌ [OutreachAgent] Error generating email:', error);
    return null;
  }
}

// ============================================
// OUTREACH EXECUTION
// ============================================

/**
 * Execute outreach campaign to industry contacts
 */
export async function executeOutreachCampaign(
  artistIds: number[],
  contactLimit: number = 10,
  dryRun: boolean = false
): Promise<OutreachResult[]> {
  console.log(`🚀 [OutreachAgent] Starting outreach campaign (dryRun: ${dryRun})...`);
  
  const results: OutreachResult[] = [];
  
  // Check daily limit first (unless dry run)
  if (!dryRun) {
    const emailsSentToday = await getEmailsSentToday();
    if (emailsSentToday >= MAX_EMAILS_PER_DAY) {
      console.log(`⚠️ [OutreachAgent] Daily email limit reached (${emailsSentToday}/${MAX_EMAILS_PER_DAY}). No emails will be sent.`);
      return results;
    }
    
    // Adjust contactLimit to respect daily quota
    const remainingQuota = MAX_EMAILS_PER_DAY - emailsSentToday;
    if (contactLimit > remainingQuota) {
      console.log(`📧 [OutreachAgent] Adjusting contact limit from ${contactLimit} to ${remainingQuota} (daily quota)`);
      contactLimit = remainingQuota;
    }
  }
  
  try {
    // Get artist highlights
    const artists = await selectArtistsForOutreach(artistIds.length || 3);
    
    if (artists.length === 0) {
      console.log('⚠️ [OutreachAgent] No artists available for outreach');
      return results;
    }
    
    // Get contacts that haven't been contacted recently
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const contacts = await db
      .select({
        id: musicIndustryContacts.id,
        name: musicIndustryContacts.name,
        email: musicIndustryContacts.email,
        role: musicIndustryContacts.role,
        company: musicIndustryContacts.company,
        genres: musicIndustryContacts.genres,
        lastContacted: musicIndustryContacts.lastContacted
      })
      .from(musicIndustryContacts)
      .where(
        and(
          eq(musicIndustryContacts.status, 'active'),
          // Not contacted in last 30 days or never contacted
          sql`(${musicIndustryContacts.lastContacted} < ${thirtyDaysAgo} OR ${musicIndustryContacts.lastContacted} IS NULL)`
        )
      )
      .limit(contactLimit);
    
    console.log(`📋 [OutreachAgent] Found ${contacts.length} eligible contacts`);
    
    for (const contact of contacts) {
      // Select the most relevant artist for this contact
      const relevantArtist = artists[0];
      
      // Generate personalized email
      const email = await generatePersonalizedEmail(
        {
          name: contact.name,
          email: contact.email,
          role: contact.role || undefined,
          company: contact.company || undefined,
          interests: contact.genres || undefined
        },
        artists
      );
      
      if (!email) {
        results.push({
          contactId: contact.id,
          emailSent: false,
          error: 'Failed to generate email'
        });
        continue;
      }
      
      if (dryRun) {
        console.log(`📧 [DRY RUN] Would send to ${contact.email}:`);
        console.log(`   Subject: ${email.subject}`);
        console.log(`   Preview: ${email.body.substring(0, 100)}...`);
        results.push({
          contactId: contact.id,
          emailSent: false,
          messageId: 'DRY_RUN'
        });
        continue;
      }
      
      // Send email
      try {
        const result = await sendOutreachEmail({
          to: contact.email,
          toName: contact.name,
          subject: email.subject,
          htmlContent: formatEmailHtml(email, relevantArtist),
          tags: ['ai_outreach', 'artist_pitch', `artist_${relevantArtist.artistId}`]
        });
        
        if (result.success) {
          // Update last contacted
          await db
            .update(musicIndustryContacts)
            .set({ lastContacted: new Date() })
            .where(eq(musicIndustryContacts.id, contact.id));
          
          results.push({
            contactId: contact.id,
            emailSent: true,
            messageId: result.messageId
          });
          
          console.log(`✅ [OutreachAgent] Email sent to: ${contact.email}`);
        } else {
          results.push({
            contactId: contact.id,
            emailSent: false,
            error: result.error
          });
        }
        
      } catch (sendError: any) {
        results.push({
          contactId: contact.id,
          emailSent: false,
          error: sendError.message
        });
      }
      
      // Rate limiting - wait between emails
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    console.log(`✅ [OutreachAgent] Campaign complete. ${results.filter(r => r.emailSent).length}/${results.length} emails sent`);
    return results;
    
  } catch (error) {
    console.error('❌ [OutreachAgent] Campaign error:', error);
    return results;
  }
}

/**
 * Format email content as HTML with artist info
 */
function formatEmailHtml(email: PersonalizedEmail, artist?: ArtistHighlight): string {
  const artistPageUrl = artist 
    ? `${BOOSTIFY_BASE_URL}/artist/${artist.artistId}`
    : `${BOOSTIFY_BASE_URL}/discover`;
  
  const artistName = artist?.artistName || 'Our AI Artists';
  
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: 'Helvetica Neue', Arial, sans-serif; 
      line-height: 1.7; 
      color: #1a1a2e; 
      background: #f8f9fa;
      margin: 0;
      padding: 0;
    }
    .container { 
      max-width: 620px; 
      margin: 0 auto; 
      padding: 40px 30px;
      background: white;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
      padding-bottom: 25px;
      border-bottom: 2px solid #6366f1;
    }
    .header h1 {
      color: #6366f1;
      font-size: 24px;
      margin: 0 0 8px 0;
      letter-spacing: -0.5px;
    }
    .header .tagline {
      color: #888;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 2px;
    }
    .experimental-badge {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 6px 14px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 25px;
    }
    .body-text {
      font-size: 15px;
      color: #333;
    }
    .body-text p {
      margin: 0 0 16px 0;
    }
    .artist-card {
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      border-radius: 12px;
      padding: 25px;
      margin: 25px 0;
      color: white;
    }
    .artist-card h3 {
      margin: 0 0 12px 0;
      font-size: 20px;
      color: #a78bfa;
    }
    .artist-card .genre {
      display: inline-block;
      background: rgba(167, 139, 250, 0.2);
      color: #c4b5fd;
      padding: 4px 10px;
      border-radius: 12px;
      font-size: 12px;
      margin-bottom: 15px;
    }
    .artist-card .highlights {
      font-size: 14px;
      line-height: 1.6;
      color: #e2e8f0;
    }
    .cta-container {
      text-align: center;
      margin: 30px 0;
    }
    .cta { 
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white; 
      padding: 14px 32px; 
      text-decoration: none; 
      border-radius: 8px; 
      display: inline-block;
      font-weight: 600;
      font-size: 14px;
      letter-spacing: 0.5px;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
    }
    .cta:hover {
      background: linear-gradient(135deg, #5558e3 0%, #7c4fe0 100%);
    }
    .ai-notice {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px 20px;
      margin: 25px 0;
      border-radius: 0 8px 8px 0;
      font-size: 13px;
      color: #92400e;
    }
    .ai-notice strong {
      display: block;
      margin-bottom: 5px;
      color: #78350f;
    }
    .footer { 
      margin-top: 40px; 
      padding-top: 25px; 
      border-top: 1px solid #e5e7eb; 
      font-size: 12px; 
      color: #6b7280;
      text-align: center;
    }
    .footer a {
      color: #6366f1;
      text-decoration: none;
    }
    .unsubscribe {
      margin-top: 15px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 6px;
      font-size: 11px;
      color: #9ca3af;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎵 BOOSTIFY MUSIC</h1>
      <div class="tagline">The World's First 100% AI-Powered Record Label</div>
    </div>
    
    <div style="text-align: center;">
      <span class="experimental-badge">🧪 Experimental Project</span>
    </div>
    
    <div class="body-text">
      ${email.body.split('\n').filter(p => p.trim()).map(p => `<p>${p}</p>`).join('')}
    </div>
    
    <div class="artist-card">
      <h3>🎤 ${artistName}</h3>
      ${artist?.genre ? `<span class="genre">${artist.genre}</span>` : ''}
      <div class="highlights">
        ${email.artistHighlights}
      </div>
    </div>
    
    <div class="cta-container">
      <a href="${artistPageUrl}" class="cta">🚀 Meet ${artistName}</a>
    </div>
    
    <p style="text-align: center; color: #6b7280; font-size: 14px;">
      <strong>${email.callToAction}</strong>
    </p>
    
    <div class="ai-notice">
      <strong>🤖 Full Transparency:</strong>
      This email was autonomously composed and sent by AI agents. No human reviewed or approved this message. 
      We're exploring what happens when AI runs an entire record label - from artist development to industry outreach.
    </div>
    
    <div class="footer">
      <p>
        <strong>Boostify Music</strong> — An Experimental AI-Native Music Ecosystem<br>
        <a href="${BOOSTIFY_BASE_URL}">boostifymusic.com</a>
      </p>
      <div class="unsubscribe">
        If this email caused any inconvenience, we sincerely apologize. This is an experimental project in development.<br>
        Simply reply with "unsubscribe" and our AI agents will ensure you're never contacted again.
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ============================================
// DAILY LIMIT CONFIGURATION
// ============================================

const MAX_EMAILS_PER_DAY = 10;

/**
 * Get the count of emails sent today
 */
async function getEmailsSentToday(): Promise<number> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(outreachEmailLog)
    .where(gte(outreachEmailLog.sentAt, today));
  
  return result[0]?.count || 0;
}

// ============================================
// SCHEDULED OUTREACH (Called by Orchestrator)
// ============================================

/**
 * Outreach tick - runs periodically to send automated outreach
 */
export async function processOutreachTick(): Promise<void> {
  console.log('📧 [OutreachAgent] ====== OUTREACH TICK START ======');
  
  // Only run on weekdays, business hours (simplified check)
  const now = new Date();
  const dayOfWeek = now.getDay();
  const hour = now.getHours();
  
  // Skip weekends and non-business hours
  if (dayOfWeek === 0 || dayOfWeek === 6 || hour < 9 || hour > 17) {
    console.log('📧 [OutreachAgent] Outside business hours, skipping...');
    return;
  }
  
  // Check daily limit
  const emailsSentToday = await getEmailsSentToday();
  if (emailsSentToday >= MAX_EMAILS_PER_DAY) {
    console.log(`📧 [OutreachAgent] Daily limit reached (${emailsSentToday}/${MAX_EMAILS_PER_DAY}), skipping...`);
    return;
  }
  
  // Calculate how many emails we can still send today
  const remainingQuota = MAX_EMAILS_PER_DAY - emailsSentToday;
  const batchSize = Math.min(3, remainingQuota);
  
  console.log(`📧 [OutreachAgent] Emails sent today: ${emailsSentToday}/${MAX_EMAILS_PER_DAY}, sending batch of ${batchSize}`);
  
  // Send a small batch of emails (respecting daily limit)
  await executeOutreachCampaign([], batchSize, false);
  
  console.log('📧 [OutreachAgent] ====== OUTREACH TICK COMPLETE ======');
}

// ============================================
// TEST EMAIL FUNCTION
// ============================================

/**
 * Send a test email to verify the email template and system
 */
export async function sendTestEmail(
  testEmail: string,
  testName: string = 'Test Recipient'
): Promise<{ success: boolean; messageId?: string; error?: string; emailContent?: PersonalizedEmail }> {
  console.log(`🧪 [OutreachAgent] Sending test email to ${testEmail}...`);
  
  try {
    // Get artists for the test
    const artists = await selectArtistsForOutreach(3);
    
    if (artists.length === 0) {
      return { success: false, error: 'No artists available for test' };
    }
    
    const relevantArtist = artists[0];
    
    // Generate the email
    const email = await generatePersonalizedEmail(
      {
        name: testName,
        email: testEmail,
        role: 'Music Industry Professional',
        company: 'Industry Test',
        interests: ['Electronic', 'Pop', 'Experimental']
      },
      artists
    );
    
    if (!email) {
      return { success: false, error: 'Failed to generate test email' };
    }
    
    // Send the test email
    const result = await sendOutreachEmail({
      to: testEmail,
      toName: testName,
      subject: `[TEST] ${email.subject}`,
      htmlContent: formatEmailHtml(email, relevantArtist),
      tags: ['test_email', 'ai_outreach_test']
    });
    
    if (result.success) {
      console.log(`✅ [OutreachAgent] Test email sent successfully to ${testEmail}`);
      return { 
        success: true, 
        messageId: result.messageId,
        emailContent: email
      };
    } else {
      return { success: false, error: result.error };
    }
    
  } catch (error: any) {
    console.error('❌ [OutreachAgent] Test email error:', error);
    return { success: false, error: error.message };
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  ArtistHighlight,
  PersonalizedEmail,
  OutreachResult,
  formatEmailHtml,
  BOOSTIFY_BASE_URL
};
