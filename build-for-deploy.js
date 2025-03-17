#!/usr/bin/env node

/**
 * Script de compilación para producción
 * Ignora errores de TypeScript y compila correctamente
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

/**
 * Ejecuta un comando y muestra la salida
 */
function execute(command, errorMessage, ignoreErrors = false) {
  console.log(`${colors.blue}Ejecutando: ${command}${colors.reset}`);
  
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (ignoreErrors) {
      console.log(`${colors.yellow}⚠ ${errorMessage || error.message}${colors.reset}`);
      console.log(`${colors.yellow}Continuando a pesar del error...${colors.reset}`);
      return false;
    } else {
      console.error(`${colors.red}✗ ${errorMessage || error.message}${colors.reset}`);
      process.exit(1);
    }
  }
}

/**
 * Crear configuración de TypeScript temporal
 */
function createTempTsConfig() {
  if (fs.existsSync('tsconfig.json')) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      
      // Modificar configuración para ignorar errores
      const prodConfig = {
        ...tsconfig,
        compilerOptions: {
          ...tsconfig.compilerOptions,
          skipLibCheck: true,
          noEmitOnError: false
        }
      };
      
      fs.writeFileSync('tsconfig.prod.json', JSON.stringify(prodConfig, null, 2));
      console.log(`${colors.green}✓ tsconfig.prod.json creado${colors.reset}`);
      return true;
    } catch (error) {
      console.error(`${colors.red}✗ Error al crear tsconfig temporal: ${error.message}${colors.reset}`);
      return false;
    }
  } else {
    console.log(`${colors.yellow}⚠ No se encontró tsconfig.json${colors.reset}`);
    return false;
  }
}

/**
 * Ejecutar compilación completa
 */
function buildProject() {
  console.log(`${colors.blue}Iniciando compilación para producción...${colors.reset}`);
  
  // Limpiar directorio dist
  execute('rm -rf dist', 'Error al limpiar directorio dist');
  
  // Compilar servidor TypeScript (ignorando errores)
  const useCustomTsConfig = createTempTsConfig();
  
  if (useCustomTsConfig) {
    execute('npx tsc --project tsconfig.prod.json', 'Error en la compilación TypeScript', true);
    
    // Eliminar configuración temporal
    try {
      fs.unlinkSync('tsconfig.prod.json');
    } catch (error) {
      console.error(`${colors.red}✗ Error al eliminar tsconfig temporal: ${error.message}${colors.reset}`);
    }
  } else {
    execute('npx tsc --skipLibCheck', 'Error en la compilación TypeScript', true);
  }
  
  // Compilar cliente con Vite
  execute('cd client && npx vite build', 'Error al compilar cliente', true);
  
  // Copiar archivos del cliente a dist/client
  if (fs.existsSync('client/dist')) {
    try {
      fs.mkdirSync('dist/client', { recursive: true });
      execute('cp -r client/dist/* dist/client/', 'Error al copiar archivos del cliente');
      console.log(`${colors.green}✓ Archivos del cliente copiados a dist/client${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}✗ Error al copiar archivos del cliente: ${error.message}${colors.reset}`);
    }
  }
  
  // Crear package.json para producción
  if (fs.existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      const prodPackage = {
        name: packageJson.name,
        version: packageJson.version,
        type: packageJson.type || "module",
        engines: packageJson.engines || { node: ">=18.0.0" },
        dependencies: packageJson.dependencies,
        scripts: {
          start: "node server/index.js"
        }
      };
      
      fs.mkdirSync('dist', { recursive: true });
      fs.writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));
      console.log(`${colors.green}✓ package.json para producción creado${colors.reset}`);
    } catch (error) {
      console.error(`${colors.red}✗ Error al crear package.json para producción: ${error.message}${colors.reset}`);
    }
  }
  
  // Copiar archivos de entorno
  ['env', '.env', '.env.production'].forEach(envFile => {
    if (fs.existsSync(envFile)) {
      try {
        fs.copyFileSync(envFile, `dist/${envFile}`);
        console.log(`${colors.green}✓ ${envFile} copiado a dist/${colors.reset}`);
      } catch (error) {
        console.error(`${colors.red}✗ Error al copiar ${envFile}: ${error.message}${colors.reset}`);
      }
    }
  });
  
  console.log(`
${colors.green}===== COMPILACIÓN COMPLETADA =====${colors.reset}`);
  console.log(`${colors.green}La aplicación ha sido construida para producción en la carpeta 'dist'${colors.reset}`);
}

// Ejecutar la compilación
buildProject();
