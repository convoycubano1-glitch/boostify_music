/**
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
  console.log('\n📹 Comprobando videos disponibles...');
  
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
            console.log(`${indent}✓ ${fullPath}`);
            videoCount++;
          }
        });
      }
      
      scanDir(dir);
    }
  });
  
  console.log(`\nTotal de videos encontrados: ${videoCount}`);
}

// Iniciar servidor
console.log('\x1b[36m%s\x1b[0m', 'Iniciando Boostify Music en modo producción...');

// Verificar videos disponibles
listAvailableVideos();

// Ejecutar el servidor
const server = spawn('node', ['server-prod.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (err) => {
  console.error('\x1b[31m%s\x1b[0m', 'Error al iniciar el servidor:', err);
  process.exit(1);
});