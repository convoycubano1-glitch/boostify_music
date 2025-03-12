#!/usr/bin/env node

/**
 * Script de construcción mejorado para producción
 * 
 * Este script resuelve los problemas de alias @/ en entorno de producción
 * Utiliza el resolvedor de alias para garantizar compatibilidad
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
 * Ejecuta un comando y muestra su salida en tiempo real
 * @param {string} command - Comando a ejecutar
 * @param {string} label - Etiqueta para identificar la salida
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function execute(command, label = '') {
  log(`Ejecutando: ${color.cyan}${command}${color.reset}`, 'info');
  
  try {
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 1024 * 1024 * 10 });
    
    if (stdout) {
      console.log(`${color.dim}${label ? `[${label}] ` : ''}${stdout.trim()}${color.reset}`);
    }
    
    if (stderr) {
      console.error(`${color.yellow}${label ? `[${label}] ` : ''}${stderr.trim()}${color.reset}`);
    }
    
    return { stdout, stderr };
  } catch (error) {
    log(`Error al ejecutar: ${command}`, 'error');
    console.error(`${color.red}${error.message}${color.reset}`);
    throw error;
  }
}

/**
 * Crea un archivo de configuración de Vite optimizado para producción
 * @returns {Promise<string>} - Ruta al archivo de configuración creado
 */
async function createOptimizedViteConfig() {
  const viteConfigPath = path.join(rootDir, 'vite.config.prod.ts');
  const configContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    cssCodeSplit: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantener console.logs en producción
      },
    },
  },
});
`;

  await fs.writeFile(viteConfigPath, configContent, 'utf-8');
  log(`Archivo de configuración optimizado creado en: ${viteConfigPath}`, 'success');
  return viteConfigPath;
}

/**
 * Función principal de construcción
 */
async function build() {
  try {
    log(`${color.bright}Iniciando construcción optimizada para producción${color.reset}`, 'info');
    
    // Paso 1: Crear archivo de configuración optimizado
    log('Paso 1: Creando configuración optimizada de Vite', 'info');
    const viteConfigPath = await createOptimizedViteConfig();
    
    // Paso 2: Verificar el resolvedor de alias
    log('Paso 2: Verificando resolvedor de alias', 'info');
    try {
      await import('./alias-resolver.mjs');
      log('Resolvedor de alias cargado correctamente', 'success');
    } catch (error) {
      log('No se pudo cargar el resolvedor de alias. Continuando sin él.', 'warn');
      console.error(error);
    }
    
    // Paso 3: Verificar si Vite está instalado
    log('Paso 3: Verificando instalación de Vite', 'info');
    try {
      await execute('npx vite --version', 'vite');
      log('Vite está instalado correctamente', 'success');
    } catch (error) {
      log('Vite no está instalado o no puede ejecutarse, intentando instalarlo...', 'warn');
      await execute('npm install -D vite', 'npm');
    }
    
    // Paso 4: Ejecutar la construcción
    log('Paso 4: Ejecutando construcción con la configuración optimizada', 'info');
    await execute(`npx vite build --config ${viteConfigPath}`, 'build');
    
    // Paso 5: Verificar el resultado
    log('Paso 5: Verificando resultado de la construcción', 'info');
    try {
      const distStat = await fs.stat(path.join(rootDir, 'dist'));
      if (distStat.isDirectory()) {
        log('Construcción completada con éxito en el directorio "dist"', 'success');
      }
    } catch (error) {
      log('No se encontró el directorio "dist". Es posible que la construcción haya fallado.', 'error');
      throw error;
    }
    
    log(`${color.bright}${color.green}Construcción finalizada con éxito${color.reset}`, 'success');
    
    return 0;
  } catch (error) {
    log(`${color.bright}${color.red}La construcción falló: ${error.message}${color.reset}`, 'error');
    return 1;
  }
}

// Ejecutar la función principal
build().then(exitCode => {
  process.exit(exitCode);
});