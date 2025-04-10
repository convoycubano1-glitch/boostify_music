
/**
 * Production build script
 */

import { execSync } from 'child_process';
import fs from 'fs';

console.log('🚀 Starting production build process...');

try {
  // Clean dist directory
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    execSync('rm -rf dist');
  }
  fs.mkdirSync('dist', { recursive: true });

  // Build the client
  console.log('🏗️ Building client-side assets...');
  execSync('cd client && npm run build', { stdio: 'inherit' });

  // Copy server files
  console.log('🖥️ Copying server files...');
  execSync('mkdir -p dist/server');
  execSync('cp -r server/* dist/server/');

  // Copy package.json
  console.log('📄 Copying package.json...');
  execSync('cp package.json dist/');

  console.log('✅ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
