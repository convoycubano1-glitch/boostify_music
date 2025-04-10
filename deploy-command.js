/**
 * Script unificado para despliegue en Replit
 * Este archivo combina la compilación y el despliegue
 * 
 * USAR ESTE ARCHIVO PARA DESPLIEGUE:
 * node deploy-command.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 Iniciando proceso de despliegue unificado para Replit');

// Asegurarse de que no haya errores de puertos
process.env.PORT = 3333;

// Función para ejecutar el servidor de despliegue
function startDeploymentServer() {
  console.log('📡 Iniciando servidor de despliegue...');
  const server = exec('node start-deploy.js');
  
  server.stdout.on('data', (data) => {
    console.log(`Server: ${data}`);
  });
  
  server.stderr.on('data', (data) => {
    console.error(`Server Error: ${data}`);
  });
  
  // No esperamos a que termine, ya que debe seguir ejecutándose
  console.log('✅ Servidor iniciado en segundo plano');
}

// Ejecutar primero la compilación del cliente
console.log('🔨 Intentando compilar cliente...');

const buildPath = path.join(__dirname, 'client', 'dist');
if (!fs.existsSync(buildPath)) {
  console.log('📁 No se encontró la carpeta client/dist, iniciando compilación...');
  
  const build = exec('cd client && npx vite build');
  
  let buildOutput = '';
  
  build.stdout.on('data', (data) => {
    buildOutput += data;
    console.log(`Build: ${data}`);
  });
  
  build.stderr.on('data', (data) => {
    console.error(`Build Error: ${data}`);
  });
  
  build.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Compilación del cliente completada exitosamente');
      
      // Si la compilación fue exitosa, iniciar el servidor
      startDeploymentServer();
    } else {
      console.error('❌ Error en la compilación del cliente');
      console.log('ℹ️ Iniciando servidor sin archivos estáticos compilados...');
      
      // Iniciar el servidor de todos modos, que manejará la falta de archivos estáticos
      startDeploymentServer();
    }
  });
} else {
  console.log('✅ Carpeta client/dist encontrada, omitiendo compilación');
  // Iniciar directamente el servidor
  startDeploymentServer();
}

// Evitar que el script principal termine
console.log('⏳ Servidor funcionando, esperando solicitudes...');
// No terminamos el proceso principal