/**
 * Servicio para interactuar directamente con la API de Freepik (Mystic)
 * Basado en la documentación: https://api.freepik.com/docs/
 */

import { z } from 'zod';

// Esquema para validar la respuesta de la API de Freepik
export const FreepikResponseSchema = z.object({
  data: z.object({
    generated: z.array(z.object({
      url: z.string(),
    })).optional(),
    task_id: z.string(),
    status: z.enum(['IN_PROGRESS', 'COMPLETED', 'FAILED']),
  }),
});

export type FreepikResponse = z.infer<typeof FreepikResponseSchema>;

// Opciones para la generación de imágenes
export interface FreepikGenerationOptions {
  prompt: string;
  resolution?: '2k' | '4k';
  aspect_ratio?: 
    'square_1_1' | 
    'classic_4_3' | 
    'traditional_3_4' | 
    'widescreen_16_9' | 
    'social_story_9_16' | 
    'smartphone_horizontal_20_9' | 
    'smartphone_vertical_9_20' | 
    'standard_3_2' | 
    'portrait_2_3' | 
    'horizontal_2_1' | 
    'vertical_1_2' | 
    'social_5_4' | 
    'social_post_4_5';
  realism?: boolean;
  creative_detailing?: number;
  engine?: 'automatic' | 'magnific_illusio' | 'magnific_sharpy' | 'magnific_sparkle';
  fixed_generation?: boolean;
  filter_nsfw?: boolean;
}

// Interfaz de cliente Freepik
export const freepikService = {
  /**
   * Genera una imagen usando la API Mystic de Freepik
   * 
   * @param options Opciones para la generación de imágenes
   * @returns Promesa con la respuesta de la API
   */
  async generateImage(options: FreepikGenerationOptions): Promise<FreepikResponse> {
    const apiKey = import.meta.env.VITE_FREEPIK_KEY;
    
    if (!apiKey) {
      console.error('Missing VITE_FREEPIK_KEY environment variable');
      throw new Error('Freepik API key is not configured');
    }

    try {
      const response = await fetch('https://api.freepik.com/v1/ai/mystic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-freepik-api-key': apiKey
        },
        body: JSON.stringify({
          prompt: options.prompt,
          resolution: options.resolution || '2k',
          aspect_ratio: options.aspect_ratio || 'square_1_1',
          realism: options.realism !== undefined ? options.realism : true,
          creative_detailing: options.creative_detailing !== undefined ? options.creative_detailing : 33,
          engine: options.engine || 'automatic',
          fixed_generation: options.fixed_generation || false,
          filter_nsfw: options.filter_nsfw !== undefined ? options.filter_nsfw : true
        })
      });

      if (!response.ok) {
        throw new Error(`Freepik API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error generating image with Freepik:', error);
      throw error;
    }
  },

  /**
   * Verifica el estado de una tarea de generación de imágenes
   * 
   * @param taskId ID de la tarea de generación
   * @returns Promesa con la respuesta de la API
   */
  async checkTaskStatus(taskId: string): Promise<FreepikResponse> {
    const apiKey = import.meta.env.VITE_FREEPIK_KEY;
    
    if (!apiKey) {
      console.error('Missing VITE_FREEPIK_KEY environment variable');
      throw new Error('Freepik API key is not configured');
    }

    try {
      const response = await fetch(`https://api.freepik.com/v1/ai/mystic/${taskId}`, {
        method: 'GET',
        headers: {
          'x-freepik-api-key': apiKey
        }
      });

      if (!response.ok) {
        throw new Error(`Freepik API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error('Error checking task status with Freepik:', error);
      throw error;
    }
  }
};