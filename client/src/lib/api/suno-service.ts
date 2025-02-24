import { z } from "zod";

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
const SUNO_API_KEY = import.meta.env.VITE_SUNO_API_KEY;
const BASE_URL = 'https://api.suno.ai/v1';

export const sunoService = {
  generateMusic: async (
    params: {
      genre: string;
      tempo: number;
      mood: string;
    },
    userId: string
  ): Promise<SunoResponse> => {
    if (!SUNO_API_KEY) {
      throw new Error('Suno API key is not configured');
    }

    try {
      const response = await fetch(`${BASE_URL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUNO_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'v2',
          input_type: 'structured',
          parameters: {
            genre: params.genre,
            tempo: params.tempo,
            mood: params.mood
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Suno API error: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        id: crypto.randomUUID(),
        userId,
        musicUrl: data.audio_url,
        parameters: params,
        timestamp: new Date(),
        metadata: {
          model: 'suno-v2',
          generationId: data.generation_id
        }
      };
    } catch (error) {
      console.error('Error in generateMusic:', error);
      throw error;
    }
  }
};

export default sunoService;
