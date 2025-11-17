/**
 * FAL API Backend Routes
 * Maneja todas las llamadas a FAL.ai desde el backend
 * Seguridad: Las credenciales FAL_API_KEY están en el servidor, no expuestas al frontend
 */

import { Router, type Request, type Response } from 'express';

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
      const errorText = await response.text();
      if (errorText.includes('Exhausted balance') || errorText.includes('locked')) {
        console.warn(`⚠️ [FAILOVER] Key principal sin balance. Usando backup para: ${context}`);
        
        // Reintentar con la key de backup
        const backupOptions = {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Key ${FAL_API_KEY_BACKUP}`
          }
        };
        
        const backupResponse = await fetch(url, backupOptions);
        console.log(`✅ [FAILOVER] Usando FAL_KEY_BACKUP exitosamente para: ${context}`);
        return backupResponse;
      }
    }
    
    return response;
  } catch (error) {
    console.error(`❌ [FAILOVER] Error en ${context}:`, error);
    throw error;
  }
}

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

export default router;
