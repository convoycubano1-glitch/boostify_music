/**
 * Script para iniciar la aplicación en modo espejo
 * Este script funciona sin necesidad de instalar dependencias
 */

import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para terminal
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

// Determinar configuración
const DEV_PORT = process.env.DEV_PORT || 5000;  // Puerto 5000 usado en Replit
const DEV_HOST = process.env.DEV_HOST || 'localhost';
const DEV_PROTOCOL = process.env.DEV_PROTOCOL || 'http';
const DEV_URL = `${DEV_PROTOCOL}://${DEV_HOST}:${DEV_PORT}`;

// Detectar si estamos en Replit
const isReplitEnv = !!process.env.REPL_SLUG || !!process.env.REPLIT;
const replitDevUrl = isReplitEnv ? `https://${process.env.REPL_SLUG || 'workspace'}.replit.app` : null;
const devUrl = replitDevUrl || DEV_URL;

console.log(`
${colors.magenta}=== SERVIDOR EN MODO ESPEJO ===${colors.reset}

Este servidor redirigirá todas las solicitudes al 
servidor de desarrollo en ${colors.cyan}${devUrl}${colors.reset}

Esto garantiza que la aplicación se vea y funcione
exactamente igual que en desarrollo.

${colors.yellow}IMPORTANTE: Asegúrate que el servidor de desarrollo esté funcionando${colors.reset}
`);

// Verificar si el servidor de desarrollo está disponible
async function checkDevServer() {
  return new Promise((resolve) => {
    console.log(`${colors.blue}Verificando conexión con el servidor de desarrollo...${colors.reset}`);
    
    const client = devUrl.startsWith('https') ? https : http;
    const req = client.get(devUrl, { timeout: 3000 }, (res) => {
      resolve(res.statusCode < 400);
    });
    
    req.on('error', () => {
      resolve(false);
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Crear servidor HTTP básico
function createServer() {
  const PORT = process.env.PORT || process.env.REPLIT_PORT || 3000;
  
  const server = http.createServer((req, res) => {
    // Si es un endpoint de API, mostrar mensaje informativo
    if (req.url.startsWith('/api/')) {
      if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          status: 'ok',
          mode: 'mirror-mode',
          time: new Date().toISOString(),
          devServer: devUrl
        }));
      }
      
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        message: 'Esta API debería ser manejada por el servidor en producción',
        redirectTo: devUrl + req.url
      }));
    }
    
    // Para todas las demás solicitudes, redirigir al servidor de desarrollo
    res.writeHead(302, { 'Location': devUrl + req.url });
    res.end();
  });
  
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`${colors.green}✅ Servidor iniciado en puerto ${PORT}${colors.reset}`);
    
    // URL para acceder al servidor
    const accessUrl = isReplitEnv 
      ? `https://${process.env.REPL_SLUG || 'workspace'}.replit.app`
      : `http://localhost:${PORT}`;
      
    console.log(`${colors.green}🌐 Accede a: ${accessUrl}${colors.reset}`);
    console.log(`${colors.green}🔄 Las solicitudes serán redirigidas a: ${devUrl}${colors.reset}`);
  });
  
  process.on('SIGINT', () => {
    console.log(`\n${colors.yellow}Deteniendo servidor...${colors.reset}`);
    server.close();
    process.exit(0);
  });
}

// Función principal
async function main() {
  try {
    // Verificar si debemos omitir la verificación
    const skipCheck = process.argv.includes('--skip-check') || process.env.SKIP_DEV_CHECK === 'true';
    
    if (skipCheck) {
      console.log(`${colors.yellow}⚠ Omitiendo verificación del servidor de desarrollo por solicitud${colors.reset}`);
      console.log(`${colors.yellow}⚠ Asegúrate que ${devUrl} esté accesible${colors.reset}`);
      createServer();
      return;
    }
    
    // Verificar servidor de desarrollo
    const isDevServerAvailable = await checkDevServer();
    
    if (isDevServerAvailable) {
      console.log(`${colors.green}✅ Servidor de desarrollo disponible en ${devUrl}${colors.reset}`);
      createServer();
    } else {
      console.log(`${colors.red}❌ No se pudo conectar con el servidor de desarrollo en ${devUrl}${colors.reset}`);
      console.log(`${colors.yellow}Opciones:${colors.reset}`);
      console.log(`1. Asegúrate de que el servidor de desarrollo esté en ejecución`);
      console.log(`2. Usa variables de entorno para configurar la URL correcta:`);
      console.log(`   DEV_HOST=miservidor DEV_PORT=5000 DEV_PROTOCOL=http node iniciar-espejo.js`);
      console.log(`3. Omite la verificación (no recomendado):`);
      console.log(`   node iniciar-espejo.js --skip-check`);
      
      // Preguntar si quiere continuar de todos modos
      console.log(`\n${colors.yellow}¿Quieres continuar de todos modos? (y/n)${colors.reset}`);
      process.stdin.once('data', (data) => {
        const input = data.toString().trim().toLowerCase();
        if (input === 'y' || input === 'yes' || input === 's' || input === 'si') {
          console.log(`${colors.yellow}Continuando sin verificación...${colors.reset}`);
          createServer();
        } else {
          console.log(`${colors.red}Abortando...${colors.reset}`);
          process.exit(1);
        }
      });
    }
  } catch (error) {
    console.error(`${colors.red}Error al iniciar el servidor: ${error.message}${colors.reset}`);
    console.log(`Puedes intentar omitir la verificación con: node iniciar-espejo.js --skip-check`);
    process.exit(1);
  }
}

main();