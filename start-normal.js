/**
 * Script para arrancar la aplicación en modo normal
 * Restaura el funcionamiento original con npm run dev
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

console.log(`${colors.magenta}=== RESTAURANDO CONFIGURACIÓN ORIGINAL ===\n${colors.reset}`);

/**
 * Inicia un proceso hijo con el comando y argumentos dados
 * @param {string} command - El comando a ejecutar
 * @param {string[]} args - Argumentos del comando
 * @param {string} prefix - Prefijo para los logs
 * @param {string} color - Color para los logs
 */
function startProcess(command, args, prefix, color) {
  console.log(`${color}Iniciando ${prefix}...${colors.reset}`);
  
  const process = spawn(command, args, {
    stdio: 'pipe',
    shell: true
  });
  
  process.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${color}[${prefix}] ${line}${colors.reset}`);
      }
    }
  });
  
  process.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    for (const line of lines) {
      if (line.trim()) {
        console.log(`${colors.red}[${prefix} ERROR] ${line}${colors.reset}`);
      }
    }
  });
  
  process.on('close', (code) => {
    if (code !== 0) {
      console.log(`${colors.red}[${prefix}] El proceso terminó con código ${code}${colors.reset}`);
    }
  });
  
  return process;
}

// Iniciar la aplicación en modo desarrollo normal
console.log(`${colors.yellow}Iniciando la aplicación en modo normal (npm run dev)...\n${colors.reset}`);

// Verificar si está instalado concurrently
let concurrentlyInstalled = false;
try {
  // Verificar si concurrently está en node_modules
  const concurrentlyPath = path.resolve('node_modules', '.bin', 'concurrently');
  concurrentlyInstalled = fs.existsSync(concurrentlyPath);
  
  if (!concurrentlyInstalled) {
    console.log(`${colors.yellow}Concurrently no está instalado. Instalando...${colors.reset}`);
    const npmInstall = spawn('npm', ['install', '--no-save', 'concurrently'], {
      stdio: 'inherit',
      shell: true
    });
    
    await new Promise((resolve) => {
      npmInstall.on('close', (code) => {
        if (code === 0) {
          console.log(`${colors.green}Concurrently instalado correctamente.${colors.reset}`);
          resolve();
        } else {
          console.error(`${colors.red}Error al instalar concurrently. Intentando continuar...${colors.reset}`);
          resolve();
        }
      });
    });
  }
} catch (error) {
  console.error(`${colors.red}Error al verificar concurrently: ${error.message}${colors.reset}`);
}

// Iniciar el servidor y el cliente
try {
  // Usamos npm run dev directamente si está disponible
  const devProcess = startProcess('npm', ['run', 'dev'], 'DEV', colors.green);
  
  devProcess.on('error', (error) => {
    console.error(`${colors.red}Error al iniciar npm run dev: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Intentando iniciar el servidor y cliente por separado...${colors.reset}`);
    
    // Intento alternativo: iniciar servidor y cliente por separado
    const serverProcess = startProcess('npm', ['run', 'server:dev'], 'SERVER', colors.cyan);
    const clientProcess = startProcess('npm', ['run', 'client:dev'], 'CLIENT', colors.blue);
    
    // Manejar CTRL+C para ambos procesos
    process.on('SIGINT', () => {
      serverProcess.kill();
      clientProcess.kill();
      process.exit();
    });
  });
  
  // Manejar CTRL+C
  process.on('SIGINT', () => {
    devProcess.kill();
    process.exit();
  });
} catch (error) {
  console.error(`${colors.red}Error al iniciar la aplicación: ${error.message}${colors.reset}`);
}