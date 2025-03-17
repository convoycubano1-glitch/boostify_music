import 'dotenv/config';
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import fileUpload from 'express-fileupload';

const app = express();

// Enable CORS for development
app.use(cors());

// Middleware to configure security headers (CSP)
app.use((req: Request, res: Response, next: NextFunction) => {
  // Updated CSP configuration to allow more origins and resources
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://storage.googleapis.com https://*.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob: *; " + // Allow all images
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.freepik.com https://api.piapi.ai https://api.fal.ai https://*.unsplash.com wss://*.firebaseio.com *; " + // Extend connect-src
    "media-src 'self' https: blob: *; " + // Extend media-src
    "worker-src 'self' blob:; " +
    "frame-src 'self';"
  );

  // Add CORS headers to avoid CORB issues
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

  next();
});

// Increase JSON size limit to handle image data URLs, pero con límite razonable para evitar problemas de memoria
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));

// Gestión de errores para express.json
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.type === 'entity.too.large') {
    console.error('Error al procesar JSON: payload demasiado grande');
    return res.status(413).json({
      success: false,
      error: 'La imagen es demasiado grande. El tamaño máximo permitido es 20MB.'
    });
  }
  next(err);
});

// Configure middleware for file processing
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 8 * 1024 * 1024 }, // Reducido a 8MB para mejor estabilidad
  abortOnLimit: true,
  debug: false // Desactivar debug para reducir logs
}));

// Manejo de errores para fileUpload
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    console.error('Error al cargar archivo: tamaño excedido');
    return res.status(413).json({
      success: false,
      error: 'El archivo es demasiado grande. El tamaño máximo permitido es 8MB.'
    });
  }
  next(err);
});

// Health check endpoint for monitoring
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

  // In development mode, we let the Vite middleware handle all frontend routes
  // Important: We don't define specific handlers for frontend routes like '/'
  // Static files are served automatically
  app.use(express.static(path.join(process.cwd(), 'client/public')));

  // Add diagnostics to debug route handling
  log('🔍 Vite will handle frontend routes in development mode');
}

(async () => {
  try {
    log('🔄 Starting server setup...');

    // Import and run environment check
    const { checkEnvironment } = await import('./utils/environment-check');
    checkEnvironment();

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

    // Setup Vite in development - IMPORTANT: This must go AFTER registering the API routes
    // but BEFORE any middleware that handles all routes (like '*')
    if (process.env.NODE_ENV !== "production") {
      log('🛠 Setting up Vite development server');

      // Additional diagnostics to identify initialization order
      log('📌 Configuring Vite to handle frontend routes like "/"');

      // Configure Vite with higher priority for non-API routes
      await setupVite(app, server);

      // Add a last-resort middleware for debugging
      app.use('*', (req, res, next) => {
        // Only for non-API routes that Vite hasn't handled
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/@') && !req.path.startsWith('/src/')) {
          log(`⚠️ Route not handled by Vite: ${req.method} ${req.path}`);
        }
        next();
      });
    }

    // Use the configured port, Replit port, or 5000 as fallback
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 
                (process.env.REPLIT_PORT ? parseInt(process.env.REPLIT_PORT, 10) : 5000);

    // Determine if we're in a Replit environment
    const isReplitEnv = !!process.env.REPL_SLUG || !!process.env.REPLIT_IDENTITY;

    // In production, ensure we're listening on the correct port
    if (process.env.NODE_ENV === "production") {
      log(`🚀 Starting server in production mode on port ${PORT}`);
    }

    // Start the server on a specific port - always on 0.0.0.0 to ensure external accessibility
    // The value 0.0.0.0 makes the server listen on all network interfaces (including localhost)
    server.listen(PORT, '0.0.0.0', () => {
      log(`✅ Server started on port ${PORT}`);
      log(`🌍 Environment: ${app.get("env")}`);
      log(`📂 Static files served from: ${process.env.NODE_ENV === "production" ? 
        path.resolve(process.cwd(), 'dist', 'public') : 
        path.join(process.cwd(), 'client/public')}`);

      // Access URL adapted to the environment
      const accessURL = isReplitEnv ? 
        `https://${process.env.REPL_SLUG || 'your-replit'}.replit.app` : 
        process.env.NODE_ENV === "production" ? 
          `${process.env.APP_URL || 'https://your-app-domain.com'}` : 
          `http://localhost:${PORT}`;

      log(`🔗 Access URL: ${accessURL}`);
    });

    // Handle server errors
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