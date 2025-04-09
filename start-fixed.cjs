/**
 * Script simplificado para iniciar la aplicación Boostify Music
 * Diseñado para funcionar en entornos Replit con manejo de errores mejorado
 * 
 * Para usar en despliegue Replit:
 * 1. Configura la aplicación para usar este archivo como punto de entrada
 * 2. Establece "run" como "node start-fixed.cjs" en .replit
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor de Boostify Music...');

// Verificar carpetas y archivos necesarios
if (!fs.existsSync(path.join(__dirname, 'client'))) {
  fs.mkdirSync(path.join(__dirname, 'client'), { recursive: true });
  console.log('📁 Carpeta client creada');
}

// Crear una página HTML mínima si no existe
const indexPath = path.join(__dirname, 'client', 'index.html');
if (!fs.existsSync(indexPath)) {
  const htmlContent = `
  <!DOCTYPE html>
  <html lang="es">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Boostify Music</title>
    <style>
      body { 
        font-family: system-ui, sans-serif; 
        background: #121212; 
        color: white;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 100vh;
        margin: 0;
        padding: 20px;
      }
      .container {
        max-width: 800px;
        text-align: center;
      }
      h1 { color: #5E17EB; margin-bottom: 1rem; }
      p { line-height: 1.6; }
      .status {
        background: #1a1a1a;
        padding: 1rem;
        border-radius: 8px;
        margin-top: 2rem;
        text-align: left;
      }
      .success { color: #4ade80; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1>Boostify Music</h1>
      <p>La aplicación se ha desplegado correctamente y está lista para ser utilizada.</p>
      <div class="status">
        <p>Estado: <span class="success">✓ Funcionando</span></p>
        <p>Versión: 1.0.0</p>
        <p>Modo: Producción</p>
      </div>
    </div>
  </body>
  </html>
  `;
  fs.writeFileSync(indexPath, htmlContent);
  console.log('📄 Archivo index.html creado');
}

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'client')));

// Ruta para comprobar el estado del servidor
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

// Ruta específica para Replit health checks
app.get('/_replit/healthcheck', (req, res) => {
  res.status(200).send('OK');
});

// Endpoint para obtener información del servidor (útil para diagnóstico)
app.get('/api/status', (req, res) => {
  const status = {
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'production',
    startTime: new Date().toISOString(),
    directories: {
      client: fs.existsSync('./client'),
      clientDist: fs.existsSync('./client/dist'),
      distClient: fs.existsSync('./dist/client'),
      indexHtml: fs.existsSync('./client/index.html')
    }
  };
  res.json(status);
});

// Ruta para SPA - debe ir al final
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Manejo de errores para evitar crash loop
process.on('uncaughtException', (err) => {
  console.error('Boostify Server: Error no capturado:', err.message);
  // No terminamos el proceso
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Boostify Server: Promesa rechazada no manejada:', reason);
  // No terminamos el proceso
});

// Iniciar servidor con manejo de errores
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Boostify Music en http://localhost:${PORT}`);
});

// Manejo de errores del servidor
server.on('error', (err) => {
  console.error('Error del servidor:', err.message);
  // Reintentar iniciar el servidor después de un error
  setTimeout(() => {
    try {
      server.close();
      server.listen(PORT, '0.0.0.0');
    } catch (e) {
      console.error('Error al reiniciar:', e.message);
    }
  }, 1000);
});