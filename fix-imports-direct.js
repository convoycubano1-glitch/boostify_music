/**
 * Script para convertir directamente las importaciones con alias @/ a importaciones relativas
 * Esta solución modificará los archivos directamente en lugar de usar symlinks
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener la ruta del directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rutas principales
const srcDir = path.resolve(__dirname, 'client/src');
const targetFiles = [
  // Archivos de los componentes de afiliados mencionados en el error
  'components/affiliates/registration.tsx',
  'components/affiliates/content-generator.tsx', 
  'components/affiliates/resources.tsx',
  'components/affiliates/video-upload.tsx',
  // Archivos UI comunes que suelen ser importados con alias
  'components/ui/button.tsx',
  'components/ui/card.tsx',
  'components/ui/badge.tsx',
  'components/ui/tabs.tsx',
  'components/ui/input.tsx',
  'components/ui/textarea.tsx',
  'components/ui/select.tsx',
  'components/ui/form.tsx',
  // Hooks
  'hooks/use-auth.tsx',
  'hooks/use-toast.ts',
  // Layout
  'components/layout/header.tsx',
  'components/layout/footer.tsx'
];

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
 * @param {string} relativeFilePath - Ruta relativa del archivo a procesar
 */
function processFile(relativeFilePath) {
  const fullPath = path.join(srcDir, relativeFilePath);
  
  // Verificar si el archivo existe
  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️ Archivo no encontrado: ${fullPath}`);
    return;
  }
  
  // Leer el contenido del archivo
  let content = fs.readFileSync(fullPath, 'utf8');
  
  // Buscar importaciones con alias @/
  const importRegex = /import\s+(?:(?:{[^}]*})|(?:[^{}\s]+))\s+from\s+['"](@\/[^'"]+)['"]/g;
  const typeImportRegex = /import\s+type\s+(?:(?:{[^}]*})|(?:[^{}\s]+))\s+from\s+['"](@\/[^'"]+)['"]/g;
  
  // Reemplazar importaciones normales
  content = content.replace(importRegex, (match, importPath) => {
    const relativePath = convertAliasToRelative(fullPath, importPath);
    return match.replace(importPath, relativePath);
  });
  
  // Reemplazar importaciones de tipos
  content = content.replace(typeImportRegex, (match, importPath) => {
    const relativePath = convertAliasToRelative(fullPath, importPath);
    return match.replace(importPath, relativePath);
  });
  
  // Guardar el archivo modificado
  fs.writeFileSync(fullPath, content, 'utf8');
  console.log(`✅ Procesado: ${relativeFilePath}`);
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
  
  // Procesar cada archivo en la lista
  for (const file of targetFiles) {
    processFile(file);
  }
  
  console.log('🎉 Conversión completada con éxito');
}

main();