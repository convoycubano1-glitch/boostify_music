import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import axios from 'axios';

// Obtener la API key de las variables de entorno
const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const API_URL = "https://api.openrouter.ai/api/v1/chat/completions";

interface ManagerToolData {
  type: 'technical' | 'requirements' | 'budget' | 'logistics' | 'hiring' | 'ai' | 'calendar';
  content: any;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export const managerToolsService = {
  // Función genérica para interactuar con OpenRouter
  async generateWithAI(prompt: string, type: string) {
    if (!API_KEY) {
      console.error('No OpenRouter API key found in environment variables');
      throw new Error('No auth credentials found');
    }

    try {
      console.log('Generating content with prompt:', prompt);

      const headers = {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'HTTP-Referer': `${window.location.origin}/`,
        'OpenAI-Organization': 'boostify-manager-tools'
      };

      console.log('Request headers:', headers);

      const response = await axios.post(API_URL, {
        model: "openai/gpt-4",
        messages: [
          {
            role: "system",
            content: `You are an expert AI assistant specialized in ${type} management for music artists and events.`
          },
          {
            role: "user",
            content: prompt
          }
        ]
      }, { headers });

      console.log('OpenRouter response:', response.data);

      if (!response.data.choices?.[0]?.message?.content) {
        console.error('Invalid response format:', response.data);
        throw new Error('Invalid response format from OpenRouter API');
      }

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Error generating content:', error);
      throw error;
    }
  },

  // Función para guardar datos en Firestore
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

  // Función para obtener datos de Firestore
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

  // Funciones específicas para cada tipo de herramienta
  technical: {
    async generateTechnicalRider(requirements: string, userId: string) {
      try {
        console.log('Generating technical rider for requirements:', requirements);
        const prompt = `Generate a detailed technical rider based on these requirements: ${requirements}. Include sections for sound equipment, lighting requirements, stage setup, and any special requirements.`;
        const content = await managerToolsService.generateWithAI(prompt, 'technical');
        console.log('Generated content:', content);

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