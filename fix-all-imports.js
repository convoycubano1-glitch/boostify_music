/**
 * Script mejorado para convertir todas las importaciones con alias @/ a importaciones relativas
 * Esta versión busca y procesa recursivamente todos los archivos TypeScript/React
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas principales
const srcDir = path.resolve(__dirname, 'client/src');

/**
 * Convierte una ruta con alias @/ a una ruta relativa
 * @param {string} filePath - Ruta del archivo que contiene la importación
 * @param {string} importPath - Ruta de importación con alias @/
 * @returns {string} - Ruta relativa
 */
function convertAliasToRelative(filePath, importPath) {
  // Eliminar el prefijo @/
  const importWithoutAlias = importPath.replace(/^@\//, '');
  
  // Calcular la ruta relativa desde el archivo actual hasta la raíz src
  const fileDir = path.dirname(filePath);
  const relativeToSrc = path.relative(fileDir, srcDir);
  
  // Construir la ruta relativa final
  const relativePath = path.join(relativeToSrc, importWithoutAlias);
  
  // Asegurar que la ruta comience con ./ o ../
  return relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
}

/**
 * Procesa un archivo y reemplaza las importaciones con alias por rutas relativas
 * @param {string} filePath - Ruta completa del archivo a procesar
 * @returns {boolean} - Indica si se realizaron cambios en el archivo
 */
function processFile(filePath) {
  // Leer el contenido del archivo
  let content = fs.readFileSync(filePath, 'utf8');
  const originalContent = content;
  
  // Buscar importaciones con alias @/
  const importRegex = /import\s+(?:(?:{[^}]*})|(?:[^{}\s]+))\s+from\s+['"](@\/[^'"]+)['"]/g;
  const typeImportRegex = /import\s+type\s+(?:(?:{[^}]*})|(?:[^{}\s]+))\s+from\s+['"](@\/[^'"]+)['"]/g;
  
  // Reemplazar importaciones normales
  content = content.replace(importRegex, (match, importPath) => {
    const relativePath = convertAliasToRelative(filePath, importPath);
    return match.replace(importPath, relativePath);
  });
  
  // Reemplazar importaciones de tipos
  content = content.replace(typeImportRegex, (match, importPath) => {
    const relativePath = convertAliasToRelative(filePath, importPath);
    return match.replace(importPath, relativePath);
  });
  
  // Verificar si hay cambios
  const hasChanges = content !== originalContent;
  
  // Guardar el archivo modificado si hay cambios
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    const relativePath = path.relative(srcDir, filePath);
    console.log(`✅ Procesado: ${relativePath}`);
  }
  
  return hasChanges;
}

/**
 * Encuentra todos los archivos TypeScript/React en un directorio y sus subdirectorios
 * @param {string} directory - Directorio donde buscar
 * @returns {string[]} - Array de rutas de archivos
 */
function findAllTsxFiles(directory) {
  const files = [];
  
  function traverseDir(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      
      if (entry.isDirectory()) {
        traverseDir(fullPath);
      } else if (entry.isFile() && 
                (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx') || entry.name.endsWith('.jsx'))) {
        files.push(fullPath);
      }
    }
  }
  
  traverseDir(directory);
  return files;
}

/**
 * Función principal para procesar todos los archivos
 */
function main() {
  console.log('🔄 Iniciando conversión de importaciones con alias @/ a rutas relativas...');
  
  // Verificar que el directorio src exista
  if (!fs.existsSync(srcDir)) {
    console.error(`❌ Error: El directorio ${srcDir} no existe`);
    process.exit(1);
  }
  
  // Buscar todos los archivos TypeScript/React
  const files = findAllTsxFiles(srcDir);
  console.log(`🔍 Encontrados ${files.length} archivos para procesar`);
  
  // Procesar cada archivo y contar modificaciones
  let modifiedCount = 0;
  for (const file of files) {
    const wasModified = processFile(file);
    if (wasModified) {
      modifiedCount++;
    }
  }
  
  console.log(`🎉 Conversión completada con éxito. ${modifiedCount} archivos modificados de ${files.length} totales.`);
}

main();