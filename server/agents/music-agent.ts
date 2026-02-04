/**
 * BOOSTIFY AUTONOMOUS AGENTS - Music Generation Agent
 * Handles autonomous music creation using AI (Suno, etc)
 */

import { db } from '../db';
import { 
  aiGeneratedMusic,
  aiCollaborations,
  artistPersonality,
  users,
  songs,
  aiSocialPosts,
  tokenizedSongs,
  aiArtistEvolution,
  platformRevenue
} from '../../db/schema';
import { eq, and, desc, sql, ne, gt, lt } from 'drizzle-orm';
import { ChatOpenAI } from '@langchain/openai';
import { eventBus, AgentEventType } from './events';

// ============================================
// MUSIC CONCEPT GENERATION
// ============================================

interface MusicConcept {
  title: string;
  lyrics: string;
  genre: string;
  mood: string;
  bpm: number;
  description: string;
  prompt: string;
}

/**
 * Generate a music concept based on artist personality
 */
export async function generateMusicConcept(artistId: number, context?: {
  collaborationId?: number;
  beefId?: number;
  mood?: string;
  theme?: string;
}): Promise<MusicConcept | null> {
  const personality = await db
    .select()
    .from(artistPersonality)
    .where(eq(artistPersonality.artistId, artistId))
    .limit(1);

  const artist = await db
    .select()
    .from(users)
    .where(eq(users.id, artistId))
    .limit(1);

  if (!personality[0] || !artist[0]) return null;

  const traits = personality[0].artisticTraits as any;
  const currentMood = context?.mood || personality[0].currentMood || 'peaceful';
  const genre = artist[0].genre || 'pop';

  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.9,
  });

  // Build context for the prompt
  let themeContext = '';
  if (context?.collaborationId) {
    const collab = await db.select().from(aiCollaborations).where(eq(aiCollaborations.id, context.collaborationId)).limit(1);
    if (collab[0]) {
      themeContext = `This is for a collaboration titled "${collab[0].title}". Concept: ${collab[0].proposedConcept}`;
    }
  } else if (context?.theme) {
    themeContext = `Theme for this song: ${context.theme}`;
  }

  const conceptPrompt = `You are ${artist[0].artistName}, a ${genre} artist.
Current mood: ${currentMood}
Artistic traits: Experimentalism ${traits?.experimentalism || 50}/100, Authenticity ${traits?.authenticity || 50}/100
${themeContext}

Create a unique song concept in JSON format:
{
  "title": "Creative song title",
  "lyrics": "Full verse and chorus lyrics (at least 8 lines, creative and emotional)",
  "genre": "${genre}",
  "mood": "emotional tone (e.g., energetic, melancholic, euphoric)",
  "bpm": tempo number (60-180),
  "description": "One sentence about what this song means to you as the artist",
  "prompt": "Music generation prompt for AI (describe the sound, instruments, vibe - 1-2 sentences)"
}

Make the lyrics authentic and emotionally resonant. The music prompt should be detailed enough for an AI music generator.`;

  const response = await llm.invoke(conceptPrompt);
  
  try {
    const content = response.content.toString();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    const concept = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
    
    if (concept) {
      return {
        title: concept.title,
        lyrics: concept.lyrics,
        genre: concept.genre || genre,
        mood: concept.mood || currentMood,
        bpm: concept.bpm || 120,
        description: concept.description,
        prompt: concept.prompt,
      };
    }
  } catch (error) {
    console.error('[MusicAgent] Error parsing concept:', error);
  }

  return null;
}

// ============================================
// MUSIC GENERATION (Integration Ready)
// ============================================

/**
 * Generate cover art for a song
 */
export async function generateCoverArt(concept: MusicConcept, artistId: number): Promise<{
  imageUrl: string;
  prompt: string;
} | null> {
  // In production, this would call Flux/DALL-E/etc.
  // For now, return a placeholder structure
  
  const llm = new ChatOpenAI({
    modelName: 'gpt-4o-mini',
    temperature: 0.8,
  });

  const artPrompt = `Create an image generation prompt for album art:
Song: "${concept.title}"
Genre: ${concept.genre}
Mood: ${concept.mood}
Description: ${concept.description}

Generate a detailed art prompt (1-2 sentences) that would create stunning album artwork. Focus on abstract or artistic imagery, no text.`;

  const response = await llm.invoke(artPrompt);
  const prompt = response.content.toString().trim();

  // Placeholder URL - in production, call image generation API
  return {
    imageUrl: `/api/placeholder/500/500?text=${encodeURIComponent(concept.title)}`,
    prompt,
  };
}

/**
 * Request music generation from AI service
 * This is the integration point for Suno/Udio/etc.
 */
export async function requestMusicGeneration(
  artistId: number,
  concept: MusicConcept,
  options?: {
    collaborationId?: number;
    beefId?: number;
    isDissTrack?: boolean;
  }
): Promise<typeof aiGeneratedMusic.$inferSelect | null> {
  // Generate cover art concept
  const coverArt = await generateCoverArt(concept, artistId);

  // Create the music entry (status: pending - will be updated when audio is ready)
  const [music] = await db
    .insert(aiGeneratedMusic)
    .values({
      artistId,
      title: concept.title,
      description: concept.description,
      lyrics: concept.lyrics,
      genre: concept.genre,
      mood: concept.mood,
      bpm: concept.bpm,
      generationPrompt: concept.prompt,
      generationProvider: 'suno', // Default, could be configurable
      coverArtUrl: coverArt?.imageUrl,
      coverArtPrompt: coverArt?.prompt,
      collaborationId: options?.collaborationId,
      beefId: options?.beefId,
      isDissTrack: options?.isDissTrack || false,
      status: 'generating', // In production: 'pending' -> API call -> callback updates to 'ready'
    })
    .returning();

  console.log(`🎵 [MusicAgent] Requested generation for "${concept.title}" by artist ${artistId}`);

  // In production, here you would:
  // 1. Call Suno API with the prompt and lyrics
  // 2. Store the request ID
  // 3. Set up webhook to receive the completed audio
  // 4. Update the status to 'ready' and set audioUrl when complete

  // For simulation, mark as ready after a delay
  setTimeout(async () => {
    await db
      .update(aiGeneratedMusic)
      .set({
        status: 'ready',
        audioUrl: `/api/ai-music/${music.id}/audio`, // Placeholder
        previewUrl: `/api/ai-music/${music.id}/preview`, // Placeholder
        duration: Math.floor(Math.random() * 60 + 120), // 2-3 minutes
        updatedAt: new Date(),
      })
      .where(eq(aiGeneratedMusic.id, music.id));

    console.log(`🎵 [MusicAgent] Song "${concept.title}" ready!`);
  }, 5000);

  return music;
}

// ============================================
// MUSIC RELEASE & PUBLISHING
// ============================================

/**
 * Publish a generated song and announce it
 */
export async function publishSong(musicId: number): Promise<boolean> {
  const music = await db
    .select()
    .from(aiGeneratedMusic)
    .where(eq(aiGeneratedMusic.id, musicId))
    .limit(1);

  if (!music[0] || music[0].status !== 'ready') {
    console.log('[MusicAgent] Song not ready for publishing');
    return false;
  }

  const artist = await db
    .select()
    .from(users)
    .where(eq(users.id, music[0].artistId))
    .limit(1);

  if (!artist[0]) return false;

  // Create entry in main songs table
  const [song] = await db
    .insert(songs)
    .values({
      userId: music[0].artistId,
      title: music[0].title || 'Untitled',
      description: music[0].description,
      audioUrl: music[0].audioUrl || '',
      duration: music[0].duration?.toString(),
      genre: music[0].genre,
      mood: music[0].mood,
      lyrics: music[0].lyrics,
      coverArt: music[0].coverArtUrl,
      generatedWithAI: true,
      aiProvider: music[0].generationProvider,
      isPublished: true,
    })
    .returning();

  // Update AI music entry
  await db
    .update(aiGeneratedMusic)
    .set({
      isPublished: true,
      publishedAt: new Date(),
      linkedSongId: song.id,
      updatedAt: new Date(),
    })
    .where(eq(aiGeneratedMusic.id, musicId));

  // Announce the release
  const releasePost = await db.insert(aiSocialPosts).values({
    artistId: music[0].artistId,
    contentType: 'song_release',
    content: `🎵 NEW MUSIC OUT NOW! "${music[0].title}"\n\n${music[0].description || ''}\n\n${music[0].lyrics?.substring(0, 100)}...\n\nLink in bio! #NewMusic #${music[0].genre?.replace(/\s/g, '')} #OutNow`,
    mediaUrls: music[0].coverArtUrl ? [music[0].coverArtUrl] : [],
    status: 'published',
    hashtags: ['NewMusic', music[0].genre?.replace(/\s/g, '') || 'Music', 'OutNow'],
  });

  // Record platform revenue from release
  await db.insert(platformRevenue).values({
    revenueType: 'music_streaming',
    amount: '0.99', // Release fee
    sourceArtistId: music[0].artistId,
    description: `Release fee for "${music[0].title}"`,
  });

  // Evolution event
  await db.insert(aiArtistEvolution).values({
    artistId: music[0].artistId,
    evolutionType: 'breakthrough',
    title: `Released "${music[0].title}"`,
    description: `New AI-generated track in ${music[0].genre}`,
    triggerType: 'ai_decision',
    followersChange: Math.floor(Math.random() * 100 + 10),
  });

  console.log(`🎵 [MusicAgent] Published "${music[0].title}" by ${artist[0].artistName}`);

  // Emit event
  eventBus.emitAgentEvent({
    type: AgentEventType.ARTIST_POSTED,
    payload: {
      timestamp: new Date(),
      source: 'MusicAgent',
      artistId: music[0].artistId,
      action: 'song_released',
      songId: song.id,
      title: music[0].title,
    },
    priority: 'medium',
  });

  return true;
}

/**
 * Tokenize a song for BoostiSwap
 */
export async function tokenizeSong(musicId: number): Promise<boolean> {
  const music = await db
    .select()
    .from(aiGeneratedMusic)
    .where(eq(aiGeneratedMusic.id, musicId))
    .limit(1);

  if (!music[0] || !music[0].isPublished) {
    console.log('[MusicAgent] Song not published for tokenization');
    return false;
  }

  // Create token
  const symbol = (music[0].title || 'SONG')
    .toUpperCase()
    .replace(/[^A-Z]/g, '')
    .substring(0, 6);

  const [token] = await db
    .insert(tokenizedSongs)
    .values({
      artistId: music[0].artistId,
      songName: music[0].title || 'Untitled',
      tokenSymbol: symbol,
      pricePerTokenUsd: '0.10',
      pricePerTokenEth: '0.00004',
      totalSupply: 10000,
      availableSupply: 10000,
      imageUrl: music[0].coverArtUrl,
      description: music[0].description,
      isActive: true,
    })
    .returning();

  // Update music entry
  await db
    .update(aiGeneratedMusic)
    .set({
      tokenized: true,
      tokenId: token.id,
      updatedAt: new Date(),
    })
    .where(eq(aiGeneratedMusic.id, musicId));

  // Announce tokenization
  await db.insert(aiSocialPosts).values({
    artistId: music[0].artistId,
    contentType: 'announcement',
    content: `🚀 "${music[0].title}" is now tokenized on BoostiSwap! \n\nOwn a piece of my music with $${symbol}. Early supporters get in at the ground floor! #Web3Music #Tokenized #BoostiSwap`,
    status: 'published',
    hashtags: ['Web3Music', 'Tokenized', 'BoostiSwap', symbol],
  });

  // Platform revenue from tokenization
  await db.insert(platformRevenue).values({
    revenueType: 'nft_sale',
    amount: '5.00', // Tokenization fee
    sourceArtistId: music[0].artistId,
    sourceTokenId: token.id,
    description: `Tokenization fee for "${music[0].title}"`,
  });

  console.log(`💎 [MusicAgent] Tokenized "${music[0].title}" as $${symbol}`);

  return true;
}

// ============================================
// AUTONOMOUS MUSIC CREATION
// ============================================

/**
 * Decide if an artist should create new music
 */
export async function shouldCreateMusic(artistId: number): Promise<{
  should: boolean;
  context?: {
    mood?: string;
    theme?: string;
    collaborationId?: number;
  };
}> {
  const personality = await db
    .select()
    .from(artistPersonality)
    .where(eq(artistPersonality.artistId, artistId))
    .limit(1);

  if (!personality[0]) return { should: false };

  // Check how many songs they've created recently
  const recentSongs = await db
    .select({ count: sql<number>`count(*)` })
    .from(aiGeneratedMusic)
    .where(
      and(
        eq(aiGeneratedMusic.artistId, artistId),
        gt(aiGeneratedMusic.createdAt, new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)) // Last 7 days
      )
    );

  const songCount = Number(recentSongs[0]?.count || 0);
  if (songCount >= 3) return { should: false }; // Max 3 songs per week

  // Creative moods increase probability
  const creativeMoods = ['inspired', 'energetic', 'reflective', 'euphoric'];
  const isCreativeMood = creativeMoods.includes(personality[0].currentMood || '');
  
  const traits = personality[0].artisticTraits as any;
  const creativity = (traits?.experimentalism || 50) + (traits?.authenticity || 50);
  
  // Base probability with mood and creativity factors
  const probability = (creativity / 200) * (isCreativeMood ? 1.5 : 0.5);
  
  if (Math.random() > probability * 0.15) { // Max ~15% chance per tick
    return { should: false };
  }

  // Check for active collaborations that need songs
  const pendingCollabs = await db
    .select()
    .from(aiCollaborations)
    .where(
      and(
        eq(aiCollaborations.status, 'in_progress'),
        eq(aiCollaborations.initiatorId, artistId)
      )
    )
    .limit(1);

  if (pendingCollabs.length > 0) {
    return {
      should: true,
      context: {
        collaborationId: pendingCollabs[0].id,
        mood: pendingCollabs[0].proposedMood || undefined,
        theme: pendingCollabs[0].proposedConcept || undefined,
      },
    };
  }

  // Random themes based on current mood
  const themes: Record<string, string[]> = {
    inspired: ['breakthrough', 'new beginnings', 'chasing dreams'],
    melancholic: ['loss', 'memories', 'growing apart'],
    energetic: ['celebration', 'victory', 'unstoppable'],
    rebellious: ['breaking rules', 'authenticity', 'standing out'],
    peaceful: ['gratitude', 'love', 'simple joys'],
  };

  const moodThemes = themes[personality[0].currentMood || 'peaceful'] || themes.peaceful;
  const randomTheme = moodThemes[Math.floor(Math.random() * moodThemes.length)];

  return {
    should: true,
    context: {
      mood: personality[0].currentMood || undefined,
      theme: randomTheme,
    },
  };
}

// ============================================
// MUSIC TICK PROCESSOR
// ============================================

/**
 * Process music-related activities for all artists
 */
export async function processMusicTick(): Promise<void> {
  console.log('🎵 [MusicAgent] Processing music tick...');

  const artists = await db
    .select({ artistId: artistPersonality.artistId })
    .from(artistPersonality);

  let songsCreated = 0;
  let songsPublished = 0;
  let songsTokenized = 0;

  for (const { artistId } of artists) {
    // Check if should create new music
    if (Math.random() < 0.08) { // 8% chance to check per tick
      const decision = await shouldCreateMusic(artistId);
      if (decision.should) {
        const concept = await generateMusicConcept(artistId, decision.context);
        if (concept) {
          await requestMusicGeneration(artistId, concept, {
            collaborationId: decision.context?.collaborationId,
          });
          songsCreated++;
        }
      }
    }
  }

  // Check for ready songs to publish
  const readySongs = await db
    .select()
    .from(aiGeneratedMusic)
    .where(
      and(
        eq(aiGeneratedMusic.status, 'ready'),
        eq(aiGeneratedMusic.isPublished, false)
      )
    );

  for (const song of readySongs) {
    // Random delay before publishing (simulates release strategy)
    if (Math.random() < 0.3) { // 30% chance to publish per tick
      const published = await publishSong(song.id);
      if (published) songsPublished++;
    }
  }

  // Check for published songs to tokenize
  const publishedSongs = await db
    .select()
    .from(aiGeneratedMusic)
    .where(
      and(
        eq(aiGeneratedMusic.isPublished, true),
        eq(aiGeneratedMusic.tokenized, false)
      )
    );

  for (const song of publishedSongs) {
    // Small chance to tokenize (not all songs get tokenized)
    if (Math.random() < 0.1) { // 10% chance per tick
      const tokenized = await tokenizeSong(song.id);
      if (tokenized) songsTokenized++;
    }
  }

  console.log(`🎵 [MusicAgent] Tick complete: ${songsCreated} created, ${songsPublished} published, ${songsTokenized} tokenized`);
}
