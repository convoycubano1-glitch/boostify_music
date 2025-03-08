/**
 * Módulo de rutas para la API de Kling - Versión simplificada
 * 
 * Este archivo proporciona endpoints proxy simplificados para la API de Kling
 * Enfoque: Virtual Try-On con manejo de errores mejorado
 */

import { Router } from 'express';
import axios from 'axios';

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
router.post('/kling/try-on/start', async (req, res) => {
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
router.post('/kling/try-on/status', async (req, res) => {
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

export default router;