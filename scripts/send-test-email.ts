/**
 * Script para enviar un email de prueba del AI Outreach System
 * Ejecutar: npx tsx scripts/send-test-email.ts [artist-slug]
 * Ejemplo: npx tsx scripts/send-test-email.ts birdie-krajcik
 */

import 'dotenv/config';
import { db } from '../server/db';
import { users, songs, artistPersonality } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

const BREVO_API_KEY = process.env.BREVO_API_KEY || '';
const TARGET_EMAIL = 'convoycubano@gmail.com';
const TARGET_NAME = 'Convoy Cubano';
const FROM_EMAIL = 'info@boostifymusic.com';
const baseUrl = 'https://boostifymusic.com';

// List of artists with music ready
const ARTISTS_WITH_MUSIC = ['birdie-krajcik', 'athena-daniel', 'reel'];

async function getArtistWithMusic(preferredSlug?: string) {
  // If a specific artist is requested, try to get it
  if (preferredSlug) {
    const artistResults = await db
      .select()
      .from(users)
      .where(eq(users.slug, preferredSlug))
      .limit(1);
    
    const artist = artistResults[0];
    
    if (artist) {
      // Get songs for this artist
      const artistSongs = await db
        .select()
        .from(songs)
        .where(eq(songs.userId, artist.id))
        .orderBy(desc(songs.plays))
        .limit(1);
      
      if (artistSongs.length > 0) {
        return { 
          id: artist.id,
          artistName: artist.artistName,
          username: artist.username,
          genre: artist.genre,
          bio: artist.biography,
          profileImage: artist.profileImage,
          slug: artist.slug,
          topSong: { title: artistSongs[0].title, plays: artistSongs[0].plays }
        };
      }
    }
  }

  // Otherwise, get AI artists and check which have songs
  const aiArtistResults = await db
    .select()
    .from(users)
    .where(eq(users.isAIGenerated, true))
    .limit(50);

  // Filter to only those with songs
  const artistsWithSongs = [];
  for (const artist of aiArtistResults) {
    const songResults = await db
      .select()
      .from(songs)
      .where(eq(songs.userId, artist.id))
      .orderBy(desc(songs.plays))
      .limit(1);
    
    if (songResults.length > 0) {
      artistsWithSongs.push({
        id: artist.id,
        artistName: artist.artistName,
        username: artist.username,
        genre: artist.genre,
        bio: artist.biography,
        profileImage: artist.profileImage,
        slug: artist.slug,
        topSong: { title: songResults[0].title, plays: songResults[0].plays }
      });
    }
  }

  if (artistsWithSongs.length === 0) {
    return null;
  }

  // Pick a random artist from those with music
  const randomArtist = artistsWithSongs[Math.floor(Math.random() * artistsWithSongs.length)];
  return randomArtist;
}

async function getArtistTraits(artistId: number): Promise<string[]> {
  const [personality] = await db
    .select({ traits: artistPersonality.traits })
    .from(artistPersonality)
    .where(eq(artistPersonality.artistId, artistId))
    .limit(1);

  if (personality?.traits && Array.isArray(personality.traits)) {
    return personality.traits.slice(0, 3);
  }
  return ['Creative', 'Innovative', 'Autonomous'];
}

async function sendTestEmail() {
  // Get artist slug from command line args
  const preferredSlug = process.argv[2] || ARTISTS_WITH_MUSIC[Math.floor(Math.random() * ARTISTS_WITH_MUSIC.length)];
  
  console.log('\n🤖 BOOSTIFY AI OUTREACH - Test Email\n');
  console.log(`🔍 Looking for artist: ${preferredSlug || 'any with music'}...`);

  const artist = await getArtistWithMusic(preferredSlug);
  
  if (!artist) {
    console.log('❌ No artists with music found in database');
    process.exit(1);
  }

  const traits = await getArtistTraits(artist.id);
  const artistUrl = `${baseUrl}/artist/${artist.slug}`;
  const artistName = artist.artistName || artist.username || 'AI Artist';
  const FROM_NAME = `${artistName} via Boostify AI`;

  console.log(`📧 Sending to: ${TARGET_EMAIL}`);
  console.log(`👤 Recipient: ${TARGET_NAME}`);
  console.log(`🎤 Featured Artist: ${artistName}`);
  console.log(`🎵 Genre: ${artist.genre || 'Electronic'}`);
  console.log(`🔥 Top Song: "${artist.topSong?.title}" (${artist.topSong?.plays?.toLocaleString() || 0} plays)`);
  console.log(`🔗 Artist URL: ${artistUrl}`);
  console.log(`🔑 API Key present: ${BREVO_API_KEY ? 'Yes' : 'No'}\n`);

  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify AI Outreach</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #0a0a0a 100%); padding: 40px 20px;">
    
    <!-- Header Badge -->
    <div style="text-align: center; margin-bottom: 30px;">
      <div style="display: inline-block; padding: 8px 20px; background: linear-gradient(90deg, #7c3aed, #ec4899); border-radius: 20px;">
        <span style="color: white; font-size: 12px; font-weight: 600; letter-spacing: 2px;">🧪 EXPERIMENTAL PROJECT</span>
      </div>
    </div>

    <!-- Robot Emoji -->
    <div style="text-align: center; font-size: 64px; margin-bottom: 20px;">
      🤖
    </div>

    <!-- Main Title -->
    <h1 style="color: #ffffff; text-align: center; font-size: 28px; margin-bottom: 10px; font-weight: 700;">
      Hello, ${TARGET_NAME}
    </h1>
    
    <p style="color: #a855f7; text-align: center; font-size: 14px; margin-bottom: 30px; font-style: italic;">
      This message was autonomously generated and sent by an AI system
    </p>

    <!-- What Is This Box -->
    <div style="background: rgba(124, 58, 237, 0.1); border: 1px solid rgba(124, 58, 237, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 30px;">
      <h3 style="color: #c4b5fd; margin: 0 0 10px 0; font-size: 14px;">⚡ WHAT IS THIS?</h3>
      <p style="color: #d1d5db; margin: 0; font-size: 14px; line-height: 1.6;">
        <strong style="color: #f472b6;">Boostify</strong> is the world's first experimental record label 
        powered <strong style="color: #f472b6;">100% by AI agents</strong> — with zero human intervention. 
        Our AI artists create music, build relationships, trade tokens, and even reach out to industry 
        professionals like you... completely autonomously.
      </p>
    </div>

    <!-- Artist Card -->
    <div style="background: linear-gradient(135deg, rgba(124, 58, 237, 0.2), rgba(236, 72, 153, 0.2)); border-radius: 16px; padding: 25px; margin-bottom: 25px; border: 1px solid rgba(255,255,255,0.1);">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="80" style="vertical-align: top;">
            <div style="width: 70px; height: 70px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #ec4899); text-align: center; line-height: 70px; font-size: 32px;">
              🎤
            </div>
          </td>
          <td style="vertical-align: top; padding-left: 15px;">
            <h2 style="color: #ffffff; margin: 0 0 5px 0; font-size: 22px;">${artistName}</h2>
            <p style="color: #a855f7; margin: 0; font-size: 14px;">AI Artist • ${artist.genre || 'Electronic'}</p>
          </td>
        </tr>
      </table>
      
      <p style="color: #d1d5db; font-size: 14px; line-height: 1.7; margin: 20px 0 15px 0;">
        ${artist.bio || `An experimental AI artist exploring the boundaries of ${artist.genre || 'electronic'} music. Every track, every decision, every interaction is powered by autonomous AI agents.`}
      </p>

      <div style="background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; margin-bottom: 15px;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          <strong style="color: #f472b6;">Personality Traits:</strong> ${traits.join(', ')}
        </p>
      </div>

      <!-- Stats Row -->
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td width="33%" style="text-align: center; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
            <div style="color: #f472b6; font-size: 18px; font-weight: bold;">${(artist.topSong?.plays || 0).toLocaleString()}</div>
            <div style="color: #9ca3af; font-size: 11px;">PLAYS</div>
          </td>
          <td width="5%"></td>
          <td width="33%" style="text-align: center; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
            <div style="color: #a855f7; font-size: 18px; font-weight: bold;">100%</div>
            <div style="color: #9ca3af; font-size: 11px;">AI GENERATED</div>
          </td>
          <td width="5%"></td>
          <td width="33%" style="text-align: center; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px;">
            <div style="color: #22d3ee; font-size: 18px; font-weight: bold;">BTF</div>
            <div style="color: #9ca3af; font-size: 11px;">TOKENIZED</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- Top Song -->
    <div style="background: rgba(236, 72, 153, 0.1); border-radius: 12px; padding: 15px 20px; margin-bottom: 25px; border-left: 3px solid #ec4899;">
      <p style="color: #f9a8d4; margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">🔥 Top Track</p>
      <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">"${artist.topSong?.title || 'Untitled'}"</p>
    </div>

    <!-- CTA Button -->
    <div style="text-align: center; margin: 30px 0;">
      <a href="${artistUrl}" style="display: inline-block; background: linear-gradient(90deg, #7c3aed, #ec4899); color: white; padding: 16px 40px; border-radius: 30px; text-decoration: none; font-weight: 600; font-size: 16px;">
        Meet ${artistName} →
      </a>
    </div>

    <!-- Why This Matters -->
    <div style="background: rgba(34, 211, 238, 0.1); border-radius: 12px; padding: 20px; margin-bottom: 25px; border: 1px solid rgba(34, 211, 238, 0.2);">
      <h3 style="color: #22d3ee; margin: 0 0 15px 0; font-size: 16px;">🚀 Why This Matters</h3>
      <ul style="color: #d1d5db; margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px;">
        <li><strong style="color: #f472b6;">49 autonomous AI artists</strong> operating 24/7</li>
        <li>Each with unique <strong style="color: #a855f7;">personality, memory & relationships</strong></li>
        <li><strong style="color: #22d3ee;">Blockchain-integrated</strong> artist tokens (BTF-2300)</li>
        <li>AI-powered <strong style="color: #f472b6;">collaborations, beef, and trends</strong></li>
        <li>This outreach? <strong style="color: #22d3ee;">Decided autonomously by the system</strong></li>
      </ul>
    </div>

    <!-- Autonomous Notice -->
    <div style="background: linear-gradient(90deg, rgba(236, 72, 153, 0.15), rgba(124, 58, 237, 0.15)); border-radius: 12px; padding: 20px; margin-bottom: 25px; text-align: center;">
      <p style="color: #f9a8d4; margin: 0; font-size: 13px; line-height: 1.6;">
        🤖 <strong>AUTONOMOUS DECISION</strong><br>
        <span style="color: #d1d5db;">This email was not written or sent by a human. Our AI orchestrator 
        analyzed your profile and decided to reach out based on potential synergies 
        with our experimental music ecosystem.</span>
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1);">
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 15px;">
        🧪 <strong>Boostify</strong> — The World's First AI-Native Record Label
      </p>
      <p style="color: #6b7280; font-size: 12px; margin-bottom: 20px;">
        A project in active development exploring the future of autonomous music creation
      </p>
      <p style="color: #9ca3af; font-size: 11px;">
        If this email caused any inconvenience, simply reply with "unsubscribe" and you'll never hear from us again.
      </p>
    </div>

  </div>
</body>
</html>`;
  
  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': BREVO_API_KEY,
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        sender: { email: FROM_EMAIL, name: FROM_NAME },
        to: [{ email: TARGET_EMAIL, name: TARGET_NAME }],
        subject: `🤖 An AI Artist Wants to Connect: ${artistName}`,
        htmlContent
      })
    });

    const result = await response.json();

    if (result.messageId) {
      console.log('✅ Email sent successfully!');
      console.log('📨 Message ID:', result.messageId);
      console.log(`\n🎉 Check your inbox at ${TARGET_EMAIL}`);
    } else {
      console.error('❌ Error sending email:', result);
    }
    
  } catch (err) {
    console.error('❌ Error:', err);
  }
  
  process.exit(0);
}

sendTestEmail();
