/**
 * Script de construcción para Replit
 * Este script ejecuta replit-deploy.js para crear la estructura esperada por Replit
 */
import { spawn } from 'child_process';

console.log('🚀 Iniciando proceso de construcción para Replit...');

// Ejecutar replit-deploy.js para crear la estructura
const deploy = spawn('node', ['replit-deploy.js']);

deploy.stdout.on('data', (data) => {
  console.log(data.toString());
});

deploy.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

deploy.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Construcción completada con éxito');
    console.log('📋 Build exitoso - La aplicación está lista para ser desplegada en Replit');
  } else {
    console.error(`❌ Error durante la construcción (código ${code})`);
  }
});