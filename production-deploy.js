// Script para compilar y servir la aplicación en modo producción
import { exec } from 'child_process';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

console.log('🚀 Iniciando compilación para producción...');

// Paso 1: Compilar la aplicación React
const buildProcess = exec('cd client && npm run build');

buildProcess.stdout.on('data', (data) => {
  console.log(`Build: ${data.trim()}`);
});

buildProcess.stderr.on('data', (data) => {
  console.error(`Build Error: ${data.trim()}`);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Compilación exitosa - Iniciando servidor de producción');
    startProductionServer();
  } else {
    console.error(`❌ Error en la compilación con código ${code}`);
    process.exit(1);
  }
});

// Paso 2: Iniciar el servidor de producción cuando la compilación termine
function startProductionServer() {
  const app = express();
  const distPath = join(__dirname, 'client', 'dist');
  
  console.log(`Sirviendo archivos estáticos desde: ${distPath}`);
  
  // Servir archivos estáticos compilados
  app.use(express.static(distPath));
  
  // Para rutas SPA, siempre devolver index.html
  app.get('*', (req, res) => {
    res.sendFile(join(distPath, 'index.html'));
  });
  
  // Iniciar el servidor
  const server = createServer(app);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de producción iniciado en http://0.0.0.0:${PORT}`);
  });
}