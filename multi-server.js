// Servidor Express que sirve la aplicación React completa Y el servidor Vite
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { exec } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const app = express();

// Iniciar el servidor Vite en segundo plano
console.log('🚀 Iniciando servidor Vite en segundo plano...');
const viteServer = exec('cd client && npx vite --host 0.0.0.0 --port 5147');

viteServer.stdout.on('data', (data) => {
  console.log(`Vite: ${data.trim()}`);
});

viteServer.stderr.on('data', (data) => {
  console.error(`Vite Error: ${data.trim()}`);
});

// Ruta principal para servir una página de redirección
app.get('/', (req, res) => {
  console.log('Solicitud a la ruta raíz recibida');
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="0;url=https://ecb7959a-10a2-43c2-b3de-f9c2a2fb7282-00-5xhhuxyy3b9j.kirk.replit.dev:5147" />
  <title>Redirigiendo a Boostify Music</title>
  <style>
    body { 
      font-family: system-ui, sans-serif; 
      margin: 0;
      padding: 0;
      background-color: #1a1a2e;
      color: #e6e6e6;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      text-align: center;
    }
    .loader {
      width: 48px;
      height: 48px;
      border: 5px solid #FFF;
      border-bottom-color: #f97316;
      border-radius: 50%;
      display: inline-block;
      box-sizing: border-box;
      animation: rotation 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes rotation {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <span class="loader"></span>
  <h2>Redirigiendo a la aplicación completa de Boostify Music...</h2>
  <p>Si no eres redirigido automáticamente, <a href="https://ecb7959a-10a2-43c2-b3de-f9c2a2fb7282-00-5xhhuxyy3b9j.kirk.replit.dev:5147" style="color: #f97316; text-decoration: underline;">haz clic aquí</a>.</p>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
  console.log('Página de redirección enviada');
});

// Iniciar el servidor
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor Express iniciado exitosamente en http://0.0.0.0:${PORT}`);
  console.log(`✅ Servidor Vite en funcionamiento en puerto 5147`);
});