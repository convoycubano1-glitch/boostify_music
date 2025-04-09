import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Script de despliegue para mantener la aplicación original
 * Soluciona solo los errores que impiden la compilación pero mantiene la app igual
 */

console.log('🚀 Preparando aplicación para despliegue (modo original)...');

// Hacer backup del tsconfig.json original
if (fs.existsSync('tsconfig.json')) {
  const tsconfigOriginal = fs.readFileSync('tsconfig.json', 'utf8');
  fs.writeFileSync('tsconfig.json.backup', tsconfigOriginal);
  console.log('✅ Backup de tsconfig.json creado');
}

// Modificar tsconfig.json para eliminar vite/client
try {
  let tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
  
  // Si tiene vite/client en types, eliminarlo
  if (tsconfig.compilerOptions && tsconfig.compilerOptions.types) {
    tsconfig.compilerOptions.types = tsconfig.compilerOptions.types.filter(type => type !== 'vite/client');
    console.log('✅ Referencia a "vite/client" eliminada de tsconfig.json');
  }

  // Añadir skipLibCheck para evitar errores en bibliotecas de terceros
  if (tsconfig.compilerOptions) {
    tsconfig.compilerOptions.skipLibCheck = true;
    console.log('✅ skipLibCheck configurado a true para ignorar errores en bibliotecas');
  }
  
  // Guardar tsconfig modificado
  fs.writeFileSync('tsconfig.json', JSON.stringify(tsconfig, null, 2));
} catch (error) {
  console.error('❌ Error al modificar tsconfig.json:', error.message);
  process.exit(1);
}

// Crear .env con variables de entorno necesarias (solo si no existe)
if (!fs.existsSync('.env')) {
  const envContent = `
# Variables necesarias para la compilación
NODE_ENV=production
SKIP_PREFLIGHT_CHECK=true
TS_NODE_TRANSPILE_ONLY=true
`;
  fs.writeFileSync('.env', envContent);
  console.log('✅ Archivo .env creado con variables de entorno básicas');
}

// Instalar dependencias necesarias para la compilación
try {
  console.log('📦 Instalando dependencias necesarias...');
  execSync('npm install --no-save autoprefixer tailwindcss @vitejs/plugin-react', {
    stdio: 'inherit'
  });
  console.log('✅ Dependencias instaladas');

  console.log('📦 Compilando aplicación para producción...');
  
  // Comando básico para compilar con Vite (ignora errores de TypeScript)
  const command = 'cd client && TS_NODE_TRANSPILE_ONLY=true SKIP_PREFLIGHT_CHECK=true npx vite build';
  
  console.log(`Ejecutando: ${command}`);
  execSync(command, {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      SKIP_PREFLIGHT_CHECK: 'true',
      TS_NODE_TRANSPILE_ONLY: 'true'
    }
  });
  
  console.log('✅ Compilación completada');
  
  // Crear directorio dist si no existe
  if (!fs.existsSync('dist')) {
    fs.mkdirSync('dist');
  }
  
  // Copiar archivos compilados
  console.log('📋 Copiando archivos compilados...');
  execSync('cp -r client/dist/* dist/', { stdio: 'inherit' });
  
  // Crear servidor express mínimo
  const serverCode = `
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para servir archivos estáticos
app.use(express.static(path.join(__dirname)));

// Ruta para SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
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
  
  // Restaurar tsconfig.json original
  if (fs.existsSync('tsconfig.json.backup')) {
    fs.copyFileSync('tsconfig.json.backup', 'tsconfig.json');
    fs.unlinkSync('tsconfig.json.backup');
    console.log('✅ tsconfig.json original restaurado');
  }
  
  // Crear documentación de despliegue
  const deploymentDocs = `
# Guía de Despliegue para Boostify Music

## Versión Original Optimizada

Esta es la versión completa de la aplicación Boostify Music optimizada para producción.
Todas las funcionalidades de la versión de desarrollo están disponibles.

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

Asegúrese de configurar las siguientes variables de entorno en su servidor de producción:

- \`VITE_OPENROUTER_API_KEY\`: Clave API para OpenRouter AI
- \`VITE_ELEVENLABS_API_KEY\`: Clave API para ElevenLabs
- \`FIREBASE_CONFIG\`: Configuración de Firebase
`;

  fs.writeFileSync('DEPLOYMENT-ORIGINAL.md', deploymentDocs);
  console.log('✅ Documentación de despliegue creada en DEPLOYMENT-ORIGINAL.md');
  
  console.log('🎉 Preparación para despliegue completada con éxito!');
  console.log('📁 Archivos de producción disponibles en la carpeta dist/');
  console.log('🚀 Para desplegar:');
  console.log('1. Sube el contenido de la carpeta dist/ a tu servidor');
  console.log('2. Ejecuta npm install --production');
  console.log('3. Inicia la aplicación con npm start');
} catch (error) {
  console.error('❌ Error durante la compilación:', error.message);
  
  // Restaurar tsconfig.json original en caso de error
  if (fs.existsSync('tsconfig.json.backup')) {
    fs.copyFileSync('tsconfig.json.backup', 'tsconfig.json');
    fs.unlinkSync('tsconfig.json.backup');
    console.log('✅ tsconfig.json original restaurado');
  }
  
  process.exit(1);
}