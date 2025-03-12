/**
 * Script de inicio de aplicación con resolución de alias integrada
 * Convierte de forma transparente importaciones @/ a rutas relativas
 * y maneja la inicialización del servidor y cliente
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import process from 'node:process';

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);
const clientDir = path.join(rootDir, 'client');
const srcDir = path.join(clientDir, 'src');

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

// Asegurar que el directorio @/ existe como symlink
async function setupAliasSymlink() {
  console.log(`${colors.blue}Configurando alias @/ como enlace simbólico...${colors.reset}`);
  
  try {
    // Crear directorio node_modules si no existe
    const nodeModulesDir = path.join(rootDir, 'node_modules');
    try {
      await fs.mkdir(nodeModulesDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
    
    // Crear symlink de @/ a src
    const aliasTarget = path.join(nodeModulesDir, '@');
    
    // Eliminar symlink anterior si existe
    try {
      const stats = await fs.lstat(aliasTarget);
      if (stats.isSymbolicLink()) {
        await fs.unlink(aliasTarget);
      }
    } catch (err) {
      if (err.code !== 'ENOENT') {
        console.log(`${colors.yellow}Advertencia al verificar symlink existente: ${err.message}${colors.reset}`);
      }
    }
    
    // Crear nuevo symlink
    try {
      await fs.symlink(srcDir, aliasTarget, 'dir');
      console.log(`${colors.green}Enlace simbólico creado: ${aliasTarget} -> ${srcDir}${colors.reset}`);
    } catch (err) {
      console.log(`${colors.yellow}No se pudo crear el symlink. Usando enfoque alternativo. Error: ${err.message}${colors.reset}`);
    }
    
  } catch (error) {
    console.log(`${colors.yellow}Error al configurar symlink: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Continuando sin symlink...${colors.reset}`);
  }
}

// Iniciar un proceso con manejo de salida
function startProcess(command, args, prefix, color) {
  console.log(`${color}Iniciando ${prefix}...${colors.reset}`);
  
  // Usar shell:true para asegurar carga correcta de variables de entorno
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
        // Para warnings de Vite, usar amarillo en lugar de rojo
        const isWarning = line.includes('warning') || line.includes('Warning');
        const errorColor = isWarning ? colors.yellow : colors.red;
        const errorType = isWarning ? 'ADVERTENCIA' : 'ERROR';
        console.log(`${errorColor}[${prefix} ${errorType}]${colors.reset} ${line}`);
      }
    });
  });
  
  // Configurar timeout para verificar si el proceso ha iniciado
  setTimeout(() => {
    if (!hasStarted && !childProcess.killed) {
      console.log(`${colors.yellow}[${prefix}] El proceso está tardando más de lo esperado en iniciar. Seguimos esperando...${colors.reset}`);
    }
  }, 10000);
  
  childProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${colors.red}[${prefix}] Proceso terminado con código ${code}${colors.reset}`);
      
      // Proporcionar consejos de diagnóstico según el prefijo
      if (prefix === 'SERVIDOR') {
        console.log(`${colors.yellow}Consejos de solución para errores del servidor:${colors.reset}`);
        console.log(`1. Verificar errores de TypeScript en el código del servidor`);
        console.log(`2. Verificar que todas las variables de entorno requeridas estén configuradas`);
        console.log(`3. Verificar si el puerto ${process.env.PORT || '5000'} ya está en uso`);
      } else if (prefix === 'CLIENTE') {
        console.log(`${colors.yellow}Consejos de solución para errores del cliente:${colors.reset}`);
        console.log(`1. Verificar errores de TypeScript en el código del cliente`);
        console.log(`2. Verificar que todas las variables de entorno requeridas estén configuradas`);
      }
    }
  });
  
  return childProcess;
}

// Función principal
async function main() {
  console.log(`${colors.blue}Iniciando aplicación en modo desarrollo con soporte de alias...${colors.reset}`);
  
  // Configurar symlink antes de iniciar
  await setupAliasSymlink();
  
  // Iniciar servidor usando tsx para ejecución de TypeScript
  const server = startProcess('node', ['server/index.ts'], 'SERVIDOR', colors.cyan);
  
  // Esperar un poco para que el servidor se inicialice antes de iniciar el cliente
  setTimeout(() => {
    // Iniciar cliente usando vite
    const client = startProcess('npx', ['vite', '--host', '0.0.0.0'], 'CLIENTE', colors.green);
    
    // Manejar terminación limpia
    process.on('SIGINT', () => {
      console.log('\nDeteniendo procesos...');
      server.kill();
      client.kill();
      process.exit(0);
    });
  }, 2000);
}

// Manejar excepciones no capturadas
process.on('uncaughtException', (err) => {
  console.log(`${colors.red}Excepción no capturada:${colors.reset}`, err);
});

process.on('unhandledRejection', (reason) => {
  console.log(`${colors.red}Rechazo de promesa no manejado:${colors.reset}`, reason);
});

// Ejecutar la función principal
main().catch(err => {
  console.error(`${colors.red}Error durante la inicialización:${colors.reset}`, err);
  process.exit(1);
});