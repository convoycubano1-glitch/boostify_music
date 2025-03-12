/**
 * Script for fixing path alias imports by creating symlinks in node_modules
 * This ensures that imports with @/ syntax work correctly without modifying vite.config.ts
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the absolute path of the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define important paths
const rootDir = path.resolve(__dirname);
const clientSrcDir = path.join(rootDir, 'client', 'src');
const nodeModulesDir = path.join(rootDir, 'node_modules');

console.log('Creating missing directories if needed...');

// Create the styles directory if it doesn't exist
const stylesDir = path.join(clientSrcDir, 'styles');
if (!fs.existsSync(stylesDir)) {
  console.log('Creating styles directory...');
  fs.mkdirSync(stylesDir, { recursive: true });
  
  // Create a default CSS file
  fs.writeFileSync(path.join(stylesDir, 'mobile-optimization.css'), `
/* Mobile optimization styles */
@media (max-width: 768px) {
  .mobile-responsive {
    width: 100%;
    flex-direction: column;
  }
}
`);
}

// Create the firebase directory if it doesn't exist
const firebaseDir = path.join(clientSrcDir, 'firebase');
if (!fs.existsSync(firebaseDir)) {
  console.log('Creating firebase directory...');
  fs.mkdirSync(firebaseDir, { recursive: true });
  
  // Create a firebase.ts file that re-exports the real implementation
  const firebaseContent = `/**
 * Main Firebase module
 * This file re-exports the Firebase implementation from src/firebase.ts
 */
export * from '../firebase';
`;
  fs.writeFileSync(path.join(firebaseDir, 'index.ts'), firebaseContent);
  console.log('Created firebase/index.ts that re-exports from ../firebase.ts');
}

// Create lib/api directory if needed 
const apiDir = path.join(clientSrcDir, 'lib', 'api');
if (!fs.existsSync(apiDir)) {
  console.log('Creating lib/api directory...');
  fs.mkdirSync(apiDir, { recursive: true });
}

// Check and create the missing files in lib/api
const falAiPath = path.join(apiDir, 'fal-ai.ts');
if (!fs.existsSync(falAiPath)) {
  const falAiContent = `/**
 * Fal AI integration service
 * This service handles image generation with Fal AI
 */
export async function generateImageWithFal({ prompt, negative_prompt = "", width = 512, height = 512, model = "dream-shaper-v8" }) {
  try {
    const response = await fetch('/api/proxy/fal-ai/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        negative_prompt,
        width,
        height,
        model
      }),
    });

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error generating image with Fal AI:', error);
    throw error;
  }
}
`;
  fs.writeFileSync(falAiPath, falAiContent);
  console.log('Created lib/api/fal-ai.ts');
}

// Create openrouteraiagents.ts if it doesn't exist
const openrouterPath = path.join(apiDir, 'openrouteraiagents.ts');
if (!fs.existsSync(openrouterPath)) {
  const openrouterContent = `/**
 * OpenRouter AI Agents integration
 * Provides access to AI agents for various tasks
 */

export const AGENT_COLLECTIONS = {
  MANAGERS: 'ai-agents-managers',
  MARKETERS: 'ai-agents-marketers',
  COMPOSERS: 'ai-agents-composers',
  SOCIAL_MEDIA: 'ai-agents-social-media',
  MERCHANDISE: 'ai-agents-merchandise'
};

export async function getAgents(collectionName: string) {
  try {
    // In a real implementation, this would fetch from Firestore
    return [];
  } catch (error) {
    console.error('Error fetching agents:', error);
    return [];
  }
}
`;
  fs.writeFileSync(openrouterPath, openrouterContent);
  console.log('Created lib/api/openrouteraiagents.ts');
}

// Create the main alias symlink
const mainAliasPath = path.join(nodeModulesDir, '@');
let mainSymlinkExists = false;
try {
  const stats = fs.lstatSync(mainAliasPath);
  mainSymlinkExists = stats.isSymbolicLink();
  
  if (mainSymlinkExists) {
    const currentTarget = fs.readlinkSync(mainAliasPath);
    if (currentTarget !== clientSrcDir) {
      console.log(`Main symlink exists but points to ${currentTarget} instead of ${clientSrcDir}`);
      try {
        fs.unlinkSync(mainAliasPath);
        mainSymlinkExists = false;
      } catch (err) {
        console.error('Failed to remove existing symlink:', err);
      }
    } else {
      console.log(`Main symlink already points to the correct target: ${clientSrcDir}`);
    }
  }
} catch (err) {
  // Likely the symlink doesn't exist
  if (err.code !== 'ENOENT') {
    console.error('Error checking main symlink:', err);
  }
}

// Create the main alias symlink if it doesn't exist
if (!mainSymlinkExists) {
  try {
    console.log(`Creating main symlink: ${mainAliasPath} -> ${clientSrcDir}`);
    fs.symlinkSync(clientSrcDir, mainAliasPath, 'dir');
    console.log('Main symlink created successfully');
  } catch (err) {
    console.error('Error creating main symlink:', err);
  }
}

console.log('Aliases setup is complete');