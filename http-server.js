// Servidor HTTP básico usando el módulo http nativo de Node.js
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5000;

// Mapa de tipos MIME
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav'
};

// Crear el servidor
const server = http.createServer((req, res) => {
  console.log(`📄 Solicitud recibida: ${req.method} ${req.url}`);
  
  // Normalizar la URL (eliminar parámetros de consulta y asegurarse de que / vaya a index.html)
  let requestUrl = req.url.split('?')[0];
  if (requestUrl === '/') {
    requestUrl = '/index.html';
  }
  
  // Buscar el archivo primero en la raíz, luego en client
  let filePath = path.join(__dirname, requestUrl.substr(1));
  
  // Si el archivo no existe en la raíz, intentar en client/
  if (!fs.existsSync(filePath)) {
    filePath = path.join(__dirname, 'client', requestUrl.substr(1));
  }
  
  // Comprobar si el archivo existe
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Si no se encuentra el archivo, servir el index.html (para aplicaciones SPA)
      console.log(`❌ Archivo no encontrado: ${filePath}`);
      
      // Para aplicaciones SPA, redirigir a index.html
      const indexPath = path.join(__dirname, 'index.html');
      if (fs.existsSync(indexPath)) {
        serveFile(indexPath, res);
        return;
      }
      
      // Si no existe el index.html en la raíz, intentar en client/
      const clientIndexPath = path.join(__dirname, 'client', 'index.html');
      if (fs.existsSync(clientIndexPath)) {
        serveFile(clientIndexPath, res);
        return;
      }
      
      // Si no existe ningún index.html, mostrar un mensaje de error
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Boostify Music - Error 404</title>
            <style>
              body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background: #181825; padding: 2rem; border-radius: 8px; max-width: 600px; border: 1px solid #313244; }
              h1 { color: #f97316; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Error 404</h1>
              <p>No se encontró el archivo solicitado: ${requestUrl}</p>
            </div>
          </body>
        </html>
      `);
      return;
    }
    
    // Servir el archivo
    serveFile(filePath, res);
  });
});

// Función para servir un archivo
function serveFile(filePath, res) {
  // Obtener la extensión del archivo
  const extname = path.extname(filePath);
  const contentType = mimeTypes[extname] || 'application/octet-stream';
  
  // Leer el archivo
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Boostify Music - Error 500</title>
            <style>
              body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background: #181825; padding: 2rem; border-radius: 8px; max-width: 600px; border: 1px solid #313244; }
              h1 { color: #f97316; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Error 500</h1>
              <p>Error al leer el archivo: ${err.code}</p>
            </div>
          </body>
        </html>
      `);
      return;
    }
    
    // Servir el contenido con el tipo MIME apropiado
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content, 'utf8');
    console.log(`✅ Archivo servido: ${filePath} (${contentType})`);
  });
}

// Iniciar el servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor HTTP simple ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`✅ Accesible desde cualquier host de Replit`);
});