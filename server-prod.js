/**
 * Servidor optimizado para producción en Replit
 */
const express = require('express');
const path = require('path');
const fs = require('fs');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// Función para listar archivos de video
function findVideoFiles() {
  const videoFiles = [];
  const videoDirectories = [
    path.join(__dirname, 'client', 'assets'),
    path.join(__dirname, 'client', 'public', 'assets')
  ];
  
  function scanDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const items = fs.readdirSync(dir, { withFileTypes: true });
    
    items.forEach(item => {
      const fullPath = path.join(dir, item.name);
      
      if (item.isDirectory()) {
        scanDir(fullPath);
      } else if (item.name.endsWith('.mp4')) {
        const relativePath = fullPath.replace(__dirname, '');
        videoFiles.push({
          path: relativePath,
          name: item.name,
          size: fs.statSync(fullPath).size
        });
      }
    });
  }
  
  videoDirectories.forEach(dir => scanDir(dir));
  return videoFiles;
}

// Middleware para comprimir respuestas
app.use((req, res, next) => {
  // Establecer encabezados para archivos grandes
  res.setHeader('Accept-Ranges', 'bytes');
  next();
});

// Configuración de rutas para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'client')));

// Ruta específica para los assets (incluyendo videos)
app.use('/assets', express.static(path.join(__dirname, 'client', 'assets')));
app.use('/assets', express.static(path.join(__dirname, 'client', 'public', 'assets')));

// Ruta para streaming de videos con soporte para streaming parcial
app.get('/video/:filename', (req, res) => {
  const filename = req.params.filename;
  let videoPath = '';
  
  // Buscar el video en múltiples ubicaciones
  const possiblePaths = [
    path.join(__dirname, 'client', 'assets', filename),
    path.join(__dirname, 'client', 'public', 'assets', filename)
  ];
  
  for (const pathToCheck of possiblePaths) {
    if (fs.existsSync(pathToCheck)) {
      videoPath = pathToCheck;
      break;
    }
  }
  
  if (!videoPath) {
    return res.status(404).send('Video no encontrado');
  }
  
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;
  
  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(videoPath, { start, end });
    
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    });
    
    file.pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4'
    });
    
    fs.createReadStream(videoPath).pipe(res);
  }
});

// Ruta para verificar videos disponibles
app.get('/api/videos', (req, res) => {
  const videos = findVideoFiles();
  res.json({
    count: videos.length,
    videos: videos
  });
});

// Ruta de diagnóstico
app.get('/diagnose', (req, res) => {
  const videos = findVideoFiles();
  
  let html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Diagnóstico de Boostify Music</title>
      <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #ff5722; }
        .video-list { margin-top: 20px; }
        .video-item { background: #f5f5f5; padding: 10px; margin-bottom: 10px; border-radius: 4px; }
        .count { font-size: 24px; font-weight: bold; color: green; }
      </style>
    </head>
    <body>
      <h1>Diagnóstico de Boostify Music</h1>
      <p>Total de videos encontrados: <span class="count">${videos.length}</span></p>
      
      <div class="video-list">
        <h2>Lista de Videos</h2>
        ${videos.map(video => `
          <div class="video-item">
            <p><strong>Nombre:</strong> ${video.name}</p>
            <p><strong>Ruta:</strong> ${video.path}</p>
            <p><strong>Tamaño:</strong> ${Math.round(video.size / 1024 / 1024 * 100) / 100} MB</p>
          </div>
        `).join('')}
      </div>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Manejar todas las demás rutas enviando el index.html para que el cliente maneje el enrutamiento
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor optimizado ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`Diagnóstico disponible en: http://0.0.0.0:${PORT}/diagnose`);
});