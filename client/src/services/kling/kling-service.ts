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
  error?: string;
  images?: Array<{url: string} | string>;
  errorMessage?: string;
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
        task_type: "ai_try_on",
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
  }
};