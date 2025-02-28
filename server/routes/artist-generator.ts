/**
 * Rutas para la generación de artistas aleatorios
 */
import { Router, Request, Response } from "express";
import { generateRandomArtist, saveArtistToFirestore } from "../../scripts/generate-random-artist";
import { authenticate } from "../middleware/auth";

const router = Router();

/**
 * Endpoint para generar un artista aleatorio
 * Puede ser usado con o sin autenticación
 */
router.post("/api/generate-artist", async (req: Request, res: Response) => {
  try {
    console.log("Generando artista aleatorio...");
    const artistData = generateRandomArtist();
    
    // Si hay un usuario autenticado, asociamos el artista a su cuenta
    let userId = null;
    if (req.headers.authorization) {
      try {
        const user = (req as any).user;
        if (user && user.uid) {
          userId = user.uid;
        }
      } catch (error) {
        console.log("No hay usuario autenticado o el token es inválido");
      }
    }
    
    // Guardar el artista en Firestore
    console.log("Guardando artista en Firestore...");
    const firestoreId = await saveArtistToFirestore(artistData);
    
    // Devolver los datos generados
    res.status(200).json({
      success: true,
      message: "Artista generado exitosamente",
      data: {
        ...artistData,
        firestoreId,
        userId
      }
    });
  } catch (error) {
    console.error("Error al generar artista:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar artista",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

/**
 * Endpoint para generar un artista aleatorio (requiere autenticación)
 * Versión protegida del endpoint anterior
 */
router.post("/api/generate-artist/secure", authenticate, async (req: Request, res: Response) => {
  try {
    console.log("Generando artista aleatorio (secure)...");
    const artistData = generateRandomArtist();
    
    // Obtener el usuario autenticado
    const user = (req as any).user;
    const userId = user.uid;
    
    // Guardar el artista en Firestore
    console.log("Guardando artista en Firestore...");
    const firestoreId = await saveArtistToFirestore({
      ...artistData,
      userId // Asociar explícitamente con el usuario autenticado
    });
    
    // Devolver los datos generados
    res.status(200).json({
      success: true,
      message: "Artista generado exitosamente",
      data: {
        ...artistData,
        firestoreId,
        userId
      }
    });
  } catch (error) {
    console.error("Error al generar artista:", error);
    res.status(500).json({
      success: false,
      message: "Error al generar artista",
      error: error instanceof Error ? error.message : "Error desconocido"
    });
  }
});

export default router;