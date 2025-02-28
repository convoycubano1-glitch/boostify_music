import 'dotenv/config';
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import cors from 'cors';
import fs from 'fs';

const app = express();

// Enable CORS for development
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
  app.use(express.static(path.join(process.cwd(), 'client/public')));
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

    // Check for required environment variables
    if (process.env.NODE_ENV === "production" && !process.env.OPENAI_API_KEY) {
      log('⚠️ Warning: OPENAI_API_KEY environment variable is not set');
    } else if (process.env.OPENAI_API_KEY) {
      log('✅ OPENAI_API_KEY is configured and ready for use');
    }

    // Setup Vite in development
    if (process.env.NODE_ENV !== "production") {
      log('🛠 Setting up Vite development server');
      await setupVite(app, server);
    }

    // Use environment PORT or fallback to 5000
    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

    server.listen(PORT, () => {
      // Puerto fijo para compatibilidad con Replit
      const actualPort = PORT;
      
      log(`✅ Server started on port ${actualPort}`);
      log(`🌍 Environment: ${app.get("env")}`);
      log(`📂 Static files served from: ${process.env.NODE_ENV === "production" ? 
        path.resolve(process.cwd(), 'dist', 'public') : 
        path.join(process.cwd(), 'client/public')}`);
      log(`🔗 Access URL: ${process.env.REPL_SLUG ? 
        `https://${process.env.REPL_SLUG}.replit.app` : 
        `http://localhost:${actualPort}`}`);
    });

    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`❌ Error: Port ${PORT} is already in use`);
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