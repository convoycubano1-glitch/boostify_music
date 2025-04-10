// Script para iniciar el despliegue (CommonJS format)
const { exec } = require('child_process');

console.log('🚀 Iniciando despliegue de la aplicación...');

// Primero construir con build-for-deploy.cjs
const build = exec('node build-for-deploy.cjs');

build.stdout.on('data', (data) => {
  console.log(`Build: ${data}`);
});

build.stderr.on('data', (data) => {
  console.error(`Build Error: ${data}`);
});

build.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Construcción completada con éxito');
    
    // Luego iniciar el servidor
    const server = exec('node deploy-start.cjs');
    
    server.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });
    
    server.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });
    
    server.on('close', (serverCode) => {
      if (serverCode !== 0) {
        console.error(`❌ Servidor terminado con código de error ${serverCode}`);
      } else {
        console.log('✅ Servidor finalizado correctamente');
      }
    });
  } else {
    console.error(`❌ Error en la construcción (código ${code})`);
    process.exit(1);
  }
});