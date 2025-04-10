// Script completo para desplegar la aplicación en producción
import { exec } from 'child_process';

console.log('🚀 Iniciando despliegue de la aplicación...');

// Función principal para desplegar
async function deploy() {
  try {
    // Paso 1: Construir la aplicación
    await buildApp();
    
    // Paso 2: Iniciar el servidor de producción
    await startServer();
    
  } catch (error) {
    console.error('❌ Error durante el despliegue:', error.message);
    process.exit(1);
  }
}

// Función para construir la aplicación
function buildApp() {
  console.log('\n🔨 Paso 1: Construyendo la aplicación...');
  
  return new Promise((resolve, reject) => {
    const build = exec('node build-for-deploy.js');
    
    build.stdout.on('data', (data) => {
      console.log(`Build: ${data}`);
    });
    
    build.stderr.on('data', (data) => {
      console.error(`Build Error: ${data}`);
    });
    
    build.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Construcción completada con éxito');
        resolve();
      } else {
        reject(new Error(`Error en la construcción (código ${code})`));
      }
    });
  });
}

// Función para iniciar el servidor
function startServer() {
  console.log('\n🌐 Paso 2: Iniciando servidor de producción...');
  
  return new Promise((resolve, reject) => {
    const server = exec('node server-prod.js');
    
    server.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
    });
    
    server.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });
    
    // Resolvemos la promesa después de que el servidor haya iniciado
    // (no esperamos a que termine, ya que es un proceso continuo)
    setTimeout(() => {
      console.log('✅ Servidor iniciado correctamente');
      resolve();
    }, 2000);
    
    server.on('close', (serverCode) => {
      if (serverCode !== 0) {
        console.error(`❌ Servidor terminado con código de error ${serverCode}`);
      } else {
        console.log('✅ Servidor finalizado correctamente');
      }
    });
  });
}

// Iniciar el proceso de despliegue
deploy();