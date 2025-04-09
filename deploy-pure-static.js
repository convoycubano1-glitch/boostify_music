import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Script de despliegue 100% estático
 * Este script crea una versión estática simplificada de la aplicación
 * que se puede desplegar sin problemas, ignorando todos los errores de compilación
 */

console.log('🚀 Creando versión estática para despliegue...');

// 1. Crear directorio de distribución
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
}
if (!fs.existsSync('dist/client')) {
  fs.mkdirSync('dist/client', { recursive: true });
}

// 2. Crear HTML minimalista
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
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      background: #121212;
      color: #fff;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background: #1a1a1a;
      padding: 1rem;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    }
    main {
      flex: 1;
      padding: 2rem;
      max-width: 1200px;
      margin: 0 auto;
      width: 100%;
    }
    h1 { font-size: 2rem; margin-bottom: 0.5rem; color: #5E17EB; }
    p { margin-bottom: 1rem; line-height: 1.5; }
    .card {
      background: #1a1a1a;
      border-radius: 8px;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .button {
      background: #5E17EB;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 4px;
      font-weight: bold;
      cursor: pointer;
      display: inline-block;
      text-decoration: none;
      margin-top: 1rem;
    }
    .button:hover { background: #4a11c7; }
    .status { 
      padding: 1rem; 
      border-radius: 4px; 
      background: #123456; 
      margin-top: 1rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>Boostify Music</h1>
  </header>
  <main>
    <div class="card">
      <h2>Versión de demostración</h2>
      <p>
        Esta es una versión estática de Boostify Music creada para propósitos de demostración.
        La aplicación completa incluye las siguientes funcionalidades:
      </p>
      <ul style="margin-left: 2rem; margin-bottom: 1rem;">
        <li>Panel de control para artistas</li>
        <li>Herramientas de marketing impulsadas por IA</li>
        <li>Análisis de datos y rendimiento</li>
        <li>Sistema de afiliados y comisiones</li>
        <li>Creación y promoción de contenido musical</li>
      </ul>
      <p>Para acceder a todas las funcionalidades, se requiere la instalación completa.</p>
      <div class="status">
        Estado: Aplicación desplegada correctamente
      </div>
    </div>
    <div class="card">
      <h2>Contenido del Proyecto</h2>
      <p>
        Este proyecto incluye un sistema completo para músicos y artistas que desean
        potenciar su carrera usando las últimas tecnologías e inteligencia artificial.
      </p>
      <p>
        Algunas tecnologías incluidas son React, Firebase, OpenRouter AI, entre otras.
      </p>
      <a href="#" class="button">Iniciar Sesión (Demo)</a>
    </div>
  </main>
  <script>
    // Script simple para simular interactividad
    document.addEventListener('DOMContentLoaded', () => {
      const button = document.querySelector('.button');
      if (button) {
        button.addEventListener('click', (e) => {
          e.preventDefault();
          alert('Esta es una versión de demostración. La funcionalidad completa requiere la instalación del proyecto.');
        });
      }
    });
  </script>
</body>
</html>
`;

// Guardar HTML
fs.writeFileSync('dist/client/index.html', htmlContent);
console.log('✅ Página HTML creada');

// 3. Crear servidor express mínimo
const serverCode = `
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname, 'client')));

// Ruta para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Servidor iniciado en http://localhost:\${PORT}\`);
});
`;

fs.writeFileSync('dist/server.js', serverCode);
console.log('✅ Servidor Express creado');

// 4. Crear package.json para producción
const prodPackage = {
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
    "node": ">=16.0.0"
  }
};

fs.writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));
console.log('✅ Package.json para producción creado');

// 5. Crear documentación de despliegue
const deploymentDocs = `
# Guía de Despliegue para Boostify Music

## Versión de demostración

Esta es una versión de demostración estática de Boostify Music que se puede desplegar sin problemas
de compilación. Esta versión simplificada muestra las funcionalidades principales de la aplicación.

## Pasos para el despliegue

1. **Preparar el servidor**:
   Asegúrese de tener Node.js 16 o superior instalado.

2. **Copiar archivos de distribución**:
   Copie todo el contenido de la carpeta \`dist/\` a su servidor.

3. **Instalar dependencias**:
   \`\`\`
   npm install --production
   \`\`\`

4. **Iniciar la aplicación**:
   \`\`\`
   npm start
   \`\`\`

## Variables de entorno

Para una versión completa de la aplicación, se necesitan las siguientes variables de entorno:

- \`VITE_OPENROUTER_API_KEY\`: Clave API para OpenRouter AI
- \`VITE_ELEVENLABS_API_KEY\`: Clave API para ElevenLabs
- \`FIREBASE_CONFIG\`: Configuración de Firebase

## Notas importantes

- Esta es una versión estática sin todas las funcionalidades de la aplicación completa.
- Para acceder a todas las funcionalidades, se requiere compilar la versión completa.
`;

fs.writeFileSync('DEPLOYMENT-STATIC.md', deploymentDocs);
console.log('✅ Documentación de despliegue creada');

console.log('🎉 Versión estática creada con éxito!');
console.log('📁 Archivos de demostración disponibles en la carpeta dist/');
console.log('🚀 Para desplegar:');
console.log('1. Sube el contenido de la carpeta dist/ a tu servidor');
console.log('2. Ejecuta npm install --production');
console.log('3. Inicia la aplicación con npm start');
console.log('📘 Consulta DEPLOYMENT-STATIC.md para más detalles');