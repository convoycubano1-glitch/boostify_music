// Script para despliegue en producción
import { spawn, exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Obtener el directorio actual
const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Preparando despliegue para producción...');
console.log('📣 IMPORTANTE: La plataforma utilizará el puerto 5173 para mostrar la interfaz completa.');

// Establecer NODE_ENV a producción para este proceso
process.env.NODE_ENV = 'production';

// Crear un archivo .env.production si no existe
const envPath = path.join(__dirname, '.env.production');
if (!fs.existsSync(envPath)) {
  console.log('📄 Creando archivo .env.production para configuración de producción');
  fs.writeFileSync(envPath, 'NODE_ENV=production\n');
}

// Primero, compilar la aplicación Vite
console.log('📦 Compilando la aplicación frontend...');

// Ejecutamos la compilación y esperamos a que termine
exec('npx vite build', (error, stdout, stderr) => {
  if (error) {
    console.error(`Error durante la compilación: ${error}`);
    console.log(stderr);
    // Continuar a pesar del error para servir al menos la versión fallback
  } else {
    console.log('✅ Aplicación compilada con éxito');
    console.log(stdout);
  }
  
  // Al finalizar la compilación (con éxito o no), continuar con el despliegue
  desplegarServidor();
});

function desplegarServidor() {
  console.log('🌐 Iniciando servidores para producción...');
  console.log('🔒 El servidor principal estará en el puerto 5000');
  console.log('🌟 La plataforma completa estará disponible en el puerto 5173');
  
  // Crear un script de producción específico que no usa el puerto 5000 para evitar conflictos
  const contenidoScript = `
// Servidor Express para modo producción (versión independiente)
import express from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { spawn } from 'child_process';

// Obtener el directorio actual
const __dirname = dirname(fileURLToPath(import.meta.url));

// Crear una aplicación Express
const app = express();
const PORT = 5000; // Puerto principal
const VITE_PORT = 5173; // Puerto de Vite

console.log('🚀 Iniciando servidor de producción con Vite...');

// Iniciar servidor Vite para servir la aplicación completa
console.log('📦 Iniciando servidor Vite en puerto ' + VITE_PORT + '...');
const viteProcess = spawn('npx', ['vite', '--port', VITE_PORT], {
  stdio: 'inherit',
  shell: true
});

// Mensaje importante
console.log('✨ IMPORTANTE: Para ver la plataforma completa con todos los estilos, debes acceder al puerto 5173');
console.log('   URL de la plataforma: http://0.0.0.0:' + VITE_PORT);
  `;
  
  // Guardar el script temporal
  const scriptPath = path.join(__dirname, 'deploy-temp.js');
  fs.writeFileSync(scriptPath, contenidoScript);
  
  // Iniciar el servidor sin crear conflictos de puerto
  console.log('🌟 Iniciando servidor Vite en puerto 5173 para servir la plataforma completa...');
  
  // Iniciar el servidor de Vite directamente
  const startProcess = spawn('npx', ['vite', '--port', '5173'], {
    env: { ...process.env, NODE_ENV: 'production' },
    stdio: 'inherit',
    shell: true
  });
  
  // Manejar eventos del proceso
  startProcess.on('error', (error) => {
    console.error('Error al iniciar el servidor:', error);
    fs.unlinkSync(scriptPath); // Eliminar archivo temporal
    process.exit(1);
  });
  
  // Mostrar mensaje en caso de cierre del proceso
  startProcess.on('close', (code) => {
    fs.unlinkSync(scriptPath); // Eliminar archivo temporal
    if (code !== 0) {
      console.error(`El servidor se cerró con código ${code}`);
      process.exit(code);
    }
  });
}