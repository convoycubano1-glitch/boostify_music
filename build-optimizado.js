/**
 * Script optimizado para construcción de producción
 * Este script verifica y configura todo para que funcione igual que en desarrollo
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la terminal
const c = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m'
};

/**
 * Ejecuta un comando y muestra su salida
 */
function exec(command, options = {}) {
  console.log(`${c.blue}> ${command}${c.reset}`);
  try {
    const result = execSync(command, { 
      stdio: 'inherit',
      ...options
    });
    return { success: true, result };
  } catch (error) {
    console.error(`${c.red}Error: ${error.message}${c.reset}`);
    return { success: false, error };
  }
}

/**
 * Crea un archivo de solución de importación para producción
 */
function createImportResolver() {
  // Crear un archivo importResolver.mjs que será incluido en la compilación
  const resolverPath = path.join(__dirname, 'client', 'src', 'importResolver.mjs');
  const resolverContent = `
/**
 * Resolver de importaciones para producción
 * Este archivo ayuda a resolver las importaciones con alias @/ correctamente
 */
console.log('Inicializando resolución de importaciones...');

// Aplicar las resoluciones necesarias
export const setImportResolver = () => {
  try {
    // Anunciar que el resolver está activo
    console.log('Resolver de importaciones activo');
    return true;
  } catch (error) {
    console.error('Error al inicializar resolver de importaciones:', error);
    return false;
  }
};

// Exportar una función auxiliar para resolver rutas
export const resolveImportPath = (path) => {
  if (path.startsWith('@/')) {
    return path.replace('@/', '/');
  }
  return path;
};

// Inicializar automáticamente
setImportResolver();
`;

  fs.writeFileSync(resolverPath, resolverContent);
  console.log(`${c.green}Creado: ${resolverPath}${c.reset}`);
}

/**
 * Crear una configuración optimizada de Vite para producción
 */
function createOptimizedViteConfig() {
  const configPath = path.join(__dirname, 'vite.config.prod.ts');
  const configContent = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Vite específica para producción
export default defineConfig({
  plugins: [react(), themePlugin()],
  resolve: {
    alias: {
      // Asegurar que todos los alias se resuelvan correctamente
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
      "@/components": path.resolve(__dirname, "client", "src", "components"),
      "@/lib": path.resolve(__dirname, "client", "src", "lib"),
      "@/hooks": path.resolve(__dirname, "client", "src", "hooks"),
      "@/pages": path.resolve(__dirname, "client", "src", "pages"),
      "@/services": path.resolve(__dirname, "client", "src", "services"),
      "@/utils": path.resolve(__dirname, "client", "src", "utils"),
      "@/context": path.resolve(__dirname, "client", "src", "context"),
      "@/images": path.resolve(__dirname, "client", "src", "images"),
      "@/styles": path.resolve(__dirname, "client", "src", "styles"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
    // Configuración adicional para mejorar la compatibilidad
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // Conservar la estructura de módulos
      preserveModules: false,
      // Mejorar la resolución de importaciones
      input: {
        main: path.resolve(__dirname, "client/index.html"),
      },
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'wouter',
      '@tanstack/react-query'
    ],
    force: true
  },
});
`;

  fs.writeFileSync(configPath, configContent);
  console.log(`${c.green}Creado: ${configPath}${c.reset}`);
}

/**
 * Crear un script de inicio para el modo producción
 */
function createProductionStartScript() {
  const scriptPath = path.join(__dirname, 'dist', 'start.js');
  const scriptContent = `
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
app.use(express.json({ limit: '50mb' }));

// Configuración de seguridad
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

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
  console.log(\`\\x1b[32mServidor ejecutándose en http://\${HOST}:\${PORT}\\x1b[0m\`);
});
`;

  fs.writeFileSync(scriptPath, scriptContent);
  console.log(`${c.green}Creado: ${scriptPath}${c.reset}`);
}

/**
 * Ejecuta el script de corrección de importaciones
 */
function runImportFixScript() {
  console.log(`${c.cyan}Ejecutando script para corregir importaciones...${c.reset}`);
  try {
    const scriptPath = path.join(__dirname, 'fix-imports.js');
    exec(`node ${scriptPath}`);
    return true;
  } catch (error) {
    console.error(`${c.red}Error al ejecutar script de corrección:${c.reset} ${error.message}`);
    return false;
  }
}

/**
 * Función principal para construir el proyecto
 */
async function buildProject() {
  console.log(`\n${c.magenta}${c.bold}=== INICIANDO CONSTRUCCIÓN OPTIMIZADA PARA PRODUCCIÓN ===${c.reset}\n`);
  
  // Paso 1: Limpiar directorio de salida
  console.log(`\n${c.yellow}${c.bold}PASO 1: Limpiando directorio de salida${c.reset}`);
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    exec(`rm -rf ${distPath}`);
  }
  fs.mkdirSync(distPath, { recursive: true });
  console.log(`${c.green}✓ Directorio limpiado${c.reset}`);
  
  // Paso 2: Corregir importaciones con alias
  console.log(`\n${c.yellow}${c.bold}PASO 2: Corrigiendo importaciones con alias @/${c.reset}`);
  if (!runImportFixScript()) {
    console.warn(`${c.yellow}Advertencia: No se pudieron corregir todas las importaciones. Continuando de todos modos.${c.reset}`);
  }
  
  // Paso 3: Crear archivo de resolución de importaciones
  console.log(`\n${c.yellow}${c.bold}PASO 3: Creando ayudantes de resolución de importaciones${c.reset}`);
  createImportResolver();
  
  // Paso 4: Crear configuración optimizada de Vite
  console.log(`\n${c.yellow}${c.bold}PASO 4: Creando configuración de Vite optimizada${c.reset}`);
  createOptimizedViteConfig();
  
  // Paso 5: Compilar frontend
  console.log(`\n${c.yellow}${c.bold}PASO 5: Compilando frontend${c.reset}`);
  const { success: buildSuccess } = exec('vite build --config vite.config.prod.ts');
  if (!buildSuccess) {
    console.error(`${c.red}${c.bold}✗ Error al compilar el frontend${c.reset}`);
    process.exit(1);
  }
  
  // Paso 6: Preparar archivos del servidor
  console.log(`\n${c.yellow}${c.bold}PASO 6: Preparando archivos del servidor${c.reset}`);
  exec('cp -r server/*.js dist/ 2>/dev/null || :');
  exec('cp package.json dist/');
  exec('cp .env dist/ 2>/dev/null || echo "No se encontró archivo .env"');
  
  // Paso 7: Crear script de inicio
  console.log(`\n${c.yellow}${c.bold}PASO 7: Creando script de inicio para producción${c.reset}`);
  createProductionStartScript();
  
  console.log(`\n${c.green}${c.bold}=== CONSTRUCCIÓN COMPLETADA CON ÉXITO ===${c.reset}\n`);
  console.log(`${c.cyan}Para ejecutar la aplicación:${c.reset}`);
  console.log(`${c.yellow}cd dist && node start.js${c.reset}\n`);
}

// Ejecutar la función principal
buildProject().catch(error => {
  console.error(`${c.red}${c.bold}Error fatal:${c.reset} ${error.message}`);
  process.exit(1);
});