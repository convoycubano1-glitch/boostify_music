/**
 * Script de construcción simplificado para producción
 * Mantiene el mismo comportamiento que en desarrollo
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
function exec(command) {
  console.log(`${c.blue}> ${command}${c.reset}`);
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${c.red}Error: ${error.message}${c.reset}`);
    return false;
  }
}

/**
 * Crea un vite.config.prod.ts optimizado
 */
function createProductionConfig() {
  const configContent = `
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración optimizada para producción
export default defineConfig({
  plugins: [react(), themePlugin()],
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
      "@/components": path.resolve(__dirname, "client", "src", "components"),
      "@/lib": path.resolve(__dirname, "client", "src", "lib"),
      "@/hooks": path.resolve(__dirname, "client", "src", "hooks"),
      "@/pages": path.resolve(__dirname, "client", "src", "pages"),
      "@/styles": path.resolve(__dirname, "client", "src", "styles"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    force: true
  },
});
  `;

  fs.writeFileSync(path.join(__dirname, 'vite.config.prod.ts'), configContent);
  console.log(`${c.green}✓ Configuración de producción creada${c.reset}`);
}

/**
 * Crea un script de inicio para el modo producción
 */
function createStartScript() {
  const scriptContent = `
/**
 * Script de inicio para la aplicación en producción
 */
const express = require('express');
const path = require('path');
const { registerRoutes } = require('./routes');
const { createServer } = require('http');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// Configuración del middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Registrar rutas de la API
const server = createServer(app);
registerRoutes(app, server);

// Capturar todas las demás rutas para el SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar el servidor
server.listen(PORT, HOST, () => {
  console.log(\`Servidor ejecutándose en http://\${HOST}:\${PORT}\`);
});
  `;

  fs.writeFileSync(path.join(__dirname, 'dist', 'start.js'), scriptContent);
  console.log(`${c.green}✓ Script de inicio creado${c.reset}`);
}

async function build() {
  console.log(`\n${c.magenta}${c.bold}=== INICIANDO CONSTRUCCIÓN SIMPLIFICADA PARA PRODUCCIÓN ===${c.reset}\n`);
  
  // Paso 1: Limpiar directorio de salida
  console.log(`\n${c.yellow}${c.bold}PASO 1: Limpiando directorio de salida${c.reset}`);
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    exec(`rm -rf ${distPath}`);
  }
  fs.mkdirSync(distPath, { recursive: true });
  
  // Paso 2: Crear configuración optimizada de Vite
  console.log(`\n${c.yellow}${c.bold}PASO 2: Creando configuración para producción${c.reset}`);
  createProductionConfig();
  
  // Paso 3: Compilar frontend
  console.log(`\n${c.yellow}${c.bold}PASO 3: Compilando frontend${c.reset}`);
  if (!exec('npx vite build --config vite.config.prod.ts')) {
    process.exit(1);
  }
  
  // Paso 4: Copiar archivos del servidor
  console.log(`\n${c.yellow}${c.bold}PASO 4: Copiando archivos del servidor${c.reset}`);
  exec('cp -r server/*.js dist/ 2>/dev/null || :');
  exec('cp -r db dist/ 2>/dev/null || :');
  exec('cp package.json dist/');
  exec('cp .env dist/ 2>/dev/null || echo "No se encontró archivo .env"');
  
  // Paso 5: Crear script de inicio
  console.log(`\n${c.yellow}${c.bold}PASO 5: Creando script de inicio${c.reset}`);
  createStartScript();
  
  console.log(`\n${c.green}${c.bold}=== CONSTRUCCIÓN COMPLETADA CON ÉXITO ===${c.reset}\n`);
  console.log(`${c.cyan}Para ejecutar la aplicación:${c.reset}`);
  console.log(`${c.yellow}cd dist && node start.js${c.reset}\n`);
}

// Ejecutar construcción
build().catch(error => {
  console.error(`${c.red}${c.bold}Error fatal:${c.reset} ${error.message}`);
  process.exit(1);
});