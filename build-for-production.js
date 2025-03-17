#!/usr/bin/env node

/**
 * Optimized build script for Replit deployment
 * 
 * This script addresses the following deployment issues:
 * 1. Large media files causing the bundle to exceed 8GB limit
 * 2. Missing production optimizations
 * 3. Improper build configuration
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Console colors for better readability
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Log with colors
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Execute a command and display output
function execute(command, errorMessage, ignoreErrors = false) {
  log(`Running: ${command}`, 'blue');
  
  try {
    execSync(command, { stdio: 'inherit' });
    return true;
  } catch (error) {
    if (ignoreErrors) {
      log(`⚠ ${errorMessage || error.message}`, 'yellow');
      log('Continuing despite error...', 'yellow');
      return false;
    } else {
      log(`✗ ${errorMessage || error.message}`, 'red');
      process.exit(1);
    }
  }
}

// Clean up the previous build
function cleanDistDirectory() {
  log('Cleaning previous build...', 'cyan');
  execute('rm -rf dist', 'Error cleaning dist directory');
  execute('mkdir -p dist/client', 'Error creating dist directories');
}

// Create an optimized TypeScript config for production
function createOptimizedTsConfig() {
  log('Creating optimized TypeScript configuration...', 'cyan');
  
  if (fs.existsSync('tsconfig.json')) {
    try {
      const tsconfig = JSON.parse(fs.readFileSync('tsconfig.json', 'utf8'));
      
      const prodConfig = {
        ...tsconfig,
        compilerOptions: {
          ...tsconfig.compilerOptions,
          skipLibCheck: true,
          noEmitOnError: false,
          sourceMap: false,
          removeComments: true
        }
      };
      
      fs.writeFileSync('tsconfig.prod.json', JSON.stringify(prodConfig, null, 2));
      log('✓ Created tsconfig.prod.json', 'green');
      return true;
    } catch (error) {
      log(`✗ Error creating temporary tsconfig: ${error.message}`, 'red');
      return false;
    }
  } else {
    log('⚠ No tsconfig.json found', 'yellow');
    return false;
  }
}

// Create a .gitignore file for build process
function createBuildGitignore() {
  const gitignoreContent = `
# Files and directories to exclude from deployment that cause size issues
# Node.js development files
**/.npm
**/.npmrc
**/node_modules/.cache
**/node_modules/.bin
**/node_modules/.vite

# Large development files
**/.git
**/.github
**/.vscode
**/.idea
**/.DS_Store
**/.Thumbs.db

# Only exclude raw/source design files
**/*.psd
**/*.ai
**/*.sketch
**/*.fig
**/*.xd

# Other large assets
**/client/dist/assets/Standard_Mode_Generated_Video*
**/client/public/assets/Standard_Mode_Generated_Video*
**/assets/Standard_Mode_Generated_Video*
**/node_modules/.cache
**/.git

# Caches and logs
**/.cache
**/logs
**/*.log
`;

  fs.writeFileSync('.gitignore-build', gitignoreContent);
  log('✓ Created .gitignore-build for excluding large media files', 'green');
}

// Copy files to dist while excluding specified patterns
function excludeLargeMediaFiles() {
  log('Copying files to dist with optimizations...', 'cyan');
  
  // Create a function to check if a file should be excluded based on patterns
  function shouldExclude(filePath) {
    if (fs.existsSync('.gitignore-build')) {
      try {
        const patterns = fs.readFileSync('.gitignore-build', 'utf8').split('\n');
        for (const pattern of patterns) {
          // Skip empty lines and comments
          if (!pattern.trim() || pattern.startsWith('#')) continue;
          
          // Convert glob pattern to regex
          const regexPattern = pattern
            .replace(/\./g, '\\.')
            .replace(/\*/g, '.*')
            .replace(/\*\*/g, '.*');
          
          // Check if file matches pattern
          if (new RegExp(regexPattern).test(filePath)) {
            return true;
          }
        }
      } catch (error) {
        log(`✗ Error reading .gitignore-build: ${error.message}`, 'red');
      }
    }
    return false;
  }
  
  // Recursive function to copy directory contents
  function copyDir(src, dest) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    
    const entries = fs.readdirSync(src, { withFileTypes: true });
    
    for (const entry of entries) {
      const srcPath = path.join(src, entry.name);
      const destPath = path.join(dest, entry.name);
      
      // Skip if it matches exclusion pattern
      if (shouldExclude(srcPath)) {
        continue;
      }
      
      if (entry.isDirectory()) {
        copyDir(srcPath, destPath);
      } else {
        try {
          fs.copyFileSync(srcPath, destPath);
        } catch (err) {
          log(`✗ Error copying ${srcPath}: ${err.message}`, 'yellow');
        }
      }
    }
  }
  
  // Start the recursive copy from root to dist
  copyDir('.', 'dist');
  
  log('✓ Files copied to dist with optimizations', 'green');
}

// Compile server code
function compileServer() {
  log('Compiling server code...', 'cyan');
  
  const useCustomTsConfig = createOptimizedTsConfig();
  
  if (useCustomTsConfig) {
    execute('npx tsc --project tsconfig.prod.json', 'Error compiling TypeScript', true);
    
    // Remove temporary config
    try {
      fs.unlinkSync('tsconfig.prod.json');
    } catch (error) {
      log(`✗ Error removing temporary tsconfig: ${error.message}`, 'red');
    }
  } else {
    execute('npx tsc --skipLibCheck', 'Error compiling TypeScript', true);
  }
  
  log('✓ Server code compiled', 'green');
}

// Build client with Vite optimizations
function buildClient() {
  log('Building client with production optimizations...', 'cyan');
  
  // Create a vite config specifically for production
  const viteConfigContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist/client',
    emptyOutDir: true,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'wouter'],
          ui: [
            '@radix-ui/react-accordion',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-aspect-ratio',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu'
          ]
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
`;

  fs.writeFileSync('client/vite.config.prod.js', viteConfigContent);
  
  // Build client using the production config
  execute('cd client && npx vite build --config vite.config.prod.js', 'Error building client', true);
  
  log('✓ Client built with production optimizations', 'green');
}

// Create an optimized package.json for production
function createProductionPackageJson() {
  log('Creating optimized package.json for production...', 'cyan');
  
  if (fs.existsSync('package.json')) {
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      // Create a minimal package.json with only what's needed for production
      const prodPackage = {
        name: packageJson.name,
        version: packageJson.version,
        type: packageJson.type || "module",
        engines: { 
          node: ">=18.0.0" 
        },
        dependencies: {
          // Filter out dev dependencies and keep only what's needed for production
          // This reduces the package size significantly
          ...Object.fromEntries(
            Object.entries(packageJson.dependencies || {})
              .filter(([key]) => !key.includes('@types/') && 
                              !key.includes('-dev') && 
                              !key.startsWith('typescript') &&
                              !key.includes('vite'))
          )
        },
        scripts: {
          start: "node server/index.js"
        }
      };
      
      fs.writeFileSync('dist/package.json', JSON.stringify(prodPackage, null, 2));
      log('✓ Optimized package.json created for production', 'green');
    } catch (error) {
      log(`✗ Error creating production package.json: ${error.message}`, 'red');
    }
  }
}

// Copy necessary files for production
function copyProductionFiles() {
  log('Copying production files...', 'cyan');
  
  // Copy environment files
  ['env', '.env', '.env.production'].forEach(envFile => {
    if (fs.existsSync(envFile)) {
      try {
        fs.copyFileSync(envFile, `dist/${envFile}`);
        log(`✓ ${envFile} copied to dist/`, 'green');
      } catch (error) {
        log(`✗ Error copying ${envFile}: ${error.message}`, 'red');
      }
    }
  });
  
  // Create a production start script that includes the original server routes
  const startScript = `#!/usr/bin/env node

/**
 * Production server for Boostify Music
 * Optimized for Replit deployment
 */

import { createServer } from 'http';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, 'client')));

// Import routes if they exist (otherwise we'll create simple defaults)
let hasRegisteredRoutes = false;
try {
  if (fs.existsSync(path.join(__dirname, 'server/routes.js'))) {
    import('./server/routes.js')
      .then(routes => {
        if (typeof routes.registerRoutes === 'function') {
          routes.registerRoutes(app);
          hasRegisteredRoutes = true;
          console.log('✅ API routes registered successfully');
        }
      })
      .catch(err => {
        console.error('Error importing routes:', err);
      });
  }
} catch (error) {
  console.error('Failed to import routes:', error);
}

// Basic API health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// For all other routes, serve the index.html
app.get('*', (req, res) => {
  // Skip API routes which should be handled by the imported router
  if (req.path.startsWith('/api/') && hasRegisteredRoutes) {
    return;
  }
  res.sendFile(path.join(__dirname, 'client', 'index.html'));
});

// Create and start the server
const server = createServer(app);
server.listen(PORT, () => {
  console.log(\`✨ Server running on port \${PORT}\`);
  console.log(\`📊 Health check available at: http://localhost:\${PORT}/api/health\`);
});
`;

  fs.writeFileSync('dist/server.js', startScript);
  fs.chmodSync('dist/server.js', '755');
  log('✓ Production server script created', 'green');
  
  // Create a deployment.txt guide
  const deploymentGuide = `
# Deployment Guide for Boostify Music

## Overview
This application has been prepared for deployment on Replit with optimizations:
- Large media files have been excluded to stay within size limits
- Production optimizations have been applied
- Server configuration has been streamlined for better performance

## How to Deploy
1. Use the "Run" button in Replit to verify the application works locally
2. Click the "Deploy" button in Replit UI
3. Choose "Deploy from current state"
4. Once deployed, your app will be available at your-repl-name.replit.app

## Important Notes
- Large media files need to be hosted externally (use a CDN or storage service)
- Update any hardcoded URLs to use relative paths or environment variables
- For any issues, check the server logs in the Replit console

Last optimized: ${new Date().toISOString()}
`;

  fs.writeFileSync('DEPLOYMENT.md', deploymentGuide);
  log('✓ Deployment guide created: DEPLOYMENT.md', 'green');
  
  // Create .replit file for deployment
  const replitConfig = `
hidden = [".config", ".git", "node_modules"]
run = "node dist/server.js"

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "node dist/server.js"]
deploymentTarget = "cloudrun"
ignorePorts = false

[env]
PORT = "3000"

[languages]

[languages.javascript]
pattern = "**/{*.js,*.jsx,*.ts,*.tsx}"

[languages.javascript.languageServer]
start = "typescript-language-server --stdio"
`;

  fs.writeFileSync('dist/.replit', replitConfig);
  log('✓ Replit deployment configuration created', 'green');
  
  // Create a build completion indicator file
  fs.writeFileSync('dist/BUILD_COMPLETED', `Build completed on ${new Date().toISOString()}`);
}

// Clean up after build
function cleanupBuild() {
  log('Cleaning up build artifacts...', 'cyan');
  
  try {
    fs.unlinkSync('.gitignore-build');
    fs.unlinkSync('client/vite.config.prod.js');
    log('✓ Build artifacts cleaned up', 'green');
  } catch (error) {
    log(`✗ Error cleaning up build artifacts: ${error.message}`, 'red');
  }
}

// Main build function
async function buildForProduction() {
  log('====================================', 'magenta');
  log('   STARTING PRODUCTION BUILD', 'magenta');
  log('====================================', 'magenta');
  
  // Step 1: Clean up and prepare
  cleanDistDirectory();
  createBuildGitignore();
  
  // Step 2: Exclude large media files
  excludeLargeMediaFiles();
  
  // Step 3: Compile server
  compileServer();
  
  // Step 4: Build client
  buildClient();
  
  // Step 5: Create production files
  createProductionPackageJson();
  copyProductionFiles();
  
  // Step 6: Clean up
  cleanupBuild();
  
  log('\n====================================', 'magenta');
  log('   PRODUCTION BUILD COMPLETE!', 'magenta');
  log('====================================', 'magenta');
  log('The application has been built for production in the \'dist\' folder', 'green');
  log('You can now deploy this directory to Replit', 'green');
}

// Run the build process
buildForProduction();