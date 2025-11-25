import 'dotenv/config';
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from 'path';
import cors from 'cors';
import fs from 'fs';
import fileUpload from 'express-fileupload';

// Detect deployment environment using Replit's official environment variable
// REPLIT_DEPLOYMENT is set to '1' only in actual Cloud Run deployments
if (process.env.REPLIT_DEPLOYMENT === '1') {
  process.env.NODE_ENV = 'production';
  log('🚀 Detected Replit deployment (REPLIT_DEPLOYMENT=1) - using production mode');
} else {
  // Force development mode for local Replit environment
  process.env.NODE_ENV = 'development';
  log('🛠️ Local development environment - using development mode');
}

const app = express();

// Enable CORS for development
app.use(cors());

// Middleware to configure security headers (CSP)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://storage.googleapis.com https://*.googleapis.com; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "img-src 'self' data: https: blob: *; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.freepik.com https://api.piapi.ai https://api.fal.ai https://*.unsplash.com wss://*.firebaseio.com *; " +
    "media-src 'self' https: blob: *; " +
    "worker-src 'self' blob:; " +
    "frame-src 'self';"
  );

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');

  next();
});

// Increase JSON size limit to handle image data URLs and large audio files
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: false, limit: '100mb' }));

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

// Configure middleware for file processing (100MB limit for audio files)
app.use(fileUpload({
  useTempFiles: true,
  tempFileDir: '/tmp/',
  createParentPath: true,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB
  abortOnLimit: true,
  debug: false
}));

// Manejo de errores para fileUpload
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  if (err && err.code === 'LIMIT_FILE_SIZE') {
    console.error('Error al cargar archivo: tamaño excedido');
    return res.status(413).json({
      success: false,
      error: 'El archivo es demasiado grande. El tamaño máximo permitido es 100MB.'
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

(async () => {
  try {
    log('🔄 Starting server setup...');

    const { checkEnvironment } = await import('./utils/environment-check');
    checkEnvironment();
    
    // CRITICAL: Setup Replit Auth FIRST before ANY routes
    // This must be BEFORE all endpoints so they have access to req.user and req.session
    log('🔐 Setting up Replit Auth...');
    try {
      const { setupAuth } = await import('./replitAuth');
      await setupAuth(app);
      log('✅ Replit Auth configured successfully');
    } catch (error) {
      log(`❌ ERROR setting up Replit Auth: ${error}`);
      console.error('Full error:', error);
      throw error;
    }
    
    // Serve uploaded files statically
    const uploadsPath = path.join(process.cwd(), 'uploads');
    app.use('/uploads', express.static(uploadsPath));
    log(`📁 Serving uploaded files from: ${uploadsPath}`);

    // Serve attached assets (generated images, AI content, etc)
    const assetsPath = path.resolve(__dirname, '..', 'attached_assets');
    if (fs.existsSync(assetsPath)) {
      app.use('/attached_assets', express.static(assetsPath));
      log(`🖼️ Serving attached assets from: ${assetsPath}`);
    }

    // IMPORTANT: Register API routes BEFORE static file serving
    const server = await registerRoutes(app);
    log('✅ API routes registered successfully');

    // Register /api/auth/user endpoint
    log('🔐 Registering /api/auth/user endpoint...');
    app.get('/api/auth/user', async (req: any, res) => {
      try {
        console.log('[/api/auth/user] req.user:', req.user ? { id: req.user.id, email: req.user.email } : 'undefined');
        console.log('[/api/auth/user] req.isAuthenticated:', typeof req.isAuthenticated, req.isAuthenticated ? req.isAuthenticated() : 'undefined');
        console.log('[/api/auth/user] req.session:', req.session ? 'exists' : 'undefined');
        
        // Check if user is authenticated via passport
        if (req.user && req.user.id) {
          console.log('✅ User authenticated via req.user');
        } else if (req.isAuthenticated && req.isAuthenticated()) {
          console.log('✅ User authenticated via req.isAuthenticated()');
        } else {
          console.log('❌ User not authenticated - no req.user and isAuthenticated() = false');
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        // Get user from session (already deserialized by passport)
        const user = req.user;
        if (!user || !user.id) {
          console.log('❌ No user.id found');
          return res.status(401).json({ message: "Unauthorized" });
        }
        
        const userId = user.id;
        const userEmail = user.email;
        
        // Check if user is admin (convoycubano@gmail.com)
        const isAdmin = userEmail === 'convoycubano@gmail.com';
        
        const { db } = await import('./db');
        const { users } = await import('@db/schema');
        const { eq } = await import('drizzle-orm');
        
        const [dbUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, userId))
          .limit(1);
        
        if (!dbUser) {
          return res.status(404).json({ message: "User not found" });
        }
        
        // Return user with admin status
        res.json({
          ...dbUser,
          isAdmin,
          role: isAdmin ? 'admin' : (dbUser.role || 'artist')
        });
      } catch (error) {
        console.error("Error fetching user:", error);
        res.status(500).json({ message: "Failed to fetch user" });
      }
    });
    log('✅ /api/auth/user endpoint registered');
    
    // Aumentar timeout del servidor a 5 minutos (300 segundos) para generar galerías de imágenes
    server.timeout = 300000; // 5 minutos en milisegundos
    log('⏱️ Server timeout set to 5 minutes for long-running image generation requests');

    // Setup static file serving based on environment
    // This must come AFTER API routes registration
    if (process.env.NODE_ENV === "production") {
      log('🚀 Running in production mode');

      const distPath = path.resolve(process.cwd(), 'dist', 'client');
      log(`📁 Serving static files from: ${distPath}`);

      // Serve static files
      app.use(express.static(distPath));
      
      // SPA fallback - catch all other routes and serve index.html
      // This MUST be the last route
      app.get('*', (req, res) => {
        // Don't log API requests here as they're already handled
        if (!req.path.startsWith('/api/')) {
          log(`📄 Serving index.html for: ${req.path}`);
        }
        res.sendFile(path.join(distPath, 'index.html'));
      });
    } else {
      log('🛠 Running in development mode');
      app.use(express.static(path.join(process.cwd(), 'client/public')));
      log('🔍 Vite will handle frontend routes in development mode');
    }

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
      const criticalEnvVars = [
        { name: 'OPENAI_API_KEY', description: 'OpenAI API access' },
        { name: 'SESSION_SECRET', description: 'Secure session management' },
        { name: 'DATABASE_URL', description: 'Database connection' }
      ];

      criticalEnvVars.forEach(({ name, description }) => {
        if (!process.env[name]) {
          log(`⚠️ Warning: ${name} environment variable is not set (${description})`);
        } else {
          log(`✅ ${name} is configured and ready for use`);
        }
      });

      if (process.env.PM2_HOME) {
        log('✅ Running under PM2 process manager');
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

    if (process.env.NODE_ENV !== "production") {
      log('🛠 Setting up Vite development server');
      log('📌 Configuring Vite to handle frontend routes like "/"');
      await setupVite(app, server);
      log('✅ Vite development server configured');
      app.use('*', (req, res, next) => {
        if (!req.path.startsWith('/api/') && !req.path.startsWith('/@') && !req.path.startsWith('/src/')) {
          log(`⚠️ Route not handled by Vite: ${req.method} ${req.path}`);
        }
        next();
      });
    }

    const PORT = process.env.NODE_ENV !== "production" ? 5000 :
      (process.env.PORT ? parseInt(process.env.PORT, 10) :
      (process.env.REPLIT_PORT ? parseInt(process.env.REPLIT_PORT, 10) : 5000));

    const isReplitEnv = !!process.env.REPL_SLUG || !!process.env.REPLIT_IDENTITY;

    if (process.env.NODE_ENV === "production") {
      log(`🚀 Starting server in production mode on port ${PORT}`);
    }

    server.listen(PORT, '0.0.0.0', () => {
      log(`✅ Server started on port ${PORT}`);
      log(`🌍 Environment: ${process.env.NODE_ENV || app.get("env")}`);
      log(`📂 Static files served from: ${process.env.NODE_ENV === "production" ?
        path.resolve(process.cwd(), 'dist', 'client') :
        path.join(process.cwd(), 'client/public')}`);

      const accessURL = isReplitEnv ?
        `https://${process.env.REPL_SLUG || 'your-replit'}.replit.app` :
        process.env.NODE_ENV === "production" ?
          `${process.env.APP_URL || 'https://your-app-domain.com'}` :
          `http://localhost:${PORT}`;

      log(`🔗 Access URL: ${accessURL}`);
    });

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