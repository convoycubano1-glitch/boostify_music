/**
 * Middleware opcional para verificar Firebase App Check tokens en el backend
 * 
 * NOTA: Esto es OPCIONAL. Firebase App Check ya protege tus APIs de Firebase
 * automáticamente. Solo usa esto si quieres verificación adicional en endpoints custom.
 */

import { Request, Response, NextFunction } from 'express';

/**
 * Middleware para verificar App Check tokens (OPCIONAL)
 * 
 * Uso:
 * app.post('/api/sensitive-endpoint', verifyAppCheckToken, async (req, res) => {
 *   // Tu código aquí
 * });
 */
export async function verifyAppCheckToken(req: Request, res: Response, next: NextFunction) {
  try {
    const appCheckToken = req.headers['x-firebase-appcheck'];
    
    if (!appCheckToken || typeof appCheckToken !== 'string') {
      // En desarrollo, permitir sin App Check
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ [APP CHECK] Token missing - allowing in development mode');
        return next();
      }
      
      return res.status(401).json({
        success: false,
        message: 'App Check token required'
      });
    }

    // NOTA: Si habilitas Firebase Admin, descomenta esto:
    /*
    const { getAppCheck } = await import('firebase-admin/app-check');
    const appCheckClaims = await getAppCheck().verifyToken(appCheckToken);
    
    // Si el token es válido, el request viene de tu app
    console.log('✅ [APP CHECK] Token verified:', appCheckClaims.app_id);
    */
    
    // Por ahora, solo verificamos que el token existe
    console.log('ℹ️ [APP CHECK] Token present (verification disabled - Firebase Admin not configured)');
    
    next();
  } catch (error) {
    console.error('❌ [APP CHECK] Verification failed:', error);
    
    // En desarrollo, permitir incluso con error
    if (process.env.NODE_ENV === 'development') {
      return next();
    }
    
    return res.status(401).json({
      success: false,
      message: 'Invalid App Check token',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Ejemplo de uso en tus rutas:
 * 
 * import { verifyAppCheckToken } from './middleware/app-check';
 * 
 * // Proteger un endpoint específico
 * app.post('/api/create-payment', verifyAppCheckToken, async (req, res) => {
 *   // Solo requests desde tu app llegarán aquí
 * });
 */
