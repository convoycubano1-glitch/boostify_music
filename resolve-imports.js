/**
 * Script mejorado para resolver importaciones con alias @/
 * Este script implementa una solución directa creando enlaces simbólicos
 * para que los alias @/ funcionen correctamente en desarrollo y producción
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Obtener el directorio actual en módulos ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

// Verificar si estamos en un entorno de Replit
const isReplit = !!process.env.REPL_ID;
console.log(`${colors.blue}Ejecutando en entorno Replit: ${isReplit ? 'Sí' : 'No'}${colors.reset}`);

// Rutas importantes
const rootDir = path.resolve(__dirname);
const nodeModulesDir = path.resolve(rootDir, 'node_modules');
const clientSrcDir = path.resolve(rootDir, 'client', 'src');

// Crear enlaces simbólicos para resolver imports con @/
function createSymbolicLinks() {
  console.log(`${colors.green}Creando enlaces simbólicos para resolver importaciones con @/...${colors.reset}`);
  
  try {
    // 1. Crear directorio @/ en node_modules si no existe
    const atDir = path.resolve(nodeModulesDir, '@');
    if (!fs.existsSync(atDir)) {
      fs.mkdirSync(atDir, { recursive: true });
      console.log(`${colors.green}Creado directorio: ${atDir}${colors.reset}`);
    }
    
    // 2. Crear enlace simbólico de client/src a node_modules/@/
    const targetDir = path.resolve(atDir, 'components');
    if (fs.existsSync(targetDir)) {
      console.log(`${colors.yellow}Enlace ya existe: ${targetDir}${colors.reset}`);
    } else {
      // En sistemas Unix/Linux/MacOS
      try {
        // Crear enlace para cada subdirectorio importante
        const directories = ['components', 'lib', 'hooks', 'pages', 'utils', 'context', 'services', 'store', 'styles', 'images'];
        
        for (const dir of directories) {
          const sourceDir = path.resolve(clientSrcDir, dir);
          const targetDir = path.resolve(atDir, dir);
          
          if (!fs.existsSync(sourceDir)) {
            console.log(`${colors.yellow}Directorio fuente no existe, creando: ${sourceDir}${colors.reset}`);
            fs.mkdirSync(sourceDir, { recursive: true });
          }
          
          if (!fs.existsSync(targetDir)) {
            if (isReplit) {
              // En Replit, crear enlaces simbólicos con el comando ln
              execSync(`ln -sf ${sourceDir} ${targetDir}`);
            } else {
              // En otros sistemas, usar fs.symlinkSync
              fs.symlinkSync(sourceDir, targetDir, 'junction');
            }
            console.log(`${colors.green}Enlace creado: ${sourceDir} -> ${targetDir}${colors.reset}`);
          }
        }
      } catch (error) {
        console.error(`${colors.red}Error al crear enlaces simbólicos:${colors.reset} ${error.message}`);
        console.log(`${colors.yellow}Intentando enfoque alternativo...${colors.reset}`);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error global en createSymbolicLinks:${colors.reset} ${error.message}`);
    return false;
  }
}

// Crear alias en jsconfig.json y tsconfig.json
function updateConfigFiles() {
  console.log(`${colors.green}Verificando archivos de configuración...${colors.reset}`);
  
  try {
    // Crear o actualizar client/jsconfig.json
    const jsconfigPath = path.resolve(rootDir, 'client', 'jsconfig.json');
    const jsconfig = {
      "compilerOptions": {
        "baseUrl": ".",
        "paths": {
          "@/*": ["src/*"]
        }
      },
      "include": ["src/**/*"]
    };
    
    fs.writeFileSync(jsconfigPath, JSON.stringify(jsconfig, null, 2), 'utf8');
    console.log(`${colors.green}Actualizado: ${jsconfigPath}${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error al actualizar archivos de configuración:${colors.reset} ${error.message}`);
    return false;
  }
}

// Crear un archivo de resolución de alias para el entorno de producción
function createAliasResolver() {
  console.log(`${colors.green}Creando archivo de resolución de alias...${colors.reset}`);
  
  try {
    const resolverPath = path.resolve(rootDir, 'alias-resolver.js');
    const content = `/**
 * Resolución de alias @/ para entorno de producción
 * Este módulo crea un mapa de resolución para importaciones con @/
 */

const path = require('path');
const fs = require('fs');

// Directorio raíz del proyecto
const rootDir = path.resolve(__dirname);
const srcDir = path.resolve(rootDir, 'client', 'src');

// Mapa de alias a rutas reales
const aliasMap = {
  '@/components': path.resolve(srcDir, 'components'),
  '@/lib': path.resolve(srcDir, 'lib'),
  '@/hooks': path.resolve(srcDir, 'hooks'),
  '@/pages': path.resolve(srcDir, 'pages'),
  '@/utils': path.resolve(srcDir, 'utils'),
  '@/context': path.resolve(srcDir, 'context'),
  '@/services': path.resolve(srcDir, 'services'),
  '@/store': path.resolve(srcDir, 'store'),
  '@/styles': path.resolve(srcDir, 'styles'),
  '@/images': path.resolve(srcDir, 'images'),
  '@': srcDir
};

/**
 * Resuelve una ruta con alias a su ruta real
 * @param {string} aliasPath - Ruta con alias
 * @returns {string|null} - Ruta real o null si no se puede resolver
 */
function resolveAliasPath(aliasPath) {
  // Encontrar el alias más largo que coincida
  const matchingAliases = Object.keys(aliasMap)
    .filter(alias => aliasPath.startsWith(alias))
    .sort((a, b) => b.length - a.length);
  
  if (matchingAliases.length > 0) {
    const alias = matchingAliases[0];
    const relativePath = aliasPath.slice(alias.length);
    const resolvedPath = path.join(aliasMap[alias], relativePath);
    
    // Verificar que la ruta existe
    if (fs.existsSync(resolvedPath)) {
      return resolvedPath;
    }
  }
  
  return null;
}

module.exports = {
  aliasMap,
  resolveAliasPath
};`;
    
    fs.writeFileSync(resolverPath, content, 'utf8');
    console.log(`${colors.green}Creado: ${resolverPath}${colors.reset}`);
    
    return true;
  } catch (error) {
    console.error(`${colors.red}Error al crear archivo de resolución:${colors.reset} ${error.message}`);
    return false;
  }
}

// Función principal
async function main() {
  console.log(`${colors.cyan}=== Resolución de importaciones con alias @/ ===${colors.reset}`);
  
  const symlinksOk = createSymbolicLinks();
  const configOk = updateConfigFiles();
  const resolverOk = createAliasResolver();
  
  if (symlinksOk && configOk && resolverOk) {
    console.log(`\n${colors.green}✓ Configuración completa.${colors.reset}`);
    console.log(`${colors.cyan}Las importaciones con @/ deberían funcionar ahora.${colors.reset}`);
    
    // Instrucciones adicionales
    console.log(`\n${colors.yellow}Para asegurar que esto funcione:${colors.reset}`);
    console.log(`1. Reinicia el servidor de desarrollo`);
    console.log(`2. Si estás construyendo para producción, usa el script build-optimizado.js`);
    
    return 0;
  } else {
    console.log(`\n${colors.red}× Hubo errores en la configuración.${colors.reset}`);
    console.log(`${colors.yellow}Algunas partes pueden funcionar, pero otras pueden fallar.${colors.reset}`);
    
    return 1;
  }
}

// Ejecutar la función principal
main().then(code => {
  process.exit(code);
}).catch(error => {
  console.error(`${colors.red}Error crítico:${colors.reset} ${error.message}`);
  process.exit(1);
});