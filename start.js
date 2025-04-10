// Archivo principal para iniciar la aplicación
import express from 'express';
import { createServer } from 'http';
import { spawn } from 'child_process';

// Crear un servidor Express en el puerto 5000 (requerido por Replit)
const app = express();
const PORT = 5000;

console.log('🚀 Iniciando servidores para Boostify Music...');

// Configurar el servidor Express
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Configurar ruta principal
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <meta http-equiv="refresh" content="0;url=https://${process.env.REPL_SLUG}-5173.${process.env.REPL_OWNER}.repl.co">
      <title>Redireccionando a Boostify Music</title>
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
        .link {
          display: inline-block;
          background-color: #f97316;
          color: white;
          padding: 15px 30px;
          margin: 20px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
          font-size: 16px;
        }
      </style>
    </head>
    <body>
      <h1>Boostify Music</h1>
      <div class="container">
        <h2>Redireccionando...</h2>
        <p>Te estamos redireccionando a la aplicación en el puerto 5173.</p>
        <p>Si no eres redireccionado automáticamente, haz clic en el siguiente enlace:</p>
        <a href="https://${process.env.REPL_SLUG}-5173.${process.env.REPL_OWNER}.repl.co" class="link">
          Ir a Boostify Music
        </a>
      </div>
    </body>
    </html>
  `);
});

// Configurar otras rutas
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servers running', vite: 'http://0.0.0.0:5173' });
});

// Iniciar servidor Express en puerto 5000
const server = createServer(app);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor Express iniciado en http://0.0.0.0:${PORT}`);
  
  // Una vez que el servidor Express está funcionando (obligatorio para Replit),
  // iniciar Vite en puerto 5173
  console.log('🚀 Iniciando Vite en puerto 5173...');
  
  // Iniciar servidor Vite en puerto 5173
  const viteProcess = spawn('npx', ['vite', '--port', '5173', '--host'], {
    stdio: 'inherit',
    shell: true
  });
  
  // Manejar eventos del proceso Vite
  viteProcess.on('error', (error) => {
    console.error('Error al iniciar Vite:', error);
  });
  
  viteProcess.on('close', (code) => {
    console.log(`Vite se cerró con código ${code}`);
    // No cerramos el servidor Express porque Replit lo necesita para mantenerse activo
  });
});