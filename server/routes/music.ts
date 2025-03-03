/**
 * Rutas para la generación de música con IA
 * 
 * Estas rutas manejan la generación asíncrona de música,
 * el seguimiento del estado de generación y la gestión
 * del historial de generaciones.
 */

import { Router, Request, Response } from 'express';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { authenticate } from '../middleware/auth';
import { db } from '@db';
import { log } from '../vite';

const router = Router();

// Mapeo de modelos internos a modelos de la API de PiAPI
const MODEL_MAPPING: Record<string, string> = {
  'music-s': 'suno-v3-music',
  'music-u': 'udio-v1-music'
};

// Estado en memoria para seguimiento de generaciones (en producción usaríamos una base de datos)
const musicGenerations: Record<string, any> = {};

/**
 * Endpoint para iniciar una generación de música
 * Requiere autenticación
 */
router.post('/generate', authenticate, async (req: Request, res: Response) => {
  try {
    const { 
      prompt, 
      title, 
      model = 'music-s',
      makeInstrumental = false,
      negativeTags = '',
      tags = '',
      seed,
      tempo,
      keySignature,
      continueClipId,
      continueAt,
      customLyrics,
      generateLyrics = false,
      audioUrl,
      uploadAudio = false
    } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'El prompt es requerido' });
    }

    // Validar el modelo
    if (!MODEL_MAPPING[model]) {
      return res.status(400).json({ error: 'Modelo no válido' });
    }

    // Crear un ID único para esta generación
    const taskId = uuidv4();
    const userId = req.user?.uid || 'anonymous';

    // Verificar que el usuario tiene permisos para generar música
    // En producción, aquí podríamos verificar límites o suscripciones

    // En un entorno de producción, aquí es donde haríamos la llamada a la API externa
    // Por ahora, simularemos una generación asíncrona

    // Registro de la generación en nuestra base de datos o cache
    musicGenerations[taskId] = {
      id: taskId,
      userId,
      title: title || `Generación ${new Date().toLocaleString()}`,
      prompt,
      model,
      status: 'pending',
      progress: 0,
      createdAt: new Date().toISOString(),
      options: {
        makeInstrumental,
        negativeTags,
        tags,
        seed,
        tempo,
        keySignature,
        continueClipId,
        continueAt,
        customLyrics,
        generateLyrics,
        audioUrl,
        uploadAudio
      }
    };

    // Iniciar proceso asíncrono simulado de generación
    simulateGeneration(taskId);

    // Responder al cliente con el ID de la tarea
    res.status(202).json({ 
      taskId, 
      message: 'Generación de música iniciada con éxito' 
    });

    // Log para depuración
    log(`Nueva generación de música iniciada: ${taskId}`, 'music-api');
  } catch (error) {
    console.error('Error al iniciar generación de música:', error);
    res.status(500).json({ error: 'Error interno al iniciar la generación de música' });
  }
});

/**
 * Endpoint para verificar el estado de una generación
 * No requiere autenticación para permitir polling desde el cliente
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    const { taskId } = req.query;

    if (!taskId || typeof taskId !== 'string') {
      return res.status(400).json({ error: 'Se requiere un ID de tarea válido' });
    }

    // Buscar la generación en nuestro cache/db
    const generation = musicGenerations[taskId];
    
    if (!generation) {
      return res.status(404).json({ error: 'Generación no encontrada' });
    }

    // Devolver el estado actual
    res.json({
      id: generation.id,
      status: generation.status,
      progress: generation.progress || 0,
      audioUrl: generation.audioUrl,
      message: getStatusMessage(generation.status)
    });
  } catch (error) {
    console.error('Error al verificar estado de generación:', error);
    res.status(500).json({ error: 'Error al verificar el estado de la generación' });
  }
});

/**
 * Endpoint para obtener el historial de generaciones
 * Requiere autenticación
 */
router.get('/recent', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.uid;

    if (!userId) {
      return res.status(401).json({ error: 'No autorizado' });
    }

    // En una implementación real, consultaríamos la base de datos
    // Por ahora, solo filtraremos las generaciones en memoria por usuario
    const userGenerations = Object.values(musicGenerations)
      .filter((gen: any) => gen.userId === userId)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20) // Últimas 20 generaciones
      .map((gen: any) => ({
        id: gen.id,
        taskId: gen.id,
        title: gen.title,
        model: gen.model,
        prompt: gen.prompt,
        audioUrl: gen.audioUrl || '',
        createdAt: gen.createdAt,
        status: gen.status
      }));

    res.json(userGenerations);
  } catch (error) {
    console.error('Error al obtener historial de generaciones:', error);
    res.status(500).json({ error: 'Error al obtener el historial de generaciones' });
  }
});

/**
 * Obtener un mensaje de estado basado en el código de estado
 */
function getStatusMessage(status: string): string {
  switch (status) {
    case 'pending':
      return 'Esperando en cola';
    case 'processing':
      return 'Generando música';
    case 'completed':
      return 'Generación completada';
    case 'failed':
      return 'Error en la generación';
    default:
      return 'Estado desconocido';
  }
}

/**
 * Función para simular el proceso de generación de música
 * En producción, esta sería una llamada real a un API externa
 */
function simulateGeneration(taskId: string): void {
  const generation = musicGenerations[taskId];
  if (!generation) return;

  // Cambiar el estado a procesando
  generation.status = 'processing';

  // Simular el progreso
  let progress = 0;
  const progressInterval = setInterval(() => {
    progress += Math.floor(Math.random() * 5) + 1;
    
    if (progress >= 100) {
      progress = 100;
      clearInterval(progressInterval);
      
      // Marcar como completado
      generation.status = 'completed';
      generation.progress = 100;
      
      // Asignar una URL de audio simulada
      generation.audioUrl = `https://example.com/audio/${taskId}.mp3`;
      
      log(`Generación de música completada: ${taskId}`, 'music-api');
    } else {
      generation.progress = progress;
    }
  }, 1000); // Actualizar cada segundo
}

export default router;