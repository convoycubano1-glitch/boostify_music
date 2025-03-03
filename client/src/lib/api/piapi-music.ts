import axios from 'axios';

const PIAPI_ENDPOINT = 'https://api.piapi.ai/api/v1/task';

// Cliente de axios con la clave API
const piapiClient = axios.create({
  headers: {
    'x-api-key': import.meta.env.VITE_PIAPI_API_KEY || '',
    'Content-Type': 'application/json',
  },
});

// Tipos de modelos soportados
export type MusicModel = 'music-u' | 'music-s';

// Tipos de generación de letras
export type LyricsType = 'generate' | 'user' | 'instrumental';

// Interfaz base para la generación de música
interface GenerateMusicBaseParams {
  description: string;
  negativeTags?: string;
  model: MusicModel;
}

// Interfaz específica para Udio
export interface UdioMusicParams extends GenerateMusicBaseParams {
  lyricsType: LyricsType;
  lyrics?: string;
  seed?: number;
  continueClipId?: string;
  continueAt?: number;
}

// Interfaz específica para Suno
export interface SunoMusicParams extends GenerateMusicBaseParams {
  title?: string;
  makeInstrumental?: boolean;
  tags?: string;
  prompt?: string;
  continueClipId?: string;
  continueAt?: number | string;
}

// Resultado de la tarea
export interface TaskResult {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
}

/**
 * Genera música utilizando Udio a través de PiAPI
 * @param params Parámetros para la generación de música con Udio
 * @returns Resultado de la tarea con ID para verificar estado
 */
export async function generateMusicWithUdio(params: UdioMusicParams): Promise<TaskResult> {
  try {
    const response = await piapiClient.post(PIAPI_ENDPOINT, {
      model: 'music-u',
      task_type: 'generate_music',
      input: {
        gpt_description_prompt: params.description,
        negative_tags: params.negativeTags || '',
        lyrics_type: params.lyricsType,
        lyrics: params.lyrics || '',
        seed: params.seed || -1,
        continue_song_id: params.continueClipId,
        continue_at: params.continueAt || 0
      },
      config: {
        service_mode: 'public',
        webhook_config: {
          endpoint: '',
          secret: ''
        }
      }
    });

    return {
      taskId: response.data.data.task_id,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error generating music with Udio:', error);
    throw error;
  }
}

/**
 * Genera música utilizando Suno a través de PiAPI
 * @param params Parámetros para la generación de música con Suno
 * @returns Resultado de la tarea con ID para verificar estado
 */
export async function generateMusicWithSuno(params: SunoMusicParams): Promise<TaskResult> {
  try {
    // Determinamos si es generación simple o personalizada
    const isCustomMode = params.title || params.prompt;
    const taskType = isCustomMode ? 'generate_music_custom' : 'generate_music';
    
    const requestBody: any = {
      model: 'music-s',
      task_type: taskType,
      input: {
        gpt_description_prompt: params.description,
        negative_tags: params.negativeTags || '',
        make_instrumental: params.makeInstrumental || false
      },
      config: {
        service_mode: 'public',
        webhook_config: {
          endpoint: '',
          secret: ''
        }
      }
    };

    // Si es modo personalizado, añadimos los campos adicionales
    if (isCustomMode) {
      requestBody.input.title = params.title || '';
      requestBody.input.prompt = params.prompt || '';
      requestBody.input.tags = params.tags || '';
    }

    // Si es continuación, añadimos los campos necesarios
    if (params.continueClipId) {
      requestBody.input.continue_clip_id = params.continueClipId;
      requestBody.input.continue_at = params.continueAt || 0;
    }

    const response = await piapiClient.post(PIAPI_ENDPOINT, requestBody);

    return {
      taskId: response.data.data.task_id,
      status: 'pending'
    };
  } catch (error) {
    console.error('Error generating music with Suno:', error);
    throw error;
  }
}

/**
 * Verifica el estado de una tarea de generación de música
 * @param taskId ID de la tarea a verificar
 * @returns Estado actual de la tarea y URL del audio si está completo
 */
export async function checkMusicGenerationStatus(taskId: string): Promise<{
  status: 'pending' | 'processing' | 'completed' | 'failed';
  audioUrl?: string;
  error?: string;
}> {
  try {
    const response = await piapiClient.get(`${PIAPI_ENDPOINT}/${taskId}`);
    const data = response.data.data;
    
    if (data.status === 'completed') {
      // Extraer la URL de audio según el modelo
      let audioUrl = '';
      
      if (data.model === 'music-u') {
        // Para Udio
        audioUrl = data.output.audio_url || '';
      } else if (data.model === 'music-s') {
        // Para Suno, extraemos el primer clip
        const clipIds = Object.keys(data.output.clips || {});
        if (clipIds.length > 0) {
          audioUrl = data.output.clips[clipIds[0]].audio_url || '';
        }
      }
      
      return {
        status: 'completed',
        audioUrl
      };
    } else if (data.status === 'failed') {
      return {
        status: 'failed',
        error: data.error?.message || 'Unknown error'
      };
    } else {
      return {
        status: data.status
      };
    }
  } catch (error) {
    console.error('Error checking music generation status:', error);
    return {
      status: 'failed',
      error: 'Error checking status'
    };
  }
}