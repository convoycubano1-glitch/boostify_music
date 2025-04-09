/**
 * Script de despliegue ultra simplificado para Boostify Music
 * Este script crea un paquete mínimo que puede desplegarse en cualquier servidor
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

// Obtener __dirname para módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Creando despliegue simplificado para Boostify Music...');

// 1. Crear directorio de distribución
const DIST_DIR = path.join(__dirname, 'dist');
if (fs.existsSync(DIST_DIR)) {
  fs.rmSync(DIST_DIR, { recursive: true, force: true });
}
fs.mkdirSync(DIST_DIR);
fs.mkdirSync(path.join(DIST_DIR, 'public'));
console.log('✅ Directorio de distribución creado');

// 2. Crear página HTML minimalista
const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #f5f5f5;
      background: linear-gradient(to bottom, #121212, #1a1a1a);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background-color: #0a0a0a;
      padding: 1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    }
    .navbar {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      color: #5E17EB;
      font-size: 1.5rem;
      font-weight: bold;
      text-decoration: none;
    }
    main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    .hero {
      margin: 2rem 0;
      text-align: center;
    }
    h1 {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #5E17EB;
      background: linear-gradient(to right, #5E17EB, #965CF8);
      -webkit-background-clip: text;
      background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .hero p {
      font-size: 1.2rem;
      margin-bottom: 2rem;
      color: #cccccc;
    }
    .card {
      background-color: #2a2a2a;
      border-radius: 8px;
      padding: 2rem;
      margin-bottom: 2rem;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    }
    .status {
      display: inline-block;
      padding: 0.5rem 1rem;
      background-color: #173a17;
      color: #4ade80;
      border-radius: 4px;
      font-weight: bold;
      margin-top: 1rem;
    }
    .cta {
      display: inline-block;
      background-color: #5E17EB;
      color: white;
      padding: 0.8rem 2rem;
      border-radius: 4px;
      font-weight: bold;
      text-decoration: none;
      margin-top: 1rem;
      transition: all 0.3s ease;
    }
    .cta:hover {
      background-color: #4c12c9;
      transform: translateY(-2px);
    }
    footer {
      background-color: #0a0a0a;
      padding: 2rem;
      text-align: center;
      margin-top: auto;
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
      color: #777;
    }
    @media (max-width: 768px) {
      .hero h1 {
        font-size: 2rem;
      }
      .hero p {
        font-size: 1rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="navbar">
      <a href="/" class="logo">Boostify Music</a>
    </div>
  </header>
  
  <main>
    <section class="hero">
      <h1>Bienvenido a Boostify Music</h1>
      <p>La plataforma impulsada por IA para potenciar tu carrera musical</p>
    </section>
    
    <div class="card">
      <h2>🎉 ¡Despliegue Exitoso!</h2>
      <p>La aplicación se ha desplegado correctamente y está lista para ser utilizada.</p>
      <div class="status">✓ En línea</div>
    </div>
    
    <div class="card">
      <h2>Estado del Servidor</h2>
      <p>El servidor está funcionando correctamente en modo producción.</p>
      <p><strong>Versión:</strong> 1.0.0</p>
      <p><strong>Último despliegue:</strong> ${new Date().toLocaleString()}</p>
    </div>
  </main>
  
  <footer>
    <div class="footer-content">
      <p>&copy; ${new Date().getFullYear()} Boostify Music. Todos los derechos reservados.</p>
    </div>
  </footer>
</body>
</html>
`;

fs.writeFileSync(path.join(DIST_DIR, 'public', 'index.html'), htmlContent);
console.log('✅ Página HTML creada');

// 3. Crear servidor Express básico
const serverCode = `
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint para verificar el estado
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'production'
  });
});

// Ruta para cualquier otra petición (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ Servidor iniciado en http://localhost:\${PORT}\`);
  console.log(\`🌍 Modo: \${process.env.NODE_ENV || 'production'}\`);
});
`;

fs.writeFileSync(path.join(DIST_DIR, 'server.js'), serverCode);
console.log('✅ Servidor Express creado');

// 4. Crear package.json para producción
const packageJson = {
  name: "boostify-music",
  version: "1.0.0",
  private: true,
  main: "server.js",
  scripts: {
    start: "node server.js"
  },
  dependencies: {
    "express": "^4.18.2"
  },
  engines: {
    node: ">=16.0.0"
  }
};

fs.writeFileSync(path.join(DIST_DIR, 'package.json'), JSON.stringify(packageJson, null, 2));
console.log('✅ Package.json creado');

// 5. Crear script para iniciar la aplicación
const startScript = `#!/bin/bash
echo "📦 Instalando dependencias..."
npm install --production
echo "🚀 Iniciando servidor..."
npm start
`;

fs.writeFileSync(path.join(DIST_DIR, 'start.sh'), startScript);
fs.chmodSync(path.join(DIST_DIR, 'start.sh'), '755');
console.log('✅ Script de inicio creado');

// 6. Crear archivo README con instrucciones
const readmeContent = `
# Boostify Music - Instrucciones de Despliegue

## Requisitos
- Node.js 16 o superior

## Despliegue Rápido
1. Sube todo el contenido de esta carpeta a tu servidor
2. Ejecuta el script de inicio:
   \`\`\`
   chmod +x ./start.sh
   ./start.sh
   \`\`\`

## Despliegue Manual
1. Instala las dependencias:
   \`\`\`
   npm install --production
   \`\`\`

2. Inicia el servidor:
   \`\`\`
   npm start
   \`\`\`

El servidor estará disponible en http://localhost:3000 (o el puerto definido en la variable de entorno PORT).

## Variables de Entorno
- PORT: Puerto del servidor (por defecto: 3000)
- NODE_ENV: Entorno de ejecución (por defecto: production)
`;

fs.writeFileSync(path.join(DIST_DIR, 'README.md'), readmeContent);
console.log('✅ Archivo README con instrucciones creado');

// 7. Crear variables de entorno
const envContent = `
NODE_ENV=production
PORT=3000
`;

fs.writeFileSync(path.join(DIST_DIR, '.env'), envContent);
console.log('✅ Archivo .env creado');

console.log('\n🎉 Despliegue simplificado creado con éxito!');
console.log('📁 La carpeta dist/ contiene todos los archivos necesarios para desplegar la aplicación.');
console.log('\nPara probar localmente:');
console.log('1. cd dist');
console.log('2. node server.js');
console.log('\nPara desplegar en producción:');
console.log('1. Sube todo el contenido de la carpeta dist/ a tu servidor');
console.log('2. Ejecuta ./start.sh o sigue las instrucciones en README.md');