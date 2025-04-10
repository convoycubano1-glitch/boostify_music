// Servidor HTTP simple optimizado para Replit
const express = require('express');
const path = require('path');
const fs = require('fs');
const compression = require('compression');

// Puerto para despliegue en Replit - IMPORTANTE: Usar puerto 3333 para Replit
const PORT = process.env.PORT || 3333;
const app = express();

console.log('🚀 Iniciando servidor de producción en puerto', PORT);

// Habilitar compresión HTTP para mejorar rendimiento
app.use(compression());
console.log('✅ Compresión HTTP habilitada');

// Construir rutas de archivos estáticos
const clientDir = path.join(__dirname, 'client', 'dist');
const distClientDir = path.join(__dirname, 'dist', 'client');

// Determinar qué directorio usar para archivos estáticos
let staticDir = '';
if (fs.existsSync(distClientDir)) {
  staticDir = distClientDir;
  console.log('📁 Usando archivos de dist/client');
} else if (fs.existsSync(clientDir)) {
  staticDir = clientDir;
  console.log('📁 Usando archivos de client/dist');
} else {
  console.error('❌ No se encontraron archivos estáticos. Ejecuta primero "cd client && npm run build"');
  process.exit(1);
}

// Configuración para servir archivos estáticos con caché
app.use(express.static(staticDir, {
  maxAge: '1d',
  immutable: true,
  etag: true,
}));
console.log('✅ Archivos estáticos configurados con caché');

// Ruta de verificación de estado
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Servidor en producción funcionando correctamente',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});
console.log('✅ Endpoint de estado configurado en /health');

// Responder a cualquier otra ruta con index.html (para SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(staticDir, 'index.html'));
});
console.log('✅ Todas las rutas configuradas para SPA');

// Iniciar el servidor inmediatamente para Replit
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│ 🚀 Servidor ejecutándose en http://0.0.0.0:${PORT} │
│ 🌐 Aplicación desplegada y lista para uso       │
└─────────────────────────────────────────────────┘
  `);
});