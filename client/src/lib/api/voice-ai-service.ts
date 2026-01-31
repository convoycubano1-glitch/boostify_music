/**
 * Voice AI Service - Cliente
 * 
 * Servicio para interactuar con la API de Voice AI desde el frontend.
 * Permite clonar voces, cambiar voces en canciones, y crear canciones personalizadas.
 */

import { logger } from '../logger';

const API_BASE = '/api/voice-ai';

// Interfaces
export interface VoiceModel {
  id: string;
  name: string;
  audioUrl: string;
  createdAt: string;
  provider: string;
}

export interface VoiceCloneResult {
  success: boolean;
  voiceId?: string;
  voiceUrl?: string;
  error?: string;
  provider?: string;
}

export interface TextToSpeechResult {
  success: boolean;
  audioUrl?: string;
  duration?: number;
  error?: string;
  provider?: string;
}

export interface VoiceChangerResult {
  success: boolean;
  audioUrl?: string;
  originalDuration?: number;
  error?: string;
  provider?: string;
}

export interface AudioSeparationResult {
  success: boolean;
  vocalsUrl?: string;
  instrumentalUrl?: string;
  error?: string;
  provider?: string;
}

export interface CreateSongResult {
  success: boolean;
  finalAudioUrl?: string;
  steps?: {
    separation?: AudioSeparationResult;
    voiceChange?: VoiceChangerResult;
  };
  error?: string;
}

export interface VoiceAIModels {
  CLONE_VOICE: string;
  TTS_WITH_VOICE: string;
  VOICE_CHANGER: string;
  AUDIO_SEPARATE: string;
  AUDIO_ENHANCE: string;
}

export interface VoiceAIFeature {
  id: string;
  name: string;
  description: string;
}

/**
 * Obtiene los modelos y features disponibles
 */
export async function getVoiceAIModels(): Promise<{
  models: VoiceAIModels;
  features: VoiceAIFeature[];
}> {
  try {
    const response = await fetch(`${API_BASE}/models`);
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error('[VoiceAI Client] Error getting models:', error);
    throw error;
  }
}

/**
 * Clona la voz del usuario desde un archivo de audio
 * 
 * @param audioFile Archivo de audio (mínimo 30 segundos)
 * @param voiceName Nombre para identificar la voz
 */
export async function cloneVoice(
  audioFile: File,
  voiceName: string = 'my_voice'
): Promise<VoiceCloneResult> {
  try {
    logger.info(`[VoiceAI Client] Clonando voz: ${voiceName}`);
    
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('voiceName', voiceName);
    
    const response = await fetch(`${API_BASE}/clone`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error clonando voz');
    }
    
    return data;
  } catch (error: any) {
    logger.error('[VoiceAI Client] Error cloning voice:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Clona la voz desde una URL de audio
 */
export async function cloneVoiceFromUrl(
  audioUrl: string,
  voiceName: string = 'my_voice'
): Promise<VoiceCloneResult> {
  try {
    logger.info(`[VoiceAI Client] Clonando voz desde URL: ${voiceName}`);
    
    const response = await fetch(`${API_BASE}/clone`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioUrl, voiceName }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error clonando voz');
    }
    
    return data;
  } catch (error: any) {
    logger.error('[VoiceAI Client] Error cloning voice from URL:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Genera audio con Text-to-Speech usando una voz clonada
 * 
 * @param text Texto a convertir en audio
 * @param voiceId ID de la voz clonada
 * @param options Opciones de velocidad y emoción
 */
export async function textToSpeech(
  text: string,
  voiceId: string,
  options: {
    speed?: number;
    emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful';
  } = {}
): Promise<TextToSpeechResult> {
  try {
    logger.info(`[VoiceAI Client] TTS con voz: ${voiceId}`);
    
    const response = await fetch(`${API_BASE}/tts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voiceId,
        speed: options.speed || 1.0,
        emotion: options.emotion || 'neutral',
      }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error en TTS');
    }
    
    return data;
  } catch (error: any) {
    logger.error('[VoiceAI Client] Error in TTS:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cambia la voz en un audio existente (canción, podcast, etc.)
 * 
 * @param audioFile Archivo de audio original
 * @param targetVoiceId ID de la voz destino
 */
export async function changeVoice(
  audioFile: File,
  targetVoiceId: string
): Promise<VoiceChangerResult> {
  try {
    logger.info(`[VoiceAI Client] Cambiando voz a: ${targetVoiceId}`);
    
    const formData = new FormData();
    formData.append('audio', audioFile);
    formData.append('targetVoiceId', targetVoiceId);
    
    const response = await fetch(`${API_BASE}/change-voice`, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error cambiando voz');
    }
    
    return data;
  } catch (error: any) {
    logger.error('[VoiceAI Client] Error changing voice:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Cambia la voz desde una URL de audio
 */
export async function changeVoiceFromUrl(
  audioUrl: string,
  targetVoiceId: string
): Promise<VoiceChangerResult> {
  try {
    logger.info(`[VoiceAI Client] Cambiando voz desde URL`);
    
    const response = await fetch(`${API_BASE}/change-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioUrl, targetVoiceId }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error cambiando voz');
    }
    
    return data;
  } catch (error: any) {
    logger.error('[VoiceAI Client] Error changing voice from URL:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Separa vocals e instrumental de un audio
 * 
 * @param audioUrl URL del audio a separar
 * @param target Qué separar: 'vocals', 'drums', 'bass', etc.
 */
export async function separateAudio(
  audioUrl: string,
  target: string = 'vocals'
): Promise<AudioSeparationResult> {
  try {
    logger.info(`[VoiceAI Client] Separando audio: ${target}`);
    
    const response = await fetch(`${API_BASE}/separate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioUrl, target }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error separando audio');
    }
    
    return data;
  } catch (error: any) {
    logger.error('[VoiceAI Client] Error separating audio:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Mejora la calidad del audio (elimina ruido, sube a 48kHz)
 * 
 * @param audioUrl URL del audio a mejorar
 */
export async function enhanceAudio(audioUrl: string): Promise<TextToSpeechResult> {
  try {
    logger.info(`[VoiceAI Client] Mejorando audio`);
    
    const response = await fetch(`${API_BASE}/enhance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ audioUrl }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error mejorando audio');
    }
    
    return data;
  } catch (error: any) {
    logger.error('[VoiceAI Client] Error enhancing audio:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Workflow completo: Crea una canción con la voz del usuario
 * 
 * 1. Toma una canción generada (con AI vocals)
 * 2. Separa vocals e instrumental
 * 3. Reemplaza vocals con la voz del usuario
 * 4. Devuelve canción final
 * 
 * @param songUrl URL de la canción original (generada con AI)
 * @param userVoiceId ID de la voz clonada del usuario
 */
export async function createSongWithUserVoice(
  songUrl: string,
  userVoiceId: string
): Promise<CreateSongResult> {
  try {
    logger.info(`[VoiceAI Client] Creando canción con voz del usuario`);
    
    const response = await fetch(`${API_BASE}/create-song`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ songUrl, userVoiceId }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error creando canción');
    }
    
    return data;
  } catch (error: any) {
    logger.error('[VoiceAI Client] Error creating song:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Diseña una voz personalizada desde descripción de texto
 * 
 * @param description Descripción de la voz deseada
 * Ejemplo: "A warm female voice with a slight British accent, speaking calmly"
 */
export async function designVoice(description: string): Promise<VoiceCloneResult> {
  try {
    logger.info(`[VoiceAI Client] Diseñando voz`);
    
    const response = await fetch(`${API_BASE}/design-voice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ description }),
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error || 'Error diseñando voz');
    }
    
    return data;
  } catch (error: any) {
    logger.error('[VoiceAI Client] Error designing voice:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Export all functions
export default {
  getVoiceAIModels,
  cloneVoice,
  cloneVoiceFromUrl,
  textToSpeech,
  changeVoice,
  changeVoiceFromUrl,
  separateAudio,
  enhanceAudio,
  createSongWithUserVoice,
  designVoice,
};
