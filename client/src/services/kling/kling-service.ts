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
      
      // Validación de formato de imagen antes de enviar al servidor
      this.validateImageDataUrl(modelImage, 'modelo');
      this.validateImageDataUrl(clothingImage, 'prenda');
      
      // Proceder con la solicitud después de validar
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

      // Validación mejorada de la respuesta
      if (!response) {
        console.error('Respuesta vacía de PiAPI/Kling');
        throw new Error('No se recibió respuesta del servidor al iniciar el proceso');
      }

      if (!response.success && !response.taskId) {
        console.error('Error en respuesta de PiAPI/Kling:', response);
        
        // Extraer mensaje de error específico si está disponible
        let errorMessage = 'Error iniciando proceso de Try-On';
        
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (typeof response.error === 'object') {
            errorMessage = response.error.message || 
                         response.error.detail || 
                         JSON.stringify(response.error);
          }
        } else if (response.message) {
          errorMessage = response.message;
        } else if (response.detail) {
          errorMessage = typeof response.detail === 'string' ? 
                        response.detail : 
                        JSON.stringify(response.detail);
        }
        
        // Agregar contexto específico para errores de formato de imagen
        if (errorMessage.includes('format') || 
            errorMessage.includes('jpeg') || 
            errorMessage.includes('jpg') || 
            errorMessage.includes('png')) {
          errorMessage = 'Error de formato: ' + errorMessage + 
                       '. La API solo acepta imágenes en formato JPEG.';
        }
        
        throw new Error(errorMessage);
      }

      console.log('Try-On iniciado con éxito:', response.taskId);
      return response.taskId;
    } catch (error) {
      console.error('Error en startTryOn:', error);
      throw error;
    }
  }
  
  /**
   * Valida que un data URL de imagen cumpla con los requisitos de la API
   * @param dataUrl URL de datos de la imagen
   * @param tipo Tipo de imagen (para mensajes de error más claros)
   * @throws Error si la imagen no cumple con los requisitos
   */
  private validateImageDataUrl(dataUrl: string, tipo: string): void {
    if (!dataUrl || typeof dataUrl !== 'string') {
      throw new Error(`La imagen de ${tipo} no es válida`);
    }
    
    if (!dataUrl.startsWith('data:image/')) {
      throw new Error(`La imagen de ${tipo} no tiene un formato de data URL válido`);
    }
    
    // PiAPI/Kling solo acepta imágenes JPEG
    const isJpeg = dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg');
    if (!isJpeg) {
      console.warn(`Formato de imagen de ${tipo} no soportado. Solo se acepta JPEG.`);
      throw new Error(`Error de formato: La imagen de ${tipo} debe estar en formato JPEG. Por favor, convierta la imagen antes de enviarla.`);
    }
    
    // Verificar estructura del data URL
    const parts = dataUrl.split(',');
    if (parts.length !== 2 || !parts[1]) {
      throw new Error(`La estructura del data URL de la imagen de ${tipo} no es válida`);
    }
    
    // Verificar que la codificación es base64
    if (!parts[0].toLowerCase().includes('base64')) {
      throw new Error(`La imagen de ${tipo} debe estar codificada en base64`);
    }
    
    // Verificar tamaño mínimo
    if (parts[1].length < 100) {
      throw new Error(`La imagen de ${tipo} es demasiado pequeña o está vacía`);
    }
    
    // Verificar tamaño máximo (aproximadamente 10MB en base64)
    const maxSizeInBytes = 10 * 1024 * 1024; // 10MB
    const estimatedSizeInBytes = (parts[1].length * 3) / 4; // Estimación aproximada
    
    if (estimatedSizeInBytes > maxSizeInBytes) {
      throw new Error(`La imagen de ${tipo} es demasiado grande (>10MB). Por favor, reduzca su tamaño.`);
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

      // Si la tarea falló, extraemos el mensaje de error más claro posible
      if (!response.success || response.status === 'failed') {
        console.error('Error en respuesta de status de PiAPI/Kling:', response);
        
        // Extraer mensaje de error de diferentes posibles estructuras de respuesta
        let errorMessage = 'Error al verificar estado de Try-On';
        
        if (response.error) {
          if (typeof response.error === 'string') {
            errorMessage = response.error;
          } else if (typeof response.error === 'object') {
            // Buscar el mensaje de error en diferentes propiedades del objeto
            errorMessage = response.error.message || 
                          response.error.raw_message || 
                          response.error.detail || 
                          JSON.stringify(response.error);
          }
        } else if (response.errorMessage) {
          errorMessage = response.errorMessage;
        } else if (response.message) {
          errorMessage = response.message;
        } else if (response.detail && typeof response.detail === 'object' && response.detail.error) {
          errorMessage = response.detail.error;
        }
        
        throw new Error(errorMessage);
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