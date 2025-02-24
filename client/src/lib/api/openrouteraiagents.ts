import axios from 'axios';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';
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
        // Guardar en la colección específica para cada tipo de agente
        if (agentType === 'videoDirector') {
          const videoDirectorRef = collection(db, 'Video_Director_AI');
          await addDoc(videoDirectorRef, {
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
        } else if (agentType === 'marketing') {
          const marketingRef = collection(db, 'Strategic_Marketing_AI');
          await addDoc(marketingRef, {
            userId,
            prompt,
            strategy: result,
            timestamp: serverTimestamp(),
            metadata: {
              model: 'anthropic/claude-3-sonnet',
              temperature: 0.7,
              systemInstruction
            },
            format: {
              sections: [
                'Campaign Strategy',
                'Content Calendar',
                'Budget Allocation',
                'KPIs and Metrics',
                'Growth Projections'
              ],
              version: '1.0'
            }
          });
          console.log('Strategy saved to Strategic_Marketing_AI collection');
        } else if (agentType === 'socialMedia') {
          const socialMediaRef = collection(db, 'Social_Media_AI');
          await addDoc(socialMediaRef, {
            userId,
            prompt,
            content: result,
            timestamp: serverTimestamp(),
            metadata: {
              model: 'anthropic/claude-3-sonnet',
              temperature: 0.7,
              systemInstruction
            },
            format: {
              sections: [
                'Content Strategy',
                'Post Schedule',
                'Hashtag Strategy',
                'Engagement Tactics',
                'Performance Metrics'
              ],
              version: '1.0'
            }
          });
          console.log('Content saved to Social_Media_AI collection');
        } else if (agentType === 'merchandiseDesigner') {
          const merchandiseRef = collection(db, 'Merchandise_Designer_AI');
          await addDoc(merchandiseRef, {
            userId,
            prompt,
            design: result,
            timestamp: serverTimestamp(),
            metadata: {
              model: 'anthropic/claude-3-sonnet',
              temperature: 0.7,
              systemInstruction
            },
            format: {
              sections: [
                'Design Concept',
                'Product Type',
                'Color Scheme',
                'Typography',
                'Visual Elements',
                'Placement Details'
              ],
              version: '1.0'
            }
          });
          console.log('Design saved to Merchandise_Designer_AI collection');
        } else if (agentType === 'manager') {
          const managerRef = collection(db, 'Manager_AI');
          await addDoc(managerRef, {
            userId,
            prompt,
            advice: result,
            timestamp: serverTimestamp(),
            metadata: {
              model: 'anthropic/claude-3-sonnet',
              temperature: 0.7,
              systemInstruction
            },
            format: {
              sections: [
                'Career Analysis',
                'Industry Insights',
                'Professional Development',
                'Networking Strategy',
                'Action Items'
              ],
              version: '1.0'
            }
          });
          console.log('Advice saved to Manager_AI collection');
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