const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'client')));

// Ruta para comprobar estado (health check)
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Ruta para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Manejo específico de errores para evitar crash loop
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  // Evitamos que la aplicación se cierre
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo de promesa no manejado:', reason);
  // Evitamos que la aplicación se cierre
});

// Iniciar servidor con manejo de errores
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor iniciado en http://localhost:${PORT}`);
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('Error del servidor:', err);
  // Intentar reiniciar después de un error
  setTimeout(() => {
    server.close();
    server.listen(PORT, '0.0.0.0');
  }, 1000);
});