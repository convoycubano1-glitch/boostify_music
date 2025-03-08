import { apiRequest } from '@/lib/queryClient';

/**
 * Tipos para las funciones de Kling API
 */

// Tipo común para solicitudes asíncronas
export interface KlingAsyncRequest {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: Date | any; // 'any' para manejar Timestamps de Firestore
  createdAt?: Date | any; // Campo adicional para manejar Timestamps de Firestore
  error?: string;
}

// Virtual Try-On
export interface TryOnRequest extends KlingAsyncRequest {
  modelImage: string;
  clothingImage: string;
  settings?: {
    preserve_model_details?: boolean;
    preserve_clothing_details?: boolean;
    enhance_face?: boolean;
    alignment?: 'auto' | 'manual';
    position_offset?: { x: number; y: number };
  };
}

export interface TryOnResult {
  resultImage: string;
  requestId: string;
  modelImage: string;
  clothingImage: string;
  createdAt?: Date | any; // Campo de fecha para el ordenamiento y visualización
  id?: string; // Para identificar documentos guardados en Firestore
}

// Lipsync
export interface LipsyncRequest extends KlingAsyncRequest {
  videoSource: string;
  audioSource: string | null;
  textContent: string | null;
  settings?: {
    preserve_expressions?: boolean;
    enhance_clarity?: boolean;
    language?: 'en' | 'es' | 'fr' | 'auto';
    voice_gender?: 'male' | 'female' | 'neutral';
  };
}

export interface LipsyncResult {
  resultVideo: string;
  requestId: string;
  originalVideo: string;
  audioUsed?: string;
  createdAt?: Date | any; // Campo de fecha para el ordenamiento y visualización
  id?: string; // Para identificar documentos guardados en Firestore
}

// Effects
export interface EffectsRequest extends KlingAsyncRequest {
  sourceImage: string;
  effectType: 'squish' | 'expansion' | 'zoom' | 'twirl' | 'wave' | 'custom';
  customEffect?: {
    keyframes: any[]; // Definición de keyframes para efectos personalizados
    duration: number;
  };
  settings?: {
    duration: number;
    intensity: number;
    loop: boolean;
    output_format: 'mp4' | 'gif';
    resolution: string;
  };
}

export interface EffectsResult {
  resultVideo: string;
  requestId: string;
  originalImage: string;
  effectType: string;
  createdAt?: Date | any; // Campo de fecha para el ordenamiento y visualización
  id?: string; // Para identificar documentos guardados en Firestore
}

/**
 * Servicio para interactuar con la API de Kling
 * 
 * Este servicio proporciona métodos para:
 * - Virtual Try-On: Superponer prendas de ropa en imágenes de personas
 * - Lipsync: Sincronizar labios en videos con audio o texto
 * - Effects: Aplicar efectos especiales a imágenes para crear videos animados
 */
class KlingService {
  /**
   * Inicia una tarea de Virtual Try-On
   * @param modelImage URL o base64 de la imagen de la persona
   * @param clothingImage URL o base64 de la prenda de ropa
   * @param settings Configuraciones opcionales
   * @returns ID de la tarea iniciada
   */
  async startTryOn(
    modelImage: string,
    clothingImage: string,
    settings?: TryOnRequest['settings']
  ): Promise<string> {
    try {
      console.log('Iniciando proceso de Try-On con PiAPI/Kling');
      
      const response = await apiRequest({
        url: '/api/proxy/kling/try-on/start',
        method: 'POST',
        data: {
          model_input: modelImage,
          dress_input: clothingImage,
          // Configuración requerida por PiAPI
          batch_size: 1,
          task_type: "ai_try_on",
          settings
        }
      });

      if (!response.success && !response.taskId) {
        console.error('Error en respuesta de PiAPI/Kling:', response);
        throw new Error(response.error || 'Error iniciando proceso de Try-On');
      }

      console.log('Try-On iniciado con éxito:', response.taskId);
      return response.taskId;
    } catch (error) {
      console.error('Error en startTryOn:', error);
      throw error;
    }
  }

  /**
   * Verifica el estado de una tarea de Virtual Try-On
   * @param taskId ID de la tarea
   * @returns Estado actual de la tarea
   */
  async checkTryOnStatus(taskId: string): Promise<TryOnRequest> {
    try {
      console.log('Verificando estado de Try-On:', taskId);
      
      const response = await apiRequest({
        url: `/api/proxy/kling/try-on/status`,
        method: 'POST',
        data: { taskId }
      });

      // Validación mejorada de la respuesta
      if (!response) {
        console.error('Respuesta vacía al verificar estado de Try-On');
        throw new Error('No se recibió respuesta del servidor al verificar el estado');
      }

      if (!response.success) {
        console.error('Error en respuesta de status de PiAPI/Kling:', response);
        throw new Error(response.error || 'Error al verificar estado de Try-On');
      }

      // Normalizamos la respuesta para que sea compatible con nuestra interfaz
      // Esto mejora la compatibilidad entre diferentes formatos de respuesta de la API
      
      // Normalizar el campo status si no existe
      if (!response.status && (response.state || response.task_status)) {
        response.status = response.state || response.task_status;
      }
      
      // Normalizar URL del resultado para diferentes formatos de respuesta
      if (response.status === 'completed') {
        // Buscamos la URL en diferentes ubicaciones posibles
        if (!response.resultImage) {
          // Opción 1: URL directa
          if (response.url) {
            response.resultImage = response.url;
            console.log('URL normalizada desde campo url');
          } 
          // Opción 2: Array de imágenes
          else if (response.images && Array.isArray(response.images) && response.images.length > 0) {
            const firstImage = response.images[0];
            response.resultImage = typeof firstImage === 'string' ? firstImage : firstImage.url;
            console.log('URL normalizada desde images[0]');
          }
          // Opción 3: En objeto output
          else if (response.output) {
            if (typeof response.output === 'string') {
              response.resultImage = response.output;
              console.log('URL normalizada desde output (string)');
            } else if (response.output.url) {
              response.resultImage = response.output.url;
              console.log('URL normalizada desde output.url');
            } else if (response.output.images && Array.isArray(response.output.images) && response.output.images.length > 0) {
              const firstImage = response.output.images[0];
              response.resultImage = typeof firstImage === 'string' ? firstImage : firstImage.url;
              console.log('URL normalizada desde output.images[0]');
            }
          }
          // Opción 4: En objeto result
          else if (response.result) {
            if (typeof response.result === 'string') {
              response.resultImage = response.result;
              console.log('URL normalizada desde result (string)');
            } else if (response.result.url) {
              response.resultImage = response.result.url;
              console.log('URL normalizada desde result.url');
            } else if (response.result.images && Array.isArray(response.result.images) && response.result.images.length > 0) {
              const firstImage = response.result.images[0];
              response.resultImage = typeof firstImage === 'string' ? firstImage : firstImage.url;
              console.log('URL normalizada desde result.images[0]');
            }
          }
        }
      }

      console.log('Estado normalizado de Try-On:', response.status);
      return response;
    } catch (error) {
      console.error('Error en checkTryOnStatus:', error);
      throw error;
    }
  }

  /**
   * Inicia una tarea de Lipsync
   * @param videoSource URL o base64 del video
   * @param audioSource URL o base64 del audio (opcional si se proporciona texto)
   * @param textContent Texto para generar audio (opcional si se proporciona audio)
   * @param settings Configuraciones opcionales
   * @returns ID de la tarea iniciada
   */
  async startLipsync(
    videoSource: string,
    audioSource: string | null = null,
    textContent: string | null = null,
    settings?: LipsyncRequest['settings']
  ): Promise<string> {
    if (!audioSource && !textContent) {
      throw new Error('Debe proporcionar audio o texto para la sincronización de labios');
    }

    const response = await apiRequest({
      url: '/api/proxy/kling/lipsync/start',
      method: 'POST',
      data: {
        videoSource,
        audioSource,
        textContent,
        settings
      }
    });

    return response.taskId;
  }

  /**
   * Verifica el estado de una tarea de Lipsync
   * @param taskId ID de la tarea
   * @returns Estado actual de la tarea
   */
  async checkLipsyncStatus(taskId: string): Promise<LipsyncRequest> {
    const response = await apiRequest({
      url: `/api/proxy/kling/lipsync/status`,
      method: 'POST',
      data: { taskId }
    });

    return response;
  }

  /**
   * Inicia una tarea de Effects para convertir una imagen en un video con efectos
   * @param sourceImage URL o base64 de la imagen
   * @param effectType Tipo de efecto a aplicar
   * @param settings Configuraciones opcionales
   * @param customEffect Configuración de efecto personalizado (solo para type='custom')
   * @returns ID de la tarea iniciada
   */
  async startEffects(
    sourceImage: string,
    effectType: EffectsRequest['effectType'],
    settings?: EffectsRequest['settings'],
    customEffect?: EffectsRequest['customEffect']
  ): Promise<string> {
    const response = await apiRequest({
      url: '/api/proxy/kling/effects/start',
      method: 'POST',
      data: {
        sourceImage,
        effectType,
        settings,
        customEffect: effectType === 'custom' ? customEffect : undefined
      }
    });

    return response.taskId;
  }

  /**
   * Verifica el estado de una tarea de Effects
   * @param taskId ID de la tarea
   * @returns Estado actual de la tarea
   */
  async checkEffectsStatus(taskId: string): Promise<EffectsRequest> {
    const response = await apiRequest({
      url: `/api/proxy/kling/effects/status`,
      method: 'POST',
      data: { taskId }
    });

    return response;
  }

  /**
   * Guarda un resultado procesado en la base de datos
   * @param type Tipo de resultado ('try-on', 'lipsync', 'effects')
   * @param result Datos del resultado
   * @returns ID del documento guardado
   */
  async saveResult(
    type: 'try-on' | 'lipsync' | 'effects',
    result: TryOnResult | LipsyncResult | EffectsResult
  ): Promise<string> {
    const response = await apiRequest({
      url: '/api/proxy/kling/save-result',
      method: 'POST',
      data: {
        type,
        result
      }
    });

    return response.id;
  }

  /**
   * Obtiene los resultados guardados por el usuario
   * @param type Tipo de resultado a obtener ('try-on', 'lipsync', 'effects', 'all')
   * @returns Lista de resultados
   */
  async getResults(
    type: 'try-on' | 'lipsync' | 'effects' | 'all' = 'all'
  ): Promise<Array<TryOnResult | LipsyncResult | EffectsResult>> {
    const response = await apiRequest({
      url: `/api/proxy/kling/results?type=${type}`,
      method: 'GET'
    });
    
    // Process all results to properly handle dates from Firestore
    const results = response.results || [];
    
    return results.map((result: any) => {
      // Normalize creation date if present
      if (result.createdAt) {
        // Handle Firebase Timestamp format
        if (result.createdAt.seconds) {
          result.createdAt = new Date(result.createdAt.seconds * 1000);
        } else if (typeof result.createdAt === 'string') {
          result.createdAt = new Date(result.createdAt);
        }
      }
      
      return result;
    });
  }
}

// Exportamos una instancia única del servicio
export const klingService = new KlingService();