// Servidor Express que redirige al puerto 5173 donde corre la aplicación completa
import express from 'express';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { createServer } from 'http';
import { exec } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;
const VITE_PORT = 5173;
const app = express();

console.log('⚡ Iniciando servidor de redirección a Vite');

// Permitir a Express analizar JSON y formularios codificados en URL
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Copiar la configuración que permite todos los hosts para Vite
try {
  fs.copyFileSync(
    join(__dirname, 'client', 'vite.config.allow-all.js'), 
    join(__dirname, 'client', 'vite.config.js')
  );
  console.log('✅ Configuración de Vite actualizada para permitir cualquier host');
} catch (err) {
  console.error('❌ Error al copiar configuración Vite:', err.message);
}

// Iniciar el servidor Vite en segundo plano
console.log('🚀 Iniciando servidor Vite en segundo plano...');
const viteServer = exec('cd client && npx vite --host 0.0.0.0 --port 5173');

viteServer.stdout.on('data', (data) => {
  console.log(`Vite: ${data.trim()}`);
});

viteServer.stderr.on('data', (data) => {
  if (data.includes('running at')) {
    console.log(data.trim());
  }
});

// Ruta para redirigir a la aplicación en puerto 5173
app.get('*', (req, res) => {
  const host = req.headers.host || '';
  const protocol = req.headers['x-forwarded-proto'] || 'https';
  const path = req.originalUrl || '/';
  
  // Generar URL de redirección basado en el host actual
  const redirectUrl = `${protocol}://${host.replace(/:\d+/, '')}:${VITE_PORT}${path}`;
  
  console.log(`Redirigiendo a: ${redirectUrl}`);
  // Hacer una redirección HTTP 302 (temporal)
  res.redirect(redirectUrl);
});
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music - Plataforma para artistas</title>
  <link rel="icon" type="image/png" href="/assets/freepik__boostify_music_organe_abstract_icon.png">
  <style>
    :root {
      --primary: #f97316;
      --primary-light: #fb923c;
      --primary-dark: #ea580c;
      --secondary: #4f46e5;
      --dark: #1e293b;
      --darker: #0f172a;
      --light: #f8fafc;
      --gray: #64748b;
      --gray-light: #94a3b8;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: var(--darker);
      color: var(--light);
      line-height: 1.6;
    }
    
    header {
      background-color: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(10px);
      position: fixed;
      width: 100%;
      z-index: 100;
      padding: 1rem 0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .container {
      width: 100%;
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 2rem;
    }
    
    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    
    .logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      color: var(--light);
      text-decoration: none;
      font-weight: 700;
      font-size: 1.5rem;
    }
    
    .logo img {
      height: 40px;
    }
    
    nav ul {
      display: flex;
      gap: 2rem;
      list-style: none;
    }
    
    nav a {
      color: var(--light);
      text-decoration: none;
      font-weight: 500;
      transition: color 0.3s;
    }
    
    nav a:hover {
      color: var(--primary);
    }
    
    .auth-buttons {
      display: flex;
      gap: 1rem;
    }
    
    .btn {
      display: inline-block;
      padding: 0.75rem 1.5rem;
      border-radius: 0.375rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
      cursor: pointer;
      border: none;
      font-size: 1rem;
    }
    
    .btn-primary {
      background-color: var(--primary);
      color: white;
    }
    
    .btn-primary:hover {
      background-color: var(--primary-dark);
    }
    
    .btn-outline {
      background-color: transparent;
      color: var(--light);
      border: 2px solid var(--primary);
    }
    
    .btn-outline:hover {
      background-color: var(--primary);
      color: white;
    }
    
    .hero {
      padding-top: 6rem;
      padding-bottom: 4rem;
      position: relative;
      overflow: hidden;
      min-height: 100vh;
      display: flex;
      align-items: center;
    }
    
    .hero::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: url('/assets/noise.svg');
      opacity: 0.05;
      pointer-events: none;
    }
    
    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 650px;
    }
    
    .hero-title {
      font-size: 3.5rem;
      font-weight: 800;
      line-height: 1.2;
      margin-bottom: 1.5rem;
      background: linear-gradient(to right, var(--light), var(--primary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }
    
    .hero-description {
      font-size: 1.25rem;
      margin-bottom: 2.5rem;
      color: var(--gray-light);
    }
    
    .hero-buttons {
      display: flex;
      gap: 1rem;
      flex-wrap: wrap;
    }
    
    .hero-video {
      position: absolute;
      top: 0;
      right: 0;
      width: 50%;
      height: 100%;
      z-index: 0;
      overflow: hidden;
    }
    
    .hero-video video {
      position: absolute;
      top: 50%;
      left: 50%;
      min-width: 100%;
      min-height: 100%;
      width: auto;
      height: auto;
      transform: translateX(-50%) translateY(-50%);
      opacity: 0.5;
    }
    
    .features {
      padding: 6rem 0;
      background-color: var(--dark);
    }
    
    .section-title {
      text-align: center;
      font-size: 2.5rem;
      margin-bottom: 3rem;
      font-weight: 700;
    }
    
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 2rem;
    }
    
    .feature-card {
      background-color: var(--darker);
      border-radius: 0.5rem;
      padding: 2rem;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s;
    }
    
    .feature-card:hover {
      transform: translateY(-10px);
    }
    
    .feature-icon {
      background-color: rgba(249, 115, 22, 0.1);
      width: 60px;
      height: 60px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }
    
    .feature-icon svg {
      width: 30px;
      height: 30px;
      fill: var(--primary);
    }
    
    .feature-title {
      font-size: 1.5rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
    
    .feature-description {
      color: var(--gray-light);
    }
    
    .cta {
      padding: 6rem 0;
      text-align: center;
      background: linear-gradient(to right, var(--darker), var(--dark));
    }
    
    .cta-title {
      font-size: 2.5rem;
      margin-bottom: 1.5rem;
      font-weight: 700;
    }
    
    .cta-description {
      font-size: 1.25rem;
      margin-bottom: 2.5rem;
      color: var(--gray-light);
      max-width: 700px;
      margin-left: auto;
      margin-right: auto;
    }
    
    footer {
      background-color: var(--darker);
      padding: 4rem 0 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .footer-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 2rem;
      margin-bottom: 3rem;
    }
    
    .footer-logo {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    
    .footer-logo img {
      height: 30px;
    }
    
    .footer-about {
      color: var(--gray-light);
      margin-bottom: 1.5rem;
    }
    
    .social-links {
      display: flex;
      gap: 1rem;
    }
    
    .social-link {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: rgba(255, 255, 255, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background-color 0.3s;
    }
    
    .social-link:hover {
      background-color: var(--primary);
    }
    
    .social-link svg {
      width: 20px;
      height: 20px;
      fill: var(--light);
    }
    
    .footer-title {
      font-size: 1.2rem;
      font-weight: 600;
      margin-bottom: 1.5rem;
    }
    
    .footer-links {
      list-style: none;
    }
    
    .footer-links li {
      margin-bottom: 0.75rem;
    }
    
    .footer-links a {
      color: var(--gray-light);
      text-decoration: none;
      transition: color 0.3s;
    }
    
    .footer-links a:hover {
      color: var(--primary);
    }
    
    .copyright {
      text-align: center;
      color: var(--gray);
      padding-top: 2rem;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    /* Responsive styles */
    @media (max-width: 768px) {
      .hero-title {
        font-size: 2.5rem;
      }
      
      .hero-video {
        display: none;
      }
      
      .hero-content {
        max-width: 100%;
      }
      
      nav ul {
        display: none;
      }
      
      .auth-buttons {
        margin-left: auto;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <div class="header-content">
        <a href="/" class="logo">
          <img src="/assets/freepik__boostify_music_organe_abstract_icon.png" alt="Boostify Logo">
          Boostify Music
        </a>
        
        <nav>
          <ul>
            <li><a href="#features">Características</a></li>
            <li><a href="#pricing">Precios</a></li>
            <li><a href="#about">Nosotros</a></li>
            <li><a href="#contact">Contacto</a></li>
          </ul>
        </nav>
        
        <div class="auth-buttons">
          <a href="/login" class="btn btn-outline">Iniciar sesión</a>
          <a href="/register" class="btn btn-primary">Registrarse</a>
        </div>
      </div>
    </div>
  </header>
  
  <main>
    <section class="hero">
      <div class="container">
        <div class="hero-content">
          <h1 class="hero-title">Potencia tu carrera musical con IA</h1>
          <p class="hero-description">
            Boostify Music te ofrece herramientas de inteligencia artificial avanzadas para crear, producir y promocionar tu música como nunca antes.
          </p>
          <div class="hero-buttons">
            <a href="/register" class="btn btn-primary">Comenzar gratis</a>
            <a href="#demo" class="btn btn-outline">Ver demo</a>
          </div>
        </div>
      </div>
      <div class="hero-video">
        <video autoplay loop muted playsinline>
          <source src="/assets/hero-video.mp4" type="video/mp4">
        </video>
      </div>
    </section>
    
    <section id="features" class="features">
      <div class="container">
        <h2 class="section-title">Características principales</h2>
        
        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 3v9.28a4.39 4.39 0 00-1.5-.28C8.01 12 6 14.01 6 16.5S8.01 21 10.5 21c2.31 0 4.2-1.75 4.45-4H15V6h4V3h-7z" />
              </svg>
            </div>
            <h3 class="feature-title">Producción con IA</h3>
            <p class="feature-description">
              Crea música profesional con nuestra IA de última generación. Genera melodías, armonías y arreglos completos en minutos.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M20 2H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 5h-3v5.5c0 1.38-1.12 2.5-2.5 2.5S10 13.88 10 12.5s1.12-2.5 2.5-2.5c.57 0 1.08.19 1.5.51V5h4v2zM4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6z" />
              </svg>
            </div>
            <h3 class="feature-title">Distribución simplificada</h3>
            <p class="feature-description">
              Distribuye tu música en todas las plataformas principales con un solo clic. Gestiona tu catálogo de forma sencilla.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
              </svg>
            </div>
            <h3 class="feature-title">Crecimiento de audiencia</h3>
            <p class="feature-description">
              Herramientas de marketing impulsadas por IA para conectar con tu audiencia y expandir tu base de fans de manera efectiva.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
              </svg>
            </div>
            <h3 class="feature-title">Análisis detallado</h3>
            <p class="feature-description">
              Analiza el rendimiento de tu música con datos precisos y obtén recomendaciones personalizadas para mejorar.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
            </div>
            <h3 class="feature-title">Licencias y derechos</h3>
            <p class="feature-description">
              Gestiona tus licencias y derechos de autor fácilmente. Protege tu contenido y maximiza tus ingresos.
            </p>
          </div>
          
          <div class="feature-card">
            <div class="feature-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M21 3H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 15c-4.42 0-8-2.69-8-6s3.58-6 8-6 8 2.69 8 6-3.58 6-8 6z" />
              </svg>
            </div>
            <h3 class="feature-title">Comunidad de artistas</h3>
            <p class="feature-description">
              Conecta con otros artistas, colabora en proyectos y comparte conocimientos en nuestra comunidad exclusiva.
            </p>
          </div>
        </div>
      </div>
    </section>
    
    <section id="demo" class="cta">
      <div class="container">
        <h2 class="cta-title">Únete a miles de artistas</h2>
        <p class="cta-description">
          Más de 10,000 artistas ya están utilizando Boostify Music para llevar su carrera al siguiente nivel. ¿Qué estás esperando?
        </p>
        <a href="/register" class="btn btn-primary">Comenzar ahora</a>
      </div>
    </section>
  </main>
  
  <footer>
    <div class="container">
      <div class="footer-grid">
        <div>
          <div class="footer-logo">
            <img src="/assets/freepik__boostify_music_organe_abstract_icon.png" alt="Boostify Logo">
            <span>Boostify Music</span>
          </div>
          <p class="footer-about">
            La plataforma definitiva para artistas musicales que quieren potenciar su carrera con IA.
          </p>
          <div class="social-links">
            <a href="#" class="social-link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M12 2.04c-5.5 0-9.96 4.46-9.96 9.96 0 4.42 2.87 8.17 6.84 9.5v-6.71h-2.06v-2.79h2.06v-1.79c0-2.03 1.21-3.15 3.05-3.15.88 0 1.8.15 1.8.15v1.98h-1.01c-1 0-1.31.62-1.31 1.26v1.51h2.23l-.36 2.79h-1.87v6.71c3.97-1.33 6.84-5.08 6.84-9.5 0-5.5-4.46-9.96-9.96-9.96z" />
              </svg>
            </a>
            <a href="#" class="social-link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z" />
              </svg>
            </a>
            <a href="#" class="social-link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M7.8 2h8.4C19.4 2 22 4.6 22 7.8v8.4a5.8 5.8 0 0 1-5.8 5.8H7.8C4.6 22 2 19.4 2 16.2V7.8A5.8 5.8 0 0 1 7.8 2m-.2 2A3.6 3.6 0 0 0 4 7.6v8.8C4 18.39 5.61 20 7.6 20h8.8a3.6 3.6 0 0 0 3.6-3.6V7.6C20 5.61 18.39 4 16.4 4H7.6m9.65 1.5a1.25 1.25 0 0 1 1.25 1.25A1.25 1.25 0 0 1 17.25 8 1.25 1.25 0 0 1 16 6.75a1.25 1.25 0 0 1 1.25-1.25M12 7a5 5 0 0 1 5 5 5 5 0 0 1-5 5 5 5 0 0 1-5-5 5 5 0 0 1 5-5m0 2a3 3 0 0 0-3 3 3 3 0 0 0 3 3 3 3 0 0 0 3-3 3 3 0 0 0-3-3z" />
              </svg>
            </a>
            <a href="#" class="social-link">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
              </svg>
            </a>
          </div>
        </div>
        
        <div>
          <h3 class="footer-title">Plataforma</h3>
          <ul class="footer-links">
            <li><a href="#">Características</a></li>
            <li><a href="#">Precios</a></li>
            <li><a href="#">Tutoriales</a></li>
            <li><a href="#">Estado del servicio</a></li>
          </ul>
        </div>
        
        <div>
          <h3 class="footer-title">Soporte</h3>
          <ul class="footer-links">
            <li><a href="#">Centro de ayuda</a></li>
            <li><a href="#">Contáctanos</a></li>
            <li><a href="#">FAQ</a></li>
            <li><a href="#">Comunidad</a></li>
          </ul>
        </div>
        
        <div>
          <h3 class="footer-title">Legal</h3>
          <ul class="footer-links">
            <li><a href="#">Términos de servicio</a></li>
            <li><a href="#">Política de privacidad</a></li>
            <li><a href="#">Derechos de autor</a></li>
            <li><a href="#">Cookies</a></li>
          </ul>
        </div>
      </div>
      
      <div class="copyright">
        &copy; 2025 Boostify Music. Todos los derechos reservados.
      </div>
    </div>
  </footer>
</body>
</html>
  `;
  
  res.setHeader('Content-Type', 'text/html');
  res.send(htmlContent);
});

// Iniciar el servidor
const server = createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Servidor iniciado en http://0.0.0.0:${PORT}`);
  console.log(`✨ Boostify Music está listo para usar`);
});