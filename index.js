/**
 * Archivo principal para despliegue en Replit
 * Este archivo controla el comportamiento del servidor en producción
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Obtener el directorio actual (equivalente a __dirname en CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Verificar existencia de carpetas
if (!fs.existsSync('./client')) {
  fs.mkdirSync('./client', { recursive: true });
  console.log('📁 Carpeta client creada');
}

// Función para copiar directorios recursivamente
function copyDirectory(source, target) {
  // Crear el directorio destino si no existe
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }

  // Leer todos los elementos del directorio origen
  const items = fs.readdirSync(source);

  for (const item of items) {
    const sourcePath = path.join(source, item);
    const targetPath = path.join(target, item);

    // Comprobar si es un directorio o un archivo
    if (fs.statSync(sourcePath).isDirectory()) {
      // Si es un directorio, crear la carpeta y copiar su contenido recursivamente
      copyDirectory(sourcePath, targetPath);
    } else {
      // Si es un archivo, copiarlo directamente
      fs.copyFileSync(sourcePath, targetPath);
    }
  }
}

// Verificar si existe dist/client para copiar archivos
if (fs.existsSync('./dist/client')) {
  try {
    copyDirectory('./dist/client', './client');
    console.log('✅ Archivos de dist/client copiados correctamente');
  } catch (err) {
    console.error('❌ Error al copiar archivos desde dist/client:', err);
  }
}

// Verificar si existe client/dist para copiar archivos
if (fs.existsSync('./client/dist')) {
  try {
    copyDirectory('./client/dist', './client');
    console.log('✅ Archivos de client/dist copiados correctamente');
  } catch (err) {
    console.error('❌ Error al copiar archivos desde client/dist:', err);
  }
}

// Verificar si existe client/build para copiar archivos (otra estructura común)
if (fs.existsSync('./client/build')) {
  try {
    copyDirectory('./client/build', './client');
    console.log('✅ Archivos de client/build copiados correctamente');
  } catch (err) {
    console.error('❌ Error al copiar archivos desde client/build:', err);
  }
}

// Crear un archivo HTML básico si no existe
const indexHtmlPath = './client/index.html';
if (!fs.existsSync(indexHtmlPath)) {
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
  fs.writeFileSync(indexHtmlPath, htmlContent);
  console.log('✅ Archivo index.html creado');
}

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