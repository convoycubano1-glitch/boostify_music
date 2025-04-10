// Script simplificado que solo inicia el cliente
import { spawn } from 'child_process';

console.log('🚀 Iniciando solo el cliente Vite...');
console.log('✅ Configurando para permitir todos los hosts...');

// Usar npx directamente para ejecutar el cliente
const clientProcess = spawn('cd client && node_modules/.bin/vite', [], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    VITE_DEV_SERVER_HOST: '0.0.0.0',
    VITE_ALLOW_HOSTS: 'all',
    VITE_HMR_HOST: 'all'
  }
});

clientProcess.on('error', (error) => {
  console.error('❌ Error al iniciar el cliente:', error.message);
  process.exit(1);
});

clientProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ El proceso del cliente se cerró con código: ${code}`);
    process.exit(code);
  }
});