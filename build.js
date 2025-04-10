// Script de construcción
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Iniciando proceso de construcción...');

// Limpiar directorio dist si existe
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('🧹 Limpiando directorio dist...');
  fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
}

// Crear directorio dist
fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });

// Construir frontend
console.log('🏗️ Construyendo frontend...');
try {
  execSync('cd client && vite build', { stdio: 'inherit' });
  console.log('✅ Frontend construido exitosamente');
} catch (error) {
  console.error('❌ Error al construir el frontend:', error);
  process.exit(1);
}

// Copiar archivos de cliente a dist
console.log('📋 Copiando archivos de cliente a dist...');
fs.cpSync(path.join(__dirname, 'client', 'dist'), path.join(__dirname, 'dist'), { recursive: true });

console.log('🎉 Construcción completada exitosamente');
console.log('Para ejecutar el servidor de producción: node server.js');