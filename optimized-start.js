/**
 * Script optimizado de inicio para Boostify Music
 * Esta versión evita los problemas de pantalla negra y optimiza el rendimiento de carga
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import { spawn } from 'child_process';

// Get absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Iniciar servidor Express simple
const app = express();
const PORT = process.env.PORT || 5000;

// Configurar middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.static('client/public'));
app.use(express.json());

// Configurar rutas dinámicas
app.get('/_loading', (req, res) => {
  res.sendFile(path.join(__dirname, 'optimized-index.html'));
});

// Todas las demás rutas cargan el index.html principal
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar servidor Express
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor optimizado iniciado en puerto ${PORT}`);
  console.log(`📱 Accede a la aplicación en: https://workspace.replit.app`);

  // Iniciar Vite en segundo plano
  console.log('⚡ Iniciando Vite...');
  const viteProcess = startProcess('npx', ['vite'], 'VITE', '35');
  
  // Manejar cierre gracioso
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
  
  // Manejar stdout
  proc.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      console.log(`\x1b[${color}m[${prefix}] ${line}\x1b[0m`);
    });
  });
  
  // Manejar stderr
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
  
  // Manejar errores
  proc.on('error', (err) => {
    console.error(`\x1b[${color}m[${prefix} ERROR] Error al iniciar proceso: ${err.message}\x1b[0m`);
  });
  
  return proc;
}