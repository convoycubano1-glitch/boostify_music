/**
 * Script para compilar el cliente para despliegue
 * Este script maneja la compilación del cliente y soluciona 
 * problemas comunes de TypeScript/ESM en Replit
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Iniciando compilación del cliente...');

// Comprobar si existe client/dist y borrar si es necesario
const clientDistPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  console.log('🧹 Limpiando directorio client/dist previo...');
  try {
    fs.rmSync(clientDistPath, { recursive: true, force: true });
    console.log('✅ Directorio client/dist eliminado');
  } catch (err) {
    console.error('❌ Error al limpiar directorio client/dist:', err);
  }
}

// Ejecutar vite build para compilar el cliente
console.log('🏗️ Ejecutando Vite para construir el cliente...');
const buildProcess = exec('cd client && npx vite build');

buildProcess.stdout.on('data', (data) => {
  console.log(`Build: ${data}`);
});

buildProcess.stderr.on('data', (data) => {
  console.error(`Error: ${data}`);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Compilación del cliente completada con éxito');
    console.log('📂 Verificando archivos generados...');
    
    // Verificar si se generaron los archivos
    if (fs.existsSync(clientDistPath)) {
      try {
        const files = fs.readdirSync(clientDistPath);
        console.log(`📄 ${files.length} archivos generados en client/dist`);
        
        // Comprobar si existe index.html
        if (fs.existsSync(path.join(clientDistPath, 'index.html'))) {
          console.log('✅ index.html encontrado en client/dist');
        } else {
          console.warn('⚠️ No se encontró index.html en client/dist');
        }
        
        console.log('🚀 Construcción completada. Ahora puedes ejecutar:');
        console.log('   node start-deploy.js');
      } catch (err) {
        console.error('❌ Error al leer el directorio client/dist:', err);
      }
    } else {
      console.error('❌ No se encontró el directorio client/dist después de la compilación');
    }
  } else {
    console.error(`❌ Error durante la compilación (código ${code})`);
    console.log('💡 Sugerencia: Intenta ejecutar manualmente "cd client && npx vite build"');
  }
});