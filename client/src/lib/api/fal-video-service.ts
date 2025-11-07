import { fal } from "@fal-ai/client";

/**
 * FAL Video Generation Service
 * Integración completa con múltiples modelos de generación de video
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
  duration?: "5" | "10";
  aspectRatio?: "16:9" | "9:16" | "1:1";
  negativePrompt?: string;
  cfgScale?: number;
}

export interface VideoGenerationResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  metadata?: any;
}

/**
 * Modelos disponibles en FAL para generación de video
 */
export const FAL_VIDEO_MODELS = {
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
    console.log(`🎬 Generando video con modelo: ${modelId}`);
    console.log('Opciones:', options);

    const input: any = {
      prompt: options.prompt,
      duration: options.duration || "5"
    };

    // Agregar imageUrl si es image-to-video
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
        console.log('📊 Estado de generación:', update.status);
      }
    });

    console.log('✅ Video generado exitosamente');

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
    console.error('❌ Error generando video con FAL:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar video'
    };
  }
}

/**
 * Generar múltiples videos en paralelo
 */
export async function generateMultipleVideos(
  modelId: string,
  scenes: Array<{ prompt: string; imageUrl?: string }>
): Promise<VideoGenerationResult[]> {
  console.log(`🎬 Generando ${scenes.length} videos en paralelo...`);
  
  const promises = scenes.map((scene, index) => 
    generateVideoWithFAL(modelId, {
      prompt: scene.prompt,
      imageUrl: scene.imageUrl,
      duration: "5", // 5 segundos por defecto
      aspectRatio: "16:9"
    }).then(result => {
      console.log(`✅ Video ${index + 1}/${scenes.length} completado`);
      return result;
    })
  );

  return Promise.all(promises);
}

/**
 * Obtener modelos recomendados según el tipo de generación
 */
export function getRecommendedModels(type: 'text-to-video' | 'image-to-video' = 'image-to-video') {
  return Object.values(FAL_VIDEO_MODELS)
    .filter(model => model.type === type || model.type === 'text-to-video')
    .sort((a, b) => {
      // Ordenar por calidad (premium primero)
      const order = { 'Premium': 0, 'Premium+': 1, 'Medio': 2, '$0.25/5seg': 3 };
      return (order[a.pricing as keyof typeof order] || 99) - (order[b.pricing as keyof typeof order] || 99);
    });
}

/**
 * Obtener modelo por ID o nombre
 */
export function getModelById(id: string) {
  return Object.values(FAL_VIDEO_MODELS).find(model => model.id === id);
}

export default {
  models: FAL_VIDEO_MODELS,
  generate: generateVideoWithFAL,
  generateMultiple: generateMultipleVideos,
  getRecommended: getRecommendedModels,
  getById: getModelById
};
