// API Routes for AI Agents System
import { Router, Request, Response } from 'express';
import { db } from '../db';
import { 
  agentSessions, 
  agentSavedResults, 
  agentUsageStats,
  users,
  insertAgentSessionSchema,
  insertAgentSavedResultSchema
} from '../../db/schema';
import { eq, desc, and, sql, count } from 'drizzle-orm';
import { authenticate } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

// Middleware to ensure user is authenticated
router.use(authenticate);

// ============================================
// AGENT SESSIONS
// ============================================

/**
 * Create a new agent session
 */
router.post('/session', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { agentType, artistId, sessionName, inputParams } = req.body;

    const [session] = await db.insert(agentSessions).values({
      userId,
      artistId: artistId || null,
      agentType,
      sessionName,
      inputParams,
      status: 'pending',
    }).returning();

    res.json(session);
  } catch (error) {
    console.error('Error creating agent session:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

/**
 * Update session with output
 */
router.patch('/session/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const sessionId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { outputContent, outputMetadata, status, tokensUsed, costUsd } = req.body;

    const [session] = await db.update(agentSessions)
      .set({
        outputContent,
        outputMetadata,
        status,
        tokensUsed,
        costUsd,
        updatedAt: new Date(),
        completedAt: status === 'completed' ? new Date() : undefined,
      })
      .where(and(
        eq(agentSessions.id, sessionId),
        eq(agentSessions.userId, userId)
      ))
      .returning();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Update usage stats
    await updateUsageStats(userId, session.agentType, tokensUsed || 0);

    res.json(session);
  } catch (error) {
    console.error('Error updating agent session:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

/**
 * Get session history for a user
 */
router.get('/sessions', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { agentType, artistId, limit = 20, offset = 0 } = req.query;

    let query = db.select()
      .from(agentSessions)
      .where(eq(agentSessions.userId, userId))
      .orderBy(desc(agentSessions.createdAt))
      .limit(Number(limit))
      .offset(Number(offset));

    const sessions = await query;
    res.json(sessions);
  } catch (error) {
    console.error('Error fetching sessions:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

/**
 * Get sessions for a specific artist
 */
router.get('/history/:artistId', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const artistId = parseInt(req.params.artistId);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const sessions = await db.select()
      .from(agentSessions)
      .where(and(
        eq(agentSessions.userId, userId),
        eq(agentSessions.artistId, artistId)
      ))
      .orderBy(desc(agentSessions.createdAt))
      .limit(50);

    res.json(sessions);
  } catch (error) {
    console.error('Error fetching artist history:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

// ============================================
// SAVED RESULTS
// ============================================

/**
 * Save a result from an agent
 */
router.post('/save', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { 
      artistId, 
      sessionId, 
      agentType, 
      title, 
      content, 
      contentType, 
      metadata, 
      attachedFiles,
      tags 
    } = req.body;

    const [result] = await db.insert(agentSavedResults).values({
      userId,
      artistId: artistId || null,
      sessionId: sessionId || null,
      agentType,
      title,
      content,
      contentType,
      metadata,
      attachedFiles,
      tags,
    }).returning();

    res.json(result);
  } catch (error) {
    console.error('Error saving result:', error);
    res.status(500).json({ error: 'Failed to save result' });
  }
});

/**
 * Get saved results
 */
router.get('/saved', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { agentType, artistId, favorites, limit = 50 } = req.query;

    const conditions = [eq(agentSavedResults.userId, userId)];
    
    if (agentType) {
      conditions.push(eq(agentSavedResults.agentType, agentType as string));
    }
    if (artistId) {
      conditions.push(eq(agentSavedResults.artistId, Number(artistId)));
    }
    if (favorites === 'true') {
      conditions.push(eq(agentSavedResults.isFavorite, true));
    }

    const results = await db.select()
      .from(agentSavedResults)
      .where(and(...conditions))
      .orderBy(desc(agentSavedResults.createdAt))
      .limit(Number(limit));

    res.json(results);
  } catch (error) {
    console.error('Error fetching saved results:', error);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

/**
 * Toggle favorite status
 */
router.patch('/saved/:id/favorite', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const resultId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get current state
    const [current] = await db.select()
      .from(agentSavedResults)
      .where(and(
        eq(agentSavedResults.id, resultId),
        eq(agentSavedResults.userId, userId)
      ));

    if (!current) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Toggle
    const [updated] = await db.update(agentSavedResults)
      .set({ 
        isFavorite: !current.isFavorite,
        updatedAt: new Date()
      })
      .where(eq(agentSavedResults.id, resultId))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Error toggling favorite:', error);
    res.status(500).json({ error: 'Failed to update' });
  }
});

/**
 * Delete a saved result
 */
router.delete('/saved/:id', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const resultId = parseInt(req.params.id);
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    await db.delete(agentSavedResults)
      .where(and(
        eq(agentSavedResults.id, resultId),
        eq(agentSavedResults.userId, userId)
      ));

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting result:', error);
    res.status(500).json({ error: 'Failed to delete' });
  }
});

// ============================================
// ANALYTICS
// ============================================

/**
 * Get usage analytics for the user
 */
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get stats per agent type
    const stats = await db.select({
      agentType: agentSessions.agentType,
      totalSessions: count(agentSessions.id),
      totalTokens: sql<number>`COALESCE(SUM(${agentSessions.tokensUsed}), 0)`,
    })
    .from(agentSessions)
    .where(eq(agentSessions.userId, userId))
    .groupBy(agentSessions.agentType);

    // Get recent activity
    const recentSessions = await db.select({
      agentType: agentSessions.agentType,
      createdAt: agentSessions.createdAt,
      status: agentSessions.status,
    })
    .from(agentSessions)
    .where(eq(agentSessions.userId, userId))
    .orderBy(desc(agentSessions.createdAt))
    .limit(10);

    // Get saved results count
    const savedCounts = await db.select({
      agentType: agentSavedResults.agentType,
      count: count(agentSavedResults.id),
    })
    .from(agentSavedResults)
    .where(eq(agentSavedResults.userId, userId))
    .groupBy(agentSavedResults.agentType);

    res.json({
      stats,
      recentSessions,
      savedCounts,
      summary: {
        totalSessions: stats.reduce((acc, s) => acc + Number(s.totalSessions), 0),
        totalTokens: stats.reduce((acc, s) => acc + Number(s.totalTokens), 0),
        totalSaved: savedCounts.reduce((acc, s) => acc + Number(s.count), 0),
        mostUsedAgent: stats.sort((a, b) => Number(b.totalSessions) - Number(a.totalSessions))[0]?.agentType || null,
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Helper function to update usage stats
async function updateUsageStats(userId: number, agentType: string, tokensUsed: number) {
  try {
    // Upsert usage stats
    await db.execute(sql`
      INSERT INTO agent_usage_stats (user_id, agent_type, total_sessions, total_tokens_used, last_used_at, created_at, updated_at)
      VALUES (${userId}, ${agentType}, 1, ${tokensUsed}, NOW(), NOW(), NOW())
      ON CONFLICT (user_id, agent_type) 
      DO UPDATE SET 
        total_sessions = agent_usage_stats.total_sessions + 1,
        total_tokens_used = agent_usage_stats.total_tokens_used + ${tokensUsed},
        last_used_at = NOW(),
        updated_at = NOW()
    `);
  } catch (error) {
    console.error('Error updating usage stats:', error);
  }
}

export default router;
