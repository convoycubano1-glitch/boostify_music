/**
 * FAL AI Lip-Sync Service
 * Sincroniza videos generados con audio para crear movimiento de labios realista
 * Usa Sync Lipsync 2.0 para calidad profesional
 */

interface LipSyncOptions {
  videoUrl: string;
  audioUrl: string;
  syncMode?: 'cut_off' | 'loop' | 'bounce' | 'silence' | 'remap';
  webhookUrl?: string;
}

interface LipSyncResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  requestId?: string;
}

/**
 * Aplica lip-sync a un video usando el audio original de la canción
 * Esto asegura que el artista cante sincronizado con la música
 * 
 * @param options - Configuración del lip-sync
 * @returns Promise con el video sincronizado
 */
export async function applyLipSync(options: LipSyncOptions): Promise<LipSyncResult> {
  try {
    console.log('🎤 Iniciando lip-sync con Sync Lipsync 2.0...');
    console.log('📹 Video:', options.videoUrl.substring(0, 50));
    console.log('🎵 Audio:', options.audioUrl.substring(0, 50));
    
    const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;
    
    if (!FAL_API_KEY) {
      console.error('❌ FAL_API_KEY no configurada');
      return {
        success: false,
        error: 'FAL_API_KEY no está configurada. Por favor configura la API key en las variables de entorno.'
      };
    }
    
    // Submit job a la cola de FAL AI
    const submitResponse = await fetch('https://queue.fal.run/fal-ai/sync-lipsync/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        video_url: options.videoUrl,
        audio_url: options.audioUrl,
        sync_mode: options.syncMode || 'cut_off'
      })
    });
    
    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error('❌ Error submitting lip-sync job:', errorData);
      return {
        success: false,
        error: `Error submitting lip-sync: ${submitResponse.statusText}`
      };
    }
    
    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;
    
    console.log(`⏳ Lip-sync job submitted: ${requestId}`);
    console.log('🔄 Esperando resultado...');
    
    // Poll para obtener el resultado
    let attempts = 0;
    const maxAttempts = 60; // 5 minutos máximo (cada 5 segundos)
    
    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 5000)); // Esperar 5 segundos
      
      const statusResponse = await fetch(
        `https://queue.fal.run/fal-ai/sync-lipsync/v2/requests/${requestId}/status`,
        {
          headers: {
            'Authorization': `Key ${FAL_API_KEY}`
          }
        }
      );
      
      if (!statusResponse.ok) {
        console.error('❌ Error checking status');
        attempts++;
        continue;
      }
      
      const statusData = await statusResponse.json();
      
      if (statusData.status === 'COMPLETED') {
        // Obtener el resultado
        const resultResponse = await fetch(
          `https://queue.fal.run/fal-ai/sync-lipsync/v2/requests/${requestId}`,
          {
            headers: {
              'Authorization': `Key ${FAL_API_KEY}`
            }
          }
        );
        
        if (!resultResponse.ok) {
          return {
            success: false,
            error: 'Error retrieving lip-sync result'
          };
        }
        
        const resultData = await resultResponse.json();
        
        console.log('✅ Lip-sync completado exitosamente!');
        
        return {
          success: true,
          videoUrl: resultData.video?.url || resultData.output?.video?.url,
          requestId
        };
      }
      
      if (statusData.status === 'FAILED') {
        console.error('❌ Lip-sync job failed:', statusData.error);
        return {
          success: false,
          error: statusData.error || 'Lip-sync processing failed'
        };
      }
      
      // IN_QUEUE o IN_PROGRESS
      console.log(`⏳ Status: ${statusData.status} (attempt ${attempts + 1}/${maxAttempts})`);
      attempts++;
    }
    
    return {
      success: false,
      error: 'Lip-sync timeout - processing took too long'
    };
    
  } catch (error) {
    console.error('❌ Error en applyLipSync:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error applying lip-sync'
    };
  }
}

/**
 * Procesa múltiples videos en batch con lip-sync
 * Útil para aplicar lip-sync a todas las escenas de un video musical
 */
export async function batchLipSync(
  videos: Array<{ videoUrl: string; audioUrl: string; sceneId: string }>
): Promise<Map<string, LipSyncResult>> {
  console.log(`🎬 Procesando ${videos.length} videos con lip-sync...`);
  
  const results = new Map<string, LipSyncResult>();
  
  // Procesar videos secuencialmente para no sobrecargar la API
  for (const video of videos) {
    console.log(`🎤 Procesando escena ${video.sceneId}...`);
    
    const result = await applyLipSync({
      videoUrl: video.videoUrl,
      audioUrl: video.audioUrl,
      syncMode: 'cut_off'
    });
    
    results.set(video.sceneId, result);
    
    if (result.success) {
      console.log(`✅ Escena ${video.sceneId} sincronizada`);
    } else {
      console.error(`❌ Error en escena ${video.sceneId}:`, result.error);
    }
    
    // Pequeño delay entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`🎉 Batch lip-sync completado: ${results.size} escenas procesadas`);
  
  return results;
}
