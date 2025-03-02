import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import fileUpload from 'express-fileupload';

const app = express();

// Enable CORS for development
app.use(cors());

// Middleware para configurar encabezados de seguridad (CSP)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Configuración CSP actualizada para permitir más orígenes y recursos
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://storage.googleapis.com https://*.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob: *; " + // Permitir todas las imágenes
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.freepik.com https://api.kling.ai https://api.fal.ai https://*.unsplash.com wss://*.firebaseio.com *; " + // Ampliar connect-src
    "media-src 'self' https: blob: *; " + // Ampliar media-src
    "worker-src 'self' blob:; " +
    "frame-src 'self';"
  );
  
  // Agregar cabeceras CORS para evitar problemas de CORB
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Configurar middleware para procesamiento de archivos
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB máximo
  abortOnLimit: true
}));

// Health check endpoint para monitoreo
app.get('/api/health', (req, res) => {
  const healthData = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    status: 'ok',
    environment: process.env.NODE_ENV || 'development',
    build: {
      version: process.env.npm_package_version || 'unknown',
      nodeVersion: process.version
    }
  };
  res.status(200).json(healthData);
});

// Basic request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  log(`📥 Incoming request: ${req.method} ${req.path}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`📤 Response: ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Setup static file serving based on environment
if (process.env.NODE_ENV === "production") {
  log('🚀 Running in production mode');

  const distPath = path.resolve(process.cwd(), 'dist', 'public');
  const indexPath = path.resolve(distPath, 'index.html');

  // Verify build files exist
  if (!fs.existsSync(distPath)) {
    console.error(`⚠️ Warning: Production build directory not found: ${distPath}`);
    
    // Create directory if it doesn't exist
    try {
      fs.mkdirSync(distPath, { recursive: true });
      console.log(`✅ Created missing directory: ${distPath}`);
    } catch (error) {
      console.error(`❌ Failed to create directory: ${error}`);
      throw new Error(`❌ Failed to create production build directory: ${distPath}`);
    }
  }

  if (!fs.existsSync(indexPath)) {
    console.error(`⚠️ Warning: index.html not found in production build: ${indexPath}`);
    
    // Create a minimal index.html if it doesn't exist
    try {
      const minimalHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <link rel="stylesheet" href="/index.css">
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/index.js"></script>
</body>
</html>`;
      fs.writeFileSync(indexPath, minimalHtml);
      console.log(`✅ Created minimal index.html at: ${indexPath}`);
    } catch (error) {
      console.error(`❌ Failed to create index.html: ${error}`);
      throw new Error(`❌ Failed to create index.html in production build`);
    }
  }

  // Log directory contents for debugging
  try {
    const files = fs.readdirSync(distPath);
    log(`📁 Files in dist/public: ${files.join(', ')}`);
  } catch (error) {
    log(`⚠️ Could not read dist/public directory: ${error}`);
  }

  // Serve static files with improved configuration:

  // 1. First serve index.html for the root path specifically
  app.get('/', (req, res) => {
    log(`📄 Serving index.html for root path`);
    try {
      if (fs.existsSync(indexPath)) {
        // Importante: Establece los headers adecuados para evitar problemas de caché
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Usa res.sendFile con opciones para un path absoluto
        res.sendFile(indexPath, { 
          maxAge: 0,
          root: '/' // Asegura que el path sea interpretado como absoluto
        });
      } else {
        log(`⚠️ Warning: index.html not found at ${indexPath}, sending fallback HTML`);
        // HTML compatible para producción con scripts esenciales
        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <!-- Meta tags para evitar cache -->
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <!-- Carga directa de scripts en caso de que el bundling falle -->
  <script>
    // Script para debug en producción
    console.log("Initializing application in production mode");
    window.onerror = function(message, source, lineno, colno, error) {
      console.error("Application error:", message, "at", source, lineno, colno);
      document.getElementById('root').innerHTML = '<div style="padding:20px;"><h2>Application Error</h2><p>Please reload the page. If the problem persists, contact support.</p><pre>' + message + '</pre></div>';
    };
  </script>
</head>
<body>
  <div id="root">
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;">
      <div style="text-align:center;">
        <h2>Loading Boostify Music...</h2>
        <p>Please wait while we set up the application</p>
      </div>
    </div>
  </div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`);
      }
    } catch (error) {
      log(`❌ Error serving index.html: ${error}`);
      res.status(500).send('Internal Server Error. Please try again later.');
    }
  });

  // 2. Serve assets with caching
  app.use('/assets', (req, res, next) => {
    log(`🎨 Asset request: ${req.path}`);
    next();
  }, express.static(path.resolve(distPath, 'assets'), {
    maxAge: '1d',
    etag: true
  }));

  // 3. Serve other static files
  app.use(express.static(distPath, {
    index: false // Don't serve index.html automatically for other paths
  }));

  // 4. Handle all other routes for SPA
  app.get('*', (req, res, next) => {
    // Skip API routes
    if (req.path.startsWith('/api')) {
      log(`👉 API request, passing to next handler: ${req.path}`);
      return next();
    }

    log(`📄 Serving index.html for SPA route: ${req.path}`);

    // Send the index.html for all other routes to support client-side routing
    try {
      if (fs.existsSync(indexPath)) {
        // Importante: Establece los headers adecuados para evitar problemas de caché
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        
        // Usa res.sendFile con opciones para un path absoluto
        res.sendFile(indexPath, { 
          maxAge: 0,
          root: '/' // Asegura que el path sea interpretado como absoluto
        });
      } else {
        log(`⚠️ Warning: index.html not found at ${indexPath}, sending fallback HTML`);
        // HTML compatible para producción con scripts esenciales
        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <!-- Meta tags para evitar cache -->
  <meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate">
  <meta http-equiv="Pragma" content="no-cache">
  <meta http-equiv="Expires" content="0">
  <!-- Carga directa de scripts en caso de que el bundling falle -->
  <script>
    // Script para debug en producción
    console.log("Initializing application in production mode (SPA route)");
    window.onerror = function(message, source, lineno, colno, error) {
      console.error("Application error:", message, "at", source, lineno, colno);
      document.getElementById('root').innerHTML = '<div style="padding:20px;"><h2>Application Error</h2><p>Please reload the page or return to <a href="/">home</a>.</p><pre>' + message + '</pre></div>';
    };
  </script>
</head>
<body>
  <div id="root">
    <div style="display:flex;justify-content:center;align-items:center;height:100vh;">
      <div style="text-align:center;">
        <h2>Loading Boostify Music...</h2>
        <p>Please wait while we set up the application</p>
      </div>
    </div>
  </div>
  <script type="module" src="/assets/index.js"></script>
</body>
</html>`);
      }
    } catch (error) {
      log(`❌ Error serving index.html: ${error}`);
      next(error);
    }
  });

} else {
  log('🛠 Running in development mode');
  
  // En modo desarrollo, dejamos que el middleware de Vite maneje todas las rutas de frontend
  // Importante: No definimos manejadores específicos para rutas frontend como '/'
  // Los archivos estáticos se sirven automáticamente
  app.use(express.static(path.join(process.cwd(), 'client/public')));
  
  // Agregamos un diagnóstico para depurar el manejo de rutas
  log('🔍 Vite manejará las rutas frontend en modo desarrollo');
}

(async () => {
  try {
    log('🔄 Starting server setup...');
    const server = registerRoutes(app);

    // Global error handler
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      console.error('❌ Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`❌ Error handling request ${req.method} ${req.path}: ${err.message}`);
      res.status(status).json({ 
        message,
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });

    // Check for required environment variables in production
    if (process.env.NODE_ENV === "production") {
      // Critical environment variables
      const criticalEnvVars = [
        { name: 'OPENAI_API_KEY', description: 'OpenAI API access' },
        { name: 'SESSION_SECRET', description: 'Secure session management' },
        { name: 'DATABASE_URL', description: 'Database connection' }
      ];
      
      // Warning for missing critical variables
      criticalEnvVars.forEach(({name, description}) => {
        if (!process.env[name]) {
          log(`⚠️ Warning: ${name} environment variable is not set (${description})`);
        } else {
          log(`✅ ${name} is configured and ready for use`);
        }
      });
      
      // Check if running under PM2 (recommended for production)
      if (process.env.PM2_HOME) {
        log('✅ Running under PM2 process manager');
        
        // Log PM2 configuration if available
        if (process.env.PM2_INSTANCES) {
          log(`📊 PM2 Instances: ${process.env.PM2_INSTANCES}`);
        }
        if (process.env.PM2_EXEC_MODE) {
          log(`📊 PM2 Execution Mode: ${process.env.PM2_EXEC_MODE}`);
        }
      } else {
        log('⚠️ Not running under PM2. For production, it is recommended to use PM2 for process management');
      }
    } else if (process.env.OPENAI_API_KEY) {
      log('✅ OPENAI_API_KEY is configured and ready for use');
    }

    // Setup Vite in development - IMPORTANTE: Esto debe ir DESPUÉS de registrar las rutas de API
    // pero ANTES de cualquier middleware que maneje todas las rutas (como '*')
    if (process.env.NODE_ENV !== "production") {
      log('🛠 Setting up Vite development server');
      
      // Diagnóstico adicional para identificar el orden de inicialización
      log('📌 Configurando Vite para manejar rutas frontend como "/"');
      
      // Configuramos Vite con mayor prioridad para rutas no-API
      await setupVite(app, server);
      
      // Agregamos un middleware de último recurso para debugging
      app.use('*', (req, res, next) => {
        // Solo para rutas que no sean API y que Vite no haya manejado
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/@') && !req.path.startsWith('/src/')) {
          log(`⚠️ Ruta no manejada por Vite: ${req.method} ${req.path}`);
        }
        next();
      });
    }

    // Usar el puerto configurado, puerto de Replit, o 5000 como fallback
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 
                (process.env.REPLIT_PORT ? parseInt(process.env.REPLIT_PORT, 10) : 5000);
    
    // Determinar si estamos en un entorno de Replit
    const isReplitEnv = !!process.env.REPL_SLUG || !!process.env.REPLIT_IDENTITY;
    
    // En producción, asegurarnos de que escuchamos en el puerto correcto
    if (process.env.NODE_ENV === "production") {
      log(`🚀 Iniciando servidor en modo producción en puerto ${PORT}`);
    }
    
    // Iniciar el servidor en un puerto específico - siempre en 0.0.0.0 para asegurar accesibilidad externa
    // El valor 0.0.0.0 hace que el servidor escuche en todas las interfaces de red (incluida localhost)
    server.listen(PORT, '0.0.0.0', () => {
      log(`✅ Server started on port ${PORT}`);
      log(`🌍 Environment: ${app.get("env")}`);
      log(`📂 Static files served from: ${process.env.NODE_ENV === "production" ? 
        path.resolve(process.cwd(), 'dist', 'public') : 
        path.join(process.cwd(), 'client/public')}`);
      
      // URL de acceso adaptada al entorno
      const accessURL = isReplitEnv ? 
        `https://${process.env.REPL_SLUG || 'your-replit'}.replit.app` : 
        process.env.NODE_ENV === "production" ? 
          `${process.env.APP_URL || 'https://your-app-domain.com'}` : 
          `http://localhost:${PORT}`;
      
      log(`🔗 Access URL: ${accessURL}`);
    });
    
    // Manejar errores del servidor
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`❌ Error: Port ${PORT} is already in use. Please kill any processes using this port and try again.`);
        log('💡 Tip: You can find and kill the process using this port with:');
        log(`   lsof -i :${PORT} | grep LISTEN     # Find process ID (PID)`);
        log('   kill -9 <PID>                  # Kill the process');
      } else {
        log(`❌ Server error: ${error.message}`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();