import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { env } from "@/env";
import Anthropic from '@anthropic-ai/sdk';

// the newest Anthropic model is "claude-3-5-sonnet-20241022" which was released October 22, 2024
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

      const anthropic = new Anthropic({
        apiKey: OPENROUTER_API_KEY,
      });

      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2000,
        messages: [
          {
            role: "system",
            content: `You are an expert AI assistant specialized in ${type} management for music artists and events.`
          },
          {
            role: "user",
            content: prompt
          }
        ],
      });

      console.log('Anthropic response:', response);

      if (!response.content || !response.content[0].text) {
        console.error('Invalid response format:', response);
        throw new Error('Invalid API response format');
      }

      return response.content[0].text;

    } catch (error) {
      console.error('Error in generateWithAI:', error);
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