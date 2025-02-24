import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { env } from "@/env";

// Obtener la API key de las variables de entorno
const API_KEY = env.VITE_OPENROUTER_API_KEY;
const BASE_URL = 'https://openrouter.ai/api/v1/chat/completions';

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
    try {
      if (!API_KEY) {
        throw new Error('OpenRouter API key is not configured');
      }

      console.log("Starting content generation with OpenRouter...");

      const response = await fetch(BASE_URL, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "HTTP-Referer": window.location.origin,
          "X-Title": "Music Manager Tools",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
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
          temperature: 0.7,
          max_tokens: 2000
        })
      });

      console.log("OpenRouter API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error("OpenRouter API error:", errorData);
        throw new Error(`Error generating content: ${response.statusText}. Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("OpenRouter raw response:", data);

      if (!data.choices?.[0]?.message?.content) {
        console.error("Invalid API response structure:", data);
        throw new Error("Invalid API response format");
      }

      return data.choices[0].message.content;
    } catch (error) {
      console.error("Content generation error:", error);
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