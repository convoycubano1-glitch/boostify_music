/**
 * Servidor HTTP simple para mostrar archivos estáticos
 * No requiere dependencias externas - Usa solo módulos incorporados de Node.js
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener rutas absolutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mapa de tipos MIME
const mimeTypes = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain',
};

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`📥 Solicitud recibida: ${req.method} ${req.url}`);
  
  // Ruta por defecto
  let filePath = req.url === '/' ? '/index.html' : req.url;
  
  // Asegurar que la ruta sea relativa sin caracteres peligrosos
  filePath = path.normalize(filePath).replace(/^(\.\.[\/\\])+/, '');
  
  // Ruta completa al archivo
  const fullPath = path.join(__dirname, filePath);
  
  // Obtener extensión del archivo
  const extname = path.extname(fullPath).toLowerCase();
  
  // Tipo de contenido
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // Verificar si el archivo existe
  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // Si es un error de que no existe el archivo, intentar con index.html para rutas de SPA
      if (err.code === 'ENOENT') {
        console.log(`⚠️ Archivo no encontrado: ${fullPath}`);
        
        // Para SPA, servir el index.html para todas las rutas no encontradas que no sean assets
        if (!extname || extname === '.html') {
          console.log(`🔄 Sirviendo index.html para ruta SPA: ${req.url}`);
          fs.readFile(path.join(__dirname, 'index.html'), (err, data) => {
            if (err) {
              res.writeHead(404);
              res.end('Error 404: Página no encontrada');
              return;
            }
            
            res.writeHead(200, { 'Content-Type': 'text/html' });
            res.end(data);
          });
          return;
        }
        
        res.writeHead(404);
        res.end('Error 404: Recurso no encontrado');
        return;
      }
      
      // Para cualquier otro error
      console.error(`❌ Error al leer el archivo: ${err.message}`);
      res.writeHead(500);
      res.end('Error 500: Error interno del servidor');
      return;
    }
    
    // Servir el archivo correctamente
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

// Puerto configurable
const PORT = process.env.PORT || 3000;

// Iniciar servidor
server.listen(PORT, '0.0.0.0', () => {
  const isReplitEnv = !!process.env.REPL_SLUG || !!process.env.REPLIT;
  const url = isReplitEnv 
    ? `https://${process.env.REPL_SLUG || 'workspace'}.replit.app`
    : `http://localhost:${PORT}`;
    
  console.log(`✅ Servidor iniciado en puerto ${PORT}`);
  console.log(`🌐 Accede a: ${url}`);
});