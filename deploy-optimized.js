/**
 * Script optimizado para despliegue en Replit
 * Enfocado en preservar archivos de video y resolver problemas de tiempo de ejecución
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

function execute(command, errorMessage = null, ignoreErrors = false) {
  try {
    log(`Ejecutando: ${command}`, 'blue');
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (errorMessage) {
      log(errorMessage, 'red');
    } else {
      log(`Error al ejecutar: ${command}`, 'red');
      log(error.message, 'red');
    }
    
    if (!ignoreErrors) {
      log('Abortando despliegue', 'red');
      process.exit(1);
    }
    
    return false;
  }
}

function createDistDirectory() {
  log('\nCreando estructura de directorios para despliegue...', 'cyan');
  
  // Crear carpeta dist si no existe
  if (!fs.existsSync('./dist')) {
    fs.mkdirSync('./dist', { recursive: true });
  }
  
  // Crear estructura en dist
  [
    './dist/client',
    './dist/client/assets',
    './dist/client/public',
    './dist/client/public/assets'
  ].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
  
  log('✓ Estructura de directorios creada', 'green');
}

function isVideoFile(filePath) {
  return filePath.toLowerCase().endsWith('.mp4') ||
         filePath.toLowerCase().endsWith('.webm') ||
         filePath.toLowerCase().endsWith('.mov');
}

function shouldExclude(filePath) {
  // No excluir archivos de video
  if (isVideoFile(filePath)) {
    return false;
  }
  
  // Excluir archivos node_modules y otros directorios grandes
  const excludePatterns = [
    'node_modules',
    '.git',
    '.github',
    'coverage',
    'dist',
    'logs',
    'test-dist',
    '.next'
  ];
  
  return excludePatterns.some(pattern => filePath.includes(pattern));
}

function copyVideoFiles() {
  log('\nCopiando archivos de video...', 'cyan');
  
  const videoSources = [
    './client/assets',
    './client/public/assets'
  ];
  
  let videoCount = 0;
  let totalSizeMB = 0;
  
  function copyVideosRecursively(src, dest) {
    if (!fs.existsSync(src)) {
      return;
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    entries.forEach(entry => {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      if (entry.isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyVideosRecursively(srcPath, destPath);
      } else if (isVideoFile(entry.name)) {
        if (!fs.existsSync(path.dirname(destPath))) {
          fs.mkdirSync(path.dirname(destPath), { recursive: true });
        }
        
        fs.copyFileSync(srcPath, destPath);
        
        const stats = fs.statSync(srcPath);
        const sizeMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;
        totalSizeMB += sizeMB;
        videoCount++;
        
        log(`✓ Copiado: ${entry.name} (${sizeMB} MB)`, 'green');
      }
    });
  }
  
  videoSources.forEach(src => {
    const destPath = path.join('./dist', src);
    
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath, { recursive: true });
    }
    
    copyVideosRecursively(src, destPath);
  });
  
  log(`\n🎬 Total: ${videoCount} videos copiados (${totalSizeMB.toFixed(2)} MB)`, 'magenta');
}

function copyStaticFiles() {
  log('\nCopiando archivos estáticos esenciales...', 'cyan');
  
  // Copiar index.html
  if (fs.existsSync('./client/index.html')) {
    fs.copyFileSync('./client/index.html', './dist/client/index.html');
    log('✓ Copiado: client/index.html', 'green');
  } else {
    log('⚠️ Advertencia: No se encontró index.html', 'yellow');
    
    // Crear un index.html mínimo
    const minimalHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 0; }
    header { background-color: #ff5722; color: white; padding: 20px; text-align: center; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    footer { background-color: #333; color: white; padding: 10px; text-align: center; }
  </style>
</head>
<body>
  <header>
    <h1>Boostify Music</h1>
  </header>
  <div class="container">
    <h2>Bienvenido a Boostify Music</h2>
    <p>Plataforma musical optimizada para Replit</p>
    
    <div id="video-container">
      <h3>Video de muestra</h3>
      <video width="640" height="360" controls>
        <source src="/assets/hero-video.mp4" type="video/mp4">
        Tu navegador no soporta el elemento de video.
      </video>
    </div>
  </div>
  <footer>© 2025 Boostify Music</footer>
</body>
</html>`;
    
    fs.writeFileSync('./dist/client/index.html', minimalHtml);
    log('✓ Creado: dist/client/index.html (mínimo)', 'green');
  }
}

function createOptimizedPackageJson() {
  log('\nCreando package.json optimizado...', 'cyan');
  
  const packageJson = {
    name: 'boostify-music',
    version: '1.0.0',
    description: 'Plataforma musical avanzada con capacidades de IA',
    main: 'optimized-start.js',
    scripts: {
      start: 'node optimized-start.js'
    },
    dependencies: {
      dotenv: '^16.3.1',
      express: '^4.18.2',
      path: '^0.12.7',
      fs: '0.0.1-security'
    },
    engines: {
      node: '>=16.0.0'
    }
  };
  
  fs.writeFileSync('./dist/package.json', JSON.stringify(packageJson, null, 2));
  log('✓ Creado: dist/package.json', 'green');
}

function createOptimizedStartScript() {
  log('\nCreando script de inicio optimizado...', 'cyan');
  
  const startScript = `/**
 * Script de inicio optimizado para Replit
 */
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
try {
  if (fs.existsSync('./.env.production')) {
    require('dotenv').config({ path: './.env.production' });
    console.log('Variables de entorno de producción cargadas');
  } else {
    console.log('Archivo .env.production no encontrado, usando variables predeterminadas');
  }
} catch (error) {
  console.log('Error al cargar variables de entorno:', error.message);
}

// Función para registrar listados de videos disponibles
function listAvailableVideos() {
  console.log('\\n📹 Comprobando videos disponibles...');
  
  const videoDirectories = [
    './client/assets',
    './client/public/assets'
  ];
  
  let videoCount = 0;
  
  videoDirectories.forEach(dir => {
    if (fs.existsSync(dir)) {
      function scanDir(currentDir, level = 0) {
        const indent = '  '.repeat(level);
        const files = fs.readdirSync(currentDir, { withFileTypes: true });
        
        files.forEach(file => {
          const fullPath = path.join(currentDir, file.name);
          
          if (file.isDirectory()) {
            scanDir(fullPath, level + 1);
          } else if (file.name.endsWith('.mp4')) {
            console.log(\`\${indent}✓ \${fullPath}\`);
            videoCount++;
          }
        });
      }
      
      scanDir(dir);
    }
  });
  
  console.log(\`\\nTotal de videos encontrados: \${videoCount}\`);
}

// Iniciar servidor
console.log('\\x1b[36m%s\\x1b[0m', 'Iniciando Boostify Music en modo producción...');

// Verificar videos disponibles
listAvailableVideos();

// Ejecutar el servidor
const server = spawn('node', ['server-prod.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (err) => {
  console.error('\\x1b[31m%s\\x1b[0m', 'Error al iniciar el servidor:', err);
  process.exit(1);
});`;
  
  fs.writeFileSync('./dist/optimized-start.js', startScript);
  log('✓ Creado: dist/optimized-start.js', 'green');
}

function createOptimizedServer() {
  log('\nCreando servidor optimizado...', 'cyan');
  
  const serverScript = `/**
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
      'Content-Range': \`bytes \${start}-\${end}/\${fileSize}\`,
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
  
  let html = \`
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
      <p>Total de videos encontrados: <span class="count">\${videos.length}</span></p>
      
      <div class="video-list">
        <h2>Lista de Videos</h2>
        \${videos.map(video => \`
          <div class="video-item">
            <p><strong>Nombre:</strong> \${video.name}</p>
            <p><strong>Ruta:</strong> \${video.path}</p>
            <p><strong>Tamaño:</strong> \${Math.round(video.size / 1024 / 1024 * 100) / 100} MB</p>
          </div>
        \`).join('')}
      </div>
    </body>
    </html>
  \`;
  
  res.send(html);
});

// Manejar todas las demás rutas enviando el index.html para que el cliente maneje el enrutamiento
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Servidor optimizado ejecutándose en http://0.0.0.0:\${PORT}\`);
  console.log(\`Diagnóstico disponible en: http://0.0.0.0:\${PORT}/diagnose\`);
});`;
  
  fs.writeFileSync('./dist/server-prod.js', serverScript);
  log('✓ Creado: dist/server-prod.js', 'green');
}

async function optimizedDeploy() {
  log('====================================', 'magenta');
  log(' DESPLIEGUE OPTIMIZADO PARA REPLIT', 'magenta');
  log('====================================', 'magenta');
  
  // Crear estructura de directorios
  createDistDirectory();
  
  // Copiar archivos de video
  copyVideoFiles();
  
  // Copiar archivos estáticos
  copyStaticFiles();
  
  // Crear package.json optimizado
  createOptimizedPackageJson();
  
  // Crear script de inicio
  createOptimizedStartScript();
  
  // Crear servidor optimizado
  createOptimizedServer();
  
  log('\n====================================', 'green');
  log(' DESPLIEGUE OPTIMIZADO COMPLETADO', 'green');
  log('====================================', 'green');
  
  log('\nPróximos pasos:', 'cyan');
  log('1. Ejecuta: node prepare-deploy.cjs', 'yellow');
  log('2. Inicia la aplicación: node optimized-start.js', 'yellow');
  log('3. Usa el botón "Deploy" en Replit', 'yellow');
}

// Ejecutar el despliegue optimizado
optimizedDeploy();