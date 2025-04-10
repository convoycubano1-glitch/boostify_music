// Servidor Express simple para servir la aplicación React
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 5000;

// Servir archivos estáticos desde client/public
app.use(express.static(path.join(__dirname, 'client', 'public')));

// Servir archivos compilados de la carpeta dist si existe
const distPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(distPath)) {
  console.log('✅ Sirviendo archivos compilados desde la carpeta dist');
  app.use(express.static(distPath));
}

// Servir archivos de src para desarrollo
app.use('/src', express.static(path.join(__dirname, 'client', 'src')));
app.use('/assets', express.static(path.join(__dirname, 'client', 'public', 'assets')));

// Configuración para servir archivos TypeScript como JavaScript
app.get('/src/main.tsx', (req, res) => {
  res.setHeader('Content-Type', 'application/javascript');
  res.sendFile(path.join(__dirname, 'client', 'src', 'main.tsx'));
});

// Configurar middleware para manejar cualquier archivo .tsx o .ts como JavaScript
app.get('*.tsx', (req, res) => {
  const filePath = path.join(__dirname, 'client', req.path);
  res.setHeader('Content-Type', 'application/javascript');
  if (fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).send('Archivo no encontrado');
  }
});

// Ruta para index.html
app.get('/', (req, res) => {
  // Primero intentamos servir el index.html principal
  const mainIndexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(mainIndexPath)) {
    console.log('✅ Sirviendo index.html principal');
    return res.sendFile(mainIndexPath);
  }
  
  // Si no existe, usamos el de cliente
  const clientIndexPath = path.join(__dirname, 'client', 'index.html');
  if (fs.existsSync(clientIndexPath)) {
    console.log('✅ Sirviendo index.html del cliente');
    return res.sendFile(clientIndexPath);
  }
  
  // Si ninguno existe, mostramos un mensaje de error
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Boostify Music</title>
        <style>
          body { font-family: system-ui; background: #1e1e2e; color: #cdd6f4; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; }
          .card { background: #181825; padding: 2rem; border-radius: 8px; max-width: 600px; border: 1px solid #313244; }
          h1 { color: #f97316; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Boostify Music</h1>
          <p>El servidor está funcionando pero no se encontró ningún archivo index.html.</p>
        </div>
      </body>
    </html>
  `);
});

// Servir index.html para todas las rutas no manejadas (SPA)
app.get('*', (req, res) => {
  // Si la ruta es para un archivo específico, intentamos servirlo
  const requestedPath = path.join(__dirname, req.path);
  if (fs.existsSync(requestedPath) && fs.statSync(requestedPath).isFile()) {
    return res.sendFile(requestedPath);
  }
  
  // Para rutas SPA, enviar el index.html
  const mainIndexPath = path.join(__dirname, 'index.html');
  if (fs.existsSync(mainIndexPath)) {
    return res.sendFile(mainIndexPath);
  }
  
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Servidor simple ejecutándose en http://0.0.0.0:${PORT}`);
  console.log(`✅ Accesible desde cualquier host de Replit`);
});