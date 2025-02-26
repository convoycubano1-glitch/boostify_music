import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { apiRequest } from "@/lib/queryClient";
import { env } from "@/env";

export const managerToolsService = {
  async generateWithAI(prompt: string, type: string) {
    try {
      console.log('Making request to OpenRouter with prompt:', prompt);
      
      // Use the server-side endpoint instead of direct OpenRouter connection
      const response = await apiRequest('/api/manager/generate-content', {
        method: 'POST',
        body: JSON.stringify({
          prompt,
          type
        }),
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response from server:', errorData);
        throw new Error(errorData.error || 'Failed to generate content');
      }

      const data = await response.json();
      console.log('Response received from server');
      
      if (!data.content) {
        console.error('Invalid response format from server');
        throw new Error('Invalid API response format');
      }

      return data.content;

    } catch (error: any) {
      console.error('Error in generateWithAI:', error);
      if (error.status === 401) {
        throw new Error('Authentication failed. Please check your API key configuration.');
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
  prompt?: string; // Added prompt field for AI responses
}

export default managerToolsService;