// Archivo principal para desarrollo
console.log('Iniciando entorno de desarrollo...');

// Importar y ejecutar scripts de desarrollo
import { exec } from 'child_process';

// Ejecutar npm run dev
console.log('⚡ Ejecutando npm run dev...');
const dev = exec('npm run dev');

dev.stdout.on('data', (data) => {
  console.log(data);
});

dev.stderr.on('data', (data) => {
  console.error(data);
});

dev.on('close', (code) => {
  console.log(`Proceso terminado con código ${code}`);
});