#!/usr/bin/env node

/**
 * Script para corregir problemas de importación en archivos de navegador
 * 
 * Este script toma un enfoque más agresivo para corregir problemas de rutas
 * en archivos JavaScript/TypeScript de React y Vite que impiden la correcta 
 * renderización en el navegador.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Para que __dirname funcione en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directorios a procesar
const DIRS_TO_PROCESS = [
  './client/src',
  './src'
];

// Extensiones de archivos a procesar
const FILE_EXTENSIONS = ['.js', '.jsx', '.ts', '.tsx'];

// Patrones problemáticos y sus reemplazos
const IMPORT_PATTERNS = [
  {
    // Rutas que comienzan con @/ pero no están dentro de comillas
    pattern: /import\s+(?:(?:\w+(?:\s*,\s*\{\s*[\w\s,]+\s*\})?)|(?:\{\s*[\w\s,]+\s*\})|(?:\*\s+as\s+\w+))\s+from\s+@\//g,
    replacement: (match) => match.replace(/from\s+@\//g, 'from "@/')
  },
  {
    // Rutas que comienzan con @/ pero no terminan con comillas
    pattern: /from\s+"@\/([^"]*)(?!")/g,
    replacement: 'from "@/$1"'
  },
  {
    // Rutas '@/' a './../'
    pattern: /from\s+["']@\/(.*?)["']/g,
    replacement: (match, p1) => {
      // Determina cuántos niveles debe retroceder
      const relativePath = getRelativePath(p1);
      return `from "${relativePath}"`;
    }
  },
  {
    // Importaciones dinámicas con @/
    pattern: /import\(\s*["']@\/(.*?)["']\s*\)/g,
    replacement: (match, p1) => {
      // Determina cuántos niveles debe retroceder
      const relativePath = getRelativePath(p1);
      return `import("${relativePath}")`;
    }
  },
  {
    // Convierte rutas de componentes específicos @/components
    pattern: /["']@\/components\/(.*?)["']/g,
    replacement: (match, p1) => {
      return `"../components/${p1}"`;
    }
  },
  {
    // Convierte rutas de lib específicos @/lib
    pattern: /["']@\/lib\/(.*?)["']/g,
    replacement: (match, p1) => {
      return `"../lib/${p1}"`;
    }
  },
  {
    // Corrección específica para Firebase
    pattern: /["']@\/firebase["']/g,
    replacement: '"../firebase"'
  },
  {
    // Corrección específica para theme.json
    pattern: /["']@\/theme.json["']/g,
    replacement: '"../theme.json"'
  }
];

// Función auxiliar para obtener ruta relativa
function getRelativePath(targetPath) {
  // Simplemente devolvemos una ruta relativa básica
  return `../${targetPath}`;
}

// Función para verificar si un archivo debe procesarse
function shouldProcessFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return FILE_EXTENSIONS.includes(ext);
}

// Función para procesar un archivo
function processFile(filePath) {
  console.log(`Procesando archivo: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // Aplicar cada patrón
  IMPORT_PATTERNS.forEach(({ pattern, replacement }) => {
    const newContent = content.replace(pattern, replacement);
    if (newContent !== content) {
      content = newContent;
      changed = true;
    }
  });

  // Guardar el archivo solo si hubo cambios
  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`  ✅ Archivo corregido: ${filePath}`);
    return true;
  }
  
  return false;
}

// Función para encontrar archivos de forma recursiva
function findFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat && stat.isDirectory()) {
      // Recursivamente buscar en subdirectorios
      if (file !== 'node_modules') { // Ignorar node_modules
        results = results.concat(findFiles(filePath));
      }
    } else {
      if (shouldProcessFile(filePath)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

// Función principal para corregir los archivos
function fixImports() {
  let totalFixed = 0;
  let totalScanned = 0;
  
  DIRS_TO_PROCESS.forEach(dir => {
    if (fs.existsSync(dir)) {
      console.log(`\nBuscando archivos en: ${dir}`);
      const files = findFiles(dir);
      totalScanned += files.length;
      
      files.forEach(file => {
        if (processFile(file)) {
          totalFixed++;
        }
      });
    } else {
      console.log(`⚠️ Directorio no encontrado: ${dir}`);
    }
  });
  
  console.log(`\n🔍 Archivos escaneados: ${totalScanned}`);
  console.log(`🔧 Archivos corregidos: ${totalFixed}`);
}

// Crear enlaces simbólicos en el directorio node_modules
function setupSymlinks() {
  try {
    console.log('\nConfigurando enlaces simbólicos...');
    
    // Crear directorio @/ en node_modules si no existe
    if (!fs.existsSync('./node_modules/@')) {
      fs.mkdirSync('./node_modules/@', { recursive: true });
    }
    
    // Crear enlaces para directorios clave
    const clientSrc = path.resolve('./client/src');
    const nodeModulesPath = path.resolve('./node_modules/@');
    
    if (fs.existsSync(clientSrc)) {
      // Verificar si ya existe el enlace
      if (!fs.existsSync(path.join(nodeModulesPath, 'components'))) {
        fs.symlinkSync(path.join(clientSrc, 'components'), path.join(nodeModulesPath, 'components'), 'junction');
      }
      
      if (!fs.existsSync(path.join(nodeModulesPath, 'lib'))) {
        fs.symlinkSync(path.join(clientSrc, 'lib'), path.join(nodeModulesPath, 'lib'), 'junction');
      }
      
      if (!fs.existsSync(path.join(nodeModulesPath, 'firebase.ts')) && fs.existsSync(path.join(clientSrc, 'firebase.ts'))) {
        fs.symlinkSync(path.join(clientSrc, 'firebase.ts'), path.join(nodeModulesPath, 'firebase.ts'), 'file');
      }
      
      console.log('✅ Enlaces simbólicos configurados correctamente.');
    } else {
      console.log('⚠️ No se pudo configurar enlaces simbólicos: directorio client/src no encontrado.');
    }
  } catch (error) {
    console.error('❌ Error al configurar enlaces simbólicos:', error.message);
  }
}

// Crear un archivo de resolución para Vite
function createViteResolver() {
  try {
    console.log('\nCreando archivo de resolución para Vite...');
    
    const resolverContent = `
/**
 * Archivo de ayuda para resolver alias @/ en importaciones
 * Esto es utilizado por Vite durante el desarrollo
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Resolver alias @/ a la ruta adecuada
 */
export function resolveAlias(alias) {
  if (alias.startsWith('@/')) {
    return path.resolve(__dirname, 'client/src', alias.slice(2));
  }
  return alias;
}

export default {
  resolveAlias
};
`;
    
    fs.writeFileSync('./alias-resolver-browser.mjs', resolverContent, 'utf-8');
    console.log('✅ Archivo de resolución para Vite creado correctamente.');
  } catch (error) {
    console.error('❌ Error al crear archivo de resolución para Vite:', error.message);
  }
}

// Ejecución principal
console.log('🔍 Iniciando corrección de importaciones...');
fixImports();
setupSymlinks();
createViteResolver();
console.log('\n✅ Proceso completado.');