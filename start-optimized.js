/**
 * Script optimizado para iniciar la aplicación
 * Este script maneja correctamente el inicio del servidor y cliente
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Formato de tiempo transcurrido
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

// Colores para consola
const colors = {
  server: '\x1b[36m',  // Cyan
  client: '\x1b[35m',  // Magenta
  success: '\x1b[32m', // Verde
  error: '\x1b[31m',   // Rojo
  reset: '\x1b[0m'     // Reset
};

// Función para iniciar un proceso
function startProcess(command, args, prefix, color) {
  console.log(`${color}>> Iniciando ${prefix}...${colors.reset}`);
  
  const startTime = Date.now();
  const proc = spawn(command, args, {
    stdio: ['ignore', 'pipe', 'pipe'],
    shell: true
  });
  
  // Manejar salida estándar
  proc.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${color}[${prefix}] ${output}${colors.reset}`);
    }
  });
  
  // Manejar errores
  proc.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) {
      console.log(`${colors.error}[${prefix} ERROR] ${output}${colors.reset}`);
    }
  });
  
  // Manejar cierre del proceso
  proc.on('close', (code) => {
    const runTime = Math.floor((Date.now() - startTime) / 1000);
    
    if (code === 0) {
      console.log(`${colors.success}[${prefix}] Proceso completado exitosamente después de ${formatTime(runTime)}${colors.reset}`);
    } else {
      console.log(`${colors.error}[${prefix}] Proceso terminado con código de error: ${code} después de ${formatTime(runTime)}${colors.reset}`);
      
      // Intentar reiniciar el proceso si falló
      setTimeout(() => {
        console.log(`${colors.reset}[${prefix}] Intentando reiniciar...${colors.reset}`);
        startProcess(command, args, prefix, color);
      }, 5000);
    }
  });
  
  return proc;
}

// Función principal
function startApplication() {
  console.log('\x1b[1;33m======================================\x1b[0m');
  console.log('\x1b[1;33m=      INICIANDO APLICACIÓN          =\x1b[0m');
  console.log('\x1b[1;33m======================================\x1b[0m');
  
  // Verificar si estamos en producción (directorio dist)
  const isProduction = fs.existsSync(path.join(__dirname, 'dist'));
  
  if (isProduction) {
    console.log(`${colors.success}Iniciando en modo producción...${colors.reset}`);
    startProcess('node', ['start.js'], 'Servidor Producción', colors.server);
  } else {
    console.log(`${colors.success}Iniciando en modo desarrollo...${colors.reset}`);
    
    // Iniciar servidor
    const server = startProcess('node', ['--experimental-specifier-resolution=node', '--experimental-modules', 'server/index.js'], 'Servidor', colors.server);
    
    // Iniciar cliente
    const client = startProcess('cd client && npm run dev', [], 'Cliente', colors.client);
    
    // Gestionar salida limpia (Ctrl+C)
    process.on('SIGINT', () => {
      console.log('\n\x1b[33mDeteniendo procesos...\x1b[0m');
      
      server.kill();
      client.kill();
      
      setTimeout(() => {
        console.log('\x1b[32mAplicación detenida correctamente\x1b[0m');
        process.exit(0);
      }, 1000);
    });
  }
}

// Iniciar la aplicación
startApplication();