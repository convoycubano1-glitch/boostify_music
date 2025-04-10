// Servidor específico para aplicaciones Vite
import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 5000;

async function createServer() {
  const app = express();
  
  // Crear un servidor Vite en modo middleware
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
    optimizeDeps: {
      // Forzar la inclusión de estas dependencias
      include: ['react', 'react-dom', 'wouter', '@tanstack/react-query']
    }
  });

  // Utilizar el middleware de Vite
  app.use(vite.middlewares);
  
  // Agregar middleware CORS para prevenir problemas de acceso
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });
  
  // Punto de verificación de salud para herramientas de despliegue
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Servidor Vite funcionando correctamente' });
    console.log('Respuesta enviada: 200 OK (Health Check)');
  });

  // Middleware para toda ruta SPA
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      // Leer el archivo HTML de entrada
      let template = fs.readFileSync(path.resolve(__dirname, 'index.html'), 'utf-8');
      
      // Aplicar transformaciones de Vite al HTML
      template = await vite.transformIndexHtml(url, template);
      
      // Enviar HTML transformado
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
      console.log(`Solicitud procesada: ${url}`);
    } catch (e) {
      // Si hay un error, dejamos que el middleware de Vite lo maneje
      vite.ssrFixStacktrace(e);
      console.error(`Error al procesar ${url}:`, e);
      next(e);
    }
  });

  // Iniciar el servidor
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor Vite iniciado exitosamente en http://0.0.0.0:${PORT}`);
  });
}

// Iniciar el servidor
createServer().catch((e) => {
  console.error('Error al iniciar el servidor Vite:', e);
  process.exit(1);
});