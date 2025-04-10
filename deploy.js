// Script para construir y desplegar la aplicación en producción
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Iniciando despliegue para producción...');

// Primero, construir la aplicación client utilizando Vite
console.log('📦 Paso 1: Construyendo la aplicación React...');

// Verificar si el directorio client existe
const clientDir = path.join(__dirname, 'client');
if (!fs.existsSync(clientDir)) {
  console.error('❌ Error: Directorio client no encontrado');
  console.log('Asegúrate de estar ejecutando este script desde la raíz del proyecto');
  process.exit(1);
}

// Ejecutar el comando de construcción
const buildProcess = exec('cd client && npm run build');

buildProcess.stdout.on('data', (data) => {
  console.log(data.toString());
});

buildProcess.stderr.on('data', (data) => {
  console.error(data.toString());
});

buildProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Error: El proceso de construcción falló con código ${code}`);
    process.exit(1);
  }

  console.log('✅ Aplicación React construida con éxito');
  console.log('🚀 Iniciando servidor de producción...');

  // Iniciar el servidor de producción
  const serverProcess = exec('node production-server.js');

  serverProcess.stdout.on('data', (data) => {
    console.log(data.toString());
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(data.toString());
  });

  // No terminamos el proceso aquí para permitir que el servidor siga ejecutándose
  console.log('✅ Servidor de producción iniciado');
});

console.log('⏳ Espera mientras se construye la aplicación...');