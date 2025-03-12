/**
 * Script de inicio mejorado con resolución de alias @/
 * Este script inicia la aplicación asegurando que el alias @/ funcione correctamente
 */

import { spawn } from 'child_process';
import process from 'node:process';
import './alias-resolver.mjs';

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

// Función para iniciar un proceso y mostrar su salida con un prefijo coloreado
function startProcess(command, args, prefix, color) {
  console.log(`${color}Iniciando ${prefix}...${colors.reset}`);
  
  // Usar shell:true para asegurar la carga adecuada de variables de entorno
  const childProcess = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, FORCE_COLOR: "true" }
  });
  
  let hasStarted = false;
  
  childProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${color}[${prefix}]${colors.reset} ${line}`);
        
        // Marcar como iniciado cuando veamos estos patrones
        if ((prefix === 'SERVIDOR' && line.includes('Server started')) ||
            (prefix === 'CLIENTE' && line.includes('Local:'))) {
          hasStarted = true;
        }
      }
    });
  });
  
  childProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        // Para advertencias de ESLint/TypeScript de Vite, usar amarillo en lugar de rojo para diferenciar de errores reales
        const isWarning = line.includes('warning') || line.includes('Warning');
        const errorColor = isWarning ? colors.yellow : colors.red;
        const errorType = isWarning ? 'ADVERTENCIA' : 'ERROR';
        console.log(`${errorColor}[${prefix} ${errorType}]${colors.reset} ${line}`);
      }
    });
  });
  
  // Establecer un tiempo de espera para verificar si el proceso ha iniciado
  setTimeout(() => {
    if (!hasStarted && !childProcess.killed) {
      console.log(`${colors.yellow}[${prefix}] El proceso está tardando más de lo esperado en iniciar. Seguimos esperando...${colors.reset}`);
    }
  }, 10000);
  
  childProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${colors.red}[${prefix}] Proceso terminado con código ${code}${colors.reset}`);
      
      // Proporcionar consejos útiles de diagnóstico según el prefijo
      if (prefix === 'SERVIDOR') {
        console.log(`${colors.yellow}Consejos para solucionar errores del servidor:${colors.reset}`);
        console.log(`1. Verificar errores de TypeScript en el código del servidor`);
        console.log(`2. Verificar que todas las variables de entorno requeridas estén configuradas`);
        console.log(`3. Verificar si el puerto ${process.env.PORT || '5000'} ya está en uso`);
      } else if (prefix === 'CLIENTE') {
        console.log(`${colors.yellow}Consejos para solucionar errores del cliente:${colors.reset}`);
        console.log(`1. Verificar errores de TypeScript en el código del cliente`);
        console.log(`2. Verificar que todas las variables de entorno requeridas estén configuradas`);
      }
    }
  });
  
  return childProcess;
}

// Intentar iniciar el servidor primero, luego iniciar el cliente
console.log(`${colors.blue}Iniciando aplicación en modo desarrollo...${colors.reset}`);

// Iniciar servidor usando tsx para ejecución de TypeScript
const server = startProcess('npx', ['tsx', 'server/index.ts'], 'SERVIDOR', colors.cyan);

// Esperar un poco para que el servidor se inicialice antes de iniciar el cliente
setTimeout(() => {
  // Iniciar cliente usando vite con host 0.0.0.0 para acceso externo
  const client = startProcess('cd', ['client', '&&', 'npx', 'vite', '--host', '0.0.0.0'], 'CLIENTE', colors.green);
  
  // Manejar terminación limpia
  process.on('SIGINT', () => {
    console.log('\nDeteniendo procesos...');
    server.kill();
    client.kill();
    process.exit(0);
  });
}, 2000);

// Manejar excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.log(`${colors.red}Excepción no capturada:${colors.reset}`, err);
});

process.on('unhandledRejection', (reason) => {
  console.log(`${colors.red}Rechazo de promesa no manejado:${colors.reset}`, reason);
});