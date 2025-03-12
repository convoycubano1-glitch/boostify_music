/**
 * Adaptador de resolución de alias @/ para la aplicación
 * 
 * Este script crea un arreglo permanente para el problema de alias de rutas @/
 * Funciona creando un enlace simbólico en la carpeta node_modules.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta absoluta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Definir rutas importantes
const rootDir = path.resolve(__dirname);
const clientSrcDir = path.join(rootDir, 'client', 'src');
const nodeModulesDir = path.join(rootDir, 'node_modules');
const aliasDir = path.join(nodeModulesDir, '@');

// Crear carpeta node_modules si no existe
if (!fs.existsSync(nodeModulesDir)) {
  console.log('Creando carpeta node_modules...');
  fs.mkdirSync(nodeModulesDir, { recursive: true });
}

// Verificar si ya existe el enlace simbólico
let symlinkExists = false;
try {
  const stats = fs.lstatSync(aliasDir);
  symlinkExists = stats.isSymbolicLink();
  
  // Si existe pero apunta a un lugar incorrecto, eliminarlo
  if (symlinkExists) {
    const target = fs.readlinkSync(aliasDir);
    if (target !== clientSrcDir) {
      console.log(`El enlace simbólico existe pero apunta a ${target} en lugar de ${clientSrcDir}`);
      fs.unlinkSync(aliasDir);
      symlinkExists = false;
    } else {
      console.log('El enlace simbólico ya existe y apunta al directorio correcto.');
    }
  }
} catch (err) {
  // Error al verificar enlace simbólico (probablemente no existe)
  if (err.code !== 'ENOENT') {
    console.error('Error al verificar el enlace simbólico:', err);
  }
}

// Crear el enlace simbólico si no existe
if (!symlinkExists) {
  try {
    console.log(`Creando enlace simbólico: ${aliasDir} -> ${clientSrcDir}`);
    fs.symlinkSync(clientSrcDir, aliasDir, 'dir');
    console.log('Enlace simbólico creado exitosamente.');
  } catch (err) {
    console.error('Error al crear el enlace simbólico:', err);
    
    // Si falla symlink, intentamos con una solución alternativa
    console.log('Intentando solución alternativa...');
    
    // Crear un directorio físico en lugar de un symlink
    if (!fs.existsSync(aliasDir)) {
      fs.mkdirSync(aliasDir, { recursive: true });
    }
    
    // Leer todos los directorios y archivos en client/src
    function copyRecursively(source, target) {
      if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
      }
      
      const entries = fs.readdirSync(source, { withFileTypes: true });
      
      for (const entry of entries) {
        const srcPath = path.join(source, entry.name);
        const destPath = path.join(target, entry.name);
        
        if (entry.isDirectory()) {
          copyRecursively(srcPath, destPath);
        } else {
          // Para archivos, crear un enlace duro si es posible, o copiar si no
          try {
            // Si el destino ya existe, eliminarlo primero
            if (fs.existsSync(destPath)) {
              fs.unlinkSync(destPath);
            }
            
            fs.linkSync(srcPath, destPath);
          } catch (err) {
            // Si falla el enlace duro, copiar el archivo
            fs.copyFileSync(srcPath, destPath);
          }
        }
      }
    }
    
    try {
      copyRecursively(clientSrcDir, aliasDir);
      console.log('Solución alternativa aplicada: archivos copiados/enlazados.');
    } catch (err) {
      console.error('Error en la solución alternativa:', err);
    }
  }
}

// Verificar si se resolvió el problema
if (fs.existsSync(aliasDir)) {
  console.log('Resolución de alias @/ configurada correctamente.');
} else {
  console.error('No se pudo configurar la resolución de alias @/.');
}

// La resolución automática de importaciones está lista
console.log('Resolución de alias completada.');

export default { 
  resolved: fs.existsSync(aliasDir) 
};