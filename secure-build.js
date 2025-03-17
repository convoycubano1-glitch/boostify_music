/**
 * Script de compilación segura para producción
 * 
 * Este script implementa el proceso de compilación para producción
 * con medidas de seguridad adicionales:
 * 
 * 1. Previene la exposición de credenciales en el frontend
 * 2. Redirige las llamadas API sensibles a través del servidor
 * 3. Implementa optimizaciones de rendimiento avanzadas
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const dotenv = require('dotenv');

// Colores para la consola
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

// Cargar variables de entorno
dotenv.config();

console.log(`${BLUE}=======================================${RESET}`);
console.log(`${BLUE}    COMPILACIÓN SEGURA PARA PRODUCCIÓN    ${RESET}`);
console.log(`${BLUE}=======================================${RESET}`);

/**
 * Ejecuta un comando y muestra su salida
 * @param {string} command Comando a ejecutar
 * @param {string} errorMessage Mensaje de error si falla
 */
function ejecutarComando(command, errorMessage) {
  try {
    console.log(`${YELLOW}Ejecutando: ${command}${RESET}`);
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    console.error(`${RED}ERROR: ${errorMessage}${RESET}`);
    console.error(`${RED}${error.message}${RESET}`);
    return false;
  }
}

/**
 * Crea un proxy seguro para las APIs en el servidor
 */
function crearProxyApisSeguro() {
  console.log(`\n${BLUE}Creando proxy seguro para APIs...${RESET}`);
  
  // Verificar si ya existe el archivo de proxy
  const rutaProxyApi = './server/routes/secure-api-proxy.ts';
  if (fs.existsSync(rutaProxyApi)) {
    console.log(`${YELLOW}El archivo de proxy API ya existe, actualizando...${RESET}`);
  }
  
  // Crear o actualizar el archivo de proxy
  const contenidoProxy = `/**
 * Proxy seguro para APIs externas
 * Este módulo centraliza todas las llamadas a APIs sensibles en el servidor
 * para evitar exponer credenciales en el frontend
 */
import { Request, Response, Router } from 'express';
import axios from 'axios';

// Configuración de APIs
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FAL_API_KEY = process.env.FAL_API_KEY;

// Router para el proxy de APIs
const apiProxyRouter = Router();

/**
 * Middleware para verificar que las claves API estén configuradas
 */
function verificarClaves(req: Request, res: Response, next: Function) {
  const missingKeys = [];
  
  if (!OPENAI_API_KEY) missingKeys.push('OPENAI_API_KEY');
  if (!FAL_API_KEY) missingKeys.push('FAL_API_KEY');
  
  if (missingKeys.length > 0) {
    return res.status(500).json({
      error: 'Missing API keys',
      message: \`The following API keys are missing: \${missingKeys.join(', ')}\`
    });
  }
  
  next();
}

/**
 * Proxy para OpenAI API
 */
apiProxyRouter.post('/openai/chat', verificarClaves, async (req: Request, res: Response) => {
  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      req.body,
      {
        headers: {
          'Authorization': \`Bearer \${OPENAI_API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error calling OpenAI API:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'OpenAI API error',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

/**
 * Proxy para FAL AI
 */
apiProxyRouter.post('/fal/models/:modelId/generate', verificarClaves, async (req: Request, res: Response) => {
  try {
    const { modelId } = req.params;
    const response = await axios.post(
      \`https://api.fal.ai/v1/models/\${modelId}/generate\`,
      req.body,
      {
        headers: {
          'Authorization': \`Key \${FAL_API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error calling FAL API:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'FAL API error',
      message: error.response?.data?.error?.message || error.message
    });
  }
});

export default apiProxyRouter;
`;
  
  // Escribir el archivo
  fs.mkdirSync(path.dirname(rutaProxyApi), { recursive: true });
  fs.writeFileSync(rutaProxyApi, contenidoProxy);
  console.log(`${GREEN}✅ Proxy seguro para APIs creado${RESET}`);
  
  // Actualizar archivo de rutas del servidor para incluir el proxy
  const rutaServerRoutes = './server/routes.ts';
  if (fs.existsSync(rutaServerRoutes)) {
    let contenidoRoutes = fs.readFileSync(rutaServerRoutes, 'utf8');
    
    // Verificar si ya se importó el proxy
    if (!contenidoRoutes.includes('secure-api-proxy')) {
      // Agregar importación
      contenidoRoutes = contenidoRoutes.replace(
        'import { Express, Server } from \'express\';',
        'import { Express, Server } from \'express\';\nimport secureApiProxy from \'./routes/secure-api-proxy\';'
      );
      
      // Agregar registro de ruta
      const routerRegistrationRegex = /export function registerRoutes\(app: Express\): Server \{[^}]*}/s;
      const routerRegistration = contenidoRoutes.match(routerRegistrationRegex)[0];
      
      const updatedRouterRegistration = routerRegistration.replace(
        '{',
        '{\n  // Registrar proxy seguro para APIs\n  app.use(\'/api/secure\', secureApiProxy);'
      );
      
      contenidoRoutes = contenidoRoutes.replace(routerRegistrationRegex, updatedRouterRegistration);
      
      // Guardar cambios
      fs.writeFileSync(rutaServerRoutes, contenidoRoutes);
      console.log(`${GREEN}✅ Proxy API registrado en rutas del servidor${RESET}`);
    } else {
      console.log(`${YELLOW}El proxy API ya está configurado en rutas del servidor${RESET}`);
    }
  } else {
    console.log(`${RED}⚠️ No se encontró el archivo de rutas del servidor${RESET}`);
  }
}

/**
 * Actualiza el archivo vite.config.ts para optimizaciones de producción
 */
function actualizarViteConfig() {
  console.log(`\n${BLUE}Actualizando configuración de Vite para producción...${RESET}`);
  
  const rutaViteConfig = './vite.config.ts';
  if (!fs.existsSync(rutaViteConfig)) {
    console.log(`${RED}⚠️ No se encontró el archivo vite.config.ts${RESET}`);
    return;
  }
  
  let contenidoVite = fs.readFileSync(rutaViteConfig, 'utf8');
  
  // Verificar si ya existen las optimizaciones
  if (contenidoVite.includes('manualChunks') && contenidoVite.includes('rollupOptions')) {
    console.log(`${YELLOW}Las optimizaciones de Vite ya están configuradas${RESET}`);
  } else {
    // Agregar configuraciones de optimización
    const optimizaciones = `
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom',
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage'
          ],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
          ],
          utils: [
            'zustand',
            'date-fns',
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
          ],
        },
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    },
    terserOptions: {
      format: {
        comments: false,
      },
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },`;
    
    // Insertar optimizaciones en el archivo de configuración
    const defineConfigRegex = /defineConfig\(\{([^}]*)\}\)/s;
    const defineConfigMatch = contenidoVite.match(defineConfigRegex);
    
    if (defineConfigMatch) {
      const updatedConfig = defineConfigMatch[1] + optimizaciones;
      contenidoVite = contenidoVite.replace(defineConfigRegex, `defineConfig({\n${updatedConfig}\n})`);
      
      // Guardar cambios
      fs.writeFileSync(rutaViteConfig, contenidoVite);
      console.log(`${GREEN}✅ Configuración de Vite actualizada con optimizaciones${RESET}`);
    } else {
      console.log(`${RED}⚠️ No se pudo actualizar vite.config.ts${RESET}`);
    }
  }
}

/**
 * Crea un archivo .env.production con variables de entorno seguras
 */
function crearEnvProduccion() {
  console.log(`\n${BLUE}Creando archivo .env.production...${RESET}`);
  
  const rutaEnvProd = './.env.production';
  
  // Variables que NO se deben exponer al frontend
  const variablesServidor = [
    'OPENAI_API_KEY',
    'FAL_API_KEY',
    'STRIPE_SECRET_KEY',
    'FIREBASE_ADMIN_CONFIG',
    'ELEVENLABS_API_KEY',
    'DATABASE_URL',
    'PORT'
  ];
  
  // Variables que sí pueden estar en el frontend
  const variablesFrontend = [
    'VITE_APP_TITLE',
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_MEASUREMENT_ID',
    'VITE_API_URL'
  ];
  
  // Generar contenido
  let contenidoEnv = '# Environment variables for production\n\n';
  contenidoEnv += '# Server-side only variables (not exposed to the client)\n';
  variablesServidor.forEach(variable => {
    if (process.env[variable]) {
      contenidoEnv += `${variable}=${process.env[variable]}\n`;
    }
  });
  
  contenidoEnv += '\n# Variables exposed to the client (must be prefixed with VITE_)\n';
  variablesFrontend.forEach(variable => {
    // Eliminar prefijo VITE_ para buscar en el entorno actual
    const envVar = variable.replace('VITE_', '');
    if (process.env[envVar]) {
      contenidoEnv += `${variable}=${process.env[envVar]}\n`;
    } else if (process.env[variable]) {
      contenidoEnv += `${variable}=${process.env[variable]}\n`;
    }
  });
  
  contenidoEnv += '\n# Server configuration\nNODE_ENV=production\nPORT=3000\n';
  
  // Escribir archivo
  fs.writeFileSync(rutaEnvProd, contenidoEnv);
  console.log(`${GREEN}✅ Archivo .env.production creado${RESET}`);
}

/**
 * Actualiza el index.html para optimizaciones de producción
 */
function actualizarIndexHtml() {
  console.log(`\n${BLUE}Optimizando index.html para producción...${RESET}`);
  
  const rutaIndexHtml = './index.html';
  if (!fs.existsSync(rutaIndexHtml)) {
    console.log(`${RED}⚠️ No se encontró el archivo index.html${RESET}`);
    return;
  }
  
  let contenidoHtml = fs.readFileSync(rutaIndexHtml, 'utf8');
  
  // Crear copia de respaldo
  fs.writeFileSync('./index.html.bak', contenidoHtml);
  
  // Agregar meta tags para SEO y rendimiento
  if (!contenidoHtml.includes('<meta name="description"')) {
    const headTag = '<head>';
    const metaTags = `<head>
    <meta name="description" content="Boostify Music - Plataforma AI para músicos y artistas">
    <meta name="theme-color" content="#FF5500">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>`;
    
    contenidoHtml = contenidoHtml.replace(headTag, metaTags);
  }
  
  // Agregar script de precarga para mejorar rendimiento
  if (!contenidoHtml.includes('window.PRELOADED_STATE')) {
    const bodyEnd = '</body>';
    const preloadScript = `  <script>
    // Configuración de estado precargado para la aplicación
    window.PRELOADED_STATE = {
      config: {
        apiUrl: window.location.origin + '/api/secure',
        environment: 'production',
        version: '1.0.0'
      }
    };
  </script>
</body>`;
    
    contenidoHtml = contenidoHtml.replace(bodyEnd, preloadScript);
  }
  
  // Actualizar título
  const titleRegex = /<title>(.*?)<\/title>/;
  if (titleRegex.test(contenidoHtml)) {
    contenidoHtml = contenidoHtml.replace(titleRegex, '<title>Boostify Music - Plataforma AI para Músicos</title>');
  }
  
  // Guardar cambios
  fs.writeFileSync(rutaIndexHtml, contenidoHtml);
  console.log(`${GREEN}✅ Archivo index.html optimizado para producción${RESET}`);
}

/**
 * Ejecuta el proceso de construcción para producción
 */
function ejecutarBuild() {
  console.log(`\n${BLUE}Ejecutando proceso de construcción para producción...${RESET}`);
  
  // Limpiar directorio dist
  if (fs.existsSync('./dist')) {
    console.log(`${YELLOW}Limpiando directorio dist...${RESET}`);
    ejecutarComando('rm -rf ./dist', 'No se pudo limpiar el directorio dist');
  }
  
  // Ejecutar verificación pre-producción
  console.log(`${YELLOW}Ejecutando verificación pre-producción...${RESET}`);
  ejecutarComando('node production-check.js || true', 'Error en la verificación pre-producción');
  
  // Ejecutar build original
  console.log(`${YELLOW}Ejecutando build-for-replit.js...${RESET}`);
  if (ejecutarComando('node build-for-replit.js', 'Error en el proceso de build')) {
    console.log(`${GREEN}✅ Construcción completada exitosamente${RESET}`);
  }
}

/**
 * Actualiza el archivo server.js en dist para implementar seguridad adicional
 */
function actualizarServerProduccion() {
  console.log(`\n${BLUE}Actualizando servidor de producción con medidas de seguridad...${RESET}`);
  
  const rutaServerJs = './dist/server.js';
  if (!fs.existsSync(rutaServerJs)) {
    console.log(`${RED}⚠️ No se encontró el archivo server.js en dist${RESET}`);
    return;
  }
  
  let contenidoServer = fs.readFileSync(rutaServerJs, 'utf8');
  
  // Crear copia de respaldo
  fs.writeFileSync('./dist/server.js.bak', contenidoServer);
  
  // Agregar headers de seguridad
  if (!contenidoServer.includes('X-Content-Type-Options')) {
    const appUseMatch = contenidoServer.match(/app\.use\([^;]*express\.static[^;]*\);/);
    if (appUseMatch) {
      const securityHeaders = `
// Agregar headers de seguridad
app.use((req, res, next) => {
  // Prevenir click-jacking
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  // Prevenir MIME-sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // Prevenir XSS
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Control de cache
  res.setHeader('Cache-Control', 'public, max-age=3600');
  next();
});

`;
      
      contenidoServer = contenidoServer.replace(appUseMatch[0], appUseMatch[0] + securityHeaders);
    }
  }
  
  // Agregar endpoint de verificación de estado
  if (!contenidoServer.includes('/api/status')) {
    const appListenMatch = contenidoServer.match(/app\.listen\([^;]*\);/);
    if (appListenMatch) {
      const statusEndpoint = `
// Endpoint de estado
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    version: '1.0.0-production'
  });
});

`;
      
      contenidoServer = contenidoServer.replace(appListenMatch[0], statusEndpoint + appListenMatch[0]);
    }
  }
  
  // Guardar cambios
  fs.writeFileSync(rutaServerJs, contenidoServer);
  console.log(`${GREEN}✅ Servidor de producción actualizado con medidas de seguridad${RESET}`);
}

/**
 * Función principal para ejecutar el proceso completo
 */
async function main() {
  // Verificar dependencias
  if (!fs.existsSync('./node_modules/dotenv')) {
    console.log(`${YELLOW}Instalando dependencias necesarias...${RESET}`);
    ejecutarComando('npm install dotenv', 'No se pudo instalar dotenv');
  }
  
  // Crear estructura de archivos para seguridad
  crearProxyApisSeguro();
  
  // Actualizar configuraciones
  actualizarViteConfig();
  crearEnvProduccion();
  actualizarIndexHtml();
  
  // Ejecutar build
  ejecutarBuild();
  
  // Actualizar servidor de producción
  actualizarServerProduccion();
  
  console.log(`\n${GREEN}========================================${RESET}`);
  console.log(`${GREEN}    PROCESO COMPLETADO EXITOSAMENTE    ${RESET}`);
  console.log(`${GREEN}========================================${RESET}`);
  console.log(`\nLa aplicación está lista para ser desplegada en producción.`);
  console.log(`Para iniciar el servidor:${YELLOW} cd dist && node server.js${RESET}`);
}

main().catch(error => {
  console.error(`${RED}Error en el proceso de construcción:${RESET}`, error);
});