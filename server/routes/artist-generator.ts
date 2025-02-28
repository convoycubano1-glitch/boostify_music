/**
 * Rutas para la generación de artistas aleatorios
 */
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { generateRandomArtist, saveArtistToFirestore } from '../../scripts/generate-random-artist';

const router = Router();

/**
 * Endpoint para generar un artista aleatorio
 * Puede ser usado con o sin autenticación
 */
router.post("/api/generate-artist", async (req: Request, res: Response) => {
  try {
    console.log('Recibida solicitud para generar artista aleatorio');
    
    // Generar datos del artista aleatorio
    const artistData = generateRandomArtist();
    console.log('Artista generado exitosamente');
    
    // Guardar artista en Firestore
    const firestoreId = await saveArtistToFirestore(artistData);
    console.log(`Artista guardado en Firestore con ID: ${firestoreId}`);
    
    // Devolver respuesta con datos del artista y su ID en Firestore
    res.status(200).json({
      ...artistData,
      firestoreId
    });
  } catch (error) {
    console.error('Error generando artista aleatorio:', error);
    res.status(500).json({ 
      error: 'Error al generar artista aleatorio',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * Endpoint para generar un artista aleatorio (requiere autenticación)
 * Versión protegida del endpoint anterior
 */
router.post("/api/generate-artist/secure", authenticate, async (req: Request, res: Response) => {
  try {
    console.log('Recibida solicitud autenticada para generar artista aleatorio');
    
    // Obtener ID del usuario autenticado
    const userId = req.user?.uid || req.user?.id;
    console.log(`Solicitud de usuario: ${userId}`);
    
    // Generar datos del artista aleatorio
    const artistData = generateRandomArtist();
    console.log('Artista generado exitosamente');
    
    // Guardar artista en Firestore, incluyendo referencia al usuario que lo generó
    const artistDataWithUser = {
      ...artistData,
      generatedBy: userId
    };
    
    const firestoreId = await saveArtistToFirestore(artistDataWithUser);
    console.log(`Artista guardado en Firestore con ID: ${firestoreId}`);
    
    // Devolver respuesta con datos del artista y su ID en Firestore
    res.status(200).json({
      ...artistDataWithUser,
      firestoreId
    });
  } catch (error) {
    console.error('Error generando artista aleatorio (ruta segura):', error);
    res.status(500).json({ 
      error: 'Error al generar artista aleatorio',
      details: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;