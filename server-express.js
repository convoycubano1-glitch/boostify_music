// Servidor Express para servir aplicación Vite/React
import express from 'express';
import { createServer } from 'http';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Obtener el directorio actual
const __dirname = dirname(fileURLToPath(import.meta.url));

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
  console.log('Solicitud de salud recibida');
});

// Leer el archivo HTML principal
app.get('/', (req, res) => {
  console.log('Solicitud a la ruta raíz recibida');
  
  // Leer el archivo index.html real de la aplicación
  const htmlPath = join(__dirname, 'index.html');
  try {
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // Modificar el HTML para asegurar que carga src/pages/home.tsx
    htmlContent = htmlContent.replace(
      '<title>Boostify Music - Home.tsx</title>',
      '<title>Boostify Music - React App</title>'
    );
    
    res.send(htmlContent);
    console.log('Página principal enviada');
  } catch (error) {
    console.error('Error al leer index.html:', error);
    res.status(500).send('Error al cargar la página principal');
  }
});

// Servir archivos estáticos desde la raíz del proyecto
app.use(express.static(__dirname));

// Ruta para src/pages/home.tsx específicamente
app.get('/src/pages/home.tsx', (req, res) => {
  const homePath = join(__dirname, 'src', 'pages', 'home.tsx');
  
  try {
    const content = fs.readFileSync(homePath, 'utf8');
    res.setHeader('Content-Type', 'application/typescript');
    res.send(content);
    console.log('Archivo home.tsx enviado');
  } catch (error) {
    console.error('Error al leer home.tsx:', error);
    res.status(500).send('Error al cargar home.tsx');
  }
});

// Para cualquier otra ruta, intentar servir el archivo o redirigir a index.html
app.get('*', (req, res) => {
  console.log(`Solicitud recibida para ruta: ${req.url}`);
  
  const filePath = join(__dirname, req.url);
  
  // Comprobar si el archivo existe
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    res.sendFile(filePath);
    console.log(`Archivo enviado: ${filePath}`);
  } else {
    // Para rutas de SPA, enviar index.html
    res.sendFile(join(__dirname, 'index.html'));
    console.log('Redirigido a index.html (SPA)');
  }
});

// Iniciar el servidor
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor Express iniciado exitosamente en http://0.0.0.0:${PORT}`);
});