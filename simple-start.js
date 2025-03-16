/**
 * Script de inicio simplificado para evitar pantalla negra y errores de carga
 * Esta versión utiliza un servidor estático simple para asegurar
 * que la aplicación cargue correctamente
 */

const express = require('express');
const path = require('path');
const { spawn } = require('child_process');
const cors = require('cors');

// Crear app Express simple
const app = express();
const PORT = 5000;

// Habilitar CORS para todas las rutas
app.use(cors());

// Servir archivos estáticos desde la carpeta client/public
app.use(express.static(path.join(__dirname, 'client', 'public')));

// Parsear JSON
app.use(express.json());

// Middleware especial para manejo de errores
app.use((err, req, res, next) => {
  console.error('Error en la aplicación:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar el servidor principal
const server = app.listen(PORT, () => {
  console.log(`✅ Servidor simple iniciado en el puerto ${PORT}`);
  console.log('Accede a la aplicación en: https://workspace.replit.app');
});

// Configurar manejo de cierre limpio
process.on('SIGINT', () => {
  console.log('Cerrando servidor...');
  server.close(() => {
    console.log('Servidor cerrado');
    process.exit(0);
  });
});

// Iniciar el servidor Vite en segundo plano para desarrollo
console.log('⚡ Iniciando Vite en paralelo...');
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

viteProcess.on('close', (code) => {
  console.log(`Proceso Vite finalizado con código: ${code}`);
});

// Ruta principal que envía el HTML básico
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});