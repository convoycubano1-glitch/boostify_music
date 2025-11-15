import { Router, Request, Response } from 'express';
import { requireAuth } from '../replitAuth';
import { auth } from '../firebase';

const router = Router();

/**
 * Genera un Custom Token de Firebase para el usuario autenticado con Replit Auth
 * Esto permite que el cliente se autentique en Firebase usando el ID de usuario de Replit
 */
router.get('/api/firebase-token', requireAuth, async (req: Request, res: Response) => {
  try {
    if (!auth) {
      return res.status(500).json({
        success: false,
        error: 'Firebase Admin not initialized'
      });
    }

    const user = (req as any).user;
    if (!user || !user.id) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }

    // Usar el ID de PostgreSQL como UID de Firebase
    const firebaseUid = String(user.id);

    // Crear o actualizar el usuario en Firebase Auth
    try {
      await auth.getUser(firebaseUid);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found') {
        // Crear nuevo usuario en Firebase Auth
        await auth.createUser({
          uid: firebaseUid,
          email: user.email || `user${user.id}@boostify.app`,
          displayName: user.username || user.name || `User ${user.id}`,
        });
        console.log(`✅ Created Firebase user for Replit user ${user.id}`);
      } else {
        throw error;
      }
    }

    // Generar Custom Token
    const customToken = await auth.createCustomToken(firebaseUid, {
      email: user.email,
      username: user.username,
      replitId: user.id
    });

    res.json({
      success: true,
      token: customToken,
      uid: firebaseUid
    });

  } catch (error) {
    console.error('Error generating Firebase token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate Firebase token'
    });
  }
});

export default router;
