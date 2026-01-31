import { fal } from "@fal-ai/client";
import { logger } from "../logger";

/**
 * FAL Video Generation Service
 * Integración completa con múltiples modelos de generación de video
 * 
 * WORKFLOW RECOMENDADO PARA MUSIC VIDEOS:
 * 1. Generar imagen con nano-banana (Text-to-Image) - $0.039/imagen
 * 2. Convertir a video con Grok Imagine Video - $0.05/segundo ($0.30/6s video)
 * 3. Editar video con Grok Edit - $0.06/segundo input+output
 */

// Configurar FAL con la clave de API
if (import.meta.env.FAL_API_KEY) {
  fal.config({
    credentials: import.meta.env.FAL_API_KEY
  });
}

export interface VideoGenerationOptions {
  prompt: string;
  imageUrl?: string;
  referenceImages?: string[]; // Para O1 reference-to-video (imágenes del artista)
  duration?: "5" | "6" | "10";
  aspectRatio?: "16:9" | "9:16" | "1:1" | "auto";
  negativePrompt?: string;
  cfgScale?: number;
  resolution?: "480p" | "720p";
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  metadata?: any;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
}

/**
 * Modelos disponibles en FAL para generación de video
 */
export const FAL_VIDEO_MODELS = {
  // ========== GROK IMAGINE VIDEO (xAI) - PRINCIPAL ==========
  GROK_IMAGE_TO_VIDEO: {
    id: "xai/grok-imagine-video/image-to-video",
    name: "Grok Imagine Video ⭐",
    description: "xAI's Grok - Genera videos de alta calidad desde imágenes con audio nativo",
    type: "image-to-video",
    maxDuration: 6,
    pricing: "$0.30/6seg",
    recommended: true
  },
  
  GROK_EDIT_VIDEO: {
    id: "xai/grok-imagine-video/edit-video",
    name: "Grok Edit Video",
    description: "Edita videos existentes con prompts de texto (colorizar, estilizar)",
    type: "video-to-video",
    maxDuration: 8,
    pricing: "$0.06/seg"
  },
  
  // Google Veo 3 - El más avanzado del mundo
  VEO_3: {
    id: "fal-ai/veo3",
    name: "Google Veo 3",
    description: "Modelo más avanzado de Google con generación de audio",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "$0.20-0.40/seg"
  },
  
  // OpenAI Sora 2 - State-of-the-art
  SORA_2_PRO: {
    id: "fal-ai/sora-2-pro",
    name: "OpenAI Sora 2 Pro",
    description: "Modelo premium de OpenAI con audio",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "Premium"
  },
  
  // KLING 2.5 Turbo Pro - Top-tier cinematic
  KLING_2_5_TURBO_PRO_T2V: {
    id: "fal-ai/kling-video/v2.5-turbo/pro/text-to-video",
    name: "KLING 2.5 Turbo Pro (Text-to-Video)",
    description: "Máxima calidad cinematográfica, fluidez de movimiento excepcional",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "Premium"
  },
  
  KLING_2_5_TURBO_PRO_I2V: {
    id: "fal-ai/kling-video/v2.5-turbo/pro/image-to-video",
    name: "KLING 2.5 Turbo Pro (Image-to-Video)",
    description: "Animación cinematográfica de imágenes",
    type: "image-to-video",
    maxDuration: 10,
    pricing: "Premium"
  },
  
  // KLING 2.1 Master - Premium tier
  KLING_2_1_MASTER_T2V: {
    id: "fal-ai/kling-video/v2.1/master/text-to-video",
    name: "KLING 2.1 Master (Text-to-Video)",
    description: "Calidad premium con fluidez de movimiento sin igual",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "$1.40/5seg"
  },
  
  KLING_2_1_MASTER_I2V: {
    id: "fal-ai/kling-video/v2.1/master/image-to-video",
    name: "KLING 2.1 Master (Image-to-Video)",
    description: "Animación premium de imágenes estáticas",
    type: "image-to-video",
    maxDuration: 10,
    pricing: "$1.40/5seg"
  },
  
  // KLING 2.1 Pro - Professional grade
  KLING_2_1_PRO_T2V: {
    id: "fal-ai/kling-video/v2.1/pro/text-to-video",
    name: "KLING 2.1 Pro (Text-to-Video)",
    description: "Grado profesional con fidelidad visual mejorada",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "$0.45/5seg"
  },
  
  KLING_2_1_PRO_I2V: {
    id: "fal-ai/kling-video/v2.1/pro/image-to-video",
    name: "KLING 2.1 Pro (Image-to-Video)",
    description: "Animación profesional con movimientos de cámara precisos",
    type: "image-to-video",
    maxDuration: 10,
    pricing: "$0.45/5seg"
  },
  
  // KLING 2.1 Standard - Cost-efficient
  KLING_2_1_STANDARD_T2V: {
    id: "fal-ai/kling-video/v2.1/standard/text-to-video",
    name: "KLING 2.1 Standard (Text-to-Video)",
    description: "Alta calidad a precio accesible",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "$0.25/5seg"
  },
  
  KLING_2_1_STANDARD_I2V: {
    id: "fal-ai/kling-video/v2.1/standard/image-to-video",
    name: "KLING 2.1 Standard (Image-to-Video)",
    description: "Animación de calidad a precio económico",
    type: "image-to-video",
    maxDuration: 10,
    pricing: "$0.25/5seg"
  },
  
  // KLING O1 - NEW! Reference-to-Video (mejor consistencia de personajes)
  KLING_O1_STANDARD_REF2V: {
    id: "fal-ai/kling-video/o1/standard/reference-to-video",
    name: "KLING O1 Reference-to-Video ⭐",
    description: "Mantiene identidad consistente de personajes, objetos y entornos - IDEAL para Music Videos",
    type: "reference-to-video",
    maxDuration: 10,
    pricing: "$0.30/5seg"
  },
  
  KLING_O1_STANDARD_I2V: {
    id: "fal-ai/kling-video/o1/standard/image-to-video",
    name: "KLING O1 Image-to-Video",
    description: "Genera video animando transición entre frames con guía de texto",
    type: "image-to-video",
    maxDuration: 10,
    pricing: "$0.30/5seg"
  },
  
  KLING_O1_V2V_REFERENCE: {
    id: "fal-ai/kling-video/o1/standard/video-to-video/reference",
    name: "KLING O1 Video Reference",
    description: "Genera nuevos planos guiados por video de referencia preservando continuidad",
    type: "video-to-video",
    maxDuration: 10,
    pricing: "$0.35/5seg"
  },
  
  // KLING 2.6 Pro - Newest tier with audio
  KLING_2_6_PRO_T2V: {
    id: "fal-ai/kling-video/v2.6/pro/text-to-video",
    name: "KLING 2.6 Pro (Text-to-Video)",
    description: "Top-tier con visuales cinematográficos, movimiento fluido y audio nativo",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "Premium+"
  },
  
  KLING_2_6_PRO_I2V: {
    id: "fal-ai/kling-video/v2.6/pro/image-to-video",
    name: "KLING 2.6 Pro (Image-to-Video)",
    description: "Top-tier image-to-video con audio nativo generado",
    type: "image-to-video",
    maxDuration: 10,
    pricing: "Premium+"
  },
  
  // Hunyuan Video (Tencent) - Open-source de alta calidad
  HUNYUAN_VIDEO: {
    id: "fal-ai/hunyuan-video",
    name: "Hunyuan Video (Tencent)",
    description: "Open-source de alta calidad visual y diversidad de movimiento",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "Medio"
  },
  
  // Wan 2.5 - Image-to-Video de alta calidad
  WAN_2_5: {
    id: "fal-ai/wan-i2v",
    name: "Wan 2.5 (Image-to-Video)",
    description: "Alta calidad con diversidad de movimiento (720p)",
    type: "image-to-video",
    maxDuration: 10,
    pricing: "$0.40/video"
  },
  
  // Luma Dream Machine
  LUMA_DREAM_MACHINE: {
    id: "fal-ai/luma-dream-machine",
    name: "Luma Dream Machine",
    description: "Movimiento realista de alta calidad",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "Medio"
  },
  
  // MiniMax Hailuo-02
  MINIMAX_HAILUO: {
    id: "fal-ai/minimax-hailuo-02",
    name: "MiniMax Hailuo-02",
    description: "Video de alta resolución (768p/512p)",
    type: "text-to-video",
    maxDuration: 10,
    pricing: "Medio"
  },
  
  // Framepack - Autoregressive generation
  FRAMEPACK: {
    id: "fal-ai/framepack",
    name: "Framepack",
    description: "Generación autoregresiva hasta 180 frames",
    type: "image-to-video",
    maxDuration: 10,
    pricing: "$0.0333/seg"
  }
};

/**
 * Generar video usando modelo de FAL
 */
export async function generateVideoWithFAL(
  modelId: string,
  options: VideoGenerationOptions
): Promise<VideoGenerationResult> {
  try {
    logger.info(`🎬 Generando video con modelo: ${modelId}`);
    logger.info('Opciones:', options);

    const input: any = {
      prompt: options.prompt,
      duration: options.duration || "5"
    };

    // Detectar si es un modelo reference-to-video (O1)
    const isReferenceToVideo = modelId.includes('reference-to-video');
    
    // Para modelos reference-to-video, usar reference_images
    if (isReferenceToVideo && options.referenceImages && options.referenceImages.length > 0) {
      input.reference_images = options.referenceImages;
      logger.info(`🎨 Usando ${options.referenceImages.length} imágenes de referencia para consistencia de personajes`);
    }
    
    // Para image-to-video tradicional, usar image_url
    if (options.imageUrl) {
      input.image_url = options.imageUrl;
    }

    // Agregar aspect ratio si está disponible
    if (options.aspectRatio) {
      input.aspect_ratio = options.aspectRatio;
    }

    // Agregar negative prompt
    if (options.negativePrompt) {
      input.negative_prompt = options.negativePrompt;
    }

    // Agregar CFG scale
    if (options.cfgScale !== undefined) {
      input.cfg_scale = options.cfgScale;
    }

    // Suscribirse al modelo y esperar resultado
    const result = await fal.subscribe(modelId, {
      input,
      logs: true,
      onQueueUpdate: (update) => {
        logger.info('📊 Estado de generación:', update.status);
      }
    });

    logger.info('✅ Video generado exitosamente');

    // Extraer URL del video del resultado
    let videoUrl = '';
    if (result.data?.video?.url) {
      videoUrl = result.data.video.url;
    } else if (result.data?.output_url) {
      videoUrl = result.data.output_url;
    } else if (result.data?.url) {
      videoUrl = result.data.url;
    }

    if (!videoUrl) {
      throw new Error('No se pudo obtener URL del video generado');
    }

    return {
      success: true,
      videoUrl,
      metadata: result.data
    };
  } catch (error: any) {
    logger.error('❌ Error generando video con FAL:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar video'
    };
  }
}

/**
 * Generar múltiples videos en paralelo
 * @param modelId - ID del modelo FAL a usar
 * @param scenes - Array de escenas con prompt e imagen
 * @param referenceImages - Imágenes de referencia del artista para O1 reference-to-video
 */
export async function generateMultipleVideos(
  modelId: string,
  scenes: Array<{ prompt: string; imageUrl?: string }>,
  referenceImages?: string[]
): Promise<VideoGenerationResult[]> {
  logger.info(`🎬 Generando ${scenes.length} videos en paralelo...`);
  
  const isReferenceModel = modelId.includes('reference-to-video');
  if (isReferenceModel && referenceImages?.length) {
    logger.info(`🎨 Usando modelo O1 reference-to-video con ${referenceImages.length} imágenes de referencia`);
  }
  
  const promises = scenes.map((scene, index) => 
    generateVideoWithFAL(modelId, {
      prompt: scene.prompt,
      imageUrl: scene.imageUrl,
      duration: "5", // 5 segundos por defecto
      aspectRatio: "16:9",
      // Pasar imágenes de referencia para consistencia de personajes
      referenceImages: isReferenceModel ? referenceImages : undefined
    }).then(result => {
      logger.info(`✅ Video ${index + 1}/${scenes.length} completado`);
      return result;
    })
  );

  return Promise.all(promises);
}

/**
 * Obtener modelos recomendados según el tipo de generación
 * @param type - Tipo de generación: 'text-to-video', 'image-to-video', 'reference-to-video', 'video-to-video'
 */
export function getRecommendedModels(type: 'text-to-video' | 'image-to-video' | 'reference-to-video' | 'video-to-video' = 'image-to-video') {
  return Object.values(FAL_VIDEO_MODELS)
    .filter(model => {
      // Para reference-to-video y image-to-video, incluir ambos tipos + Grok
      if (type === 'image-to-video' || type === 'reference-to-video') {
        return model.type === 'image-to-video' || model.type === 'reference-to-video';
      }
      if (type === 'video-to-video') {
        return model.type === 'video-to-video';
      }
      return model.type === type || model.type === 'text-to-video';
    })
    .sort((a, b) => {
      // Ordenar: Grok primero, luego O1 reference-to-video, luego por calidad
      const aIsGrok = a.id.includes('grok') ? -2 : 0;
      const bIsGrok = b.id.includes('grok') ? -2 : 0;
      if (aIsGrok !== bIsGrok) return aIsGrok - bIsGrok;
      
      const isAReference = a.type === 'reference-to-video' ? -1 : 0;
      const isBReference = b.type === 'reference-to-video' ? -1 : 0;
      if (isAReference !== isBReference) return isAReference - isBReference;
      
      const order = { 'Premium': 0, 'Premium+': 1, 'Medio': 2, '$0.25/5seg': 3, '$0.30/5seg': 4, '$0.30/6seg': 5 };
      return (order[a.pricing as keyof typeof order] || 99) - (order[b.pricing as keyof typeof order] || 99);
    });
}

/**
 * Obtener modelos recomendados para Music Videos
 * Prioriza: Grok Imagine > O1 reference-to-video > otros image-to-video
 */
export function getMusicVideoModels() {
  return Object.values(FAL_VIDEO_MODELS)
    .filter(model => model.type === 'image-to-video' || model.type === 'reference-to-video')
    .sort((a, b) => {
      // Grok primero (recomendado para Music Videos)
      const aIsGrok = a.id.includes('grok') ? -2 : 0;
      const bIsGrok = b.id.includes('grok') ? -2 : 0;
      if (aIsGrok !== bIsGrok) return aIsGrok - bIsGrok;
      
      // O1 Reference-to-video segundo (mantiene consistencia del artista)
      if (a.type === 'reference-to-video' && b.type !== 'reference-to-video') return -1;
      if (b.type === 'reference-to-video' && a.type !== 'reference-to-video') return 1;
      return 0;
    });
}

/**
 * Obtener modelo por ID o nombre
 */
export function getModelById(id: string) {
  return Object.values(FAL_VIDEO_MODELS).find(model => model.id === id);
}

/**
 * Verificar si un modelo es de tipo reference-to-video
 */
export function isReferenceToVideoModel(modelId: string): boolean {
  return modelId.includes('reference-to-video');
}

/**
 * Verificar si un modelo es Grok
 */
export function isGrokModel(modelId: string): boolean {
  return modelId.includes('grok-imagine-video');
}

/**
 * Generar video usando el workflow recomendado (Grok Imagine)
 * Primero genera imagen con nano-banana, luego la convierte a video
 */
export async function generateMusicVideoSceneWithGrok(
  imagePrompt: string,
  motionPrompt: string,
  options: {
    aspectRatio?: "16:9" | "9:16" | "1:1";
    duration?: "6";
    resolution?: "480p" | "720p";
    editStyle?: string; // Opcional: estilo de post-producción
  } = {}
): Promise<{
  success: boolean;
  imageUrl?: string;
  videoUrl?: string;
  editedVideoUrl?: string;
  error?: string;
}> {
  try {
    logger.info(`🎬 [Grok Workflow] Generando escena de Music Video...`);
    
    // Este endpoint llama al servidor que tiene el workflow completo
    const response = await fetch('/api/fal/music-video-scene', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        imagePrompt,
        motionPrompt,
        aspectRatio: options.aspectRatio || '16:9',
        duration: options.duration || '6',
        resolution: options.resolution || '720p',
        editStyle: options.editStyle
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Error generando escena');
    }
    
    return result;
  } catch (error: any) {
    logger.error('❌ [Grok Workflow] Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

export default {
  models: FAL_VIDEO_MODELS,
  generate: generateVideoWithFAL,
  generateMultiple: generateMultipleVideos,
  generateMusicVideoScene: generateMusicVideoSceneWithGrok,
  getRecommended: getRecommendedModels,
  getMusicVideo: getMusicVideoModels,
  getById: getModelById,
  isReferenceModel: isReferenceToVideoModel,
  isGrokModel: isGrokModel
};
