import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { env } from "@/env";
import OpenAI from 'openai';

const OPENROUTER_API_KEY = env.VITE_OPENROUTER_API_KEY;

interface ManagerToolData {
  type: 'technical' | 'requirements' | 'budget' | 'logistics' | 'hiring' | 'ai' | 'calendar';
  content: any;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const managerToolsService = {
  async generateWithAI(prompt: string, type: string) {
    if (!OPENROUTER_API_KEY) {
      console.error('OpenRouter API key is not configured');
      throw new Error('OpenRouter API key is not configured');
    }

    try {
      console.log('Making request with prompt:', prompt);

      const openai = new OpenAI({
        apiKey: OPENROUTER_API_KEY,
        baseURL: 'https://openrouter.ai/api/v1',
        dangerouslyAllowBrowser: true,
        defaultHeaders: {
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Boostify Music Manager',
        },
      });

      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-3-sonnet",
        messages: [
          {
            role: 'system',
            content: `You are an expert AI assistant specialized in ${type} management for music artists and events.`
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

    } catch (error) {
      console.error('Error in generateWithAI:', error);
      // Improve error handling with more descriptive messages
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your OpenRouter API key configuration.');
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
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

  technical: {
    async generateTechnicalRider(requirements: string, userId: string) {
      try {
        console.log('Generating technical rider for requirements:', requirements);
        const prompt = `Generate a detailed technical rider based on these requirements: ${requirements}. Include sections for sound equipment, lighting requirements, stage setup, and any special requirements.`;

        const content = await managerToolsService.generateWithAI(prompt, 'technical');

        return managerToolsService.saveToFirestore({
          type: 'technical',
          content,
          userId,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      } catch (error) {
        console.error('Error generating rider:', error);
        throw error;
      }
    }
  },
  requirements: {
    async generateRequirements(artistInfo: string, userId: string) {
      const prompt = `Create a comprehensive requirements list for this artist: ${artistInfo}`;
      const content = await managerToolsService.generateWithAI(prompt, 'requirements');
      return managerToolsService.saveToFirestore({
        type: 'requirements',
        content,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  },

  budget: {
    async generateBudget(eventDetails: string, userId: string) {
      const prompt = `Create a detailed budget breakdown for this event: ${eventDetails}`;
      const content = await managerToolsService.generateWithAI(prompt, 'budget');
      return managerToolsService.saveToFirestore({
        type: 'budget',
        content,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  },

  logistics: {
    async generateLogisticsPlan(eventInfo: string, userId: string) {
      const prompt = `Create a logistics plan for this event: ${eventInfo}`;
      const content = await managerToolsService.generateWithAI(prompt, 'logistics');
      return managerToolsService.saveToFirestore({
        type: 'logistics',
        content,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  },

  hiring: {
    async generateJobDescriptions(positions: string[], userId: string) {
      const prompt = `Create job descriptions for these positions: ${positions.join(', ')}`;
      const content = await managerToolsService.generateWithAI(prompt, 'hiring');
      return managerToolsService.saveToFirestore({
        type: 'hiring',
        content,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  },

  ai: {
    async generateRecommendations(context: string, userId: string) {
      const prompt = `Provide AI-powered recommendations for: ${context}`;
      const content = await managerToolsService.generateWithAI(prompt, 'ai');
      return managerToolsService.saveToFirestore({
        type: 'ai',
        content,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  },

  calendar: {
    async scheduleEvent(eventDetails: any, userId: string) {
      return managerToolsService.saveToFirestore({
        type: 'calendar',
        content: eventDetails,
        userId,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  }
};

export default managerToolsService;