/**
 * MemoryAgent - Sistema de Memoria para Artistas IA
 * 
 * "Los artistas recuerdan lo que importa y olvidan lo trivial"
 * 
 * Este agente gestiona la memoria de cada artista IA:
 * - Memoria a corto plazo (últimas horas)
 * - Memoria a largo plazo (consolidada)
 * - Memoria episódica (eventos importantes)
 * - Decay natural de memorias menos importantes
 */

import { db } from '../db';
import { agentMemory, artistRelationships, artistPersonality } from '../../db/schema';
import { eq, and, desc, lt, gt, sql } from 'drizzle-orm';
import { agentEventBus, emitAgentEvent, AgentEventType } from './events';
import type { 
  MemoryType, 
  MemoryImportance,
  ArtistMemory,
  EmotionalContext
} from './types';

// ==========================================
// MEMORY CREATION
// ==========================================

interface CreateMemoryInput {
  artistId: number;
  type: MemoryType;
  content: string;
  emotionalContext?: EmotionalContext;
  importance: MemoryImportance;
  relatedArtistId?: number;
  relatedEventId?: string;
  tags?: string[];
}

/**
 * Crea una nueva memoria para un artista
 */
export async function createMemory(input: CreateMemoryInput): Promise<ArtistMemory> {
  const importanceScore = getImportanceScore(input.importance);
  
  const [memory] = await db.insert(agentMemory).values({
    artistId: input.artistId,
    memoryType: input.type,
    content: input.content,
    emotionalContext: input.emotionalContext || { valence: 0.5, arousal: 0.5, dominance: 0.5 },
    importanceScore,
    decayRate: getDecayRate(input.type, importanceScore),
    relatedArtistId: input.relatedArtistId,
    relatedEventId: input.relatedEventId,
    tags: input.tags || [],
    isConsolidated: input.type === 'long_term' || input.type === 'episodic',
    createdAt: new Date(),
  }).returning();

  // Emitir evento de nueva memoria
  emitAgentEvent({
    type: AgentEventType.MEMORY_CREATED,
    artistId: input.artistId,
    payload: {
      memoryId: memory.id,
      memoryType: input.type,
      importance: input.importance,
    },
    timestamp: new Date(),
  });

  // Verificar si debe consolidarse automáticamente
  if (importanceScore >= 0.8) {
    await consolidateMemory(memory.id);
  }

  return memory as ArtistMemory;
}

/**
 * Convierte importancia textual a numérica
 */
function getImportanceScore(importance: MemoryImportance): number {
  const scores: Record<MemoryImportance, number> = {
    'trivial': 0.1,
    'low': 0.3,
    'medium': 0.5,
    'high': 0.7,
    'critical': 0.9,
    'core_identity': 1.0,
  };
  return scores[importance];
}

/**
 * Calcula la tasa de decay basada en tipo e importancia
 */
function getDecayRate(type: MemoryType, importanceScore: number): number {
  // Memorias más importantes decaen más lento
  const baseDecay: Record<MemoryType, number> = {
    'short_term': 0.1,      // Decae rápido
    'long_term': 0.01,      // Decae muy lento
    'episodic': 0.005,      // Casi no decae
    'semantic': 0.008,      // Conocimiento general
    'emotional': 0.02,      // Emociones decaen moderado
    'procedural': 0.002,    // Skills casi no decaen
  };

  // A mayor importancia, menor decay
  return baseDecay[type] * (1 - importanceScore * 0.5);
}

// ==========================================
// MEMORY RETRIEVAL
// ==========================================

interface MemoryQuery {
  artistId: number;
  type?: MemoryType;
  minImportance?: number;
  relatedArtistId?: number;
  tags?: string[];
  limit?: number;
  includeDecayed?: boolean;
}

/**
 * Recupera memorias de un artista
 */
export async function getMemories(query: MemoryQuery): Promise<ArtistMemory[]> {
  const conditions = [eq(agentMemory.artistId, query.artistId)];

  if (query.type) {
    conditions.push(eq(agentMemory.memoryType, query.type));
  }

  if (query.minImportance !== undefined) {
    conditions.push(gt(agentMemory.importanceScore, query.minImportance));
  }

  if (query.relatedArtistId) {
    conditions.push(eq(agentMemory.relatedArtistId, query.relatedArtistId));
  }

  if (!query.includeDecayed) {
    conditions.push(gt(agentMemory.importanceScore, 0.05)); // Filtrar memorias muy decaídas
  }

  const memories = await db
    .select()
    .from(agentMemory)
    .where(and(...conditions))
    .orderBy(desc(agentMemory.importanceScore), desc(agentMemory.createdAt))
    .limit(query.limit || 50);

  return memories as ArtistMemory[];
}

/**
 * Obtiene memorias recientes (últimas 24 horas)
 */
export async function getRecentMemories(artistId: number, hours: number = 24): Promise<ArtistMemory[]> {
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);

  const memories = await db
    .select()
    .from(agentMemory)
    .where(
      and(
        eq(agentMemory.artistId, artistId),
        gt(agentMemory.createdAt, cutoff)
      )
    )
    .orderBy(desc(agentMemory.createdAt));

  return memories as ArtistMemory[];
}

/**
 * Busca memorias por relevancia semántica (usando tags)
 */
export async function searchMemoriesByContext(
  artistId: number,
  contextTags: string[],
  limit: number = 10
): Promise<ArtistMemory[]> {
  // Buscar memorias que tengan tags similares
  const allMemories = await getMemories({
    artistId,
    minImportance: 0.2,
    limit: 100,
  });

  // Puntuar por relevancia de tags
  const scored = allMemories.map(memory => {
    const memoryTags = memory.tags || [];
    const matchingTags = contextTags.filter(tag => 
      memoryTags.some(mt => mt.toLowerCase().includes(tag.toLowerCase()))
    );
    const score = matchingTags.length / Math.max(contextTags.length, 1);
    return { memory, relevanceScore: score };
  });

  // Ordenar por relevancia y retornar top
  return scored
    .filter(s => s.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
    .map(s => s.memory);
}

/**
 * Obtiene memorias relacionadas con otro artista
 */
export async function getMemoriesAboutArtist(
  artistId: number,
  aboutArtistId: number
): Promise<ArtistMemory[]> {
  return getMemories({
    artistId,
    relatedArtistId: aboutArtistId,
    minImportance: 0.1,
  });
}

// ==========================================
// MEMORY CONSOLIDATION
// ==========================================

/**
 * Consolida una memoria a largo plazo
 */
export async function consolidateMemory(memoryId: number): Promise<void> {
  await db
    .update(agentMemory)
    .set({
      isConsolidated: true,
      memoryType: 'long_term',
      decayRate: 0.005, // Reducir decay rate significativamente
    })
    .where(eq(agentMemory.id, memoryId));

  const memory = await db
    .select()
    .from(agentMemory)
    .where(eq(agentMemory.id, memoryId))
    .limit(1);

  if (memory[0]) {
    emitAgentEvent({
      type: AgentEventType.MEMORY_CONSOLIDATED,
      artistId: memory[0].artistId,
      payload: { memoryId },
      timestamp: new Date(),
    });
  }
}

/**
 * Proceso nocturno de consolidación de memorias importantes
 */
export async function runMemoryConsolidation(artistId: number): Promise<number> {
  // Obtener memorias corto plazo con alta importancia
  const memoriestoConsolidate = await db
    .select()
    .from(agentMemory)
    .where(
      and(
        eq(agentMemory.artistId, artistId),
        eq(agentMemory.memoryType, 'short_term'),
        eq(agentMemory.isConsolidated, false),
        gt(agentMemory.importanceScore, 0.6)
      )
    );

  for (const memory of memoriestoConsolidate) {
    await consolidateMemory(memory.id);
  }

  return memoriestoConsolidate.length;
}

// ==========================================
// MEMORY DECAY
// ==========================================

/**
 * Aplica decay a todas las memorias de un artista
 */
export async function applyMemoryDecay(artistId: number): Promise<void> {
  // Obtener todas las memorias no consolidadas
  const memories = await db
    .select()
    .from(agentMemory)
    .where(
      and(
        eq(agentMemory.artistId, artistId),
        eq(agentMemory.isConsolidated, false)
      )
    );

  for (const memory of memories) {
    const newImportance = Math.max(0, memory.importanceScore - memory.decayRate);
    
    if (newImportance < 0.05) {
      // Memoria demasiado débil, marcar para eliminación
      await db
        .update(agentMemory)
        .set({ importanceScore: 0 })
        .where(eq(agentMemory.id, memory.id));
    } else {
      await db
        .update(agentMemory)
        .set({ importanceScore: newImportance })
        .where(eq(agentMemory.id, memory.id));
    }
  }

  emitAgentEvent({
    type: AgentEventType.MEMORY_DECAY_APPLIED,
    artistId,
    payload: { memoriesProcessed: memories.length },
    timestamp: new Date(),
  });
}

/**
 * Limpia memorias que han decaído completamente
 */
export async function cleanupDecayedMemories(): Promise<number> {
  const result = await db
    .delete(agentMemory)
    .where(lt(agentMemory.importanceScore, 0.01))
    .returning();

  return result.length;
}

// ==========================================
// MEMORY STRENGTHENING
// ==========================================

/**
 * Refuerza una memoria (cuando se recuerda o referencia)
 */
export async function strengthenMemory(memoryId: number, amount: number = 0.1): Promise<void> {
  const [memory] = await db
    .select()
    .from(agentMemory)
    .where(eq(agentMemory.id, memoryId))
    .limit(1);

  if (!memory) return;

  const newImportance = Math.min(1, memory.importanceScore + amount);
  
  await db
    .update(agentMemory)
    .set({
      importanceScore: newImportance,
      accessCount: (memory.accessCount || 0) + 1,
      lastAccessedAt: new Date(),
    })
    .where(eq(agentMemory.id, memoryId));

  // Si ahora es suficientemente importante, consolidar
  if (newImportance >= 0.8 && !memory.isConsolidated) {
    await consolidateMemory(memoryId);
  }
}

// ==========================================
// RELATIONSHIP MEMORIES
// ==========================================

/**
 * Crea una memoria sobre una interacción con otro artista
 */
export async function createInteractionMemory(
  artistId: number,
  otherArtistId: number,
  interactionType: 'collaboration' | 'conflict' | 'inspiration' | 'competition' | 'support',
  description: string,
  outcome: 'positive' | 'negative' | 'neutral'
): Promise<ArtistMemory> {
  const emotionalContext: EmotionalContext = {
    valence: outcome === 'positive' ? 0.8 : outcome === 'negative' ? 0.2 : 0.5,
    arousal: interactionType === 'conflict' || interactionType === 'competition' ? 0.8 : 0.5,
    dominance: outcome === 'positive' ? 0.7 : 0.4,
  };

  const importance: MemoryImportance = 
    interactionType === 'collaboration' ? 'high' :
    interactionType === 'conflict' ? 'high' :
    interactionType === 'inspiration' ? 'medium' :
    'medium';

  return createMemory({
    artistId,
    type: 'episodic',
    content: description,
    emotionalContext,
    importance,
    relatedArtistId: otherArtistId,
    tags: [interactionType, outcome, 'relationship'],
  });
}

/**
 * Actualiza la relación basándose en memorias acumuladas
 */
export async function updateRelationshipFromMemories(
  artistId: number,
  otherArtistId: number
): Promise<void> {
  // Obtener todas las memorias sobre este artista
  const memories = await getMemoriesAboutArtist(artistId, otherArtistId);
  
  if (memories.length === 0) return;

  // Calcular sentimiento promedio
  let totalValence = 0;
  let totalWeight = 0;

  for (const memory of memories) {
    const ctx = memory.emotionalContext as EmotionalContext;
    if (ctx) {
      totalValence += ctx.valence * memory.importanceScore;
      totalWeight += memory.importanceScore;
    }
  }

  const avgSentiment = totalWeight > 0 ? totalValence / totalWeight : 0.5;
  
  // Actualizar o crear relación
  const [existingRelation] = await db
    .select()
    .from(artistRelationships)
    .where(
      and(
        eq(artistRelationships.artistId, artistId),
        eq(artistRelationships.relatedArtistId, otherArtistId)
      )
    )
    .limit(1);

  if (existingRelation) {
    // Blend con sentimiento existente
    const newSentiment = existingRelation.sentiment * 0.7 + avgSentiment * 0.3;
    
    await db
      .update(artistRelationships)
      .set({
        sentiment: newSentiment,
        interactionCount: existingRelation.interactionCount + 1,
        lastInteraction: new Date(),
      })
      .where(eq(artistRelationships.id, existingRelation.id));
  } else {
    // Crear nueva relación
    await db.insert(artistRelationships).values({
      artistId,
      relatedArtistId: otherArtistId,
      relationshipType: avgSentiment > 0.6 ? 'acquaintance' : 'neutral',
      strength: 0.3,
      sentiment: avgSentiment,
      interactionCount: 1,
      lastInteraction: new Date(),
    });
  }
}

// ==========================================
// MEMORY SUMMARY & CONTEXT
// ==========================================

/**
 * Genera un resumen de las memorias más importantes de un artista
 * Útil para dar contexto a otros agentes
 */
export async function getMemorySummary(artistId: number): Promise<{
  recentHighlights: string[];
  coreMemories: string[];
  activeRelationships: Array<{ artistId: number; sentiment: number; type: string }>;
  emotionalTrend: 'positive' | 'negative' | 'neutral';
}> {
  // Memorias recientes importantes
  const recentMemories = await getRecentMemories(artistId, 48);
  const importantRecent = recentMemories
    .filter(m => m.importanceScore > 0.5)
    .slice(0, 5)
    .map(m => m.content);

  // Memorias consolidadas (core memories)
  const coreMemories = await db
    .select()
    .from(agentMemory)
    .where(
      and(
        eq(agentMemory.artistId, artistId),
        eq(agentMemory.isConsolidated, true)
      )
    )
    .orderBy(desc(agentMemory.importanceScore))
    .limit(5);

  // Relaciones activas
  const relationships = await db
    .select()
    .from(artistRelationships)
    .where(eq(artistRelationships.artistId, artistId))
    .orderBy(desc(artistRelationships.strength))
    .limit(5);

  // Calcular tendencia emocional
  let totalValence = 0;
  for (const memory of recentMemories.slice(0, 10)) {
    const ctx = memory.emotionalContext as EmotionalContext;
    if (ctx) {
      totalValence += ctx.valence;
    }
  }
  const avgValence = recentMemories.length > 0 ? totalValence / Math.min(10, recentMemories.length) : 0.5;

  return {
    recentHighlights: importantRecent,
    coreMemories: coreMemories.map(m => m.content),
    activeRelationships: relationships.map(r => ({
      artistId: r.relatedArtistId,
      sentiment: r.sentiment,
      type: r.relationshipType,
    })),
    emotionalTrend: avgValence > 0.6 ? 'positive' : avgValence < 0.4 ? 'negative' : 'neutral',
  };
}

/**
 * Obtiene contexto de memoria para toma de decisiones
 */
export async function getDecisionContext(
  artistId: number,
  contextTags: string[]
): Promise<{
  relevantMemories: ArtistMemory[];
  recentMood: string;
  relationshipContext: Map<number, { type: string; sentiment: number }>;
}> {
  // Memorias relevantes al contexto
  const relevantMemories = await searchMemoriesByContext(artistId, contextTags, 5);

  // Estado emocional reciente
  const [personality] = await db
    .select()
    .from(artistPersonality)
    .where(eq(artistPersonality.artistId, artistId))
    .limit(1);

  // Mapa de relaciones
  const relationships = await db
    .select()
    .from(artistRelationships)
    .where(eq(artistRelationships.artistId, artistId));

  const relationshipContext = new Map<number, { type: string; sentiment: number }>();
  for (const rel of relationships) {
    relationshipContext.set(rel.relatedArtistId, {
      type: rel.relationshipType,
      sentiment: rel.sentiment,
    });
  }

  return {
    relevantMemories,
    recentMood: personality?.currentMood || 'neutral',
    relationshipContext,
  };
}

// ==========================================
// EVENT LISTENERS
// ==========================================

// Escuchar eventos para crear memorias automáticamente
agentEventBus.on(AgentEventType.ARTIST_POSTED, async (event) => {
  await createMemory({
    artistId: event.artistId,
    type: 'episodic',
    content: `Created a ${event.payload.contentType} post: "${event.payload.preview}"`,
    importance: 'medium',
    tags: ['social', 'post', event.payload.contentType],
  });
});

agentEventBus.on(AgentEventType.ARTIST_RECEIVED_COMMENT, async (event) => {
  await createMemory({
    artistId: event.artistId,
    type: 'short_term',
    content: `Received comment from artist ${event.payload.fromArtistId}`,
    importance: 'low',
    relatedArtistId: event.payload.fromArtistId,
    tags: ['social', 'comment', 'interaction'],
  });
});

agentEventBus.on(AgentEventType.ARTIST_SONG_COMPLETED, async (event) => {
  await createMemory({
    artistId: event.artistId,
    type: 'episodic',
    content: `Completed new song: "${event.payload.songTitle}"`,
    importance: 'high',
    tags: ['music', 'creation', 'song', 'milestone'],
  });
});

agentEventBus.on(AgentEventType.COLLABORATION_COMPLETED, async (event) => {
  // Crear memoria para ambos artistas
  await createInteractionMemory(
    event.artistId,
    event.payload.collaboratorId,
    'collaboration',
    `Completed collaboration: "${event.payload.projectName}"`,
    'positive'
  );
});

console.log('🧠 MemoryAgent initialized - Artists now remember their experiences');
