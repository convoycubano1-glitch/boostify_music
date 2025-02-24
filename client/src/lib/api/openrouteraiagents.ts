import axios from 'axios';
import { db } from '@/lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { env } from '@/env';

const OPEN_ROUTER_API_KEY = env.VITE_OPENROUTER_API_KEY;
const OPEN_ROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

export class OpenRouterService {
  private static instance: OpenRouterService;

  private constructor() {
    console.log("OpenRouter Service initialized");
  }

  public static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  async chatWithAgent(
    prompt: string,
    agentType: string,
    userId: string,
    systemInstruction: string
  ): Promise<string> {
    if (!OPEN_ROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured correctly');
    }

    try {
      console.log('Sending request to OpenRouter with prompt:', prompt);

      const config = {
        headers: {
          'Authorization': `Bearer ${OPEN_ROUTER_API_KEY.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Agents Orchestra'
        }
      };

      const requestBody = {
        model: 'anthropic/claude-3-sonnet',
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      };

      console.log('OpenRouter request config:', config);
      console.log('OpenRouter request body:', requestBody);

      const response = await axios.post(
        OPEN_ROUTER_API_URL,
        requestBody,
        config
      );

      const result = response.data.choices[0].message.content;
      console.log(`OpenRouter response for ${agentType}:`, result);

      try {
        const responseId = `${agentType}_${Date.now()}`;
        const docRef = doc(db, `users/${userId}/agent_responses`, responseId);
        await setDoc(docRef, {
          agentType,
          prompt,
          response: result,
          timestamp: serverTimestamp()
        });
      } catch (error) {
        // Log pero no propagues el error de Firestore
        console.error('Error saving to Firestore:', error);
      }

      return result;
    } catch (error: any) {
      console.error(`Error in OpenRouter chat for ${agentType}:`, {
        message: error.message,
        response: error.response?.data
      });
      throw error;
    }
  }
}

export const openRouterService = OpenRouterService.getInstance();