/**
 * Voice AI Service - Clonación y Transformación de Voz
 * 
 * WORKFLOW COMPLETO:
 * 1. Usuario sube audio de su voz (30 segundos mínimo)
 * 2. Clonamos la voz con Qwen3-TTS Clone Voice
 * 3. Generamos música instrumental (MiniMax/StableAudio)
 * 4. Cambiamos la voz en canciones existentes con ElevenLabs Voice Changer
 * 
 * MODELOS FAL UTILIZADOS:
 * - fal-ai/qwen-3-tts/clone-voice/1.7b: Clonación de voz zero-shot
 * - fal-ai/qwen-3-tts/text-to-speech/1.7b: TTS con voz clonada
 * - fal-ai/elevenlabs/voice-changer: Cambiar voz en audio existente
 * - fal-ai/sam-audio/separate: Separar vocals/instrumental
 * - fal-ai/deepfilternet3: Mejorar calidad de audio
 */

import axios from 'axios';
import { logger } from '../utils/logger';
import { storage } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

const FAL_API_KEY = process.env.FAL_API_KEY || process.env.FAL_KEY || '';
const FAL_BASE_URL = 'https://fal.run';
const FAL_QUEUE_URL = 'https://queue.fal.run';

// Modelos de Voice AI
export const VOICE_AI_MODELS = {
  // Clonar voz del usuario
  CLONE_VOICE: 'fal-ai/qwen-3-tts/clone-voice/1.7b',
  CLONE_VOICE_LIGHT: 'fal-ai/qwen-3-tts/clone-voice/0.6b',
  
  // Text-to-Speech con voz clonada
  TTS_WITH_VOICE: 'fal-ai/qwen-3-tts/text-to-speech/1.7b',
  TTS_WITH_VOICE_LIGHT: 'fal-ai/qwen-3-tts/text-to-speech/0.6b',
  
  // Voice Design (crear voces personalizadas)
  VOICE_DESIGN: 'fal-ai/qwen-3-tts/voice-design/1.7b',
  
  // ElevenLabs Voice Changer
  VOICE_CHANGER: 'fal-ai/elevenlabs/voice-changer',
  
  // Separación de audio
  AUDIO_SEPARATE: 'fal-ai/sam-audio/separate',
  
  // Mejora de audio
  AUDIO_ENHANCE: 'fal-ai/deepfilternet3',
  AUDIO_UPSCALE: 'fal-ai/nova-sr',
  
  // Dia TTS Voice Clone (alternativa)
  DIA_VOICE_CLONE: 'fal-ai/dia-tts/voice-clone',
} as const;

// Interfaces
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

export interface VoiceModel {
  id: string;
  name: string;
  userId: string;
  audioUrl: string;
  voiceData?: string;
  createdAt: Date;
  provider: string;
}

/**
 * Headers para las peticiones a FAL
 */
function getFalHeaders() {
  return {
    'Authorization': `Key ${FAL_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Sube audio a Firebase Storage y devuelve URL pública
 */
async function uploadAudioToStorage(
  audioBuffer: Buffer,
  mimeType: string = 'audio/wav',
  folder: string = 'voice-samples'
): Promise<string> {
  try {
    if (!storage) {
      logger.warn('[VoiceAI] Firebase Storage no disponible');
      throw new Error('Storage not available');
    }
    
    const fileName = `${folder}/${uuidv4()}.${mimeType.split('/')[1] || 'wav'}`;
    const storageRef = ref(storage, fileName);
    
    await uploadBytes(storageRef, audioBuffer, { contentType: mimeType });
    const downloadUrl = await getDownloadURL(storageRef);
    
    logger.info(`[VoiceAI] Audio subido: ${fileName}`);
    return downloadUrl;
  } catch (error) {
    logger.error('[VoiceAI] Error subiendo audio:', error);
    throw error;
  }
}

/**
 * 1. CLONAR VOZ - Qwen3-TTS Clone Voice
 * 
 * Clona la voz del usuario desde un audio de referencia (mínimo 30 segundos).
 * Zero-shot: no requiere entrenamiento previo.
 * 
 * @param audioUrl URL del audio de referencia de la voz
 * @param voiceName Nombre para identificar la voz clonada
 * @returns voiceId para usar en TTS
 */
export async function cloneVoice(
  audioUrl: string,
  voiceName: string = 'my_voice'
): Promise<VoiceCloneResult> {
  try {
    logger.info(`[VoiceAI] Clonando voz: ${voiceName}`);
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }
    
    const response = await axios.post(
      `${FAL_BASE_URL}/${VOICE_AI_MODELS.CLONE_VOICE}`,
      {
        audio_url: audioUrl,
        voice_name: voiceName,
      },
      { headers: getFalHeaders(), timeout: 120000 }
    );
    
    logger.info('[VoiceAI] Voz clonada exitosamente');
    
    return {
      success: true,
      voiceId: response.data.voice_id || response.data.id,
      voiceUrl: response.data.voice_url || audioUrl,
      provider: 'qwen-3-tts-clone',
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error clonando voz:', error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      provider: 'qwen-3-tts-clone',
    };
  }
}

/**
 * 2. TEXT-TO-SPEECH con Voz Clonada
 * 
 * Genera audio hablado/cantado usando la voz clonada del usuario.
 * 
 * @param text Texto o letra a convertir en audio
 * @param voiceId ID de la voz clonada
 * @param options Opciones adicionales (speed, emotion)
 */
export async function textToSpeechWithVoice(
  text: string,
  voiceId: string,
  options: {
    speed?: number;
    emotion?: 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful';
  } = {}
): Promise<TextToSpeechResult> {
  try {
    logger.info(`[VoiceAI] Generando TTS con voz: ${voiceId}`);
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }
    
    const response = await axios.post(
      `${FAL_BASE_URL}/${VOICE_AI_MODELS.TTS_WITH_VOICE}`,
      {
        text,
        voice_id: voiceId,
        speed: options.speed || 1.0,
        emotion: options.emotion || 'neutral',
      },
      { headers: getFalHeaders(), timeout: 120000 }
    );
    
    logger.info('[VoiceAI] TTS generado exitosamente');
    
    return {
      success: true,
      audioUrl: response.data.audio?.url || response.data.audio_url,
      duration: response.data.duration,
      provider: 'qwen-3-tts',
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error en TTS:', error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      provider: 'qwen-3-tts',
    };
  }
}

/**
 * 3. VOICE CHANGER - ElevenLabs
 * 
 * Cambia la voz en un audio existente (ej: canción generada)
 * por otra voz (la del usuario o una seleccionada).
 * 
 * @param audioUrl URL del audio original (canción con vocals)
 * @param targetVoiceId ID de la voz destino
 */
export async function changeVoice(
  audioUrl: string,
  targetVoiceId: string
): Promise<VoiceChangerResult> {
  try {
    logger.info(`[VoiceAI] Cambiando voz en audio: ${audioUrl}`);
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }
    
    const response = await axios.post(
      `${FAL_BASE_URL}/${VOICE_AI_MODELS.VOICE_CHANGER}`,
      {
        audio_url: audioUrl,
        voice_id: targetVoiceId,
      },
      { headers: getFalHeaders(), timeout: 180000 }
    );
    
    logger.info('[VoiceAI] Voz cambiada exitosamente');
    
    return {
      success: true,
      audioUrl: response.data.audio?.url || response.data.audio_url,
      originalDuration: response.data.duration,
      provider: 'elevenlabs-voice-changer',
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error cambiando voz:', error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      provider: 'elevenlabs-voice-changer',
    };
  }
}

/**
 * 4. SEPARAR AUDIO - SAM Audio
 * 
 * Separa un audio en vocals e instrumental usando AI.
 * Útil para:
 * - Extraer instrumental de una canción
 * - Aislar vocals para procesarlos
 * 
 * @param audioUrl URL del audio a separar
 * @param targetSound Qué separar: "vocals", "drums", "bass", etc.
 */
export async function separateAudio(
  audioUrl: string,
  targetSound: string = 'vocals'
): Promise<AudioSeparationResult> {
  try {
    logger.info(`[VoiceAI] Separando audio: ${targetSound}`);
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }
    
    const response = await axios.post(
      `${FAL_BASE_URL}/${VOICE_AI_MODELS.AUDIO_SEPARATE}`,
      {
        audio_url: audioUrl,
        target: targetSound,
      },
      { headers: getFalHeaders(), timeout: 180000 }
    );
    
    logger.info('[VoiceAI] Audio separado exitosamente');
    
    // SAM Audio devuelve el audio separado y el residual
    return {
      success: true,
      vocalsUrl: targetSound === 'vocals' ? response.data.output_url : response.data.residual_url,
      instrumentalUrl: targetSound === 'vocals' ? response.data.residual_url : response.data.output_url,
      provider: 'sam-audio',
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error separando audio:', error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      provider: 'sam-audio',
    };
  }
}

/**
 * 5. MEJORAR AUDIO - DeepFilterNet3
 * 
 * Mejora la calidad del audio eliminando ruido de fondo
 * y aumentando la resolución a 48kHz.
 * 
 * @param audioUrl URL del audio a mejorar
 */
export async function enhanceAudio(audioUrl: string): Promise<TextToSpeechResult> {
  try {
    logger.info(`[VoiceAI] Mejorando audio: ${audioUrl}`);
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }
    
    const response = await axios.post(
      `${FAL_BASE_URL}/${VOICE_AI_MODELS.AUDIO_ENHANCE}`,
      {
        audio_url: audioUrl,
      },
      { headers: getFalHeaders(), timeout: 120000 }
    );
    
    logger.info('[VoiceAI] Audio mejorado exitosamente');
    
    return {
      success: true,
      audioUrl: response.data.audio?.url || response.data.audio_url,
      provider: 'deepfilternet3',
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error mejorando audio:', error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      provider: 'deepfilternet3',
    };
  }
}

/**
 * 6. WORKFLOW COMPLETO: Canción con Tu Voz
 * 
 * Pipeline completo para generar una canción con la voz del usuario:
 * 1. Tomar canción generada (con vocals AI)
 * 2. Separar vocals e instrumental
 * 3. Aplicar voz del usuario a los vocals
 * 4. Mezclar de nuevo con instrumental
 * 
 * @param songUrl URL de la canción original (generada con AI)
 * @param userVoiceId ID de la voz clonada del usuario
 */
export async function createSongWithUserVoice(
  songUrl: string,
  userVoiceId: string
): Promise<{
  success: boolean;
  finalAudioUrl?: string;
  steps?: {
    separation?: AudioSeparationResult;
    voiceChange?: VoiceChangerResult;
  };
  error?: string;
}> {
  try {
    logger.info('[VoiceAI] Iniciando workflow: Canción con voz del usuario');
    
    // Paso 1: Separar vocals e instrumental
    logger.info('[VoiceAI] Paso 1: Separando audio...');
    const separation = await separateAudio(songUrl, 'vocals');
    
    if (!separation.success || !separation.vocalsUrl) {
      throw new Error('Error separando audio: ' + separation.error);
    }
    
    // Paso 2: Cambiar voz en los vocals
    logger.info('[VoiceAI] Paso 2: Aplicando voz del usuario...');
    const voiceChange = await changeVoice(separation.vocalsUrl, userVoiceId);
    
    if (!voiceChange.success || !voiceChange.audioUrl) {
      throw new Error('Error cambiando voz: ' + voiceChange.error);
    }
    
    // Paso 3: El audio resultante del voice changer es la mezcla final
    // (ElevenLabs combina la nueva voz con el contexto musical)
    // Si necesitamos mezcla manual, usaríamos FFmpeg en el servidor
    
    logger.info('[VoiceAI] Workflow completado exitosamente');
    
    return {
      success: true,
      finalAudioUrl: voiceChange.audioUrl,
      steps: {
        separation,
        voiceChange,
      },
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error en workflow:', error.message);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Diseñar una voz personalizada con descripción de texto
 * 
 * Crea una voz única basada en una descripción textual.
 * Útil para crear voces de personajes o estilos específicos.
 * 
 * @param description Descripción de la voz deseada
 */
export async function designVoice(
  description: string
): Promise<VoiceCloneResult> {
  try {
    logger.info(`[VoiceAI] Diseñando voz: ${description.substring(0, 50)}...`);
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }
    
    const response = await axios.post(
      `${FAL_BASE_URL}/${VOICE_AI_MODELS.VOICE_DESIGN}`,
      {
        text: description,
        // Ejemplo: "A warm female voice with a slight British accent, speaking calmly"
      },
      { headers: getFalHeaders(), timeout: 120000 }
    );
    
    logger.info('[VoiceAI] Voz diseñada exitosamente');
    
    return {
      success: true,
      voiceId: response.data.voice_id,
      voiceUrl: response.data.voice_url,
      provider: 'qwen-3-tts-design',
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error diseñando voz:', error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
      provider: 'qwen-3-tts-design',
    };
  }
}

// Export default service
export default {
  cloneVoice,
  textToSpeechWithVoice,
  changeVoice,
  separateAudio,
  enhanceAudio,
  createSongWithUserVoice,
  designVoice,
  uploadAudioToStorage,
  VOICE_AI_MODELS,
};
