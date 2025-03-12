/**
 * Solución completa para resolver problemas de alias @/ en la aplicación
 * Este script implementa varios métodos para asegurar que todas las importaciones funcionen
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Configuración de rutas
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);
const clientDir = path.join(rootDir, 'client');
const srcDir = path.join(clientDir, 'src');
const nodeModulesDir = path.join(rootDir, 'node_modules');
const aliasDir = path.join(nodeModulesDir, '@');

// Colores para consola
const color = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

// Paso 1: Crear directorio de node_modules si no existe
async function setupNodeModules() {
  try {
    await fs.mkdir(nodeModulesDir, { recursive: true });
    console.log(`${color.green}Directorio node_modules verificado${color.reset}`);
    return true;
  } catch (err) {
    console.error(`${color.red}Error al configurar node_modules: ${err.message}${color.reset}`);
    return false;
  }
}

// Paso 2: Crear enlace simbólico para @
async function createSymlink() {
  try {
    // Verificar si ya existe el enlace
    try {
      const stats = await fs.lstat(aliasDir);
      if (stats.isSymbolicLink()) {
        await fs.unlink(aliasDir);
        console.log(`${color.yellow}Enlace simbólico existente eliminado${color.reset}`);
      } else if (stats.isDirectory()) {
        // Si es un directorio normal, respaldarlo y eliminarlo
        const backupDir = `${aliasDir}_backup_${Date.now()}`;
        await fs.rename(aliasDir, backupDir);
        console.log(`${color.yellow}Directorio @ existente respaldado en ${backupDir}${color.reset}`);
      }
    } catch (e) {
      if (e.code !== 'ENOENT') console.error(`${color.yellow}Advertencia: ${e.message}${color.reset}`);
    }

    // Crear el enlace
    await fs.symlink(srcDir, aliasDir, 'dir');
    console.log(`${color.green}Enlace simbólico creado: ${aliasDir} -> ${srcDir}${color.reset}`);
    return true;
  } catch (err) {
    console.error(`${color.red}Error al crear enlace simbólico: ${err.message}${color.reset}`);
    
    // Intentar alternativa (crear directorios reales)
    try {
      await fs.mkdir(aliasDir, { recursive: true });
      console.log(`${color.yellow}Alternativa: Creado directorio físico @${color.reset}`);
      
      // Crear enlaces físicos o copias de todos los archivos
      await copyRecursively(srcDir, aliasDir);
      console.log(`${color.green}Alternativa: Contenido de src copiado a @${color.reset}`);
      return true;
    } catch (err2) {
      console.error(`${color.red}Error en solución alternativa: ${err2.message}${color.reset}`);
      return false;
    }
  }
}

// Función auxiliar para copiar directorios de forma recursiva
async function copyRecursively(source, target) {
  await fs.mkdir(target, { recursive: true });
  
  const entries = await fs.readdir(source, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(source, entry.name);
    const destPath = path.join(target, entry.name);
    
    if (entry.isDirectory()) {
      await copyRecursively(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

// Paso 3: Convertir importaciones @/ a rutas relativas
async function fixImports() {
  try {
    console.log(`${color.blue}Convirtiendo importaciones con @/ a rutas relativas...${color.reset}`);
    
    // Encontrar todos los archivos TypeScript/React/JavaScript
    const files = await findFiles(srcDir, ['.ts', '.tsx', '.js', '.jsx']);
    console.log(`${color.green}${files.length} archivos encontrados${color.reset}`);
    
    // Procesar cada archivo
    let modifiedFiles = 0;
    let totalImportsFixed = 0;
    
    for (const file of files) {
      const result = await updateImports(file);
      
      if (result.modified) {
        modifiedFiles++;
        totalImportsFixed += result.imports.length;
      }
    }
    
    console.log(`${color.green}Resumen de conversión de importaciones:${color.reset}`);
    console.log(`- ${modifiedFiles} archivos modificados`);
    console.log(`- ${totalImportsFixed} importaciones convertidas`);
    
    return true;
  } catch (err) {
    console.error(`${color.red}Error al convertir importaciones: ${err.message}${color.reset}`);
    return false;
  }
}

// Función auxiliar para buscar archivos
async function findFiles(directory, extensions) {
  const files = [];
  
  async function traverseDir(currentPath) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);
      
      if (entry.isDirectory()) {
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

// Actualizar importaciones en un archivo
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

// Convertir alias a ruta relativa
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

// Paso 4: Actualizar el archivo vite.config.ts
async function updateViteConfig() {
  try {
    const viteConfigPath = path.join(rootDir, 'vite.config.ts');
    let content = await fs.readFile(viteConfigPath, 'utf-8');
    
    // Verificar si ya tiene la configuración adecuada
    if (content.includes('alias: {') && content.includes("'@': ")) {
      console.log(`${color.green}Vite config ya tiene configuración de alias${color.reset}`);
      return true;
    }
    
    // Buscar posición para insertar configuración de alias
    const resolvePos = content.indexOf('resolve:');
    
    if (resolvePos !== -1) {
      // Ya tiene sección resolve, verificar si tiene alias
      const aliasPos = content.indexOf('alias:', resolvePos);
      
      if (aliasPos !== -1) {
        // Ya tiene alias, verificar si tiene @ configurado
        const atPos = content.indexOf("'@':", aliasPos);
        
        if (atPos === -1) {
          // No tiene @ configurado, agregarlo a los alias existentes
          const bracketPos = content.indexOf('{', aliasPos);
          const newContent = content.slice(0, bracketPos + 1) + 
                          "\n      '@': path.resolve(__dirname, 'client', 'src')," + 
                          content.slice(bracketPos + 1);
          
          await fs.writeFile(viteConfigPath, newContent, 'utf-8');
          console.log(`${color.green}Alias @ agregado a configuración existente en vite.config.ts${color.reset}`);
        }
      } else {
        // No tiene alias, agregarlos a resolve existente
        const bracketPos = content.indexOf('{', resolvePos);
        const newContent = content.slice(0, bracketPos + 1) + 
                        "\n    alias: {\n      '@': path.resolve(__dirname, 'client', 'src'),\n    }," + 
                        content.slice(bracketPos + 1);
        
        await fs.writeFile(viteConfigPath, newContent, 'utf-8');
        console.log(`${color.green}Configuración de alias agregada a resolve en vite.config.ts${color.reset}`);
      }
    } else {
      // No tiene resolve, agregar todo
      const pluginsPos = content.indexOf('plugins:');
      if (pluginsPos !== -1) {
        const bracketPos = content.indexOf(']', pluginsPos);
        const newContent = content.slice(0, bracketPos + 1) + 
                        ",\n  resolve: {\n    alias: {\n      '@': path.resolve(__dirname, 'client', 'src'),\n    }\n  }" + 
                        content.slice(bracketPos + 1);
        
        await fs.writeFile(viteConfigPath, newContent, 'utf-8');
        console.log(`${color.green}Configuración de resolve y alias agregada a vite.config.ts${color.reset}`);
      } else {
        // No se encontró la sección de plugins, estructura irregular
        console.log(`${color.yellow}No se pudo identificar la estructura de vite.config.ts${color.reset}`);
        return false;
      }
    }
    
    return true;
  } catch (err) {
    console.error(`${color.red}Error al actualizar vite.config.ts: ${err.message}${color.reset}`);
    return false;
  }
}

// Función principal
async function main() {
  console.log(`${color.blue}Iniciando solución completa para problemas de alias @/${color.reset}`);
  
  // Paso 1: Configurar node_modules
  const step1 = await setupNodeModules();
  if (!step1) {
    console.log(`${color.yellow}Advertencia: Problemas al configurar node_modules${color.reset}`);
  }
  
  // Paso 2: Crear enlace simbólico
  const step2 = await createSymlink();
  if (!step2) {
    console.log(`${color.yellow}Advertencia: Problemas al crear enlace simbólico${color.reset}`);
  }
  
  // Paso 3: Convertir importaciones
  const step3 = await fixImports();
  if (!step3) {
    console.log(`${color.yellow}Advertencia: Problemas al convertir importaciones${color.reset}`);
  }
  
  // Paso 4: Actualizar configuración de Vite
  const step4 = await updateViteConfig();
  if (!step4) {
    console.log(`${color.yellow}Advertencia: Problemas al actualizar vite.config.ts${color.reset}`);
  }
  
  console.log(`\n${color.green}¡Solución completa aplicada!${color.reset}`);
  console.log(`${color.blue}Ahora puedes iniciar la aplicación con:${color.reset}`);
  console.log(`node start.js`);
  
  return 0;
}

// Ejecutar función principal
console.log(`${color.blue}Ejecutando solución completa para @/...${color.reset}`);
main().then(code => {
  process.exit(code);
});