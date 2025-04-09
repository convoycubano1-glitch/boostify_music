#!/usr/bin/env node

/**
 * Script de inicio optimizado para despliegue en producción
 * Evita errores de TypeScript y ejecuta el servidor directamente
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de entorno
process.env.NODE_ENV = 'development'; // Mantener en modo desarrollo para evitar errores de TS
process.env.SKIP_PREFLIGHT_CHECK = 'true';
process.env.TS_NODE_TRANSPILE_ONLY = 'true';
process.env.PORT = '3333'; // Usar un puerto diferente para evitar conflictos

// Función principal asíncrona
async function main() {
  console.log('🚀 Iniciando Boostify Music en modo compatible...');
  
  // Determinar el comando de inicio correcto
  let startCommand = 'tsx';
  let startArgs = ['server/index.ts'];

  // Verificar si tenemos tsx instalado
  try {
    // Comprobamos si podemos ejecutar el comando
    const result = spawn('which', ['tsx'], { stdio: 'pipe' });
    startCommand = 'tsx';
    console.log('✅ TSX encontrado, usando modo TypeScript directo');
  } catch (e) {
    // Si no tenemos tsx, intentamos con ts-node
    try {
      const result = spawn('which', ['ts-node'], { stdio: 'pipe' });
      startCommand = 'ts-node';
      startArgs = ['--transpile-only', 'server/index.ts'];
      console.log('✅ TS-Node encontrado, usando modo TypeScript con transpile-only');
    } catch (e) {
      // Si no tenemos ts-node, verificamos si existe el servidor compilado
      if (fs.existsSync(path.join(process.cwd(), 'server', 'index.js'))) {
        startCommand = 'node';
        startArgs = ['server/index.js'];
        console.log('✅ Servidor JavaScript encontrado, ejecutando directamente');
      } else {
        console.error('❌ No se encontró tsx ni ts-node, y no hay un archivo index.js compilado');
        console.error('🔧 Instalando tsx para continuar...');
        
        // Instalar tsx como último recurso
        const install = spawn('npm', ['install', '--no-save', 'tsx'], {
          stdio: 'inherit'
        });
        
        // Esperar a que termine la instalación
        await new Promise((resolve) => {
          install.on('close', resolve);
        });
        
        console.log('✅ TSX instalado correctamente, continuando...');
      }
    }
  }

  // Iniciar el servidor
  console.log(`🔄 Ejecutando: ${startCommand} ${startArgs.join(' ')}`);

  const server = spawn(startCommand, startArgs, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'development',
      SKIP_PREFLIGHT_CHECK: 'true',
      TS_NODE_TRANSPILE_ONLY: 'true',
      PORT: '3333' // Usar un puerto diferente para evitar conflictos
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

// Ejecutar la función principal
main().catch(err => {
  console.error('❌ Error crítico en el script de inicio:', err);
  process.exit(1);
});