/**
 * Script de inicio simplificado que usa nuestro servidor HTML estático
 * Soluciona el problema del spinner infinito
 */

const { spawn } = require('child_process');
const path = require('path');

// Función para formatear tiempo
function formatTime(seconds) {
  return new Date(seconds * 1000).toISOString().substr(11, 8);
}

// Función para iniciar el servidor simple
function startSimpleServer() {
  console.log('Starting simple HTML server...');
  const server = spawn('node', ['simple-server.js'], {
    stdio: 'inherit',
  });

  server.on('error', (error) => {
    console.error(`Error starting server: ${error.message}`);
    process.exit(1);
  });

  console.log('Simple HTML server started successfully.');
  return server;
}

// Iniciar el servidor
const server = startSimpleServer();

// Manejar señales de cierre
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.kill();
  process.exit(0);
});