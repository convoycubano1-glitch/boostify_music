// Script completo para desplegar la aplicación en producción
import { exec } from 'child_process';

console.log('🚀 Iniciando despliegue de la aplicación...');

// Paso 1: Construir la aplicación
console.log('🔨 Paso 1: Construyendo la aplicación...');
const build = exec('npm run build');

build.stdout.on('data', (data) => {
  console.log(`Build: ${data}`);
});

build.stderr.on('data', (data) => {
  console.error(`Build Error: ${data}`);
});

build.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Construcción completada con éxito');
    
    // Paso 2: Iniciar el servidor de producción
    console.log('🌐 Paso 2: Iniciando servidor de producción...');
    const server = exec('node server-prod.js');
    
    server.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });
    
    server.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });
    
    server.on('close', (serverCode) => {
      if (serverCode === 0) {
        console.log('✅ Servidor finalizado correctamente');
      } else {
        console.error(`❌ Error en el servidor (código ${serverCode})`);
      }
    });
  } else {
    console.error(`❌ Error en la construcción (código ${code})`);
  }
});