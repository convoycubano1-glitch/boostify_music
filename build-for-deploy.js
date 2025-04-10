
/**
 * Production build script
 */
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Starting production build process...');

try {
  // Check if client directory exists
  if (!fs.existsSync('client')) {
    console.error('❌ Client directory not found');
    process.exit(1);
  }

  // Clean dist directory
  console.log('🧹 Cleaning dist directory...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist', { recursive: true });

  // Build the client with increased memory limit
  console.log('🏗️ Building client-side assets...');
  execSync('cd client && NODE_OPTIONS="--max-old-space-size=2048" npm run build', { 
    stdio: 'inherit',
    maxBuffer: 10 * 1024 * 1024 
  });

  // Create server directory and copy files
  console.log('🖥️ Copying server files...');
  fs.mkdirSync('dist/server', { recursive: true });
  execSync('cp -r server/* dist/server/');

  // Copy package.json
  console.log('📄 Copying package.json...');
  fs.copyFileSync('package.json', path.join('dist', 'package.json'));

  console.log('✅ Build completed successfully!');
  process.exit(0);
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
