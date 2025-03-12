/**
 * Script para limpiar enlaces simbólicos circulares
 * y configurar correctamente el entorno de desarrollo
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname);
const clientSrcDir = path.join(rootDir, 'client', 'src');
const nodeModulesDir = path.join(rootDir, 'node_modules');

// Paths that cause circular references
const problematicPaths = [
  'assets',
  'firebase',
  'lib',
  'styles',
  'components'
];

console.log('🔍 Buscando y eliminando enlaces simbólicos problemáticos...');

// Check for the @/ symlink in node_modules
const atSymlink = path.join(nodeModulesDir, '@');
let removeMainSymlink = false;

try {
  const stats = fs.lstatSync(atSymlink);
  if (stats.isSymbolicLink()) {
    console.log(`Encontrado enlace simbólico principal: ${atSymlink}`);
    removeMainSymlink = true;
  }
} catch (err) {
  if (err.code !== 'ENOENT') {
    console.error(`Error al verificar el enlace simbólico ${atSymlink}:`, err);
  }
}

// Remove the main @ symlink if it exists
if (removeMainSymlink) {
  try {
    fs.unlinkSync(atSymlink);
    console.log(`✅ Enlace simbólico principal eliminado: ${atSymlink}`);
  } catch (err) {
    console.error(`❌ Error al eliminar el enlace simbólico principal:`, err);
  }
}

// Create client/src/assets if it doesn't exist
const assetsDir = path.join(clientSrcDir, 'assets');
if (!fs.existsSync(assetsDir)) {
  try {
    fs.mkdirSync(assetsDir, { recursive: true });
    console.log(`✅ Directorio assets creado: ${assetsDir}`);
  } catch (err) {
    console.error(`❌ Error al crear el directorio assets:`, err);
  }
}

// Check for circular symlinks in client/src
for (const dirName of problematicPaths) {
  const dirPath = path.join(clientSrcDir, dirName);
  
  try {
    const stats = fs.lstatSync(dirPath);
    if (stats.isSymbolicLink()) {
      const target = fs.readlinkSync(dirPath);
      console.log(`Encontrado enlace circular potencial: ${dirPath} -> ${target}`);
      
      // Remove the symlink
      fs.unlinkSync(dirPath);
      console.log(`✅ Enlace simbólico eliminado: ${dirPath}`);
      
      // Create directory if it was pointing to itself or doesn't exist
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Directorio creado para reemplazar enlace: ${dirPath}`);
      }
    }
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error al verificar ${dirPath}:`, err);
    }
  }
}

// Create necessary stubs for imports
const stylesDir = path.join(clientSrcDir, 'styles');
if (!fs.existsSync(stylesDir)) {
  fs.mkdirSync(stylesDir, { recursive: true });
  
  // Create mobile-optimization.css
  fs.writeFileSync(
    path.join(stylesDir, 'mobile-optimization.css'),
    `/* Mobile optimization styles */
@media (max-width: 768px) {
  .mobile-responsive {
    width: 100%;
    flex-direction: column;
  }
}
`
  );
  console.log('✅ Creado archivo styles/mobile-optimization.css');
}

// Create firebase directory and index.ts
const firebaseDir = path.join(clientSrcDir, 'firebase');
if (!fs.existsSync(firebaseDir)) {
  fs.mkdirSync(firebaseDir, { recursive: true });
  
  // Create index.ts
  fs.writeFileSync(
    path.join(firebaseDir, 'index.ts'),
    `/**
 * Firebase module
 * Exports Firebase services from the main implementation
 */
export * from '../firebase';
`
  );
  console.log('✅ Creado archivo firebase/index.ts');
}

// Create lib/api directory and missing files
const apiDir = path.join(clientSrcDir, 'lib', 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
  
  // Create fal-ai.ts
  fs.writeFileSync(
    path.join(apiDir, 'fal-ai.ts'),
    `/**
 * Fal AI integration
 */
export async function generateImageWithFal({ prompt, negative_prompt = "", width = 512, height = 512, model = "dream-shaper-v8" }) {
  try {
    const response = await fetch('/api/proxy/fal-ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, negative_prompt, width, height, model }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error generating image with Fal AI:', error);
    throw error;
  }
}
`
  );
  console.log('✅ Creado archivo lib/api/fal-ai.ts');
  
  // Create openrouteraiagents.ts
  fs.writeFileSync(
    path.join(apiDir, 'openrouteraiagents.ts'),
    `/**
 * OpenRouter AI Agents
 */
export const AGENT_COLLECTIONS = {
  MANAGERS: 'ai-agents-managers',
  MARKETERS: 'ai-agents-marketers',
  COMPOSERS: 'ai-agents-composers',
  SOCIAL_MEDIA: 'ai-agents-social-media',
  MERCHANDISE: 'ai-agents-merchandise'
};

export async function getAgents(collectionName) {
  // Placeholder function that returns an empty array
  return [];
}
`
  );
  console.log('✅ Creado archivo lib/api/openrouteraiagents.ts');
}

console.log('✅ Limpieza de enlaces simbólicos completada');
console.log('🔄 Ahora puedes iniciar la aplicación con mayor estabilidad');