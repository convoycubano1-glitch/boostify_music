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
  status?: 'pending' | 'processing' | 'completed' | 'failed';
  progress?: number;
  error?: string | {
    message?: string;
    error?: string;
    code?: number | string;
    [key: string]: any; // Para cualquier otra propiedad que pueda contener el objeto de error
  };
  images?: Array<{url: string} | string>;
  errorMessage?: string;
  resultImage?: string; // Para mantener compatibilidad con la interfaz del servidor
  requestId?: string;  // Para mantener compatibilidad con la interfaz del servidor
  createdAt?: string;
  id?: string;
}

/**
 * Interface for image validation result
 */
export interface ImageValidationResult {
  isValid: boolean;
  errorMessage?: string;
  width?: number;
  height?: number;
  originalFormat?: string;
  sizeInMB?: number;
  processedImage?: string;
  normalizedUrl?: string;
}

/**
 * Validate and process an image to ensure it meets Kling API requirements
 * This function handles JPEG format issues including missing Huffman tables and 0xFF00 sequences
 */
async function validateAndProcessImage(imageDataUrl: string): Promise<ImageValidationResult> {
  try {
    // Use our server-side processor to handle all JPEG corrections
    const response = await axios.post('/api/kling/process-image', { 
      imageData: imageDataUrl 
    });
    
    if (response.data.isValid) {
      return {
        isValid: true,
        width: response.data.width,
        height: response.data.height,
        originalFormat: response.data.originalFormat,
        sizeInMB: response.data.sizeInMB,
        processedImage: response.data.processedImage || response.data.normalizedUrl
      };
    } else {
      return {
        isValid: false,
        errorMessage: response.data.errorMessage || 'Unknown image validation error'
      };
    }
  } catch (error: any) {
    console.error('Error validating image:', error);
    return {
      isValid: false,
      errorMessage: error.response?.data?.error || error.message || 'Failed to process image'
    };
  }
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
      // First, validate and process both images to ensure they meet Kling's requirements
      const processedModelResult = await validateAndProcessImage(modelImage);
      if (!processedModelResult.isValid) {
        return {
          success: false,
          status: 'failed',
          errorMessage: `Model image error: ${processedModelResult.errorMessage}`
        };
      }
      
      const processedClothingResult = await validateAndProcessImage(clothingImage);
      if (!processedClothingResult.isValid) {
        return {
          success: false,
          status: 'failed',
          errorMessage: `Clothing image error: ${processedClothingResult.errorMessage}`
        };
      }

      const requestBody: TryOnRequest = {
        model: "kling",
        task_type: "ai_try_on", // Valor correcto verificado mediante pruebas directas con la API
        input: {
          model_input: processedModelResult.processedImage || modelImage,
          dress_input: processedClothingResult.processedImage || clothingImage,
          batch_size: 1
        }
      };

      const response = await axios.post('/api/kling/try-on/start', requestBody);
      return response.data;
    } catch (error: any) {
      console.error('Error starting Try-On:', error);
      
      // Handle API authentication errors specifically with more detail
      if (axios.isAxiosError(error) && 
          (error.response?.status === 401 || 
           error.response?.data?.message === 'Invalid API key' || 
           error.response?.data?.error === 'Invalid API key')) {
        console.error('❌ Authentication error with Kling API. Details:', error.response?.data);
        return {
          success: false,
          status: 'failed',
          errorMessage: 'Authentication error: The API key is invalid or has expired. Please contact the administrator.'
        };
      }
      
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          status: 'failed',
          errorMessage: error.response?.data?.message || error.message || 'Error al iniciar el Try-On'
        };
      }
      return {
        success: false,
        status: 'failed',
        errorMessage: 'Error desconocido al iniciar el Try-On'
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
    } catch (error: any) {
      console.error('Error checking Try-On status:', error);
      if (axios.isAxiosError(error)) {
        return {
          success: false,
          status: 'failed',
          errorMessage: error.response?.data?.message || error.message || 'Error al verificar el estado'
        };
      }
      return {
        success: false,
        status: 'failed',
        errorMessage: 'Error desconocido al verificar el estado'
      };
    }
  },
  
  /**
   * Save a completed try-on result
   * @param result TryOnResult containing taskId and resultImage
   * @returns boolean indicating success
   */
  saveResult: async (result: TryOnResult): Promise<boolean> => {
    try {
      if (!result.resultImage || !result.taskId) {
        throw new Error('No valid result to save');
      }
      
      await axios.post('/api/kling/save-result', {
        type: 'try-on',
        taskId: result.taskId,
        resultImage: result.resultImage
      });
      
      return true;
    } catch (error: any) {
      console.error('Error saving Try-On result:', error);
      return false;
    }
  },
  
  /**
   * Get all saved try-on results
   * @returns Array of TryOnResult
   */
  getResults: async (): Promise<TryOnResult[]> => {
    try {
      const response = await axios.get('/api/kling/results?type=try-on');
      return response.data.results || [];
    } catch (error: any) {
      console.error('Error fetching saved Try-On results:', error);
      return [];
    }
  }
};