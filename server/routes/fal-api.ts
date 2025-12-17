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

// ============================================================================
// 🎤 PIXVERSE LIPSYNC - Video-to-Video Lip Synchronization
// ============================================================================
// Modelo: fal-ai/pixverse/lipsync
// Costo: ~$0.04/segundo de video
// Input: video_url (video con cara) + audio_url (segmento de audio)
// Output: Video con labios sincronizados al audio

interface PixVerseLipsyncRequest {
  videoUrl: string;
  audioUrl: string;
  clipId?: number;
  sceneId?: number;
}

interface PixVerseLipsyncResponse {
  success: boolean;
  videoUrl?: string;
  requestId?: string;
  processingTime?: number;
  error?: string;
}

/**
 * POST /api/fal/pixverse/lipsync
 * Aplica lip-sync a un video usando PixVerse
 * 
 * WORKFLOW COMPLETO:
 * 1. Imagen → Video (Kling O1)
 * 2. Video + Audio → Lipsync Video (PixVerse)
 */
router.post('/pixverse/lipsync', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_API_KEY not configured on server'
      });
    }

    const { videoUrl, audioUrl, clipId, sceneId } = req.body as PixVerseLipsyncRequest;

    if (!videoUrl || !audioUrl) {
      return res.status(400).json({
        success: false,
        error: 'videoUrl and audioUrl are required'
      });
    }

    console.log('🎤 [FAL-BACKEND] Starting PixVerse Lipsync...');
    console.log(`📹 Video: ${videoUrl.substring(0, 80)}...`);
    console.log(`🎵 Audio: ${audioUrl.substring(0, 80)}...`);
    if (clipId) console.log(`🎬 Clip ID: ${clipId}`);

    const startTime = Date.now();

    // Submit job a FAL AI PixVerse Lipsync
    const submitResponse = await fetchWithFailover(
      'https://queue.fal.run/fal-ai/pixverse/lipsync',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          video_url: videoUrl,
          audio_url: audioUrl
          // NO usamos voice_id ni text - queremos audio real, no TTS
        })
      },
      'PixVerse Lipsync'
    );

    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error('❌ [FAL-BACKEND] Error submitting PixVerse job:', errorData);
      await logFalUsage('pixverse-lipsync', 0, JSON.stringify(errorData));
      return res.status(500).json({
        success: false,
        error: `Error submitting lipsync job: ${submitResponse.statusText}`,
        details: errorData
      });
    }

    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;

    console.log(`⏳ [FAL-BACKEND] PixVerse job submitted: ${requestId}`);

    // Poll para obtener el resultado (lipsync puede tardar 2-5 minutos)
    let attempts = 0;
    const maxAttempts = 120; // 10 minutos máximo
    const pollInterval = 5000; // 5 segundos

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/pixverse/lipsync/requests/${requestId}/status`,
        {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`
          }
        }
      );

      if (!statusResponse.ok) {
        console.warn(`⚠️ [FAL-BACKEND] Error checking PixVerse status (attempt ${attempts + 1})`);
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();

      // === COMPLETED ===
      if (statusData.status === 'COMPLETED') {
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/pixverse/lipsync/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${FAL_API_KEY}`
            }
          }
        );

        if (!resultResponse.ok) {
          return res.status(500).json({
            success: false,
            error: 'Error retrieving lipsync result',
            requestId
          });
        }

        const resultData = await resultResponse.json();
        const processingTime = (Date.now() - startTime) / 1000;
        const lipsyncVideoUrl = resultData.video?.url;

        if (!lipsyncVideoUrl) {
          console.error('❌ [FAL-BACKEND] No video URL in PixVerse response:', resultData);
          return res.status(500).json({
            success: false,
            error: 'No video URL in lipsync response',
            requestId
          });
        }

        console.log(`✅ [FAL-BACKEND] PixVerse Lipsync completed in ${processingTime.toFixed(1)}s!`);
        console.log(`🎬 Lipsync video: ${lipsyncVideoUrl.substring(0, 80)}...`);
        
        await logFalUsage('pixverse-lipsync', 1);

        return res.json({
          success: true,
          videoUrl: lipsyncVideoUrl,
          requestId,
          processingTime,
          clipId,
          sceneId
        } as PixVerseLipsyncResponse);
      }

      // === FAILED ===
      if (statusData.status === 'FAILED') {
        console.error('❌ [FAL-BACKEND] PixVerse job failed:', statusData.error);
        await logFalUsage('pixverse-lipsync', 0, statusData.error);
        return res.status(500).json({
          success: false,
          error: statusData.error || 'Lipsync processing failed',
          requestId
        });
      }

      // IN_QUEUE o IN_PROGRESS
      if (attempts % 6 === 0) { // Log cada 30 segundos
        console.log(`⏳ [FAL-BACKEND] PixVerse status: ${statusData.status} (${Math.round(attempts * pollInterval / 1000)}s elapsed)`);
      }
      attempts++;
    }

    // Timeout
    console.error('❌ [FAL-BACKEND] PixVerse lipsync timeout');
    return res.status(408).json({
      success: false,
      error: 'Lipsync processing timeout - took too long',
      requestId
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] PixVerse Lipsync error:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/fal/pixverse/lipsync/:requestId
 * Verifica el estado de un job de PixVerse lipsync (para polling manual)
 */
router.get('/pixverse/lipsync/:requestId', async (req: Request, res: Response) => {
  try {
    if (!FAL_API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'FAL_API_KEY not configured'
      });
    }

    const { requestId } = req.params;

    const statusResponse = await fetch(
      `https://queue.fal.run/fal-ai/pixverse/lipsync/requests/${requestId}/status`,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`
        }
      }
    );

    if (!statusResponse.ok) {
      return res.status(500).json({
        success: false,
        error: 'Error checking lipsync status'
      });
    }

    const statusData = await statusResponse.json();

    // Si está completo, obtener el resultado
    if (statusData.status === 'COMPLETED') {
      const resultResponse = await fetch(
        `https://queue.fal.run/fal-ai/pixverse/lipsync/requests/${requestId}`,
        {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`
          }
        }
      );

      if (resultResponse.ok) {
        const resultData = await resultResponse.json();
        return res.json({
          success: true,
          status: 'COMPLETED',
          videoUrl: resultData.video?.url,
          requestId
        });
      }
    }

    return res.json({
      success: true,
      status: statusData.status,
      requestId,
      logs: statusData.logs
    });

  } catch (error) {
    console.error('❌ [FAL-BACKEND] Error checking PixVerse status:', error);
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
  model?: 'o1-pro-i2v' | 'o1-standard-i2v' | 'o1-standard-ref2v' | 'v2.1-pro-i2v' | 'v2.1-standard-i2v';
  // 🎬 NUEVOS CAMPOS para instrucciones de movimiento
  motionInstructions?: {
    cameraMovement?: string;       // 'pan', 'dolly', 'tracking', 'crane', 'static', 'handheld'
    movementDirection?: string;    // 'left-to-right', 'right-to-left', 'push-in', 'pull-out', 'up', 'down'
    movementSpeed?: 'slow' | 'medium' | 'fast' | 'dynamic';
    isKeyMoment?: boolean;         // Si es un momento clave de la canción
    keyMomentType?: string;        // 'drop', 'crescendo', 'breakdown', 'climax', 'hook'
    keyMomentEffect?: string;      // 'zoom_in', 'flash', 'slow_motion', 'fast_cuts', 'shake'
    audioEnergy?: 'low' | 'medium' | 'high';
    audioSection?: string;         // 'intro', 'verse', 'chorus', 'bridge', 'outro'
    emotion?: string;              // 'melancholic', 'energetic', 'euphoric', etc.
  };
  // 🎵 Configuración avanzada del modelo
  cfgScale?: number;              // 0.0-1.0, adherencia al prompt
  negativePrompt?: string;        // Qué evitar en el video
}

/**
 * POST /api/fal/kling-video/generate
 * Genera video desde imagen usando FAL Kling (reemplaza PiAPI)
 */

/**
 * 🎬 Construye un prompt de movimiento cinematográfico basado en metadata de la escena
 */
function buildVideoMotionPrompt(
  basePrompt: string,
  instructions?: KlingVideoRequest['motionInstructions']
): string {
  if (!instructions) {
    return `${basePrompt}, smooth cinematic motion, professional music video quality`;
  }

  const parts: string[] = [basePrompt];

  // 1. Movimiento de cámara
  const cameraMotions: Record<string, string> = {
    'pan': 'smooth horizontal pan',
    'dolly': 'dolly movement with depth',
    'tracking': 'tracking shot following the subject',
    'crane': 'vertical crane movement',
    'static': 'minimal camera movement, stable composition',
    'handheld': 'subtle handheld movement for authenticity',
    'drone': 'aerial drone movement',
    'zoom': 'zoom motion'
  };
  
  if (instructions.cameraMovement && cameraMotions[instructions.cameraMovement]) {
    parts.push(cameraMotions[instructions.cameraMovement]);
  }

  // 2. Dirección del movimiento
  if (instructions.movementDirection) {
    const directionMap: Record<string, string> = {
      'left-to-right': 'moving left to right',
      'right-to-left': 'moving right to left',
      'push-in': 'pushing in towards subject',
      'pull-out': 'pulling out revealing scene',
      'up': 'moving upward',
      'down': 'moving downward'
    };
    if (directionMap[instructions.movementDirection]) {
      parts.push(directionMap[instructions.movementDirection]);
    }
  }

  // 3. Velocidad según energía de la canción
  const speedMap: Record<string, string> = {
    'slow': 'slow deliberate motion',
    'medium': 'smooth steady motion',
    'fast': 'dynamic fast movement',
    'dynamic': 'varying speed with rhythm'
  };
  const speed = instructions.movementSpeed || 
    (instructions.audioEnergy === 'high' ? 'fast' : 
     instructions.audioEnergy === 'low' ? 'slow' : 'medium');
  parts.push(speedMap[speed] || 'smooth motion');

  // 4. Efectos especiales para KEY MOMENTS
  if (instructions.isKeyMoment && instructions.keyMomentEffect) {
    const effectMap: Record<string, string> = {
      'zoom_in': 'dramatic zoom in effect',
      'zoom_out': 'reveal zoom out',
      'flash': 'flash transition effect',
      'slow_motion': 'slow motion emphasis',
      'fast_cuts': 'energetic quick movements',
      'shake': 'camera shake for impact',
      'glitch': 'digital glitch effect'
    };
    if (effectMap[instructions.keyMomentEffect]) {
      parts.push(effectMap[instructions.keyMomentEffect]);
    }
  }

  // 5. Mood/Emoción
  if (instructions.emotion) {
    parts.push(`${instructions.emotion} atmosphere`);
  }

  // 6. Sección de audio para contexto
  if (instructions.audioSection) {
    const sectionVibes: Record<string, string> = {
      'intro': 'building anticipation',
      'verse': 'storytelling rhythm',
      'pre-chorus': 'rising energy',
      'chorus': 'peak emotional intensity',
      'bridge': 'reflective moment',
      'breakdown': 'tension and release',
      'outro': 'gradual resolution'
    };
    if (sectionVibes[instructions.audioSection]) {
      parts.push(sectionVibes[instructions.audioSection]);
    }
  }

  parts.push('professional music video quality, cinematic, 24fps film look');

  return parts.join(', ');
}

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
      model = 'o1-pro-i2v',  // 🌟 DEFAULT: O1 Pro para mejor calidad
      motionInstructions,
      cfgScale = 0.5,
      negativePrompt = 'blur, distort, low quality, static, frozen, no motion'
    } = req.body as KlingVideoRequest;

    if (!prompt) {
      return res.status(400).json({
        success: false,
        error: 'prompt is required'
      });
    }

    // 🎬 Construir prompt enriquecido con instrucciones de movimiento
    const enrichedPrompt = buildVideoMotionPrompt(prompt, motionInstructions);
    
    console.log(`🎬 [FAL-BACKEND] Motion Instructions:`, JSON.stringify(motionInstructions || 'none'));
    console.log(`📝 [FAL-BACKEND] Enriched Prompt: ${enrichedPrompt.substring(0, 120)}...`);

    // Determinar el endpoint FAL según el modelo
    let falEndpoint: string;
    let requestBody: any = {
      prompt: enrichedPrompt,  // 🎬 Usar prompt enriquecido
      duration,
      aspect_ratio: aspectRatio,
      cfg_scale: cfgScale,              // 🎵 Adherencia al prompt
      negative_prompt: negativePrompt   // 🎵 Evitar problemas comunes
    };

    switch (model) {
      case 'o1-pro-i2v':
        // 🌟 O1 PRO Image-to-Video - MEJOR MODELO para music videos
        // Endpoint: fal-ai/kling-video/o1/image-to-video
        falEndpoint = 'https://queue.fal.run/fal-ai/kling-video/o1/image-to-video';
        if (!imageUrl) {
          return res.status(400).json({
            success: false,
            error: 'imageUrl is required for o1-pro-i2v model'
          });
        }
        // O1 Pro usa start_image_url en lugar de image_url
        requestBody.start_image_url = imageUrl;
        delete requestBody.image_url;
        console.log(`🌟 [FAL-BACKEND] Using Kling O1 PRO (best quality)`);
        break;
        
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
    const { model = 'o1-pro-i2v' } = req.query;

    // Determinar el endpoint base según el modelo
    let baseEndpoint: string;
    switch (model) {
      case 'o1-pro-i2v':
        // 🌟 O1 PRO - Mejor modelo
        baseEndpoint = 'fal-ai/kling-video/o1/image-to-video';
        break;
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
// 🎭 IMAGE GENERATION WITH FACE REFERENCE (nano-banana/edit for consistency)
// ============================================================================

/**
 * POST /api/fal/nano-banana/generate-with-face
 * Genera imágenes manteniendo consistencia facial usando nano-banana/edit
 * Este modelo es más potente que flux-pulid para mantener identidad facial
 */
router.post('/nano-banana/generate-with-face', async (req: Request, res: Response) => {
  // Handle client abort gracefully
  let isAborted = false;
  req.on('aborted', () => {
    isAborted = true;
    console.log('⚠️ [FAL-BACKEND] Client aborted nano-banana/generate-with-face request');
  });
  
  try {
    // Check if already aborted before processing
    if (isAborted) {
      return; // Don't process if client already disconnected
    }
    
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

    // Determinar endpoint basado en si hay referencias faciales
    let endpoint = 'https://fal.run/fal-ai/nano-banana';
    let requestBody: any = {
      prompt,
      negative_prompt: 'blurry, low quality, distorted, deformed, ugly, bad anatomy',
      image_size: aspectRatio === '16:9' ? 'landscape_16_9' : 
                  aspectRatio === '9:16' ? 'portrait_16_9' : 'square',
      num_images: 1,
      enable_safety_checker: true
    };

    // Si hay referencias, usar nano-banana/edit para consistencia facial
    // nano-banana/edit es MEJOR que flux-pulid para mantener identidad
    if (referenceImages && referenceImages.length > 0) {
      endpoint = 'https://fal.run/fal-ai/nano-banana/edit';
      
      // nano-banana/edit acepta múltiples imágenes de referencia como array
      const imageUrls = referenceImages.map((ref: string) => 
        ref.startsWith('data:') ? ref : ref
      );
      
      // Prompt mejorado para mantener identidad exacta
      const enhancedPrompt = `${prompt}. IMPORTANT: Keep the EXACT same face, identity, and features from the reference image. Same person, same skin tone, same facial structure.`;
      
      requestBody = {
        prompt: enhancedPrompt,
        image_urls: imageUrls, // ARRAY de URLs - nano-banana/edit acepta múltiples
        num_images: 1,
        aspect_ratio: aspectRatio === '16:9' ? '16:9' : 
                      aspectRatio === '9:16' ? '9:16' : '1:1',
        output_format: 'png'
      };
      
      console.log(`🎭 [FAL-BACKEND] Using nano-banana/edit for face consistency with ${imageUrls.length} reference(s)`);
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

  } catch (error: any) {
    // Ignore aborted requests - client disconnected
    if (isAborted || error?.code === 'ECONNABORTED' || error?.message?.includes('aborted')) {
      console.log('⚠️ [FAL-BACKEND] generate-with-face request was aborted by client');
      return; // Don't send response to aborted client
    }
    
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
  // Handle client abort gracefully
  let isAborted = false;
  req.on('aborted', () => {
    isAborted = true;
    console.log('⚠️ [FAL-BACKEND] Client aborted nano-banana/generate-batch request');
  });
  
  try {
    if (isAborted) return;
    
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
          // Usar nano-banana/edit en lugar de flux-pulid para mejor consistencia
          endpoint = 'https://fal.run/fal-ai/nano-banana/edit';
          
          const enhancedPrompt = `${prompt}. Keep EXACT same face and identity from reference.`;
          
          requestBody = {
            prompt: enhancedPrompt,
            image_urls: referenceImages, // Array de referencias
            num_images: 1,
            aspect_ratio: aspectRatio === '16:9' ? '16:9' : '1:1',
            output_format: 'png'
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

  } catch (error: any) {
    // Ignore aborted requests
    if (isAborted || error?.code === 'ECONNABORTED' || error?.message?.includes('aborted')) {
      console.log('⚠️ [FAL-BACKEND] generate-batch request was aborted by client');
      return;
    }
    
    console.error('❌ [FAL-BACKEND] Error in batch generation:', error);
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
