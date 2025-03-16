/**
 * Script optimizado para evitar problemas de pantalla negra
 * Esta versión utiliza el servidor simplificado para garantizar
 * que la interfaz de usuario cargue correctamente
 */

import { spawn } from 'child_process';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

// Get absolute paths
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Crear servidor Express simple para evitar problemas de carga
const app = express();
const PORT = 5000;

// Aplicar middlewares
app.use(cors());
app.use(express.static(path.join(__dirname, 'client', 'public')));
app.use(express.json());

// Servir el HTML simplificado en todas las rutas
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Iniciar el servidor Express
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor estable iniciado en el puerto ${PORT}`);
  console.log('📱 Accede a la aplicación en: https://workspace.replit.app');
  
  // Iniciar Vite en segundo plano para desarrollo
  console.log('⚡ Iniciando Vite...');
  startProcess('npx', ['vite'], 'VITE', '35');
});

// Manejar cierre gracioso
process.on('SIGINT', () => {
  console.log('\nCerrando el servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

// Función para iniciar un nuevo proceso
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