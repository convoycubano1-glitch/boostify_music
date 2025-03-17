/**
 * Script de validación pre-producción para Boostify Music
 * Este script verifica que la aplicación esté lista para ser desplegada a producción
 * detectando problemas comunes de seguridad, rendimiento y configuración.
 */

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

console.log('\x1b[36m%s\x1b[0m', '======================================');
console.log('\x1b[36m%s\x1b[0m', '    VERIFICACIÓN PRE-PRODUCCIÓN    ');
console.log('\x1b[36m%s\x1b[0m', '======================================');

// Contadores para el resumen final
let errores = 0;
let advertencias = 0;
let sugerencias = 0;

/**
 * Muestra un mensaje de error en la consola
 * @param {string} mensaje - El mensaje de error
 */
function mostrarError(mensaje) {
  console.log('\x1b[31m%s\x1b[0m', `❌ ERROR: ${mensaje}`);
  errores++;
}

/**
 * Muestra un mensaje de advertencia en la consola
 * @param {string} mensaje - El mensaje de advertencia
 */
function mostrarAdvertencia(mensaje) {
  console.log('\x1b[33m%s\x1b[0m', `⚠️ ADVERTENCIA: ${mensaje}`);
  advertencias++;
}

/**
 * Muestra una sugerencia en la consola
 * @param {string} mensaje - El mensaje de sugerencia
 */
function mostrarSugerencia(mensaje) {
  console.log('\x1b[32m%s\x1b[0m', `💡 SUGERENCIA: ${mensaje}`);
  sugerencias++;
}

/**
 * Verifica las variables de entorno necesarias
 */
function verificarVariablesEntorno() {
  console.log('\n\x1b[36m%s\x1b[0m', '📋 Verificando variables de entorno...');
  
  const variablesRequeridas = [
    'OPENAI_API_KEY',
    'FAL_API_KEY'
  ];
  
  const variablesOpcionales = [
    'FIREBASE_API_KEY',
    'FIREBASE_AUTH_DOMAIN',
    'FIREBASE_PROJECT_ID',
    'FIREBASE_STORAGE_BUCKET',
    'FIREBASE_MESSAGING_SENDER_ID',
    'FIREBASE_APP_ID',
    'ELEVENLABS_API_KEY'
  ];
  
  for (const variable of variablesRequeridas) {
    if (!process.env[variable]) {
      mostrarError(`La variable de entorno ${variable} no está definida`);
    } else {
      console.log(`✅ Variable ${variable} configurada correctamente`);
    }
  }
  
  for (const variable of variablesOpcionales) {
    if (!process.env[variable]) {
      mostrarAdvertencia(`La variable de entorno opcional ${variable} no está definida`);
    } else {
      console.log(`✅ Variable opcional ${variable} configurada`);
    }
  }
}

/**
 * Verifica la exposición de credenciales en archivos frontend
 */
function verificarCredencialesExpuestas() {
  console.log('\n\x1b[36m%s\x1b[0m', '🔒 Verificando exposición de credenciales...');
  
  const archivosARevisar = [
    './src/main.tsx',
    './src/App.tsx',
    './src/firebase.ts',
    './vite.config.ts'
  ];
  
  const patronesCredenciales = [
    /apiKey\s*:\s*["']([^"']+)["']/g,
    /authDomain\s*:\s*["']([^"']+)["']/g,
    /API_KEY\s*=\s*["']([^"']+)["']/g,
    /apiKey\s*=\s*["']([^"']+)["']/g,
    /secret\s*=\s*["']([^"']+)["']/g,
    /password\s*=\s*["']([^"']+)["']/g
  ];
  
  for (const archivo of archivosARevisar) {
    try {
      if (fs.existsSync(archivo)) {
        const contenido = fs.readFileSync(archivo, 'utf8');
        
        for (const patron of patronesCredenciales) {
          const coincidencias = contenido.match(patron);
          if (coincidencias) {
            mostrarError(`Se encontraron posibles credenciales expuestas en ${archivo}`);
            break;
          }
        }
      }
    } catch (error) {
      mostrarAdvertencia(`No se pudo verificar el archivo ${archivo}: ${error.message}`);
    }
  }
  
  // Verificar específicamente import.meta.env en archivos frontend
  try {
    const archivosConEnv = [];
    const buscarEnvEnArchivos = (directorio) => {
      const archivos = fs.readdirSync(directorio, { withFileTypes: true });
      
      for (const archivo of archivos) {
        const rutaCompleta = path.join(directorio, archivo.name);
        
        if (archivo.isDirectory() && !archivo.name.startsWith('node_modules') && !archivo.name.startsWith('dist')) {
          buscarEnvEnArchivos(rutaCompleta);
        } else if (archivo.name.endsWith('.tsx') || archivo.name.endsWith('.ts') || archivo.name.endsWith('.jsx') || archivo.name.endsWith('.js')) {
          try {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            if (contenido.includes('import.meta.env.') && (contenido.includes('FAL_API_KEY') || contenido.includes('OPENAI_API_KEY'))) {
              archivosConEnv.push(rutaCompleta);
            }
          } catch (err) {
            // Ignorar errores de lectura de archivos
          }
        }
      }
    };
    
    buscarEnvEnArchivos('./src');
    
    if (archivosConEnv.length > 0) {
      mostrarAdvertencia(`Se encontraron ${archivosConEnv.length} archivos con referencias directas a APIs en el frontend`);
      mostrarSugerencia('Considere mover todas las llamadas a APIs sensibles al backend para evitar exponer credenciales');
      for (const archivo of archivosConEnv) {
        console.log(`   - ${archivo}`);
      }
    }
  } catch (error) {
    mostrarAdvertencia(`No se pudo verificar referencias a import.meta.env: ${error.message}`);
  }
}

/**
 * Verifica la configuración de build y optimizaciones
 */
function verificarConfiguracionBuild() {
  console.log('\n\x1b[36m%s\x1b[0m', '🔧 Verificando configuración de build...');
  
  // Verificar vite.config.ts
  try {
    if (fs.existsSync('./vite.config.ts')) {
      const contenido = fs.readFileSync('./vite.config.ts', 'utf8');
      
      if (!contenido.includes('build') || !contenido.includes('rollupOptions')) {
        mostrarAdvertencia('No se encontró configuración de optimización de build en vite.config.ts');
        mostrarSugerencia('Considere configurar rollupOptions para optimizar el tamaño del bundle');
      }
      
      if (!contenido.includes('minify')) {
        mostrarSugerencia('Considere habilitar la minificación en vite.config.ts para reducir el tamaño del bundle');
      }
    }
  } catch (error) {
    mostrarAdvertencia(`No se pudo verificar vite.config.ts: ${error.message}`);
  }
  
  // Verificar que exista un archivo optimizado de build
  const scriptsBuild = [
    './build-for-production.js',
    './build-production.js',
    './build-for-replit.js',
    './build-optimized.js'
  ];
  
  let encontradoScriptBuild = false;
  
  for (const script of scriptsBuild) {
    if (fs.existsSync(script)) {
      encontradoScriptBuild = true;
      console.log(`✅ Script de build encontrado: ${script}`);
      break;
    }
  }
  
  if (!encontradoScriptBuild) {
    mostrarAdvertencia('No se encontró un script de build optimizado');
  }
}

/**
 * Verifica la configuración de seguridad
 */
function verificarConfiguracionSeguridad() {
  console.log('\n\x1b[36m%s\x1b[0m', '🔐 Verificando configuración de seguridad...');
  
  // Verificar configuración de CORS
  try {
    if (fs.existsSync('./server/index.ts')) {
      const contenido = fs.readFileSync('./server/index.ts', 'utf8');
      
      if (!contenido.includes('cors') || !contenido.includes('origin')) {
        mostrarAdvertencia('No se encontró configuración adecuada de CORS');
        mostrarSugerencia('Configure CORS con lista blanca de dominios para evitar vulnerabilidades');
      } else {
        console.log('✅ Configuración de CORS encontrada');
      }
      
      // Verificar headers de seguridad
      const headersSeguridad = [
        'helmet',
        'X-Content-Type-Options',
        'X-Frame-Options',
        'X-XSS-Protection'
      ];
      
      let encontradoHeadersSeguridad = false;
      
      for (const header of headersSeguridad) {
        if (contenido.includes(header)) {
          encontradoHeadersSeguridad = true;
          break;
        }
      }
      
      if (!encontradoHeadersSeguridad) {
        mostrarSugerencia('Considere añadir headers de seguridad usando helmet.js');
      } else {
        console.log('✅ Headers de seguridad configurados');
      }
    }
  } catch (error) {
    mostrarAdvertencia(`No se pudo verificar server/index.ts: ${error.message}`);
  }
}

/**
 * Verifica las optimizaciones de rendimiento
 */
function verificarOptimizacionesRendimiento() {
  console.log('\n\x1b[36m%s\x1b[0m', '⚡ Verificando optimizaciones de rendimiento...');
  
  // Verificar code splitting en vite.config.ts
  try {
    if (fs.existsSync('./vite.config.ts')) {
      const contenido = fs.readFileSync('./vite.config.ts', 'utf8');
      
      if (!contenido.includes('manualChunks')) {
        mostrarSugerencia('Considere configurar manualChunks para implementar code splitting efectivo');
      } else {
        console.log('✅ Code splitting configurado');
      }
    }
  } catch (error) {
    mostrarAdvertencia(`No se pudo verificar vite.config.ts: ${error.message}`);
  }
  
  // Verificar que no haya import * as React en los archivos
  try {
    const archivosConImportStar = [];
    const buscarImportStarEnArchivos = (directorio) => {
      const archivos = fs.readdirSync(directorio, { withFileTypes: true });
      
      for (const archivo of archivos) {
        const rutaCompleta = path.join(directorio, archivo.name);
        
        if (archivo.isDirectory() && !archivo.name.startsWith('node_modules') && !archivo.name.startsWith('dist')) {
          buscarImportStarEnArchivos(rutaCompleta);
        } else if (archivo.name.endsWith('.tsx') || archivo.name.endsWith('.jsx')) {
          try {
            const contenido = fs.readFileSync(rutaCompleta, 'utf8');
            if (contenido.includes('import * as React from')) {
              archivosConImportStar.push(rutaCompleta);
            }
          } catch (err) {
            // Ignorar errores de lectura de archivos
          }
        }
      }
    };
    
    buscarImportStarEnArchivos('./src');
    
    if (archivosConImportStar.length > 0) {
      mostrarSugerencia(`Se encontraron ${archivosConImportStar.length} archivos con 'import * as React'. Considere usar 'import React from "react"' para tree-shaking.`);
    } else {
      console.log('✅ Imports de React optimizados para tree-shaking');
    }
  } catch (error) {
    mostrarAdvertencia(`No se pudo verificar imports de React: ${error.message}`);
  }
}

// Ejecutar todas las verificaciones
verificarVariablesEntorno();
verificarCredencialesExpuestas();
verificarConfiguracionBuild();
verificarConfiguracionSeguridad();
verificarOptimizacionesRendimiento();

// Mostrar resumen final
console.log('\n\x1b[36m%s\x1b[0m', '======================================');
console.log('\x1b[36m%s\x1b[0m', '    RESUMEN DE VERIFICACIÓN    ');
console.log('\x1b[36m%s\x1b[0m', '======================================');
console.log('\x1b[31m%s\x1b[0m', `Errores: ${errores}`);
console.log('\x1b[33m%s\x1b[0m', `Advertencias: ${advertencias}`);
console.log('\x1b[32m%s\x1b[0m', `Sugerencias: ${sugerencias}`);

if (errores > 0) {
  console.log('\n\x1b[31m%s\x1b[0m', '⛔ RESULTADO: La aplicación no está lista para producción. Corrija los errores antes de continuar.');
  process.exit(1);
} else if (advertencias > 0) {
  console.log('\n\x1b[33m%s\x1b[0m', '⚠️ RESULTADO: La aplicación puede desplegarse a producción, pero revise las advertencias.');
  process.exit(0);
} else {
  console.log('\n\x1b[32m%s\x1b[0m', '✅ RESULTADO: La aplicación está lista para ser desplegada a producción.');
  process.exit(0);
}