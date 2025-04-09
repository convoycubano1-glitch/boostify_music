/**
 * Script simplificado para despliegue en Replit
 * Solo maneja el problema de crash loop sin modificar ningún contenido
 */

const express = require('express');
const path = require('path');
const fs = require('fs');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Iniciando servidor para Replit...');

// Función para detectar y servir los archivos originales
function setupStaticFiles() {
  // Primero intentar servir desde client/dist (build de producción original)
  if (fs.existsSync(path.join(__dirname, 'client', 'dist'))) {
    app.use(express.static(path.join(__dirname, 'client', 'dist')));
    console.log('✅ Sirviendo archivos originales desde client/dist');
    return true;
  }
  
  // Luego intentar servir desde dist/client
  if (fs.existsSync(path.join(__dirname, 'dist', 'client'))) {
    app.use(express.static(path.join(__dirname, 'dist', 'client')));
    console.log('✅ Sirviendo archivos originales desde dist/client');
    return true;
  }
  
  // Finalmente intentar servir desde client
  if (fs.existsSync(path.join(__dirname, 'client'))) {
    app.use(express.static(path.join(__dirname, 'client')));
    console.log('✅ Sirviendo archivos originales desde client');
    return true;
  }
  
  console.log('⚠️ No se encontraron archivos estáticos para servir');
  return false;
}

// Configurar los archivos estáticos
setupStaticFiles();

// Añadir ruta de health check para Replit (evita crash loop)
app.get('/_replit/healthcheck', (req, res) => {
  res.status(200).send('OK');
});

// Ruta principal para SPA - maneja cualquier ruta
app.get('*', (req, res) => {
  // Intenta encontrar el index.html original
  const indexPaths = [
    path.join(__dirname, 'client', 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'client', 'index.html'),
    path.join(__dirname, 'client', 'index.html')
  ];
  
  // Busca el primer index.html que exista
  for (const indexPath of indexPaths) {
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
  }
  
  // Si no encuentra ningún index.html, muestra un mensaje simple
  res.status(404).send('Application files not found. Please build the application first.');
});

// Manejo de errores para evitar crash loop
process.on('uncaughtException', (err) => {
  console.error('Error no capturado:', err.message);
  // No cerramos el proceso
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promesa rechazada no manejada:', reason);
  // No cerramos el proceso
});

// Iniciar servidor
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor iniciado en http://localhost:${PORT}`);
});