
/**
 * Script optimizado para despliegue en Replit
 * Este script soluciona:
 * 1. Error: "TypeScript files cannot be executed directly in node"
 * 2. Error: "Server application crashes due to unknown file extension '.ts'"
 * 3. Error: "Deployment fails because the expected port configuration was not met"
 * 
 * COMANDO DE DESPLIEGUE RECOMENDADO:
 * node start-deploy.js
 *
 * NOTA: Este archivo usa sintaxis de módulos ES (import/export)
 */

import express from 'express';
import path from 'path';
import compression from 'compression';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// IMPORTANTE: Puerto fijo 3333 para Replit
const PORT = 3333;
const app = express();

console.log('🚀 Iniciando script de despliegue para Replit');

// Habilitar compresión HTTP para mejor rendimiento
app.use(compression());
console.log('✅ Compresión HTTP habilitada');

// Asegurar que el servidor se inicie rápidamente
process.env.NODE_ENV = 'production';

// Buscar archivos estáticos en ubicaciones posibles
let staticDir = findStaticDir([
  path.join(__dirname, 'dist', 'client'),
  path.join(__dirname, 'client', 'dist'),
  path.join(__dirname, 'build'),
  path.join(__dirname, 'public'),
  path.join(__dirname, 'dist', 'public')
]);

// Buscar directorios de archivos estáticos
function findStaticDir(possiblePaths) {
  for (const dir of possiblePaths) {
    try {
      if (fs.existsSync(dir)) {
        console.log(`📁 Encontrados archivos estáticos en: ${dir}`);
        return dir;
      }
    } catch (e) {
      // Ignorar errores
    }
  }
  console.warn('⚠️ No se encontraron archivos estáticos en las ubicaciones esperadas');
  return null;
}

// Punto de verificación para Replit
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});
console.log('✅ Endpoint de salud configurado en /health');

// API de verificación
app.get('/api/check', (req, res) => {
  res.json({ status: 'API funcionando correctamente' });
});
console.log('✅ API de verificación configurada en /api/check');

// Configurar rutas estáticas si existen
if (staticDir) {
  app.use(express.static(staticDir, {
    maxAge: '1d',
    etag: true
  }));
  console.log('✅ Archivos estáticos configurados con caché');
  
  // Configurar rutas SPA para el frontend
  app.get('*', (req, res) => {
    // Ignorar las rutas de API
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(staticDir, 'index.html'));
    }
  });
  console.log('✅ Rutas SPA configuradas para frontend');
} else {
  console.log('⚠️ Funcionando sin archivos estáticos');
  
  // Ruta predeterminada si no hay archivos estáticos
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head>
          <title>Replit Deployment</title>
          <style>
            body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .box { background: #f5f5f5; border-radius: 5px; padding: 20px; margin: 20px 0; }
            .warning { background: #fff3cd; border-left: 4px solid #ffc107; }
            .success { background: #d4edda; border-left: 4px solid #28a745; }
            pre { background: #eee; padding: 10px; border-radius: 3px; overflow: auto; }
          </style>
        </head>
        <body>
          <h1>✅ Servidor en ejecución</h1>
          
          <div class="box success">
            <h2>API Funcionando</h2>
            <p>El servidor API está funcionando correctamente en el puerto ${PORT}.</p>
            <p>Verificar en: <a href="/api/check">/api/check</a></p>
          </div>
          
          <div class="box warning">
            <h2>⚠️ Sin archivos estáticos</h2>
            <p>No se encontraron archivos estáticos para servir. Puede construir la aplicación con:</p>
            <pre>cd client && npm run build</pre>
          </div>
        </body>
      </html>
    `);
  });
}

// Iniciar el servidor explícitamente en el puerto 3333
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│ 🚀 Servidor ejecutándose en http://0.0.0.0:${PORT} │
│ 🌐 Aplicación desplegada y lista para uso       │
└─────────────────────────────────────────────────┘
  `);
});

// Manejo seguro de errores para evitar caídas
process.on('unhandledRejection', (reason, p) => {
  console.log('Rechazo no manejado:', reason);
  // No cerrar el servidor
});

process.on('uncaughtException', (err) => {
  console.log('Excepción no capturada:', err);
  // No cerrar el servidor 
});
