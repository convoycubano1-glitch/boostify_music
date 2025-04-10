// Servidor Express para modo producción
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
  res.status(200).json({ status: 'ok', message: 'Production server running' });
  console.log('Health check request received');
});

// Verificar si la carpeta 'dist' existe y servir archivos desde allí si es posible
const distPath = join(__dirname, 'dist');
const clientDistPath = join(__dirname, 'client', 'dist');

// Función para servir la versión fallback que mantiene los estilos actuales
function serveFallbackApp(req, res) {
  // Crear un HTML con estilos similares a los actuales
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music - Home</title>
  <style>
    body { 
      font-family: system-ui, sans-serif; 
      margin: 0;
      padding: 0;
      background-color: #1a1a2e;
      color: #e6e6e6;
    }
    #root {
      min-height: 100vh;
    }
    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      text-align: center;
      padding: 0 20px;
    }
    .logo { 
      font-size: 32px; 
      font-weight: bold;
      color: #f97316;
      margin-bottom: 20px;
    }
    h1 { 
      color: #f97316; 
      margin-bottom: 30px;
    }
    .spinner {
      width: 50px;
      height: 50px;
      border: 5px solid rgba(249, 115, 22, 0.3);
      border-radius: 50%;
      border-top-color: #f97316;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  <!-- Import React -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <!-- Import Babel for JSX transformation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root">
    <div class="loading">
      <div class="logo">Boostify Music</div>
      <h1>Aplicación en modo producción</h1>
      <div class="spinner"></div>
    </div>
  </div>

  <!-- Cargar un script que llame directamente al componente HomePage -->
  <script type="text/babel">
    // Componente React simplificado que muestra "Boostify Music" como título
    const App = () => {
      return (
        <div style={{ 
          minHeight: '100vh', 
          backgroundColor: '#1a1a2e', 
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '20px'
        }}>
          <h1 style={{ 
            fontSize: '3rem', 
            color: '#f97316',
            marginBottom: '30px'
          }}>
            Boostify Music
          </h1>
          <div style={{
            backgroundColor: 'rgba(255,255,255,0.05)',
            padding: '30px',
            borderRadius: '10px',
            maxWidth: '800px',
            marginBottom: '30px'
          }}>
            <h2 style={{ color: '#f97316', marginBottom: '20px' }}>
              La aplicación está funcionando en modo producción
            </h2>
            <p style={{ fontSize: '1.2rem', lineHeight: '1.6' }}>
              Esta es una versión simplificada de la aplicación principal que mantiene los estilos originales.
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: '15px',
            flexWrap: 'wrap',
            justifyContent: 'center'
          }}>
            {['YouTube Promotion', 'Spotify Growth', 'PR Management', 'Analytics', 'Global Reach'].map((feature, index) => (
              <div key={index} style={{
                backgroundColor: 'rgba(249, 115, 22, 0.1)',
                border: '1px solid rgba(249, 115, 22, 0.3)',
                padding: '15px',
                borderRadius: '8px',
                minWidth: '200px'
              }}>
                {feature}
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Renderizar la aplicación
    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<App />);
  </script>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
  console.log('Página estilizada enviada como fallback');
}

// Comprobar qué directorio de distribución existe
if (fs.existsSync(distPath)) {
  console.log(`Directorio de distribución encontrado en: ${distPath}`);
  
  // Servir archivos estáticos desde la carpeta dist
  app.use(express.static(distPath));
  
  // Ruta para cualquier solicitud que no coincida con un archivo estático
  app.get('*', (req, res) => {
    console.log(`Request received for path: ${req.url}`);
    
    // Devolver el archivo index.html para todas las rutas no encontradas
    res.sendFile(join(distPath, 'index.html'));
  });
} else if (fs.existsSync(clientDistPath)) {
  console.log(`Directorio de distribución cliente encontrado en: ${clientDistPath}`);
  
  // Servir archivos estáticos desde la carpeta client/dist
  app.use(express.static(clientDistPath));
  
  // Ruta para cualquier solicitud que no coincida con un archivo estático
  app.get('*', (req, res) => {
    console.log(`Request received for path: ${req.url}`);
    
    // Devolver el archivo index.html para todas las rutas no encontradas
    res.sendFile(join(clientDistPath, 'index.html'));
  });
} else {
  console.log('No se encontró un directorio de distribución. Usando versión fallback.');
  
  // Configurar carpetas estáticas básicas
  app.use('/assets', express.static(join(__dirname, 'assets')));
  app.use('/src', express.static(join(__dirname, 'src')));
  app.use(express.static(__dirname));
  
  // Servir la versión fallback para todas las rutas
  app.get('*', serveFallbackApp);
}

// Iniciar el servidor
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Production server started successfully at http://0.0.0.0:${PORT}`);
});