// Script para ejecutar Vite directamente
import { exec } from 'child_process';
import express from 'express';
import { createServer } from 'http';

const app = express();
const PORT = process.env.PORT || 5000;

// Configurar la ruta raíz para redireccionar a Vite
app.get('/', (req, res) => {
  res.redirect('http://localhost:5147');
});

// Iniciar el servidor Express
const server = createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor de redirección iniciado en http://0.0.0.0:${PORT}`);
});

// Iniciar Vite con configuración específica para funcionar en Replit
console.log('⚡ Iniciando servidor Vite...');
const viteProcess = exec('cd . && npx vite --host 0.0.0.0 --port 5147 --strictPort false --open src/pages/home.tsx');

viteProcess.stdout.on('data', (data) => {
  console.log(`Vite: ${data}`);
});

viteProcess.stderr.on('data', (data) => {
  console.error(`Vite Error: ${data}`);
});

viteProcess.on('close', (code) => {
  console.log(`Vite process exited with code ${code}`);
});