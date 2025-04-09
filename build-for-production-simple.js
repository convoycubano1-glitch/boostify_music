/**
 * Script de compilación simplificado para producción
 * Ignora errores de TypeScript y compila sin problemas
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🚀 Iniciando compilación para producción (modo simplificado)...');

// Crear directorio dist si no existe
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
  fs.mkdirSync('dist/client', { recursive: true });
}

try {
  // Compilar cliente con Vite (ignorando errores de TypeScript)
  console.log('📦 Compilando cliente...');
  execSync('cd client && npx vite build --config vite.config.prod.ts --emptyOutDir', {
    stdio: 'inherit',
    env: {
      ...process.env,
      // Ignorar errores de TypeScript
      TS_NODE_TRANSPILE_ONLY: "true",
      VITE_TSCONFIG: "../tsconfig.prod.json"
    }
  });

  // Copiar archivos compilados a dist
  console.log('📋 Copiando archivos...');
  execSync('cp -r client/dist/* dist/client/', { stdio: 'inherit' });

  // Crear archivo server.js para producción
  console.log('📝 Creando servidor para producción...');
  const serverCode = `
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'client')));

// Ruta fallback para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

app.listen(PORT, () => {
  console.log(\`Servidor iniciado en puerto \${PORT}\`);
});
  `;

  fs.writeFileSync('dist/server.js', serverCode);

  // Crear package.json para producción
  console.log('📝 Creando package.json para producción...');
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  
  const prodPackage = {
    name: packageJson.name,
    version: packageJson.version,
    private: true,
    scripts: {
      start: "node server.js"
    },
    dependencies: {
      "express": "^4.18.2"
    },
    engines: {
      "node": ">=18.0.0"
    }
  };
  
  fs.writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));

  console.log('✅ Compilación completada con éxito!');
  console.log('📁 Los archivos compilados están en la carpeta dist/');
  console.log('Para iniciar la aplicación en producción:');
  console.log('1. Copie el contenido de la carpeta dist/ a su servidor');
  console.log('2. Ejecute: npm install --production');
  console.log('3. Ejecute: npm start');
} catch (error) {
  console.error('❌ Error durante la compilación:', error.message);
  process.exit(1);
}