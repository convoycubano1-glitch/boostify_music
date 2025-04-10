// Este archivo carga directamente el componente HomePage desde src/pages/home.tsx
// Simplifica el proceso al evitar toda la infraestructura de React/Vite

// Importar el contenido del componente home.tsx como texto
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Obtener el directorio actual
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar el contenido del archivo home.tsx
const homePath = path.join(__dirname, 'src', 'pages', 'home.tsx');
const homeContent = fs.readFileSync(homePath, 'utf-8');

// Generar una versión HTML simple del componente
function generateSimpleHTML() {
  // Extraer el título principal y algunas características del componente
  const titleMatch = homeContent.match(/hero-title[^>]*>([^<]+)</);
  const title = titleMatch ? titleMatch[1] : 'Boostify Music Platform';
  
  // Crear un HTML básico que muestre el componente
  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify - ${title}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #1e1e2e;
      color: #cdd6f4;
      margin: 0;
      padding: 0;
    }
    
    .header {
      background-color: rgba(0, 0, 0, 0.2);
      padding: 1rem 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
    }
    
    .logo {
      font-size: 1.5rem;
      font-weight: bold;
      color: #f97316;
    }
    
    .home-preview {
      margin: 2rem 0;
      padding: 1rem;
      background-color: rgba(255, 255, 255, 0.05);
      border-radius: 0.5rem;
    }
    
    .home-code {
      margin-top: 1rem;
      padding: 1rem;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 0.5rem;
      font-family: monospace;
      white-space: pre-wrap;
      max-height: 300px;
      overflow-y: auto;
      font-size: 0.8rem;
    }
    
    .feature-list {
      margin-top: 2rem;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1rem;
    }
    
    .feature-item {
      background-color: rgba(255, 255, 255, 0.05);
      padding: 1rem;
      border-radius: 0.5rem;
    }
    
    .feature-title {
      font-size: 1.2rem;
      color: #f97316;
      margin-bottom: 0.5rem;
    }
    
    h1 {
      color: #f97316;
      margin-bottom: 1rem;
    }
    
    .view-link {
      display: inline-block;
      margin-top: 1rem;
      padding: 0.5rem 1rem;
      background-color: #f97316;
      color: white;
      text-decoration: none;
      border-radius: 0.3rem;
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="container">
      <div class="logo">Boostify Music</div>
    </div>
  </header>
  
  <main class="container">
    <div class="home-preview">
      <h1>Vista previa del componente Home</h1>
      <p>Esta es una versión simplificada de la página principal. El componente React original está ubicado en <code>src/pages/home.tsx</code>.</p>
      
      <div class="feature-list">
        <div class="feature-item">
          <div class="feature-title">🎵 Gestión de Música</div>
          <p>Organiza tu catálogo musical, carga nuevas canciones y administra tus lanzamientos.</p>
        </div>
        <div class="feature-item">
          <div class="feature-title">📊 Análisis de Audiencia</div>
          <p>Obtén insights detallados sobre el rendimiento de tu música y el comportamiento de tus fans.</p>
        </div>
        <div class="feature-item">
          <div class="feature-title">🌐 Distribución Global</div>
          <p>Distribuye tu música en las principales plataformas de streaming con facilidad.</p>
        </div>
        <div class="feature-item">
          <div class="feature-title">💰 Monetización</div>
          <p>Maximiza tus ingresos con múltiples fuentes de monetización.</p>
        </div>
      </div>
      
      <a href="/src/pages/home.tsx" class="view-link">Ver código fuente del componente</a>
    </div>
    
    <div class="home-code">
      <p>Extracto del componente home.tsx:</p>
      ${homeContent.slice(0, 500).replace(/</g, '&lt;').replace(/>/g, '&gt;')}...
    </div>
  </main>
</body>
</html>
  `;
}

// Exportar la función que genera el HTML
export function getHomeHTML() {
  return generateSimpleHTML();
}