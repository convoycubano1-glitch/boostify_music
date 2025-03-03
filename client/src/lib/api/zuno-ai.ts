import { generateMusicWithSuno, checkMusicGenerationStatus } from './piapi-music';

/**
 * AVISO: Este archivo se mantiene solo por compatibilidad con código existente
 * Todo el funcionamiento de generación de música ahora utiliza exclusivamente 
 * el servicio de PiAPI. Este archivo actúa como una capa de adaptación para
 * evitar errores en código existente que pueda estar usando esta API.
 */

interface GenerateMusicParams {
  prompt: string;
  modelName?: string;
  title?: string;
  tags?: string;
}

/**
 * Función adaptadora que redirige todas las peticiones a PiAPI
 * @param params Parámetros originales de Zuno/Suno
 * @returns Respuesta transformada para mantener compatibilidad
 */
export async function generateMusic(params: GenerateMusicParams) {
  console.log('⚠️ Utilizando PiAPI para generación de música en lugar de Zuno/Suno');
  
  try {
    // Transformar los parámetros al formato que espera PiAPI
    const result = await generateMusicWithSuno({
      model: "music-s",
      description: params.prompt,
      title: params.title,
      tags: params.tags,
      makeInstrumental: false
    });
    
    // Adaptar la respuesta al formato que esperan los componentes existentes
    return {
      id: result.taskId,
      status: result.status,
      taskId: result.taskId
    };
  } catch (error) {
    console.error('Error al generar música con adaptador PiAPI:', error);
    
    // Proporcionar respuesta de fallback con el formato esperado
    return {
      id: 'fallback-' + Date.now(),
      status: 'pending',
      taskId: 'fallback-' + Date.now(),
      error: 'No se pudo conectar al servicio de generación de música. Usando flujo alternativo.',
      fallback: true
    };
  }
}

/**
 * Función adaptadora que redirige todas las verificaciones de estado a PiAPI
 * @param taskId ID de la tarea a verificar
 * @returns Respuesta transformada para mantener compatibilidad
 */
export async function checkGenerationStatus(taskId: string) {
  console.log('⚠️ Verificando estado con PiAPI en lugar de Zuno/Suno');
  
  try {
    // Si es un ID de fallback, devolvemos un estado simulado
    if (taskId.startsWith('fallback-')) {
      return {
        id: taskId,
        status: 'completed',
        audioUrl: '/assets/music-samples/fallback-music.mp3',
        message: 'Usando música de respaldo debido a problemas de conexión'
      };
    }
    
    const status = await checkMusicGenerationStatus(taskId);
    
    // Adaptar la respuesta al formato que esperan los componentes existentes
    return {
      id: taskId,
      status: status.status,
      audioUrl: status.audioUrl,
      message: status.error || 'Procesado a través de PiAPI'
    };
  } catch (error) {
    console.error('Error al verificar estado con adaptador PiAPI:', error);
    
    // Proporcionar respuesta de fallback con el formato esperado
    return {
      id: taskId,
      status: 'completed',
      audioUrl: '/assets/music-samples/fallback-music.mp3',
      message: 'Usando música de respaldo debido a problemas de conexión'
    };
  }
}
