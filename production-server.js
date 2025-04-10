// Servidor Express para producción
import express from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Obtener el directorio actual
const __dirname = dirname(fileURLToPath(import.meta.url));

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
  res.status(200).json({ status: 'ok', message: 'Express production server running' });
  console.log('Health check request received');
});

// Determinar la ruta de los archivos estáticos
const staticPath = join(__dirname, 'client', 'dist');

// Comprobar si el directorio de compilación existe
if (!fs.existsSync(staticPath)) {
  console.error(`Error: Build directory not found at ${staticPath}`);
  console.error('Please run "npm run build" before starting the production server');
  process.exit(1);
}

// Configurar Express para servir archivos estáticos desde el directorio de compilación
app.use(express.static(staticPath));

// Ruta para cualquier solicitud que no coincida con un archivo estático
// Esto es importante para las aplicaciones SPA (Single Page Application)
app.get('*', (req, res) => {
  console.log(`Request received for path: ${req.url}`);
  
  // Devolver el archivo index.html para todas las rutas no encontradas
  // para permitir que el enrutador del lado del cliente maneje la navegación
  res.sendFile(join(staticPath, 'index.html'));
});

// Iniciar el servidor
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Production server started successfully at http://0.0.0.0:${PORT}`);
  console.log(`Serving static files from: ${staticPath}`);
});