import { Express, Request, Response } from "express";
import { db as firebaseDb } from "../firebase";

/**
 * Configura rutas para gestionar archivos en el servidor
 */
export function setupFilesRoutes(app: Express) {
  /**
   * Endpoint para obtener la lista de videos desde Firestore
   * Retorna una lista de objetos con información sobre cada video
   */
  app.get("/api/files/videos/:folder", async (req: Request, res: Response) => {
    try {
      const folder = req.params.folder;
      
      // Obtener videos desde Firestore usando la Admin SDK
      const videosCollection = firebaseDb.collection("videos");
      
      // Consulta para obtener videos ordenados por fecha de creación
      const querySnapshot = await videosCollection
        .orderBy("createdAt", "desc") // Ordenar por fecha de creación (más reciente primero)
        .get();
      
      if (querySnapshot.empty) {
        return res.json({
          success: true,
          videos: [],
          message: "No videos found"
        });
      }
      
      // Convertir los documentos a objetos con el formato esperado
      const videos = querySnapshot.docs.map(doc => {
        const data = doc.data();
        
        return {
          id: doc.id,
          title: data.title || "Untitled Video",
          description: data.description || "",
          filePath: data.filePath || "",
          thumbnailPath: data.thumbnailPath || null,
          duration: data.duration || "0:00",
          views: data.views || 0,
          category: data.category || "videos"
        };
      });
      
      res.json({
        success: true,
        videos,
      });
    } catch (error) {
      console.error("Error fetching videos from Firestore:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching videos",
        error: (error as Error).message,
      });
    }
  });
  
  /**
   * Endpoint para obtener detalles de un video específico
   */
  app.get("/api/files/videos/:folder/:videoId", async (req: Request, res: Response) => {
    try {
      const { videoId } = req.params;
      
      // Referencia al documento de Firestore usando Admin SDK
      const videoDoc = await firebaseDb.collection("videos").doc(videoId).get();
      
      if (!videoDoc.exists) {
        return res.status(404).json({
          success: false,
          message: "Video not found"
        });
      }
      
      const videoData = videoDoc.data() || {};
      
      // Determinar si la fecha es un Timestamp de Firestore y convertirla si es necesario
      let createdAt = new Date();
      if (videoData.createdAt) {
        if (typeof videoData.createdAt.toDate === 'function') {
          createdAt = videoData.createdAt.toDate();
        } else if (videoData.createdAt instanceof Date) {
          createdAt = videoData.createdAt;
        }
      }
      
      res.json({
        success: true,
        video: {
          id: videoDoc.id,
          title: videoData.title || "Untitled Video",
          description: videoData.description || "",
          filePath: videoData.filePath || "",
          thumbnailPath: videoData.thumbnailPath || null,
          duration: videoData.duration || "0:00",
          views: videoData.views || 0,
          category: videoData.category || "videos",
          createdAt: createdAt
        }
      });
    } catch (error) {
      console.error("Error fetching video details:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching video details",
        error: (error as Error).message,
      });
    }
  });
}