import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import OpenAI from 'openai';
import { env } from "@/env";

if (!env.VITE_OPENROUTER_API_KEY) {
  console.error('OpenRouter API key is not configured');
  throw new Error('OpenRouter API key is not configured');
}

const openai = new OpenAI({
  apiKey: env.VITE_OPENROUTER_API_KEY || '',
  baseURL: 'https://openrouter.ai/api/v1',
  dangerouslyAllowBrowser: true,
  defaultHeaders: {
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Boostify Music Manager',
  }
});

export const managerToolsService = {
  async generateWithAI(prompt: string, type: string) {
    try {
      console.log('Making request to OpenRouter with prompt:', prompt);

      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-3-sonnet",
        messages: [
          {
            role: 'system',
            content: `You are an expert AI assistant specialized in ${type} management for music artists and events. Provide detailed, well-structured responses.`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      console.log('OpenRouter response:', completion);

      if (!completion.choices?.[0]?.message?.content) {
        console.error('Invalid response format:', completion);
        throw new Error('Invalid API response format');
      }

      return completion.choices[0].message.content;

    } catch (error: any) {
      console.error('Error in generateWithAI:', error);
      if (error.status === 401) {
        throw new Error('Authentication failed. Please check your OpenRouter API key configuration.');
      } else if (error.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      throw new Error(error.message || 'Failed to generate content');
    }
  },

  async previewTechnicalRider(requirements: string) {
    try {
      const prompt = `Generate a preview of a technical rider based on these requirements: ${requirements}. Include sections for sound equipment, lighting requirements, stage setup, and any special requirements.`;

      const content = await this.generateWithAI(prompt, 'technical');
      return content;
    } catch (error) {
      console.error('Error generating technical rider preview:', error);
      throw error;
    }
  },

  async saveToFirestore(data: ManagerToolData) {
    try {
      const docRef = await addDoc(collection(db, 'manager_tools'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      throw error;
    }
  },

  async getFromFirestore(userId: string, type: string) {
    try {
      const q = query(
        collection(db, 'manager_tools'),
        where('userId', '==', userId),
        where('type', '==', type)
      );
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching from Firestore:', error);
      throw error;
    }
  },

  async generateContentByType(type: string, details: string, userId: string) {
    try {
      let prompt = '';
      switch (type) {
        case 'technical':
          prompt = `Generate a detailed technical rider based on these requirements: ${details}. Include sections for sound equipment, lighting requirements, stage setup, and any special requirements.`;
          break;
        case 'requirements':
          prompt = `Create a comprehensive requirements list for this event/artist: ${details}. Include all necessary technical, logistical, and personnel requirements.`;
          break;
        case 'budget':
          prompt = `Create a detailed budget breakdown for this project: ${details}. Include all expected costs, contingencies, and potential revenue streams.`;
          break;
        case 'logistics':
          prompt = `Create a detailed logistics plan for this event/tour: ${details}. Include transportation, accommodation, equipment handling, and timeline.`;
          break;
        case 'hiring':
          prompt = `Create detailed job descriptions and requirements for these positions: ${details}. Include responsibilities, qualifications, and experience needed.`;
          break;
        default:
          prompt = `Provide expert recommendations and insights for: ${details}`;
      }

      const content = await this.generateWithAI(prompt, type);
      return this.saveToFirestore({
        type: type as ManagerToolData['type'],
        content,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    } catch (error) {
      console.error(`Error generating ${type} content:`, error);
      throw error;
    }
  }
};

interface ManagerToolData {
  type: 'technical' | 'requirements' | 'budget' | 'logistics' | 'hiring' | 'ai' | 'calendar';
  content: any;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export default managerToolsService;