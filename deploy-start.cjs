// Script de inicio para despliegue (CommonJS format)
const { exec } = require('child_process');
const express = require('express');
const path = require('path');
const fs = require('fs');

// Puerto para despliegue
const PORT = process.env.PORT || 3333;

// Verificar si existe la carpeta dist
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
  console.log('⚠️ La carpeta dist no existe. Ejecutando la construcción...');
  
  // Ejecutar build primero
  const build = exec('node build-for-deploy.js');
  
  build.stdout.on('data', (data) => {
    console.log(`Build: ${data}`);
  });
  
  build.stderr.on('data', (data) => {
    console.error(`Build Error: ${data}`);
  });
  
  build.on('close', (code) => {
    if (code === 0) {
      console.log('✅ Construcción completada. Iniciando servidor...');
      startServer();
    } else {
      console.error(`❌ Error en la construcción (código ${code})`);
      process.exit(1);
    }
  });
} else {
  // Si la carpeta dist ya existe, iniciar el servidor directamente
  console.log('📁 Carpeta dist encontrada. Iniciando servidor...');
  startServer();
}

// Función para iniciar el servidor
function startServer() {
  const app = express();
  
  // Middleware para compresión si está disponible
  try {
    const compression = require('compression');
    app.use(compression());
    console.log('✅ Compresión HTTP habilitada');
  } catch (error) {
    console.log('⚠️ El módulo de compresión no está disponible. Continuando sin compresión.');
  }
  
  // Servir archivos estáticos con caché
  app.use(express.static(path.join(__dirname, 'dist', 'client'), {
    maxAge: '1d', // Caché por 1 día
    immutable: true,
    etag: true,
  }));
  
  // Ruta de verificación de estado
  app.get('/health', (req, res) => {
    res.status(200).json({ 
      status: 'ok', 
      message: 'Servidor en producción funcionando correctamente',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    });
  });
  
  // Cualquier ruta no reconocida, servir el index.html (para SPA)
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'client', 'index.html'));
  });
  
  // Iniciar el servidor
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Servidor de producción ejecutándose en http://0.0.0.0:${PORT}`);
    console.log(`🌐 Aplicación desplegada y lista para uso`);
  });
}