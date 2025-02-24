import axios from 'axios';
import { db } from '@/lib/firebase';
import { doc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
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
        // Guardar en la colección específica para Video Director AI
        if (agentType === 'videoDirector') {
          const videoDirectorRef = collection(db, 'Video_Director_AI');
          const docRef = doc(videoDirectorRef, `script_${Date.now()}`);
          await setDoc(docRef, {
            userId,
            prompt,
            script: result,
            timestamp: serverTimestamp(),
            metadata: {
              model: 'anthropic/claude-3-sonnet',
              temperature: 0.7,
              systemInstruction
            },
            format: {
              sections: [
                'Scene Breakdown',
                'Visual Direction',
                'Camera Movements',
                'Special Effects',
                'Narrative Elements'
              ],
              version: '1.0'
            }
          });
          console.log('Script saved to Video_Director_AI collection');
        }
      } catch (error) {
        console.error('Error saving to Firestore:', error);
        // No propagamos el error para que no afecte la funcionalidad principal
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