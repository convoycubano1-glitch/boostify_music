/**
 * API Routes para el Sistema de Agentes Autónomos
 * 
 * "La primera red social IA-nativa de música"
 * 
 * Endpoints para:
 * - Feed social de artistas IA
 * - Generación de personalidades
 * - Gestión del orquestador
 * - Interacciones en tiempo real
 */

import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  artistPersonality, 
  aiSocialPosts, 
  aiPostComments,
  artistRelationships,
  agentMemory,
  worldEvents,
  agentActionQueue,
  users
} from '../../db/schema';
import { eq, desc, and, sql, gt, ne, count } from 'drizzle-orm';

// Importar agentes
import { generatePersonality, getPersonality, updateArtistMood } from '../agents/personality-agent';
import { getMemorySummary, getRecentMemories } from '../agents/memory-agent';
import { 
  generatePost, 
  getAISocialFeed, 
  getArtistPosts, 
  generateComment,
  processLike,
  processSocialTick
} from '../agents/social-agent';
import { 
  startOrchestrator, 
  stopOrchestrator, 
  getOrchestratorState,
  queueAction
} from '../agents/orchestrator';
import { agentEventBus, AgentEventType } from '../agents/events';

const router = Router();

// ==========================================
// SOCIAL FEED ENDPOINTS
// ==========================================

/**
 * GET /api/ai-social/feed
 * Obtiene el feed social con posts de artistas IA
 */
router.get('/feed', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;

    const feed = await getAISocialFeed(limit, offset);

    res.json({
      success: true,
      data: feed,
      pagination: {
        limit,
        offset,
        hasMore: feed.length === limit,
      },
    });
  } catch (error) {
    console.error('Error fetching AI social feed:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch feed' 
    });
  }
});

/**
 * GET /api/ai-social/artist/:id/posts
 * Obtiene posts de un artista específico
 */
router.get('/artist/:id/posts', async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id);
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await getArtistPosts(artistId, limit);

    res.json({
      success: true,
      data: posts,
    });
  } catch (error) {
    console.error('Error fetching artist posts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch posts' 
    });
  }
});

/**
 * POST /api/ai-social/generate-post
 * Fuerza la generación de un post para un artista
 */
router.post('/generate-post', async (req: Request, res: Response) => {
  try {
    const { artistId, contentType, context } = req.body;

    if (!artistId) {
      return res.status(400).json({ 
        success: false, 
        error: 'artistId is required' 
      });
    }

    const post = await generatePost({
      artistId: parseInt(artistId),
      contentType,
      context,
      forcePost: true,
    });

    if (!post) {
      return res.status(400).json({ 
        success: false, 
        error: 'Failed to generate post - artist may not have personality initialized' 
      });
    }

    res.json({
      success: true,
      data: post,
    });
  } catch (error) {
    console.error('Error generating post:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate post' 
    });
  }
});

/**
 * POST /api/ai-social/post/:id/like
 * Procesa un like en un post (puede ser de usuario o simular IA)
 */
router.post('/post/:id/like', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const { fromArtistId } = req.body;

    if (fromArtistId) {
      await processLike(parseInt(fromArtistId), postId);
    } else {
      // Like de usuario (no IA)
      await db
        .update(aiSocialPosts)
        .set({ likes: sql`${aiSocialPosts.likes} + 1` })
        .where(eq(aiSocialPosts.id, postId));
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing like:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process like' 
    });
  }
});

/**
 * POST /api/ai-social/post/:id/comment
 * Genera un comentario IA en un post
 */
router.post('/post/:id/comment', async (req: Request, res: Response) => {
  try {
    const postId = parseInt(req.params.id);
    const { commenterArtistId, postAuthorId } = req.body;

    if (!commenterArtistId || !postAuthorId) {
      return res.status(400).json({ 
        success: false, 
        error: 'commenterArtistId and postAuthorId are required' 
      });
    }

    const comment = await generateComment(
      parseInt(commenterArtistId),
      postId,
      parseInt(postAuthorId)
    );

    if (!comment) {
      return res.status(400).json({ 
        success: false, 
        error: 'Artist chose not to comment or failed to generate' 
      });
    }

    res.json({
      success: true,
      data: comment,
    });
  } catch (error) {
    console.error('Error generating comment:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate comment' 
    });
  }
});

// ==========================================
// PERSONALITY ENDPOINTS
// ==========================================

/**
 * GET /api/ai-social/artist/:id/personality
 * Obtiene la personalidad de un artista IA
 */
router.get('/artist/:id/personality', async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id);
    const personality = await getPersonality(artistId);

    if (!personality) {
      return res.status(404).json({ 
        success: false, 
        error: 'Personality not found' 
      });
    }

    res.json({
      success: true,
      data: personality,
    });
  } catch (error) {
    console.error('Error fetching personality:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch personality' 
    });
  }
});

/**
 * POST /api/ai-social/artist/:id/generate-personality
 * Genera personalidad para un artista
 */
router.post('/artist/:id/generate-personality', async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id);

    // Verificar que el artista existe
    const [artist] = await db
      .select()
      .from(users)
      .where(eq(users.id, artistId))
      .limit(1);

    if (!artist) {
      return res.status(404).json({ 
        success: false, 
        error: 'Artist not found' 
      });
    }

    const personality = await generatePersonality(artistId);

    res.json({
      success: true,
      data: personality,
      message: `Personality generated for ${artist.artistName}`,
    });
  } catch (error) {
    console.error('Error generating personality:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate personality' 
    });
  }
});

/**
 * PATCH /api/ai-social/artist/:id/mood
 * Actualiza el mood de un artista
 */
router.patch('/artist/:id/mood', async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id);
    const { mood, intensity, trigger } = req.body;

    await updateArtistMood(artistId, mood, intensity, trigger);

    res.json({
      success: true,
      message: `Mood updated to ${mood}`,
    });
  } catch (error) {
    console.error('Error updating mood:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update mood' 
    });
  }
});

/**
 * POST /api/ai-social/generate-all-personalities
 * Genera personalidades para todos los artistas que no tienen
 */
router.post('/generate-all-personalities', async (req: Request, res: Response) => {
  try {
    // Obtener artistas sin personalidad
    const existingPersonalities = await db
      .select({ artistId: artistPersonality.artistId })
      .from(artistPersonality);

    const existingIds = new Set(existingPersonalities.map(p => p.artistId));

    // Get all users with artist role
    const allArtists = await db
      .select()
      .from(users)
      .where(eq(users.role, 'artist'));

    const artistsWithoutPersonality = allArtists.filter(a => !existingIds.has(a.id));

    const results = {
      total: artistsWithoutPersonality.length,
      generated: 0,
      failed: 0,
      artists: [] as string[],
    };

    for (const artist of artistsWithoutPersonality) {
      try {
        await generatePersonality(artist.id);
        results.generated++;
        results.artists.push(artist.artistName || `Artist ${artist.id}`);
      } catch (e) {
        console.error(`Failed to generate personality for ${artist.artistName}:`, e);
        results.failed++;
      }
    }

    res.json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error('Error generating personalities:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate personalities' 
    });
  }
});

// ==========================================
// MEMORY ENDPOINTS
// ==========================================

/**
 * GET /api/ai-social/artist/:id/memories
 * Obtiene memorias de un artista
 */
router.get('/artist/:id/memories', async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id);
    const hours = parseInt(req.query.hours as string) || 48;

    const memories = await getRecentMemories(artistId, hours);

    res.json({
      success: true,
      data: memories,
    });
  } catch (error) {
    console.error('Error fetching memories:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch memories' 
    });
  }
});

/**
 * GET /api/ai-social/artist/:id/memory-summary
 * Obtiene resumen de memoria de un artista
 */
router.get('/artist/:id/memory-summary', async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id);
    const summary = await getMemorySummary(artistId);

    res.json({
      success: true,
      data: summary,
    });
  } catch (error) {
    console.error('Error fetching memory summary:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch memory summary' 
    });
  }
});

// ==========================================
// RELATIONSHIPS ENDPOINTS
// ==========================================

/**
 * GET /api/ai-social/artist/:id/relationships
 * Obtiene relaciones de un artista
 */
router.get('/artist/:id/relationships', async (req: Request, res: Response) => {
  try {
    const artistId = parseInt(req.params.id);

    const relationships = await db
      .select({
        relationship: artistRelationships,
        relatedArtist: users,
      })
      .from(artistRelationships)
      .innerJoin(users, eq(artistRelationships.relatedArtistId, users.id))
      .where(eq(artistRelationships.artistId, artistId))
      .orderBy(desc(artistRelationships.strength));

    res.json({
      success: true,
      data: relationships.map(r => ({
        ...r.relationship,
        relatedArtist: {
          id: r.relatedArtist.id,
          name: r.relatedArtist.artistName,
          imageUrl: r.relatedArtist.profileImage,
          genre: r.relatedArtist.genres?.join(', '),
        },
      })),
    });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch relationships' 
    });
  }
});

/**
 * GET /api/ai-social/network-graph
 * Obtiene el grafo de relaciones entre todos los artistas
 */
router.get('/network-graph', async (req: Request, res: Response) => {
  try {
    // Obtener artistas con personalidad
    const artistsWithPersonality = await db
      .select({
        artist: users,
        personality: artistPersonality,
      })
      .from(artistPersonality)
      .innerJoin(users, eq(artistPersonality.artistId, users.id));

    // Obtener todas las relaciones
    const allRelationships = await db
      .select()
      .from(artistRelationships);

    // Construir grafo
    const nodes = artistsWithPersonality.map(({ artist, personality }) => ({
      id: artist.id,
      name: artist.artistName,
      imageUrl: artist.profileImage,
      genre: artist.genres?.join(', '),
      mood: personality.currentMood,
      moodIntensity: personality.moodIntensity,
    }));

    const edges = allRelationships.map(rel => ({
      source: rel.artistId,
      target: rel.relatedArtistId,
      type: rel.relationshipType,
      strength: rel.strength,
      sentiment: rel.sentiment,
    }));

    res.json({
      success: true,
      data: { nodes, edges },
    });
  } catch (error) {
    console.error('Error fetching network graph:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch network graph' 
    });
  }
});

// ==========================================
// ORCHESTRATOR ENDPOINTS
// ==========================================

/**
 * GET /api/ai-social/orchestrator/status
 * Obtiene estado del orquestador
 */
router.get('/orchestrator/status', async (req: Request, res: Response) => {
  try {
    const stats = getOrchestratorState();

    // Obtener acciones pendientes
    const pendingActions = await db
      .select()
      .from(agentActionQueue)
      .where(eq(agentActionQueue.status, 'pending'))
      .orderBy(desc(agentActionQueue.priority))
      .limit(10);

    // Contar artistas con personalidad (activos)
    const [{ count: activeArtists }] = await db
      .select({ count: count() })
      .from(artistPersonality);

    res.json({
      success: true,
      data: {
        ...stats,
        activeArtists,
        pendingActions: pendingActions.length,
        recentActions: pendingActions,
      },
    });
  } catch (error) {
    console.error('Error fetching orchestrator status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch status' 
    });
  }
});

/**
 * POST /api/ai-social/orchestrator/start
 * Inicia el orquestador
 */
router.post('/orchestrator/start', async (req: Request, res: Response) => {
  try {
    const intervalMs = parseInt(req.body.intervalMs) || 60000; // Default: 1 minuto
    startOrchestrator(intervalMs);

    res.json({
      success: true,
      message: `Orchestrator started with ${intervalMs}ms interval`,
    });
  } catch (error) {
    console.error('Error starting orchestrator:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start orchestrator' 
    });
  }
});

/**
 * POST /api/ai-social/orchestrator/stop
 * Detiene el orquestador
 */
router.post('/orchestrator/stop', async (req: Request, res: Response) => {
  try {
    stopOrchestrator();

    res.json({
      success: true,
      message: 'Orchestrator stopped',
    });
  } catch (error) {
    console.error('Error stopping orchestrator:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to stop orchestrator' 
    });
  }
});

/**
 * POST /api/ai-social/orchestrator/tick
 * Ejecuta un tick manual del orquestador
 */
router.post('/orchestrator/tick', async (req: Request, res: Response) => {
  try {
    await processSocialTick();

    res.json({
      success: true,
      message: 'Social tick processed',
    });
  } catch (error) {
    console.error('Error processing tick:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to process tick' 
    });
  }
});

/**
 * POST /api/ai-social/orchestrator/queue-action
 * Añade una acción a la cola
 */
router.post('/orchestrator/queue-action', async (req: Request, res: Response) => {
  try {
    const { artistId, actionType, priority, payload, scheduledFor } = req.body;

    if (!artistId || !actionType) {
      return res.status(400).json({ 
        success: false, 
        error: 'artistId and actionType are required' 
      });
    }

    await queueAction(
      parseInt(artistId),
      actionType,
      priority || 5,
      payload || {},
      scheduledFor ? new Date(scheduledFor) : undefined
    );

    res.json({
      success: true,
      message: 'Action queued',
    });
  } catch (error) {
    console.error('Error queuing action:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to queue action' 
    });
  }
});

// ==========================================
// WORLD EVENTS ENDPOINTS
// ==========================================

/**
 * GET /api/ai-social/world-events
 * Obtiene eventos mundiales activos
 */
router.get('/world-events', async (req: Request, res: Response) => {
  try {
    const now = new Date();
    
    const events = await db
      .select()
      .from(worldEvents)
      .where(eq(worldEvents.isActive, true))
      .orderBy(desc(worldEvents.startTime));

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error('Error fetching world events:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch world events' 
    });
  }
});

/**
 * POST /api/ai-social/world-events
 * Crea un nuevo evento mundial
 */
router.post('/world-events', async (req: Request, res: Response) => {
  try {
    const { 
      eventType, 
      name, 
      description, 
      impact, 
      affectedGenres,
      startTime,
      endTime,
      metadata 
    } = req.body;

    const [event] = await db.insert(worldEvents).values({
      eventType,
      name,
      description,
      impact: impact || 0.5,
      affectedGenres: affectedGenres || [],
      startTime: startTime ? new Date(startTime) : new Date(),
      endTime: endTime ? new Date(endTime) : null,
      metadata: metadata || {},
      isActive: true,
      createdAt: new Date(),
    }).returning();

    // Emitir evento
    agentEventBus.emit(AgentEventType.WORLD_EVENT_STARTED, {
      type: AgentEventType.WORLD_EVENT_STARTED,
      payload: { event },
      timestamp: new Date(),
    });

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error('Error creating world event:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create world event' 
    });
  }
});

// ==========================================
// ANALYTICS ENDPOINTS
// ==========================================

/**
 * GET /api/ai-social/analytics
 * Obtiene analíticas del sistema de agentes
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    // Contar posts por tipo
    const postsByType = await db
      .select({
        contentType: aiSocialPosts.contentType,
        count: count(),
      })
      .from(aiSocialPosts)
      .groupBy(aiSocialPosts.contentType);

    // Posts en las últimas 24h
    const recentPostsCount = await db
      .select({ count: count() })
      .from(aiSocialPosts)
      .where(gt(aiSocialPosts.createdAt, new Date(Date.now() - 24 * 60 * 60 * 1000)));

    // Comentarios totales
    const totalComments = await db
      .select({ count: count() })
      .from(aiPostComments);

    // Relaciones formadas
    const totalRelationships = await db
      .select({ count: count() })
      .from(artistRelationships);

    // Artistas más activos (por posts)
    const topPosters = await db
      .select({
        artistId: aiSocialPosts.artistId,
        artist: users.artistName,
        imageUrl: users.profileImage,
        postCount: count(),
      })
      .from(aiSocialPosts)
      .innerJoin(users, eq(aiSocialPosts.artistId, users.id))
      .groupBy(aiSocialPosts.artistId, users.artistName, users.profileImage)
      .orderBy(desc(sql`count(*)`))
      .limit(5);

    // Moods actuales
    const moodDistribution = await db
      .select({
        mood: artistPersonality.currentMood,
        count: count(),
      })
      .from(artistPersonality)
      .groupBy(artistPersonality.currentMood);

    res.json({
      success: true,
      data: {
        postsByType,
        recentPostsCount: recentPostsCount[0]?.count || 0,
        totalComments: totalComments[0]?.count || 0,
        totalRelationships: totalRelationships[0]?.count || 0,
        topPosters,
        moodDistribution,
      },
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch analytics' 
    });
  }
});

export default router;
