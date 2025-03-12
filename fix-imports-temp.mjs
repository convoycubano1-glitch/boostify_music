#!/usr/bin/env node

/**
 * Script para reemplazar temporalmente importaciones con alias @/ a rutas relativas
 * 
 * Este script busca todos los archivos TypeScript/React y convierte las importaciones
 * que usan @/ a rutas relativas calculadas según la ubicación de cada archivo
 * 
 * @author Replit AI
 * @version 1.0.0
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);
const clientDir = path.join(rootDir, 'client');
const srcDir = path.join(clientDir, 'src');

// Colores para la consola
const color = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

/**
 * Busca archivos recursivamente en un directorio
 * @param {string} directory - Directorio a explorar
 * @param {Array<string>} extensions - Extensiones de archivo a incluir
 * @returns {Promise<Array<string>>} - Lista de rutas de archivos
 */
async function findFiles(directory, extensions) {
  const files = [];
  
  async function traverseDir(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
        // Ignorar node_modules y dist
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          await traverseDir(fullPath);
        }
      } else if (entry.isFile() && extensions.includes(path.extname(entry.name))) {
        files.push(fullPath);
      }
    }
  }
  
  await traverseDir(directory);
  return files;
}

/**
 * Convierte una ruta de importación con alias @/ a una ruta relativa
 * @param {string} importPath - Ruta con alias @/
 * @param {string} filePath - Ruta del archivo que contiene la importación
 * @returns {string} - Ruta relativa
 */
function convertAliasToRelative(importPath, filePath) {
  if (!importPath.startsWith('@/')) {
    return importPath;
  }
  
  // Ruta de destino (sin el alias @/)
  const targetPath = path.join(srcDir, importPath.substring(2));
  
  // Directorio del archivo actual
  const fileDir = path.dirname(filePath);
  
  // Calcular ruta relativa
  let relativePath = path.relative(fileDir, targetPath);
  
  // Asegurar que la ruta empiece con ./ o ../
  if (!relativePath.startsWith('.')) {
    relativePath = `./${relativePath}`;
  }
  
  // Normalizar separadores de ruta para importaciones
  relativePath = relativePath.replace(/\\/g, '/');
  
  return relativePath;
}

/**
 * Actualiza las importaciones en un archivo
 * @param {string} filePath - Ruta del archivo a procesar
 * @returns {Promise<{filePath: string, modified: boolean, imports: Array<string>}>}
 */
async function updateImports(filePath) {
  try {
    let content = await fs.readFile(filePath, 'utf-8');
    const originalContent = content;
    const imports = [];
    
    // Buscar imports con @/
    const importRegex = /import\s+(?:(?:{[^}]*}|\*\s+as\s+[^,]+|[^,{}\s*]+)(?:\s*,\s*(?:{[^}]*}|\*\s+as\s+[^,]+|[^,{}\s*]+))*\s*from\s+)['"](@\/[^'"]+)['"]/g;
    
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      const fullImport = match[0];
      const importPath = match[1];
      const relativePath = convertAliasToRelative(importPath, filePath);
      
      imports.push({ from: importPath, to: relativePath });
      
      // Reemplazar la importación
      const newImport = fullImport.replace(`"${importPath}"`, `"${relativePath}"`).replace(`'${importPath}'`, `'${relativePath}'`);
      content = content.replace(fullImport, newImport);
    }
    
    // Si hubo cambios, actualizar el archivo
    const modified = originalContent !== content;
    if (modified) {
      await fs.writeFile(filePath, content, 'utf-8');
    }
    
    return { filePath, modified, imports };
  } catch (error) {
    console.error(`${color.red}Error al procesar ${filePath}: ${error.message}${color.reset}`);
    return { filePath, modified: false, imports: [], error: error.message };
  }
}

/**
 * Función principal
 */
async function main() {
  console.log(`${color.blue}Iniciando conversión temporal de importaciones con alias @/${color.reset}`);
  
  try {
    // Encontrar todos los archivos TypeScript/React
    console.log(`${color.blue}Buscando archivos...${color.reset}`);
    const files = await findFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);
    console.log(`${color.green}${files.length} archivos encontrados${color.reset}`);
    
    // Procesar cada archivo
    console.log(`${color.blue}Procesando archivos...${color.reset}`);
    let modifiedFiles = 0;
    let totalImportsFixed = 0;
    
    for (const file of files) {
      const result = await updateImports(file);
      
      if (result.modified) {
        modifiedFiles++;
        totalImportsFixed += result.imports.length;
        
        const relativePath = path.relative(rootDir, file);
        console.log(`${color.green}✓ ${relativePath}${color.reset} (${result.imports.length} importaciones)`);
        
        for (const imp of result.imports) {
          console.log(`  ${color.cyan}${imp.from}${color.reset} → ${color.yellow}${imp.to}${color.reset}`);
        }
      }
    }
    
    // Resumen
    console.log(`\n${color.green}Resumen:${color.reset}`);
    console.log(`- ${modifiedFiles} archivos modificados`);
    console.log(`- ${totalImportsFixed} importaciones convertidas`);
    
    console.log(`\n${color.yellow}Nota: Esta es una solución temporal. Después de probar la aplicación, es recomendable revertir estos cambios.${color.reset}`);
    console.log(`Para revertir, puede restaurar los archivos del control de versiones o ejecutar un script similar que haga la conversión inversa.`);
    
    return 0;
  } catch (error) {
    console.error(`${color.red}Error: ${error.message}${color.reset}`);
    return 1;
  }
}

// Ejecutar la función principal
main().then(code => {
  process.exit(code);
});