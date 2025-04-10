// Script para ejecutar directamente Vite sin otros servidores
import { exec } from 'child_process';

// Ejecutar Vite directamente
console.log('⚡ Iniciando Vite para mostrar src/pages/home.tsx...');
const vite = exec('vite --host 0.0.0.0 --port 5000 --strictPort false --cors');

vite.stdout.on('data', (data) => {
  console.log(`Vite: ${data}`);
});

vite.stderr.on('data', (data) => {
  console.error(`Vite Error: ${data}`);
});

vite.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
});