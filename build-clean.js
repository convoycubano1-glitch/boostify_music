// Script para construir la aplicación React limpiamente
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Asegurarnos de que existe la carpeta client/dist
const distPath = path.join(__dirname, 'client', 'dist');
if (!fs.existsSync(distPath)) {
  fs.mkdirSync(distPath, { recursive: true });
}

console.log('🔨 Iniciando construcción limpia de la aplicación...');

// Ejecutar el comando de construcción
const buildProcess = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: true
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Construcción completada exitosamente');
    
    // Manejar si queremos iniciar un servidor después
    if (process.argv.includes('--serve')) {
      console.log('🚀 Iniciando servidor de producción...');
      
      // Aquí podríamos iniciar el servidor de producción si lo deseamos
      // Por ahora solo mostramos un mensaje
      console.log('Para iniciar el servidor de producción, ejecuta: node production-server.js');
    }
  } else {
    console.error(`❌ Error en la construcción: código de salida ${code}`);
  }
});