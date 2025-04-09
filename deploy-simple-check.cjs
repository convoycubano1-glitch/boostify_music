/**
 * Script para verificar y contar videos en el proyecto
 */

const fs = require('fs');
const path = require('path');

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

function countVideos() {
  const videoLocations = [
    './client/assets',
    './client/public/assets'
  ];
  
  let totalVideos = 0;
  let totalSize = 0;
  const videoDetails = [];
  
  function isVideoFile(filePath) {
    return filePath.toLowerCase().endsWith('.mp4') ||
           filePath.toLowerCase().endsWith('.webm') ||
           filePath.toLowerCase().endsWith('.mov');
  }
  
  function countVideosInDir(dir) {
    if (!fs.existsSync(dir)) {
      log(`Directorio no encontrado: ${dir}`, 'yellow');
      return;
    }
    
    try {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      
      for (const file of files) {
        const fullPath = path.join(dir, file.name);
        
        if (file.isDirectory()) {
          countVideosInDir(fullPath);
        } else if (isVideoFile(file.name)) {
          const stats = fs.statSync(fullPath);
          const sizeInMB = Math.round(stats.size / (1024 * 1024) * 100) / 100;
          
          totalVideos++;
          totalSize += sizeInMB;
          
          videoDetails.push({
            path: fullPath,
            name: file.name,
            size: sizeInMB
          });
        }
      }
    } catch (error) {
      log(`Error al leer directorio ${dir}: ${error.message}`, 'red');
    }
  }
  
  log('====================================', 'cyan');
  log('     VERIFICACIÓN DE VIDEOS', 'cyan');
  log('====================================', 'cyan');
  
  // Contar videos en todas las ubicaciones
  for (const location of videoLocations) {
    log(`\nBuscando en: ${location}`, 'magenta');
    countVideosInDir(location);
  }
  
  // Mostrar resultados
  log('\n====================================', 'green');
  log('         RESULTADOS', 'green');
  log('====================================', 'green');
  log(`Total de videos encontrados: ${totalVideos}`, 'green');
  log(`Tamaño total de videos: ${totalSize.toFixed(2)} MB`, 'green');
  
  // Detalles de los videos
  log('\nDetalle de videos:', 'yellow');
  videoDetails.forEach((video, index) => {
    log(`${index + 1}. ${video.name} (${video.size} MB) - ${video.path}`, 'reset');
  });
  
  return {
    count: totalVideos,
    size: totalSize,
    details: videoDetails
  };
}

// Ejecutar la función
const result = countVideos();

// Exportar para uso en otros scripts
module.exports = { countVideos };