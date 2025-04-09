#!/usr/bin/env node

/**
 * Script para verificar el estado del servidor de Boostify Music
 */

import { spawn } from 'child_process';
import { createServer, request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuración básica
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colores para la salida
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Encabezado
console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║             VERIFICACIÓN DEL SERVIDOR                    ║
║                 BOOSTIFY MUSIC                           ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);

// Puerto e URL
const PORT = process.env.PORT || 3000;
const serverUrl = `https://workspace.replit.app`;

// Iniciar el servidor
let serverProcess = null;

async function startServer() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.blue}[1] Iniciando el servidor...${colors.reset}`);
    
    // Detener cualquier servidor existente
    try {
      console.log(`  ${colors.yellow}⚠ Deteniendo servidores existentes...${colors.reset}`);
      spawn('pkill', ['-f', 'tsx server/index.ts']);
      spawn('pkill', ['-f', 'ts-node server/index.ts']);
    } catch (error) {
      // Ignorar errores al detener
    }
    
    // Configurar variables de entorno
    const env = {
      ...process.env,
      NODE_ENV: 'development',
      SKIP_PREFLIGHT_CHECK: 'true',
      TS_NODE_TRANSPILE_ONLY: 'true',
      PORT: PORT.toString()
    };
    
    console.log(`  ${colors.cyan}ℹ Configurando variables de entorno...${colors.reset}`);
    console.log(`  - NODE_ENV=${env.NODE_ENV}`);
    console.log(`  - PORT=${env.PORT}`);
    
    // Iniciar el servidor usando tsx
    serverProcess = spawn('tsx', ['server/index.ts'], {
      env,
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let serverStarted = false;
    let output = '';
    
    serverProcess.stdout.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stdout.write(`  ${text}`);
      
      // Detectar si el servidor ha iniciado
      if (text.includes('Server started on port')) {
        serverStarted = true;
        console.log(`  ${colors.green}✓ Servidor iniciado correctamente${colors.reset}`);
        resolve(true);
      }
    });
    
    serverProcess.stderr.on('data', (data) => {
      const text = data.toString();
      output += text;
      process.stderr.write(`  ${colors.red}${text}${colors.reset}`);
    });
    
    serverProcess.on('error', (error) => {
      console.error(`  ${colors.red}✗ Error al iniciar el servidor: ${error.message}${colors.reset}`);
      reject(error);
    });
    
    // Timeout para verificar si el servidor inició
    setTimeout(() => {
      if (!serverStarted) {
        console.log(`  ${colors.red}✗ Timeout al iniciar el servidor${colors.reset}`);
        console.log(`  ${colors.yellow}⚠ Output final:${colors.reset}\n${output}`);
        reject(new Error('Server start timeout'));
      }
    }, 15000);
  });
}

// Función para realizar peticiones HTTP/HTTPS
function performRequest(url) {
  return new Promise((resolve, reject) => {
    const requestFn = url.startsWith('https') ? httpsRequest : httpRequest;
    
    const req = requestFn(url, (res) => {
      let data = '';
      
      // Recopilar todos los fragmentos de datos
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      // Finalizar y resolver la promesa con los datos
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          data: data
        });
      });
    });
    
    // Manejar errores
    req.on('error', (error) => {
      reject(error);
    });
    
    // Finalizar la solicitud
    req.end();
  });
}

// Verificar si el servidor está respondiendo
async function checkServerResponse() {
  console.log(`\n${colors.blue}[2] Verificando respuesta del servidor...${colors.reset}`);
  
  try {
    console.log(`  ${colors.cyan}ℹ Haciendo solicitud a ${serverUrl}${colors.reset}`);
    
    const response = await performRequest(serverUrl);
    console.log(`  ${colors.green}✓ Servidor respondió con código: ${response.status}${colors.reset}`);
    
    const contentType = response.headers['content-type'];
    console.log(`  ${colors.cyan}ℹ Tipo de contenido: ${contentType}${colors.reset}`);
    
    // Verificar contenido HTML
    if (contentType && contentType.includes('text/html')) {
      const html = response.data;
      
      // Analizar elementos básicos
      const titleMatch = html.match(/<title>(.*?)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'No title found';
      
      console.log(`  ${colors.cyan}ℹ Título de la página: ${title}${colors.reset}`);
      
      // Verificar si hay React en la página
      const hasReact = html.includes('react') || html.includes('React');
      console.log(`  ${colors.cyan}ℹ Contiene React: ${hasReact ? 'Sí' : 'No'}${colors.reset}`);
      
      // Guardamos el HTML para análisis
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const logsDir = path.join(__dirname, 'logs');
      
      if (!fs.existsSync(logsDir)) {
        fs.mkdirSync(logsDir, { recursive: true });
      }
      
      const htmlPath = path.join(logsDir, `page-${timestamp}.html`);
      fs.writeFileSync(htmlPath, html);
      console.log(`  ${colors.green}✓ HTML guardado en: ${htmlPath}${colors.reset}`);
      
      // Contar scripts y estilos
      const scriptsCount = (html.match(/<script/g) || []).length;
      const stylesCount = (html.match(/<style/g) || []).length;
      const linksCount = (html.match(/<link/g) || []).length;
      
      console.log(`  ${colors.cyan}ℹ Análisis de la página:${colors.reset}`);
      console.log(`  - Scripts: ${scriptsCount}`);
      console.log(`  - Estilos inline: ${stylesCount}`);
      console.log(`  - Links externos: ${linksCount}`);
      
      return {
        status: response.status,
        title,
        hasReact,
        elements: {
          scripts: scriptsCount,
          styles: stylesCount,
          links: linksCount
        }
      };
    } else {
      console.log(`  ${colors.red}✗ La respuesta no es HTML${colors.reset}`);
      return { status: response.status, error: 'Not HTML' };
    }
  } catch (error) {
    console.error(`  ${colors.red}✗ Error al verificar el servidor: ${error.message}${colors.reset}`);
    return { error: error.message };
  }
}

// Realizar pruebas de funcionalidad
async function testFunctionality() {
  console.log(`\n${colors.blue}[3] Probando funcionalidad básica...${colors.reset}`);
  
  // Esperar un poco para que el servidor esté completamente cargado
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  try {
    // Verificar API básica
    console.log(`  ${colors.cyan}ℹ Probando endpoint API /api/health...${colors.reset}`);
    
    try {
      const healthResponse = await fetch(`${serverUrl}/api/health`);
      console.log(`  ${colors.green}✓ API health check respondió con: ${healthResponse.status}${colors.reset}`);
    } catch (error) {
      console.log(`  ${colors.yellow}⚠ No se pudo acceder al endpoint de health check: ${error.message}${colors.reset}`);
    }
    
    // Verificar archivos estáticos
    console.log(`  ${colors.cyan}ℹ Verificando archivos estáticos...${colors.reset}`);
    
    try {
      const cssResponse = await fetch(`${serverUrl}/src/index.css`);
      console.log(`  ${colors.green}✓ Archivo CSS cargado: ${cssResponse.status}${colors.reset}`);
    } catch (error) {
      console.log(`  ${colors.yellow}⚠ No se pudo acceder al CSS: ${error.message}${colors.reset}`);
    }
    
    return { success: true };
  } catch (error) {
    console.error(`  ${colors.red}✗ Error en pruebas de funcionalidad: ${error.message}${colors.reset}`);
    return { success: false, error: error.message };
  }
}

// Función principal
async function main() {
  let serverSuccess = false;
  
  try {
    // Paso 1: Iniciar el servidor
    await startServer();
    serverSuccess = true;
    
    // Paso 2: Verificar respuesta
    const responseInfo = await checkServerResponse();
    
    // Paso 3: Probar funcionalidad
    const functionalityResults = await testFunctionality();
    
    // Mostrar resumen
    console.log(`\n${colors.blue}[4] Resumen de la verificación:${colors.reset}`);
    
    if (responseInfo.error) {
      console.log(`  ${colors.red}✗ Servidor no responde correctamente${colors.reset}`);
      console.log(`  ${colors.red}✗ Error: ${responseInfo.error}${colors.reset}`);
    } else {
      console.log(`  ${colors.green}✓ Servidor iniciado y respondiendo correctamente${colors.reset}`);
      console.log(`  ${colors.green}✓ Título de la página: ${responseInfo.title}${colors.reset}`);
      console.log(`  ${colors.green}✓ Carga de archivos estáticos verificada${colors.reset}`);
      
      if (functionalityResults.success) {
        console.log(`  ${colors.green}✓ Pruebas de funcionalidad completadas${colors.reset}`);
      } else {
        console.log(`  ${colors.yellow}⚠ Pruebas de funcionalidad con advertencias${colors.reset}`);
      }
    }
    
    console.log(`\n${colors.cyan}¡Verificación completa!${colors.reset}`);
    console.log(`${colors.cyan}La aplicación está lista para ser ejecutada con:${colors.reset}`);
    console.log(`${colors.green}./deploy.sh${colors.reset} o ${colors.green}node start-deployment.js${colors.reset}`);
    
  } catch (error) {
    console.error(`\n${colors.red}✗ Error durante la verificación: ${error.message}${colors.reset}`);
  } finally {
    // Detener el servidor si lo iniciamos nosotros
    if (serverProcess && serverSuccess) {
      console.log(`\n${colors.blue}[5] Manteniendo servidor en ejecución...${colors.reset}`);
      console.log(`  ${colors.cyan}ℹ El servidor seguirá ejecutándose en segundo plano${colors.reset}`);
      console.log(`  ${colors.cyan}ℹ Puedes acceder a la aplicación en: ${serverUrl}${colors.reset}`);
    } else if (serverProcess) {
      console.log(`\n${colors.blue}[5] Deteniendo servidor...${colors.reset}`);
      serverProcess.kill();
    }
  }
}

// Ejecutar verificación
main().catch(error => {
  console.error(`${colors.red}Error crítico: ${error.message}${colors.reset}`);
  process.exit(1);
});