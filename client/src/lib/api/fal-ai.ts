/**
 * Módulo para interactuar con la API de Fal.AI para generación de imágenes
 */

import axios from 'axios';

/**
 * Interfaz para los parámetros de generación de imágenes con Fal AI
 */
export interface GenerateImageParams {
  prompt: string;
  negative_prompt?: string;
  height?: number;
  width?: number;
  num_images?: number;
  model?: string;
}

/**
 * Interfaz para los resultados de generación de imágenes
 */
export interface GeneratedImageResult {
  success: boolean;
  images?: string[];
  error?: string;
}

/**
 * Genera imágenes utilizando la API de Fal AI a través de nuestro proxy
 * 
 * @param params Parámetros para la generación de imágenes
 * @returns Respuesta con las imágenes generadas o error
 */
export async function generateImageWithFal(params: GenerateImageParams): Promise<GeneratedImageResult> {
  try {
    // Usar nuestro proxy para acceder a la API de Fal.AI
    const response = await axios.post('/api/proxy/fal/generate', {
      prompt: params.prompt,
      negative_prompt: params.negative_prompt || '',
      height: params.height || 512,
      width: params.width || 512,
      num_images: params.num_images || 1,
      model: params.model || 'stable-diffusion'
    });

    // Verificar si la respuesta contiene imágenes
    if (response.data && response.data.images) {
      return {
        success: true,
        images: response.data.images
      };
    } else if (response.data && response.data.fallback && response.data.fallback.images) {
      // Manejar el caso de fallback
      return {
        success: true,
        images: response.data.fallback.images
      };
    } else {
      // Respuesta válida pero sin imágenes
      return {
        success: false,
        error: 'No se generaron imágenes'
      };
    }
  } catch (error) {
    console.error('Error al generar imágenes con Fal AI:', error);
    
    // Extraer mensaje de error
    let errorMessage = 'Error desconocido al generar imágenes';
    if (axios.isAxiosError(error) && error.response) {
      errorMessage = error.response.data?.error || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return {
      success: false,
      error: errorMessage
    };
  }
}