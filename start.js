#!/usr/bin/env node

/**
 * Script personalizado para iniciar tanto el servidor como el cliente
 * Este script evita problemas con la configuración ESM y TypeScript
 */

import { spawn } from 'child_process';

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

// Función para iniciar un proceso e imprimir su salida con un prefijo de color
function startProcess(command, args, prefix, color) {
  console.log(`${color}Iniciando ${prefix}...${colors.reset}`);
  
  const process = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true
  });
  
  process.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${color}[${prefix}]${colors.reset} ${line}`);
      }
    });
  });
  
  process.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${colors.red}[${prefix} ERROR]${colors.reset} ${line}`);
      }
    });
  });
  
  process.on('exit', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[${prefix}] Proceso terminado con código ${code}${colors.reset}`);
    }
  });
  
  return process;
}

// Iniciar servidor utilizando tsx
const server = startProcess('npx', ['tsx', 'server/index.ts'], 'SERVER', colors.cyan);

// Iniciar cliente Vite
const client = startProcess('cd', ['client', '&&', 'npx', 'vite'], 'CLIENT', colors.green);

// Manejar terminación limpia
process.on('SIGINT', () => {
  console.log('\nDeteniendo procesos...');
  server.kill();
  client.kill();
  process.exit(0);
});