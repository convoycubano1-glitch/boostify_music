/**
 * Script optimizado para entorno Replit
 * Este script asegura que la aplicación cargue correctamente en Replit
 * manejando correctamente los problemas de Firebase y pantalla negra
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { spawn } from 'child_process';

// Get absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configurar servidor Express simple
const app = express();
const PORT = 5000;

// Aplicar middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'client', 'public')));
app.use(express.json());

// Servir el archivo HTML principal en todas las rutas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar el servidor Express optimizado
app.listen(PORT, () => {
  console.log(`✅ Servidor iniciado en el puerto ${PORT}`);
  console.log('📱 Accede a la aplicación en: https://boostify-music.replit.app');
  
  // Iniciar Vite en segundo plano
  console.log('⚡ Iniciando Vite...');
  const viteProcess = startProcess('npx', ['vite'], 'VITE', '35');
  
  // Configurar manejo de errores
  process.on('SIGINT', () => {
    console.log('\nCerrando procesos...');
    viteProcess.kill('SIGINT');
    process.exit(0);
  });
});

// Función para iniciar un proceso
function startProcess(command, args, prefix, color) {
  console.log(`\x1b[${color}m[${prefix}] Iniciando: ${command} ${args.join(' ')}\x1b[0m`);
  
  const proc = spawn(command, args, {
    stdio: 'pipe',
    shell: true
  });
  
  // Procesar salida estándar
  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`\x1b[${color}m[${prefix}] ${line}\x1b[0m`);
    });
  });
  
  // Procesar errores
  proc.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`\x1b[${color}m[${prefix} ERROR] ${line}\x1b[0m`);
    });
  });
  
  // Manejar cierre del proceso
  proc.on('close', (code) => {
    console.log(`\x1b[${color}m[${prefix}] Proceso finalizado con código ${code}\x1b[0m`);
  });
  
  // Manejar errores de ejecución
  proc.on('error', (err) => {
    console.error(`\x1b[${color}m[${prefix} ERROR] Error al iniciar proceso: ${err.message}\x1b[0m`);
  });
  
  return proc;
}