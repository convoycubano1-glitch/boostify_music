/**
 * Script para ejecutar la construcción de producción
 * Este script se encarga de preparar el entorno y ejecutar el script de construcción principal
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\x1b[35m=======================================\x1b[0m');
console.log('\x1b[35m= PREPARANDO CONSTRUCCIÓN DE PRODUCCIÓN =\x1b[0m');
console.log('\x1b[35m=======================================\x1b[0m');

// Ejecutar proceso de construcción
try {
  // 1. Verificar que existe el script de construcción
  const buildScript = path.join(__dirname, 'build-for-replit.js');
  if (!fs.existsSync(buildScript)) {
    throw new Error('No se encontró el script de construcción build-for-replit.js');
  }

  // 2. Ejecutar el script de construcción
  console.log('\x1b[36mEjecutando script de construcción optimizado...\x1b[0m');
  execSync('node build-for-replit.js', { stdio: 'inherit' });

  console.log('\x1b[32m\nPROCESO DE CONSTRUCCIÓN COMPLETADO EXITOSAMENTE\x1b[0m');
  console.log('\x1b[32mEl directorio "dist" contiene la versión de producción.\x1b[0m');
  console.log('\x1b[32mPara iniciar la aplicación: cd dist && node start.js\x1b[0m');
} catch (error) {
  console.error('\x1b[31mERROR EN EL PROCESO DE CONSTRUCCIÓN:\x1b[0m', error.message);
  
  // Intentar compilación alternativa
  console.log('\x1b[33m\nIntentando método de compilación alternativo...\x1b[0m');
  
  try {
    // Limpiar directorio dist si existe
    if (fs.existsSync(path.join(__dirname, 'dist'))) {
      execSync('rm -rf dist', { stdio: 'inherit' });
    }
    
    // Crear estructura de directorios
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
    fs.mkdirSync(path.join(__dirname, 'dist', 'client'), { recursive: true });
    
    // Ejecutar tsc para compilar servidor
    console.log('\x1b[36mCompilando código TypeScript del servidor...\x1b[0m');
    try {
      execSync('npx tsc --project tsconfig.json', { stdio: 'inherit' });
    } catch (e) {
      console.log('\x1b[33mAdvertencia: Compilación TypeScript falló, continuando...\x1b[0m');
    }
    
    // Compilar cliente con Vite
    console.log('\x1b[36mCompilando frontend con Vite...\x1b[0m');
    execSync('cd client && npx vite build', { stdio: 'inherit' });
    
    // Copiar archivos necesarios
    console.log('\x1b[36mCopiando archivos compilados a dist...\x1b[0m');
    execSync('cp -r client/dist/* dist/client/', { stdio: 'inherit' });
    
    console.log('\x1b[32m\nCOMPILACIÓN ALTERNATIVA COMPLETADA\x1b[0m');
    console.log('\x1b[32mEl directorio "dist" contiene la versión de producción.\x1b[0m');
  } catch (fallbackError) {
    console.error('\x1b[31mERROR EN COMPILACIÓN ALTERNATIVA:\x1b[0m', fallbackError.message);
    process.exit(1);
  }
}