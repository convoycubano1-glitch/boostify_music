// Servidor de desarrollo con Vite
import { exec } from 'child_process';

// Iniciar Vite con configuración para modo desarrollo
console.log('⚡ Iniciando servidor Vite en modo desarrollo...');
const viteProcess = exec('npm run dev');

viteProcess.stdout.on('data', (data) => {
  console.log(`Vite: ${data}`);
});

viteProcess.stderr.on('data', (data) => {
  console.error(`Vite Error: ${data}`);
});

viteProcess.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
});