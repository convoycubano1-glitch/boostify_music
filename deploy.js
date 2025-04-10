// Script super-simplificado para despliegue en Replit
const express = require('express');
const path = require('path');
const compression = require('compression');

// Puerto FIJO para despliegue en Replit
const PORT = 3333;
const app = express();

// Habilitar compresión HTTP
app.use(compression());

// Punto de verificación para Replit
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Intentar servir archivos estáticos si existen
const possiblePaths = [
  path.join(__dirname, 'dist', 'client'),
  path.join(__dirname, 'client', 'dist'),
  path.join(__dirname, 'public')
];

let staticDir = '';
for (const dir of possiblePaths) {
  try {
    if (require('fs').existsSync(dir)) {
      staticDir = dir;
      console.log(`Sirviendo archivos estáticos desde: ${dir}`);
      break;
    }
  } catch (e) {
    // Ignorar errores
  }
}

if (staticDir) {
  // Servir archivos estáticos
  app.use(express.static(staticDir));
  
  // Ruta para SPA
  app.get('*', (req, res) => {
    res.sendFile(path.join(staticDir, 'index.html'));
  });
} else {
  // Respuesta predeterminada si no hay archivos estáticos
  app.get('*', (req, res) => {
    res.send('¡Aplicación en preparación! Los archivos estáticos aún no están disponibles.');
  });
}

// Iniciar servidor inmediatamente
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor ejecutándose en puerto ${PORT}`);
});

// Manejo seguro de errores
process.on('unhandledRejection', (reason, p) => {
  console.log('Rechazo no manejado en:', p, 'razón:', reason);
});

process.on('uncaughtException', (err) => {
  console.log('Excepción no capturada:', err);
  // No cerrar el servidor para que Replit pueda seguir detectándolo
});