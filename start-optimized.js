// Script de inicio optimizado para evitar problemas en entorno de desarrollo
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Función para formatear tiempo en segundos
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs < 10 ? '0' + secs : secs}`;
}

console.log('⏳ Iniciando servidor optimizado...');
const startTime = Date.now();

// Verificar que el directorio client existe
if (!fs.existsSync(path.join(__dirname, 'client'))) {
  console.error('❌ Error: Directorio client no encontrado');
  process.exit(1);
}

// Iniciar solo el servidor Express
const serverProcess = spawn('node', ['--require', 'ts-node/register', 'server/index.ts'], {
  stdio: 'pipe',
  env: { ...process.env, PORT: '5000' }
});

serverProcess.stdout.on('data', (data) => {
  const output = data.toString();
  process.stdout.write(output);
  
  // Verificar si el servidor está listo
  if (output.includes('Server running at http')) {
    const elapsedTime = (Date.now() - startTime) / 1000;
    console.log(`✅ Servidor iniciado en ${formatTime(elapsedTime)}`);
    console.log('🔗 Servidor Express disponible en: http://localhost:5000');
  }
});

serverProcess.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

serverProcess.on('close', (code) => {
  console.log(`Proceso del servidor finalizado con código ${code}`);
});

// Capturar señales para cerrar procesos adecuadamente
process.on('SIGINT', () => {
  console.log('Cerrando servidor...');
  serverProcess.kill();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Cerrando servidor...');
  serverProcess.kill();
  process.exit(0);
});