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
  log(`Incoming request: ${req.method} ${req.path}`);
  res.on("finish", () => {
    const duration = Date.now() - start;
    log(`${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
  });
  next();
});

// Setup static file serving based on environment
if (process.env.NODE_ENV === "production") {
  log('Running in production mode');

  // Determine the correct dist path
  const distPath = path.join(process.cwd(), 'dist', 'public');
  log(`Serving static files from: ${distPath}`);

  // Verify dist directory structure and critical files
  try {
    if (!fs.existsSync(distPath)) {
      log(`Creating dist directory: ${distPath}`);
      fs.mkdirSync(distPath, { recursive: true });
    }

    const files = fs.readdirSync(distPath);
    log(`Found files in ${distPath}: ${files.join(', ')}`);

    const indexPath = path.join(distPath, 'index.html');
    if (!fs.existsSync(indexPath)) {
      throw new Error(`Critical file missing: ${indexPath}`);
    }

    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const assetFiles = fs.readdirSync(assetsPath);
      log(`Found assets in ${assetsPath}: ${assetFiles.join(', ')}`);
    } else {
      log('Warning: assets directory not found');
    }
  } catch (error) {
    log(`Error during static file setup: ${error}`);
    throw new Error(`Static file setup failed: ${error.message}`);
  }

  // Serve static assets with aggressive caching
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    etag: true,
    lastModified: true
  }));

  // Serve other static files except index.html
  app.use(express.static(distPath, {
    index: false,
    etag: true,
    lastModified: true
  }));

  // Handle SPA routes - serve index.html for all non-asset requests
  app.get('*', (req, res, next) => {
    // Skip API routes and asset routes
    if (req.path.startsWith('/api') || req.path.startsWith('/assets')) {
      return next();
    }

    const indexPath = path.join(distPath, 'index.html');
    log(`Serving index.html for path: ${req.path}`);

    try {
      if (fs.existsSync(indexPath)) {
        const indexContent = fs.readFileSync(indexPath, 'utf-8');
        log(`Successfully read index.html (${indexContent.length} bytes)`);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Content-Type', 'text/html');
        res.sendFile(indexPath);
      } else {
        log(`Error: index.html not found at ${indexPath}`);
        next(new Error(`index.html not found at ${indexPath}`));
      }
    } catch (error) {
      log(`Error accessing index.html: ${error}`);
      next(error);
    }
  });

} else {
  log('Running in development mode');
  app.use(express.static(path.join(process.cwd(), 'client/public')));
}

// Validate critical environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  log('Warning: STRIPE_SECRET_KEY is not defined in environment variables');
}

(async () => {
  try {
    log('Starting server setup...');
    const server = registerRoutes(app);

    // Global error handler with detailed logging
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error handling request ${req.method} ${req.path}: ${err.message}`);
      if (err.stack) {
        log(`Stack trace: ${err.stack}`);
      }

      res.status(status).json({ 
        message,
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });

    // Setup Vite or static file serving based on environment
    if (process.env.NODE_ENV === "production") {
      log('Using production static file serving');
    } else {
      log('Setting up Vite development server');
      await setupVite(app, server);
    }

    // ALWAYS use port 5000 as required by Replit
    const PORT = 5000;

    log('Attempting to start server...');
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server started successfully on port ${PORT}`);
      log(`Environment: ${app.get("env")}`);
      log(`Static files path: ${process.env.NODE_ENV === "production" ? 
        path.join(process.cwd(), 'dist', 'public') : 
        path.join(process.cwd(), 'client/public')}`);
    });

    // Handle server startup errors
    server.on('error', (error: any) => {
      if (error.code === 'EADDRINUSE') {
        log(`Error: Port ${PORT} is already in use`);
      } else {
        log(`Server error: ${error.message}`);
      }
      process.exit(1);
    });

  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();