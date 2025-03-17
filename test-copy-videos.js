#!/usr/bin/env node

/**
 * Script de prueba para verificar la estrategia de preservación de videos
 */

import fs from 'fs';
import path from 'path';

// Rutas de origen y destino para pruebas
const sourceDir = './client/public';
const targetDir = './test-dist';

// Asegurarse de que el directorio de destino exista
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Función para verificar si un archivo es un video
function isVideoFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return ext === '.mp4' || ext === '.webm' || ext === '.mov';
}

// Función de copia recursiva
function copyDirectory(source, target) {
  // Crear el directorio de destino si no existe
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // Leer entradas del directorio
  const entries = fs.readdirSync(source, { withFileTypes: true });
  
  // Procesar cada entrada
  for (const entry of entries) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    
    if (entry.isDirectory()) {
      // Si es un directorio, copiar recursivamente
      copyDirectory(sourcePath, targetPath);
    } else {
      // Si es un archivo de video, copiarlo y registrar la acción
      if (isVideoFile(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, targetPath);
          const stats = fs.statSync(sourcePath);
          const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
          console.log(`✓ Copiado video: ${sourcePath} (${fileSizeMB} MB)`);
        } catch (error) {
          console.log(`✗ Error al copiar video: ${sourcePath} - ${error.message}`);
        }
      }
    }
  }
}

// Ejecutar la copia
console.log(`Iniciando prueba de copia de videos de ${sourceDir} a ${targetDir}...`);
copyDirectory(sourceDir, targetDir);
console.log('Prueba completada.');

// Mostrar resumen
console.log('\nResumen de la prueba:');
const videosCopiados = countVideos(targetDir);
console.log(`Total de videos copiados: ${videosCopiados}`);

// Función para contar videos en un directorio
function countVideos(directory) {
  let count = 0;
  
  function traverse(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        traverse(fullPath);
      } else if (isVideoFile(fullPath)) {
        count++;
      }
    }
  }
  
  traverse(directory);
  return count;
}