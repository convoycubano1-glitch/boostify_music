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
// Try to get the API key from either import.meta.env or process.env
const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY;
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
      
      // Log what we're doing to help debug
      console.log('Making request to OpenRouter with prompt:', prompt.slice(0, 50) + '...');
      
      const response = await fetch(`${BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Boostify Music Assistant' // Add a title
        },
        body: JSON.stringify({
          model: 'anthropic/claude-3-haiku', // Using a smaller model which may be more reliable
          messages
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('OpenRouter API error details:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      // Validate the expected structure of the response
      if (!data || !data.choices || !data.choices[0] || !data.choices[0].message) {
        console.error('Invalid response structure:', data);
        throw new Error('Invalid response structure from OpenRouter API');
      }

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
      
      // Provide a fallback response in case of errors
      const fallbackResponse: AgentResponse = {
        id: crypto.randomUUID(),
        userId,
        agentType,
        query: prompt,
        response: "Lo siento, no puedo responder en este momento. Hay un problema con nuestra conexión al servicio de IA. Por favor, intenta nuevamente más tarde.",
        timestamp: new Date(),
        metadata: {
          error: error instanceof Error ? error.message : 'Unknown error',
          fallback: true
        }
      };
      
      // Try to save the error to Firestore, but don't fail if this also fails
      try {
        await saveAgentResponse({
          ...fallbackResponse,
          metadata: {
            ...fallbackResponse.metadata,
            originalError: error instanceof Error ? error.toString() : JSON.stringify(error)
          }
        });
      } catch (firestoreError) {
        console.error('Could not save error to Firestore:', firestoreError);
      }
      
      // Return the fallback response so the UI doesn't break
      return fallbackResponse;
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
    // Verificar que tenemos una conexión a Firestore antes de intentar guardar
    if (!db) {
      console.warn('Firestore not initialized, skipping save operation');
      return;
    }
    
    // Asegurarnos de que los campos son válidos para Firestore
    const sanitizedResponse = {
      ...response,
      // Convertir timestamp a Firestore timestamp si no es un serverTimestamp
      timestamp: serverTimestamp(),
      // Asegurarnos de que el metadata es un objeto válido para Firestore
      metadata: response.metadata ? JSON.parse(JSON.stringify(response.metadata)) : {},
      // Si userId es undefined, usar 'anonymous'
      userId: response.userId || 'anonymous'
    };
    
    const agentResponsesRef = collection(db, 'agentResponses');
    await addDoc(agentResponsesRef, sanitizedResponse);
    console.log('Agent response saved to Firestore successfully');
  } catch (error) {
    console.error('Error saving agent response:', error);
    // No rethrow para que esto no rompa la experiencia del usuario
    // solo logueamos el error
  }
}

export default openRouterService;