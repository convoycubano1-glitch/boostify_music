// Script para construcción rápida de una versión simplificada
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔨 Iniciando construcción rápida para despliegue...');

// Limpiar o crear carpeta dist
const distPath = path.join(__dirname, 'client', 'dist');
if (fs.existsSync(distPath)) {
  console.log('🗑️ Limpiando carpeta client/dist existente...');
  fs.rmSync(distPath, { recursive: true, force: true });
}
fs.mkdirSync(distPath, { recursive: true });

// Crear archivos mínimos para mostrar la página
console.log('📝 Creando archivos HTML, CSS y JS básicos...');

// Archivo HTML
const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify - Plataforma de Música con IA</title>
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <div class="container">
    <header>
      <div class="logo">Boostify</div>
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
      <h1>Potencia tu música con IA</h1>
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
    
    <footer class="footer">
      <p>&copy; 2025 Boostify. Todos los derechos reservados.</p>
    </footer>
  </div>
  <script src="./main.js"></script>
</body>
</html>`;

// Archivo CSS
const cssContent = `/* Estilos básicos */
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
}`;

// Archivo JS
const jsContent = `// Script básico para la página
document.addEventListener('DOMContentLoaded', () => {
  console.log('Boostify - Página cargada correctamente');
  
  // Agregar evento al botón CTA
  const ctaButton = document.querySelector('.cta-button');
  if (ctaButton) {
    ctaButton.addEventListener('click', (e) => {
      e.preventDefault();
      alert('¡Gracias por tu interés! Estamos trabajando en esta funcionalidad.');
    });
  }
});`;

// Escribir los archivos
fs.writeFileSync(path.join(distPath, 'index.html'), htmlContent);
fs.writeFileSync(path.join(distPath, 'style.css'), cssContent);
fs.writeFileSync(path.join(distPath, 'main.js'), jsContent);

// Actualizar el archivo start.js para usar el servidor de producción
const startJsContent = `// Archivo principal para iniciar el servidor de producción
console.log('Iniciando servidor en modo producción...');

// Importar y ejecutar el servidor de producción que sirve los archivos compilados
import './production-server.js';`;

fs.writeFileSync(path.join(__dirname, 'start.js'), startJsContent);

console.log('✅ Construcción rápida completada con éxito.');
console.log('📂 Archivos generados en client/dist');
console.log('');
console.log('Para iniciar la aplicación en modo producción, reinicia el servidor.');
console.log('El archivo start.js ha sido modificado para usar production-server.js');
console.log('');
console.log('Esta versión es una versión básica para despliegue. Puedes personalizarla según tus necesidades.');