// Script para iniciar el servidor Vite en puerto 3000
import { exec } from 'child_process';

console.log('🚀 Iniciando servidor Vite en puerto 3000...');

const vite = exec('cd client && npx vite --host 0.0.0.0 --port 3000');

vite.stdout.on('data', (data) => {
  console.log(`Vite: ${data}`);
});

vite.stderr.on('data', (data) => {
  console.error(`Vite Error: ${data}`);
});

vite.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
});