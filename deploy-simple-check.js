#!/usr/bin/env node

/**
 * Script para verificar y completar la estructura de archivos para despliegue
 * Este script comprueba que los archivos de video existan y que la estructura sea correcta
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

// Comprobar que la carpeta dist existe
if (!fs.existsSync('./dist')) {
  log('Error: La carpeta dist no existe. Ejecuta primero node deploy-optimized.js', 'red');
  process.exit(1);
}

// Comprobar que hay archivos de video en la estructura
function countVideos() {
  let count = 0;
  const videoDirs = [
    './dist/client/public/assets',
    './dist/client/src/images/videos'
  ];

  function isVideoFile(filePath) {
    const ext = path.extname(filePath).toLowerCase();
    return ext === '.mp4' || ext === '.webm' || ext === '.mov';
  }

  function countVideosInDir(dir) {
    if (!fs.existsSync(dir)) return;
    
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        countVideosInDir(fullPath);
      } else if (isVideoFile(fullPath)) {
        count++;
        log(`✓ Video encontrado: ${fullPath}`, 'green');
      }
    }
  }

  videoDirs.forEach(dir => {
    if (fs.existsSync(dir)) {
      countVideosInDir(dir);
    }
  });

  return count;
}

const videoCount = countVideos();
log(`Total de videos encontrados: ${videoCount}`, 'magenta');

if (videoCount < 1) {
  log('Advertencia: No se encontraron archivos de video. El despliegue puede no incluir videos.', 'yellow');
} else {
  log('La estructura de archivos parece correcta para el despliegue.', 'green');
}

// Comprobar si tenemos los archivos esenciales
const essentialFiles = [
  './dist/optimized-start.js',
  './dist/server-prod.js',
  './dist/package.json'
];

let allEssentialFilesExist = true;
essentialFiles.forEach(file => {
  if (!fs.existsSync(file)) {
    log(`Falta archivo esencial: ${file}`, 'red');
    allEssentialFilesExist = false;
  } else {
    log(`✓ Archivo esencial presente: ${file}`, 'green');
  }
});

if (!allEssentialFilesExist) {
  log('Error: Faltan archivos esenciales para el despliegue.', 'red');
} else {
  log('\n====================================', 'green');
  log('✓ ESTRUCTURA LISTA PARA DESPLIEGUE', 'green');
  log('====================================', 'green');
  
  log('\nPara completar el despliegue:', 'cyan');
  log('1. Asegúrate de que la carpeta dist contiene los archivos correctos', 'cyan');
  log('2. Ejecuta una prueba con "cd dist && node optimized-start.js"', 'cyan');
  log('3. Usa la opción "Deploy" de Replit para desplegar la aplicación', 'cyan');
}