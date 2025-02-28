/**
 * Rutas para obtener y gestionar artistas generados
 */
import { Request, Response, Router } from 'express';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

const router = Router();

/**
 * Obtiene todos los artistas generados
 * @route GET /api/artists/generated
 */
router.get('/api/artists/generated', async (req: Request, res: Response) => {
  try {
    const artistsCollection = collection(db, 'generated-artists');
    const artistsSnapshot = await getDocs(artistsCollection);
    
    if (artistsSnapshot.empty) {
      return res.json([]);
    }
    
    const artists = artistsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return res.json(artists);
  } catch (error) {
    console.error('Error al obtener artistas generados:', error);
    return res.status(500).json({ error: 'Error al obtener artistas generados' });
  }
});

/**
 * Obtiene un artista generado por ID
 * @route GET /api/artists/generated/:id
 */
router.get('/api/artists/generated/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const artistRef = doc(db, 'generated-artists', id);
    const artistDoc = await getDoc(artistRef);
    
    if (!artistDoc.exists()) {
      return res.status(404).json({ error: 'Artista no encontrado' });
    }
    
    return res.json({
      id: artistDoc.id,
      ...artistDoc.data()
    });
  } catch (error) {
    console.error('Error al obtener artista generado:', error);
    return res.status(500).json({ error: 'Error al obtener artista generado' });
  }
});

export default router;