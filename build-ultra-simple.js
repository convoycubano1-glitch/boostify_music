// Script ultra simplificado para construir solo lo esencial
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Iniciando construcción ultra simplificada...');

// Eliminar carpetas existentes
if (fs.existsSync(path.join(__dirname, 'client', 'dist'))) {
  console.log('🗑️ Eliminando carpeta client/dist existente...');
  fs.rmSync(path.join(__dirname, 'client', 'dist'), { recursive: true, force: true });
}

// Asegurarse de que exista la carpeta client/dist
fs.mkdirSync(path.join(__dirname, 'client', 'dist'), { recursive: true });

try {
  // Ejecutar build de forma sincronizada para evitar timeouts
  console.log('🔨 Compilando aplicación React con Vite...');
  execSync('cd client && npx vite build', {
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' }
  });
  
  console.log('✅ Construcción completada con éxito');
  console.log('📂 Archivos generados en client/dist');
} catch (error) {
  console.error('❌ Error durante la construcción:', error.message);
  process.exit(1);
}