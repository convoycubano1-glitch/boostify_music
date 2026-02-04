/**
 * AI Agents System - Índice Central
 * 
 * "La primera red social IA-nativa de música"
 * 
 * Exporta todos los componentes del sistema de agentes autónomos
 */

// Core Systems
export { agentEventBus, emitAgentEvent, AgentEventType } from './events';
export { 
  initializeOrchestrator, 
  startOrchestrator, 
  stopOrchestrator, 
  orchestratorTick,
  getOrchestratorStats,
  queueAction 
} from './orchestrator';

// Agent Modules
export { 
  generatePersonality, 
  getPersonality, 
  updateArtistMood,
  getMoodContentSuggestions,
  wouldArtistDoThis 
} from './personality-agent';

export { 
  createMemory, 
  getMemories, 
  getRecentMemories,
  getMemorySummary,
  getDecisionContext,
  applyMemoryDecay,
  runMemoryConsolidation,
  strengthenMemory,
  createInteractionMemory
} from './memory-agent';

export { 
  generatePost, 
  generateComment,
  getAISocialFeed,
  getArtistPosts,
  shouldLikePost,
  processLike,
  shouldFollowArtist,
  processFollow,
  processSocialTick
} from './social-agent';

// Types
export * from './types';

console.log('🚀 AI Agents System loaded - The autonomous artist network is ready');
