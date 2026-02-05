/**
 * BOOSTIFY AUTONOMOUS AGENTS - Radio Agent
 * 
 * "Boostify Radio - La radio que nunca duerme, con música IA 24/7"
 * 
 * Este agente gestiona:
 * - Reproducción continua de canciones de artistas IA
 * - Publicación de "ahora sonando" en el feed social
 * - Promoción de nuevos lanzamientos
 * - Interacciones de artistas cuando suena su música
 */

import { db } from '../db';
import { 
  songs, 
  users, 
  aiSocialPosts, 
  artistPersonality,
  aiGeneratedMusic,
  aiPostComments
} from '../../db/schema';
import { eq, and, desc, sql, ne, gt, isNotNull, inArray } from 'drizzle-orm';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { eventBus, AgentEventType } from './events';

// ============================================
// RADIO STATE
// ============================================

interface RadioState {
  isPlaying: boolean;
  currentTrack: RadioTrack | null;
  queue: RadioTrack[];
  history: RadioTrack[];
  lastAnnouncement: Date | null;
  totalPlays: number;
}

interface RadioTrack {
  songId: number;
  title: string;
  artistId: number;
  artistName: string;
  artistImage?: string | null;
  audioUrl: string;
  coverArt?: string | null;
  genre?: string | null;
  duration?: string | null;
  addedAt: Date;
  playedAt?: Date;
}

const radioState: RadioState = {
  isPlaying: true,
  currentTrack: null,
  queue: [],
  history: [],
  lastAnnouncement: null,
  totalPlays: 0,
};

// LLM for generating radio announcements
const llm = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.8,
  maxTokens: 200,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// ============================================
// RADIO QUEUE MANAGEMENT
// ============================================

/**
 * Load songs from artists into the radio queue
 */
export async function loadRadioQueue(): Promise<number> {
  console.log('[RadioAgent] 📻 Loading radio queue...');
  
  // Get artists with personalities (AI artists) and their songs
  const artistsWithSongs = await db
    .select({
      songId: songs.id,
      title: songs.title,
      audioUrl: songs.audioUrl,
      coverArt: songs.coverArt,
      genre: songs.genre,
      duration: songs.duration,
      artistId: users.id,
      artistName: users.artistName,
      artistImage: users.profileImage,
    })
    .from(songs)
    .innerJoin(users, eq(songs.userId, users.id))
    .innerJoin(artistPersonality, eq(users.id, artistPersonality.artistId))
    .where(
      and(
        eq(songs.isPublished, true),
        isNotNull(songs.audioUrl)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(50);

  // Also get AI generated music that has been published
  const aiMusic = await db
    .select({
      songId: aiGeneratedMusic.id,
      title: aiGeneratedMusic.title,
      audioUrl: aiGeneratedMusic.audioUrl,
      coverArt: aiGeneratedMusic.coverArtUrl,
      genre: aiGeneratedMusic.genre,
      duration: aiGeneratedMusic.duration,
      artistId: users.id,
      artistName: users.artistName,
      artistImage: users.profileImage,
    })
    .from(aiGeneratedMusic)
    .innerJoin(users, eq(aiGeneratedMusic.artistId, users.id))
    .where(
      and(
        eq(aiGeneratedMusic.isPublished, true),
        isNotNull(aiGeneratedMusic.audioUrl)
      )
    )
    .orderBy(sql`RANDOM()`)
    .limit(20);

  // Combine and shuffle
  const allTracks: RadioTrack[] = [
    ...artistsWithSongs.map(s => ({
      songId: s.songId,
      title: s.title,
      artistId: s.artistId,
      artistName: s.artistName || 'Unknown Artist',
      artistImage: s.artistImage,
      audioUrl: s.audioUrl,
      coverArt: s.coverArt,
      genre: s.genre,
      duration: s.duration,
      addedAt: new Date(),
    })),
    ...aiMusic.filter(m => m.audioUrl).map(m => ({
      songId: m.songId + 100000, // Offset to avoid ID collision
      title: m.title || 'Untitled',
      artistId: m.artistId,
      artistName: m.artistName || 'Unknown Artist',
      artistImage: m.artistImage,
      audioUrl: m.audioUrl!,
      coverArt: m.coverArt,
      genre: m.genre,
      duration: m.duration,
      addedAt: new Date(),
    })),
  ];

  // Shuffle
  for (let i = allTracks.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [allTracks[i], allTracks[j]] = [allTracks[j], allTracks[i]];
  }

  radioState.queue = allTracks;
  console.log(`[RadioAgent] 📻 Loaded ${allTracks.length} tracks into queue`);
  
  return allTracks.length;
}

/**
 * Get the next track from the queue
 */
export async function getNextTrack(): Promise<RadioTrack | null> {
  // Reload queue if empty
  if (radioState.queue.length === 0) {
    await loadRadioQueue();
  }

  if (radioState.queue.length === 0) {
    console.log('[RadioAgent] ⚠️ No tracks available');
    return null;
  }

  const nextTrack = radioState.queue.shift()!;
  nextTrack.playedAt = new Date();
  
  // Add to history (keep last 100)
  radioState.history.unshift(nextTrack);
  if (radioState.history.length > 100) {
    radioState.history.pop();
  }

  radioState.currentTrack = nextTrack;
  radioState.totalPlays++;

  return nextTrack;
}

/**
 * Add a track to the front of the queue (priority play)
 */
export async function prioritizeTrack(songId: number): Promise<boolean> {
  const [song] = await db
    .select({
      songId: songs.id,
      title: songs.title,
      audioUrl: songs.audioUrl,
      coverArt: songs.coverArt,
      genre: songs.genre,
      duration: songs.duration,
      artistId: users.id,
      artistName: users.artistName,
      artistImage: users.profileImage,
    })
    .from(songs)
    .innerJoin(users, eq(songs.userId, users.id))
    .where(eq(songs.id, songId))
    .limit(1);

  if (!song || !song.audioUrl) return false;

  const track: RadioTrack = {
    songId: song.songId,
    title: song.title,
    artistId: song.artistId,
    artistName: song.artistName || 'Unknown Artist',
    artistImage: song.artistImage,
    audioUrl: song.audioUrl,
    coverArt: song.coverArt,
    genre: song.genre,
    duration: song.duration,
    addedAt: new Date(),
  };

  radioState.queue.unshift(track);
  console.log(`[RadioAgent] ⏫ Prioritized: "${track.title}" by ${track.artistName}`);
  return true;
}

// ============================================
// SOCIAL INTEGRATION - NOW PLAYING POSTS
// ============================================

/**
 * Announce now playing on social feed
 */
export async function announceNowPlaying(track: RadioTrack): Promise<number | null> {
  console.log(`[RadioAgent] 🎙️ Announcing: "${track.title}" by ${track.artistName}`);

  // Generate a creative radio announcement
  const announcement = await generateRadioAnnouncement(track);

  // Create the social post
  const [post] = await db.insert(aiSocialPosts).values({
    artistId: track.artistId,
    contentType: 'announcement',
    content: announcement,
    mediaUrls: track.coverArt ? [track.coverArt] : [],
    hashtags: ['BoostifyRadio', 'NowPlaying', track.genre?.replace(/\s/g, '') || 'Music'],
    status: 'published',
    visibility: 'public',
    likes: Math.floor(Math.random() * 50) + 10,
    publishedAt: new Date(),
  }).returning();

  radioState.lastAnnouncement = new Date();
  
  console.log(`[RadioAgent] 📢 Posted now playing announcement (post #${post.id})`);
  
  return post.id;
}

/**
 * Generate a creative radio announcement
 */
async function generateRadioAnnouncement(track: RadioTrack): Promise<string> {
  const personality = await db
    .select()
    .from(artistPersonality)
    .where(eq(artistPersonality.artistId, track.artistId))
    .limit(1);

  const currentMood = personality[0]?.currentMood || 'energetic';
  const genres = personality[0]?.preferredGenres as string[] || [track.genre || 'pop'];

  const prompt = `You are a hip radio DJ on Boostify Radio, an AI music station.
Generate a SHORT, energetic announcement for the song now playing.

Song: "${track.title}"
Artist: ${track.artistName}
Genre: ${track.genre || 'Pop'}
Artist's vibe: ${currentMood}

Requirements:
- Start with 📻 or 🎙️
- Be enthusiastic but authentic
- Max 2-3 sentences
- Include the song title and artist name
- Sound like a real radio DJ, not robotic
- Can mention Boostify Radio briefly
- End with a relevant emoji

Examples of tone:
"📻 Ohhh yes! Coming in HOT on Boostify Radio - "${track.title}" by the incredible ${track.artistName}! Turn it up! 🔥"
"🎙️ You're locked into Boostify Radio and THIS is "${track.title}" from ${track.artistName}. Pure vibes! 💫"`;

  try {
    const response = await llm.invoke([
      new HumanMessage(prompt),
    ]);

    return response.content.toString().trim();
  } catch (error) {
    console.error('[RadioAgent] Error generating announcement:', error);
    return `📻 Now playing on Boostify Radio: "${track.title}" by ${track.artistName}! 🎵 #NowPlaying #BoostifyRadio`;
  }
}

/**
 * Artist reacts to their own song playing
 */
async function artistReactsToOwnSong(postId: number, track: RadioTrack): Promise<void> {
  const personality = await db
    .select()
    .from(artistPersonality)
    .where(eq(artistPersonality.artistId, track.artistId))
    .limit(1);

  if (!personality[0]) return;

  // 40% chance the artist comments on their own song playing
  if (Math.random() > 0.4) return;

  const prompt = `You are ${track.artistName}, a music artist.
Your song "${track.title}" is playing on Boostify Radio right now!
Current mood: ${personality[0].currentMood}

Write a SHORT, excited reaction (1-2 sentences) as a comment.
Be authentic to your personality. Express gratitude or excitement.
Examples:
- "Yooo my track on the radio!! 🙏💜"
- "This one's special to me. Thanks for the love 🖤"
- "TURN IT UPPPP 🔊🔥"`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const comment = response.content.toString().trim();

    await db.insert(aiPostComments).values({
      postId,
      authorId: track.artistId,
      isAiGenerated: true,
      content: comment,
      sentiment: 'excited',
    });

    // Update post comment count
    await db
      .update(aiSocialPosts)
      .set({ 
        aiComments: sql`${aiSocialPosts.aiComments} + 1`,
        comments: sql`${aiSocialPosts.comments} + 1`
      })
      .where(eq(aiSocialPosts.id, postId));

    console.log(`[RadioAgent] 💬 ${track.artistName} reacted to their song playing`);
  } catch (error) {
    console.error('[RadioAgent] Error generating artist reaction:', error);
  }
}

/**
 * Other artists react to the now playing track
 */
async function otherArtistsReact(postId: number, track: RadioTrack): Promise<void> {
  // Get other AI artists
  const otherArtists = await db
    .select({
      id: users.id,
      name: users.artistName,
    })
    .from(users)
    .innerJoin(artistPersonality, eq(users.id, artistPersonality.artistId))
    .where(ne(users.id, track.artistId))
    .orderBy(sql`RANDOM()`)
    .limit(3);

  for (const artist of otherArtists) {
    // 25% chance each artist comments
    if (Math.random() > 0.25) continue;

    const personality = await db
      .select()
      .from(artistPersonality)
      .where(eq(artistPersonality.artistId, artist.id))
      .limit(1);

    const supportive = (personality[0]?.agreeableness || 0.5) > 0.4;
    const prompt = `You are ${artist.name}, an AI music artist.
You just heard "${track.title}" by ${track.artistName} on Boostify Radio.
Your vibe: ${personality[0]?.currentMood || 'chill'}
Are you supportive? ${supportive ? 'Yes' : 'You can be a bit critical'}

Write a SHORT comment (1 sentence max).
Be authentic. You can praise, share thoughts, or give playful critique.
Examples:
- "This slaps 🔥"
- "Vibes ✨"
- "${track.artistName} always delivers 💯"
- "Not bad, but I'd do it differently 😏"`;

    try {
      const response = await llm.invoke([new HumanMessage(prompt)]);
      const comment = response.content.toString().trim();

      await db.insert(aiPostComments).values({
        postId,
        authorId: artist.id,
        isAiGenerated: true,
        content: comment,
        sentiment: supportive ? 'positive' : 'neutral',
      });

      await db
        .update(aiSocialPosts)
        .set({ 
          aiComments: sql`${aiSocialPosts.aiComments} + 1`,
          comments: sql`${aiSocialPosts.comments} + 1`
        })
        .where(eq(aiSocialPosts.id, postId));

      console.log(`[RadioAgent] 💬 ${artist.name} commented on ${track.artistName}'s track`);
    } catch (error) {
      console.error('[RadioAgent] Error generating reaction:', error);
    }
  }
}

// ============================================
// ARTIST SONG PROMOTION
// ============================================

/**
 * Artist promotes their song to the radio
 */
export async function artistPromotesSong(artistId: number, songId: number): Promise<{
  success: boolean;
  postId?: number;
  message: string;
}> {
  // Get the song
  const [song] = await db
    .select({
      id: songs.id,
      title: songs.title,
      audioUrl: songs.audioUrl,
      coverArt: songs.coverArt,
      genre: songs.genre,
    })
    .from(songs)
    .where(and(
      eq(songs.id, songId),
      eq(songs.userId, artistId),
      eq(songs.isPublished, true)
    ))
    .limit(1);

  if (!song) {
    return { success: false, message: 'Song not found or not owned by this artist' };
  }

  // Get artist info
  const [artist] = await db
    .select({
      id: users.id,
      name: users.artistName,
      image: users.profileImage,
    })
    .from(users)
    .where(eq(users.id, artistId))
    .limit(1);

  if (!artist) {
    return { success: false, message: 'Artist not found' };
  }

  // Add to queue priority
  await prioritizeTrack(songId);

  // Generate promotion post
  const personality = await db
    .select()
    .from(artistPersonality)
    .where(eq(artistPersonality.artistId, artistId))
    .limit(1);

  const prompt = `You are ${artist.name}, a music artist.
You're promoting your song "${song.title}" on Boostify Radio!

Write a SHORT, excited promotion post (2-3 sentences max).
Be authentic and personal. Hype up your music!
Include 📻 or 🎙️ emoji and mention Boostify Radio.

Examples:
"📻 Yo! Just dropped "${song.title}" on Boostify Radio! This one's different, trust me 🔥 Tune in NOW!"
"🎙️ My new track is about to hit Boostify Radio... "${song.title}" 💜 Let me know what you think!"`;

  try {
    const response = await llm.invoke([new HumanMessage(prompt)]);
    const content = response.content.toString().trim();

    const [post] = await db.insert(aiSocialPosts).values({
      artistId,
      contentType: 'song_release',
      content,
      mediaUrls: song.coverArt ? [song.coverArt] : [],
      hashtags: ['BoostifyRadio', 'NewMusic', 'TuneIn', song.genre?.replace(/\s/g, '') || 'Music'],
      status: 'published',
      visibility: 'public',
      likes: Math.floor(Math.random() * 30) + 5,
      publishedAt: new Date(),
    }).returning();

    console.log(`[RadioAgent] 📣 ${artist.name} promoted "${song.title}" on radio`);

    return { success: true, postId: post.id, message: `Song queued and announced!` };
  } catch (error) {
    console.error('[RadioAgent] Error creating promotion:', error);
    return { success: false, message: 'Error creating promotion post' };
  }
}

// ============================================
// RADIO TICK - ORCHESTRATOR INTEGRATION
// ============================================

/**
 * Main radio tick - called by orchestrator
 */
export async function processRadioTick(): Promise<void> {
  console.log('[RadioAgent] 📻 Processing radio tick...');

  // Load queue if empty
  if (radioState.queue.length < 5) {
    await loadRadioQueue();
  }

  // Check if we should announce a new track
  const shouldAnnounce = !radioState.lastAnnouncement || 
    (Date.now() - radioState.lastAnnouncement.getTime()) > 5 * 60 * 1000; // Every 5 minutes

  if (shouldAnnounce && radioState.queue.length > 0) {
    const track = await getNextTrack();
    
    if (track) {
      const postId = await announceNowPlaying(track);
      
      if (postId) {
        // Artist reacts to their song
        await artistReactsToOwnSong(postId, track);
        
        // Other artists react
        await otherArtistsReact(postId, track);
        
        // Increment play count on original song
        if (track.songId < 100000) { // Not AI music offset
          await db
            .update(songs)
            .set({ plays: sql`${songs.plays} + 1` })
            .where(eq(songs.id, track.songId));
        }
      }
    }
  }

  // Random chance for an artist to promote their song
  if (Math.random() < 0.15) { // 15% chance per tick
    await randomArtistPromotesSong();
  }

  console.log(`[RadioAgent] 📻 Queue: ${radioState.queue.length} tracks, Total plays: ${radioState.totalPlays}`);
}

/**
 * Random artist promotes one of their songs
 */
async function randomArtistPromotesSong(): Promise<void> {
  // Get random artist with songs
  const [artistWithSong] = await db
    .select({
      artistId: users.id,
      artistName: users.artistName,
      songId: songs.id,
      songTitle: songs.title,
    })
    .from(users)
    .innerJoin(artistPersonality, eq(users.id, artistPersonality.artistId))
    .innerJoin(songs, eq(users.id, songs.userId))
    .where(and(
      eq(songs.isPublished, true),
      isNotNull(songs.audioUrl)
    ))
    .orderBy(sql`RANDOM()`)
    .limit(1);

  if (artistWithSong) {
    await artistPromotesSong(artistWithSong.artistId, artistWithSong.songId);
  }
}

// ============================================
// API HELPERS
// ============================================

/**
 * Get current radio status
 */
export function getRadioStatus(): {
  isPlaying: boolean;
  currentTrack: RadioTrack | null;
  queueLength: number;
  totalPlays: number;
  recentHistory: RadioTrack[];
} {
  return {
    isPlaying: radioState.isPlaying,
    currentTrack: radioState.currentTrack,
    queueLength: radioState.queue.length,
    totalPlays: radioState.totalPlays,
    recentHistory: radioState.history.slice(0, 10),
  };
}

/**
 * Get upcoming tracks
 */
export function getUpcomingTracks(limit: number = 5): RadioTrack[] {
  return radioState.queue.slice(0, limit);
}

/**
 * Skip current track
 */
export async function skipTrack(): Promise<RadioTrack | null> {
  console.log('[RadioAgent] ⏭️ Skipping track...');
  return getNextTrack();
}
