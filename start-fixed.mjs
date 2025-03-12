#!/usr/bin/env node

/**
 * Script mejorado para iniciar la aplicación
 * 
 * Este script garantiza la correcta resolución de los alias @/ en desarrollo
 * Registra un resolvedor personalizado para Node.js con soporte ESM
 * 
 * @author Replit AI
 * @version 1.0.0
 */

import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración de directorios
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);

// Colores para la consola
const color = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

/**
 * Muestra un mensaje en la consola con formato
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de mensaje (info, success, warn, error)
 */
function log(message, type = 'info') {
  const prefix = {
    info: `${color.blue}ℹ${color.reset}`,
    success: `${color.green}✓${color.reset}`,
    warn: `${color.yellow}⚠${color.reset}`,
    error: `${color.red}✗${color.reset}`
  };
  
  console.log(`${prefix[type]} ${message}`);
}

/**
 * Inicia un proceso y captura su salida en tiempo real
 * @param {string} command - Comando a ejecutar
 * @param {string[]} args - Argumentos del comando
 * @param {string} label - Etiqueta para identificar la salida
 * @returns {Promise<number>} - Código de salida del proceso
 */
function startProcess(command, args, label) {
  return new Promise((resolve, reject) => {
    log(`Iniciando ${label}: ${color.cyan}${command} ${args.join(' ')}${color.reset}`, 'info');
    
    const proc = spawn(command, args, {
      stdio: 'pipe',
      shell: true
    });
    
    // Colorear la salida según el proceso
    const prefixColor = label === 'servidor' ? color.green : color.cyan;
    
    proc.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.log(`${prefixColor}[${label}]${color.reset} ${line}`);
        }
      });
    });
    
    proc.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) {
          console.error(`${color.yellow}[${label}]${color.reset} ${line}`);
        }
      });
    });
    
    proc.on('close', (code) => {
      if (code === 0) {
        log(`Proceso ${label} finalizado correctamente`, 'success');
        resolve(code);
      } else {
        log(`Proceso ${label} finalizado con código: ${code}`, 'error');
        reject(new Error(`Proceso ${label} finalizado con código: ${code}`));
      }
    });
    
    proc.on('error', (err) => {
      log(`Error al iniciar ${label}: ${err.message}`, 'error');
      reject(err);
    });
  });
}

/**
 * Función principal para iniciar la aplicación
 */
async function start() {
  try {
    log(`${color.bright}Iniciando aplicación con soporte de alias mejorado${color.reset}`, 'info');
    
    // Asegurarse de que el resolvedor de alias existe
    try {
      await fs.access(path.join(rootDir, 'alias-resolver.mjs'));
      log('Resolvedor de alias encontrado', 'success');
    } catch (error) {
      log('Creando resolvedor de alias...', 'info');
      
      // Si no existe el archivo alias-resolver.mjs, podríamos crearlo aquí
      // pero por ahora asumimos que ya existe después de ejecutar el script anterior
      
      log('Por favor ejecuta primero el script para crear el resolvedor de alias', 'error');
      return 1;
    }
    
    // Iniciar servidor node con tsx para TypeScript
    log('Iniciando servidor con soporte de TypeScript...', 'info');
    
    try {
      return await startProcess('node', ['--import=./alias-resolver.mjs', 'server/index.ts'], 'servidor');
    } catch (error) {
      log(`Error al iniciar el servidor: ${error.message}`, 'error');
      return 1;
    }
  } catch (error) {
    log(`Error general: ${error.message}`, 'error');
    return 1;
  }
}

// Ejecutar la función principal
start().then(exitCode => {
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
});