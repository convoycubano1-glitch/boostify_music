import { fal } from "@fal-ai/client";
import { z } from "zod";
import { env } from '@/env';

// Schema validation for FAL.AI responses
export const FalResponseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  musicUrl: z.string(),
  parameters: z.object({
    prompt: z.string(),
    reference_audio_url: z.string().optional(),
  }),
  timestamp: z.date(),
  metadata: z.record(z.any()).optional()
});

export type FalResponse = z.infer<typeof FalResponseSchema>;

// Initialize FAL client
fal.config({
  credentials: env.VITE_FAL_API_KEY
});

export const falService = {
  generateMusic: async (
    params: {
      genre: string;
      tempo: number;
      mood: string;
      theme: string;
      language: string;
      structure: string;
    },
    userId: string
  ): Promise<FalResponse> => {
    try {
      // Construir el prompt basado en los parámetros
      const prompt = `## ${params.theme}
In ${params.mood} ${params.genre} style,
Tempo set to ${params.tempo} beats per minute,
Following a ${params.structure} structure.

Written in ${params.language}, expressing our theme:
Let the music flow and create our dream.
##`;

      console.log('Iniciando generación de música con FAL.AI:', {
        ...params,
        userId,
        prompt
      });

      const result = await fal.subscribe("fal-ai/minimax-music", {
        input: {
          prompt,
          // Usar una referencia de audio por defecto si no se proporciona una
          reference_audio_url: "https://fal.media/files/lion/OOTBTSlxKMH_E8H6hoSlb.mpga"
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      console.log('Respuesta de FAL.AI:', result);

      if (!result.data?.audio?.url) {
        throw new Error('No se recibió URL de audio en la respuesta');
      }

      const response: FalResponse = {
        id: result.requestId || crypto.randomUUID(),
        userId,
        musicUrl: result.data.audio.url,
        parameters: {
          prompt,
          reference_audio_url: "https://fal.media/files/lion/OOTBTSlxKMH_E8H6hoSlb.mpga"
        },
        timestamp: new Date(),
        metadata: {
          model: 'minimax-music',
          contentType: result.data.audio.content_type,
          fileName: result.data.audio.file_name,
          fileSize: result.data.audio.file_size
        }
      };

      return response;
    } catch (error) {
      console.error('Error en generateMusic:', error);
      throw error;
    }
  }
};

export default falService;
