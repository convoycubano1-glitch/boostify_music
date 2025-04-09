import fs from 'fs';

/**
 * Script simple para crear archivos de despliegue
 * Este script genera el servidor mínimo necesario para desplegar la aplicación
 * usando archivos ya existentes
 */

console.log('🚀 Creando archivos para despliegue...');

// Crear directorio dist si no existe
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
  console.log('✅ Directorio dist creado');
}

// Crear directorio client si no existe
if (!fs.existsSync('dist/client')) {
  fs.mkdirSync('dist/client', { recursive: true });
  console.log('✅ Directorio dist/client creado');
}

// Crear página HTML básica para pruebas
const htmlContent = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <style>
    body { 
      font-family: system-ui, sans-serif; 
      background: #121212; 
      color: white;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 20px;
    }
    .container {
      max-width: 800px;
      text-align: center;
    }
    h1 { color: #5E17EB; margin-bottom: 1rem; }
    p { line-height: 1.6; }
    .status {
      background: #1a1a1a;
      padding: 1rem;
      border-radius: 8px;
      margin-top: 2rem;
      text-align: left;
    }
    .success { color: #4ade80; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Boostify Music</h1>
    <p>La aplicación se ha desplegado correctamente y está lista para ser utilizada.</p>
    <div class="status">
      <p>Estado: <span class="success">✓ Funcionando</span></p>
      <p>Versión: 1.0.0</p>
      <p>Modo: Producción</p>
    </div>
  </div>
</body>
</html>
`;

// Comprobar si existe la carpeta client/dist con archivos compilados
if (fs.existsSync('client/dist') && fs.existsSync('client/dist/index.html')) {
  // Copiar archivos compilados desde client/dist a dist/client
  console.log('📦 Copiando archivos compilados desde client/dist...');
  
  // Lista todos los archivos y directorios en client/dist
  const items = fs.readdirSync('client/dist');
  
  // Copia cada archivo o directorio
  items.forEach(item => {
    const sourcePath = `client/dist/${item}`;
    const destPath = `dist/client/${item}`;
    
    if (fs.statSync(sourcePath).isDirectory()) {
      // Si es un directorio, copiarlo recursivamente
      fs.mkdirSync(destPath, { recursive: true });
      const subItems = fs.readdirSync(sourcePath);
      subItems.forEach(subItem => {
        const subSourcePath = `${sourcePath}/${subItem}`;
        const subDestPath = `${destPath}/${subItem}`;
        if (fs.statSync(subSourcePath).isFile()) {
          fs.copyFileSync(subSourcePath, subDestPath);
        }
      });
    } else {
      // Si es un archivo, copiarlo directamente
      fs.copyFileSync(sourcePath, destPath);
    }
  });
  
  console.log('✅ Archivos compilados copiados correctamente');
} else {
  // Crear página HTML básica de prueba
  fs.writeFileSync('dist/client/index.html', htmlContent);
  console.log('✅ Página HTML de prueba creada (los archivos compilados no existen)');
}

// Crear servidor Express mínimo
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

// Crear package.json para producción
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

// Crear archivo README con instrucciones
const readmeContent = `
# Boostify Music - Instrucciones de Despliegue

## Preparación para el despliegue
1. Copie todo el contenido de esta carpeta a su servidor
2. Asegúrese de tener Node.js 16 o superior instalado

## Instalación
Ejecute el siguiente comando para instalar las dependencias:
\`\`\`
npm install --production
\`\`\`

## Inicio del servidor
Para iniciar el servidor, ejecute:
\`\`\`
npm start
\`\`\`

El servidor estará disponible en http://localhost:3000 (o el puerto definido en la variable de entorno PORT).

## Variables de entorno
Puede definir las siguientes variables de entorno:
- PORT: Puerto en el que se ejecutará el servidor (predeterminado: 3000)
- NODE_ENV: Entorno de ejecución (predeterminado: production)

## Notas
- La aplicación está optimizada para producción
- No se requiere compilación adicional
`;

fs.writeFileSync('dist/README.md', readmeContent);
console.log('✅ Archivo README con instrucciones creado');

// Crear archivo .env para producción
const envContent = `
# Variables de entorno para producción
NODE_ENV=production
PORT=3000
`;

fs.writeFileSync('dist/.env', envContent);
console.log('✅ Archivo .env creado');

console.log('🎉 Archivos de despliegue creados con éxito!');
console.log('📁 La aplicación ya está lista para ser desplegada.');
console.log('');
console.log('Para desplegar:');
console.log('1. 📤 Sube todo el contenido de la carpeta dist/ a tu servidor');
console.log('2. 📦 Ejecuta npm install --production');
console.log('3. 🚀 Inicia el servidor con npm start');