#!/usr/bin/env node

// Script para iniciar el servidor TypeScript en modo ESM
// Este script utiliza tsx que es compatible con ESM y TypeScript
const { spawn } = require('child_process');
const watch = require('node-watch');

console.log('Iniciando servidor con tsx...');

// Función para iniciar el servidor
function startServer() {
  return spawn('npx', ['tsx', 'server/index.ts'], {
    stdio: 'inherit',
    shell: true
  });
}

// Iniciar el servidor
let server = startServer();

// Observar cambios en la carpeta server
watch('./server', { recursive: true }, function(evt, name) {
  console.log(`Cambio detectado en: ${name}`);
  console.log('Reiniciando servidor...');
  
  // Matar el proceso anterior
  if (server) {
    server.kill();
  }
  
  // Iniciar el servidor nuevamente
  server = startServer();
});

// Manejar terminación limpia
process.on('SIGINT', () => {
  console.log('Deteniendo servidor...');
  if (server) {
    server.kill();
  }
  process.exit(0);
});