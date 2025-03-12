#!/usr/bin/env node

/**
 * Script de configuración del sistema de alias @/
 * 
 * Este script configura el entorno para poder usar los alias @/ correctamente
 * tanto en desarrollo como en producción.
 * 
 * @author Replit AI
 * @version 1.0.0
 */

import { exec } from 'child_process';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

// Convertir exec a promesa
const execAsync = promisify(exec);

// Configuración de directorios
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);
const clientDir = path.join(rootDir, 'client');
const nodeModulesDir = path.join(rootDir, 'node_modules');

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
 * Ejecuta un comando y muestra su salida
 * @param {string} command - Comando a ejecutar
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function execute(command) {
  log(`Ejecutando: ${color.cyan}${command}${color.reset}`, 'info');
  
  try {
    const { stdout, stderr } = await execAsync(command);
    
    if (stdout) {
      console.log(`${color.dim}${stdout.trim()}${color.reset}`);
    }
    
    if (stderr) {
      console.error(`${color.yellow}${stderr.trim()}${color.reset}`);
    }
    
    return { stdout, stderr };
  } catch (error) {
    log(`Error al ejecutar: ${command}`, 'error');
    console.error(`${color.red}${error.message}${color.reset}`);
    throw error;
  }
}

/**
 * Verifica si un directorio existe
 * @param {string} dir - Directorio a verificar
 * @returns {Promise<boolean>}
 */
async function dirExists(dir) {
  try {
    const stat = await fs.stat(dir);
    return stat.isDirectory();
  } catch (error) {
    return false;
  }
}

/**
 * Crea enlaces simbólicos para los alias @/
 * @returns {Promise<boolean>}
 */
async function createSymlinks() {
  log('Creando enlaces simbólicos para resolver alias @/', 'info');
  
  try {
    // 1. Asegurarse que existe el directorio @
    const atDir = path.join(nodeModulesDir, '@');
    if (!(await dirExists(atDir))) {
      await fs.mkdir(atDir, { recursive: true });
      log(`Directorio creado: ${atDir}`, 'success');
    }
    
    // 2. Crear enlace desde client/src a node_modules/@/
    const targetDir = path.join(clientDir, 'src');
    const linkDir = path.join(nodeModulesDir, '@');
    
    if (!(await dirExists(targetDir))) {
      log(`El directorio fuente no existe: ${targetDir}`, 'error');
      return false;
    }
    
    // Intentar crear el enlace de dos formas diferentes
    try {
      // En sistemas Unix
      await execute(`ln -sf "${targetDir}" "${linkDir}/client-src"`);
      log(`Enlace creado: ${targetDir} -> ${linkDir}/client-src`, 'success');
    } catch (error) {
      log('No se pudo crear el enlace con ln. Intentando con método alternativo...', 'warn');
      
      // Método alternativo: copiar archivos
      await execute(`cp -r "${targetDir}" "${linkDir}/client-src"`);
      log(`Copia creada: ${targetDir} -> ${linkDir}/client-src`, 'success');
    }
    
    // 3. Crear jsconfig.json para IntelliSense
    const jsconfigPath = path.join(clientDir, 'jsconfig.json');
    const jsconfig = {
      compilerOptions: {
        baseUrl: ".",
        paths: {
          "@/*": ["src/*"]
        }
      },
      include: ["src/**/*"]
    };
    
    await fs.writeFile(jsconfigPath, JSON.stringify(jsconfig, null, 2), 'utf-8');
    log(`Archivo jsconfig.json creado en: ${jsconfigPath}`, 'success');
    
    return true;
  } catch (error) {
    log(`Error al crear enlaces simbólicos: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Actualiza los permisos de ejecución de los scripts
 * @returns {Promise<boolean>}
 */
async function updateScriptPermissions() {
  log('Actualizando permisos de ejecución de los scripts', 'info');
  
  try {
    const scripts = [
      'build-fixed.mjs',
      'start-fixed.mjs',
      'alias-resolver.mjs'
    ];
    
    for (const script of scripts) {
      const scriptPath = path.join(rootDir, script);
      try {
        await execute(`chmod +x "${scriptPath}"`);
        log(`Permisos actualizados para: ${scriptPath}`, 'success');
      } catch (error) {
        log(`No se pudo actualizar permisos para ${scriptPath}: ${error.message}`, 'warn');
      }
    }
    
    return true;
  } catch (error) {
    log(`Error al actualizar permisos: ${error.message}`, 'error');
    return false;
  }
}

/**
 * Función principal de configuración
 */
async function setup() {
  try {
    log(`${color.bright}Iniciando configuración de alias @/${color.reset}`, 'info');
    
    // Paso 1: Crear enlaces simbólicos
    log('Paso 1: Configurando enlaces simbólicos', 'info');
    if (!(await createSymlinks())) {
      log('No se pudieron crear los enlaces simbólicos correctamente.', 'warn');
    }
    
    // Paso 2: Actualizar permisos de scripts
    log('Paso 2: Actualizando permisos de scripts', 'info');
    await updateScriptPermissions();
    
    // Paso 3: Mostrar instrucciones
    log('Paso 3: Instrucciones finales', 'info');
    
    console.log(`
${color.bright}Configuración finalizada.${color.reset}

Para iniciar la aplicación con soporte de alias mejorado, utiliza:
${color.green}node start-fixed.mjs${color.reset}

Para construir la aplicación para producción:
${color.green}node build-fixed.mjs${color.reset}

${color.yellow}Nota:${color.reset} Si experimentas problemas con la resolución de alias,
intenta reiniciar el servidor o recrear los enlaces simbólicos.
    `);
    
    return 0;
  } catch (error) {
    log(`Error durante la configuración: ${error.message}`, 'error');
    return 1;
  }
}

// Ejecutar la función principal
setup().then(exitCode => {
  process.exit(exitCode);
});