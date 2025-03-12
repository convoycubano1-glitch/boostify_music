/**
 * Script optimizado para compilación de producción
 * Este script resuelve problemas con alias @/ y asegura consistencia
 * entre desarrollo y producción
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
 * Esta función ajusta las rutas para que funcionen con los archivos procesados
 */
function createProductionViteConfig() {
  const viteConfigPath = path.join(__dirname, 'client', 'vite.config.prod.ts');
  const viteConfigContent = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración especial para producción
export default defineConfig({
  plugins: [react(), themePlugin()],
  root: path.resolve(__dirname),
  publicDir: path.resolve(__dirname, 'public'), 
  build: {
    outDir: path.resolve(__dirname, "../dist/public"),
    emptyOutDir: true,
    sourcemap: true,
  },
});
`;

  fs.writeFileSync(viteConfigPath, viteConfigContent);
  console.log(`\x1b[32m✓ Creado archivo de configuración Vite para producción\x1b[0m`);
}

// Función principal de construcción
async function buildForProduction() {
  console.log('\x1b[35m=== INICIANDO CONSTRUCCIÓN OPTIMIZADA PARA PRODUCCIÓN ===\x1b[0m');
  
  // Paso 1: Limpiar directorio de salida
  console.log('\x1b[36m\n>> Limpiando directorio de salida...\x1b[0m');
  const distPath = path.resolve(__dirname, 'dist');
  
  if (fs.existsSync(distPath)) {
    executeCommand(`rm -rf ${distPath}`);
  }
  
  fs.mkdirSync(distPath, { recursive: true });
  fs.mkdirSync(path.resolve(distPath, 'public'), { recursive: true });
  
  // Paso 2: Procesar archivos para corregir importaciones con alias @/
  console.log('\x1b[36m\n>> Procesando archivos para corregir importaciones...\x1b[0m');
  executeCommand('node fix-imports.js');
  
  // Paso 3: Crear configuración Vite optimizada para producción
  console.log('\x1b[36m\n>> Creando configuración Vite para producción...\x1b[0m');
  createProductionViteConfig();
  
  // Paso 4: Copiar public dir a src temporal
  console.log('\x1b[36m\n>> Copiando archivos públicos...\x1b[0m');
  executeCommand('cp -r client/public client/temp_src/');
  
  // Paso 5: Compilar frontend con Vite usando la configuración especializada
  console.log('\x1b[36m\n>> Compilando frontend optimizado...\x1b[0m');
  const viteSuccess = executeCommand('cd client && vite build --config vite.config.prod.ts');
  
  if (!viteSuccess) {
    console.error('\x1b[31m✗ Error: La compilación del frontend falló\x1b[0m');
    process.exit(1);
  }
  
  // Paso 6: Compilar backend o copiar archivos del servidor
  console.log('\x1b[36m\n>> Preparando archivos del servidor...\x1b[0m');
  
  // Copiar archivos estáticos del servidor
  executeCommand('cp -r server/*.js dist/ 2>/dev/null || :');
  executeCommand('cp package.json dist/');
  executeCommand('cp .env dist/ 2>/dev/null || echo "No .env file to copy"');
  
  // Paso 7: Crear un archivo de inicio para producción
  console.log('\x1b[36m\n>> Creando archivo de inicio para producción...\x1b[0m');
  
  const startScript = `
/**
 * Script de arranque optimizado para producción
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

// Importar módulos del servidor
import { registerRoutes } from './routes.js';

// Configuración básica
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Inicializar Express
const app = express();
app.use(express.json());

// Servir archivos estáticos desde 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Registrar rutas de la API
const server = createServer(app);
registerRoutes(app, server);

// Capturar todas las demás rutas y servir index.html (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar servidor
server.listen(PORT, HOST, () => {
  console.log(\`\\x1b[32m✓ Servidor ejecutándose en http://\${HOST}:\${PORT}\\x1b[0m\`);
});
`;

  fs.writeFileSync(path.join(distPath, 'start.js'), startScript);
  
  // Paso 8: Limpiar archivos temporales
  console.log('\x1b[36m\n>> Limpiando archivos temporales...\x1b[0m');
  executeCommand('rm -rf client/temp_src');
  
  console.log('\x1b[35m\n=== COMPILACIÓN COMPLETADA CON ÉXITO ===\x1b[0m');
  console.log('\x1b[32mPara iniciar la aplicación en producción:\x1b[0m');
  console.log('\x1b[33mcd dist && node start.js\x1b[0m');
}

// Ejecutar la función principal
buildForProduction().catch(error => {
  console.error('\x1b[31mError en el proceso de construcción:', error, '\x1b[0m');
  process.exit(1);
});