/**
 * FAL AI MuseTalk Service
 * Genera videos de animación facial (talking head) desde imagen + audio
 * Perfecto para crear clips de artistas cantando
 */

interface MuseTalkOptions {
  imageUrl: string;  // URL de la imagen del artista
  audioUrl: string;  // URL del audio (segmento cortado)
  bbox_shift?: number; // Ajuste del bounding box (default: 5)
  webhookUrl?: string;
}

interface MuseTalkResult {
  success: boolean;
  videoUrl?: string;
  error?: string;
  requestId?: string;
  processingTime?: number;
}

/**
 * Genera un video de talking head usando MuseTalk
 * El artista "canta" sincronizado con el audio proporcionado
 * 
 * @param options - Configuración de MuseTalk
 * @returns Promise con el video generado
 */
export async function generateTalkingHead(options: MuseTalkOptions): Promise<MuseTalkResult> {
  try {
    console.log('🎭 Iniciando MuseTalk (Image-to-Video Lip-Sync)...');
    console.log('🖼️ Imagen:', options.imageUrl.substring(0, 60));
    console.log('🎵 Audio:', options.audioUrl.substring(0, 60));
    
    const FAL_API_KEY = import.meta.env.VITE_FAL_API_KEY;
    
    if (!FAL_API_KEY) {
      console.error('❌ FAL_API_KEY no configurada');
      return {
        success: false,
        error: 'FAL_API_KEY no está configurada'
      };
    }
    
    const startTime = Date.now();
    
    // Submit job a la cola de FAL AI
    const submitResponse = await fetch('https://queue.fal.run/fal-ai/musetalk', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_url: options.imageUrl,
        audio_url: options.audioUrl,
        bbox_shift: options.bbox_shift || 5
      })
    });
    
    if (!submitResponse.ok) {
      const errorData = await submitResponse.json().catch(() => ({}));
      console.error('❌ Error submitting MuseTalk job:', errorData);
      return {
        success: false,
        error: `Error submitting job: ${submitResponse.statusText}`
      };
    }
    
    const submitData = await submitResponse.json();
    const requestId = submitData.request_id;
    
    console.log(`⏳ MuseTalk job submitted: ${requestId}`);
    console.log('🔄 Esperando resultado...');
    
    // Poll para obtener el resultado
    let attempts = 0;
    const maxAttempts = 90; // 7.5 minutos máximo (cada 5 segundos)
    
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
        console.error('❌ Error checking status');
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
          return {
            success: false,
            error: 'Error retrieving result'
          };
        }
        
        const resultData = await resultResponse.json();
        const processingTime = (Date.now() - startTime) / 1000;
        
        console.log(`✅ MuseTalk completado en ${processingTime.toFixed(1)}s!`);
        
        return {
          success: true,
          videoUrl: resultData.video?.url || resultData.output?.url,
          requestId,
          processingTime
        };
      }
      
      if (statusData.status === 'FAILED') {
        console.error('❌ MuseTalk job failed:', statusData.error);
        return {
          success: false,
          error: statusData.error || 'Processing failed'
        };
      }
      
      // IN_QUEUE o IN_PROGRESS
      console.log(`⏳ Status: ${statusData.status} (${attempts + 1}/${maxAttempts})`);
      attempts++;
    }
    
    return {
      success: false,
      error: 'Processing timeout - took too long'
    };
    
  } catch (error) {
    console.error('❌ Error en generateTalkingHead:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Procesa múltiples segmentos en batch
 * Ideal para generar todos los clips de performance de una canción
 */
export async function batchGenerateTalkingHeads(
  segments: Array<{
    id: string;
    imageUrl: string;
    audioUrl: string;
  }>
): Promise<Map<string, MuseTalkResult>> {
  console.log(`🎬 Generando ${segments.length} talking heads...`);
  
  const results = new Map<string, MuseTalkResult>();
  
  // Procesar secuencialmente para no sobrecargar la API
  for (const segment of segments) {
    console.log(`🎭 Procesando segmento ${segment.id}...`);
    
    const result = await generateTalkingHead({
      imageUrl: segment.imageUrl,
      audioUrl: segment.audioUrl
    });
    
    results.set(segment.id, result);
    
    if (result.success) {
      console.log(`✅ Segmento ${segment.id} completado`);
    } else {
      console.error(`❌ Error en segmento ${segment.id}:`, result.error);
    }
    
    // Pequeño delay entre requests
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`🎉 Batch completado: ${results.size} segmentos procesados`);
  
  return results;
}
