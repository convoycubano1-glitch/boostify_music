// Script para iniciar el entorno de desarrollo con Vite por defecto
import { exec } from 'child_process';

console.log('⚡ Iniciando entorno de desarrollo con Vite...');
const dev = exec('cd client && vite --host 0.0.0.0 --port 5000');

dev.stdout.on('data', (data) => {
  console.log(`Vite: ${data}`);
});

dev.stderr.on('data', (data) => {
  console.error(`Vite Error: ${data}`);
});

dev.on('close', (code) => {
  console.log(`Proceso de Vite terminado con código ${code}`);
});