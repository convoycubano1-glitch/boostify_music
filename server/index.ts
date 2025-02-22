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

  // Log directory contents for debugging
  try {
    const files = fs.readdirSync(distPath);
    log(`Found files in ${distPath}:`, files);

    const assetsPath = path.join(distPath, 'assets');
    if (fs.existsSync(assetsPath)) {
      const assetFiles = fs.readdirSync(assetsPath);
      log(`Found assets in ${assetsPath}:`, assetFiles);
    }
  } catch (error) {
    log(`Error reading dist directory: ${error}`);
    throw new Error(`Could not access the build directory: ${distPath}`);
  }

  // Serve static assets with cache headers
  app.use('/assets', express.static(path.join(distPath, 'assets'), {
    maxAge: '1y',
    etag: false
  }));

  // Serve other static files except index.html
  app.use(express.static(distPath, {
    index: false
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
        log(`index.html found and has content length: ${indexContent.length}`);
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
    const server = registerRoutes(app);

    // Global error handler with detailed logging
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      // Log detailed error information
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
      // Already handled above
    } else {
      await setupVite(app, server);
    }

    // Use dynamic port from environment or fallback to 3000
    const PORT = parseInt(process.env.PORT || "3000");
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT} in ${app.get("env")} mode`);
      log(`Static files will be served from: ${process.env.NODE_ENV === "production" ? 
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