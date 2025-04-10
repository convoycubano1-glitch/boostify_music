// Este script inicia tanto el servidor Express como el servidor Vite en desarrollo
import { spawn } from 'child_process';
import { createServer } from 'http';
import express from 'express';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Obtener el directorio actual
const __dirname = dirname(fileURLToPath(import.meta.url));

// Crear un servidor Express para redirigir al puerto correcto
const app = express();
const PORT = process.env.PORT || 5000;

// Información sobre los servidores
const VITE_PORT = 5173;
const EXPRESS_PORT = 5000;

console.log('🚀 Iniciando servidores múltiples para Boostify...');

// Iniciar servidor Vite en modo desarrollo
console.log('📦 Iniciando servidor Vite en puerto ' + VITE_PORT + '...');
const viteProcess = spawn('npx', ['vite'], {
  stdio: 'inherit',
  shell: true
});

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

// Endpoint de verificación de salud
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Multi-server setup running',
    servers: {
      express: `http://0.0.0.0:${EXPRESS_PORT}`,
      vite: `http://0.0.0.0:${VITE_PORT}`
    }
  });
});

// Ruta principal que redirige al servidor Vite
app.get('/', (req, res) => {
  console.log('Redirección a servidor Vite solicitada');
  res.redirect(`https://${process.env.REPLIT_SLUG}.${process.env.REPL_OWNER}.repl.co:${VITE_PORT}`);
});

// Para cualquier otra ruta, mostrar info sobre los servidores
app.get('*', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Boostify Music - Servidores</title>
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
        .server-link {
          display: inline-block;
          background-color: #f97316;
          color: white;
          padding: 10px 20px;
          margin: 10px;
          border-radius: 5px;
          text-decoration: none;
          font-weight: bold;
        }
        .server-link:hover {
          background-color: #ea580c;
        }
      </style>
    </head>
    <body>
      <h1>Boostify Music</h1>
      <div class="container">
        <h2>Información de Servidores</h2>
        <p>Ambos servidores están funcionando. Por favor selecciona uno:</p>
        
        <a href="http://0.0.0.0:${VITE_PORT}" class="server-link">
          Servidor Vite (Puerto ${VITE_PORT})
        </a>
        
        <a href="http://0.0.0.0:${EXPRESS_PORT}" class="server-link">
          Servidor Express (Puerto ${EXPRESS_PORT})
        </a>
        
        <p>Para ver la plataforma completa con todos los estilos, usa el servidor Vite (Puerto ${VITE_PORT}).</p>
      </div>
    </body>
    </html>
  `);
});

// Iniciar el servidor Express
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor Express iniciado en http://0.0.0.0:${PORT}`);
  console.log(`ℹ️ Este servidor proporciona información y redireccionamiento`);
  console.log(`ℹ️ Para acceder a la plataforma completa, ve a http://0.0.0.0:${VITE_PORT}`);
});

// Manejo de cierre del proceso
process.on('SIGINT', () => {
  console.log('Cerrando servidores...');
  viteProcess.kill();
  server.close();
  process.exit();
});

// Manejar errores del proceso Vite
viteProcess.on('error', (error) => {
  console.error('Error en el servidor Vite:', error);
});

viteProcess.on('close', (code) => {
  console.log(`El servidor Vite se ha cerrado con código ${code}`);
  // Si Vite se cierra, también cerramos el servidor Express
  server.close();
  process.exit();
});