import { Express, Request, Response } from "express";
import { storage, db as firebaseDb } from "../firebase";
import { authenticate, AuthUser } from "../middleware/auth";
import { z } from "zod";

// Esquema de validación para la creación de videos
const videoSchema = z.object({
  title: z.string().min(3, "El título debe tener al menos 3 caracteres"),
  description: z.string().optional(),
  category: z.enum(["featured", "videos", "live", "music"]),
  filePath: z.string().url("Debe ser una URL válida"),
  fileName: z.string(),
});

// Tipo para los datos de video
export type VideoData = z.infer<typeof videoSchema>;

/**
 * Configura las rutas relacionadas con videos
 */
export function setupVideosRoutes(app: Express) {
  /**
   * Endpoint para guardar metadatos de videos en Firestore
   * Requiere autenticación
   */
  app.post("/api/videos", authenticate, async (req: Request, res: Response) => {
    try {
      // Validar los datos de entrada
      const result = videoSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: "Datos inválidos",
          errors: result.error.format(),
        });
      }
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }
      
      const videoData = result.data;
      
      // Agregar campos adicionales
      const videoEntry = {
        ...videoData,
        userId: req.user.uid,
        createdAt: new Date(),
        views: 0,
      };
      
      // Guardar en Firestore usando Admin SDK
      const docRef = await firebaseDb.collection("videos").add(videoEntry);
      
      res.status(201).json({
        success: true,
        message: "Video guardado exitosamente",
        videoId: docRef.id,
      });
    } catch (error) {
      console.error("Error al guardar video:", error);
      res.status(500).json({
        success: false,
        message: "Error al guardar información del video",
        error: (error as Error).message,
      });
    }
  });
  
  /**
   * Endpoint para eliminar un video
   * Requiere autenticación y solo permite eliminar videos propios o a administradores
   */
  app.delete("/api/videos/:id", authenticate, async (req: Request, res: Response) => {
    try {
      const videoId = req.params.id;
      
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: "Usuario no autenticado",
        });
      }
      
      // Obtener la información del video usando Admin SDK
      const videoDoc = await firebaseDb.collection("videos").doc(videoId).get();
      
      if (!videoDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Video no encontrado",
        });
      }
      
      const videoData = videoDoc.data() || {};
      
      // Verificar que el usuario tenga permisos para eliminar el video
      // (Si es el creador o un administrador)
      const isOwner = videoData.userId === req.user.uid;
      const isAdmin = req.user.isAdmin === true;
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({
          success: false,
          message: "No tienes permisos para eliminar este video",
        });
      }
      
      // Si el video tiene un fileName, intentar eliminar el archivo de Storage
      if (videoData.fileName) {
        try {
          const file = storage.bucket().file(`videos/tv/${videoData.fileName}`);
          await file.delete();
        } catch (storageError) {
          console.error("Error al eliminar archivo de Storage:", storageError);
          // Continuamos incluso si hay error al eliminar el archivo
        }
      }
      
      // Eliminar el documento de Firestore
      await firebaseDb.collection("videos").doc(videoId).delete();
      
      res.json({
        success: true,
        message: "Video eliminado correctamente",
      });
    } catch (error) {
      console.error("Error al eliminar video:", error);
      res.status(500).json({
        success: false,
        message: "Error al eliminar el video",
        error: (error as Error).message,
      });
    }
  });
}