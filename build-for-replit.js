/**
 * Script de construcción optimizado para Replit con soporte para alias de rutas
 * Resuelve problemas con @/ y asegura que los componentes de música/video funcionen
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ejecuta un comando de shell y muestra su salida en tiempo real
 * @param {string} command - El comando a ejecutar
 * @param {object} options - Opciones para la ejecución
 * @returns {boolean} - Éxito de la ejecución
 */
function executeCommand(command, options = {}) {
  console.log(`\x1b[36m\nEjecutando:\x1b[0m ${command}`);
  
  try {
    execSync(command, {
      stdio: 'inherit',
      ...options
    });
    console.log(`\x1b[32m✓ Comando completado con éxito\x1b[0m`);
    return true;
  } catch (error) {
    console.error(`\x1b[31m✗ Error al ejecutar comando: ${error.message}\x1b[0m`);
    return false;
  }
}

/**
 * Crea una versión modificada del vite.config.ts para la compilación
 * con soporte específico para alias @/
 */
function createProductionViteConfig() {
  // Asegurar que el directorio existe
  const clientDir = path.join(__dirname, 'client');
  if (!fs.existsSync(clientDir)) {
    fs.mkdirSync(clientDir, { recursive: true });
  }
  
  const viteConfigPath = path.join(clientDir, 'vite.config.prod.ts');
  const viteConfigContent = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  root: __dirname,
  build: {
    outDir: "../dist/client",
    emptyOutDir: true,
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
});
`;

  fs.writeFileSync(viteConfigPath, viteConfigContent);
  console.log(`\x1b[32m✓ Creado archivo de configuración Vite para producción\x1b[0m`);
}

/**
 * Crea un script de inicio para la aplicación en producción
 * @param {string} distPath - Ruta al directorio de distribución
 */
function createStartScript(distPath) {
  const startScriptPath = path.join(distPath, 'start.js');
  const startScriptContent = `
/**
 * Script de arranque optimizado para producción
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';
import fs from 'fs';

// Configuración básica
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Inicializar Express
const app = express();
app.use(express.json());

// Middleware para logging de solicitudes
app.use((req, res, next) => {
  console.log(\`\\x1b[36m[\${new Date().toISOString()}] \${req.method} \${req.url}\\x1b[0m\`);
  next();
});

// Middleware para error handling
app.use((err, req, res, next) => {
  console.error(\`\\x1b[31mError: \${err.message}\\x1b[0m\`);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'client')));

// Importar rutas de la API si el archivo existe
try {
  if (fs.existsSync(path.join(__dirname, 'server', 'routes.js'))) {
    const { registerRoutes } = await import('./server/routes.js');
    const server = createServer(app);
    registerRoutes(app, server);
  } else {
    console.warn(\`\\x1b[33mAdvertencia: No se encontró el archivo routes.js\\x1b[0m\`);
    const server = createServer(app);
    server.listen(PORT, HOST, () => {
      console.log(\`\\x1b[32m✓ Servidor ejecutándose en http://\${HOST}:\${PORT}\\x1b[0m\`);
    });
  }
} catch (error) {
  console.error(\`\\x1b[31mError al importar rutas: \${error.message}\\x1b[0m\`);
}

// Capturar todas las demás rutas y servir index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});
`;

  fs.writeFileSync(startScriptPath, startScriptContent);
  console.log(`\x1b[32m✓ Creado script de inicio para producción\x1b[0m`);
}

/**
 * Verifica las dependencias necesarias para el proceso de construcción
 * e instala las que falten
 */
function checkAndInstallDependencies() {
  console.log('\x1b[36m\n>> Verificando dependencias necesarias...\x1b[0m');
  
  // Lista de dependencias esenciales para la construcción
  const dependencies = ['vite', 'typescript', '@vitejs/plugin-react'];
  
  for (const dep of dependencies) {
    try {
      // Intentar importar la dependencia para verificar si está disponible
      require.resolve(dep);
    } catch (error) {
      console.log(`\x1b[33mInstalando dependencia faltante: ${dep}...\x1b[0m`);
      
      if (!executeCommand(`npm install --save-dev ${dep}`)) {
        console.error(`\x1b[31m✗ Error al instalar ${dep}. Intente instalarlo manualmente.\x1b[0m`);
      }
    }
  }
}

/**
 * Función principal para la construcción del proyecto
 */
async function buildProject() {
  console.log('\x1b[35m=== INICIANDO CONSTRUCCIÓN PARA REPLIT ===\x1b[0m');
  
  // Verificar dependencias necesarias
  checkAndInstallDependencies();
  
  // Limpiar directorio de salida
  console.log('\x1b[36m\n>> Limpiando directorio de salida...\x1b[0m');
  const distPath = path.resolve(__dirname, 'dist');
  
  if (fs.existsSync(distPath)) {
    executeCommand(`rm -rf ${distPath}`);
  }
  
  fs.mkdirSync(distPath, { recursive: true });
  fs.mkdirSync(path.join(distPath, 'client'), { recursive: true });
  fs.mkdirSync(path.join(distPath, 'server'), { recursive: true });
  
  // Crear configuración Vite para producción
  console.log('\x1b[36m\n>> Preparando configuración para Vite...\x1b[0m');
  createProductionViteConfig();
  
  // Compilar frontend con Vite usando la configuración personalizada
  console.log('\x1b[36m\n>> Compilando frontend...\x1b[0m');
  const viteSuccess = executeCommand('cd client && npx vite build --config vite.config.prod.ts');
  
  if (!viteSuccess) {
    console.error('\x1b[31m✗ Error: La compilación del frontend falló\x1b[0m');
    // Intentar con la configuración por defecto como respaldo
    console.log('\x1b[33m\nIntentando con configuración por defecto...\x1b[0m');
    
    if (!executeCommand('cd client && npx vite build')) {
      console.error('\x1b[31m✗ Error: No se pudo compilar el frontend. Abortando.\x1b[0m');
      process.exit(1);
    }
  }
  
  // Compilar servidor o copiar archivos necesarios
  console.log('\x1b[36m\n>> Preparando archivos del servidor...\x1b[0m');
  
  // Intentar compilar con TypeScript o copiar archivos si falla
  const serverCompileSuccess = executeCommand('npx tsc -p tsconfig.server.json');
  
  if (!serverCompileSuccess) {
    console.warn('\x1b[33m⚠️ La compilación del servidor falló, copiando archivos directamente...\x1b[0m');
    
    // Copiar archivos JavaScript del servidor
    executeCommand('cp -r server/*.js dist/server/ 2>/dev/null || :');
    executeCommand('cp -r server/*.json dist/server/ 2>/dev/null || :');
  }
  
  // Copiar archivos esenciales
  console.log('\x1b[36m\n>> Copiando archivos esenciales...\x1b[0m');
  executeCommand('cp package.json dist/');
  executeCommand('cp .env dist/ 2>/dev/null || echo "No se encontró archivo .env"');
  
  // Crear script de inicio
  console.log('\x1b[36m\n>> Creando script de inicio...\x1b[0m');
  createStartScript(distPath);
  
  // Crear un package.json optimizado para producción
  console.log('\x1b[36m\n>> Creando package.json para producción...\x1b[0m');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
    
    // Simplificar scripts para producción
    packageJson.scripts = {
      "start": "node start.js"
    };
    
    // Mantener solo dependencias de producción
    delete packageJson.devDependencies;
    
    fs.writeFileSync(
      path.join(distPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
  } catch (error) {
    console.error('\x1b[31m✗ Error al crear package.json para producción:', error.message, '\x1b[0m');
  }
  
  console.log('\x1b[35m\n=== CONSTRUCCIÓN COMPLETADA CON ÉXITO ===\x1b[0m');
  console.log('\x1b[32mPara iniciar la aplicación en producción:\x1b[0m');
  console.log('\x1b[33mcd dist && npm start\x1b[0m');
}

// Ejecutar la construcción
buildProject().catch(error => {
  console.error('\x1b[31mError en el proceso de construcción:', error, '\x1b[0m');
  process.exit(1);
});