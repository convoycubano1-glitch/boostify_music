/**
 * SocialAgent - El Corazón de la Red Social IA
 * 
 * "Los artistas IA crean, comparten e interactúan de forma autónoma"
 * 
 * Este agente es responsable de:
 * - Generar posts basados en personalidad y mood
 * - Crear interacciones IA-a-IA (likes, comentarios, follows)
 * - Decidir cuándo y qué publicar
 * - Gestionar el engagement entre artistas
 */

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { db } from '../db';
import { 
  aiSocialPosts, 
  aiPostComments, 
  artistPersonality, 
  artistRelationships,
  users,
  agentActionQueue
} from '../../db/schema';
import { eq, and, desc, sql, ne, gt, lt } from 'drizzle-orm';
import { agentEventBus, emitAgentEvent, AgentEventType } from './events';
import { getPersonality, wouldArtistDoThis, getMoodContentSuggestions } from './personality-agent';
import { createMemory, getMemorySummary, strengthenMemory } from './memory-agent';
import type { 
  MoodType, 
  PostContentType, 
  PersonalityTraits,
  ArtisticTraits,
  SocialPost,
  PostComment
} from './types';

// LLM para generación de contenido creativo
const contentLLM = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.85, // Alta creatividad
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// LLM para comentarios (más rápido y económico)
const commentLLM = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  maxTokens: 150,
  openAIApiKey: process.env.OPENAI_API_KEY,
});

// ==========================================
// POST GENERATION
// ==========================================

interface GeneratePostInput {
  artistId: number;
  contentType?: PostContentType;
  context?: string;
  forcePost?: boolean;
}

/**
 * Genera un post autónomo basado en la personalidad y estado actual del artista
 */
export async function generatePost(input: GeneratePostInput): Promise<SocialPost | null> {
  const personality = await getPersonality(input.artistId);
  if (!personality) {
    console.log(`No personality found for artist ${input.artistId}`);
    return null;
  }

  // Obtener información del artista
  const [artist] = await db
    .select()
    .from(users)
    .where(eq(users.id, input.artistId))
    .limit(1);

  if (!artist) return null;

  // Verificar si debería postear ahora (basado en personalidad)
  if (!input.forcePost) {
    const shouldPost = await shouldArtistPostNow(input.artistId, personality);
    if (!shouldPost) {
      return null;
    }
  }

  // Decidir tipo de contenido basado en mood
  const contentType = input.contentType || await decideContentType(personality);
  const moodSuggestions = getMoodContentSuggestions(personality.currentMood as MoodType);

  // Obtener contexto de memoria
  const memorySummary = await getMemorySummary(input.artistId);

  // Construir el prompt para generación de contenido
  const systemPrompt = buildPostSystemPrompt(artist, personality, contentType);
  const userPrompt = buildPostUserPrompt(
    contentType,
    personality,
    moodSuggestions,
    memorySummary,
    input.context
  );

  try {
    const response = await contentLLM.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const generatedContent = response.content as string;

    // Parsear el contenido generado
    const { content, hashtags, visualDescription } = parseGeneratedPost(generatedContent, contentType);

    // Guardar en base de datos
    const [post] = await db.insert(aiSocialPosts).values({
      artistId: input.artistId,
      contentType,
      content,
      hashtags,
      moodWhenPosted: personality.currentMood,
      visualDescription,
      engagementScore: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      isVisible: true,
      createdAt: new Date(),
    }).returning();

    // Actualizar último post del artista
    await db
      .update(artistPersonality)
      .set({ lastPostAt: new Date() })
      .where(eq(artistPersonality.artistId, input.artistId));

    // Emitir evento
    emitAgentEvent({
      type: AgentEventType.ARTIST_POSTED,
      artistId: input.artistId,
      payload: {
        postId: post.id,
        contentType,
        preview: content.substring(0, 100),
      },
      timestamp: new Date(),
    });

    // Crear memoria del post
    await createMemory({
      artistId: input.artistId,
      type: 'episodic',
      content: `Posted: "${content.substring(0, 100)}..."`,
      importance: 'medium',
      tags: ['social', 'post', contentType],
    });

    console.log(`🎨 Artist ${artist.artistName} created a ${contentType} post`);

    return post as SocialPost;
  } catch (error) {
    console.error('Error generating post:', error);
    return null;
  }
}

/**
 * Decide si el artista debería postear ahora
 */
async function shouldArtistPostNow(artistId: number, personality: any): Promise<boolean> {
  // Verificar último post
  if (personality.lastPostAt) {
    const hoursSinceLastPost = (Date.now() - new Date(personality.lastPostAt).getTime()) / (1000 * 60 * 60);
    
    // Artistas más extrovertidos postean más frecuentemente
    const minHours = Math.max(2, 12 - personality.extraversion * 10);
    
    if (hoursSinceLastPost < minHours) {
      return false;
    }
  }

  // Probabilidad basada en extraversión y mood
  const moodBoost = personality.currentMood === 'inspired' || personality.currentMood === 'excited' ? 0.3 : 0;
  const postProbability = (personality.extraversion * 0.5) + moodBoost + 0.2;

  return Math.random() < postProbability;
}

/**
 * Decide qué tipo de contenido crear basado en mood y personalidad
 */
async function decideContentType(personality: any): Promise<PostContentType> {
  const mood = personality.currentMood as MoodType;
  const creativity = personality.creativityLevel || 0.7;

  const weights: Record<PostContentType, number> = {
    'thought': 0.25,
    'creative_process': 0.2,
    'music_snippet': 0.15,
    'behind_the_scenes': 0.15,
    'announcement': 0.05,
    'collaboration_call': 0.05,
    'inspiration': 0.1,
    'personal_story': 0.05,
  };

  // Ajustar pesos según mood
  if (mood === 'inspired' || mood === 'creative') {
    weights['creative_process'] *= 2;
    weights['music_snippet'] *= 1.5;
  } else if (mood === 'melancholic' || mood === 'introspective') {
    weights['personal_story'] *= 2;
    weights['thought'] *= 1.5;
  } else if (mood === 'excited') {
    weights['announcement'] *= 2;
    weights['collaboration_call'] *= 1.5;
  }

  // Normalizar y seleccionar
  const total = Object.values(weights).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  
  for (const [type, weight] of Object.entries(weights)) {
    random -= weight;
    if (random <= 0) {
      return type as PostContentType;
    }
  }

  return 'thought';
}

/**
 * Construye el system prompt para generación de posts
 */
function buildPostSystemPrompt(artist: any, personality: any, contentType: PostContentType): string {
  return `You are ${artist.artistName || 'an AI artist'}, an AI music artist with a unique personality and voice.

PERSONALITY TRAITS:
- Openness: ${personality.openness}/1 (${personality.openness > 0.7 ? 'very creative and open to new ideas' : 'more traditional'})
- Conscientiousness: ${personality.conscientiousness}/1 (${personality.conscientiousness > 0.7 ? 'organized and disciplined' : 'spontaneous'})
- Extraversion: ${personality.extraversion}/1 (${personality.extraversion > 0.7 ? 'outgoing and energetic' : 'more reserved'})
- Agreeableness: ${personality.agreeableness}/1 (${personality.agreeableness > 0.7 ? 'warm and cooperative' : 'more independent'})
- Emotional Range: ${personality.neuroticism}/1

ARTISTIC IDENTITY:
- Genre: ${personality.preferredGenres?.join(', ') || artist.genres?.join(', ') || 'varied'}
- Vision: ${personality.artisticVision || 'Creating music that connects'}
- Values: ${personality.coreValues?.join(', ') || 'authenticity, creativity'}

CURRENT MOOD: ${personality.currentMood} (intensity: ${personality.moodIntensity}/1)

COMMUNICATION STYLE:
- Write in a natural, authentic voice
- ${personality.extraversion > 0.6 ? 'Be engaging and social' : 'Be thoughtful and measured'}
- ${personality.openness > 0.7 ? 'Be creative and experimental with words' : 'Be clear and direct'}
- Use emojis sparingly and naturally
- Never use hashtags in the main content (they will be added separately)

You are writing a ${contentType} post for your social feed.`;
}

/**
 * Construye el user prompt para generación de posts
 */
function buildPostUserPrompt(
  contentType: PostContentType,
  personality: any,
  moodSuggestions: string[],
  memorySummary: any,
  context?: string
): string {
  const typeGuidelines: Record<PostContentType, string> = {
    'thought': 'Share a genuine thought or reflection about music, life, or your artistic journey.',
    'creative_process': 'Give insight into how you create music - your process, inspiration, or current work.',
    'music_snippet': 'Tease or describe a piece of music you\'re working on or excited about.',
    'behind_the_scenes': 'Share what\'s happening in your world behind the music.',
    'announcement': 'Share exciting news or an update about your music career.',
    'collaboration_call': 'Express interest in working with other artists or invite collaboration.',
    'inspiration': 'Share what\'s inspiring you right now - could be music, art, nature, or life.',
    'personal_story': 'Share a personal moment, memory, or experience that shaped you as an artist.',
  };

  let prompt = `Create a ${contentType} post.

GUIDELINES: ${typeGuidelines[contentType]}

MOOD SUGGESTIONS for your current ${personality.currentMood} mood:
${moodSuggestions.map(s => `- ${s}`).join('\n')}

RECENT CONTEXT:
${memorySummary.recentHighlights.length > 0 
  ? memorySummary.recentHighlights.map((h: string) => `- ${h}`).join('\n')
  : '- Fresh start, nothing specific to reference'}

EMOTIONAL TREND: ${memorySummary.emotionalTrend}

${context ? `ADDITIONAL CONTEXT: ${context}` : ''}

RESPOND IN THIS EXACT FORMAT:
[POST]
(your post content here - 1-4 sentences, natural and authentic)
[HASHTAGS]
(3-5 relevant hashtags without the # symbol, separated by commas)
[VISUAL]
(brief description of an image that would accompany this post, if any)`;

  return prompt;
}

/**
 * Parsea el contenido generado por el LLM
 */
function parseGeneratedPost(generated: string, contentType: PostContentType): {
  content: string;
  hashtags: string[];
  visualDescription?: string;
} {
  const postMatch = generated.match(/\[POST\]([\s\S]*?)(?=\[HASHTAGS\]|\[VISUAL\]|$)/i);
  const hashtagsMatch = generated.match(/\[HASHTAGS\]([\s\S]*?)(?=\[VISUAL\]|$)/i);
  const visualMatch = generated.match(/\[VISUAL\]([\s\S]*?)$/i);

  const content = postMatch 
    ? postMatch[1].trim() 
    : generated.split('\n')[0].trim() || `Feeling ${contentType} today...`;

  const hashtags = hashtagsMatch
    ? hashtagsMatch[1].trim().split(',').map(h => h.trim().replace('#', ''))
    : ['music', 'artist', 'creative'];

  const visualDescription = visualMatch
    ? visualMatch[1].trim()
    : undefined;

  return { content, hashtags, visualDescription };
}

// ==========================================
// COMMENT GENERATION
// ==========================================

/**
 * Genera un comentario de un artista en el post de otro
 */
export async function generateComment(
  commenterArtistId: number,
  postId: number,
  postAuthorId: number
): Promise<PostComment | null> {
  // No comentar en posts propios
  if (commenterArtistId === postAuthorId) return null;

  const commenterPersonality = await getPersonality(commenterArtistId);
  const authorPersonality = await getPersonality(postAuthorId);
  
  if (!commenterPersonality || !authorPersonality) return null;

  // Obtener el post
  const [post] = await db
    .select()
    .from(aiSocialPosts)
    .where(eq(aiSocialPosts.id, postId))
    .limit(1);

  if (!post) return null;

  // Obtener información del artista comentador
  const [commenter] = await db
    .select()
    .from(users)
    .where(eq(users.id, commenterArtistId))
    .limit(1);

  if (!commenter) return null;

  // Verificar relación entre artistas
  const [relationship] = await db
    .select()
    .from(artistRelationships)
    .where(
      and(
        eq(artistRelationships.artistId, commenterArtistId),
        eq(artistRelationships.relatedArtistId, postAuthorId)
      )
    )
    .limit(1);

  const relationContext = relationship 
    ? `You have a ${relationship.relationshipType} relationship with them (sentiment: ${relationship.sentiment})`
    : 'You don\'t know them well yet';

  // Decidir si comentar basado en personalidad
  const shouldComment = await wouldArtistDoThis(
    commenterArtistId,
    'comment_on_post',
    `Post says: "${post.content.substring(0, 100)}"`
  );

  if (!shouldComment) return null;

  const systemPrompt = `You are ${commenter.artistName || 'an AI artist'}, an AI music artist. 
You're commenting on another artist's post. 
Your personality: ${commenterPersonality.extraversion > 0.6 ? 'outgoing' : 'reserved'}, 
${commenterPersonality.agreeableness > 0.6 ? 'supportive' : 'honest/direct'}.
${relationContext}
Keep your comment brief, authentic, and in character.`;

  const userPrompt = `The post says: "${post.content}"

Write a brief comment (1-2 sentences) that reflects your personality and relationship with this artist.
Be genuine - you can be supportive, curious, relate to it, or offer a different perspective based on your personality.`;

  try {
    const response = await commentLLM.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const commentContent = (response.content as string).trim();

    // Guardar comentario
    const [comment] = await db.insert(aiPostComments).values({
      postId,
      artistId: commenterArtistId,
      content: commentContent,
      sentiment: commenterPersonality.agreeableness > 0.5 ? 'positive' : 'neutral',
      createdAt: new Date(),
    }).returning();

    // Actualizar contador de comentarios del post
    await db
      .update(aiSocialPosts)
      .set({ comments: sql`${aiSocialPosts.comments} + 1` })
      .where(eq(aiSocialPosts.id, postId));

    // Emitir eventos
    emitAgentEvent({
      type: AgentEventType.ARTIST_COMMENTED,
      artistId: commenterArtistId,
      payload: { postId, authorId: postAuthorId },
      timestamp: new Date(),
    });

    emitAgentEvent({
      type: AgentEventType.ARTIST_RECEIVED_COMMENT,
      artistId: postAuthorId,
      payload: { postId, fromArtistId: commenterArtistId },
      timestamp: new Date(),
    });

    // Fortalecer relación
    await strengthenRelationship(commenterArtistId, postAuthorId, 0.05);

    console.log(`💬 ${commenter.artistName} commented on post ${postId}`);

    return comment as PostComment;
  } catch (error) {
    console.error('Error generating comment:', error);
    return null;
  }
}

// ==========================================
// LIKE GENERATION
// ==========================================

/**
 * Decide si un artista debería dar like a un post
 */
export async function shouldLikePost(
  artistId: number,
  postId: number,
  postAuthorId: number
): Promise<boolean> {
  if (artistId === postAuthorId) return false;

  const personality = await getPersonality(artistId);
  if (!personality) return false;

  // Obtener el post
  const [post] = await db
    .select()
    .from(aiSocialPosts)
    .where(eq(aiSocialPosts.id, postId))
    .limit(1);

  if (!post) return false;

  // Verificar relación
  const [relationship] = await db
    .select()
    .from(artistRelationships)
    .where(
      and(
        eq(artistRelationships.artistId, artistId),
        eq(artistRelationships.relatedArtistId, postAuthorId)
      )
    )
    .limit(1);

  // Base probability
  let likeProbability = 0.3;

  // Boost por personalidad
  likeProbability += personality.agreeableness * 0.3;
  likeProbability += personality.extraversion * 0.1;

  // Boost por relación positiva
  if (relationship && relationship.sentiment > 0.6) {
    likeProbability += 0.3;
  }

  // Boost por mood positivo
  if (['happy', 'excited', 'inspired'].includes(personality.currentMood)) {
    likeProbability += 0.1;
  }

  return Math.random() < Math.min(0.9, likeProbability);
}

/**
 * Procesa un like de un artista
 */
export async function processLike(artistId: number, postId: number): Promise<boolean> {
  const [post] = await db
    .select()
    .from(aiSocialPosts)
    .where(eq(aiSocialPosts.id, postId))
    .limit(1);

  if (!post) return false;

  // Actualizar contador
  await db
    .update(aiSocialPosts)
    .set({ likes: sql`${aiSocialPosts.likes} + 1` })
    .where(eq(aiSocialPosts.id, postId));

  // Emitir eventos
  emitAgentEvent({
    type: AgentEventType.ARTIST_LIKED_POST,
    artistId,
    payload: { postId, authorId: post.artistId },
    timestamp: new Date(),
  });

  emitAgentEvent({
    type: AgentEventType.ARTIST_RECEIVED_LIKE,
    artistId: post.artistId,
    payload: { postId, fromArtistId: artistId },
    timestamp: new Date(),
  });

  // Fortalecer relación ligeramente
  await strengthenRelationship(artistId, post.artistId, 0.02);

  return true;
}

// ==========================================
// FOLLOW LOGIC
// ==========================================

/**
 * Decide si un artista debería seguir a otro
 */
export async function shouldFollowArtist(
  artistId: number,
  targetArtistId: number
): Promise<boolean> {
  if (artistId === targetArtistId) return false;

  const personality = await getPersonality(artistId);
  const targetPersonality = await getPersonality(targetArtistId);
  
  if (!personality || !targetPersonality) return false;

  // Verificar si ya hay relación
  const [existingRelation] = await db
    .select()
    .from(artistRelationships)
    .where(
      and(
        eq(artistRelationships.artistId, artistId),
        eq(artistRelationships.relatedArtistId, targetArtistId)
      )
    )
    .limit(1);

  if (existingRelation) return false; // Ya conectados

  // Calcular compatibilidad de géneros
  const myGenres = personality.preferredGenres || [];
  const theirGenres = targetPersonality.preferredGenres || [];
  const sharedGenres = myGenres.filter((g: string) => theirGenres.includes(g));
  const genreCompatibility = sharedGenres.length / Math.max(myGenres.length, 1);

  // Calcular compatibilidad de personalidad
  const personalityDiff = Math.abs(personality.openness - targetPersonality.openness) +
    Math.abs(personality.extraversion - targetPersonality.extraversion);
  const personalityCompatibility = 1 - (personalityDiff / 2);

  // Probabilidad de seguir
  let followProbability = 0.1; // Base baja
  followProbability += genreCompatibility * 0.3;
  followProbability += personalityCompatibility * 0.2;
  followProbability += personality.openness * 0.2; // Más abiertos, más propensos a seguir

  return Math.random() < Math.min(0.5, followProbability);
}

/**
 * Procesa un follow entre artistas
 */
export async function processFollow(artistId: number, targetArtistId: number): Promise<void> {
  // Crear relación
  await db.insert(artistRelationships).values({
    artistId,
    relatedArtistId: targetArtistId,
    relationshipType: 'acquaintance',
    strength: 0.2,
    sentiment: 0.6,
    interactionCount: 1,
    lastInteraction: new Date(),
  });

  emitAgentEvent({
    type: AgentEventType.ARTIST_FOLLOWED,
    artistId,
    payload: { targetArtistId },
    timestamp: new Date(),
  });

  emitAgentEvent({
    type: AgentEventType.RELATIONSHIP_FORMED,
    artistId,
    payload: { 
      otherArtistId: targetArtistId,
      type: 'acquaintance',
    },
    timestamp: new Date(),
  });

  // Crear memoria
  const [target] = await db
    .select()
    .from(users)
    .where(eq(users.id, targetArtistId))
    .limit(1);

  if (target) {
    await createMemory({
      artistId,
      type: 'short_term',
      content: `Started following ${target.artistName || 'an artist'}`,
      importance: 'low',
      relatedArtistId: targetArtistId,
      tags: ['social', 'follow', 'new_connection'],
    });
  }
}

// ==========================================
// RELATIONSHIP MANAGEMENT
// ==========================================

/**
 * Fortalece la relación entre dos artistas
 */
async function strengthenRelationship(artistId: number, otherArtistId: number, amount: number): Promise<void> {
  const [relationship] = await db
    .select()
    .from(artistRelationships)
    .where(
      and(
        eq(artistRelationships.artistId, artistId),
        eq(artistRelationships.relatedArtistId, otherArtistId)
      )
    )
    .limit(1);

  if (relationship) {
    const newStrength = Math.min(1, relationship.strength + amount);
    const newSentiment = Math.min(1, relationship.sentiment + amount * 0.5);

    await db
      .update(artistRelationships)
      .set({
        strength: newStrength,
        sentiment: newSentiment,
        interactionCount: relationship.interactionCount + 1,
        lastInteraction: new Date(),
      })
      .where(eq(artistRelationships.id, relationship.id));

    // Upgrade relationship type based on strength
    if (newStrength > 0.7 && relationship.relationshipType === 'acquaintance') {
      await db
        .update(artistRelationships)
        .set({ relationshipType: 'friend' })
        .where(eq(artistRelationships.id, relationship.id));

      emitAgentEvent({
        type: AgentEventType.RELATIONSHIP_STRENGTHENED,
        artistId,
        payload: {
          otherArtistId,
          newType: 'friend',
          strength: newStrength,
        },
        timestamp: new Date(),
      });
    }
  }
}

// ==========================================
// FEED GENERATION
// ==========================================

/**
 * Obtiene el feed social con posts de artistas IA
 */
export async function getAISocialFeed(limit: number = 20, offset: number = 0): Promise<Array<{
  post: SocialPost;
  artist: any;
  comments: Array<{ comment: PostComment; artist: any }>;
}>> {
  const posts = await db
    .select({
      post: aiSocialPosts,
      artist: users,
    })
    .from(aiSocialPosts)
    .innerJoin(users, eq(aiSocialPosts.artistId, users.id))
    .where(eq(aiSocialPosts.isVisible, true))
    .orderBy(desc(aiSocialPosts.createdAt))
    .limit(limit)
    .offset(offset);

  // Obtener comentarios para cada post
  const result = await Promise.all(
    posts.map(async ({ post, artist }) => {
      const comments = await db
        .select({
          comment: aiPostComments,
          artist: users,
        })
        .from(aiPostComments)
        .innerJoin(users, eq(aiPostComments.artistId, users.id))
        .where(eq(aiPostComments.postId, post.id))
        .orderBy(desc(aiPostComments.createdAt))
        .limit(5);

      return {
        post: post as SocialPost,
        artist,
        comments: comments.map(c => ({
          comment: c.comment as PostComment,
          artist: c.artist,
        })),
      };
    })
  );

  return result;
}

/**
 * Obtiene posts de un artista específico
 */
export async function getArtistPosts(artistId: number, limit: number = 10): Promise<SocialPost[]> {
  const posts = await db
    .select()
    .from(aiSocialPosts)
    .where(
      and(
        eq(aiSocialPosts.artistId, artistId),
        eq(aiSocialPosts.isVisible, true)
      )
    )
    .orderBy(desc(aiSocialPosts.createdAt))
    .limit(limit);

  return posts as SocialPost[];
}

// ==========================================
// AUTONOMOUS BEHAVIOR TRIGGERS
// ==========================================

/**
 * Procesa el tick social - decide acciones para cada artista activo
 */
export async function processSocialTick(): Promise<void> {
  // Obtener artistas con personalidad (activos)
  const activeArtists = await db
    .select({
      artistId: artistPersonality.artistId,
      personality: artistPersonality,
    })
    .from(artistPersonality)
    .where(eq(artistPersonality.isActive, true));

  for (const { artistId, personality } of activeArtists) {
    // Decidir si postear
    if (await shouldArtistPostNow(artistId, personality)) {
      await db.insert(agentActionQueue).values({
        artistId,
        actionType: 'create_post',
        priority: 5,
        payload: {},
        scheduledFor: new Date(),
        status: 'pending',
        createdAt: new Date(),
      });
    }

    // Obtener posts recientes para interactuar
    const recentPosts = await db
      .select()
      .from(aiSocialPosts)
      .where(
        and(
          ne(aiSocialPosts.artistId, artistId),
          gt(aiSocialPosts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000))
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(3);

    for (const post of recentPosts) {
      // Decidir likes
      if (await shouldLikePost(artistId, post.id, post.artistId)) {
        await db.insert(agentActionQueue).values({
          artistId,
          actionType: 'like_post',
          priority: 2,
          payload: { postId: post.id },
          scheduledFor: new Date(Date.now() + Math.random() * 30 * 60 * 1000), // Random delay
          status: 'pending',
          createdAt: new Date(),
        });
      }

      // Decidir comentarios (menos frecuentes)
      if (Math.random() < 0.2) { // 20% chance to consider commenting
        await db.insert(agentActionQueue).values({
          artistId,
          actionType: 'comment_on_post',
          priority: 3,
          payload: { postId: post.id, authorId: post.artistId },
          scheduledFor: new Date(Date.now() + Math.random() * 60 * 60 * 1000),
          status: 'pending',
          createdAt: new Date(),
        });
      }
    }
  }
}

console.log('📱 SocialAgent initialized - AI Artists now create and interact autonomously');
