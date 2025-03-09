/**
 * Servicio para interactuar con la API de Flux (PiAPI)
 * Proporciona funciones para crear y verificar tareas de generación de imágenes
 */

// Interfaces para los parámetros de generación de imágenes
export interface FluxGenerationParams {
  prompt: string;
  style?: string;
  aspectRatio?: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}

// Interfaz para la respuesta de la API
export interface FluxTaskResponse {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  output?: {
    images?: string[];
  };
  error?: string;
}

// Mapeo de proporciones a dimensiones en píxeles
const aspectRatioToDimensions = {
  '1:1': { width: 1024, height: 1024 },
  '4:3': { width: 1024, height: 768 },
  '3:4': { width: 768, height: 1024 },
  '16:9': { width: 1024, height: 576 },
  '9:16': { width: 576, height: 1024 },
};

// Mapeo de estilos a prompts adicionales
const styleToPromptEnhancement = {
  'cinematográfico': 'professional cinematic photography, film grain, dramatic lighting',
  'realista': 'photorealistic, highly detailed, professional photography',
  'digital': 'digital art, vibrant colors, clean lines, detailed',
  'acuarela': 'watercolor painting, soft colors, artistic, hand-painted',
  'abstracto': 'abstract art, non-figurative, colorful shapes and patterns',
};

/**
 * Crea una nueva tarea de generación de imagen con Flux API
 * @param params Parámetros para la generación de la imagen
 * @returns Respuesta de la API con ID de tarea
 */
export async function createFluxImageTask(params: FluxGenerationParams): Promise<FluxTaskResponse> {
  try {
    // Determinar dimensiones basadas en la proporción seleccionada
    let width = 1024;
    let height = 1024;
    if (params.aspectRatio && aspectRatioToDimensions[params.aspectRatio]) {
      width = aspectRatioToDimensions[params.aspectRatio].width;
      height = aspectRatioToDimensions[params.aspectRatio].height;
    }

    // Mejorar el prompt con el estilo seleccionado
    let enhancedPrompt = params.prompt;
    if (params.style && styleToPromptEnhancement[params.style.toLowerCase()]) {
      enhancedPrompt += `, ${styleToPromptEnhancement[params.style.toLowerCase()]}`;
    }

    // Crear la estructura de la solicitud
    const requestBody = {
      model: "Qubico/flux1-dev",
      task_type: "txt2img",
      input: {
        prompt: enhancedPrompt,
        negative_prompt: params.negativePrompt || "blurry, distorted, low quality, ugly, deformed",
        width,
        height
      }
    };

    // Enviar la solicitud al proxy del servidor para proteger la clave API
    const response = await fetch('/api/proxy/flux/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al crear la tarea de generación');
    }

    return {
      taskId: data.taskId || '',
      status: data.status || 'pending',
      output: data.output,
      error: data.error
    };
  } catch (error) {
    console.error('Error al crear tarea de Flux:', error);
    return {
      taskId: '',
      status: 'failed',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Verifica el estado de una tarea de generación de imagen
 * @param taskId ID de la tarea a verificar
 * @returns Estado actualizado de la tarea
 */
export async function checkFluxTaskStatus(taskId: string): Promise<FluxTaskResponse> {
  try {
    const response = await fetch(`/api/proxy/flux/status?taskId=${taskId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Error al verificar estado de la tarea');
    }

    return {
      taskId,
      status: data.status || 'pending',
      output: data.output,
      error: data.error
    };
  } catch (error) {
    console.error('Error al verificar estado de tarea Flux:', error);
    return {
      taskId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}