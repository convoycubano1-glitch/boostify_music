#!/usr/bin/env node

/**
 * Script optimizado para el despliegue en Replit Deployments
 * Este script inicia la aplicación en modo desarrollo pero en un entorno de producción
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

// Establecer variables de entorno críticas
process.env.NODE_ENV = 'development';
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.PORT = process.env.PORT || '3000';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Función principal que ejecuta el servidor
 */
async function main() {
  console.log('🚀 Iniciando Boostify Music en modo despliegue...');
  console.log(`🔧 Entorno: ${process.env.NODE_ENV}`);
  console.log(`🔌 Puerto: ${process.env.PORT}`);

  // Si existen archivos compilados en dist, usarlos
  if (fs.existsSync(path.join(__dirname, 'dist', 'server', 'index.js'))) {
    console.log('✅ Usando archivos compilados en dist/');
    runServer('node', ['dist/server/index.js']);
    return;
  }

  // Verificar dependencias disponibles
  try {
    await checkOrInstall('tsx');
    console.log('✅ Ejecutando con tsx (recomendado)');
    runServer('tsx', ['server/index.ts']);
  } catch (error) {
    try {
      await checkOrInstall('ts-node');
      console.log('✅ Ejecutando con ts-node');
      runServer('ts-node', ['--transpile-only', 'server/index.ts']);
    } catch (err) {
      console.error('❌ No se encontraron herramientas para ejecutar TypeScript');
      console.log('⚠️ Intentando instalar tsx como último recurso...');
      
      try {
        const install = spawn('npm', ['install', '--no-save', 'tsx@latest'], {
          stdio: 'inherit'
        });
        
        await new Promise((resolve, reject) => {
          install.on('close', (code) => {
            if (code === 0) resolve();
            else reject(new Error(`Instalación fallida con código ${code}`));
          });
        });
        
        console.log('✅ TSX instalado con éxito, iniciando servidor...');
        runServer('npx', ['tsx', 'server/index.ts']);
      } catch (installError) {
        console.error('❌ Error crítico: No se pudo instalar tsx', installError);
        process.exit(1);
      }
    }
  }
}

/**
 * Verifica si una herramienta está disponible o la instala
 */
async function checkOrInstall(tool) {
  return new Promise((resolve, reject) => {
    const check = spawn('which', [tool]);
    let found = false;
    
    check.stdout.on('data', () => {
      found = true;
    });
    
    check.on('close', (code) => {
      if (found) {
        resolve(true);
      } else {
        reject(new Error(`Herramienta ${tool} no encontrada`));
      }
    });
  });
}

/**
 * Ejecuta el servidor con los comandos especificados
 */
function runServer(command, args) {
  console.log(`🔄 Ejecutando: ${command} ${args.join(' ')}`);
  
  const server = spawn(command, args, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      SKIP_PREFLIGHT_CHECK: 'true',
      TS_NODE_TRANSPILE_ONLY: 'true'
    }
  });
  
  server.on('error', (err) => {
    console.error('❌ Error al iniciar el servidor:', err);
    process.exit(1);
  });
  
  server.on('close', (code) => {
    if (code !== 0) {
      console.error(`❌ El servidor se cerró con código de error: ${code}`);
      process.exit(code);
    }
  });
}

// Iniciar el servidor
main().catch(err => {
  console.error('❌ Error crítico:', err);
  process.exit(1);
});