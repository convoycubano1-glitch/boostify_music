/**
 * Script para configurar alias @ correctamente
 * Implementa una solución mínima y estable
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

console.log('🔧 Configurando alias principal @...');

// Create @ directory in node_modules
const atDir = path.join(nodeModulesDir, '@');
if (!fs.existsSync(atDir)) {
  fs.mkdirSync(atDir, { recursive: true });
  console.log(`✅ Directorio @ creado: ${atDir}`);
}

// Create package.json to make @ work as an alias to client/src
const packageJson = {
  name: '@',
  version: '1.0.0',
  main: '../client/src/index.js',
  types: '../client/src/index.d.ts'
};

fs.writeFileSync(
  path.join(atDir, 'package.json'),
  JSON.stringify(packageJson, null, 2)
);
console.log('✅ Configurado package.json para alias @');

// Create stubs for specific imports
console.log('🔧 Creando stubs para importaciones específicas...');

// Create firebase stub for @/firebase
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
  console.log('✅ Creado archivo firebase/index.ts para @/firebase');
}

// Create styles directory and mobile-optimization.css if needed
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

// Create lib/api directory and missing files
const apiDir = path.join(clientSrcDir, 'lib', 'api');
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
  
  // Ensure fal-ai.ts exists
  const falAiPath = path.join(apiDir, 'fal-ai.ts');
  if (!fs.existsSync(falAiPath)) {
    fs.writeFileSync(
      falAiPath,
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
  }
  
  // Ensure openrouteraiagents.ts exists
  const openrouterPath = path.join(apiDir, 'openrouteraiagents.ts');
  if (!fs.existsSync(openrouterPath)) {
    fs.writeFileSync(
      openrouterPath,
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
}

console.log('✅ Configuración de alias completada');
console.log('🔄 Ahora puedes iniciar la aplicación');