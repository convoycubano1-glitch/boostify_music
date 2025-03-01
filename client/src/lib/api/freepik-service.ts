/**
 * Servicio para interactuar directamente con la API de Freepik
 * Basado en la documentación: https://api.freepik.com/docs/
 * Soporta múltiples endpoints: Mystic, Imagen3, Classic, FluxDev
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

// Tipos de relaciones de aspecto compatibles con todas las APIs de Freepik
export type FreepikAspectRatio = 
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

// Base interface con propiedades comunes para todos los modelos
export interface FreepikBaseOptions {
  prompt: string;
  aspect_ratio?: FreepikAspectRatio;
}

// Modelo base (Mystic) para generación de imágenes
export interface FreepikMysticOptions extends FreepikBaseOptions {
  modelType?: 'mystic';
  resolution?: '2k' | '4k';
  realism?: boolean;
  creative_detailing?: number;
  engine?: 'automatic' | 'magnific_illusio' | 'magnific_sharpy' | 'magnific_sparkle';
  fixed_generation?: boolean;
  filter_nsfw?: boolean;
  num_images?: number;
}

// Modelo Google Imagen 3 (más reciente)
export interface FreepikImagen3Options extends FreepikBaseOptions {
  modelType?: 'imagen3';
  num_images?: number;
  styling?: {
    style?: string;
    color?: string;
    lightning?: string; 
    framing?: string;
  };
  person_generation?: 'dont_allow' | 'allow_adult' | 'allow_all';
  safety_settings?: 'block_low_and_above' | 'block_medium_and_above' | 'block_only_high' | 'block_none';
}

// Modelo Classic Fast
export interface FreepikClassicOptions extends FreepikBaseOptions {
  modelType?: 'classic';
  negative_prompt?: string;
  styling?: {
    style?: string;
  };
  guidance_scale?: number;
  num_images?: number;
  seed?: number;
}

// Modelo Flux Dev
export interface FreepikFluxDevOptions extends FreepikBaseOptions {
  modelType?: 'flux-dev';
  styling?: {
    style?: string;
  };
  seed?: number;
}

// Unión de tipos para permitir el uso de cualquier modelo
export type FreepikGenerationOptions = 
  | FreepikMysticOptions 
  | FreepikImagen3Options 
  | FreepikClassicOptions 
  | FreepikFluxDevOptions;

// Interfaz de cliente Freepik
// Tipos de modelo Freepik disponibles
export enum FreepikModel {
  MYSTIC = 'mystic',
  IMAGEN3 = 'imagen3',
  CLASSIC = 'classic',
  FLUX_DEV = 'flux-dev'
}

export const freepikService = {
  /**
   * Genera una imagen usando la API de Freepik con el modelo especificado
   * 
   * @param options Opciones para la generación de imágenes
   * @param model Modelo de IA a utilizar (default: MYSTIC)
   * @returns Promesa con la respuesta de la API
   */
  async generateImage(options: FreepikGenerationOptions, model: FreepikModel = FreepikModel.MYSTIC): Promise<FreepikResponse> {
    const apiKey = import.meta.env.VITE_FREEPIK_KEY;
    
    if (!apiKey) {
      console.error('Missing VITE_FREEPIK_KEY environment variable');
      throw new Error('Freepik API key is not configured');
    }

    try {
      // Construir la URL y el body según el modelo seleccionado
      let url: string;
      let body: any;

      switch (model) {
        case FreepikModel.IMAGEN3:
          url = 'https://api.freepik.com/v1/ai/text-to-image/imagen3';
          body = {
            prompt: options.prompt,
            num_images: ('num_images' in options) ? options.num_images : 1,
            aspect_ratio: options.aspect_ratio || 'square_1_1',
            styling: ('styling' in options) ? options.styling : undefined,
            person_generation: ('person_generation' in options) ? options.person_generation : 'allow_all',
            safety_settings: ('safety_settings' in options) ? options.safety_settings : 'block_none'
          };
          break;

        case FreepikModel.CLASSIC:
          url = 'https://api.freepik.com/v1/ai/text-to-image';
          body = {
            prompt: options.prompt,
            negative_prompt: ('negative_prompt' in options) ? options.negative_prompt : undefined,
            styling: ('styling' in options) ? options.styling : undefined,
            guidance_scale: ('guidance_scale' in options) ? options.guidance_scale : 1,
            num_images: ('num_images' in options) ? options.num_images : 1,
            seed: ('seed' in options) ? options.seed : -1
          };
          break;
          
        case FreepikModel.FLUX_DEV:
          url = 'https://api.freepik.com/v1/ai/text-to-image/flux-dev';
          body = {
            prompt: options.prompt,
            aspect_ratio: options.aspect_ratio || 'square_1_1',
            styling: ('styling' in options) ? options.styling : undefined,
            seed: ('seed' in options) ? options.seed : undefined
          };
          break;
          
        case FreepikModel.MYSTIC:
        default:
          url = 'https://api.freepik.com/v1/ai/mystic';
          body = {
            prompt: options.prompt,
            resolution: ('resolution' in options) ? options.resolution : '2k',
            aspect_ratio: options.aspect_ratio || 'square_1_1',
            realism: ('realism' in options) ? options.realism : true,
            creative_detailing: ('creative_detailing' in options) ? options.creative_detailing : 33,
            engine: ('engine' in options) ? options.engine : 'automatic',
            fixed_generation: ('fixed_generation' in options) ? options.fixed_generation : false,
            filter_nsfw: ('filter_nsfw' in options) ? options.filter_nsfw : true
          };
          break;
      }

      // Hacer la solicitud a la API
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-freepik-api-key': apiKey
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Freepik API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return { data };
    } catch (error) {
      console.error(`Error generating image with Freepik (${model}):`, error);
      throw error;
    }
  },

  /**
   * Verifica el estado de una tarea de generación de imágenes
   * 
   * @param taskId ID de la tarea de generación
   * @param model Modelo de IA utilizado (default: MYSTIC)
   * @returns Promesa con la respuesta de la API
   */
  async checkTaskStatus(taskId: string, model: FreepikModel = FreepikModel.MYSTIC): Promise<FreepikResponse> {
    const apiKey = import.meta.env.VITE_FREEPIK_KEY;
    
    if (!apiKey) {
      console.error('Missing VITE_FREEPIK_KEY environment variable');
      throw new Error('Freepik API key is not configured');
    }

    try {
      // Construir la URL según el modelo
      let url: string;
      
      switch (model) {
        case FreepikModel.IMAGEN3:
          url = `https://api.freepik.com/v1/ai/text-to-image/imagen3/${taskId}`;
          break;
        case FreepikModel.FLUX_DEV:
          url = `https://api.freepik.com/v1/ai/text-to-image/flux-dev/${taskId}`;
          break;
        case FreepikModel.CLASSIC:
          // Classic no tiene endpoint de verificación asíncrona
          throw new Error('Classic model does not support task status checking');
        case FreepikModel.MYSTIC:
        default:
          url = `https://api.freepik.com/v1/ai/mystic/${taskId}`;
          break;
      }

      const response = await fetch(url, {
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
      console.error(`Error checking task status with Freepik (${model}):`, error);
      throw error;
    }
  },

  /**
   * Obtiene los modelos disponibles
   * @returns Lista de modelos disponibles con sus características
   */
  getAvailableModels() {
    return [
      {
        id: FreepikModel.MYSTIC,
        name: 'Mystic',
        description: 'La versión original de la API Freepik para generación de imágenes',
        features: ['Alta calidad', 'Generación asíncrona', 'Control de realismo']
      },
      {
        id: FreepikModel.IMAGEN3,
        name: 'Google Imagen 3',
        description: 'Modelo avanzado de Google para generación de imágenes de alta calidad',
        features: ['Última tecnología de Google', 'Mejor representación de personas', 'Estilos artísticos avanzados']
      },
      {
        id: FreepikModel.CLASSIC,
        name: 'Classic Fast',
        description: 'Generación rápida y directa de imágenes, sin espera',
        features: ['Generación instantánea', 'Negación de prompts', 'Control de guía creativa']
      },
      {
        id: FreepikModel.FLUX_DEV,
        name: 'Flux Developer',
        description: 'Modelo experimental de última generación en desarrollo',
        features: ['Tecnología avanzada', 'Experimental', 'Resultados variados']
      }
    ];
  }
};