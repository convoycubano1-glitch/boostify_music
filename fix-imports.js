/**
 * Script para corregir importaciones con alias @/ antes de construir
 * Este script analiza todos los archivos TypeScript/React y convierte
 * las importaciones con alias @/ a importaciones relativas
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname);
const srcDir = path.resolve(rootDir, 'client', 'src');
const outputDir = path.resolve(rootDir, '.temp-build');

// Colores para la terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Convierte una importación con alias @/ a una importación relativa
 * @param {string} importPath - Ruta de importación con alias @/
 * @param {string} filePath - Ruta absoluta del archivo actual
 * @returns {string} - Ruta de importación relativa
 */
function convertAliasToRelative(importPath, filePath) {
  if (!importPath.startsWith('@/')) {
    return importPath;
  }

  const targetPath = path.resolve(srcDir, importPath.replace('@/', ''));
  const fileDir = path.dirname(filePath);
  const relativePath = path.relative(fileDir, targetPath);

  // Asegurar que la ruta relativa comienza con ./ o ../
  let result = relativePath.startsWith('.') ? relativePath : `./${relativePath}`;
  
  // Normalizar las barras para que sean compatibles con importaciones
  result = result.replace(/\\/g, '/');
  
  return result;
}

/**
 * Procesa un archivo para convertir importaciones con alias
 * @param {string} filePath - Ruta del archivo a procesar
 * @param {string} outputPath - Ruta de salida para el archivo procesado
 */
function processFile(filePath, outputPath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    // Buscar todas las importaciones con patrón @/
    const importRegex = /from\s+['"](@\/[^'"]+)['"]/g;
    const importMatches = content.matchAll(importRegex);
    
    for (const match of importMatches) {
      const importPath = match[1];
      const relativeImportPath = convertAliasToRelative(importPath, filePath);
      content = content.replace(`from '${importPath}'`, `from '${relativeImportPath}'`);
      content = content.replace(`from "${importPath}"`, `from "${relativeImportPath}"`);
    }
    
    // Buscar todas las importaciones de tipo con patrón @/
    const typeImportRegex = /import\s+type\s+\{[^}]+\}\s+from\s+['"](@\/[^'"]+)['"]/g;
    const typeImportMatches = content.matchAll(typeImportRegex);
    
    for (const match of typeImportMatches) {
      const importPath = match[1];
      const relativeImportPath = convertAliasToRelative(importPath, filePath);
      content = content.replace(`from '${importPath}'`, `from '${relativeImportPath}'`);
      content = content.replace(`from "${importPath}"`, `from "${relativeImportPath}"`);
    }
    
    // Solo escribir si hay cambios
    if (content !== originalContent) {
      console.log(`${colors.yellow}Convirtiendo importaciones en:${colors.reset} ${filePath}`);
      
      // Crear directorio de salida si no existe
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.writeFileSync(outputPath, content, 'utf8');
      return true;
    } else {
      // Copiar el archivo sin cambios
      console.log(`${colors.blue}Copiando sin cambios:${colors.reset} ${filePath}`);
      
      // Crear directorio de salida si no existe
      const outputDir = path.dirname(outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      fs.copyFileSync(filePath, outputPath);
      return false;
    }
  } catch (error) {
    console.error(`${colors.red}Error al procesar ${filePath}:${colors.reset} ${error.message}`);
    return false;
  }
}

/**
 * Función auxiliar para encontrar archivos recursivamente
 * @param {string} directory - Directorio a explorar
 * @param {string[]} extensions - Extensiones de archivos a buscar
 * @returns {string[]} - Lista de rutas de archivos
 */
function findFiles(directory, extensions) {
  const results = [];
  
  function traverseDir(currentPath) {
    const files = fs.readdirSync(currentPath, { withFileTypes: true });
    
    for (const file of files) {
      const fullPath = path.join(currentPath, file.name);
      
      if (file.isDirectory() && file.name !== 'node_modules') {
        traverseDir(fullPath);
      } else if (file.isFile()) {
        const ext = path.extname(file.name).toLowerCase();
        if (extensions.includes(ext)) {
          results.push(fullPath);
        }
      }
    }
  }
  
  traverseDir(directory);
  return results;
}

/**
 * Procesa todos los archivos en un directorio recursivamente
 * @param {string} directory - Directorio a procesar
 * @param {string} outputDir - Directorio de salida
 */
function processDirectory(directory, outputDir) {
  try {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    const files = findFiles(directory, extensions);
    
    console.log(`${colors.green}Procesando ${files.length} archivos...${colors.reset}`);
    
    let importChanges = 0;
    
    for (const file of files) {
      const relativePath = path.relative(rootDir, file);
      const outputPath = path.join(outputDir, relativePath);
      
      if (processFile(file, outputPath)) {
        importChanges++;
      }
    }
    
    console.log(`${colors.green}Archivos procesados: ${files.length}${colors.reset}`);
    console.log(`${colors.cyan}Archivos con importaciones convertidas: ${importChanges}${colors.reset}`);
    
    return { total: files.length, changed: importChanges };
  } catch (error) {
    console.error(`${colors.red}Error al procesar directorio:${colors.reset} ${error.message}`);
    return { total: 0, changed: 0 };
  }
}

// Ejecutar el procesamiento
const startTime = Date.now();
console.log(`${colors.green}Iniciando conversión de importaciones con alias @/...${colors.reset}`);

// Verificar si el directorio de salida existe, si no, crearlo
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
} else {
  // Limpiar el directorio
  fs.rmSync(outputDir, { recursive: true, force: true });
  fs.mkdirSync(outputDir, { recursive: true });
}

// Procesar el directorio src
const result = processDirectory(srcDir, path.join(outputDir, 'client', 'src'));

const endTime = Date.now();
const duration = (endTime - startTime) / 1000;

console.log(`\n${colors.green}Conversión completada en ${duration.toFixed(2)} segundos.${colors.reset}`);
console.log(`${colors.yellow}Archivos procesados: ${result.total}${colors.reset}`);
console.log(`${colors.cyan}Archivos con importaciones corregidas: ${result.changed}${colors.reset}`);
console.log(`${colors.green}Los archivos procesados están en: ${outputDir}${colors.reset}`);

// Instrucciones para usuarios
console.log(`\n${colors.yellow}Para usar los archivos procesados:${colors.reset}`);
console.log(`1. Construye la aplicación usando los archivos en ${outputDir}`);
console.log(`2. Asegúrate de actualizar las rutas en tu configuración de Vite`);
console.log(`3. Una vez verificado el funcionamiento, puedes reemplazar los archivos originales con los procesados`);