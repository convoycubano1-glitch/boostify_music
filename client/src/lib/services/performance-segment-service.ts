import { logger } from "./logger";
/**
 * Performance Segment Service
 * Maneja la lógica de negocio para segmentos de performance con lip-sync
 */

import { cutAudioSegment, cutAudioSegments } from './audio-segmentation';
import { generateTalkingHead, batchGenerateTalkingHeads } from '../api/fal-musetalk';
import { uploadImageFromUrl } from '../firebase-storage';

export interface PerformanceSegmentData {
  projectId: number;
  sceneId: number;
  startTime: number;
  endTime: number;
  duration: number;
  lyrics?: string;
  shotType?: string;
  audioSegmentUrl?: string;
  artistImageUrl?: string;
  lipsyncVideoUrl?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

export interface DetectedPerformanceClip {
  id: number;
  startTime: number;
  endTime: number;
  duration: number;
  lyrics: string;
  shotType: string;
  isPerformance: boolean;
}

/**
 * Detecta automáticamente clips de performance en el script
 * 🎤 REGLA CRÍTICA: Lip-sync SOLO en planos donde se ve claramente la cara del artista
 * 
 * ✅ INCLUYE (Cara visible):
 * - CU (Close-up): Primer plano de la cara
 * - ECU (Extreme Close-up): Primer plano extremo
 * - MCU (Medium Close-up): Plano medio corto (hombros hacia arriba)
 * - MS (Medium Shot): Plano medio (cintura hacia arriba)
 * 
 * ❌ EXCLUYE (Cara no visible o muy lejana):
 * - WS (Wide Shot): Plano general
 * - EWS (Extreme Wide Shot): Gran plano general
 * - FS (Full Shot): Plano completo (cuerpo entero)
 * - LS (Long Shot): Plano largo
 * - OTS (Over The Shoulder): Sobre el hombro
 * - POV (Point of View): Punto de vista
 * - Cualquier plano ambiental o de establecimiento
 */
export function detectPerformanceClips(script: any): DetectedPerformanceClip[] {
  if (!script || !script.scenes) return [];
  
  // ✅ Tipos de plano VÁLIDOS para lip-sync (cara visible)
  const validShotTypes = [
    'cu',           // Close-up
    'ecu',          // Extreme close-up
    'mcu',          // Medium close-up
    'ms',           // Medium shot
    'close-up',
    'closeup',
    'medium close-up',
    'medium-close-up',
    'medium shot',
    'medium-shot'
  ];
  
  // ❌ Tipos de plano EXCLUIDOS (cara no visible o muy lejana)
  const excludedShotTypes = [
    'ws',           // Wide Shot
    'ews',          // Extreme Wide Shot
    'fs',           // Full Shot
    'ls',           // Long Shot
    'ots',          // Over The Shoulder
    'pov',          // Point of View
    'wide',
    'full',
    'long',
    'establishing',
    'master',
    'two-shot',
    'group',
    'aerial',
    'bird',
    'overhead'
  ];
  
  // Palabras clave que indican performance vocal
  const performanceKeywords = [
    'singing',
    'performing',
    'vocalist',
    'lip sync',
    'lipsync',
    'mouthing',
    'vocals'
  ];
  
  return script.scenes
    .filter((scene: any) => {
      const shotType = (scene.shot_type || scene.shotType || '').toLowerCase().trim();
      const description = (scene.description || '').toLowerCase();
      const role = (scene.role || '').toLowerCase();
      const action = (scene.action || '').toLowerCase();
      
      // ❌ EXCLUIR explícitamente planos no válidos
      const isExcludedShot = excludedShotTypes.some(excluded => 
        shotType.includes(excluded)
      );
      
      if (isExcludedShot) {
        logger.info(`⛔ [LIP-SYNC] Clip ${scene.scene_id || scene.id} EXCLUIDO: Shot type "${shotType}" no válido para lip-sync`);
        return false;
      }
      
      // ✅ INCLUIR solo si es un plano válido (cara visible)
      const isValidShot = validShotTypes.some(valid => 
        shotType.includes(valid)
      );
      
      // ✅ Verificar que sea una escena de performance/cantando
      const isPerformanceScene = 
        performanceKeywords.some(keyword => 
          description.includes(keyword) || 
          role.includes(keyword) || 
          action.includes(keyword)
        );
      
      const shouldInclude = isValidShot && isPerformanceScene;
      
      if (shouldInclude) {
        logger.info(`✅ [LIP-SYNC] Clip ${scene.scene_id || scene.id} INCLUIDO: Shot type "${shotType}" + Performance scene`);
      } else if (isValidShot && !isPerformanceScene) {
        logger.info(`⚠️ [LIP-SYNC] Clip ${scene.scene_id || scene.id} OMITIDO: Shot válido "${shotType}" pero NO es escena de performance`);
      }
      
      return shouldInclude;
    })
    .map((scene: any) => ({
      id: scene.scene_id || scene.id,
      startTime: scene.start_time || 0,
      endTime: (scene.start_time || 0) + (scene.duration || 0),
      duration: scene.duration || 0,
      lyrics: scene.lyrics_segment || scene.lyrics || '',
      shotType: scene.shot_type || scene.shotType || '',
      isPerformance: true
    }));
}

/**
 * Procesa automáticamente clips de performance
 * 1. Corta el audio en segmentos
 * 2. Sube los segmentos a Firebase
 * 3. Crea registros en la base de datos
 * 4. Genera videos con lip-sync usando MuseTalk
 */
export async function processPerformanceClips(
  projectId: number,
  audioBuffer: AudioBuffer,
  performanceClips: DetectedPerformanceClip[],
  artistImageUrl: string,
  userId: string,
  projectName: string,
  onProgress?: (current: number, total: number, message: string) => void
): Promise<Map<number, PerformanceSegmentData>> {
  
  const results = new Map<number, PerformanceSegmentData>();
  const total = performanceClips.length;
  
  try {
    // Paso 1: Cortar audio en segmentos
    onProgress?.(0, total, 'Cortando audio en segmentos...');
    
    const audioSegments = await cutAudioSegments(
      audioBuffer,
      performanceClips.map(clip => ({
        id: String(clip.id),
        startTime: clip.startTime,
        endTime: clip.endTime
      }))
    );
    
    logger.info(`✂️ ${audioSegments.size} segmentos de audio cortados`);
    
    // Paso 2: Subir segmentos a Firebase y crear registros
    let current = 0;
    const segmentsToProcess: Array<{ id: string; imageUrl: string; audioUrl: string }> = [];
    
    for (const clip of performanceClips) {
      current++;
      onProgress?.(current, total, `Preparando segmento ${current}/${total}...`);
      
      const audioSegment = audioSegments.get(String(clip.id));
      if (!audioSegment) {
        logger.warn(`⚠️ No se encontró segmento de audio para clip ${clip.id}`);
        continue;
      }
      
      try {
        // Subir audio a Firebase
        const audioBlob = audioSegment.blob;
        const audioFile = new File([audioBlob], `segment-${clip.id}.wav`, { type: 'audio/wav' });
        
        // Convertir blob a URL temporal para subirlo
        const audioUrl = URL.createObjectURL(audioBlob);
        const permanentAudioUrl = await uploadImageFromUrl(audioUrl, userId, `${projectName}/audio`);
        URL.revokeObjectURL(audioUrl);
        
        // Crear registro en base de datos
        const response = await fetch('/api/performance-segments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            projectId,
            sceneId: clip.id,
            startTime: clip.startTime,
            endTime: clip.endTime,
            duration: clip.duration,
            lyrics: clip.lyrics,
            shotType: clip.shotType,
            audioSegmentUrl: permanentAudioUrl,
            artistImageUrl: artistImageUrl
          })
        });
        
        if (!response.ok) {
          throw new Error('Error creating performance segment');
        }
        
        const { segment } = await response.json();
        
        segmentsToProcess.push({
          id: String(segment.id),
          imageUrl: artistImageUrl,
          audioUrl: permanentAudioUrl
        });
        
        results.set(clip.id, {
          ...segment,
          projectId,
          sceneId: clip.id
        });
        
      } catch (error) {
        logger.error(`❌ Error procesando clip ${clip.id}:`, error);
      }
    }
    
    // Paso 3: Generar videos con lip-sync en batch
    onProgress?.(total, total, 'Generando videos con lip-sync...');
    
    const lipsyncResults = await batchGenerateTalkingHeads(segmentsToProcess);
    
    // Paso 4: Actualizar registros con URLs de video
    current = 0;
    for (const [segmentId, result] of lipsyncResults) {
      current++;
      onProgress?.(current, total, `Finalizando ${current}/${total}...`);
      
      if (result.success && result.videoUrl) {
        // Actualizar en base de datos
        await fetch(`/api/performance-segments/${segmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            lipsyncVideoUrl: result.videoUrl,
            status: 'completed'
          })
        });
        
        // Actualizar en resultados locales
        for (const [clipId, segment] of results) {
          if (String(segment.sceneId) === String(segmentId) || 
              (segment as any).id === parseInt(segmentId)) {
            segment.lipsyncVideoUrl = result.videoUrl;
            segment.status = 'completed';
          }
        }
      } else {
        // Marcar como fallido
        await fetch(`/api/performance-segments/${segmentId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: 'failed',
            errorMessage: result.error
          })
        });
      }
    }
    
    logger.info(`🎉 Procesamiento completado: ${results.size} segmentos`);
    return results;
    
  } catch (error) {
    logger.error('❌ Error en processPerformanceClips:', error);
    throw error;
  }
}

/**
 * Obtiene segmentos de performance de un proyecto
 */
export async function getPerformanceSegments(projectId: number): Promise<PerformanceSegmentData[]> {
  try {
    const response = await fetch(`/api/performance-segments/${projectId}`);
    if (!response.ok) {
      throw new Error('Error fetching performance segments');
    }
    
    const { segments } = await response.json();
    return segments;
  } catch (error) {
    logger.error('Error getting performance segments:', error);
    return [];
  }
}

/**
 * Regenera lip-sync para un segmento específico
 */
export async function regenerateLipSync(
  segmentId: number,
  imageUrl: string,
  audioUrl: string
): Promise<boolean> {
  try {
    // Actualizar estado a processing
    await fetch(`/api/performance-segments/${segmentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'processing' })
    });
    
    // Generar nuevo video
    const result = await generateTalkingHead({ imageUrl, audioUrl });
    
    if (result.success && result.videoUrl) {
      // Actualizar con nuevo video
      await fetch(`/api/performance-segments/${segmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lipsyncVideoUrl: result.videoUrl,
          status: 'completed'
        })
      });
      
      return true;
    } else {
      // Marcar como fallido
      await fetch(`/api/performance-segments/${segmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'failed',
          errorMessage: result.error
        })
      });
      
      return false;
    }
  } catch (error) {
    logger.error('Error regenerating lip-sync:', error);
    return false;
  }
}
