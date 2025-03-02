/**
 * API Proxy Router
 * Este router funciona como proxy para servicios externos, gestionando:
 * - Autenticación con claves API
 * - Solicitudes a servicios externos
 * - Resolución de problemas CORS
 * - Gestión de errores y respuestas de fallback
 */

import { Router } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import { log } from '../vite';

dotenv.config();

const router = Router();

// Configuración de claves API
const FAL_API_KEY = process.env.FAL_API_KEY || '';
const KLING_API_KEY = process.env.VITE_KLING_API_KEY || process.env.KLING_API_KEY || '';
const LUMA_API_KEY = process.env.LUMA_API_KEY || '';
const FREEPIK_API_KEY = process.env.FREEPIK_API_KEY || '';
const PIAPI_API_KEY = process.env.PIAPI_API_KEY || '';

/**
 * Verificar que todas las claves API requeridas estén configuradas
 */
function verifyApiKeys() {
  const missingKeys = [];
  
  if (!FAL_API_KEY) missingKeys.push('FAL_API_KEY');
  if (!KLING_API_KEY) missingKeys.push('KLING_API_KEY');
  if (!LUMA_API_KEY) missingKeys.push('LUMA_API_KEY');
  if (!FREEPIK_API_KEY) missingKeys.push('FREEPIK_API_KEY');
  if (!PIAPI_API_KEY) missingKeys.push('PIAPI_API_KEY');
  
  if (missingKeys.length > 0) {
    log(`⚠️ Missing API keys: ${missingKeys.join(', ')}`, 'api-proxy');
  } else {
    log('✅ All API keys are configured', 'api-proxy');
  }
}

// Verificar claves al inicio
verifyApiKeys();

/**
 * Proxy para generación de imágenes con Fal.ai
 * 
 * Nota importante sobre la estructura de respuesta de Fal.ai:
 * - Éxito real: { images: [...], request_id: string }
 * - Fallback: { fallback: { images: [...], request_id: string }, error_info: string }
 */
router.post('/fal/generate-image', async (req, res) => {
  // Wrapper para manejar todos los errores y responder con estructura fallback
  try {
    const { prompt, negativePrompt, imageSize, imageCount } = req.body;
    
    if (!prompt) {
      // Retornar un error claro sin fallback a Unsplash
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Prompt is required',
        success: false
      });
    }

    if (!FAL_API_KEY) {
      // Retornar un error claro sin fallback a Unsplash
      return res.status(500).json({
        error: 'CONFIGURATION_ERROR',
        message: 'FAL_API_KEY is not configured',
        success: false
      });
    }

    // Intento de llamada a API con manejo de errores específico
    try {
      const response = await axios.post(
        'https://api.fal.ai/v1/p/stable-diffusion-xl',
        {
          prompt: prompt,
          negative_prompt: negativePrompt || 'blurry, bad quality, distorted, disfigured',
          height: imageSize === 'large' ? 1024 : 768,
          width: imageSize === 'large' ? 1024 : 768,
          num_images: imageCount || 1
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Key ${FAL_API_KEY}`
          },
          timeout: 5000 // Timeout para evitar esperas largas
        }
      );

      // Respuesta exitosa con estructura normal
      return res.json({
        images: response.data.images,
        request_id: response.data.request_id
      });
    } catch (apiError: any) {
      console.error('Error calling Fal.ai API:', apiError.message);
      
      // Error de API sin fallback a Unsplash
      return res.status(500).json({
        error: 'API_ERROR',
        message: apiError.message,
        success: false
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in Fal.ai proxy:', error);
    
    // Error inesperado sin fallback a Unsplash
    return res.status(500).json({
      error: 'UNEXPECTED_ERROR',
      message: error.message || 'Unexpected error',
      success: false
    });
  }
});

/**
 * Proxy para generación de imágenes con Freepik (API Mystic)
 * 
 * Documentación: https://api.freepik.com/docs/
 * 
 * Es un servicio de generación asíncrono:
 * 1. POST a /v1/ai/mystic inicia la generación y devuelve un task_id
 * 2. GET a /v1/ai/mystic/{task_id} para obtener el estado de la generación
 * 3. Las imágenes generadas estarán disponibles cuando status = "COMPLETED"
 */
router.post('/freepik/generate-image', async (req, res) => {
  try {
    console.log('Recibida solicitud para generar imagen con Freepik:', JSON.stringify(req.body));
    
    const { 
      prompt, 
      negativePrompt = '',
      aspectRatio = '1:1',
      count = 1
    } = req.body;
    
    // Mapeamos el aspectRatio al formato esperado por Freepik
    let aspect_ratio = 'square_1_1'; // Valor predeterminado
    const aspectRatioMap: Record<string, string> = {
      '1:1': 'square_1_1',
      '4:3': 'classic_4_3',
      '3:4': 'traditional_3_4',
      '16:9': 'widescreen_16_9',
      '9:16': 'social_story_9_16'
    };
    
    if (aspectRatio in aspectRatioMap) {
      aspect_ratio = aspectRatioMap[aspectRatio];
    }
    
    if (!prompt) {
      // Enviamos una respuesta de error con status 400
      console.log('Error: Prompt vacío en solicitud a Freepik');
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Prompt is required',
        success: false
      });
    }

    if (!FREEPIK_API_KEY) {
      // Si no hay API key, retornar error con status 500
      console.log('Error: No se encontró FREEPIK_API_KEY');
      return res.status(500).json({
        error: 'CONFIGURATION_ERROR',
        message: 'FREEPIK_API_KEY is not configured',
        success: false
      });
    }

    // Ahora que tenemos la clave API configurada, llamamos directamente a la API de Freepik
    try {
      console.log('Realizando llamada real a la API de Freepik Mystic');
      
      // Construir los headers para la API
      const headers = {
        'X-Freepik-API-Key': FREEPIK_API_KEY,
        'Content-Type': 'application/json'
      };
      
      // Llamar a la API para iniciar la generación (proceso asíncrono)
      const response = await axios.post(
        'https://api.freepik.com/v1/ai/mystic',
        {
          prompt: prompt,
          aspect_ratio: aspect_ratio,
          realism: true,
          creative_detailing: 33,
          engine: 'automatic',
          fixed_generation: false,
          filter_nsfw: true
        },
        { headers }
      );
      
      // Verificar la respuesta y extraer el task_id
      // La respuesta de Freepik puede tener el task_id en data.task_id o en data.data.task_id
      const taskId = 
        (response.data && response.data.task_id) ? response.data.task_id : 
        (response.data && response.data.data && response.data.data.task_id) ? response.data.data.task_id : 
        null;
        
      if (taskId) {
        // Devolver el task_id para que el cliente pueda verificar el estado
        console.log('Generación iniciada exitosamente en Freepik, task_id:', taskId);
        return res.status(200).json({
          task_id: taskId,
          status: 'processing'
        });
      } else {
        // Si no hay task_id, algo salió mal
        console.error('Respuesta de Freepik no contiene task_id:', response.data);
        throw new Error('Missing task_id in Freepik response');
      }
    } catch (apiError: any) {
      // En caso de error en la API, retornamos un error
      console.error('Error llamando a la API de Freepik:', apiError.message);
      return res.status(500).json({
        error: 'API_ERROR',
        message: apiError.message || 'Error calling Freepik API',
        success: false
      });
    }
  } catch (error: any) {
    // Si ocurre cualquier error, retornamos un error
    console.error('Error inesperado en Freepik proxy:', error.message);
    return res.status(500).json({
      error: 'UNEXPECTED_ERROR',
      message: error.message || 'Error inesperado',
      success: false
    });
  }
});

/**
 * Proxy para generación de imágenes con Kling
 * 
 * Documentación: https://docs.qingque.cn/d/home/eZQCQxBrX8eeImjK6Ddz5iOi5
 * 
 * Kling ofrece una API de generación de imágenes similar a DALL-E pero con características propias
 */
router.post('/kling/generate-image', async (req, res) => {
  try {
    const { 
      prompt, 
      negative_prompt = '', 
      size = 'medium', 
      n = 1,
      style = 'general',
      quality = 'standard'
    } = req.body;
    
    if (!prompt) {
      // Retornamos un error con código 400
      return res.status(400).json({ 
        error: 'VALIDATION_ERROR',
        message: 'Prompt is required',
        success: false
      });
    }

    // Si no hay API key, retornamos un error con código 500
    if (!KLING_API_KEY) {
      return res.status(500).json({
        error: 'CONFIGURATION_ERROR',
        message: 'KLING_API_KEY is not configured',
        success: false
      });
    }

    try {
      // Intentar hacer la solicitud a la API externa con un timeout para evitar esperas largas
      const response = await axios.post(
        'https://api.kling.ai/v1/images/generations',
        {
          prompt,
          negative_prompt,
          size,
          n,
          style,
          quality
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KLING_API_KEY}`
          },
          timeout: 8000 // Timeout ampliado a 8 segundos para dar más tiempo a la generación
        }
      );

      // Si la solicitud es exitosa, devolvemos los datos normalmente
      // La respuesta esperada de Kling tiene este formato:
      // { data: [{ url: 'https://...' }, ...], id: 'gen-123456' }
      return res.json({
        data: response.data.data,
        id: response.data.id
      });
    } catch (apiError: any) {
      // Si la solicitud a la API externa falla, retornamos un error con status 500
      console.error('Error calling Kling API:', apiError.message);
      
      return res.status(500).json({
        error: 'API_ERROR',
        message: apiError.message,
        success: false
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in Kling proxy:', error);
    
    // Para errores inesperados, retornamos un error con status 500
    return res.status(500).json({
      error: 'UNEXPECTED_ERROR',
      message: error.message || 'Unexpected error',
      success: false
    });
  }
});

/**
 * Proxy para generación de videos con Luma
 * 
 * Luma.ai ofrece un servicio de generación de videos de alta calidad usando IA.
 * Similar a Kling, este servicio es asíncrono y requiere polling para obtener el resultado final.
 * 
 * Documentación: https://docs.luma-ai.com/realtime/api
 */
router.post('/luma/generate-video', async (req, res) => {
  try {
    const { 
      prompt, 
      duration = 4, 
      style = 'cinematic',
      aspectRatio = '16:9', 
      seed = Math.floor(Math.random() * 1000000)
    } = req.body;
    
    if (!prompt) {
      // Incluso los errores de validación deberían usar código 200 con mensaje de error
      return res.json({ 
        id: `fallback-luma-validation-error-${Date.now()}`,
        output: { 
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' 
        },
        fallback: true,
        error_info: 'Prompt is required'
      });
    }

    if (!LUMA_API_KEY) {
      // Si no hay API key, devolver inmediatamente la respuesta de fallback en un formato exitoso
      return res.json({
        id: `fallback-luma-no-api-key-${Date.now()}`,
        output: { 
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' 
        },
        fallback: true,
        error_info: 'LUMA_API_KEY is not configured'
      });
    }

    try {
      // Ahora que tenemos la clave API, hacemos una llamada real a la API de Luma
      console.log('Realizando llamada real a la API de Luma para generar video');
      
      // Preparar los parámetros para la API
      const apiParams = {
        prompt,
        duration,
        style,
        aspect_ratio: aspectRatio,
        seed
      };
      
      console.log('Parámetros para API de Luma:', apiParams);
      
      const response = await axios.post(
        'https://api.lumalabs.ai/v1/video',
        apiParams,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${LUMA_API_KEY}`
          },
          timeout: 20000 // Timeout ampliado para generación de video
        }
      );
      
      console.log('Respuesta de API de Luma:', response.data);
      
      // La respuesta inicial tiene un ID que se debe utilizar para verificar el estado
      if (response.data && response.data.id) {
        // Retornar el ID para que el cliente pueda verificar el estado
        return res.json({
          id: response.data.id,
          status: response.data.status || 'pending',
          output: response.data.output || null
        });
      } else {
        // Si no hay ID, algo salió mal con la API
        console.error('Respuesta de Luma no contiene ID:', response.data);
        throw new Error('Missing ID in Luma response');
      }
    } catch (apiError: any) {
      console.error('Error calling Luma API:', apiError.message);
      
      // Devolver respuesta de fallback con éxito (código 200) para que el cliente no muestre error
      return res.json({
        id: `fallback-luma-api-error-${Date.now()}`,
        status: 'failed', 
        output: { 
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' 
        },
        fallback: true,
        error_info: apiError.message
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in Luma proxy:', error);
    
    // Aunque haya un error inesperado, seguimos devolviendo una respuesta exitosa con fallback
    return res.json({
      id: `fallback-luma-unexpected-error-${Date.now()}`,
      status: 'failed',
      output: { 
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4' 
      },
      fallback: true,
      error_info: error.message || 'Unexpected error'
    });
  }
});

/**
 * Proxy para generación de videos con Kling
 * 
 * Documentación: https://docs.qingque.cn/d/home/eZQCQxBrX8eeImjK6Ddz5iOi5
 * 
 * Kling ofrece un endpoint para generar videos a partir de texto.
 * Este es un servicio asíncrono que:
 * 1. Inicia la generación y devuelve un ID
 * 2. Requiere verificar el estado de la generación periodicamente
 */
router.post('/kling/generate-video', async (req, res) => {
  try {
    const { 
      prompt, 
      duration = 5, 
      style = 'cinematic',
      width = 768,
      height = 432,
      fps = 30
    } = req.body;
    
    if (!prompt) {
      // Incluso los errores de validación deberían usar código 200 con mensaje de error
      return res.json({ 
        id: `fallback-kling-video-validation-error-${Date.now()}`,
        output: { 
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' 
        },
        fallback: true,
        error_info: 'Prompt is required'
      });
    }

    if (!KLING_API_KEY) {
      // Si no hay API key, devolver inmediatamente la respuesta de fallback en un formato exitoso
      return res.json({
        id: `fallback-kling-video-no-api-key-${Date.now()}`,
        output: { 
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' 
        },
        fallback: true,
        error_info: 'KLING_API_KEY is not configured'
      });
    }

    try {
      // Ahora que tenemos la clave API, vamos a usar la API real de Kling para videos
      console.log('Realizando llamada real a la API de Kling para generación de video');
      
      const apiParams = {
        prompt,
        duration,
        style,
        width,
        height,
        fps
      };
      
      console.log('Parámetros para API de Kling Videos:', apiParams);
      
      const response = await axios.post(
        'https://api.kling.ai/v1/videos/generations',
        apiParams,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${KLING_API_KEY}`
          },
          timeout: 20000 // Timeout más largo porque la generación de video toma tiempo
        }
      );
      
      console.log('Respuesta de API de Kling para videos:', response.data);
      
      // La respuesta inicial solo contiene un ID de tarea
      if (response.data && response.data.id) {
        return res.json({
          id: response.data.id,
          status: 'processing'
        });
      } else {
        console.error('Respuesta de Kling no contiene ID:', response.data);
        throw new Error('Missing ID in Kling response');
      }
    } catch (apiError: any) {
      console.error('Error calling Kling Video API:', apiError.message);
      
      // Devolver respuesta de fallback con éxito (código 200) para que el cliente no muestre error
      return res.json({
        id: `fallback-kling-video-api-error-${Date.now()}`,
        output: { 
          url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' 
        },
        fallback: true,
        error_info: apiError.message
      });
    }
  } catch (error: any) {
    console.error('Unexpected error in Kling Video proxy:', error);
    
    // Aunque haya un error inesperado, seguimos devolviendo una respuesta exitosa con fallback
    return res.json({
      id: `fallback-kling-video-unexpected-error-${Date.now()}`,
      output: { 
        url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4' 
      },
      fallback: true,
      error_info: error.message || 'Unexpected error'
    });
  }
});

/**
 * Endpoint para verificar el estado de una tarea de generación de imágenes de Freepik
 * Esta ruta es necesaria para verificar si la generación asíncrona ha finalizado
 */
router.get('/freepik/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Task ID is required',
        success: false
      });
    }

    if (!FREEPIK_API_KEY) {
      return res.status(500).json({
        error: 'CONFIGURATION_ERROR',
        message: 'FREEPIK_API_KEY is not configured',
        success: false
      });
    }

    try {
      // Ahora que tenemos la clave API, llamamos directamente a la API de Freepik para verificar el estado
      console.log('Verificando estado de tarea en Freepik, task_id:', taskId);
      
      const response = await axios.get(
        `https://api.freepik.com/v1/ai/mystic/${taskId}`,
        {
          headers: {
            'X-Freepik-API-Key': FREEPIK_API_KEY
          },
          timeout: 10000
        }
      );
      
      console.log('Respuesta de verificación de estado de Freepik:', response.data);
      
      // Verificar si la respuesta tiene el formato esperado (puede estar anidado en data)
      const responseData = response.data.data || response.data;
      
      if (responseData && responseData.status) {
        // Formatear la respuesta de manera consistente
        const status = responseData.status;
        const responseTaskId = responseData.task_id || req.params.taskId;
        
        // Verificar el formato exacto de responseData.generated para adaptarlo
        let generatedContent = [];
        if (status === 'COMPLETED' && responseData.generated) {
          // Puede ser un array de strings o un array de objetos con url
          if (typeof responseData.generated[0] === 'string') {
            generatedContent = responseData.generated; // Ya es un array de strings
          } else if (responseData.generated[0] && responseData.generated[0].url) {
            generatedContent = responseData.generated.map((img: any) => img.url);
          } else {
            generatedContent = responseData.generated; // Mantener formato original
          }
        }
        
        console.log('Imagen generada en Freepik:', generatedContent);
        
        const result = {
          data: {
            generated: generatedContent,
            task_id: responseTaskId,
            status: status
          }
        };
        
        return res.json(result);
      } else {
        // Si la respuesta no tiene el formato esperado, lanzar un error
        console.error('Respuesta de Freepik no tiene el formato esperado:', response.data);
        throw new Error('Invalid response format from Freepik');
      }
    } catch (apiError: any) {
      console.error('Error checking Freepik task status:', apiError.message);
      
      return res.status(500).json({
        error: 'API_ERROR',
        message: `Error checking Freepik task status: ${apiError.message}`,
        success: false,
        task_id: taskId
      });
    }
  } catch (error: any) {
    console.error('Unexpected error checking Freepik task status:', error);
    
    return res.status(500).json({
      error: 'UNEXPECTED_ERROR',
      message: error.message || 'Unexpected error checking Freepik task status',
      success: false,
      task_id: req.params.taskId || 'unknown'
    });
  }
});

/**
 * Endpoint para verificar el estado de una tarea de generación de video de Kling
 */
router.get('/kling/video/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.json({
        fallback: true,
        error_info: 'Task ID is required',
        status: 'failed'
      });
    }

    if (!KLING_API_KEY) {
      return res.json({
        fallback: true,
        error_info: 'KLING_API_KEY is not configured',
        status: 'failed'
      });
    }

    try {
      // Ahora que tenemos la API key, se verificará el estado con la API de Kling
      console.log('Verificando estado de video en Kling, task_id:', taskId);
      
      const response = await axios.get(
        `https://api.kling.ai/v1/videos/generations/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${KLING_API_KEY}`
          },
          timeout: 10000
        }
      );
      
      console.log('Respuesta de verificación de estado de Kling:', response.data);
      
      // Verificar si la respuesta tiene el formato esperado
      if (response.data && response.data.status) {
        // Los estados posibles son: pending, processing, completed, failed
        // Mantenemos la misma estructura que la API devuelve
        return res.json(response.data);
      } else {
        // Si la respuesta no tiene el formato esperado, lanzamos un error
        console.error('Respuesta de Kling no tiene el formato esperado:', response.data);
        throw new Error('Invalid response format from Kling');
      }
    } catch (apiError: any) {
      console.error('Error checking Kling video task status:', apiError.message);
      
      return res.json({
        id: taskId,
        status: 'failed',
        fallback: true,
        error_info: apiError.message
      });
    }
  } catch (error: any) {
    console.error('Unexpected error checking Kling video task status:', error);
    
    return res.json({
      id: req.params.taskId || 'unknown',
      status: 'failed',
      fallback: true,
      error_info: error.message || 'Unexpected error'
    });
  }
});

/**
 * Endpoint para verificar el estado de una tarea de generación de video de Luma
 */
router.get('/luma/video/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.json({
        fallback: true,
        error_info: 'Task ID is required',
        status: 'failed'
      });
    }

    if (!LUMA_API_KEY) {
      return res.json({
        fallback: true,
        error_info: 'LUMA_API_KEY is not configured',
        status: 'failed'
      });
    }

    try {
      // Ahora que tenemos la API key, se verificará el estado con la API de Luma
      console.log('Verificando estado de video en Luma, task_id:', taskId);
      
      const response = await axios.get(
        `https://api.lumalabs.ai/v1/video/${taskId}`,
        {
          headers: {
            'Authorization': `Bearer ${LUMA_API_KEY}`
          },
          timeout: 10000
        }
      );
      
      console.log('Respuesta de verificación de estado de Luma:', response.data);
      
      // Verificar si la respuesta tiene el formato esperado
      if (response.data && response.data.status) {
        // Los estados posibles son: pending, processing, completed, failed
        // Mantenemos la misma estructura que la API devuelve
        return res.json(response.data);
      } else {
        // Si la respuesta no tiene el formato esperado, lanzamos un error
        console.error('Respuesta de Luma no tiene el formato esperado:', response.data);
        throw new Error('Invalid response format from Luma');
      }
    } catch (apiError: any) {
      console.error('Error checking Luma video task status:', apiError.message);
      
      return res.json({
        id: taskId,
        status: 'failed',
        fallback: true,
        error_info: apiError.message
      });
    }
  } catch (error: any) {
    console.error('Unexpected error checking Luma video task status:', error);
    
    return res.json({
      id: req.params.taskId || 'unknown',
      status: 'failed',
      fallback: true,
      error_info: error.message || 'Unexpected error'
    });
  }
});

/**
 * Proxy para la API de PiAPI Flux
 * 
 * Esta API proporciona generación de imágenes avanzada con LoRA y ControlNet
 * Documentación: https://api.piapi.ai/api/v1/task
 * 
 * Los modelos disponibles son:
 * - Qubico/flux1-dev
 * - Qubico/flux1-schnell
 * - Qubico/flux1-dev-advanced (para LoRA y ControlNet)
 */
router.post('/flux/generate-image', async (req, res) => {
  try {
    console.log('Recibida solicitud para generar imagen con PiAPI Flux:', JSON.stringify(req.body));
    
    const { 
      prompt, 
      negative_prompt = '',
      steps = 28,
      guidance_scale = 2.5,
      model = 'Qubico/flux1-dev',
      task_type = 'txt2img',
      loraType,               // Nuevo parámetro individual para tipo de LoRA
      loraStrength,           // Nuevo parámetro individual para intensidad de LoRA
      modelType,              // Nombre alternativo para modelo
      lora_settings,          // Configuración de LoRA en formato de array
      control_net_settings    // Configuración de ControlNet
    } = req.body;
    
    if (!prompt) {
      // Enviamos una respuesta de error con status 400
      console.log('Error: Prompt vacío en solicitud a PiAPI Flux');
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Prompt is required',
        success: false
      });
    }

    if (!PIAPI_API_KEY) {
      // Si no hay API key, retornar error con status 500
      console.log('Error: No se encontró PIAPI_API_KEY');
      return res.status(500).json({
        error: 'CONFIGURATION_ERROR',
        message: 'PIAPI_API_KEY is not configured',
        success: false
      });
    }

    // Usar modelType si está disponible, de lo contrario usar model
    const actualModel = modelType || model;

    // Construir el payload según el tipo de tarea
    const payload: any = {
      model: actualModel,
      task_type,
      input: {
        prompt,
        negative_prompt,
        steps,
        guidance_scale
      }
    };
    
    // Manejo de LoRA: primero verificar los parámetros individuales
    if (loraType) {
      console.log(`Configurando LoRA con tipo: ${loraType}, intensidad: ${loraStrength || 0.7}`);
      
      // Crear la configuración de LoRA con los parámetros individuales
      const loraConfig = {
        lora_type: loraType,
        lora_strength: loraStrength || 0.7 // Usar valor predeterminado si no se proporciona
      };
      
      // Añadir la configuración de LoRA al payload
      payload.input.lora_settings = [loraConfig];
      
      // Asegurarse de usar el modelo avanzado para LoRA
      if (!actualModel.includes('advanced')) {
        payload.model = 'Qubico/flux1-dev-advanced';
      }
      
      // Asegurarse de usar el tipo de tarea correcto para LoRA
      if (!task_type.includes('lora')) {
        payload.task_type = 'txt2img-lora';
      }
    }
    // Si no hay loraType pero sí hay lora_settings, usar esa configuración
    else if (lora_settings && Array.isArray(lora_settings) && lora_settings.length > 0) {
      payload.input.lora_settings = lora_settings;
      
      // Si usamos LoRA, asegurarse de que estamos usando el modelo avanzado
      if (!actualModel.includes('advanced')) {
        payload.model = 'Qubico/flux1-dev-advanced';
      }
      
      // Asegurarse de usar el tipo de tarea correcto para LoRA
      if (!task_type.includes('lora')) {
        payload.task_type = 'txt2img-lora';
      }
    }
    
    // Agregar configuración de ControlNet si está presente
    if (control_net_settings && Array.isArray(control_net_settings) && control_net_settings.length > 0) {
      payload.input.control_net_settings = control_net_settings;
      
      // Si usamos ControlNet, asegurarse de que estamos usando el modelo avanzado y la tarea correcta
      if (model !== 'Qubico/flux1-dev-advanced') {
        payload.model = 'Qubico/flux1-dev-advanced';
      }
      
      if (!task_type.includes('controlnet')) {
        payload.task_type = 'controlnet-lora';
      }
    }
    
    try {
      console.log('Realizando llamada real a la API de PiAPI Flux');
      
      // Construir los headers para la API
      const headers = {
        'X-API-Key': PIAPI_API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      // Llamar a la API para iniciar la generación
      const response = await axios.post(
        'https://api.piapi.ai/api/v1/task',
        payload,
        { headers, timeout: 15000 }
      );
      
      // Verificar la respuesta y extraer el task_id
      if (response.data && response.data.data && response.data.data.task_id) {
        const taskId = response.data.data.task_id;
        
        // Devolver el task_id para que el cliente pueda verificar el estado
        console.log('Generación iniciada exitosamente en PiAPI Flux, task_id:', taskId);
        return res.status(200).json({
          task_id: taskId,
          status: 'processing',
          model: response.data.data.model,
          task_type: response.data.data.task_type
        });
      } else {
        // Si no hay task_id, algo salió mal
        console.error('Respuesta de PiAPI Flux no contiene task_id:', response.data);
        throw new Error('Missing task_id in PiAPI Flux response');
      }
    } catch (apiError: any) {
      // En caso de error en la API, retornamos un error
      console.error('Error llamando a la API de PiAPI Flux:', apiError.message);
      return res.status(500).json({
        error: 'API_ERROR',
        message: apiError.message || 'Error calling PiAPI Flux API',
        success: false
      });
    }
  } catch (error: any) {
    // Si ocurre cualquier error, retornamos un error
    console.error('Error inesperado en PiAPI Flux proxy:', error.message);
    return res.status(500).json({
      error: 'UNEXPECTED_ERROR',
      message: error.message || 'Error inesperado',
      success: false
    });
  }
});

/**
 * Endpoint para verificar el estado de una tarea de generación de PiAPI Flux
 */
router.get('/flux/task/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;
    
    if (!taskId) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'Task ID is required',
        success: false
      });
    }
    
    if (!PIAPI_API_KEY) {
      return res.status(500).json({
        error: 'CONFIGURATION_ERROR',
        message: 'PIAPI_API_KEY is not configured',
        success: false
      });
    }
    
    try {
      // Construir los headers para la API
      const headers = {
        'X-API-Key': PIAPI_API_KEY,
        'Accept': 'application/json'
      };
      
      // Verificar el estado de la tarea
      const response = await axios.get(
        `https://api.piapi.ai/api/v1/task/${taskId}`,
        { headers, timeout: 10000 }
      );
      
      // Procesamiento adicional para imágenes completadas
      if (response.data && 
          response.data.data && 
          response.data.data.status === 'completed' && 
          response.data.data.output && 
          response.data.data.output.image_url) {
        
        // Extraer la URL de la imagen de la respuesta
        const imageUrl = response.data.data.output.image_url;
        console.log(`Imagen completada para tarea ${taskId}:`, imageUrl);
        
        // Transformar la respuesta para ser compatible con el formato que espera el cliente
        // Esto permite que el cliente procese la respuesta directamente
        if (!response.data.data.output.images) {
          response.data.data.output.images = [imageUrl];
        }
      }
      
      // Devolver la respuesta completa para que el cliente pueda manejarla
      return res.json(response.data);
    } catch (apiError: any) {
      console.error(`Error verificando estado de tarea ${taskId} en PiAPI Flux:`, apiError.message);
      return res.status(500).json({
        error: 'API_ERROR',
        message: apiError.message || 'Error verificando estado de tarea en PiAPI Flux',
        success: false
      });
    }
  } catch (error: any) {
    console.error('Error inesperado en proxy de verificación de PiAPI Flux:', error.message);
    return res.status(500).json({
      error: 'UNEXPECTED_ERROR',
      message: error.message || 'Error inesperado',
      success: false
    });
  }
});

/**
 * Endpoint para guardar una imagen completada directamente
 * Este endpoint permite guardar una imagen ya generada, proporcionando la URL
 * directamente sin necesidad de polling.
 */
router.post('/flux/save-completed-image', async (req, res) => {
  try {
    const { url, prompt, taskId } = req.body;
    
    if (!url || !prompt) {
      return res.status(400).json({
        error: 'VALIDATION_ERROR',
        message: 'URL and prompt are required',
        success: false
      });
    }
    
    // Simplemente retornamos éxito con la información proporcionada
    // El cliente se encargará de guardar en Firestore
    return res.status(200).json({
      success: true,
      image: {
        url,
        prompt,
        taskId,
        provider: 'flux-direct',
        status: 'COMPLETED',
        createdAt: new Date().toISOString()
      }
    });
  } catch (error: any) {
    console.error('Error guardando imagen completada:', error);
    return res.status(500).json({
      error: 'UNEXPECTED_ERROR',
      message: error.message || 'Error guardando imagen',
      success: false
    });
  }
});

/**
 * Ruta para verificar el estado de las API
 */
router.get('/status', (req, res) => {
  const status = {
    fal: Boolean(FAL_API_KEY),
    freepik: Boolean(FREEPIK_API_KEY),
    kling: Boolean(KLING_API_KEY),
    luma: Boolean(LUMA_API_KEY),
    flux: Boolean(PIAPI_API_KEY)
  };
  
  return res.json({ status });
});

export default router;