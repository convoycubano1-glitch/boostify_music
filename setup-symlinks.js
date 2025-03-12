/**
 * Script para configurar symlinks para resolución de rutas @/
 */
const fs = require('fs');
const path = require('path');

// Verificar si ya existe el directorio node_modules/@
const atPath = path.resolve(__dirname, 'node_modules', '@');
if (!fs.existsSync(atPath)) {
  console.log('Creando directorio node_modules/@');
  fs.mkdirSync(atPath, { recursive: true });
}

// Crear symlink desde node_modules/@ a client/src
const srcPath = path.resolve(__dirname, 'client', 'src');
const symlinkPath = path.resolve(atPath, 'src');

if (fs.existsSync(symlinkPath)) {
  console.log('Eliminando symlink anterior...');
  fs.unlinkSync(symlinkPath);
}

console.log(`Creando symlink de ${symlinkPath} a ${srcPath}`);
fs.symlinkSync(srcPath, symlinkPath, 'dir');

// Crear también un symlink para @/lib directamente
const libPath = path.resolve(__dirname, 'client', 'src', 'lib');
const libSymlinkPath = path.resolve(__dirname, 'node_modules', '@', 'lib');

if (fs.existsSync(libSymlinkPath)) {
  console.log('Eliminando symlink de lib anterior...');
  fs.unlinkSync(libSymlinkPath);
}

console.log(`Creando symlink de ${libSymlinkPath} a ${libPath}`);
fs.symlinkSync(libPath, libSymlinkPath, 'dir');

// Crear también un symlink para @/firebase 
const firebasePath = path.resolve(__dirname, 'client', 'src', 'firebase');
const firebaseSymlinkPath = path.resolve(__dirname, 'node_modules', '@', 'firebase');

if (fs.existsSync(firebaseSymlinkPath)) {
  console.log('Eliminando symlink de firebase anterior...');
  fs.unlinkSync(firebaseSymlinkPath);
}

console.log(`Creando symlink de ${firebaseSymlinkPath} a ${firebasePath}`);
fs.symlinkSync(firebasePath, firebaseSymlinkPath, 'dir');

console.log('Enlaces simbólicos creados correctamente.');