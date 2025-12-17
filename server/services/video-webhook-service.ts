/**
 * 🔔 Video Webhook Service
 * Envía notificaciones a Make.com para los estados del video
 */

import { logger } from '../utils/logger';

// Webhook URLs de Make.com
const WEBHOOK_PENDING = 'https://hook.us2.make.com/k9hsbb9pagaiopjdn6m7z4cl09o6us8a';
const WEBHOOK_COMPLETED = 'https://hook.us2.make.com/ezu3nf24clqdfwhpuse0l1lmpf0r4uu7';

export interface VideoWebhookData {
  // Identificadores
  queueId: number;
  projectId: number;
  
  // Información del usuario
  email: string;
  artistName: string;
  songName: string;
  
  // URLs
  profileUrl: string;
  thumbnailUrl?: string;
  videoUrl?: string;
  
  // Estado
  status: 'pending' | 'completed' | 'failed';
  
  // Metadata
  totalScenes?: number;
  estimatedTime?: string;
  actualDuration?: string;
  
  // Timestamps
  createdAt: string;
  completedAt?: string;
}

/**
 * Envía webhook cuando el video está en estado PENDIENTE
 * Se ejecuta cuando el usuario confirma la generación
 */
export async function sendPendingWebhook(data: VideoWebhookData): Promise<{ success: boolean; error?: string }> {
  try {
    logger.log(`📤 [WEBHOOK] Enviando notificación PENDING a Make.com...`);
    logger.log(`   Email: ${data.email}`);
    logger.log(`   Artista: ${data.artistName}`);
    logger.log(`   Canción: ${data.songName}`);
    logger.log(`   Perfil: ${data.profileUrl}`);

    const payload = {
      event: 'video_pending',
      timestamp: new Date().toISOString(),
      data: {
        queueId: data.queueId,
        projectId: data.projectId,
        email: data.email,
        artistName: data.artistName,
        songName: data.songName,
        profileUrl: data.profileUrl,
        thumbnailUrl: data.thumbnailUrl || '',
        totalScenes: data.totalScenes || 10,
        estimatedTime: data.estimatedTime || '8-12 minutos',
        status: 'pending',
        createdAt: data.createdAt
      }
    };

    const response = await fetch(WEBHOOK_PENDING, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ [WEBHOOK] Error en respuesta: ${response.status} - ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    logger.log(`✅ [WEBHOOK] Notificación PENDING enviada exitosamente`);
    return { success: true };

  } catch (error: any) {
    logger.error(`❌ [WEBHOOK] Error enviando PENDING:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía webhook cuando el video está COMPLETADO
 * Se ejecuta cuando el video se ha renderizado y subido a Firebase
 */
export async function sendCompletedWebhook(data: VideoWebhookData): Promise<{ success: boolean; error?: string }> {
  try {
    logger.log(`📤 [WEBHOOK] Enviando notificación COMPLETED a Make.com...`);
    logger.log(`   Email: ${data.email}`);
    logger.log(`   Artista: ${data.artistName}`);
    logger.log(`   Video: ${data.videoUrl}`);
    logger.log(`   Perfil: ${data.profileUrl}`);

    const payload = {
      event: 'video_completed',
      timestamp: new Date().toISOString(),
      data: {
        queueId: data.queueId,
        projectId: data.projectId,
        email: data.email,
        artistName: data.artistName,
        songName: data.songName,
        profileUrl: data.profileUrl,
        thumbnailUrl: data.thumbnailUrl || '',
        videoUrl: data.videoUrl || '',
        status: 'completed',
        createdAt: data.createdAt,
        completedAt: data.completedAt || new Date().toISOString(),
        actualDuration: data.actualDuration
      }
    };

    const response = await fetch(WEBHOOK_COMPLETED, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ [WEBHOOK] Error en respuesta: ${response.status} - ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    logger.log(`✅ [WEBHOOK] Notificación COMPLETED enviada exitosamente`);
    return { success: true };

  } catch (error: any) {
    logger.error(`❌ [WEBHOOK] Error enviando COMPLETED:`, error);
    return { success: false, error: error.message };
  }
}

/**
 * Envía webhook cuando el video FALLA
 * Usa el mismo endpoint de completed pero con status 'failed'
 */
export async function sendFailedWebhook(data: VideoWebhookData & { errorMessage: string }): Promise<{ success: boolean; error?: string }> {
  try {
    logger.log(`📤 [WEBHOOK] Enviando notificación FAILED a Make.com...`);
    logger.log(`   Email: ${data.email}`);
    logger.log(`   Error: ${data.errorMessage}`);

    const payload = {
      event: 'video_failed',
      timestamp: new Date().toISOString(),
      data: {
        queueId: data.queueId,
        projectId: data.projectId,
        email: data.email,
        artistName: data.artistName,
        songName: data.songName,
        profileUrl: data.profileUrl,
        status: 'failed',
        errorMessage: data.errorMessage,
        createdAt: data.createdAt
      }
    };

    // Usar el webhook de completed para errores también
    const response = await fetch(WEBHOOK_COMPLETED, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      logger.error(`❌ [WEBHOOK] Error en respuesta: ${response.status} - ${errorText}`);
      return { success: false, error: `HTTP ${response.status}: ${errorText}` };
    }

    logger.log(`✅ [WEBHOOK] Notificación FAILED enviada exitosamente`);
    return { success: true };

  } catch (error: any) {
    logger.error(`❌ [WEBHOOK] Error enviando FAILED:`, error);
    return { success: false, error: error.message };
  }
}

export default {
  sendPendingWebhook,
  sendCompletedWebhook,
  sendFailedWebhook
};
