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

  const distPath = path.resolve(process.cwd(), 'dist', 'public');
  const indexPath = path.resolve(distPath, 'index.html');

  // Verify build files exist
  if (!fs.existsSync(distPath)) {
    throw new Error(`Production build directory not found: ${distPath}`);
  }

  if (!fs.existsSync(indexPath)) {
    throw new Error(`index.html not found in production build`);
  }

  // Log directory contents for debugging
  const files = fs.readdirSync(distPath);
  log(`Files in dist/public: ${files.join(', ')}`);

  // First serve assets with caching
  app.use('/assets', express.static(path.resolve(distPath, 'assets'), {
    maxAge: '1d',
    etag: true
  }));

  // Then serve other static files
  app.use(express.static(distPath, {
    index: false
  }));

  // Finally handle SPA routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }

    log(`Serving index.html for SPA route: ${req.path}`);
    res.sendFile(indexPath);
  });

} else {
  log('Running in development mode');
  app.use(express.static(path.join(process.cwd(), 'client/public')));
}

(async () => {
  try {
    log('Starting server setup...');
    const server = registerRoutes(app);

    // Global error handler
    app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";

      log(`Error handling request ${req.method} ${req.path}: ${err.message}`);
      res.status(status).json({ 
        message,
        path: req.path,
        timestamp: new Date().toISOString()
      });
    });

    // Setup Vite in development
    if (process.env.NODE_ENV !== "production") {
      log('Setting up Vite development server');
      await setupVite(app, server);
    }

    const PORT = 5000;

    server.listen(PORT, "0.0.0.0", () => {
      log(`Server started on port ${PORT}`);
      log(`Environment: ${app.get("env")}`);
      log(`Static files served from: ${process.env.NODE_ENV === "production" ? 
        path.resolve(process.cwd(), 'dist', 'public') : 
        path.join(process.cwd(), 'client/public')}`);
      log(`Access URL: ${process.env.REPL_SLUG ? 
        `https://${process.env.REPL_SLUG}.replit.app` : 
        `http://localhost:${PORT}`}`);
    });

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