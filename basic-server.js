// Servidor web básico compatible con restricciones de Replit
// Este servidor utiliza únicamente módulos nativos de Node.js

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Usar solo el puerto 5000 que es el que espera el workflow de Replit
const PORTS = [5000];

// Mapeo de extensiones de archivo a tipos MIME
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp4': 'video/mp4',
  '.woff': 'application/font-woff',
  '.woff2': 'application/font-woff2',
  '.ttf': 'application/font-ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.otf': 'application/font-otf',
};

// Crear servidor HTTP básico
const server = http.createServer((req, res) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  
  // Añadir encabezados CORS para permitir acceso desde cualquier origen
  // Esto puede ayudar con problemas de acceso desde herramientas de verificación
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Responder inmediatamente a las solicitudes OPTIONS (preflight CORS)
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    console.log('Respuesta enviada: 200 OK (CORS Preflight)');
    return;
  }
  
  // Ruta de verificación especial
  if (req.url === '/health' || req.url === '/health/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', message: 'Servidor funcionando correctamente' }));
    console.log('Respuesta enviada: 200 OK (Health Check)');
    return;
  }
  
  // Normalizar la URL solicitada
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './index.html';
  }
  
  // Obtener la extensión del archivo
  const extname = path.extname(filePath);
  let contentType = MIME_TYPES[extname] || 'application/octet-stream';
  
  // Leer el archivo
  fs.readFile(filePath, (error, content) => {
    if (error) {
      // Si el archivo no existe, intentamos servir el index.html (para SPA)
      if (error.code === 'ENOENT') {
        fs.readFile('./index.html', (err, indexContent) => {
          if (err) {
            res.writeHead(404);
            res.end('Archivo no encontrado');
            console.log('Respuesta enviada: 404 Not Found');
          } else {
            res.writeHead(200, { 
              'Content-Type': 'text/html',
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': '0'
            });
            res.end(indexContent, 'utf-8');
            console.log('Respuesta enviada: 200 OK (index.html para SPA)');
          }
        });
      } else {
        // Error de servidor
        res.writeHead(500);
        res.end(`Error de servidor: ${error.code}`);
        console.log(`Respuesta enviada: 500 Error de servidor: ${error.code}`);
      }
    } else {
      // Responder con el contenido del archivo
      res.writeHead(200, { 
        'Content-Type': contentType,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      });
      res.end(content, 'utf-8');
      console.log(`Respuesta enviada: 200 OK (${filePath})`);
    }
  });
});

// Intentar iniciar el servidor en múltiples puertos
function startServer() {
  let currentPortIndex = 0;
  
  function tryNextPort() {
    if (currentPortIndex >= PORTS.length) {
      console.error('❌ No se pudo iniciar el servidor en ningún puerto');
      process.exit(1);
      return;
    }
    
    const port = PORTS[currentPortIndex];
    
    server.listen(port, '0.0.0.0', () => {
      console.log(`✅ Servidor iniciado exitosamente en http://0.0.0.0:${port}`);
    }).on('error', (err) => {
      console.log(`⚠️ No se pudo iniciar en puerto ${port}: ${err.message}`);
      currentPortIndex++;
      tryNextPort();
    });
  }
  
  tryNextPort();
}

startServer();