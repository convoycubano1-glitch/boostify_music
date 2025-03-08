/**
 * Módulo de rutas para la API de Kling - Versión simplificada
 * 
 * Este archivo proporciona endpoints proxy simplificados para la API de Kling
 * Enfoque: Virtual Try-On con manejo de errores mejorado
 */

import { Router } from 'express';
import axios from 'axios';
import { processImageForKling } from '../utils/image-processor';

const router = Router();
const PIAPI_API_KEY = process.env.PIAPI_API_KEY;
const KLING_API_URL = 'https://api.piapi.ai/api/v1/task';

/**
 * Verificar que la clave API esté configurada
 */
if (!PIAPI_API_KEY) {
  console.error('⚠️ PIAPI_API_KEY no está configurada en las variables de entorno');
}

/**
 * Endpoint para iniciar un proceso de Virtual Try-On
 * Conecta directamente con la API de Kling
 */
router.post('/try-on/start', async (req, res) => {
  try {
    console.log('Recibida solicitud para iniciar Virtual Try-On', req.body);
    const { input } = req.body || {};
    const { model_input, dress_input, batch_size = 1 } = input || {};

    if (!model_input || !dress_input) {
      console.log('Faltan imágenes requeridas para Virtual Try-On');
      return res.status(400).json({ 
        success: false, 
        error: 'Se requieren imágenes del modelo y la prenda'
      });
    }
    
    console.log('Imágenes validadas, enviando a Kling API');

    // Configuración de la solicitud a Kling API
    const klingRequest = {
      model: "kling",
      task_type: "ai_try_on",
      input: {
        model_input,
        dress_input,
        batch_size
      }
    };

    // Realizar la llamada a la API de Kling
    const response = await axios.post(KLING_API_URL, klingRequest, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PIAPI_API_KEY
      }
    });

    // Procesar respuesta exitosa
    if (response.data && response.data.task_id) {
      console.log(`✅ Try-On iniciado con éxito: ${response.data.task_id}`);
      return res.json({
        success: true,
        taskId: response.data.task_id
      });
    } else {
      // Error en respuesta
      console.error('❌ Error en respuesta de Kling:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Error en la respuesta de Kling API',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('❌ Error al conectar con Kling API:', error);
    
    // Manejar errores de forma descriptiva
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

/**
 * Endpoint para verificar el estado de un proceso de Virtual Try-On
 */
router.post('/try-on/status', async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere un ID de tarea' 
      });
    }

    // Verificar estado en Kling API
    const response = await axios.get(`${KLING_API_URL}/${taskId}`, {
      headers: {
        'x-api-key': PIAPI_API_KEY
      }
    });

    // Procesar respuesta según estado
    if (response.data && response.data.status) {
      const status = response.data.status;
      
      if (status === 'success') {
        // Tarea completada con éxito
        console.log(`✅ Tarea Try-On completada: ${taskId}`);
        return res.json({
          success: true,
          status: 'completed',
          images: response.data.output?.images || response.data.images || []
        });
      } else if (status === 'failed') {
        // Tarea falló
        console.error(`❌ Tarea fallida. Mensaje de error: ${response.data.message || 'No hay mensaje de error'}`);
        return res.json({
          success: false,
          status: 'failed',
          errorMessage: response.data.message || response.data.errorMessage || 'task failed'
        });
      } else {
        // Tarea en progreso
        return res.json({
          success: true,
          status: 'processing'
        });
      }
    } else {
      // Respuesta inesperada
      console.error('❌ Respuesta inesperada de Kling API:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Respuesta inesperada de Kling API',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('❌ Error al verificar estado en Kling API:', error);
    
    // Manejar errores de forma descriptiva
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

/**
 * Endpoint para procesar imágenes y asegurar compatibilidad con Kling API
 * Este endpoint es clave para la unificación del procesamiento de imágenes
 */
router.post('/process-image', async (req, res) => {
  try {
    const { imageDataUrl } = req.body;
    
    if (!imageDataUrl) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una imagen en formato data URL'
      });
    }
    
    console.log('Procesando imagen para compatibilidad con Kling API');
    
    // Usar la función unificada para procesar la imagen
    const result = await processImageForKling(imageDataUrl);
    
    if (result.isValid) {
      console.log(`✅ Imagen procesada correctamente: ${result.width}x${result.height}`);
      
      return res.json({
        success: true,
        processedImage: result.processedImage || result.normalizedUrl,
        width: result.width,
        height: result.height,
        originalFormat: result.originalFormat,
        sizeInMB: result.sizeInMB
      });
    } else {
      console.error(`❌ Error al procesar imagen: ${result.errorMessage}`);
      
      return res.status(400).json({
        success: false,
        error: result.errorMessage,
        details: {
          width: result.width,
          height: result.height,
          originalFormat: result.originalFormat,
          sizeInMB: result.sizeInMB
        }
      });
    }
  } catch (error: any) {
    console.error('❌ Error en el procesamiento de imagen:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor al procesar la imagen'
    });
  }
});

/**
 * Endpoint para iniciar una tarea de Lipsync
 * Conecta directamente con la API de Kling
 */
router.post('/lipsync/start', async (req, res) => {
  try {
    console.log('Recibida solicitud para iniciar Lipsync', req.body);
    const { videoSource, audioSource, textContent, settings } = req.body;

    if (!videoSource || (!audioSource && !textContent)) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una fuente de video y audio o texto para el lipsync'
      });
    }

    console.log('Datos validados, enviando a Kling API');

    // Configuración de la solicitud a Kling API
    const klingRequest = {
      model: "kling",
      task_type: "lipsync",
      input: {
        video_input: videoSource,
        audio_input: audioSource,
        text_input: textContent,
        settings: settings || {}
      }
    };

    // Realizar la llamada a la API de Kling
    const response = await axios.post(KLING_API_URL, klingRequest, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PIAPI_API_KEY
      }
    });

    // Procesar respuesta exitosa
    if (response.data && response.data.task_id) {
      console.log(`✅ Lipsync iniciado con éxito: ${response.data.task_id}`);
      return res.json({
        success: true,
        taskId: response.data.task_id
      });
    } else {
      // Error en respuesta
      console.error('❌ Error en respuesta de Kling Lipsync:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Error en la respuesta de Kling API',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('❌ Error al conectar con Kling API para Lipsync:', error);
    
    // Manejar errores de forma descriptiva
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

/**
 * Endpoint para verificar el estado de una tarea de Lipsync
 */
router.post('/lipsync/status', async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere un ID de tarea' 
      });
    }

    // Verificar estado en Kling API
    const response = await axios.get(`${KLING_API_URL}/${taskId}`, {
      headers: {
        'x-api-key': PIAPI_API_KEY
      }
    });

    // Procesar respuesta según estado
    if (response.data && response.data.status) {
      const status = response.data.status;
      
      if (status === 'success') {
        // Tarea completada con éxito
        console.log(`✅ Tarea Lipsync completada: ${taskId}`);
        return res.json({
          success: true,
          status: 'completed',
          resultVideo: response.data.output?.video || response.data.video || response.data.output_url
        });
      } else if (status === 'failed') {
        // Tarea falló
        console.error(`❌ Tarea Lipsync fallida. Mensaje: ${response.data.message || 'No hay mensaje de error'}`);
        return res.json({
          success: false,
          status: 'failed',
          errorMessage: response.data.message || response.data.errorMessage || 'task failed'
        });
      } else {
        // Tarea en progreso
        return res.json({
          success: true,
          status: 'processing'
        });
      }
    } else {
      // Respuesta inesperada
      console.error('❌ Respuesta inesperada de Kling API:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Respuesta inesperada de Kling API',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('❌ Error al verificar estado de Lipsync en Kling API:', error);
    
    // Manejar errores de forma descriptiva
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

/**
 * Endpoint para iniciar una tarea de efectos (Effects)
 * Conecta directamente con la API de Kling
 */
router.post('/effects/start', async (req, res) => {
  try {
    console.log('Recibida solicitud para iniciar Effects', req.body);
    const { sourceImage, effectType, settings, customEffect } = req.body;

    if (!sourceImage || !effectType) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una imagen y un tipo de efecto'
      });
    }

    console.log('Datos validados, enviando a Kling API');

    // Configuración de la solicitud a Kling API
    const klingRequest = {
      model: "kling",
      task_type: "effects",
      input: {
        image_input: sourceImage,
        effect_type: effectType,
        settings: settings || {},
        custom_effect: customEffect
      }
    };

    // Realizar la llamada a la API de Kling
    const response = await axios.post(KLING_API_URL, klingRequest, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PIAPI_API_KEY
      }
    });

    // Procesar respuesta exitosa
    if (response.data && response.data.task_id) {
      console.log(`✅ Effects iniciado con éxito: ${response.data.task_id}`);
      return res.json({
        success: true,
        taskId: response.data.task_id
      });
    } else {
      // Error en respuesta
      console.error('❌ Error en respuesta de Kling Effects:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Error en la respuesta de Kling API',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('❌ Error al conectar con Kling API para Effects:', error);
    
    // Manejar errores de forma descriptiva
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

/**
 * Endpoint para verificar el estado de una tarea de Effects
 */
router.post('/effects/status', async (req, res) => {
  try {
    const { taskId } = req.body;

    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere un ID de tarea' 
      });
    }

    // Verificar estado en Kling API
    const response = await axios.get(`${KLING_API_URL}/${taskId}`, {
      headers: {
        'x-api-key': PIAPI_API_KEY
      }
    });

    // Procesar respuesta según estado
    if (response.data && response.data.status) {
      const status = response.data.status;
      
      if (status === 'success') {
        // Tarea completada con éxito
        console.log(`✅ Tarea Effects completada: ${taskId}`);
        return res.json({
          success: true,
          status: 'completed',
          resultVideo: response.data.output?.video || response.data.video || response.data.output_url
        });
      } else if (status === 'failed') {
        // Tarea falló
        console.error(`❌ Tarea Effects fallida. Mensaje: ${response.data.message || 'No hay mensaje de error'}`);
        return res.json({
          success: false,
          status: 'failed',
          errorMessage: response.data.message || response.data.errorMessage || 'task failed'
        });
      } else {
        // Tarea en progreso
        return res.json({
          success: true,
          status: 'processing'
        });
      }
    } else {
      // Respuesta inesperada
      console.error('❌ Respuesta inesperada de Kling API:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Respuesta inesperada de Kling API',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('❌ Error al verificar estado en Kling API:', error);
    
    // Manejar errores de forma descriptiva
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

/**
 * Endpoint para guardar resultados
 * Guarda los resultados generados por Kling API en Firebase
 */
router.post('/save-result', async (req, res) => {
  try {
    const { type, result } = req.body;
    
    if (!type || !result) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un tipo y un resultado para guardar'
      });
    }
    
    // Aquí implementaríamos la lógica para guardar en Firebase
    // Simularemos una respuesta exitosa por ahora
    console.log(`Guardando resultado de ${type} en Firebase:`, result);
    
    // Generar un ID único para el resultado
    const resultId = `result_${Date.now()}`;
    
    return res.json({
      success: true,
      id: resultId,
      message: `Resultado de ${type} guardado con éxito`
    });
  } catch (error: any) {
    console.error('❌ Error al guardar resultado:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor al guardar el resultado'
    });
  }
});

/**
 * Endpoint para obtener resultados guardados
 */
router.get('/results', async (req, res) => {
  try {
    const type = req.query.type as string || 'all';
    
    // Aquí implementaríamos la lógica para obtener resultados de Firebase
    // Simularemos una respuesta con resultados ficticios por ahora
    console.log(`Obteniendo resultados de tipo: ${type}`);
    
    // Resultados de ejemplo (esto sería reemplazado por datos reales de Firebase)
    const mockResults: any[] = [];
    
    return res.json({
      success: true,
      results: mockResults
    });
  } catch (error: any) {
    console.error('❌ Error al obtener resultados:', error);
    
    return res.status(500).json({
      success: false,
      error: error.message || 'Error interno del servidor al obtener los resultados'
    });
  }
});

/**
 * Endpoint para generar imágenes con Kling API
 * 
 * Permite generar imágenes usando el modelo de generación de imágenes de Kling
 */
router.post('/generate-image', async (req, res) => {
  try {
    const { prompt, negative_prompt, num_inference_steps, guidance_scale, seed } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un prompt para generar la imagen'
      });
    }
    
    console.log('Iniciando generación de imagen con Kling:', prompt);
    
    // Configuración de la solicitud a Kling API
    const requestData = {
      prompt,
      n: 1,
      size: "1024x1024",
      response_format: "url",
      negative_prompt: negative_prompt || '',
      num_inference_steps: num_inference_steps || 30,
      guidance_scale: guidance_scale || 7.5,
      seed: seed || Math.floor(Math.random() * 1000000)
    };
    
    console.log(`Usando API URL para generación de imagen: ${KLING_API_URL}`);
    
    // Realizar la llamada a la API de Kling (diferentes endpoints para cada servicio)
    const response = await axios.post('https://api.piapi.ai/api/v1/task', {
      model: "sdxl",
      task_type: "text_to_image",
      input: requestData
    }, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PIAPI_API_KEY
      }
    });
    
    // Procesar respuesta exitosa
    if (response.data && response.data.task_id) {
      console.log(`✅ Generación de imagen iniciada con éxito: ${response.data.task_id}`);
      return res.json({
        success: true,
        taskId: response.data.task_id
      });
    } else {
      // Error en respuesta
      console.error('❌ Error en respuesta de PiAPI Image Generation:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Error en la respuesta de PiAPI',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('❌ Error al conectar con PiAPI para generación de imagen:', error);
    
    // Manejar errores de forma descriptiva
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

/**
 * Endpoint para generar videos con PiAPI
 * 
 * Permite generar videos usando el modelo de generación de videos de PiAPI
 */
router.post('/generate-video', async (req, res) => {
  try {
    const { prompt, negative_prompt, init_image, model_type, num_inference_steps, guidance_scale, seed } = req.body;
    
    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere un prompt para generar el video'
      });
    }
    
    console.log('Iniciando generación de video con PiAPI:', prompt);
    
    // Configuración de la solicitud a PiAPI
    const requestData = {
      model: "t2v-01", // Modelo por defecto de PiAPI
      task_type: "text_to_video",
      input: {
        prompt,
        negative_prompt: negative_prompt || '',
        init_image: init_image || null,
        model_type: model_type || "base",
        num_inference_steps: num_inference_steps || 30,
        guidance_scale: guidance_scale || 7.5,
        seed: seed || Math.floor(Math.random() * 1000000)
      }
    };
    
    console.log(`Usando API URL para generación de video: ${KLING_API_URL}`);
    
    // Realizar la llamada a la API de PiAPI
    const response = await axios.post(KLING_API_URL, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': PIAPI_API_KEY
      }
    });
    
    // Procesar respuesta exitosa
    if (response.data && response.data.task_id) {
      console.log(`✅ Generación de video iniciada con éxito: ${response.data.task_id}`);
      return res.json({
        success: true,
        taskId: response.data.task_id
      });
    } else {
      // Error en respuesta
      console.error('❌ Error en respuesta de PiAPI Video Generation:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Error en la respuesta de PiAPI',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('❌ Error al conectar con PiAPI para generación de video:', error);
    
    // Manejar errores de forma descriptiva
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

/**
 * Endpoint general para verificar el estado de una tarea
 * Funciona para cualquier tipo de tarea: try-on, lipsync, effects, text_to_image, text_to_video
 */
router.get('/task-status/:taskId', async (req, res) => {
  try {
    const { taskId } = req.params;

    if (!taskId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Se requiere un ID de tarea' 
      });
    }

    console.log(`Verificando estado de tarea general: ${taskId}`);

    // Verificar estado en Kling API
    const response = await axios.get(`${KLING_API_URL}/${taskId}`, {
      headers: {
        'x-api-key': PIAPI_API_KEY
      }
    });

    // Procesar respuesta según estado
    if (response.data && response.data.status) {
      const status = response.data.status;
      
      if (status === 'success') {
        // Tarea completada con éxito
        console.log(`✅ Tarea completada: ${taskId}`);
        return res.json({
          success: true,
          status: 'completed',
          result: response.data.output || response.data // Para abarcar cualquier tipo de salida
        });
      } else if (status === 'failed') {
        // Tarea falló
        console.error(`❌ Tarea fallida. Mensaje: ${response.data.message || 'No hay mensaje de error'}`);
        return res.json({
          success: false,
          status: 'failed',
          errorMessage: response.data.message || response.data.errorMessage || 'task failed'
        });
      } else {
        // Tarea en progreso
        return res.json({
          success: true,
          status: 'processing'
        });
      }
    } else {
      // Respuesta inesperada
      console.error('❌ Respuesta inesperada de Kling API:', response.data);
      return res.status(500).json({
        success: false,
        error: 'Respuesta inesperada de Kling API',
        details: response.data
      });
    }
  } catch (error: any) {
    console.error('❌ Error al verificar estado en Kling API:', error);
    
    // Manejar errores de forma descriptiva
    const errorMessage = error.response?.data?.message || error.message || 'Error desconocido';
    return res.status(500).json({
      success: false,
      error: errorMessage,
      details: error.response?.data
    });
  }
});

export default router;