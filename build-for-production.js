/**
 * Script optimizado para compilación de producción
 * Este script realiza todos los pasos necesarios para preparar el proyecto para producción
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

/**
 * Ejecuta un comando de shell y muestra su salida en tiempo real
 * @param {string} command - El comando a ejecutar
 * @param {object} options - Opciones para la ejecución
 */
function executeCommand(command, options = {}) {
  console.log(`${colors.cyan}\nEjecutando:${colors.reset} ${command}`);
  
  try {
    execSync(command, {
      stdio: 'inherit',
      ...options
    });
    console.log(`${colors.green}✓ Comando completado con éxito${colors.reset}`);
    return true;
  } catch (error) {
    console.error(`${colors.red}✗ Error al ejecutar comando: ${error.message}${colors.reset}`);
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
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    }
  }
});
`;

  fs.writeFileSync(viteConfigPath, viteConfigContent);
  console.log(`${colors.green}✓ Creado archivo de configuración Vite para producción${colors.reset}`);
}

/**
 * Crea un archivo de inicio para producción
 */
function createProductionStartScript() {
  const startScriptPath = path.join(__dirname, 'dist', 'start.js');
  const startScriptContent = `
/**
 * Script de arranque optimizado para producción
 */
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

// Importar módulos del servidor
import { registerRoutes } from './server/routes.js';

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
  console.log(\`${colors.green}✓ Servidor ejecutándose en http://\${HOST}:\${PORT}${colors.reset}\`);
});
`;

  fs.writeFileSync(startScriptPath, startScriptContent);
  console.log(`${colors.green}✓ Creado archivo de inicio para producción${colors.reset}`);
}

// Función principal de construcción
async function buildForProduction() {
  console.log(`${colors.magenta}=== INICIANDO CONSTRUCCIÓN PARA PRODUCCIÓN ===${colors.reset}`);
  
  // Paso 1: Limpiar directorio de salida
  console.log(`${colors.cyan}\n>> Limpiando directorio de salida...${colors.reset}`);
  const distPath = path.resolve(__dirname, 'dist');
  
  if (fs.existsSync(distPath)) {
    executeCommand(`rm -rf ${distPath}`);
  }
  
  fs.mkdirSync(distPath, { recursive: true });
  fs.mkdirSync(path.resolve(distPath, 'public'), { recursive: true });
  fs.mkdirSync(path.resolve(distPath, 'server'), { recursive: true });
  
  // Paso 2: Crear configuración Vite optimizada para producción
  console.log(`${colors.cyan}\n>> Creando configuración Vite para producción...${colors.reset}`);
  createProductionViteConfig();
  
  // Paso 3: Ejecutar TypeScript para compilar el servidor
  console.log(`${colors.cyan}\n>> Compilando archivos del servidor con TypeScript...${colors.reset}`);
  const tscSuccess = executeCommand('tsc --project tsconfig.json');
  
  if (!tscSuccess) {
    console.error(`${colors.red}✗ Error: La compilación del servidor con TypeScript falló${colors.reset}`);
    process.exit(1);
  }
  
  // Paso 4: Compilar frontend con Vite usando la configuración especializada
  console.log(`${colors.cyan}\n>> Compilando frontend con Vite...${colors.reset}`);
  const viteSuccess = executeCommand('cd client && vite build --config vite.config.prod.ts');
  
  if (!viteSuccess) {
    console.error(`${colors.red}✗ Error: La compilación del frontend falló${colors.reset}`);
    process.exit(1);
  }
  
  // Paso 5: Copiar archivos necesarios
  console.log(`${colors.cyan}\n>> Copiando archivos adicionales...${colors.reset}`);
  executeCommand('cp package.json dist/');
  executeCommand('cp -r node_modules dist/');
  executeCommand('cp .env dist/ 2>/dev/null || echo "No .env file to copy"');
  
  // Paso 6: Crear un archivo de inicio para producción
  console.log(`${colors.cyan}\n>> Creando archivo de inicio para producción...${colors.reset}`);
  createProductionStartScript();
  
  console.log(`${colors.magenta}\n=== COMPILACIÓN COMPLETADA CON ÉXITO ===${colors.reset}`);
  console.log(`${colors.green}Para iniciar la aplicación en producción:${colors.reset}`);
  console.log(`${colors.yellow}cd dist && node start.js${colors.reset}`);
}

// Ejecutar la función principal
buildForProduction().catch(error => {
  console.error(`${colors.red}Error en el proceso de construcción:${colors.reset}`, error);
  process.exit(1);
});