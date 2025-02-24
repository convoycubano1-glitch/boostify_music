import { z } from "zod";
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { env } from '@/env';

// Definición de tipos para las respuestas de Suno
export const SunoResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  musicUrl: z.string(),
  parameters: z.object({
    genre: z.string(),
    tempo: z.number(),
    mood: z.string()
  }),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional()
});

export type SunoResponse = z.infer<typeof SunoResponseSchema>;

// Configuración de Suno
const SUNO_API_KEY = env.VITE_SUNO_API_KEY;
const BASE_URL = 'https://api.lumaapi.com/v1';

export const sunoService = {
  generateMusic: async (
    params: {
      genre: string;
      tempo: number;
      mood: string;
    },
    userId: string
  ): Promise<SunoResponse> => {
    // Verificar y loggear el estado de la API key
    console.log('Estado de la API key de Suno:', {
      exists: !!SUNO_API_KEY,
      length: SUNO_API_KEY?.length,
      envVar: import.meta.env.VITE_SUNO_API_KEY ? 'presente' : 'ausente'
    });

    if (!SUNO_API_KEY) {
      throw new Error('Suno API key is not configured. Please check your environment variables.');
    }

    try {
      console.log('Iniciando generación de música con Suno AI:', {
        ...params,
        userId,
        apiKeyConfigured: !!SUNO_API_KEY
      });

      const response = await fetch(`${BASE_URL}/music/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'chirp-v3-5',
          input: {
            genre: params.genre,
            tempo: params.tempo,
            mood: params.mood,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Error en la respuesta de Suno API:', errorData);
        throw new Error(`Error en Suno API: ${response.statusText}. ${errorData ? JSON.stringify(errorData) : ''}`);
      }

      const data = await response.json();
      console.log('Respuesta exitosa de Suno API:', data);

      const sunoResponse: SunoResponse = {
        id: crypto.randomUUID(),
        userId,
        musicUrl: data.output.audio_url, 
        parameters: params,
        timestamp: new Date(),
        metadata: {
          model: 'chirp-v3-5',
          generationId: data.id
        }
      };

      // Guardar en Firestore
      const agentResponsesRef = collection(db, 'agentResponses');
      await addDoc(agentResponsesRef, {
        ...sunoResponse,
        timestamp: serverTimestamp()
      });

      return sunoResponse;
    } catch (error) {
      console.error('Error en generateMusic:', error);
      throw error;
    }
  }
};

export default sunoService;