// Script para construir y servir la aplicación en producción
import { exec } from 'child_process';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// Función para construir la aplicación
async function buildApp() {
  console.log('🔨 Construyendo la aplicación para producción...');
  
  return new Promise((resolve, reject) => {
    const buildProcess = exec('npm run build');
    
    buildProcess.stdout.on('data', (data) => {
      console.log(`Build: ${data}`);
    });
    
    buildProcess.stderr.on('data', (data) => {
      console.error(`Build Error: ${data}`);
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Construcción completada con éxito');
        resolve();
      } else {
        console.error(`❌ Error en la construcción (código ${code})`);
        reject(new Error(`La construcción falló con código ${code}`));
      }
    });
  });
}

// Función para servir la aplicación
function serveApp() {
  const app = express();
  
  // Servir archivos estáticos desde la carpeta de construcción
  app.use(express.static(path.join(__dirname, 'dist', 'client')));
  
  // Cualquier ruta no reconocida, servir el index.html (para SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'client', 'index.html'));
  });
  
  // Iniciar el servidor
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de producción ejecutándose en http://0.0.0.0:${PORT}`);
  });
}

// Construir y servir
async function main() {
  try {
    await buildApp();
    serveApp();
  } catch (error) {
    console.error('Error al preparar la aplicación:', error);
    process.exit(1);
  }
}

main();