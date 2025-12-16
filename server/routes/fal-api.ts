/**
 * FAL API Backend Routes
 * Maneja todas las llamadas a FAL.ai desde el backend
 * Seguridad: Las credenciales FAL_API_KEY están en el servidor, no expuestas al frontend
 */

import { Router, type Request, type Response } from 'express';
import { logApiUsage } from '../utils/api-logger';

const router = Router();

// Verificar que las API keys estén configuradas (principal + backup)
const FAL_API_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY;
const FAL_API_KEY_BACKUP = process.env.FAL_KEY_BACKUP;

if (!FAL_API_KEY) {
  console.error('⚠️ WARNING: FAL_KEY no está configurada. Las funciones de FAL AI no funcionarán.');
} else if (!FAL_API_KEY_BACKUP) {
  console.warn('⚠️ WARNING: FAL_KEY_BACKUP no está configurada. No habrá failover automático.');
} else {
  console.log('✅ FAL API keys configuradas: Principal + Backup (failover automático habilitado)');
}

/**
 * Sistema de failover automático para FAL API
 * Intenta con la key principal primero, y usa la backup si falla por balance agotado
 */
async function fetchWithFailover(url: string, options: RequestInit, context: string = 'FAL API'): Promise<Response> {
  // Intentar con la key principal
  const primaryOptions = {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Key ${FAL_API_KEY}`
    }
  };

  try {
    const response = await fetch(url, primaryOptions);
    
    // Si es 403 y menciona balance agotado, intentar con backup
    if (response.status === 403 && FAL_API_KEY_BACKUP) {
      // Clonar response para poder leer el body sin consumirlo
      const clonedResponse = response.clone();
      const errorText = await clonedResponse.text();
      
      if (errorText.includes('Exhausted balance') || errorText.includes('locked')) {
        console.warn(`⚠️ [FAILOVER] Key principal sin balance. Usando backup para: ${context}`);
        console.log(`🔄 [FAILOVER] Reintentando con FAL_KEY_BACKUP...`);
        
        // Reintentar con la key de backup
        const backupOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Key ${FAL_API_KEY_BACKUP}`
          }
        };
        
        const backupResponse = await fetch(url, backupOptions);
        
        if (backupResponse.ok) {
          console.log(`✅ [FAILOVER] FAL_KEY_BACKUP funcionó correctamente para: ${context}`);
        } else {
          console.error(`❌ [FAILOVER] FAL_KEY_BACKUP también falló para: ${context}`);
        }
        
        return backupResponse;
      }
    }
    
    return response;
  } catch (error) {
    console.error(`❌ [FAILOVER] Error en ${context}:`, error);
    throw error;
  }
}

/**
 * Registra uso de FAL API después de cada llamada exitosa
 */
async function logFalUsage(model: string, imageCount: number = 1, error?: string) {
  await logApiUsage({
    apiProvider: 'fal',
    endpoint: '/subscribe',
    model,
    totalTokens: imageCount * 1000, // Estimamos 1000 tokens por imagen/resultado
    status: error ? 'error' : 'success',
    errorMessage: error || null,
    metadata: { imageCount }
  });
}

/**
 * GET /api/fal/debug-failover
 * Endpoint de debug para verificar el sistema de failover
 */
router.get('/debug-failover', async (req: Request, res: Response) => {
  res.json({
    hasPrimaryKey: !!FAL_API_KEY,
    hasBackupKey: !!FAL_API_KEY_BACKUP,
    failoverEnabled: !!FAL_API_KEY && !!FAL_API_KEY_BACKUP,
    message: !!FAL_API_KEY && !!FAL_API_KEY_BACKUP 
      ? 'Failover automático está habilitado' 
      : 'Failover no está completamente configurado'
  });
});

interface MuseTalkRequest {
  imageUrl: string;
  audioUrl: string;
  bbox_shift?: number;
}

interface MuseTalkResponse {
  success: boolean;
  videoUrl?: string;
  error?: string;
  requestId?: string;
  processingTime?: number;
}

/**
 * POST /api/fal/musetalk
 * Genera un video de talking head (lip-sync) usando MuseTalk
 */
router.post('/musetalk', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_API_KEY not configured on server'
      });
    }

    const { imageUrl, audioUrl, bbox_shift = 5 } = req.body as MuseTalkRequest;

    if (!imageUrl || !audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl and audioUrl are required'
      });
    }

    console.log('🎭 [FAL-BACKEND] Starting MuseTalk job...');
    console.log('🖼️ Image:', imageUrl.substring(0, 60));
    console.log('🎵 Audio:', audioUrl.substring(0, 60));

    const startTime = Date.now();

    // Submit job a FAL AI
    const submitResponse = await fetch('https://queue.fal.run/fal-ai/musetalk', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: imageUrl,
        audio_url: audioUrl,
        bbox_shift
      })
    });

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error('❌ [FAL-BACKEND] Error submitting job:', errorData);
      return res.status(500).json({
        success: false,
        error: `Error submitting job: ${submitResponse.statusText}`
      });
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    console.log(`⏳ [FAL-BACKEND] Job submitted: ${requestId}`);

    // Poll para obtener el resultado
    let attempts = 0;
    const maxAttempts = 90; // 7.5 minutos máximo

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos

      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/musetalk/requests/${requestId}/status`,
        {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`
          }
        }
      );

      if (!statusResponse.ok) {
        console.error('❌ [FAL-BACKEND] Error checking status');
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();

      if (statusData.status === 'COMPLETED') {
        // Obtener el resultado
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/musetalk/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${FAL_API_KEY}`
            }
          }
        );

        if (!resultResponse.ok) {
          return res.status(500).json({
            success: false,
            error: 'Error retrieving result'
          });
        }

        const resultData = await resultResponse.json();
        const processingTime = (Date.now() - startTime) / 1000;

        console.log(`✅ [FAL-BACKEND] MuseTalk completed in ${processingTime.toFixed(1)}s!`);

        return res.json({
          success: true,
          videoUrl: resultData.video?.url || resultData.output?.url,
          requestId,
          processingTime
        } as MuseTalkResponse);
      }

      if (statusData.status === 'FAILED') {
        console.error('❌ [FAL-BACKEND] Job failed:', statusData.error);
        return res.status(500).json({
          success: false,
          error: statusData.error || 'Processing failed'
        });
      }

      // IN_QUEUE o IN_PROGRESS
      console.log(`⏳ [FAL-BACKEND] Status: ${statusData.status} (${attempts + 1}/${maxAttempts})`);
      attempts++;
    }

    return res.status(408).json({
      success: false,
      error: 'Processing timeout - took too long'
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/fal/status/:requestId
 * Verifica el estado de un job de FAL AI
 */
router.get('/status/:requestId', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_API_KEY not configured'
      });
    }

    const { requestId } = req.params;

    const statusResponse = await fetch(
      `https://queue.fal.run/fal-ai/musetalk/requests/${requestId}/status`,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`
        }
      }
    );

    if (!statusResponse.ok) {
      return res.status(500).json({
        success: false,
        error: 'Error checking status'
      });
    }

    const statusData = await statusResponse.json();
    return res.json(statusData);

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error checking status:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/fal/minimax-music
 * Genera música usando FAL AI minimax-music/v2
 */
router.post('/minimax-music', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_API_KEY not configured on server'
      });
    }

    const { prompt, duration, reference_audio_url } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required'
      });
    }

    console.log('🎵 [FAL-BACKEND] Starting minimax-music/v2 generation...');
    console.log('📝 Prompt:', prompt.substring(0, 100));

    const startTime = Date.now();

    // Submit job a FAL AI minimax-music/v2 con failover automático
    const submitResponse = await fetchWithFailover(
      'https://queue.fal.run/fal-ai/minimax-music/v2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          duration: duration || 30,
          reference_audio_url: reference_audio_url || undefined
        })
      },
      'Minimax Music Submit'
    );

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error('❌ [FAL-BACKEND] Error submitting music job:', errorData);
      return res.status(500).json({
        success: false,
        error: `Error submitting music job: ${submitResponse.statusText}`,
        details: errorData
      });
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    console.log(`⏳ [FAL-BACKEND] Music job submitted: ${requestId}`);

    // Return request ID immediately for polling
    res.json({
      success: true,
      requestId,
      message: 'Music generation started'
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error in minimax-music:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/fal/minimax-music/:requestId
 * Obtiene el estado de una generación de música
 */
router.get('/minimax-music/:requestId', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_API_KEY not configured'
      });
    }

    const { requestId } = req.params;

    // Check status first con failover automático
    console.log(`🔍 [FAL-BACKEND] Checking status for: ${requestId}`);
    
    const statusResponse = await fetchWithFailover(
      `https://queue.fal.run/fal-ai/minimax-music/requests/${requestId}/status`,
      {
        headers: {}
      },
      'Minimax Music Status'
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error(`❌ [FAL-BACKEND] Status check failed (${statusResponse.status}):`, errorText);
      return res.status(500).json({
        success: false,
        error: 'Error checking music status',
        details: errorText,
        statusCode: statusResponse.status
      });
    }

    const statusData = await statusResponse.json();
    console.log(`✅ [FAL-BACKEND] Status data:`, statusData);

    // If completed, get the result con failover automático
    if (statusData.status === 'COMPLETED') {
      const resultResponse = await fetchWithFailover(
        `https://queue.fal.run/fal-ai/minimax-music/requests/${requestId}`,
        {
          headers: {}
        },
        'Minimax Music Result'
      );

      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        return res.json({
          success: true,
          status: 'completed',
          audioUrl: resultData.audio?.url,
          duration: resultData.duration,
          data: resultData
        });
      }
    }

    // Return status for in-progress or pending
    res.json({
      success: true,
      status: statusData.status.toLowerCase(),
      message: statusData.status
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error checking music status:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/fal/stable-audio
 * Genera música usando FAL AI Stable Audio 2.5
 */
router.post('/stable-audio', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_KEY not configured on server'
      });
    }

    const { prompt, duration } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required'
      });
    }

    console.log('🎵 [FAL-BACKEND] Starting Stable Audio 2.5 generation...');
    console.log('📝 Prompt:', prompt.substring(0, 100));
    console.log('⏱️ Duration:', duration || 180);

    // Submit job a FAL AI Stable Audio 2.5 con failover automático
    const submitResponse = await fetchWithFailover(
      'https://queue.fal.run/fal-ai/stable-audio-25/text-to-audio',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          duration: duration || 180  // 3 minutos por defecto
        })
      },
      'Stable Audio Submit'
    );

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error('❌ [FAL-BACKEND] Error submitting Stable Audio job:', errorData);
      return res.status(500).json({
        success: false,
        error: `Error submitting Stable Audio job: ${submitResponse.statusText}`,
        details: errorData
      });
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    console.log(`⏳ [FAL-BACKEND] Stable Audio job submitted: ${requestId}`);

    // Return request ID immediately for polling
    res.json({
      success: true,
      requestId,
      message: 'Stable Audio generation started'
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error in stable-audio:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/fal/stable-audio/:requestId
 * Obtiene el estado de una generación de Stable Audio
 */
router.get('/stable-audio/:requestId', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_KEY not configured'
      });
    }

    const { requestId } = req.params;

    // Check status first con failover automático
    console.log(`🔍 [FAL-BACKEND] Checking Stable Audio status for: ${requestId}`);
    
    const statusResponse = await fetchWithFailover(
      `https://queue.fal.run/fal-ai/stable-audio-25/requests/${requestId}/status`,
      {
        headers: {}
      },
      'Stable Audio Status'
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error(`❌ [FAL-BACKEND] Stable Audio status check failed (${statusResponse.status}):`, errorText);
      return res.status(500).json({
        success: false,
        error: 'Error checking Stable Audio status',
        details: errorText,
        statusCode: statusResponse.status
      });
    }

    const statusData = await statusResponse.json();
    console.log(`✅ [FAL-BACKEND] Stable Audio status data:`, statusData);

    // If completed, get the result con failover automático
    if (statusData.status === 'COMPLETED') {
      const resultResponse = await fetchWithFailover(
        `https://queue.fal.run/fal-ai/stable-audio-25/requests/${requestId}`,
        {
          headers: {}
        },
        'Stable Audio Result'
      );

      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        return res.json({
          success: true,
          status: 'completed',
          audioUrl: resultData.audio?.url,
          duration: resultData.duration,
          data: resultData
        });
      }
    }

    // Return status for in-progress or pending
    res.json({
      success: true,
      status: statusData.status.toLowerCase(),
      message: statusData.status
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error checking Stable Audio status:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// 🖼️ NANO-BANANA IMAGE GENERATION (fal-ai/nano-banana)
// ============================================================================

interface NanoBananaRequest {
  prompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1' | '4:3' | '3:4';
  negativePrompt?: string;
  numImages?: number;
}

/**
 * POST /api/fal/nano-banana/generate
 * Genera imágenes usando FAL nano-banana (reemplaza Gemini)
 */
router.post('/nano-banana/generate', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_KEY not configured on server'
      });
    }

    const { prompt, aspectRatio = '16:9', negativePrompt, numImages = 1 } = req.body as NanoBananaRequest;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required'
      });
    }

    console.log('🍌 [FAL-BACKEND] Starting Nano-Banana image generation...');
    console.log('📝 Prompt:', prompt.substring(0, 80));

    const startTime = Date.now();

    // Llamar a FAL nano-banana
    const response = await fetchWithFailover(
      'https://fal.run/fal-ai/nano-banana',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          prompt,
          negative_prompt: negativePrompt || 'blurry, low quality, distorted, deformed',
          image_size: aspectRatio === '16:9' ? 'landscape_16_9' : 
                      aspectRatio === '9:16' ? 'portrait_16_9' :
                      aspectRatio === '4:3' ? 'landscape_4_3' :
                      aspectRatio === '3:4' ? 'portrait_4_3' : 'square',
          num_images: numImages,
          enable_safety_checker: true
        })
      },
      'Nano-Banana Generate'
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [FAL-BACKEND] Nano-Banana error:', errorData);
      await logFalUsage('nano-banana', 0, JSON.stringify(errorData));
      return res.status(500).json({
        success: false,
        error: `Error generating image: ${response.statusText}`,
        details: errorData
      });
    }

    const data = await response.json();
    const processingTime = (Date.now() - startTime) / 1000;

    console.log(`✅ [FAL-BACKEND] Nano-Banana completed in ${processingTime.toFixed(1)}s!`);
    await logFalUsage('nano-banana', data.images?.length || 1);

    // Devolver la primera imagen o todas
    const imageUrl = data.images?.[0]?.url;
    
    res.json({
      success: true,
      imageUrl,
      images: data.images,
      processingTime,
      seed: data.seed
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error in nano-banana:', error);
    await logFalUsage('nano-banana', 0, error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/fal/nano-banana/edit
 * Edita imágenes usando FAL nano-banana/edit
 */
router.post('/nano-banana/edit', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_KEY not configured on server'
      });
    }

    const { imageUrl, prompt, maskUrl } = req.body;

    if (!imageUrl || !prompt) {
      return res.status(400).json({
        success: false,
        error: 'imageUrl and prompt are required'
      });
    }

    console.log('🍌✏️ [FAL-BACKEND] Starting Nano-Banana image edit...');

    const startTime = Date.now();

    const response = await fetchWithFailover(
      'https://fal.run/fal-ai/nano-banana/edit',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image_url: imageUrl,
          prompt,
          mask_url: maskUrl,
          enable_safety_checker: true
        })
      },
      'Nano-Banana Edit'
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [FAL-BACKEND] Nano-Banana edit error:', errorData);
      return res.status(500).json({
        success: false,
        error: `Error editing image: ${response.statusText}`,
        details: errorData
      });
    }

    const data = await response.json();
    const processingTime = (Date.now() - startTime) / 1000;

    console.log(`✅ [FAL-BACKEND] Nano-Banana edit completed in ${processingTime.toFixed(1)}s!`);
    await logFalUsage('nano-banana-edit', 1);

    res.json({
      success: true,
      imageUrl: data.images?.[0]?.url,
      images: data.images,
      processingTime
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error in nano-banana edit:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// 🎬 KLING VIDEO GENERATION (fal-ai/kling-video)
// ============================================================================

interface KlingVideoRequest {
  prompt: string;
  imageUrl?: string;
  referenceImages?: string[];
  duration?: '5' | '10';
  aspectRatio?: '16:9' | '9:16' | '1:1';
  model?: 'o1-standard-i2v' | 'o1-standard-ref2v' | 'v2.1-pro-i2v' | 'v2.1-standard-i2v';
}

/**
 * POST /api/fal/kling-video/generate
 * Genera video desde imagen usando FAL Kling (reemplaza PiAPI)
 */
router.post('/kling-video/generate', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_KEY not configured on server'
      });
    }

    const { 
      prompt, 
      imageUrl, 
      referenceImages,
      duration = '5', 
      aspectRatio = '16:9',
      model = 'o1-standard-i2v'
    } = req.body as KlingVideoRequest;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required'
      });
    }

    // Determinar el endpoint FAL según el modelo
    let falEndpoint: string;
    let requestBody: any = {
      prompt,
      duration,
      aspect_ratio: aspectRatio
    };

    switch (model) {
      case 'o1-standard-ref2v':
        // Reference-to-Video: mantiene identidad de personajes
        falEndpoint = 'https://queue.fal.run/fal-ai/kling-video/o1/standard/reference-to-video';
        if (!referenceImages || referenceImages.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'referenceImages are required for reference-to-video model'
          });
        }
        requestBody.reference_images = referenceImages.map(url => ({ image_url: url }));
        break;
        
      case 'o1-standard-i2v':
        // Image-to-Video O1
        falEndpoint = 'https://queue.fal.run/fal-ai/kling-video/o1/standard/image-to-video';
        if (!imageUrl) {
          return res.status(400).json({
            success: false,
            error: 'imageUrl is required for image-to-video model'
          });
        }
        requestBody.image_url = imageUrl;
        break;
        
      case 'v2.1-pro-i2v':
        // Image-to-Video v2.1 Pro
        falEndpoint = 'https://queue.fal.run/fal-ai/kling-video/v2.1/pro/image-to-video';
        if (!imageUrl) {
          return res.status(400).json({
            success: false,
            error: 'imageUrl is required for image-to-video model'
          });
        }
        requestBody.image_url = imageUrl;
        break;
        
      case 'v2.1-standard-i2v':
      default:
        // Image-to-Video v2.1 Standard (más económico)
        falEndpoint = 'https://queue.fal.run/fal-ai/kling-video/v2.1/standard/image-to-video';
        if (!imageUrl) {
          return res.status(400).json({
            success: false,
            error: 'imageUrl is required for image-to-video model'
          });
        }
        requestBody.image_url = imageUrl;
        break;
    }

    console.log(`🎬 [FAL-BACKEND] Starting Kling Video generation (${model})...`);
    console.log('📝 Prompt:', prompt.substring(0, 80));
    console.log('🔗 Endpoint:', falEndpoint);

    const startTime = Date.now();

    // Submit job a FAL (queue mode para videos)
    const submitResponse = await fetchWithFailover(
      falEndpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      },
      `Kling Video ${model}`
    );

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error('❌ [FAL-BACKEND] Kling Video submit error:', errorData);
      await logFalUsage(`kling-video-${model}`, 0, JSON.stringify(errorData));
      return res.status(500).json({
        success: false,
        error: `Error submitting video job: ${submitResponse.statusText}`,
        details: errorData
      });
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    console.log(`⏳ [FAL-BACKEND] Kling Video job submitted: ${requestId}`);

    // Si hay request_id, es asíncrono - retornar para polling
    if (requestId) {
      await logFalUsage(`kling-video-${model}`, 1);
      return res.json({
        success: true,
        requestId,
        model,
        message: 'Video generation started',
        estimatedTime: duration === '5' ? '60-120 seconds' : '120-180 seconds'
      });
    }

    // Si no hay request_id pero hay video, es síncrono
    if (submitData.video?.url) {
      const processingTime = (Date.now() - startTime) / 1000;
      console.log(`✅ [FAL-BACKEND] Kling Video completed in ${processingTime.toFixed(1)}s!`);
      await logFalUsage(`kling-video-${model}`, 1);
      
      return res.json({
        success: true,
        videoUrl: submitData.video.url,
        processingTime,
        model
      });
    }

    // Si llegamos aquí, algo salió mal
    return res.status(500).json({
      success: false,
      error: 'Unexpected response from FAL',
      data: submitData
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error in kling-video:', error);
    await logFalUsage('kling-video', 0, error instanceof Error ? error.message : 'Unknown error');
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/fal/kling-video/:requestId
 * Obtiene el estado/resultado de una generación de video
 */
router.get('/kling-video/:requestId', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_KEY not configured'
      });
    }

    const { requestId } = req.params;
    const { model = 'o1-standard-i2v' } = req.query;

    // Determinar el endpoint base según el modelo
    let baseEndpoint: string;
    switch (model) {
      case 'o1-standard-ref2v':
        baseEndpoint = 'fal-ai/kling-video/o1/standard/reference-to-video';
        break;
      case 'o1-standard-i2v':
        baseEndpoint = 'fal-ai/kling-video/o1/standard/image-to-video';
        break;
      case 'v2.1-pro-i2v':
        baseEndpoint = 'fal-ai/kling-video/v2.1/pro/image-to-video';
        break;
      default:
        baseEndpoint = 'fal-ai/kling-video/v2.1/standard/image-to-video';
    }

    console.log(`🔍 [FAL-BACKEND] Checking Kling Video status: ${requestId}`);

    // Check status
    const statusResponse = await fetchWithFailover(
      `https://queue.fal.run/${baseEndpoint}/requests/${requestId}/status`,
      { headers: {} },
      'Kling Video Status'
    );

    if (!statusResponse.ok) {
      const errorText = await statusResponse.text();
      console.error(`❌ [FAL-BACKEND] Kling Video status check failed:`, errorText);
      return res.status(500).json({
        success: false,
        error: 'Error checking video status',
        details: errorText
      });
    }

    const statusData = await statusResponse.json();
    console.log(`✅ [FAL-BACKEND] Kling Video status:`, statusData.status);

    // If completed, get result
    if (statusData.status === 'COMPLETED') {
      const resultResponse = await fetchWithFailover(
        `https://queue.fal.run/${baseEndpoint}/requests/${requestId}`,
        { headers: {} },
        'Kling Video Result'
      );

      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        return res.json({
          success: true,
          status: 'completed',
          videoUrl: resultData.video?.url,
          duration: resultData.duration,
          data: resultData
        });
      }
    }

    // If failed
    if (statusData.status === 'FAILED') {
      return res.json({
        success: false,
        status: 'failed',
        error: statusData.error || 'Video generation failed'
      });
    }

    // Still processing
    res.json({
      success: true,
      status: statusData.status?.toLowerCase() || 'processing',
      message: statusData.status
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error checking Kling Video status:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ============================================================================
// 🎭 IMAGE GENERATION WITH FACE REFERENCE (fal-ai/pulid for face consistency)
// ============================================================================

/**
 * POST /api/fal/nano-banana/generate-with-face
 * Genera imágenes manteniendo consistencia facial usando PuLID
 */
router.post('/nano-banana/generate-with-face', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_KEY not configured on server'
      });
    }

    const { prompt, referenceImages, aspectRatio = '16:9', sceneId } = req.body;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required'
      });
    }

    console.log(`🎭 [FAL-BACKEND] Starting image generation with face reference...`);
    console.log(`📝 Prompt: ${prompt.substring(0, 80)}...`);
    console.log(`🖼️ Reference images: ${referenceImages?.length || 0}`);

    const startTime = Date.now();

    // Si hay referencias faciales, usar PuLID para mantener consistencia
    let endpoint = 'https://fal.run/fal-ai/nano-banana';
    let requestBody: any = {
      prompt,
      negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
      image_size: aspectRatio === '16:9' ? 'landscape_16_9' : 
                  aspectRatio === '9:16' ? 'portrait_16_9' : 'square',
      num_images: 1,
      enable_safety_checker: true
    };

    // Si hay referencias, usar flux-pulid para consistencia facial
    if (referenceImages && referenceImages.length > 0) {
      endpoint = 'https://fal.run/fal-ai/flux-pulid';
      const firstReference = referenceImages[0];
      
      // La referencia puede ser URL o base64
      const referenceUrl = firstReference.startsWith('data:') 
        ? firstReference  // Ya es base64
        : firstReference; // Es URL
      
      requestBody = {
        prompt: `${prompt}, same person as in reference image, consistent facial features, same identity`,
        reference_image_url: referenceUrl,
        num_images: 1,
        guidance_scale: 4,
        true_cfg: 1,
        id_weight: 1,
        max_sequence_length: 128,
        enable_safety_checker: true
      };
      
      console.log(`🎭 [FAL-BACKEND] Using PuLID for face consistency`);
    }

    const response = await fetchWithFailover(
      endpoint,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      },
      'Image Generation with Face'
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ [FAL-BACKEND] Image generation error:', errorData);
      await logFalUsage('nano-banana-face', 0, JSON.stringify(errorData));
      return res.status(500).json({
        success: false,
        error: `Error generating image: ${response.statusText}`,
        details: errorData
      });
    }

    const data = await response.json();
    const processingTime = (Date.now() - startTime) / 1000;

    console.log(`✅ [FAL-BACKEND] Image with face completed in ${processingTime.toFixed(1)}s!`);
    await logFalUsage('nano-banana-face', 1);

    const imageUrl = data.images?.[0]?.url;

    res.json({
      success: true,
      imageUrl,
      images: data.images,
      sceneId,
      processingTime,
      usedFaceReference: !!(referenceImages && referenceImages.length > 0)
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error in generate-with-face:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/fal/nano-banana/generate-batch
 * Genera múltiples imágenes en batch
 */
router.post('/nano-banana/generate-batch', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_KEY not configured on server'
      });
    }

    const { prompts, aspectRatio = '16:9', referenceImages } = req.body;

    if (!prompts || !Array.isArray(prompts) || prompts.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'prompts array is required'
      });
    }

    console.log(`🍌 [FAL-BACKEND] Starting batch generation for ${prompts.length} images...`);

    const startTime = Date.now();
    const results: any[] = [];
    const useFaceRef = referenceImages && referenceImages.length > 0;

    // Generar imágenes secuencialmente para evitar rate limits
    for (let i = 0; i < prompts.length; i++) {
      const prompt = prompts[i];
      console.log(`🖼️ [${i + 1}/${prompts.length}] Generating...`);

      try {
        let endpoint = 'https://fal.run/fal-ai/nano-banana';
        let requestBody: any = {
          prompt,
          negative_prompt: 'blurry, low quality, distorted',
          image_size: aspectRatio === '16:9' ? 'landscape_16_9' : 'square',
          num_images: 1,
          enable_safety_checker: true
        };

        if (useFaceRef) {
          endpoint = 'https://fal.run/fal-ai/flux-pulid';
          requestBody = {
            prompt: `${prompt}, same person as in reference, consistent identity`,
            reference_image_url: referenceImages[0],
            num_images: 1,
            guidance_scale: 4,
            id_weight: 1,
            enable_safety_checker: true
          };
        }

        const response = await fetchWithFailover(
          endpoint,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          },
          `Batch Image ${i + 1}`
        );

        if (response.ok) {
          const data = await response.json();
          results.push({
            success: true,
            imageUrl: data.images?.[0]?.url,
            index: i
          });
        } else {
          results.push({
            success: false,
            error: `HTTP ${response.status}`,
            index: i
          });
        }

        // Pequeña pausa entre requests para evitar rate limiting
        if (i < prompts.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (error) {
        results.push({
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          index: i
        });
      }
    }

    const processingTime = (Date.now() - startTime) / 1000;
    const successCount = results.filter(r => r.success).length;

    console.log(`✅ [FAL-BACKEND] Batch completed: ${successCount}/${prompts.length} in ${processingTime.toFixed(1)}s`);
    await logFalUsage('nano-banana-batch', successCount);

    res.json({
      success: true,
      results,
      totalProcessed: prompts.length,
      successCount,
      failCount: prompts.length - successCount,
      processingTime
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error in batch generation:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
