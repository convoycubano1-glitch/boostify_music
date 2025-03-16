/**
 * Script para establecer los enlaces simbólicos necesarios para las importaciones @/
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear el enlace simbólico para @/
function createAliasSymlinks() {
  // Verificar si existe la carpeta node_modules/@
  const aliasPath = path.resolve('node_modules/@');
  
  if (!fs.existsSync('node_modules')) {
    fs.mkdirSync('node_modules', { recursive: true });
    console.log('✅ Carpeta node_modules creada');
  }
  
  if (!fs.existsSync(aliasPath)) {
    fs.mkdirSync(aliasPath, { recursive: true });
    console.log('✅ Carpeta node_modules/@ creada');
  }
  
  // Crear el enlace simbólico a client/src
  const targetPath = path.resolve('client/src');
  console.log(`🔍 Ruta de client/src: ${targetPath}`);
  
  // Verificar que exista la carpeta
  if (!fs.existsSync(targetPath)) {
    console.error(`❌ Error: La carpeta ${targetPath} no existe`);
    return;
  }
  
  // Eliminar los enlaces existentes si existen
  try {
    // Limpiar todos los enlaces existentes en node_modules/@
    const files = fs.readdirSync(aliasPath);
    for (const file of files) {
      const filePath = path.join(aliasPath, file);
      try {
        const stats = fs.lstatSync(filePath);
        if (stats.isSymbolicLink()) {
          fs.unlinkSync(filePath);
          console.log(`🔄 Enlace simbólico ${file} eliminado`);
        }
      } catch (err) {
        console.error(`Error al procesar ${file}:`, err);
      }
    }
  } catch (err) {
    console.error('Error al eliminar enlaces simbólicos:', err);
  }
  
  // Crear los enlaces para los componentes principales
  try {
    // Lista de carpetas a enlazar desde client/src
    const foldersToLink = [
      'components',
      'hooks',
      'lib',
      'utils',
      'context',
      'services',
      'pages',
      'store',
      'types'
    ];
    
    // Enlazar cada carpeta individualmente
    for (const folder of foldersToLink) {
      const sourcePath = path.join(targetPath, folder);
      const destPath = path.join(aliasPath, folder);
      
      if (fs.existsSync(sourcePath)) {
        fs.symlinkSync(sourcePath, destPath, 'junction');
        console.log(`✅ Enlace simbólico @/${folder} creado`);
      } else {
        console.log(`⚠️ Carpeta ${folder} no encontrada en client/src`);
      }
    }
    
    // Enlazar archivos individuales importantes
    const filesToLink = ['firebase.ts'];
    for (const file of filesToLink) {
      const sourceFile = path.join(targetPath, file);
      const destFile = path.join(aliasPath, file);
      
      if (fs.existsSync(sourceFile)) {
        fs.symlinkSync(sourceFile, destFile, 'file');
        console.log(`✅ Enlace simbólico @/${file} creado`);
      } else {
        console.log(`⚠️ Archivo ${file} no encontrado en client/src`);
      }
    }
    
    // Crear el enlace global para todo client/src
    fs.symlinkSync(targetPath, path.join(aliasPath, 'src'), 'junction');
    console.log('✅ Enlace simbólico general @/src creado correctamente');
  } catch (err) {
    console.error('Error al crear enlaces simbólicos:', err);
  }
}

createAliasSymlinks();
console.log('🚀 Configuración de alias completada');