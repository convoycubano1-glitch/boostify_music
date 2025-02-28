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
  <title>Application</title>
</head>
<body>
  <div id="root"></div>
  <script>
    window.location.href = '/api/health';
  </script>
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
  const files = fs.readdirSync(distPath);
  log(`📁 Files in dist/public: ${files.join(', ')}`);

  // Serve static files in this order:

  // 1. Serve assets with caching
  app.use('/assets', (req, res, next) => {
    log(`🎨 Asset request: ${req.path}`);
    next();
  }, express.static(path.resolve(distPath, 'assets'), {
    maxAge: '1d',
    etag: true
  }));

  // 2. Serve other static files
  app.use(express.static(distPath, {
    index: false // Important: don't serve index.html automatically
  }));

  // 3. Handle SPA routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      log(`👉 API request, passing to next handler: ${req.path}`);
      return next();
    }

    log(`📄 Serving index.html for SPA route: ${req.path}`);

    // Read and serve index.html manually
    try {
      const indexContent = fs.readFileSync(indexPath, 'utf8');
      
      // Verificar si hay contenido en index.html
      if (!indexContent || indexContent.trim() === '') {
        log(`⚠️ Warning: Empty index.html content`);
        // Proporcionar un index.html mínimo si está vacío
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <script>
    // Redirigir a la raíz si la página está vacía
    window.onload = function() {
      if (document.body.innerHTML.trim() === '') {
        window.location.href = '/';
      }
    };
  </script>
</head>
<body>
  <div id="root"></div>
</body>
</html>`);
      } else {
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Cache-Control', 'no-cache');
        res.send(indexContent);
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

    // Setup Vite in development
    if (process.env.NODE_ENV !== "production") {
      log('🛠 Setting up Vite development server');
      await setupVite(app, server);
    }

    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 5000;

    server.listen(PORT, () => {
      log(`✅ Server started on port ${PORT}`);
      log(`🌍 Environment: ${app.get("env")}`);
      log(`📂 Static files served from: ${process.env.NODE_ENV === "production" ? 
        path.resolve(process.cwd(), 'dist', 'public') : 
        path.join(process.cwd(), 'client/public')}`);
      log(`🔗 Access URL: ${process.env.REPL_SLUG ? 
        `https://${process.env.REPL_SLUG}.replit.app` : 
        `http://localhost:${PORT}`}`);
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