import OpenAI from 'openai';
import { env } from "@/env";
import { db } from "@/lib/firebase";
import { collection, addDoc, query, where, getDocs, serverTimestamp } from "firebase/firestore";

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

interface RecordLabelService {
  type: 'remix' | 'mastering' | 'video' | 'publishing';
  content: any;
  userId: string;
  createdAt: Date;
  status: 'pending' | 'completed' | 'failed';
}

export const recordLabelService = {
  async generateRemix(originalTrack: string, style: string, userId: string) {
    try {
      const prompt = `Generate a modern remix of this track in the style of ${style}. Original track: ${originalTrack}`;
      
      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-3-sonnet",
        messages: [
          {
            role: 'system',
            content: 'You are an expert music producer specializing in remix generation.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const remixInstructions = completion.choices[0].message.content;

      return this.saveToFirestore({
        type: 'remix',
        content: {
          originalTrack,
          style,
          remixInstructions
        },
        userId,
        createdAt: new Date(),
        status: 'completed'
      });

    } catch (error) {
      console.error('Error generating remix:', error);
      throw error;
    }
  },

  async generateMaster(track: string, reference: string, userId: string) {
    try {
      const prompt = `Create professional mastering instructions for this track using ${reference} as reference.`;
      
      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-3-sonnet",
        messages: [
          {
            role: 'system',
            content: 'You are an expert mastering engineer.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const masteringInstructions = completion.choices[0].message.content;

      return this.saveToFirestore({
        type: 'mastering',
        content: {
          track,
          reference,
          masteringInstructions
        },
        userId,
        createdAt: new Date(),
        status: 'completed'
      });

    } catch (error) {
      console.error('Error generating mastering instructions:', error);
      throw error;
    }
  },

  async generateMusicVideo(track: string, style: string, userId: string) {
    try {
      const prompt = `Generate a music video concept for this track in the style of ${style}.`;
      
      const completion = await openai.chat.completions.create({
        model: "anthropic/claude-3-sonnet",
        messages: [
          {
            role: 'system',
            content: 'You are an expert music video director.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });

      const videoInstructions = completion.choices[0].message.content;

      return this.saveToFirestore({
        type: 'video',
        content: {
          track,
          style,
          videoInstructions
        },
        userId,
        createdAt: new Date(),
        status: 'completed'
      });

    } catch (error) {
      console.error('Error generating video concept:', error);
      throw error;
    }
  },

  async saveToFirestore(data: RecordLabelService) {
    try {
      const docRef = await addDoc(collection(db, 'record_label_services'), {
        ...data,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving to Firestore:', error);
      throw error;
    }
  },

  async getServices(userId: string, type?: string) {
    try {
      let q = query(
        collection(db, 'record_label_services'),
        where('userId', '==', userId)
      );

      if (type) {
        q = query(q, where('type', '==', type));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error fetching services:', error);
      throw error;
    }
  }
};

export default recordLabelService;
