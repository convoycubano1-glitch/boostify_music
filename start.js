// Script para iniciar un servidor optimizado para servir archivos compilados en Replit
import { spawn } from 'child_process';

console.log('🚀 Iniciando servidor para archivos compilados en Replit...');
console.log('✅ Configurado específicamente para servir la carpeta client/dist');

// Establecer variables de entorno para garantizar el funcionamiento
process.env.PORT = '5000';

// Iniciar el servidor optimizado para archivos compilados
const serverProcess = spawn('node', ['dist-server.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    // Variables necesarias para un correcto funcionamiento
    PORT: '5000',
    NODE_ENV: 'production'
  }
});

// Manejar errores
serverProcess.on('error', (error) => {
  console.error('❌ Error al iniciar el servidor:', error.message);
  process.exit(1);
});

// Manejar cierre del proceso
serverProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ El proceso del servidor se cerró con código: ${code}`);
    process.exit(code);
  }
});