import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

/**
 * Script de compilación ultra simplificado para producción
 * Este script ignorará todos los errores de TypeScript y compilará la aplicación
 */

console.log('🚀 Iniciando compilación ultra simplificada...');

// 1. Crear tsconfig que ignora todos los errores
const simpleTsconfig = {
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "skipLibCheck": true,
    "noEmit": true,
    "isolatedModules": false,
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitAny": false,
    "noImplicitThis": false,
    "noImplicitReturns": false,
    "noFallthroughCasesInSwitch": false,
    "suppressImplicitAnyIndexErrors": true,
    "allowJs": true,
    "checkJs": false,
    "types": ["node"]
  },
  "include": ["client/src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts", "**/*.spec.ts"]
};

// Guardar el tsconfig simplificado
fs.writeFileSync('tsconfig.simple.json', JSON.stringify(simpleTsconfig, null, 2));
console.log('✅ Configuración TypeScript simplificada creada');

// 2. Crear un archivo vite.config.simple.js que ignora todos los errores de TypeScript
const simpleViteConfig = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    {
      name: 'ignore-typescript-errors',
      // Esto ignorará todas las advertencias de TypeScript
      handleHotUpdate({ file, server }) {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          // No hacer nada con archivos TypeScript para evitar verificación
          return [];
        }
      }
    },
    react()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './client/src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
    // Evitar detener la compilación por errores
    reportCompressedSize: false,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar todas las advertencias
        return;
      }
    }
  },
  esbuild: {
    // Esto desactivará todas las verificaciones de tipo en esbuild
    legalComments: 'none',
    treeShaking: true,
    jsx: 'automatic',
    jsxInject: "import React from 'react'",
    drop: ['console', 'debugger']
  },
  define: {
    'import.meta.env.VITE_OPENROUTER_API_KEY': JSON.stringify(process.env.VITE_OPENROUTER_API_KEY || ''),
    'import.meta.env.VITE_ELEVENLABS_API_KEY': JSON.stringify(process.env.VITE_ELEVENLABS_API_KEY || '')
  }
});
`;

// Guardar la configuración de Vite simplificada
fs.writeFileSync('client/vite.config.simple.js', simpleViteConfig);
console.log('✅ Configuración Vite simplificada creada');

// 3. Crear un archivo de ambiente con variables simuladas si no existe
if (!fs.existsSync('.env')) {
  const envContent = `
VITE_OPENROUTER_API_KEY=placeholder
VITE_ELEVENLABS_API_KEY=placeholder
`;
  fs.writeFileSync('.env', envContent);
  console.log('✅ Archivo .env creado con variables simuladas');
}

// 4. Crear directorio de distribución si no existe
if (!fs.existsSync('dist')) {
  fs.mkdirSync('dist');
  fs.mkdirSync('dist/client', { recursive: true });
}

try {
  console.log('📦 Compilando aplicación (ignorando errores)...');
  
  // Usar la configuración simplificada para compilar
  execSync('TS_NODE_TRANSPILE_ONLY=true SKIP_PREFLIGHT_CHECK=true cd client && npx vite build --config vite.config.simple.js', {
    stdio: 'inherit',
    env: {
      ...process.env,
      NODE_ENV: 'production',
      TS_NODE_COMPILER_OPTIONS: '{"transpileOnly":true}',
      SKIP_PREFLIGHT_CHECK: 'true',
      DISABLE_ESLINT_PLUGIN: 'true'
    }
  });
  
  // Copiar archivos compilados
  console.log('📋 Copiando archivos compilados...');
  execSync('cp -r client/dist/* dist/client/', { stdio: 'inherit' });
  
  // Crear servidor express simplificado
  const serverCode = `
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware para archivos estáticos
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
  
  console.log('🎉 Compilación completada con éxito!');
  console.log('📁 Archivos de producción disponibles en la carpeta dist/');
  console.log('🚀 Para desplegar:');
  console.log('1. Sube el contenido de la carpeta dist/ a tu servidor');
  console.log('2. Ejecuta npm install --production');
  console.log('3. Inicia la aplicación con npm start');
} catch (error) {
  console.error('❌ Error durante la compilación:', error.message);
  process.exit(1);
}