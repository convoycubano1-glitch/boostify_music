// Servidor mínimo que redirige directamente a home.tsx
import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Servir archivos estáticos desde el directorio raíz
app.use(express.static(__dirname));

// Ruta de salud para verificación
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Servidor funcionando correctamente' });
});

// Ruta específica para home.tsx
app.get('/home.tsx', (req, res) => {
  const homePath = path.join(__dirname, 'src', 'pages', 'home.tsx');
  fs.readFile(homePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer home.tsx:', err);
      return res.status(500).send('Error al leer el archivo home.tsx');
    }
    res.type('text/plain').send(data);
  });
});

// Ruta principal - muestra el contenido de home.tsx
app.get('/', (req, res) => {
  const homePath = path.join(__dirname, 'src', 'pages', 'home.tsx');
  
  fs.readFile(homePath, 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer home.tsx:', err);
      return res.status(500).send('Error al leer el archivo home.tsx');
    }
    
    // Crear una página HTML simple que muestre el contenido de home.tsx
    const html = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Boostify Music - Home</title>
        <style>
          body { 
            font-family: system-ui, sans-serif; 
            line-height: 1.6;
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
            background-color: #1a1a2e;
            color: #e6e6e6;
          }
          header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 40px;
            padding-bottom: 20px;
            border-bottom: 1px solid #333;
          }
          .logo { 
            font-size: 24px; 
            font-weight: bold;
            color: #f97316;
          }
          h1 { 
            color: #f97316; 
            margin-bottom: 20px;
          }
          .container {
            display: flex;
            flex-direction: column;
            gap: 20px;
          }
          .section {
            background-color: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
          }
          .content {
            margin-top: 20px;
            background-color: rgba(0, 0, 0, 0.2);
            padding: 20px;
            border-radius: 8px;
            overflow: auto;
          }
          pre {
            white-space: pre-wrap;
            font-family: monospace;
            font-size: 14px;
          }
          .features {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 20px;
            margin-top: 30px;
          }
          .feature-card {
            background-color: rgba(255, 255, 255, 0.05);
            padding: 20px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
          }
          .feature-title {
            font-size: 18px;
            color: #f97316;
            margin-bottom: 10px;
            font-weight: bold;
          }
        </style>
      </head>
      <body>
        <header>
          <div class="logo">Boostify Music</div>
          <div>src/pages/home.tsx</div>
        </header>
        
        <div class="container">
          <div class="section">
            <h1>Vista del componente HomePage</h1>
            <p>Este es el contenido del archivo src/pages/home.tsx que has solicitado como página principal de la aplicación.</p>
            
            <div class="features">
              <div class="feature-card">
                <div class="feature-title">🎵 Gestión de música</div>
                <p>Organiza y administra tu catálogo musical, sube nuevas canciones y controla tus lanzamientos desde un solo lugar.</p>
              </div>
              <div class="feature-card">
                <div class="feature-title">📊 Análisis avanzado</div>
                <p>Obtén estadísticas detalladas sobre el rendimiento de tu música y el comportamiento de tus fans.</p>
              </div>
              <div class="feature-card">
                <div class="feature-title">💰 Monetización</div>
                <p>Maximiza tus ingresos con múltiples fuentes de monetización y oportunidades de negocio.</p>
              </div>
              <div class="feature-card">
                <div class="feature-title">🌐 Distribución global</div>
                <p>Distribuye tu música en las principales plataformas de streaming y tiendas digitales con facilidad.</p>
              </div>
            </div>
          </div>
          
          <div class="content">
            <h2>Contenido del archivo src/pages/home.tsx:</h2>
            <pre>${data.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          </div>
        </div>
      </body>
      </html>
    `;
    
    res.send(html);
  });
});

// Ruta para archivos src
app.get('/src/*', (req, res) => {
  const filePath = path.join(__dirname, req.path);
  res.sendFile(filePath, err => {
    if (err) {
      console.error(`Error al enviar archivo ${filePath}:`, err);
      res.status(404).send('Archivo no encontrado');
    }
  });
});

// Para cualquier otra ruta, redirigir a la página principal
app.get('*', (req, res) => {
  res.redirect('/');
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor iniciado en http://0.0.0.0:${PORT}`);
  console.log(`🏠 Sirviendo directamente src/pages/home.tsx como página principal`);
});