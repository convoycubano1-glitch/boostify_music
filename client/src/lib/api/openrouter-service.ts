import { z } from "zod";
import { db } from '../firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

// Definición de tipos para las respuestas de agentes
export const AgentResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  agentType: z.enum([
    'composer',
    'manager',
    'marketing',
    'videoDirector',
    'careerDevelopment',
    'customerService'
  ]),
  query: z.string(),
  response: z.string(),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional()
});

export type AgentResponse = z.infer<typeof AgentResponseSchema>;

// Configuración de OpenRouter
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1';

// Funciones de utilidad para los agentes
export const openRouterService = {
  // Función genérica para chat con cualquier agente
  chatWithAgent: async (
    prompt: string,
    agentType: AgentResponse['agentType'],
    userId: string,
    systemPrompt?: string,
    conversationHistory?: Array<{ role: string; content: string }>
  ): Promise<AgentResponse> => {
    if (!OPENROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured');
    }

    try {
      // Prepare the messages array with system prompt first
      const messages = [
        {
          role: 'system',
          content: systemPrompt || 'You are a helpful AI assistant for the music industry.'
        }
      ];
      
      // Add conversation history if provided
      if (conversationHistory && conversationHistory.length > 0) {
        messages.push(...conversationHistory);
      } else {
        // If no history, just add the prompt as a single user message
        messages.push({
          role: 'user',
          content: prompt
        });
      }
      
      // If we have history but the last message isn't the current prompt, add it
      if (conversationHistory && 
          conversationHistory.length > 0 && 
          conversationHistory[conversationHistory.length - 1].content !== prompt &&
          conversationHistory[conversationHistory.length - 1].role !== 'user') {
        messages.push({
          role: 'user',
          content: prompt
        });
      }
      
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
        },
        body: JSON.stringify({
          model: 'openai/gpt-4-turbo-preview',
          messages
        })
      });

      if (!response.ok) {
        throw new Error(`OpenRouter API error: ${response.statusText}`);
      }

      const data = await response.json();

      const agentResponse: AgentResponse = {
        id: crypto.randomUUID(),
        userId,
        agentType,
        query: prompt,
        response: data.choices[0].message.content,
        timestamp: new Date(),
        metadata: {
          model: data.model,
          promptTokens: data.usage.prompt_tokens,
          completionTokens: data.usage.completion_tokens
        }
      };

      // Guardar en Firestore
      await saveAgentResponse(agentResponse);

      return agentResponse;
    } catch (error) {
      console.error('Error in chatWithAgent:', error);
      throw error;
    }
  },

  // Función para obtener respuestas históricas
  getAgentHistory: async (
    userId: string,
    agentType?: AgentResponse['agentType']
  ): Promise<AgentResponse[]> => {
    try {
      const agentResponsesRef = collection(db, 'agentResponses');
      let q = query(
        agentResponsesRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );

      if (agentType) {
        q = query(
          agentResponsesRef,
          where('userId', '==', userId),
          where('agentType', '==', agentType),
          orderBy('timestamp', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        timestamp: doc.data().timestamp.toDate()
      })) as AgentResponse[];
    } catch (error) {
      console.error('Error fetching agent history:', error);
      throw error;
    }
  }
};

// Función auxiliar para guardar respuestas en Firestore
async function saveAgentResponse(response: AgentResponse): Promise<void> {
  try {
    const agentResponsesRef = collection(db, 'agentResponses');
    await addDoc(agentResponsesRef, {
      ...response,
      timestamp: serverTimestamp()
    });
  } catch (error) {
    console.error('Error saving agent response:', error);
    throw error;
  }
}

export default openRouterService;