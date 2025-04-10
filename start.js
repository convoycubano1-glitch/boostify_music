// Script simplificado para iniciar la aplicación
// Configuramos las variables de entorno para permitir todos los hosts
import { spawn } from 'child_process';

// Establecer variables de entorno para Vite
process.env.VITE_DEV_SERVER_HOST = '0.0.0.0';
process.env.VITE_ALLOW_HOSTS = 'all';
process.env.VITE_HMR_HOST = 'all';

console.log('✅ Configurando variables para permitir todos los hosts');
console.log('🚀 Iniciando la aplicación con npm run dev...');

// Ejecutar el servidor de desarrollo con npm run dev
const devProcess = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    VITE_DEV_SERVER_HOST: '0.0.0.0',
    VITE_ALLOW_HOSTS: 'all',
    VITE_HMR_HOST: 'all'
  }
});

devProcess.on('error', (error) => {
  console.error('❌ Error al iniciar la aplicación:', error.message);
  process.exit(1);
});

devProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ El proceso se cerró con código: ${code}`);
    process.exit(code);
  }
});