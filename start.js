// Archivo principal para desarrollo
console.log('Iniciando cliente Vite directamente...');

// Importar y ejecutar solo el cliente Vite
import { exec } from 'child_process';

// Ejecutar solo el cliente Vite
console.log('⚡ Ejecutando cliente Vite en el puerto 5000...');
const vite = exec('cd client && vite --host 0.0.0.0 --port 5000 --strictPort false');

vite.stdout.on('data', (data) => {
  console.log(`Vite: ${data}`);
});

vite.stderr.on('data', (data) => {
  console.error(`Vite Error: ${data}`);
});

vite.on('close', (code) => {
  console.log(`Proceso de Vite terminado con código ${code}`);
});