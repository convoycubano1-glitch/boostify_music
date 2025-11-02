// Archivo principal para ejecutar el servidor completo (backend + frontend)
import { spawn } from 'child_process';

console.log('⚡ Iniciando servidor completo (Express + Vite)...');

// Ejecutar el servidor con tsx (TypeScript runner)
const server = spawn('npx', ['tsx', 'server/index.ts'], {
  stdio: 'inherit',
  shell: true
});

server.on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Servidor terminado con código ${code}`);
  process.exit(code || 0);
});