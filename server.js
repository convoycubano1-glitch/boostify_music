// Servidor HTTP básico que sirve el contenido de src/pages/home.tsx
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Puerto para el servidor
const PORT = 5000;

// Crear servidor HTTP
const server = http.createServer((req, res) => {
  console.log(`Solicitud recibida: ${req.method} ${req.url}`);
  
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar solicitudes OPTIONS
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Ruta para verificación de salud
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
    console.log('Respuesta de health check enviada');
    return;
  }
  
  // Para la ruta principal, mostrar el contenido de home.tsx
  if (req.url === '/' || req.url === '/index.html') {
    const homePath = path.join(__dirname, 'src', 'pages', 'home.tsx');
    
    fs.readFile(homePath, 'utf8', (err, data) => {
      if (err) {
        console.error('Error al leer home.tsx:', err);
        res.writeHead(500);
        res.end('Error al leer home.tsx');
        return;
      }
      
      // Crear una página HTML simple
      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Home.tsx - Vista</title>
  <style>
    body { 
      font-family: system-ui, sans-serif; 
      line-height: 1.6;
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
      background-color: #1a1a2e;
      color: #e6e6e6;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #333;
    }
    .logo { 
      font-size: 24px; 
      font-weight: bold;
      color: #f97316;
    }
    h1 { 
      color: #f97316; 
      margin-bottom: 20px;
    }
    .container {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .section {
      background-color: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .content {
      margin-top: 20px;
      background-color: rgba(0, 0, 0, 0.2);
      padding: 20px;
      border-radius: 8px;
      overflow: auto;
    }
    pre {
      white-space: pre-wrap;
      font-family: monospace;
      font-size: 14px;
    }
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 20px;
      margin-top: 30px;
    }
    .feature-card {
      background-color: rgba(255, 255, 255, 0.05);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .feature-title {
      font-size: 18px;
      color: #f97316;
      margin-bottom: 10px;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <header>
    <div class="logo">Boostify Music</div>
    <div>src/pages/home.tsx</div>
  </header>
  
  <div class="container">
    <div class="section">
      <h1>Vista del componente HomePage</h1>
      <p>Este es el contenido del archivo src/pages/home.tsx que has solicitado como página principal de la aplicación.</p>
      
      <div class="features">
        <div class="feature-card">
          <div class="feature-title">🎵 Gestión de música</div>
          <p>Organiza y administra tu catálogo musical, sube nuevas canciones y controla tus lanzamientos desde un solo lugar.</p>
        </div>
        <div class="feature-card">
          <div class="feature-title">📊 Análisis avanzado</div>
          <p>Obtén estadísticas detalladas sobre el rendimiento de tu música y el comportamiento de tus fans.</p>
        </div>
        <div class="feature-card">
          <div class="feature-title">💰 Monetización</div>
          <p>Maximiza tus ingresos con múltiples fuentes de monetización y oportunidades de negocio.</p>
        </div>
        <div class="feature-card">
          <div class="feature-title">🌐 Distribución global</div>
          <p>Distribuye tu música en las principales plataformas de streaming y tiendas digitales con facilidad.</p>
        </div>
      </div>
    </div>
    
    <div class="content">
      <h2>Contenido del archivo src/pages/home.tsx:</h2>
      <pre>${data.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
    </div>
  </div>
</body>
</html>
      `;
      
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
      console.log('Página principal enviada (contenido de home.tsx)');
    });
    return;
  }
  
  // Para cualquier otra ruta, intentar servir el archivo o redirigir a la página principal
  const filePath = path.join(__dirname, req.url);
  
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Si no existe el archivo, redirigir a la página principal
      res.writeHead(302, { 'Location': '/' });
      res.end();
      console.log(`Archivo no encontrado: ${filePath}, redirigiendo a la página principal`);
      return;
    }
    
    // Determinar el tipo de contenido basado en la extensión
    const extname = path.extname(filePath);
    let contentType = 'text/html';
    
    switch (extname) {
      case '.js': contentType = 'text/javascript'; break;
      case '.css': contentType = 'text/css'; break;
      case '.json': contentType = 'application/json'; break;
      case '.png': contentType = 'image/png'; break;
      case '.jpg': case '.jpeg': contentType = 'image/jpeg'; break;
      case '.gif': contentType = 'image/gif'; break;
      case '.svg': contentType = 'image/svg+xml'; break;
      case '.ico': contentType = 'image/x-icon'; break;
      case '.mp4': contentType = 'video/mp4'; break;
    }
    
    // Leer y enviar el archivo
    fs.readFile(filePath, (err, content) => {
      if (err) {
        res.writeHead(500);
        res.end('Error al leer el archivo: ' + err.code);
        console.error(`Error al leer archivo: ${err.code}`);
        return;
      }
      
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
      console.log(`Archivo enviado: ${filePath}`);
    });
  });
});

// Iniciar el servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor iniciado en http://0.0.0.0:${PORT}`);
  console.log(`🏠 Sirviendo directamente src/pages/home.tsx como página principal`);
});