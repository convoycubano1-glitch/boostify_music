// Script para iniciar tanto un servidor Express (5000) como Vite (5173)
import express from 'express';
import { createServer as createHttpServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { spawn } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Función para iniciar servidor Express en puerto 5000
async function startExpressServer() {
  // Crear una aplicación Express
  const app = express();
  const PORT = 5000;

  // Configurar cabeceras CORS para permitir acceso desde cualquier origen
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    
    // Responder a las solicitudes OPTIONS para CORS
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    
    next();
  });

  // Endpoint de salud para verificar si el servidor está funcionando
  app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Express server running' });
    console.log('Health check request received');
  });

  // Ruta raíz que redirige al servidor Vite
  app.get('/', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="refresh" content="0;url=https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:5173">
        <title>Redirección a Vite</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            margin: 0;
            padding: 20px;
            background-color: #1a1a2e;
            color: #e6e6e6;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          h1 { color: #f97316; }
          .container {
            max-width: 800px;
            background-color: rgba(255,255,255,0.05);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Boostify Music</h1>
          <p>Redirigiendo al servidor de desarrollo Vite (puerto 5173)...</p>
          <p>Si no eres redirigido automáticamente, haz clic <a href="https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:5173" style="color: #f97316;">aquí</a>.</p>
        </div>
      </body>
      </html>
    `);
  });

  // Para cualquier otra ruta, mostrar información
  app.get('*', (req, res) => {
    res.send(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Servidor Express</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            margin: 0;
            padding: 20px;
            background-color: #1a1a2e;
            color: #e6e6e6;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            text-align: center;
          }
          h1 { color: #f97316; }
          .container {
            max-width: 800px;
            background-color: rgba(255,255,255,0.05);
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 30px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Servidor Express en puerto 5000</h1>
          <p>Este es el servidor Express en el puerto 5000.</p>
          <p>Para ver la aplicación React completa con todos los estilos, accede al puerto 5173:</p>
          <p><a href="https://${process.env.REPL_SLUG}.${process.env.REPL_OWNER}.repl.co:5173" style="color: #f97316;">Abrir aplicación en puerto 5173</a></p>
        </div>
      </body>
      </html>
    `);
  });

  // Iniciar el servidor
  const server = createHttpServer(app);
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor Express iniciado exitosamente en http://0.0.0.0:${PORT}`);
  });
}

// Iniciar ambos servidores
async function startServers() {
  console.log('🚀 Iniciando servidores...');
  
  // Iniciar el servidor Express
  await startExpressServer();
  
  // Iniciar el servidor Vite usando el comando npx
  console.log('🚀 Iniciando servidor Vite en puerto 5173...');
  const viteProcess = spawn('npx', ['vite', '--host', '0.0.0.0', '--port', '5173'], {
    stdio: 'inherit',
    shell: true
  });
  
  viteProcess.on('error', (error) => {
    console.error('❌ Error al iniciar el servidor Vite:', error);
  });
}

startServers();