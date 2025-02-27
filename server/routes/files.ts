import { Express, Request, Response } from "express";
import fs from "fs";
import path from "path";

/**
 * Configura rutas para gestionar archivos en el servidor
 */
export function setupFilesRoutes(app: Express) {
  /**
   * Endpoint para obtener la lista de archivos de video en una carpeta específica
   * Retorna una lista de objetos con información sobre cada archivo de video
   */
  app.get("/api/files/videos/:folder", (req: Request, res: Response) => {
    try {
      const folderPath = path.join("client", "public", "assets", req.params.folder);
      
      // Verificar si la carpeta existe
      if (!fs.existsSync(folderPath)) {
        return res.status(404).json({
          success: false,
          message: `Folder '${req.params.folder}' not found`,
        });
      }

      // Leer archivos del directorio
      const files = fs.readdirSync(folderPath);
      
      // Filtrar solo archivos de video y crear objetos con los metadatos
      const videos = files
        .filter(file => {
          const extension = path.extname(file).toLowerCase();
          return ['.mp4', '.webm', '.ogg', '.mov'].includes(extension);
        })
        .map((file, index) => {
          const filePath = `/assets/${req.params.folder}/${file}`;
          // Formatear el nombre del archivo para usarlo como título
          const title = file
            .replace(/\.[^/.]+$/, "") // Quitar extensión
            .replace(/_/g, " ")       // Reemplazar guiones bajos con espacios
            .replace(/-/g, " ");      // Reemplazar guiones con espacios
          
          // Información básica del video
          return {
            id: String(index + 1),
            title,
            description: `Video: ${title}`,
            filePath,
            thumbnailPath: null, // Podríamos generar miniaturas en el futuro
            duration: "0:00", // Esto requeriría análisis del video
            views: Math.floor(Math.random() * 50000), // Valor aleatorio para demostración
            category: index % 2 === 0 ? "featured" : "videos" // Alternamos categorías
          };
        });

      res.json({
        success: true,
        videos,
      });
    } catch (error) {
      console.error("Error reading video files:", error);
      res.status(500).json({
        success: false,
        message: "Error reading video files",
        error: (error as Error).message,
      });
    }
  });
}