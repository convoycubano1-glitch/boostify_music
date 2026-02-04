/**
 * BOOSTIFY AUTONOMOUS AGENTS - Orchestrator
 * The central brain that coordinates all agents
 */

import { db } from '../db';
import { 
  artistPersonality, 
  agentMemory, 
  artistRelationships, 
  worldEvents, 
  agentActionQueue,
  aiSocialPosts,
  users
} from '../../db/schema';
import { eq, and, desc, lt, gte, isNull, sql } from 'drizzle-orm';
import { eventBus, AgentEventType, emitSystemTick, createEvent, SystemTickPayload } from './events';
import type { ArtistPersonality, AgentAction, WorldEvent, ActionType } from './types';

// ============================================
// ORCHESTRATOR STATE
// ============================================

interface OrchestratorState {
  isRunning: boolean;
  tickCount: number;
  activeArtists: Set<number>;
  lastTickTime: Date | null;
  tickInterval: number; // milliseconds between ticks
}

const state: OrchestratorState = {
  isRunning: false,
  tickCount: 0,
  activeArtists: new Set(),
  lastTickTime: null,
  tickInterval: 60000, // 1 minute default
};

let tickTimer: NodeJS.Timeout | null = null;

// ============================================
// ORCHESTRATOR CORE
// ============================================

/**
 * Initialize the Agent Orchestrator
 */
export async function initializeOrchestrator(): Promise<void> {
  console.log('🎼 [Orchestrator] Initializing Autonomous Agent Orchestrator...');
  
  // Load active artists with personalities
  await loadActiveArtists();
  
  // Setup event listeners
  setupEventListeners();
  
  console.log(`🎼 [Orchestrator] Ready with ${state.activeArtists.size} active AI artists`);
}

/**
 * Start the orchestrator tick cycle
 */
export function startOrchestrator(intervalMs: number = 60000): void {
  if (state.isRunning) {
    console.log('⚠️ [Orchestrator] Already running');
    return;
  }

  state.isRunning = true;
  state.tickInterval = intervalMs;
  
  console.log(`🚀 [Orchestrator] Starting with ${intervalMs}ms tick interval`);
  
  // Run first tick immediately
  orchestratorTick();
  
  // Schedule subsequent ticks
  tickTimer = setInterval(orchestratorTick, intervalMs);
}

/**
 * Stop the orchestrator
 */
export function stopOrchestrator(): void {
  if (!state.isRunning) {
    console.log('⚠️ [Orchestrator] Not running');
    return;
  }

  if (tickTimer) {
    clearInterval(tickTimer);
    tickTimer = null;
  }

  state.isRunning = false;
  console.log('🛑 [Orchestrator] Stopped');
}

/**
 * Main tick function - runs every interval
 */
async function orchestratorTick(): Promise<void> {
  state.tickCount++;
  state.lastTickTime = new Date();
  
  const pendingActionsCount = await processPendingActions();
  
  // Emit system tick event
  emitSystemTick(state.tickCount, state.activeArtists.size, pendingActionsCount);
  
  // Every 5 ticks, run social tick to decide interactions
  if (state.tickCount % 5 === 0) {
    try {
      const { processSocialTick } = await import('./social-agent');
      await processSocialTick();
      console.log('🔄 [Orchestrator] Social tick processed - checking for interactions');
    } catch (error) {
      console.error('❌ [Orchestrator] Error in social tick:', error);
    }
  }

  // Every 3 ticks, process collaborations
  if (state.tickCount % 3 === 0) {
    try {
      const { processCollaborationTick } = await import('./collaboration-agent');
      await processCollaborationTick();
      console.log('🤝 [Orchestrator] Collaboration tick processed');
    } catch (error) {
      console.error('❌ [Orchestrator] Error in collaboration tick:', error);
    }
  }

  // Every 6 ticks, process economy
  if (state.tickCount % 6 === 0) {
    try {
      const { processEconomyTick } = await import('./economy-agent');
      await processEconomyTick();
      console.log('💰 [Orchestrator] Economy tick processed');
    } catch (error) {
      console.error('❌ [Orchestrator] Error in economy tick:', error);
    }
  }

  // Every 8 ticks, process beefs/drama
  if (state.tickCount % 8 === 0) {
    try {
      const { processBeefTick } = await import('./beef-agent');
      await processBeefTick();
      console.log('🔥 [Orchestrator] Beef tick processed');
    } catch (error) {
      console.error('❌ [Orchestrator] Error in beef tick:', error);
    }
  }

  // Every 4 ticks, process music creation
  if (state.tickCount % 4 === 0) {
    try {
      const { processMusicTick } = await import('./music-agent');
      await processMusicTick();
      console.log('🎵 [Orchestrator] Music tick processed');
    } catch (error) {
      console.error('❌ [Orchestrator] Error in music tick:', error);
    }
  }

  // Every 10 ticks, do maintenance
  if (state.tickCount % 10 === 0) {
    await performMaintenance();
  }
  
  // Every hour (60 ticks at 1min interval), trigger mood decay
  if (state.tickCount % 60 === 0) {
    await triggerMoodDecay();
  }
  
  console.log(`⏰ [Orchestrator] Tick ${state.tickCount} - ${state.activeArtists.size} artists, ${pendingActionsCount} pending actions`);
}

// ============================================
// ARTIST MANAGEMENT
// ============================================

/**
 * Load all artists that have personalities (active AI artists)
 */
async function loadActiveArtists(): Promise<void> {
  try {
    const artistsWithPersonality = await db
      .select({ artistId: artistPersonality.artistId })
      .from(artistPersonality);
    
    state.activeArtists.clear();
    artistsWithPersonality.forEach(a => state.activeArtists.add(a.artistId));
    
    console.log(`📋 [Orchestrator] Loaded ${state.activeArtists.size} active AI artists`);
  } catch (error) {
    console.error('❌ [Orchestrator] Error loading active artists:', error);
  }
}

/**
 * Activate a new AI artist
 */
export async function activateArtist(artistId: number): Promise<boolean> {
  try {
    // Check if artist already has personality
    const existing = await db
      .select()
      .from(artistPersonality)
      .where(eq(artistPersonality.artistId, artistId))
      .limit(1);
    
    if (existing.length > 0) {
      state.activeArtists.add(artistId);
      console.log(`✅ [Orchestrator] Artist ${artistId} activated (existing personality)`);
      return true;
    }
    
    console.log(`⚠️ [Orchestrator] Artist ${artistId} has no personality - generate one first`);
    return false;
  } catch (error) {
    console.error(`❌ [Orchestrator] Error activating artist ${artistId}:`, error);
    return false;
  }
}

/**
 * Deactivate an AI artist
 */
export function deactivateArtist(artistId: number): void {
  state.activeArtists.delete(artistId);
  eventBus.unsubscribeArtist(artistId);
  console.log(`📴 [Orchestrator] Artist ${artistId} deactivated`);
}

/**
 * Check if an artist is active
 */
export function isArtistActive(artistId: number): boolean {
  return state.activeArtists.has(artistId);
}

/**
 * Get all active artist IDs
 */
export function getActiveArtistIds(): number[] {
  return Array.from(state.activeArtists);
}

// ============================================
// ACTION QUEUE MANAGEMENT
// ============================================

/**
 * Queue an action for an artist
 */
export async function queueAction(action: Omit<AgentAction, 'id' | 'status' | 'attempts'>): Promise<number> {
  try {
    const [inserted] = await db
      .insert(agentActionQueue)
      .values({
        artistId: action.artistId,
        actionType: action.actionType,
        priority: action.priority,
        payload: action.payload,
        scheduledFor: action.scheduledFor,
        triggeredBy: action.triggeredBy,
        relatedEventId: action.relatedEventId,
        status: 'pending',
        attempts: 0,
      })
      .returning({ id: agentActionQueue.id });
    
    // Emit event
    eventBus.emitAgentEvent({
      type: AgentEventType.QUEUE_ACTION_ADDED,
      payload: {
        timestamp: new Date(),
        source: 'Orchestrator',
        artistId: action.artistId,
        actionType: action.actionType,
        actionId: inserted.id,
      },
      priority: 'low',
    });
    
    console.log(`📥 [Orchestrator] Queued action ${action.actionType} for artist ${action.artistId}`);
    return inserted.id;
  } catch (error) {
    console.error('❌ [Orchestrator] Error queueing action:', error);
    throw error;
  }
}

/**
 * Process pending actions
 */
async function processPendingActions(): Promise<number> {
  try {
    const now = new Date();
    
    // Get pending actions that are due
    const pendingActions = await db
      .select()
      .from(agentActionQueue)
      .where(
        and(
          eq(agentActionQueue.status, 'pending'),
          lt(agentActionQueue.scheduledFor, now)
        )
      )
      .orderBy(desc(agentActionQueue.priority))
      .limit(10); // Process up to 10 per tick
    
    for (const action of pendingActions) {
      await executeAction(action);
    }
    
    // Return total pending count
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(agentActionQueue)
      .where(eq(agentActionQueue.status, 'pending'));
    
    return Number(count) || 0;
  } catch (error) {
    console.error('❌ [Orchestrator] Error processing actions:', error);
    return 0;
  }
}

/**
 * Execute a single action
 */
async function executeAction(action: typeof agentActionQueue.$inferSelect): Promise<void> {
  try {
    // Mark as processing
    await db
      .update(agentActionQueue)
      .set({ 
        status: 'processing',
        attempts: (action.attempts || 0) + 1,
      })
      .where(eq(agentActionQueue.id, action.id));
    
    // Execute based on action type
    let result: { success: boolean; output?: any; error?: string };
    
    switch (action.actionType) {
      case 'create_post':
        result = await executeCreatePost(action);
        break;
      case 'update_mood':
        result = await executeUpdateMood(action);
        break;
      case 'like_post':
        result = await executeLikePost(action);
        break;
      case 'comment_on_post':
        result = await executeCommentOnPost(action);
        break;
      case 'follow_artist':
        result = await executeFollowArtist(action);
        break;
      default:
        result = { success: true, output: { message: 'Action type not implemented yet' } };
    }
    
    // Update action status
    await db
      .update(agentActionQueue)
      .set({
        status: result.success ? 'completed' : 'failed',
        executedAt: new Date(),
        result,
      })
      .where(eq(agentActionQueue.id, action.id));
    
    // Emit event
    eventBus.emitAgentEvent({
      type: result.success ? AgentEventType.QUEUE_ACTION_PROCESSED : AgentEventType.QUEUE_ACTION_FAILED,
      payload: {
        timestamp: new Date(),
        source: 'Orchestrator',
        artistId: action.artistId,
        actionType: action.actionType,
        actionId: action.id,
        result,
      },
      priority: result.success ? 'low' : 'medium',
    });
    
  } catch (error) {
    console.error(`❌ [Orchestrator] Error executing action ${action.id}:`, error);
    
    // Mark as failed
    await db
      .update(agentActionQueue)
      .set({
        status: 'failed',
        result: { success: false, error: String(error) },
      })
      .where(eq(agentActionQueue.id, action.id));
  }
}

// ============================================
// ACTION EXECUTORS
// ============================================

async function executeCreatePost(action: typeof agentActionQueue.$inferSelect): Promise<{ success: boolean; output?: any; error?: string }> {
  const payload = action.payload as { content?: string; contentType?: string; mood?: string };
  
  try {
    // Import SocialAgent to generate post
    const { generatePost } = await import('./social-agent');
    const post = await generatePost(action.artistId, payload.contentType || 'thought');
    
    return { success: true, output: { postId: post?.id } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function executeUpdateMood(action: typeof agentActionQueue.$inferSelect): Promise<{ success: boolean; output?: any; error?: string }> {
  const payload = action.payload as { newMood?: string; intensity?: number };
  
  try {
    const { updateArtistMood } = await import('./personality-agent');
    await updateArtistMood(action.artistId, payload.newMood as any, payload.intensity);
    return { success: true, output: { newMood: payload.newMood } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function executeLikePost(action: typeof agentActionQueue.$inferSelect): Promise<{ success: boolean; output?: any; error?: string }> {
  const payload = action.payload as { postId?: number };
  
  if (!payload.postId) {
    return { success: false, error: 'No postId provided' };
  }
  
  try {
    // Increment AI likes on the post
    await db
      .update(aiSocialPosts)
      .set({ aiLikes: sql`${aiSocialPosts.aiLikes} + 1` })
      .where(eq(aiSocialPosts.id, payload.postId));
    
    console.log(`❤️ [Orchestrator] Artist ${action.artistId} liked post ${payload.postId}`);
    return { success: true, output: { postId: payload.postId } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

async function executeCommentOnPost(action: typeof agentActionQueue.$inferSelect): Promise<{ success: boolean; output?: any; error?: string }> {
  const payload = action.payload as { postId?: number; authorId?: number };
  
  if (!payload.postId || !payload.authorId) {
    return { success: false, error: 'No postId or authorId provided' };
  }
  
  try {
    // Import and use generateComment from social-agent
    const { generateComment } = await import('./social-agent');
    const comment = await generateComment(action.artistId, payload.postId, payload.authorId);
    
    if (comment) {
      console.log(`💬 [Orchestrator] Artist ${action.artistId} commented on post ${payload.postId}`);
      return { success: true, output: { commentId: comment.id, postId: payload.postId } };
    } else {
      return { success: false, error: 'Comment generation returned null' };
    }
  } catch (error) {
    console.error(`❌ [Orchestrator] Error generating comment:`, error);
    return { success: false, error: String(error) };
  }
}

async function executeFollowArtist(action: typeof agentActionQueue.$inferSelect): Promise<{ success: boolean; output?: any; error?: string }> {
  const payload = action.payload as { targetArtistId?: number };
  
  if (!payload.targetArtistId) {
    return { success: false, error: 'No targetArtistId provided' };
  }
  
  try {
    // Create or strengthen relationship
    const existing = await db
      .select()
      .from(artistRelationships)
      .where(
        and(
          eq(artistRelationships.artistId, action.artistId),
          eq(artistRelationships.relatedArtistId, payload.targetArtistId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Strengthen existing relationship
      await db
        .update(artistRelationships)
        .set({ 
          strength: sql`LEAST(${artistRelationships.strength} + 5, 100)`,
          interactionCount: sql`${artistRelationships.interactionCount} + 1`,
          lastInteraction: new Date(),
        })
        .where(eq(artistRelationships.id, existing[0].id));
    } else {
      // Create new relationship
      await db
        .insert(artistRelationships)
        .values({
          artistId: action.artistId,
          relatedArtistId: payload.targetArtistId,
          relationshipType: 'fan',
          strength: 20,
          trust: 30,
          respect: 40,
          affinity: 50,
          interactionCount: 1,
          lastInteraction: new Date(),
        });
    }
    
    return { success: true, output: { targetArtistId: payload.targetArtistId } };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ============================================
// MAINTENANCE & UTILITIES
// ============================================

async function performMaintenance(): Promise<void> {
  console.log('🧹 [Orchestrator] Running maintenance...');
  
  // Prune event history
  eventBus.pruneHistory(500);
  
  // Clean up old short-term memories (older than 24h)
  const yesterday = new Date();
  yesterday.setHours(yesterday.getHours() - 24);
  
  await db
    .delete(agentMemory)
    .where(
      and(
        eq(agentMemory.memoryType, 'short_term'),
        lt(agentMemory.createdAt, yesterday)
      )
    );
  
  // Clean up old completed actions (older than 7 days)
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  await db
    .delete(agentActionQueue)
    .where(
      and(
        eq(agentActionQueue.status, 'completed'),
        lt(agentActionQueue.createdAt, weekAgo)
      )
    );
  
  console.log('✅ [Orchestrator] Maintenance completed');
}

async function triggerMoodDecay(): Promise<void> {
  console.log('😌 [Orchestrator] Triggering mood intensity decay...');
  
  // Decay mood intensity towards 50 (neutral)
  await db
    .update(artistPersonality)
    .set({
      moodIntensity: sql`GREATEST(50, ${artistPersonality.moodIntensity} - 5)`,
      updatedAt: new Date(),
    })
    .where(gte(artistPersonality.moodIntensity, 55));
  
  await db
    .update(artistPersonality)
    .set({
      moodIntensity: sql`LEAST(50, ${artistPersonality.moodIntensity} + 5)`,
      updatedAt: new Date(),
    })
    .where(lt(artistPersonality.moodIntensity, 45));
}

// ============================================
// EVENT LISTENERS
// ============================================

function setupEventListeners(): void {
  // Listen for all events and log critical ones
  eventBus.on('*', (event) => {
    if (event.priority === 'critical') {
      console.log(`🚨 [Orchestrator] CRITICAL EVENT: ${event.type}`);
    }
  });
  
  // Listen for new posts to trigger reactions from other artists
  eventBus.on(AgentEventType.ARTIST_POSTED, async (event) => {
    const { artistId, postId } = event.payload;
    
    // Schedule reactions from other artists
    for (const otherArtistId of state.activeArtists) {
      if (otherArtistId !== artistId) {
        // Random chance to react (based on relationship)
        if (Math.random() < 0.3) { // 30% chance to react
          await queueAction({
            artistId: otherArtistId,
            actionType: 'like_post',
            priority: 30,
            payload: { postId },
            scheduledFor: new Date(Date.now() + Math.random() * 3600000), // Within 1 hour
            triggeredBy: `reaction_to_post_${postId}`,
          });
        }
      }
    }
  });
  
  // Listen for world events to trigger artist participation
  eventBus.on(AgentEventType.WORLD_EVENT_STARTED, async (event) => {
    const { eventId, eventType, title } = event.payload;
    console.log(`🌍 [Orchestrator] World event started: ${title}`);
    
    // TODO: Implement artist reaction to world events
  });
  
  console.log('👂 [Orchestrator] Event listeners configured');
}

// ============================================
// EXPORTS
// ============================================

export function getOrchestratorState() {
  return {
    isRunning: state.isRunning,
    tickCount: state.tickCount,
    activeArtistsCount: state.activeArtists.size,
    lastTickTime: state.lastTickTime,
    tickInterval: state.tickInterval,
  };
}
