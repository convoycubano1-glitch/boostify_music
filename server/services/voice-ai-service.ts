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
 * @param referenceText Texto opcional que se dice en el audio (mejora calidad)
 * @returns speaker_embedding URL para usar en TTS
 */
export async function cloneVoice(
  audioUrl: string,
  referenceText?: string
): Promise<VoiceCloneResult> {
  try {
    logger.info(`[VoiceAI] Clonando voz desde audio: ${audioUrl}`);
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }
    
    // Usar el cliente FAL con subscribe para manejar el queue
    const requestBody: any = {
      audio_url: audioUrl,
    };
    
    if (referenceText) {
      requestBody.reference_text = referenceText;
    }
    
    const response = await axios.post(
      `${FAL_QUEUE_URL}/${VOICE_AI_MODELS.CLONE_VOICE}`,
      requestBody,
      { headers: getFalHeaders(), timeout: 120000 }
    );
    
    // FAL devuelve un request_id para el queue
    const requestId = response.data.request_id;
    logger.info(`[VoiceAI] Request ID: ${requestId}`);
    
    // Polling para obtener el resultado
    let result = null;
    let attempts = 0;
    const maxAttempts = 60; // 2 minutos max
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos
      
      const statusResponse = await axios.get(
        `${FAL_QUEUE_URL}/${VOICE_AI_MODELS.CLONE_VOICE}/requests/${requestId}/status`,
        { headers: getFalHeaders() }
      );
      
      if (statusResponse.data.status === 'COMPLETED') {
        const resultResponse = await axios.get(
          `${FAL_QUEUE_URL}/${VOICE_AI_MODELS.CLONE_VOICE}/requests/${requestId}`,
          { headers: getFalHeaders() }
        );
        result = resultResponse.data;
        break;
      } else if (statusResponse.data.status === 'FAILED') {
        throw new Error(statusResponse.data.error || 'Voice cloning failed');
      }
      
      attempts++;
    }
    
    if (!result) {
      throw new Error('Voice cloning timeout');
    }
    
    logger.info('[VoiceAI] Voz clonada exitosamente');
    
    // El resultado contiene speaker_embedding con la URL del archivo safetensors
    return {
      success: true,
      voiceId: result.speaker_embedding?.url || result.speaker_embedding,
      voiceUrl: result.speaker_embedding?.url || result.speaker_embedding,
      provider: 'qwen-3-tts-clone',
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error clonando voz:', error.response?.data || error.message);
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
 * El voiceId es la URL del speaker_embedding (archivo .safetensors)
 * 
 * @param text Texto o letra a convertir en audio
 * @param speakerEmbeddingUrl URL del speaker embedding de la voz clonada
 * @param options Opciones adicionales (language, referenceText)
 */
export async function textToSpeechWithVoice(
  text: string,
  speakerEmbeddingUrl: string,
  options: {
    language?: 'Auto' | 'English' | 'Spanish' | 'French' | 'German' | 'Italian' | 'Japanese' | 'Korean' | 'Portuguese' | 'Russian' | 'Chinese';
    referenceText?: string;
    temperature?: number;
  } = {}
): Promise<TextToSpeechResult> {
  try {
    logger.info(`[VoiceAI] Generando TTS con voz clonada`);
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }
    
    const requestBody: any = {
      text,
      speaker_voice_embedding_file_url: speakerEmbeddingUrl,
      language: options.language || 'Auto',
      temperature: options.temperature || 0.9,
    };
    
    if (options.referenceText) {
      requestBody.reference_text = options.referenceText;
    }
    
    // Usar queue para manejar el proceso
    const response = await axios.post(
      `${FAL_QUEUE_URL}/${VOICE_AI_MODELS.TTS_WITH_VOICE}`,
      requestBody,
      { headers: getFalHeaders(), timeout: 120000 }
    );
    
    const requestId = response.data.request_id;
    logger.info(`[VoiceAI] TTS Request ID: ${requestId}`);
    
    // Polling para obtener el resultado
    let result = null;
    let attempts = 0;
    const maxAttempts = 60;
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axios.get(
        `${FAL_QUEUE_URL}/${VOICE_AI_MODELS.TTS_WITH_VOICE}/requests/${requestId}/status`,
        { headers: getFalHeaders() }
      );
      
      if (statusResponse.data.status === 'COMPLETED') {
        const resultResponse = await axios.get(
          `${FAL_QUEUE_URL}/${VOICE_AI_MODELS.TTS_WITH_VOICE}/requests/${requestId}`,
          { headers: getFalHeaders() }
        );
        result = resultResponse.data;
        break;
      } else if (statusResponse.data.status === 'FAILED') {
        throw new Error(statusResponse.data.error || 'TTS generation failed');
      }
      
      attempts++;
    }
    
    if (!result) {
      throw new Error('TTS generation timeout');
    }
    
    logger.info('[VoiceAI] TTS generado exitosamente');
    
    return {
      success: true,
      audioUrl: result.audio?.url || result.audio_url,
      duration: result.audio?.duration || result.duration,
      provider: 'qwen-3-tts',
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error en TTS:', error.response?.data || error.message);
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
 * 6. TRANSCRIBIR AUDIO - ElevenLabs Scribe V2
 * 
 * Transcribe el audio de vocals para obtener la letra.
 * 
 * @param audioUrl URL del audio a transcribir
 */
export async function transcribeAudio(audioUrl: string): Promise<{
  success: boolean;
  text?: string;
  words?: Array<{text: string; start: number; end: number}>;
  error?: string;
}> {
  try {
    logger.info(`[VoiceAI] Transcribiendo audio: ${audioUrl}`);
    
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }
    
    const response = await axios.post(
      `${FAL_QUEUE_URL}/fal-ai/elevenlabs/speech-to-text/scribe-v2`,
      {
        audio_url: audioUrl,
        diarize: false,
        tag_audio_events: false,
      },
      { headers: getFalHeaders(), timeout: 120000 }
    );
    
    const requestId = response.data.request_id;
    
    // Polling
    let result = null;
    let attempts = 0;
    while (attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const statusResponse = await axios.get(
        `${FAL_QUEUE_URL}/fal-ai/elevenlabs/speech-to-text/scribe-v2/requests/${requestId}/status`,
        { headers: getFalHeaders() }
      );
      
      if (statusResponse.data.status === 'COMPLETED') {
        const resultResponse = await axios.get(
          `${FAL_QUEUE_URL}/fal-ai/elevenlabs/speech-to-text/scribe-v2/requests/${requestId}`,
          { headers: getFalHeaders() }
        );
        result = resultResponse.data;
        break;
      } else if (statusResponse.data.status === 'FAILED') {
        throw new Error('Transcription failed');
      }
      attempts++;
    }
    
    if (!result) {
      throw new Error('Transcription timeout');
    }
    
    logger.info('[VoiceAI] Transcripción completada');
    
    return {
      success: true,
      text: result.text,
      words: result.words,
    };
  } catch (error: any) {
    logger.error('[VoiceAI] Error transcribiendo:', error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message,
    };
  }
}

/**
 * 7. WORKFLOW COMPLETO: Canción con Tu Voz
 * 
 * Pipeline completo para poner TU VOZ en una canción generada:
 * 
 * PRERREQUISITO: Usuario ya tiene su voz clonada (speaker_embedding URL)
 * 
 * STEPS:
 * 1. Separar canción en VOCALS + INSTRUMENTAL
 * 2. Transcribir los VOCALS para obtener la letra
 * 3. Generar TTS con TU VOZ CLONADA usando la letra
 * 4. El resultado es: INSTRUMENTAL + TU VOZ (mezcla manual si es necesario)
 * 
 * @param songUrl URL de la canción generada (con vocals AI originales)
 * @param speakerEmbeddingUrl URL del speaker_embedding de tu voz clonada
 * @param options Opciones adicionales
 */
export async function createSongWithUserVoice(
  songUrl: string,
  speakerEmbeddingUrl: string,
  options: {
    language?: 'Auto' | 'English' | 'Spanish';
    enhanceOutput?: boolean;
  } = {}
): Promise<{
  success: boolean;
  finalAudioUrl?: string;
  instrumentalUrl?: string;
  newVocalsUrl?: string;
  lyrics?: string;
  steps?: {
    separation?: AudioSeparationResult;
    transcription?: { text: string };
    tts?: TextToSpeechResult;
    enhance?: TextToSpeechResult;
  };
  error?: string;
}> {
  try {
    logger.info('[VoiceAI] 🎤 Iniciando workflow: Canción con TU VOZ');
    logger.info(`[VoiceAI] Canción original: ${songUrl}`);
    logger.info(`[VoiceAI] Speaker embedding: ${speakerEmbeddingUrl}`);
    
    // ═══════════════════════════════════════════════════════════════
    // PASO 1: Separar la canción en VOCALS + INSTRUMENTAL
    // ═══════════════════════════════════════════════════════════════
    logger.info('[VoiceAI] 📀 Paso 1/4: Separando audio en vocals + instrumental...');
    const separation = await separateAudio(songUrl, 'vocals');
    
    if (!separation.success || !separation.vocalsUrl || !separation.instrumentalUrl) {
      throw new Error('Error separando audio: ' + (separation.error || 'No se obtuvieron las pistas'));
    }
    
    logger.info(`[VoiceAI] ✅ Vocals: ${separation.vocalsUrl}`);
    logger.info(`[VoiceAI] ✅ Instrumental: ${separation.instrumentalUrl}`);
    
    // ═══════════════════════════════════════════════════════════════
    // PASO 2: Transcribir los vocals para obtener la letra
    // ═══════════════════════════════════════════════════════════════
    logger.info('[VoiceAI] 📝 Paso 2/4: Transcribiendo vocals para obtener letra...');
    const transcription = await transcribeAudio(separation.vocalsUrl);
    
    if (!transcription.success || !transcription.text) {
      throw new Error('Error transcribiendo: ' + (transcription.error || 'No se obtuvo texto'));
    }
    
    const lyrics = transcription.text;
    logger.info(`[VoiceAI] ✅ Letra obtenida: "${lyrics.substring(0, 100)}..."`);
    
    // ═══════════════════════════════════════════════════════════════
    // PASO 3: Generar TTS con TU VOZ CLONADA usando la letra
    // ═══════════════════════════════════════════════════════════════
    logger.info('[VoiceAI] 🎙️ Paso 3/4: Generando nuevos vocals con TU VOZ...');
    const tts = await textToSpeechWithVoice(lyrics, speakerEmbeddingUrl, {
      language: options.language || 'Auto',
    });
    
    if (!tts.success || !tts.audioUrl) {
      throw new Error('Error generando TTS: ' + (tts.error || 'No se generó audio'));
    }
    
    logger.info(`[VoiceAI] ✅ Nuevos vocals generados: ${tts.audioUrl}`);
    
    // ═══════════════════════════════════════════════════════════════
    // PASO 4 (Opcional): Mejorar calidad del audio
    // ═══════════════════════════════════════════════════════════════
    let finalVocalsUrl = tts.audioUrl;
    let enhance: TextToSpeechResult | undefined;
    
    if (options.enhanceOutput) {
      logger.info('[VoiceAI] ✨ Paso 4/4: Mejorando calidad de audio...');
      enhance = await enhanceAudio(tts.audioUrl);
      
      if (enhance.success && enhance.audioUrl) {
        finalVocalsUrl = enhance.audioUrl;
        logger.info(`[VoiceAI] ✅ Audio mejorado: ${finalVocalsUrl}`);
      }
    }
    
    // ═══════════════════════════════════════════════════════════════
    // RESULTADO FINAL
    // ═══════════════════════════════════════════════════════════════
    // Nota: Para mezclar INSTRUMENTAL + NUEVOS VOCALS necesitamos FFmpeg
    // Por ahora devolvemos ambas pistas separadas para que el usuario
    // las mezcle en un DAW o usemos un servicio de mezcla
    
    logger.info('[VoiceAI] 🎉 Workflow completado exitosamente!');
    logger.info('[VoiceAI] 📦 Resultados:');
    logger.info(`[VoiceAI]    - Instrumental: ${separation.instrumentalUrl}`);
    logger.info(`[VoiceAI]    - Nuevos Vocals (TU VOZ): ${finalVocalsUrl}`);
    
    return {
      success: true,
      // Por ahora usamos los vocals como "final" - idealmente mezclaríamos
      finalAudioUrl: finalVocalsUrl,
      instrumentalUrl: separation.instrumentalUrl,
      newVocalsUrl: finalVocalsUrl,
      lyrics,
      steps: {
        separation,
        transcription: { text: lyrics },
        tts,
        enhance,
      },
    };
  } catch (error: any) {
    logger.error('[VoiceAI] ❌ Error en workflow:', error.message);
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
  transcribeAudio,
  createSongWithUserVoice,
  designVoice,
  uploadAudioToStorage,
  VOICE_AI_MODELS,
};
