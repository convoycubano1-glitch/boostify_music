// Servidor básico que sirve la aplicación directamente
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const app = express();

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/src', express.static('src'));
app.use('/assets', express.static('assets'));

// Ruta específica para servir el archivo home.tsx directamente
app.get('/view-home-tsx', (req, res) => {
  console.log('Solicitud para ver home.tsx recibida');
  
  // Leer el archivo home.tsx
  fs.readFile('./src/pages/home.tsx', 'utf8', (err, data) => {
    if (err) {
      console.error('Error al leer home.tsx:', err);
      return res.status(500).send('Error al leer el archivo home.tsx');
    }
    
    // Servir el contenido como texto plano
    res.setHeader('Content-Type', 'text/plain');
    res.send(data);
  });
});

// Ruta principal que sirve contenido HTML estático que muestra home.tsx
app.get('/', (req, res) => {
  console.log('Solicitud a la ruta raíz recibida');
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <style>
    /* Estilos básicos */
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background-color: #0F172A;
      color: #E2E8F0;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
    }
    
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid #334155;
    }
    
    .logo {
      font-size: 2rem;
      font-weight: bold;
      color: #F59E0B;
    }
    
    nav ul {
      display: flex;
      list-style: none;
      gap: 1.5rem;
    }
    
    nav a {
      color: #E2E8F0;
      text-decoration: none;
      font-weight: 500;
    }
    
    nav a:hover {
      color: #F59E0B;
    }
    
    .hero {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 4rem 0;
    }
    
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      background: linear-gradient(to right, #F59E0B, #D97706);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    
    .subtitle {
      font-size: 1.5rem;
      margin-bottom: 2rem;
      color: #94A3B8;
    }
    
    .cta-button {
      display: inline-block;
      background-color: #F59E0B;
      color: #0F172A;
      padding: 0.75rem 1.5rem;
      border-radius: 0.5rem;
      font-weight: bold;
      text-decoration: none;
      transition: background-color 0.3s;
    }
    
    .cta-button:hover {
      background-color: #D97706;
    }
    
    .features {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
      margin: 4rem 0;
    }
    
    .feature-card {
      background-color: #1E293B;
      border-radius: 0.5rem;
      padding: 2rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .feature-card h3 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      color: #F59E0B;
    }
    
    .footer {
      border-top: 1px solid #334155;
      padding: 2rem 0;
      margin-top: 2rem;
      text-align: center;
      color: #94A3B8;
    }
    
    .source-code {
      margin-top: 2rem;
      padding: 1rem;
      background-color: #1E293B;
      border-radius: 0.5rem;
      overflow: auto;
    }
    
    pre {
      margin: 0;
      padding: 1rem;
      white-space: pre-wrap;
      font-family: 'Courier New', Courier, monospace;
      font-size: 0.9rem;
      color: #E2E8F0;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">Boostify Music</div>
      <nav>
        <ul>
          <li><a href="#">Inicio</a></li>
          <li><a href="#">Características</a></li>
          <li><a href="#">Precios</a></li>
          <li><a href="#">Contacto</a></li>
        </ul>
      </nav>
    </header>
    
    <section class="hero">
      <h1>Boostify Music</h1>
      <p class="subtitle">Plataforma avanzada de música impulsada por inteligencia artificial</p>
      <a href="#" class="cta-button">Comenzar ahora</a>
    </section>
    
    <section class="features">
      <div class="feature-card">
        <h3>Composición asistida</h3>
        <p>Crea música de calidad profesional con nuestra IA que te ayuda en cada paso del proceso creativo.</p>
      </div>
      <div class="feature-card">
        <h3>Masterización automática</h3>
        <p>Obtén un sonido de calidad profesional con nuestras herramientas de masterización automática.</p>
      </div>
      <div class="feature-card">
        <h3>Colaboración en la nube</h3>
        <p>Trabaja con músicos de todo el mundo en tiempo real a través de nuestra plataforma colaborativa.</p>
      </div>
    </section>
    
    <section class="source-code">
      <h2>Código fuente de home.tsx</h2>
      <pre id="source-code-content"></pre>
    </section>
    
    <footer class="footer">
      <p>&copy; 2025 Boostify Music. Todos los derechos reservados.</p>
    </footer>
  </div>
  
  <script>
    // Cargar el contenido del archivo home.tsx usando la ruta dedicada
    fetch('/view-home-tsx')
      .then(response => response.text())
      .then(data => {
        document.getElementById('source-code-content').textContent = data;
      })
      .catch(error => {
        document.getElementById('source-code-content').textContent = 'Error al cargar el archivo: ' + error;
      });
  </script>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
  console.log('Página simple enviada');
});

// Iniciar el servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor básico iniciado en http://0.0.0.0:${PORT}`);
});