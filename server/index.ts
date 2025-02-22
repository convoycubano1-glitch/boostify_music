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

// Setup static file serving based on environment
if (process.env.NODE_ENV === "production") {
  log('Running in production mode');
  // Serve static files from the dist directory
  const distPath = path.join(process.cwd(), 'dist');
  log(`Serving static files from: ${distPath}`);

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
} else {
  log('Running in development mode');
  // Serve static files from the public folder in development
  app.use(express.static(path.join(process.cwd(), 'client/public')));
}

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

// Validate critical environment variables
if (!process.env.STRIPE_SECRET_KEY) {
  log('Warning: STRIPE_SECRET_KEY is not defined in environment variables');
}

(async () => {
  try {
    const server = registerRoutes(app);

    // Global error handler
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      console.error('Server error:', err);
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      res.status(status).json({ message });
    });

    // Setup Vite or static file serving based on environment
    if (process.env.NODE_ENV === "production") {
      // Already handled above
    } else {
      await setupVite(app, server);
    }

    // Start server on port 5000
    const PORT = 5000;
    server.listen(PORT, "0.0.0.0", () => {
      log(`Server running on port ${PORT} in ${app.get("env")} mode`);
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