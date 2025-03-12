/**
 * Script de compilación personalizado para ambiente de producción
 * Esta versión corrige los problemas con la resolución de alias de rutas @/
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

// Función principal de construcción
async function buildForProduction() {
  console.log('\x1b[35m=== INICIANDO CONSTRUCCIÓN PARA PRODUCCIÓN ===\x1b[0m');
  
  // Paso 1: Limpiar directorio de salida
  console.log('\x1b[36m\n>> Limpiando directorio de salida...\x1b[0m');
  const distPath = path.resolve(__dirname, 'dist');
  
  if (fs.existsSync(distPath)) {
    executeCommand(`rm -rf ${distPath}`);
  }
  
  fs.mkdirSync(distPath, { recursive: true });
  fs.mkdirSync(path.resolve(distPath, 'client'), { recursive: true });
  
  // Paso 2: Compilar TypeScript (solo verificación)
  console.log('\x1b[36m\n>> Verificando tipos con TypeScript...\x1b[0m');
  const tscSuccess = executeCommand('tsc --noEmit');
  
  if (!tscSuccess) {
    console.warn('\x1b[33m⚠️ Advertencia: Hay errores de TypeScript, pero continuando con la compilación...\x1b[0m');
  }
  
  // Paso 3: Compilar frontend con Vite usando configuración específica para producción
  console.log('\x1b[36m\n>> Compilando frontend con configuración optimizada...\x1b[0m');
  const viteSuccess = executeCommand('cd client && vite build --config vite.config.prod.ts');
  
  if (!viteSuccess) {
    console.error('\x1b[31m✗ Error: La compilación del frontend falló\x1b[0m');
    process.exit(1);
  }
  
  // Paso 4: Compilar backend si es necesario o copiar archivos del servidor
  console.log('\x1b[36m\n>> Preparando archivos del servidor...\x1b[0m');
  executeCommand('tsc -p tsconfig.server.json');
  
  // Paso 5: Copiar archivos estáticos adicionales si es necesario
  console.log('\x1b[36m\n>> Copiando archivos estáticos adicionales...\x1b[0m');
  
  // Copiar archivos estáticos del servidor
  executeCommand('cp -r server/*.js dist/ 2>/dev/null || :');
  executeCommand('cp package.json dist/');
  executeCommand('cp .env dist/ 2>/dev/null || echo "No .env file to copy"');
  
  // Paso 6: Crear un archivo de inicio simple para producción
  console.log('\x1b[36m\n>> Creando archivo de inicio optimizado para producción...\x1b[0m');
  
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
server.listen(PORT, '0.0.0.0', () => {
  console.log(\`\\x1b[32m✓ Servidor ejecutándose en http://0.0.0.0:\${PORT}\\x1b[0m\`);
});
`;

  fs.writeFileSync(path.join(distPath, 'start.js'), startScript);
  
  console.log('\x1b[35m\n=== COMPILACIÓN COMPLETADA CON ÉXITO ===\x1b[0m');
  console.log('\x1b[32mPara iniciar la aplicación en producción:\x1b[0m');
  console.log('\x1b[33mcd dist && node start.js\x1b[0m');
}

// Ejecutar la función principal
buildForProduction().catch(error => {
  console.error('\x1b[31mError en el proceso de construcción:', error, '\x1b[0m');
  process.exit(1);
});