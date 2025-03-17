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

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawn } from 'child_process';
import dotenv from 'dotenv';

// Obtener __dirname en módulos ES
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cargar variables de entorno
dotenv.config();

// Definir colores para la consola
const RESET = '\x1b[0m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[36m';

console.log(`${BLUE}=======================================${RESET}`);
console.log(`${BLUE}    COMPILACIÓN SEGURA PARA PRODUCCIÓN    ${RESET}`);
console.log(`${BLUE}=======================================${RESET}`);

/**
 * Ejecuta un comando y muestra su salida
 * @param {string} command Comando a ejecutar
 * @param {string} errorMessage Mensaje de error si falla
 */
function ejecutarComando(command, errorMessage) {
  console.log(`${YELLOW}Ejecutando: ${command}${RESET}`);
  try {
    const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log(result);
    return result;
  } catch (error) {
    console.error(`${RED}${errorMessage || 'Error al ejecutar el comando'}${RESET}`);
    console.error(error.stdout || error.message);
    if (errorMessage) {
      // Solo salir si hay un mensaje de error específico (indica que es crítico)
      process.exit(1);
    }
    return '';
  }
}

/**
 * Crea un proxy seguro para las APIs en el servidor
 */
function crearProxyApisSeguro() {
  console.log(`\n${BLUE}1. Creando proxy seguro para APIs sensibles...${RESET}`);
  
  // Ruta para el proxy de APIs
  const proxyFilePath = path.join(__dirname, 'server', 'routes', 'api-proxy-secure.ts');
  
  // Contenido del proxy
  const proxyContent = `/**
 * API Proxy seguro para producción
 * Este archivo implementa un proxy para APIs externas que requieren claves de API
 * para evitar exponer credenciales en el frontend
 */

import { Router } from 'express';
import axios from 'axios';
import type { Request, Response } from 'express';

const router = Router();

// Configuración de APIs
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const FAL_API_KEY = process.env.FAL_API_KEY;

// Middleware para verificar API keys disponibles
function verificarAPIKeys(req: Request, res: Response, next: Function) {
  const apis = {
    'openai': OPENAI_API_KEY,
    'fal': FAL_API_KEY
  };
  
  const apiName = req.params.api;
  
  if (!apis[apiName]) {
    return res.status(400).json({
      success: false,
      error: 'API no soportada'
    });
  }
  
  if (!apis[apiName]) {
    return res.status(500).json({
      success: false,
      error: 'Configuración de API no disponible'
    });
  }
  
  next();
}

// Proxy para OpenAI
router.post('/openai/:endpoint', verificarAPIKeys, async (req: Request, res: Response) => {
  try {
    const endpoint = req.params.endpoint;
    const { data } = await axios.post(
      \`https://api.openai.com/v1/\${endpoint}\`,
      req.body,
      {
        headers: {
          'Authorization': \`Bearer \${OPENAI_API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error en proxy OpenAI:', error.message);
    
    return res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

// Proxy para Fal.ai
router.post('/fal/:endpoint', verificarAPIKeys, async (req: Request, res: Response) => {
  try {
    const endpoint = req.params.endpoint;
    const { data } = await axios.post(
      \`https://api.fal.ai/\${endpoint}\`,
      req.body,
      {
        headers: {
          'Authorization': \`Bearer \${FAL_API_KEY}\`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return res.json({
      success: true,
      data
    });
  } catch (error) {
    console.error('Error en proxy Fal.ai:', error.message);
    
    return res.status(error.response?.status || 500).json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

export default router;
`;

  fs.writeFileSync(proxyFilePath, proxyContent);
  console.log(`${GREEN}✓ Proxy API seguro creado en ${proxyFilePath}${RESET}`);
  
  // Registrar el router en el archivo de rutas principal
  try {
    const routesFilePath = path.join(__dirname, 'server', 'routes.ts');
    
    if (fs.existsSync(routesFilePath)) {
      let routesContent = fs.readFileSync(routesFilePath, 'utf8');
      
      // Verificar si ya está importado
      if (!routesContent.includes('import apiProxySecure from')) {
        // Agregar la importación
        routesContent = routesContent.replace(
          /import\s+{[^}]+}\s+from\s+['"]express['"]/,
          `import { Express, Server } from 'express';\nimport apiProxySecure from './routes/api-proxy-secure';`
        );
        
        // Agregar el uso del router
        routesContent = routesContent.replace(
          /export\s+function\s+registerRoutes[^{]*{/,
          `export function registerRoutes(app: Express): Server {
  // API Proxy seguro para producción
  app.use('/api/proxy', apiProxySecure);
  `
        );
        
        fs.writeFileSync(routesFilePath, routesContent);
        console.log(`${GREEN}✓ Proxy API registrado en routes.ts${RESET}`);
      } else {
        console.log(`${YELLOW}⚠ El proxy API ya está registrado en routes.ts${RESET}`);
      }
    }
  } catch (error) {
    console.error(`${RED}Error al registrar el proxy API: ${error.message}${RESET}`);
  }
}

/**
 * Actualiza el archivo vite.config.ts para optimizaciones de producción
 */
function actualizarViteConfig() {
  console.log(`\n${BLUE}2. Actualizando configuración de Vite para producción...${RESET}`);
  
  const viteConfigPath = path.join(__dirname, 'vite.config.ts');
  
  if (!fs.existsSync(viteConfigPath)) {
    console.log(`${YELLOW}⚠ No se encontró vite.config.ts, se creará uno nuevo${RESET}`);
    
    // Crear un nuevo archivo de configuración
    const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-avatar',
            '@radix-ui/react-select',
          ],
          'utils-vendor': ['axios', 'zustand', '@tanstack/react-query'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
  define: {
    'process.env': {},
  },
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
    host: '0.0.0.0',
  },
});
`;

    fs.writeFileSync(viteConfigPath, viteConfig);
    console.log(`${GREEN}✓ Archivo vite.config.ts creado con optimizaciones${RESET}`);
    return;
  }
  
  // Actualizar el archivo existente
  let viteConfig = fs.readFileSync(viteConfigPath, 'utf8');
  
  // Agregar configuración de minificación si no existe
  if (!viteConfig.includes('minify:')) {
    viteConfig = viteConfig.replace(
      /build\s*:\s*{/,
      `build: {
    minify: 'terser',`
    );
  }
  
  // Agregar manualChunks si no existe
  if (!viteConfig.includes('manualChunks')) {
    viteConfig = viteConfig.replace(
      /build\s*:\s*{/,
      `build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-avatar',
            '@radix-ui/react-select',
          ],
          'utils-vendor': ['axios', 'zustand', '@tanstack/react-query'],
        },
      },
    },`
    );
  }
  
  // Agregar terserOptions si no existe
  if (!viteConfig.includes('terserOptions')) {
    viteConfig = viteConfig.replace(
      /build\s*:\s*{/,
      `build: {
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },`
    );
  }
  
  fs.writeFileSync(viteConfigPath, viteConfig);
  console.log(`${GREEN}✓ Archivo vite.config.ts actualizado con optimizaciones${RESET}`);
}

/**
 * Crea un archivo .env.production con variables de entorno seguras
 */
function crearEnvProduccion() {
  console.log(`\n${BLUE}3. Creando archivo .env.production seguro...${RESET}`);
  
  // Obtener todas las variables de entorno actuales
  const currentEnv = process.env;
  
  // Separar variables frontEnd (con prefijo VITE_) de las de backend
  const frontendVars = [];
  const backendVars = [];
  
  Object.keys(currentEnv).forEach(key => {
    // Variables de Firebase que son públicas y pueden estar en el frontend
    const firebasePublicKeys = [
      'FIREBASE_API_KEY',
      'FIREBASE_AUTH_DOMAIN',
      'FIREBASE_PROJECT_ID',
      'FIREBASE_STORAGE_BUCKET',
      'FIREBASE_MESSAGING_SENDER_ID',
      'FIREBASE_APP_ID'
    ];
    
    const isPublicFirebaseKey = firebasePublicKeys.includes(key);
    
    if (key.startsWith('VITE_') || isPublicFirebaseKey) {
      // Para las variables públicas de Firebase, crearlas con prefijo VITE_
      const formattedKey = isPublicFirebaseKey && !key.startsWith('VITE_') 
        ? `VITE_${key}`
        : key;
      
      frontendVars.push(`${formattedKey}=${currentEnv[key]}`);
    } else if (!key.startsWith('npm_') && !key.startsWith('_') && !key.startsWith('SHELL') && !key.startsWith('USER')) {
      // Filtrar variables de entorno de sistema y npm
      backendVars.push(`${key}=${currentEnv[key]}`);
    }
  });
  
  // Agregar variables adicionales para producción
  backendVars.push('NODE_ENV=production');
  frontendVars.push('VITE_APP_ENV=production');
  frontendVars.push('VITE_API_URL=/api/proxy');
  
  // Crear archivo .env.production
  const envProductionPath = path.join(__dirname, '.env.production');
  const envContent = [...backendVars, '', '# Variables Frontend (públicas)', ...frontendVars].join('\n');
  
  fs.writeFileSync(envProductionPath, envContent);
  console.log(`${GREEN}✓ Archivo .env.production creado con variables seguras${RESET}`);
}

/**
 * Actualiza el index.html para optimizaciones de producción
 */
function actualizarIndexHtml() {
  console.log(`\n${BLUE}4. Actualizando index.html para producción...${RESET}`);
  
  const indexPath = path.join(__dirname, 'index.html');
  
  if (!fs.existsSync(indexPath)) {
    console.log(`${RED}✗ No se encontró index.html${RESET}`);
    return;
  }
  
  let indexContent = fs.readFileSync(indexPath, 'utf8');
  
  // Agregar headers de caché para recursos estáticos
  if (!indexContent.includes('<meta http-equiv="Cache-Control"')) {
    indexContent = indexContent.replace(
      /<head>/,
      `<head>
    <meta http-equiv="Cache-Control" content="max-age=86400, public">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; connect-src 'self' https://api.openai.com https://api.fal.ai; img-src 'self' data: blob: https://*; style-src 'self' 'unsafe-inline'; font-src 'self' data:; frame-src 'self';">`
    );
  }
  
  // Agregar preloads para CSS crítico
  if (!indexContent.includes('<link rel="preload"')) {
    indexContent = indexContent.replace(
      /<\/head>/,
      `  <link rel="preload" href="/assets/index.css" as="style">
  <link rel="preload" href="/assets/fonts.css" as="style">
</head>`
    );
  }
  
  fs.writeFileSync(indexPath, indexContent);
  console.log(`${GREEN}✓ Archivo index.html actualizado con optimizaciones de seguridad y rendimiento${RESET}`);
}

/**
 * Ejecuta el proceso de construcción para producción
 */
function ejecutarBuild() {
  console.log(`\n${BLUE}5. Ejecutando proceso de compilación...${RESET}`);
  
  try {
    // Limpiar directorio dist
    if (fs.existsSync('./dist')) {
      ejecutarComando('rm -rf ./dist', 'Error al limpiar directorio dist');
      console.log(`${GREEN}✓ Directorio dist limpiado${RESET}`);
    }
    
    // Compilar la aplicación para producción
    console.log(`${YELLOW}Iniciando compilación. Esto puede tomar un tiempo...${RESET}`);
    ejecutarComando('npx tsc && npx vite build', 'Error en la compilación');
    
    console.log(`${GREEN}✓ Compilación exitosa${RESET}`);
    return true;
  } catch (error) {
    console.error(`${RED}✗ Error en el proceso de compilación: ${error.message}${RESET}`);
    return false;
  }
}

/**
 * Actualiza el archivo server.js en dist para implementar seguridad adicional
 */
function actualizarServerProduccion() {
  console.log(`\n${BLUE}6. Actualizando servidor para producción...${RESET}`);
  
  const serverPath = path.join(__dirname, 'dist', 'server.js');
  
  if (!fs.existsSync(serverPath)) {
    console.log(`${RED}✗ No se encontró server.js en dist${RESET}`);
    return;
  }
  
  // Leer el archivo server.js
  let serverContent = fs.readFileSync(serverPath, 'utf8');
  
  // Agregar headers de seguridad
  if (!serverContent.includes('res.setHeader')) {
    serverContent = serverContent.replace(
      /app\.use\(\s*express\.static\s*\(\s*path\.join\s*\(\s*__dirname\s*,\s*['"]public['"]\s*\)\s*\)\s*\)/,
      `// Headers de seguridad
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, 'public')))`
    );
  }
  
  // Agregar manejo de errores mejorado
  if (!serverContent.includes('app.use((err, req, res, next)')) {
    serverContent = serverContent.replace(
      /app\.listen\s*\(/,
      `// Manejo de errores global
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    error: 'Error interno del servidor',
    details: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(`
    );
  }
  
  // Crear validador de request para prevenir inyecciones
  if (!serverContent.includes('validateRequest')) {
    serverContent = serverContent.replace(
      /import\s+{[^}]+}\s+from\s+['"]express['"]/,
      `import { Express, Request, Response, NextFunction } from 'express';

// Middleware para validar y sanitizar requests
function validateRequest(req, res, next) {
  // Implementar validación básica anti-inyección
  const sanitize = (obj) => {
    if (!obj) return obj;
    
    Object.keys(obj).forEach(key => {
      if (typeof obj[key] === 'string') {
        // Detectar patrones típicos de inyección
        const suspiciousPatterns = [
          /\\\\s*((select|update|delete|insert|drop|alter|exec|union)\\\\s)/i,
          /<\\\\s*script\\\\b[^>]*>/i,
          /on\\\\w+\\\\s*=\\\\s*["']?\\\\w/i,
          /javascript\\\\s*:/i
        ];
        
        const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(obj[key]));
        
        if (isSuspicious) {
          console.warn(\`Suspicious input detected: \${key}=\${obj[key].substring(0, 30)}...\`);
          delete obj[key];
        }
      } else if (typeof obj[key] === 'object') {
        sanitize(obj[key]);
      }
    });
  };
  
  sanitize(req.body);
  sanitize(req.query);
  sanitize(req.params);
  
  next();
}`
    );
    
    // Agregar uso del middleware
    serverContent = serverContent.replace(
      /app\.use\s*\(\s*express\.json\s*\(\s*\)\s*\)/,
      `app.use(express.json());
app.use(validateRequest);`
    );
  }
  
  // Guardar el archivo actualizado
  fs.writeFileSync(serverPath, serverContent);
  console.log(`${GREEN}✓ Servidor actualizado con medidas de seguridad adicionales${RESET}`);
}

/**
 * Función principal para ejecutar el proceso completo
 */
async function main() {
  try {
    // 1. Crear proxy de APIs seguro
    crearProxyApisSeguro();
    
    // 2. Actualizar configuración de Vite
    actualizarViteConfig();
    
    // 3. Crear .env.production
    crearEnvProduccion();
    
    // 4. Actualizar index.html
    actualizarIndexHtml();
    
    // 5. Ejecutar build
    const buildSuccess = ejecutarBuild();
    
    if (buildSuccess) {
      // 6. Actualizar server.js en producción
      actualizarServerProduccion();
      
      console.log(`\n${BLUE}=======================================${RESET}`);
      console.log(`${GREEN}✅ Compilación segura completada exitosamente${RESET}`);
      console.log(`${BLUE}=======================================${RESET}`);
      console.log(`\nPara iniciar la aplicación en producción, ejecuta:`);
      console.log(`${YELLOW}cd dist && node server.js${RESET}`);
    }
  } catch (error) {
    console.error(`${RED}Error en el proceso: ${error.message}${RESET}`);
    process.exit(1);
  }
}

// Ejecutar el proceso
main();