// Script para construir la aplicación y servir los archivos estáticos
import express from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { exec } from 'child_process';

// Obtener el directorio actual
const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🔨 Iniciando compilación y despliegue para producción...');

// Función para iniciar el servidor después de la compilación
function startProductionServer() {
  // Crear una aplicación Express
  const app = express();
  const PORT = process.env.PORT || 5000;

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
    res.status(200).json({ status: 'ok', message: 'Production server running' });
    console.log('Health check request received');
  });

  // Determinar la ruta de los archivos estáticos 
  // (usando la convención de estructura de carpetas de Vite)
  const staticPath = join(__dirname, 'dist');

  // Verificar si el directorio de compilación existe
  if (!fs.existsSync(staticPath)) {
    console.error(`⚠️ Directorio de compilación no encontrado en ${staticPath}`);
    console.error('Usando fallback a archivos estáticos de desarrollo...');
    
    // Servir una versión simplificada como fallback
    app.get('/', (req, res) => {
      res.send(`
        <!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Boostify Music - Production</title>
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
          <h1>Boostify Music</h1>
          <div class="container">
            <h2>Aplicación en modo producción</h2>
            <p>El servidor está funcionando correctamente pero los archivos estáticos no fueron encontrados.</p>
            <p>Ejecuta <code>npm run build</code> antes de iniciar el servidor de producción.</p>
          </div>
        </body>
        </html>
      `);
    });
  } else {
    // Configurar Express para servir archivos estáticos desde el directorio de compilación
    app.use(express.static(staticPath));

    // Ruta para cualquier solicitud que no coincida con un archivo estático
    app.get('*', (req, res) => {
      console.log(`Request received for path: ${req.url}`);
      
      // Devolver el archivo index.html para todas las rutas no encontradas
      // para permitir que el enrutador del lado del cliente maneje la navegación
      res.sendFile(join(staticPath, 'index.html'));
    });
  }

  // Iniciar el servidor
  const server = createServer(app);

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Servidor de producción iniciado en http://0.0.0.0:${PORT}`);
    if (fs.existsSync(staticPath)) {
      console.log(`📂 Sirviendo archivos estáticos desde: ${staticPath}`);
    }
  });
}

// Compilar la aplicación Vite
console.log('📦 Construyendo aplicación...');

// Ejecuta vite build
const buildProcess = exec('npx vite build');

buildProcess.stdout.on('data', (data) => {
  console.log(data);
});

buildProcess.stderr.on('data', (data) => {
  console.error(data);
});

buildProcess.on('exit', (code) => {
  if (code === 0) {
    console.log('✅ Aplicación construida con éxito');
    // Iniciar el servidor con los archivos compilados
    startProductionServer();
  } else {
    console.error(`❌ Error durante la compilación (código ${code})`);
    console.log('⚠️ Iniciando servidor sin los archivos compilados...');
    // Iniciar el servidor de todos modos para servir el mensaje de fallback
    startProductionServer();
  }
});