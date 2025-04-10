// Servidor específico para entorno Replit
// Este script utiliza los puertos y la configuración esperada por Replit

import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Replit espera que usemos PORT de las variables de entorno
const PORT = process.env.PORT || 5000;
console.log(`🚇 Puerto configurado: ${PORT}`);

// Mapa de tipos MIME
const MIME_TYPES = {
  default: 'application/octet-stream',
  html: 'text/html; charset=UTF-8',
  js: 'application/javascript',
  css: 'text/css',
  png: 'image/png',
  jpg: 'image/jpg',
  gif: 'image/gif',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
};

const STATIC_PATH = process.env.STATIC_PATH || path.join(__dirname);
console.log(`📁 Sirviendo archivos desde: ${STATIC_PATH}`);

const toBool = [() => true, () => false];

const prepareFile = async (url) => {
  const paths = [STATIC_PATH];
  
  if (url === '/') url = '/index.html';
  
  // Si la URL está en formato "/dir/archivo", eliminamos la barra inicial
  const fileName = url.substring(1);
  
  // Intenta primero en la raíz, luego en client y luego en client/dist
  const filePath = path.join(STATIC_PATH, fileName);
  const clientPath = path.join(STATIC_PATH, 'client', fileName);
  const distPath = path.join(STATIC_PATH, 'client', 'dist', fileName);
  
  console.log(`🔍 Buscando: ${filePath}`);
  
  const fileExists = await fs.promises.access(filePath, fs.constants.F_OK)
    .then(...toBool);
  
  if (fileExists) {
    console.log(`✅ Archivo encontrado en la raíz: ${filePath}`);
    return filePath;
  }
  
  const clientFileExists = await fs.promises.access(clientPath, fs.constants.F_OK)
    .then(...toBool);
  
  if (clientFileExists) {
    console.log(`✅ Archivo encontrado en client: ${clientPath}`);
    return clientPath;
  }
  
  const distFileExists = await fs.promises.access(distPath, fs.constants.F_OK)
    .then(...toBool);
  
  if (distFileExists) {
    console.log(`✅ Archivo encontrado en client/dist: ${distPath}`);
    return distPath;
  }
  
  // Si no encontramos el archivo específico, intentamos servir index.html para SPA
  if (url !== '/index.html') {
    console.log(`❌ Archivo no encontrado: ${filePath}`);
    console.log(`🔄 Intentando servir index.html (SPA)`);
    
    // Intentar primero el index.html principal
    const indexPath = path.join(STATIC_PATH, 'index.html');
    const indexExists = await fs.promises.access(indexPath, fs.constants.F_OK)
      .then(...toBool);
    
    if (indexExists) {
      console.log(`✅ Sirviendo index.html principal para SPA`);
      return indexPath;
    }
    
    // Intentar index.html de client
    const clientIndexPath = path.join(STATIC_PATH, 'client', 'index.html');
    const clientIndexExists = await fs.promises.access(clientIndexPath, fs.constants.F_OK)
      .then(...toBool);
    
    if (clientIndexExists) {
      console.log(`✅ Sirviendo index.html del cliente para SPA`);
      return clientIndexPath;
    }
  }
  
  return null;
};

const server = http.createServer(async (req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  console.log(`📨 Solicitud recibida: ${req.method} ${url}`);
  
  try {
    const filePath = await prepareFile(url);
    
    if (!filePath) {
      res.writeHead(404, { 'Content-Type': 'text/html' });
      res.end(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Boostify Music - 404</title>
            <style>
              body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
              .card { background: #181825; padding: 2rem; border-radius: 8px; max-width: 600px; border: 1px solid #313244; }
              h1 { color: #f97316; }
            </style>
          </head>
          <body>
            <div class="card">
              <h1>Error 404</h1>
              <p>La página solicitada no se encuentra disponible.</p>
            </div>
          </body>
        </html>
      `);
      return;
    }
    
    const data = await fs.promises.readFile(filePath);
    const fileExt = path.extname(filePath).substring(1).toLowerCase();
    const mimeType = MIME_TYPES[fileExt] || MIME_TYPES.default;
    
    res.writeHead(200, { 'Content-Type': mimeType });
    res.end(data);
    console.log(`✅ Archivo servido: ${filePath} (${mimeType})`);
    
  } catch (err) {
    console.error(`❌ Error al servir el archivo:`, err);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Boostify Music - 500</title>
          <style>
            body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
            .card { background: #181825; padding: 2rem; border-radius: 8px; max-width: 600px; border: 1px solid #313244; }
            h1 { color: #f97316; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Error del Servidor</h1>
            <p>Ha ocurrido un error al procesar tu solicitud.</p>
          </div>
        </body>
      </html>
    `);
  }
});

// Configuración específica para Replit
server.on('listening', () => {
  const addr = server.address();
  console.log(`🚀 Servidor escuchando en http://0.0.0.0:${addr.port}`);
  console.log(`✅ REPLIT_IDENTITY: ${process.env.REPLIT_IDENTITY || 'no definido'}`);
  console.log(`✅ REPL_OWNER: ${process.env.REPL_OWNER || 'no definido'}`);
  console.log(`✅ REPL_SLUG: ${process.env.REPL_SLUG || 'no definido'}`);
});

// Manejar errores
server.on('error', (e) => {
  console.error(`❌ Error en el servidor:`, e);
  if (e.code === 'EADDRINUSE') {
    console.error(`❌ El puerto ${PORT} está en uso. Intentando otro puerto...`);
    setTimeout(() => {
      server.close();
      server.listen(0, '0.0.0.0');
    }, 1000);
  }
});

// Iniciar el servidor
server.listen(PORT, '0.0.0.0');