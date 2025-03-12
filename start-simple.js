const { spawn } = require('child_process');
const path = require('path');

/**
 * Script para iniciar el servidor con configuración optimizada para desarrollo
 */
console.log('Iniciando servidor con configuración optimizada...');

// Opciones para mejorar rendimiento y manejo de errores
process.env.NODE_OPTIONS = '--max-old-space-size=4096';

// Lanzar el comando npm run dev
const dev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Evitar problemas de resolución de módulos
    VITE_PREFER_NATIVE_ESM: 'false',
    // Habilitar mejor reporte de errores
    VITE_DEBUG: 'true',
    // Evitar timeout en la compilación
    VITE_STARTUP_TIMEOUT: '60000'
  }
});

dev.on('error', (err) => {
  console.error('Error al iniciar el servidor:', err);
});

dev.on('close', (code) => {
  if (code !== 0) {
    console.log(`El servidor se detuvo con código: ${code}`);
  }
});