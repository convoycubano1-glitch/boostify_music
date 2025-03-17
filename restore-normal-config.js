/**
 * Script para restaurar la configuración original del proyecto
 * Elimina los archivos de construcción personalizados y restaura los parámetros originales
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

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

console.log(`${colors.magenta}=== RESTAURANDO CONFIGURACIÓN ORIGINAL ===\n${colors.reset}`);

// Lista de archivos de construcción personalizados que podrían eliminarse
// Solo se eliminarán si existen y no son archivos esenciales
const customBuildFiles = [
  'dist',
  'secure-production-build.js',
  'minimal-build.js',
  'verify-production-build.js',
  'build-production-fixed.js',
  'build-production-optimized.js',
  'build-optimizado.js',
  'build-and-run.sh',
  'start-fixed.js',
  'start-optimized.js',
  'start-alias-fixed.js',
  'start-fixed-symlink.js',
  'start-for-replit.js',
  'start-simple.js',
  'simple-server.js',
  'simplified-build.js',
  'build-simple.js'
];

// Archivos esenciales que no deben eliminarse
const essentialFiles = [
  'package.json',
  'package-lock.json',
  'node_modules',
  'server',
  'client',
  'vite.config.ts',
  'tsconfig.json',
  '.env',
  '.env.example',
  '.gitignore'
];

// Verificar y limpiar archivos de construcción personalizados
console.log(`${colors.yellow}Eliminando archivos de construcción personalizados...${colors.reset}`);

let filesRemoved = 0;
for (const file of customBuildFiles) {
  if (fs.existsSync(file) && !essentialFiles.includes(file)) {
    try {
      if (fs.lstatSync(file).isDirectory()) {
        // Si es un directorio y no es esencial, lo eliminamos recursivamente
        fs.rmSync(file, { recursive: true, force: true });
      } else {
        // Si es un archivo, simplemente lo eliminamos
        fs.unlinkSync(file);
      }
      console.log(`${colors.green}✓ Eliminado: ${file}${colors.reset}`);
      filesRemoved++;
    } catch (error) {
      console.error(`${colors.red}✗ Error al eliminar ${file}: ${error.message}${colors.reset}`);
    }
  }
}

console.log(`${colors.green}Se eliminaron ${filesRemoved} archivos/directorios personalizados.${colors.reset}\n`);

// Verificar scripts en package.json
try {
  console.log(`${colors.yellow}Verificando scripts en package.json...${colors.reset}`);
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  // Verificar que los scripts esenciales estén presentes
  const essentialScripts = ['dev', 'build', 'start', 'server:dev', 'client:dev'];
  const missingScripts = [];
  
  for (const script of essentialScripts) {
    if (!packageJson.scripts || !packageJson.scripts[script]) {
      missingScripts.push(script);
    }
  }
  
  if (missingScripts.length > 0) {
    console.log(`${colors.yellow}Falta(n) ${missingScripts.length} script(s) esencial(es): ${missingScripts.join(', ')}${colors.reset}`);
    console.log(`${colors.yellow}Restaurando scripts esenciales...${colors.reset}`);
    
    // Crear los scripts que faltan
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    
    if (!packageJson.scripts.dev) {
      packageJson.scripts.dev = "concurrently \"npm run server:dev\" \"npm run client:dev\"";
    }
    
    if (!packageJson.scripts.build) {
      packageJson.scripts.build = "tsc && cd client && vite build";
    }
    
    if (!packageJson.scripts.start) {
      packageJson.scripts.start = "node dist/server/index.js";
    }
    
    if (!packageJson.scripts['server:dev']) {
      packageJson.scripts['server:dev'] = "nodemon --exec \"ts-node --project tsconfig.json server/index.ts\" --watch server";
    }
    
    if (!packageJson.scripts['client:dev']) {
      packageJson.scripts['client:dev'] = "cd client && vite";
    }
    
    // Guardar package.json actualizado
    fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
    console.log(`${colors.green}✓ Scripts esenciales restaurados en package.json${colors.reset}`);
  } else {
    console.log(`${colors.green}✓ Todos los scripts esenciales están presentes en package.json${colors.reset}`);
  }
} catch (error) {
  console.error(`${colors.red}✗ Error al verificar/actualizar package.json: ${error.message}${colors.reset}`);
}

// Verificar que el entorno de desarrollo esté configurado correctamente
console.log(`\n${colors.yellow}Verificando entorno de desarrollo...${colors.reset}`);

// Verificar node_modules
if (!fs.existsSync('node_modules')) {
  console.log(`${colors.yellow}node_modules no encontrado. Ejecuta 'npm install' para instalarlo.${colors.reset}`);
} else {
  console.log(`${colors.green}✓ node_modules encontrado${colors.reset}`);
}

// Verificar cliente
if (!fs.existsSync('client')) {
  console.log(`${colors.red}✗ El directorio 'client' no existe. La aplicación puede estar corrupta.${colors.reset}`);
} else {
  console.log(`${colors.green}✓ Directorio client encontrado${colors.reset}`);
}

// Verificar servidor
if (!fs.existsSync('server')) {
  console.log(`${colors.red}✗ El directorio 'server' no existe. La aplicación puede estar corrupta.${colors.reset}`);
} else {
  console.log(`${colors.green}✓ Directorio server encontrado${colors.reset}`);
}

// Verificar configuración de typescript
if (!fs.existsSync('tsconfig.json')) {
  console.log(`${colors.red}✗ No se encontró tsconfig.json. La aplicación puede estar corrupta.${colors.reset}`);
} else {
  console.log(`${colors.green}✓ tsconfig.json encontrado${colors.reset}`);
}

// Actualizar el workflow
console.log(`\n${colors.yellow}Actualizando configuración del workflow...${colors.reset}`);

// Verificar que el directorio .replit existe
if (!fs.existsSync('.replit')) {
  console.log(`${colors.yellow}No se encontró archivo .replit. Se creará uno nuevo.${colors.reset}`);
  
  const replitConfig = `run = "npm run dev"
hidden = [".config", "package-lock.json"]

[nix]
channel = "stable-23_11"

[deployment]
run = ["sh", "-c", "npm run start"]
deploymentTarget = "cloudrun"

[auth]
pageEnabled = false
buttonEnabled = false`;

  fs.writeFileSync('.replit', replitConfig);
  console.log(`${colors.green}✓ Archivo .replit creado${colors.reset}`);
} else {
  console.log(`${colors.green}✓ Archivo .replit encontrado${colors.reset}`);
  
  // Actualizar el archivo .replit para usar npm run dev
  try {
    let replitConfig = fs.readFileSync('.replit', 'utf8');
    replitConfig = replitConfig.replace(/run = ".*"/g, 'run = "npm run dev"');
    fs.writeFileSync('.replit', replitConfig);
    console.log(`${colors.green}✓ Configuración de workflow actualizada a npm run dev${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}✗ Error al actualizar archivo .replit: ${error.message}${colors.reset}`);
  }
}

console.log(`\n${colors.green}=== RESTAURACIÓN COMPLETA ===\n${colors.reset}`);
console.log(`${colors.magenta}Para iniciar la aplicación en modo normal, ejecuta:${colors.reset}`);
console.log(`${colors.cyan}npm run dev\n${colors.reset}`);
console.log(`${colors.magenta}Para construir la aplicación para producción, ejecuta:${colors.reset}`);
console.log(`${colors.cyan}npm run build\n${colors.reset}`);
console.log(`${colors.magenta}Para iniciar la aplicación en modo producción, ejecuta:${colors.reset}`);
console.log(`${colors.cyan}npm run start\n${colors.reset}`);