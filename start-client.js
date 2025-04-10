// Script para iniciar solo el cliente con configuración que permite todos los hosts
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const configPath = path.join(__dirname, 'client', 'vite.config.allow-all.js');

console.log('✅ Iniciando cliente con configuración que permite todos los hosts');
console.log(`🔧 Usando configuración: ${configPath}`);

// Ejecutar Vite directamente con nuestra configuración personalizada
const clientProcess = spawn('npx', ['vite', '--config', configPath], {
  stdio: 'inherit',
  cwd: path.join(__dirname, 'client'),
  env: {
    ...process.env,
    VITE_DEV_SERVER_HOST: '0.0.0.0',
    VITE_ALLOW_HOSTS: 'all'
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