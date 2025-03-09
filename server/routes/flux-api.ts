/**
 * Rutas API para integración con Flux API (PiAPI)
 * 
 * Este archivo implementa los endpoints para:
 * 1. Iniciar generación de imágenes (txt2img)
 * 2. Verificar estado de tareas
 * 3. Guardar resultados en Firebase
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { db } from '../firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { authenticate } from '../middleware/auth';

const router = Router();
const PIAPI_BASE_URL = 'https://api.piapi.ai/api/v1';

/**
 * Verificar que la clave API esté configurada
 */
function verifyApiKey() {
  if (!process.env.PIAPI_KEY) {
    console.warn('[flux-api] ⚠️ PIAPI_KEY no está configurada. La funcionalidad será limitada.');
    return false;
  }
  return true;
}

/**
 * Endpoint para iniciar una tarea de generación de imágenes con Flux
 */
router.post('/proxy/flux/start', async (req: Request, res: Response) => {
  try {
    if (!verifyApiKey()) {
      return res.status(401).json({
        success: false,
        error: 'API key no configurada. Contacte al administrador.'
      });
    }

    const { model, task_type, input } = req.body;

    // Validar parámetros requeridos
    if (!model || !task_type || !input || !input.prompt) {
      return res.status(400).json({
        success: false,
        error: 'Parámetros incompletos. Se requiere model, task_type y input.prompt.'
      });
    }

    // Verificar que el modelo sea uno de los soportados
    const supportedModels = ['Qubico/flux1-dev', 'Qubico/flux1-schnell', 'Qubico/flux1-dev-advanced'];
    if (!supportedModels.includes(model)) {
      return res.status(400).json({
        success: false,
        error: `Modelo no soportado. Use uno de: ${supportedModels.join(', ')}`
      });
    }

    // Configurar la solicitud a la API de PiAPI
    const piApiResponse = await axios.post(
      `${PIAPI_BASE_URL}/task`,
      req.body,
      {
        headers: {
          'X-API-Key': process.env.PIAPI_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    // Procesar la respuesta
    if (piApiResponse.status === 200 && piApiResponse.data.code === 200) {
      const taskData = piApiResponse.data.data;
      
      return res.status(200).json({
        success: true,
        taskId: taskData.task_id,
        status: taskData.status || 'pending',
        model: taskData.model,
        taskType: taskData.task_type
      });
    } else {
      // Error en la respuesta
      return res.status(500).json({
        success: false,
        error: piApiResponse.data.message || 'Error desconocido en la API de Flux'
      });
    }
  } catch (error) {
    console.error('[flux-api] Error al iniciar tarea:', error);
    let errorMessage = 'Error interno del servidor';
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Endpoint para verificar el estado de una tarea de generación
 */
router.get('/proxy/flux/status', async (req: Request, res: Response) => {
  try {
    if (!verifyApiKey()) {
      return res.status(401).json({
        success: false,
        error: 'API key no configurada. Contacte al administrador.'
      });
    }

    const taskId = req.query.taskId as string;
    
    if (!taskId) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere el parámetro taskId'
      });
    }

    // Verificar el estado en la API de PiAPI
    const statusResponse = await axios.get(
      `${PIAPI_BASE_URL}/task/${taskId}`,
      {
        headers: {
          'X-API-Key': process.env.PIAPI_KEY
        }
      }
    );

    // Extraer los datos relevantes de la respuesta
    if (statusResponse.status === 200 && statusResponse.data.code === 200) {
      const taskData = statusResponse.data.data;
      
      // Estructura de respuesta normalizada
      const responseData = {
        success: true,
        taskId: taskData.task_id,
        status: taskData.status, // pending, processing, completed, failed
        output: null,
        error: null
      };

      // Si la tarea está completada, incluir la URL de la imagen
      if (taskData.status === 'completed' && taskData.output) {
        responseData.output = {
          images: Array.isArray(taskData.output.images) ? 
            taskData.output.images : 
            [taskData.output.image || taskData.output.images]
        };
      }

      // Si hay un error, incluirlo en la respuesta
      if (taskData.error && taskData.error.message) {
        responseData.error = taskData.error.message;
      }

      return res.status(200).json(responseData);
    } else {
      // Error en la respuesta
      return res.status(500).json({
        success: false,
        error: statusResponse.data.message || 'Error desconocido al verificar estado'
      });
    }
  } catch (error) {
    console.error('[flux-api] Error al verificar estado:', error);
    let errorMessage = 'Error interno del servidor';
    
    if (axios.isAxiosError(error)) {
      errorMessage = error.response?.data?.message || error.message;
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return res.status(500).json({
      success: false,
      error: errorMessage
    });
  }
});

/**
 * Endpoint para guardar un resultado de generación en Firebase
 * Requiere autenticación
 */
router.post('/proxy/flux/save-result', authenticate, async (req: Request, res: Response) => {
  try {
    const { imageUrl, prompt, style, aspectRatio } = req.body;
    const userId = req.user?.uid;

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        error: 'Se requiere una URL de imagen'
      });
    }

    // Guardar el resultado en Firestore
    const docRef = await addDoc(collection(db, 'flux_images'), {
      imageUrl,
      prompt,
      style,
      aspectRatio,
      userId,
      createdAt: Timestamp.now()
    });

    return res.status(200).json({
      success: true,
      id: docRef.id,
      message: 'Imagen guardada correctamente'
    });
  } catch (error) {
    console.error('[flux-api] Error al guardar resultado:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para obtener las imágenes guardadas de un usuario
 * Requiere autenticación
 */
router.get('/proxy/flux/user-images', authenticate, async (req: Request, res: Response) => {
  try {
    // Aquí iría la lógica para obtener las imágenes del usuario
    // Para simplificar, este endpoint no está implementado en esta versión
    // pero mostramos la estructura básica
    res.status(200).json({
      success: true,
      images: []
    });
  } catch (error) {
    console.error('[flux-api] Error al obtener imágenes:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;