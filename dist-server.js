// Servidor optimizado para servir los archivos compilados en /client/dist
// Compatible con el entorno Replit

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Usar el puerto 5000 que es el que espera el workflow de Replit
const PORT = 5000;

// Mapa de tipos MIME para servir los archivos con el tipo correcto
const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'font/otf',
};

// Ruta a la carpeta dist (archivos compilados)
const DIST_PATH = path.join(__dirname, 'client', 'dist');
console.log(`📂 Sirviendo archivos compilados desde: ${DIST_PATH}`);

// Función para servir un archivo
const serveFile = (filePath, res) => {
  // Obtener extensión del archivo para determinar el tipo MIME
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  
  // Leer y servir el archivo
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.error(`📄 Archivo no encontrado: ${filePath}`);
        // Enviar una página 404 simple
        res.writeHead(404, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Página no encontrada</title>
              <style>
                body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: #181825; padding: 2rem; border-radius: 8px; max-width: 600px; border: 1px solid #313244; }
                h1 { color: #f97316; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Error 404</h1>
                <p>La página solicitada no se ha encontrado.</p>
              </div>
            </body>
          </html>
        `);
      } else {
        // Error del servidor
        console.error(`⚠️ Error al leer el archivo: ${err.code}`);
        res.writeHead(500, { 'Content-Type': 'text/html; charset=UTF-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Error del servidor</title>
              <style>
                body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
                .card { background: #181825; padding: 2rem; border-radius: 8px; max-width: 600px; border: 1px solid #313244; }
                h1 { color: #f97316; }
              </style>
            </head>
            <body>
              <div class="card">
                <h1>Error 500</h1>
                <p>Ha ocurrido un error en el servidor.</p>
              </div>
            </body>
          </html>
        `);
      }
      return;
    }
    
    // Enviar el archivo con el tipo MIME correcto
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    console.log(`📄 Servido: ${filePath} (${contentType})`);
  });
};

// Crear el servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`🔍 Solicitud: ${req.method} ${req.url}`);
  
  // Normalizar la URL (quitar parámetros de consulta)
  let url = req.url.split('?')[0];
  
  // Si la URL es / o está vacía, servir index.html
  if (url === '/' || url === '') {
    url = '/index.html';
  }
  
  // Construir la ruta al archivo
  const filePath = path.join(DIST_PATH, url);
  
  // Comprobar si es un directorio
  fs.stat(filePath, (err, stats) => {
    if (err) {
      // Si hay error, comprobar si es una ruta de SPA
      if (url.indexOf('.') === -1) {
        // Es probablemente una ruta de SPA, servir index.html
        console.log(`🔄 Redirección SPA: ${url} -> /index.html`);
        serveFile(path.join(DIST_PATH, 'index.html'), res);
      } else {
        // Es un archivo que no existe
        console.log(`❌ No encontrado: ${filePath}`);
        serveFile(path.join(DIST_PATH, 'index.html'), res);
      }
      return;
    }
    
    if (stats.isDirectory()) {
      // Si es un directorio, servir index.html dentro de ese directorio
      serveFile(path.join(filePath, 'index.html'), res);
    } else {
      // Si es un archivo, servirlo directamente
      serveFile(filePath, res);
    }
  });
});

// Iniciar el servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor iniciado en http://0.0.0.0:${PORT}`);
  console.log(`✅ Todos los hosts permitidos, incluido el dominio de Replit`);
});