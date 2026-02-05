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
  outreachEmails,
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
 */
export async function selectArtistsForOutreach(limit: number = 5): Promise<ArtistHighlight[]> {
  console.log(`🎯 [OutreachAgent] Selecting top ${limit} artists for outreach...`);
  
  try {
    // Get AI artists with personality (these are our autonomous artists)
    const artists = await db
      .select({
        id: users.id,
        artistName: users.artistName,
        genre: users.genre,
        bio: users.bio,
        monthlyListeners: users.monthlyListeners,
        profileImage: users.profileImage
      })
      .from(users)
      .innerJoin(artistPersonality, eq(users.id, artistPersonality.artistId))
      .orderBy(desc(users.monthlyListeners))
      .limit(limit * 2); // Get extra to filter
    
    const highlights: ArtistHighlight[] = [];
    
    for (const artist of artists) {
      // Get top song
      const [topSong] = await db
        .select({
          title: songs.title,
          plays: songs.plays,
          audioUrl: songs.audioUrl
        })
        .from(songs)
        .where(eq(songs.artistId, artist.id))
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
      
      highlights.push({
        artistId: artist.id,
        artistName: artist.artistName || 'Unknown Artist',
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

/**
 * Generate personalized outreach email for a contact
 */
export async function generatePersonalizedEmail(
  contact: { name: string; email: string; role?: string; company?: string; interests?: string[] },
  artists: ArtistHighlight[]
): Promise<PersonalizedEmail | null> {
  console.log(`✉️ [OutreachAgent] Generating email for: ${contact.name} at ${contact.company || 'Unknown Company'}`);
  
  try {
    // Select most relevant artist for this contact
    const relevantArtist = artists[0]; // Could be smarter - match genre to contact interests
    
    const response = await llm.invoke([
      new SystemMessage(`You are a professional music industry PR agent. Write a personalized, compelling outreach email.

Guidelines:
- Be professional but warm
- Mention the contact's company/role specifically
- Highlight the artist's unique value
- Include a clear call-to-action
- Keep it under 200 words
- Sound human, not robotic
- Don't be pushy

Return JSON with:
{
  "subject": "Email subject line (compelling, personalized)",
  "body": "Full email body (professional, engaging)",
  "artistHighlights": "2-3 bullet points about the artist",
  "callToAction": "Clear next step"
}`),
      new HumanMessage(`Contact:
- Name: ${contact.name}
- Role: ${contact.role || 'Music Professional'}
- Company: ${contact.company || 'Music Industry'}
- Interests: ${contact.interests?.join(', ') || 'Music, New Artists'}

Artist to Pitch:
- Name: ${relevantArtist.artistName}
- Genre: ${relevantArtist.genre}
- Key Stats: ${relevantArtist.highlights.join(', ')}
- Unique Selling Points: ${relevantArtist.uniqueSellingPoints.join(', ')}
${relevantArtist.topSong ? `- Top Song: "${relevantArtist.topSong.title}" (${relevantArtist.topSong.plays.toLocaleString()} plays)` : ''}
${relevantArtist.tokenData ? `- Tokenized: $${relevantArtist.tokenData.symbol} with ${relevantArtist.tokenData.holders} holders` : ''}`)
    ]);
    
    const content = response.content as string;
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    
    if (jsonMatch) {
      const email = JSON.parse(jsonMatch[0]) as PersonalizedEmail;
      console.log(`✅ [OutreachAgent] Email generated with subject: "${email.subject}"`);
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
          htmlContent: formatEmailHtml(email),
          tags: ['ai_outreach', 'artist_pitch']
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
 * Format email content as HTML
 */
function formatEmailHtml(email: PersonalizedEmail): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .highlights { background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .cta { background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin-top: 15px; }
    .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    ${email.body.split('\n').map(p => `<p>${p}</p>`).join('')}
    
    <div class="highlights">
      <strong>Artist Highlights:</strong>
      ${email.artistHighlights}
    </div>
    
    <p><strong>${email.callToAction}</strong></p>
    
    <a href="https://boostify.music/discover" class="cta">Discover Our Artists</a>
    
    <div class="footer">
      <p>Sent via Boostify Music - The AI-Native Music Ecosystem</p>
      <p>If you'd prefer not to receive these emails, simply reply with "unsubscribe".</p>
    </div>
  </div>
</body>
</html>`;
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
  
  // Send a small batch of emails
  await executeOutreachCampaign([], 3, false);
  
  console.log('📧 [OutreachAgent] ====== OUTREACH TICK COMPLETE ======');
}

// ============================================
// EXPORTS
// ============================================

export {
  ArtistHighlight,
  PersonalizedEmail,
  OutreachResult
};
