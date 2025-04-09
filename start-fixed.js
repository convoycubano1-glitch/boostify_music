/**
 * Script simplificado para iniciar la aplicación Boostify Music
 * Diseñado para funcionar en entornos Replit con manejo de errores mejorado
 */

const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor de Boostify Music...');

// Middleware para servir archivos estáticos desde client/ o client/dist
if (require('fs').existsSync(path.join(__dirname, 'client', 'dist'))) {
  app.use(express.static(path.join(__dirname, 'client', 'dist')));
  console.log('✅ Sirviendo archivos desde client/dist');
} else {
  app.use(express.static(path.join(__dirname, 'client')));
  console.log('✅ Sirviendo archivos desde client');
}

// Ruta para comprobar estado
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Ruta para SPA
app.get('*', (req, res) => {
  if (require('fs').existsSync(path.join(__dirname, 'client', 'dist', 'index.html'))) {
    res.sendFile(path.join(__dirname, 'client', 'dist', 'index.html'));
  } else if (require('fs').existsSync(path.join(__dirname, 'client', 'index.html'))) {
    res.sendFile(path.join(__dirname, 'client', 'index.html'));
  } else {
    res.send('Boostify Music - El archivo index.html no se encontró');
  }
});

// Manejo de errores para evitar crash loop
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err);
  // No terminamos el proceso
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Rechazo de promesa no manejado:', reason);
  // No terminamos el proceso
});

// Iniciar servidor con manejo de errores
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor iniciado correctamente - http://localhost:${PORT}`);
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('Error del servidor:', err);
  // Intentar reiniciar en caso de error
  setTimeout(() => {
    try {
      server.close();
      server.listen(PORT, '0.0.0.0');
    } catch (e) {
      console.error('Error al intentar reiniciar el servidor:', e);
    }
  }, 1000);
});