// Script para construir la aplicación para producción
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔨 Iniciando proceso de construcción para producción...');

// Verificar si existe la carpeta dist y eliminarla si existe
if (fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('📁 Eliminando carpeta dist anterior...');
  fs.rmSync(path.join(__dirname, 'dist'), { recursive: true, force: true });
}

// Crear la carpeta dist
console.log('📁 Creando carpeta dist...');
fs.mkdirSync(path.join(__dirname, 'dist'));

// Construir el cliente
console.log('🏗️ Construyendo el cliente (Vite)...');
const clientBuild = exec('cd client && npx vite build');

clientBuild.stdout.on('data', (data) => {
  console.log(`Cliente: ${data}`);
});

clientBuild.stderr.on('data', (data) => {
  console.error(`Error Cliente: ${data}`);
});

clientBuild.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Construcción del cliente completada con éxito');
    
    // Copiar archivos estáticos a la carpeta dist
    console.log('📋 Copiando archivos estáticos...');
    
    // Copiar client/dist a dist/client
    copyFolder(path.join(__dirname, 'client', 'dist'), path.join(__dirname, 'dist', 'client'));
    
    console.log('🚀 Construcción para producción completada con éxito');
  } else {
    console.error(`❌ Error al construir el cliente (código ${code})`);
    process.exit(1);
  }
});

// Función para copiar una carpeta completa
function copyFolder(source, target) {
  // Crear la carpeta de destino si no existe
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  
  // Leer los archivos de la carpeta de origen
  const files = fs.readdirSync(source);
  
  // Copiar cada archivo/carpeta
  for (const file of files) {
    const sourcePath = path.join(source, file);
    const targetPath = path.join(target, file);
    
    // Si es una carpeta, llamar recursivamente
    if (fs.lstatSync(sourcePath).isDirectory()) {
      copyFolder(sourcePath, targetPath);
    } else {
      // Si es un archivo, copiarlo directamente
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}