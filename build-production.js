/**
 * Script de compilación personalizado para ambiente de producción
 * Este script maneja correctamente el proceso de construcción del proyecto
 * respetando los alias de rutas @/ configurados en TypeScript
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Iniciando proceso de compilación para producción...');

// Limpiar carpeta dist
try {
  console.log('🧹 Limpiando carpeta dist...');
  if (fs.existsSync('./dist')) {
    execSync('rm -rf ./dist');
  }
  fs.mkdirSync('./dist');
  console.log('✅ Carpeta dist limpiada correctamente');
} catch (error) {
  console.error('❌ Error al limpiar carpeta dist:', error);
  process.exit(1);
}

// Compilar archivos del servidor usando tsconfig.server.json
try {
  console.log('🔨 Compilando archivos del servidor...');
  execSync('tsc --project tsconfig.server.json');
  console.log('✅ Servidor compilado correctamente');
} catch (error) {
  console.error('❌ Error al compilar servidor:', error);
  process.exit(1);
}

// Compilar cliente usando vite
try {
  console.log('🔨 Compilando archivos del cliente...');
  execSync('cd client && vite build');
  console.log('✅ Cliente compilado correctamente');
} catch (error) {
  console.error('❌ Error al compilar cliente:', error);
  process.exit(1);
}

// Copiar archivos estáticos del cliente a dist/client
try {
  console.log('📋 Copiando archivos estáticos...');
  if (!fs.existsSync('./dist/client')) {
    fs.mkdirSync('./dist/client', { recursive: true });
  }
  execSync('cp -r ./client/dist/* ./dist/client/');
  console.log('✅ Archivos estáticos copiados correctamente');
} catch (error) {
  console.error('❌ Error al copiar archivos estáticos:', error);
  process.exit(1);
}

console.log('✨ Compilación completada con éxito!');
console.log('Para iniciar el servidor en modo producción, ejecute: node dist/server/index.js');