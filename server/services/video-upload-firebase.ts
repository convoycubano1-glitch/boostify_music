/**
 * Video Upload to Firebase Storage Service
 * Descarga videos de Shotstack y los sube a Firebase Storage para URLs permanentes
 */

import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import { logger } from '../utils/logger';

const storage = new Storage({
  projectId: process.env.FIREBASE_PROJECT_ID,
  credentials: process.env.FIREBASE_ADMIN_KEY ? JSON.parse(process.env.FIREBASE_ADMIN_KEY) : undefined
});

const bucketName = process.env.FIREBASE_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.appspot.com`;

export interface VideoUploadResult {
  success: boolean;
  firebaseUrl?: string;
  storageUrl?: string;
  error?: string;
}

/**
 * Descarga un video de una URL externa (Shotstack) y lo sube a Firebase Storage
 * @param videoUrl URL del video de Shotstack
 * @param userId ID del usuario
 * @param projectId ID del proyecto
 * @returns URL pública de Firebase Storage
 */
export async function uploadVideoToFirebaseStorage(
  videoUrl: string,
  userId: string,
  projectId: string
): Promise<VideoUploadResult> {
  try {
    logger.log(`📥 [VIDEO UPLOAD] Descargando video de: ${videoUrl}`);
    
    // Descargar el video de Shotstack
    const response = await axios.get(videoUrl, {
      responseType: 'arraybuffer',
      timeout: 300000, // 5 minutos timeout para videos grandes
      maxContentLength: 500 * 1024 * 1024, // Max 500MB
    });

    const videoBuffer = Buffer.from(response.data);
    logger.log(`📦 [VIDEO UPLOAD] Video descargado: ${(videoBuffer.length / (1024 * 1024)).toFixed(2)} MB`);

    // Generar nombre de archivo con timestamp
    const timestamp = Date.now();
    const fileName = `video-projects/${userId}/${projectId}/final_${timestamp}.mp4`;

    // Obtener el bucket
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);

    // Subir el video a Firebase Storage
    logger.log(`📤 [VIDEO UPLOAD] Subiendo a Firebase Storage: ${fileName}`);
    
    await file.save(videoBuffer, {
      metadata: {
        contentType: 'video/mp4',
        metadata: {
          projectId,
          userId,
          uploadedAt: new Date().toISOString(),
          source: 'shotstack',
          originalUrl: videoUrl,
        }
      },
      public: true, // Hacer el video público
    });

    // Generar URL pública
    const firebaseUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;
    const storageUrl = `gs://${bucketName}/${fileName}`;

    logger.log(`✅ [VIDEO UPLOAD] Video subido exitosamente: ${firebaseUrl}`);

    return {
      success: true,
      firebaseUrl,
      storageUrl,
    };
  } catch (error: any) {
    logger.error('❌ [VIDEO UPLOAD] Error:', error.message || error);
    return {
      success: false,
      error: error.message || 'Error desconocido al subir video',
    };
  }
}

/**
 * Elimina un video de Firebase Storage
 */
export async function deleteVideoFromFirebase(
  userId: string,
  projectId: string,
  fileName?: string
): Promise<boolean> {
  try {
    const bucket = storage.bucket(bucketName);
    
    if (fileName) {
      // Eliminar archivo específico
      await bucket.file(fileName).delete();
    } else {
      // Eliminar todos los videos del proyecto
      const prefix = `video-projects/${userId}/${projectId}/`;
      const [files] = await bucket.getFiles({ prefix });
      await Promise.all(
        files
          .filter(f => f.name.endsWith('.mp4'))
          .map(file => file.delete())
      );
    }

    logger.log(`🗑️ [VIDEO UPLOAD] Video(s) eliminado(s) exitosamente`);
    return true;
  } catch (error) {
    logger.error('❌ [VIDEO UPLOAD] Error eliminando video:', error);
    return false;
  }
}
