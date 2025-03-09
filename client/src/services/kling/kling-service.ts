import axios from 'axios';

// Interfaces para las peticiones de Try-On
export interface TryOnRequest {
  model: string;
  task_type: string;
  input: {
    model_input: string;
    dress_input: string;
    batch_size: number;
  };
}

// Interfaces para las respuestas de Try-On
export interface TryOnResult {
  success: boolean;
  taskId?: string;
  status?: string;
  error?: string | {
    message?: string;
    error?: string;
    code?: number | string;
    [key: string]: any; // Para cualquier otra propiedad que pueda contener el objeto de error
  };
  images?: Array<{url: string} | string>;
  errorMessage?: string | {
    message?: string;
    error?: string;
    code?: number | string;
    [key: string]: any; // Para cualquier otra propiedad que pueda contener el objeto de error
  };
  resultImage?: string; // Para mantener compatibilidad con la interfaz del servidor
  requestId?: string;  // Para mantener compatibilidad con la interfaz del servidor
}

// Servicio para interactuar con la API de Kling
export const klingService = {
  /**
   * Inicia un proceso de Try-On 
   * @param modelImage Imagen del modelo en formato data URL
   * @param clothingImage Imagen de la prenda en formato data URL
   * @returns Resultado con el ID de la tarea para seguimiento
   */
  startTryOn: async (modelImage: string, clothingImage: string): Promise<TryOnResult> => {
    try {
      const requestBody: TryOnRequest = {
        model: "kling",
        task_type: "ai_try_on", // Valor correcto verificado mediante pruebas directas con la API
        input: {
          model_input: modelImage,
          dress_input: clothingImage,
          batch_size: 1
        }
      };

      const response = await axios.post('/api/kling/try-on/start', requestBody);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.message || error.message || 'Error al iniciar el Try-On'
        };
      }
      return {
        success: false,
        error: 'Error desconocido al iniciar el Try-On'
      };
    }
  },

  /**
   * Verifica el estado de un proceso de Try-On
   * @param taskId ID de la tarea a verificar
   * @returns Estado actual del proceso
   */
  checkTryOnStatus: async (taskId: string): Promise<TryOnResult> => {
    try {
      const response = await axios.post('/api/kling/try-on/status', { taskId });
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          error: error.response?.data?.message || error.message || 'Error al verificar el estado'
        };
      }
      return {
        success: false,
        error: 'Error desconocido al verificar el estado'
      };
    }
  },

  /**
   * Guarda un resultado de Try-On exitoso en el servidor
   * @param result Resultado del Try-On a guardar 
   * @returns true si se guardó correctamente, false en caso contrario
   */
  saveResult: async (result: TryOnResult): Promise<boolean> => {
    try {
      const response = await axios.post('/api/kling/save-result', { 
        type: 'try-on', 
        result 
      });
      return response.data.success;
    } catch (error) {
      console.error('Error al guardar el resultado:', error);
      return false;
    }
  },

  /**
   * Obtiene resultados guardados de Try-On desde el servidor
   * @param type Tipo de resultado a obtener ('try-on', 'lipsync', 'effects', etc.)
   * @returns Lista de resultados guardados
   */
  getResults: async (type: string = 'try-on'): Promise<TryOnResult[]> => {
    try {
      const response = await axios.get(`/api/kling/results?type=${type}`);
      return response.data.results || [];
    } catch (error) {
      console.error('Error al obtener resultados guardados:', error);
      return [];
    }
  }
};