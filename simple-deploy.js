// Script simple para hacer build y servir la aplicación
import { exec } from 'child_process';
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;

console.log('🚀 Iniciando build simple para producción...');

// Ejecutar build directo en la carpeta client
const buildProcess = exec('cd client && npx vite build');

buildProcess.stdout.on('data', (data) => {
  console.log(`Build output: ${data.trim()}`);
});

buildProcess.stderr.on('data', (data) => {
  console.error(`Build error: ${data.trim()}`);
});

buildProcess.on('close', (code) => {
  if (code === 0) {
    console.log('✅ Build completado - Iniciando servidor de producción');
    
    // Iniciar el servidor de producción
    const app = express();
    const distPath = join(__dirname, 'client', 'dist');
    
    // Servir archivos estáticos
    app.use(express.static(distPath));
    
    // Para cualquier ruta no encontrada, servir index.html (SPA)
    app.get('*', (req, res) => {
      res.sendFile(join(distPath, 'index.html'));
    });
    
    // Iniciar el servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Servidor de producción iniciado en http://0.0.0.0:${PORT}`);
    });
  } else {
    console.error(`❌ Build falló con código ${code}`);
    process.exit(1);
  }
});