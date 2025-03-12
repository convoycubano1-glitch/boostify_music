/**
 * ESM Path Alias Resolver for @/ imports
 * 
 * Este script resuelve importaciones con alias @/ para entornos ESM
 * Compatible con Node.js y Vite para desarrollo y producción
 * 
 * @author Replit AI
 * @version 1.0.0
 */

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import * as fs from 'fs';
import * as path from 'path';

// Configuración de directorios y alias
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = path.resolve(__dirname);
const clientSrcDir = path.resolve(rootDir, 'client', 'src');

// Colores para la consola
const log = {
  info: (msg) => console.log(`\x1b[36m${msg}\x1b[0m`),
  success: (msg) => console.log(`\x1b[32m${msg}\x1b[0m`),
  warning: (msg) => console.log(`\x1b[33m${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m${msg}\x1b[0m`)
};

/**
 * Mapa de alias a rutas reales
 * Expande este objeto si necesitas más alias
 */
export const aliasMap = {
  '@/components': path.resolve(clientSrcDir, 'components'),
  '@/lib': path.resolve(clientSrcDir, 'lib'),
  '@/hooks': path.resolve(clientSrcDir, 'hooks'),
  '@/pages': path.resolve(clientSrcDir, 'pages'),
  '@/utils': path.resolve(clientSrcDir, 'utils'),
  '@/context': path.resolve(clientSrcDir, 'context'),
  '@/services': path.resolve(clientSrcDir, 'services'),
  '@/store': path.resolve(clientSrcDir, 'store'),
  '@/styles': path.resolve(clientSrcDir, 'styles'),
  '@/images': path.resolve(clientSrcDir, 'images'),
  '@': clientSrcDir
};

/**
 * Resuelve una ruta con alias a su ruta real
 * 
 * @param {string} aliasPath - Ruta con alias a resolver (ej: @/components/button)
 * @returns {string|null} - Ruta real o null si no puede resolverse
 */
export function resolveAliasPath(aliasPath) {
  if (!aliasPath || typeof aliasPath !== 'string') {
    return null;
  }
  
  // Encontrar el alias más largo que coincida
  const matchingAliases = Object.keys(aliasMap)
    .filter(alias => aliasPath.startsWith(alias))
    .sort((a, b) => b.length - a.length);
  
  if (matchingAliases.length > 0) {
    const alias = matchingAliases[0];
    const relativePath = aliasPath.slice(alias.length);
    const resolvedPath = path.join(aliasMap[alias], relativePath);
    
    // Verificar que la ruta existe
    try {
      if (fs.existsSync(resolvedPath)) {
        return resolvedPath;
      }
      
      // Intentar con extensiones comunes
      const extensions = ['.js', '.jsx', '.ts', '.tsx', '.json'];
      for (const ext of extensions) {
        const pathWithExt = `${resolvedPath}${ext}`;
        if (fs.existsSync(pathWithExt)) {
          return pathWithExt;
        }
      }
      
      // Verificar si es un directorio con index
      const indexFiles = ['index.js', 'index.jsx', 'index.ts', 'index.tsx'];
      for (const indexFile of indexFiles) {
        const indexPath = path.join(resolvedPath, indexFile);
        if (fs.existsSync(indexPath)) {
          return indexPath;
        }
      }
    } catch (error) {
      log.error(`Error verificando ruta ${resolvedPath}: ${error.message}`);
    }
  }
  
  return null;
}

/**
 * Verifica la existencia de los directorios en el mapa de alias
 * Crea los directorios faltantes si se especifica
 * 
 * @param {boolean} createMissing - Si es true, crea los directorios faltantes
 * @returns {Object} - Estado de los directorios
 */
export function checkDirectories(createMissing = false) {
  const status = {};
  
  for (const [alias, dirPath] of Object.entries(aliasMap)) {
    try {
      const exists = fs.existsSync(dirPath);
      status[alias] = exists;
      
      if (!exists && createMissing) {
        fs.mkdirSync(dirPath, { recursive: true });
        status[`${alias}_created`] = true;
        log.success(`Directorio creado: ${dirPath}`);
      }
    } catch (error) {
      status[`${alias}_error`] = error.message;
      log.error(`Error verificando/creando ${dirPath}: ${error.message}`);
    }
  }
  
  return status;
}

// Ejecutar verificación al importar este archivo
try {
  checkDirectories(true);
  log.success('Verificación de directorios completada');
} catch (error) {
  log.error(`Error durante la verificación: ${error.message}`);
}

// Exportamos funciones para uso en otros archivos
export default {
  aliasMap,
  resolveAliasPath,
  checkDirectories
};