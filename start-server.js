/**
 * Script para iniciar el servidor con nodejs utilizando tsx para compilar TypeScript
 * Esta versión está adaptada para funcionar con ESM
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Iniciando servidor con tsx...');

// Colores para la salida de la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const server = spawn('npx', ['tsx', '--tsconfig', 'tsconfig.server.json', 'server/index.ts'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true
});

server.stdout.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      console.log(`${colors.cyan}[SERVER]${colors.reset} ${line}`);
    }
  });
});

server.stderr.on('data', (data) => {
  const lines = data.toString().trim().split('\n');
  lines.forEach(line => {
    if (line.trim()) {
      console.log(`${colors.red}[SERVER ERROR]${colors.reset} ${line}`);
    }
  });
});

server.on('exit', (code) => {
  if (code !== 0) {
    console.log(`${colors.red}[SERVER] Proceso terminado con código ${code}${colors.reset}`);
  }
});

// Manejar terminación limpia
process.on('SIGINT', () => {
  console.log('\nDeteniendo servidor...');
  server.kill();
  process.exit(0);
});