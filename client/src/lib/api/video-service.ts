/**
 * Servicio para manejar las operaciones de generación y seguimiento de videos
 */

import { apiRequest } from '@/lib/queryClient';

export interface VideoGenerationOptions {
  prompt: string;
  image_url?: string;  // Para modelos i2v-01, i2v-01-live, s2v-01
  duration?: number;
  expand_prompt?: boolean;
  style?: string;
  width?: number;
  height?: number;
  fps?: number;
  model?: 't2v-01' | 't2v-01-director' | 'i2v-01' | 'i2v-01-live' | 's2v-01';  // Modelos soportados por Hailuo API
  camera_movement?: string; // Para t2v-01-director
}

export interface VideoStatusResponse {
  success: boolean;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  result?: {
    url: string;
    task_id: string;
  };
  error?: string;
}

/**
 * Inicia la generación de un video con PiAPI/Hailuo
 * 
 * Soporta diferentes modelos:
 * - t2v-01: Modelo estándar de texto a video
 * - t2v-01-director: Modelo texto a video con soporte para movimientos de cámara
 * - i2v-01: Modelo estándar de imagen a video
 * - i2v-01-live: Modelo imagen a video con efecto live
 * - s2v-01: Modelo de subject reference video (requiere imagen con rostro)
 */
export async function generateVideo(options: VideoGenerationOptions): Promise<VideoStatusResponse> {
  try {
    // Crear objeto de datos a enviar
    const requestData: any = {
      prompt: options.prompt,
      model: options.model || 't2v-01-director',
      expand_prompt: options.expand_prompt !== undefined ? options.expand_prompt : true
    };
    
    // Agregar parámetros opcionales solo si están definidos
    if (options.image_url) {
      requestData.image_url = options.image_url;
    }
    
    if (options.duration) {
      requestData.duration = options.duration;
    }
    
    if (options.style) {
      requestData.style = options.style;
    }
    
    if (options.width) {
      requestData.width = options.width;
    }
    
    if (options.height) {
      requestData.height = options.height;
    }
    
    if (options.fps) {
      requestData.fps = options.fps;
    }
    
    // Gestión especial para movimientos de cámara en t2v-01-director
    if (options.camera_movement && options.model === 't2v-01-director') {
      requestData.camera_movement = options.camera_movement;
    }

    const response = await apiRequest({
      url: '/api/proxy/piapi/video/start',
      method: 'POST',
      data: requestData
    });

    return response as VideoStatusResponse;
  } catch (error: any) {
    console.error('Error al iniciar generación de video:', error);
    throw new Error(error.message || 'Error al iniciar la generación');
  }
}

/**
 * Verifica el estado actual de una generación de video
 */
export async function checkVideoStatus(taskId: string): Promise<VideoStatusResponse> {
  try {
    const response = await apiRequest({
      url: '/api/proxy/piapi/video/status',
      method: 'GET',
      params: { taskId }
    });

    return response as VideoStatusResponse;
  } catch (error: any) {
    console.error('Error al verificar estado del video:', error);
    throw new Error(error.message || 'Error al verificar el estado');
  }
}

/**
 * Guarda un resultado de video generado en Firestore
 */
export async function saveVideoResult(result: any) {
  try {
    const response = await apiRequest({
      url: '/api/proxy/piapi/video/save',
      method: 'POST',
      data: result
    });

    return response;
  } catch (error: any) {
    console.error('Error al guardar resultado del video:', error);
    throw new Error(error.message || 'Error al guardar el resultado');
  }
}

/**
 * Obtiene el historial de videos generados del usuario
 */
export async function getVideoHistory() {
  try {
    const response = await apiRequest({
      url: '/api/proxy/piapi/video/history',
      method: 'GET'
    });

    return response;
  } catch (error: any) {
    console.error('Error al obtener historial de videos:', error);
    throw new Error(error.message || 'Error al obtener el historial');
  }
}