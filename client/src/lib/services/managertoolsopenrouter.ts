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

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const backoff = async (retryCount: number) => {
  const baseDelay = 3000;
  const maxDelay = 60000;
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  console.log(`Waiting ${delay/1000} seconds before retry ${retryCount + 1}`);
  await wait(delay);
};

export const managerToolsService = {
  // Función genérica para interactuar con OpenRouter
  async generateWithAI(prompt: string, type: string) {
    const maxRetries = 3;
    let retryCount = 0;

    while (retryCount < maxRetries) {
      try {
        console.log(`Attempt ${retryCount + 1}/${maxRetries} to generate content`);

        const response = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${API_KEY}`,
            "HTTP-Referer": window.location.origin,
            "X-Title": "Music Manager Tools",
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "mistralai/mixtral-8x7b-instruct",
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

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("OpenRouter API error:", errorData);

          if (response.status === 429) {
            console.log("Rate limit hit, implementing backoff...");
            await backoff(retryCount);
            retryCount++;
            continue;
          }

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
        console.error(`Error in attempt ${retryCount + 1}:`, error);

        if (retryCount === maxRetries - 1) {
          throw error;
        }

        await backoff(retryCount);
        retryCount++;
      }
    }

    throw new Error(`Failed to generate content after ${maxRetries} attempts`);
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