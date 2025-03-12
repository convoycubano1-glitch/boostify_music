/**
 * Script para iniciar el servidor con configuración optimizada para desarrollo
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure any problematic symlinks are fixed before starting
console.log('🔄 Verificando configuración de alias antes de iniciar...');

// Create the directory structure
try {
  // Clean any circular symlinks
  const clientSrcAssetsPath = path.join(__dirname, 'client', 'src', 'assets');
  if (fs.existsSync(clientSrcAssetsPath)) {
    const stats = fs.lstatSync(clientSrcAssetsPath);
    if (stats.isSymbolicLink()) {
      fs.unlinkSync(clientSrcAssetsPath);
      fs.mkdirSync(clientSrcAssetsPath, { recursive: true });
      console.log('✅ Enlace simbólico circular eliminado y reemplazado por directorio');
    }
  } else {
    fs.mkdirSync(clientSrcAssetsPath, { recursive: true });
    console.log('✅ Directorio assets creado');
  }
  
  // Ensure @ directory exists in node_modules with package.json
  const atDir = path.join(__dirname, 'node_modules', '@');
  const packageJsonPath = path.join(atDir, 'package.json');
  
  if (!fs.existsSync(atDir)) {
    fs.mkdirSync(atDir, { recursive: true });
  }
  
  if (!fs.existsSync(packageJsonPath)) {
    const packageJson = {
      name: '@',
      version: '1.0.0',
      main: '../../client/src/index.js',
      types: '../../client/src/index.d.ts'
    };
    
    fs.writeFileSync(
      packageJsonPath,
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ Configurado package.json para alias @');
  }
  
  console.log('✅ Configuración de alias verificada');
} catch (error) {
  console.error('❌ Error al configurar alias:', error);
}

// Function to format time
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

// Start the development server
console.log('🚀 Iniciando servidor de desarrollo...');

// Use the npm script to start the server
const npmDev = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Set a timer to show elapsed time
let elapsedSeconds = 0;
const timer = setInterval(() => {
  elapsedSeconds += 1;
  process.stdout.write(`\r⏱️  Tiempo transcurrido: ${formatTime(elapsedSeconds)}`);
}, 1000);

// Handle server process
npmDev.on('close', (code) => {
  clearInterval(timer);
  console.log(`\n🛑 Servidor finalizado con código: ${code}`);
});

process.on('SIGINT', () => {
  clearInterval(timer);
  npmDev.kill('SIGINT');
  process.exit(0);
});