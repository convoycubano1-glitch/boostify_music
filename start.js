// Archivo principal para ejecutar el servidor completo (backend + frontend)
import { spawn } from 'child_process';

console.log('⚡ Iniciando servidor completo (Express + Vite)...');

// Forzar modo desarrollo para Replit
process.env.NODE_ENV = 'development';

// Ejecutar el servidor con nodemon (ya configurado en package.json)
const server = spawn('npm', ['run', 'server:dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env, NODE_ENV: 'development' }
});

server.on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error);
  process.exit(1);
});

server.on('exit', (code) => {
  console.log(`Servidor terminado con código ${code}`);
  process.exit(code || 0);
});