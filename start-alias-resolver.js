/**
 * Script de inicio que ejecuta el resolvedor de alias @/ antes de iniciar la aplicación
 * Versión mejorada con manejo de errores específicos
 */

import { spawn } from 'child_process';
import process from 'node:process';
import fs from 'fs';
import path from 'path';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Primero, verificar que tenemos los archivos necesarios
function checkFiles() {
  const requiredFiles = [
    'server/index.ts',
    'client/index.html',
    'client/src/main.tsx'
  ];
  
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error(`${colors.red}Error: Missing required files:${colors.reset}`);
    missingFiles.forEach(file => console.error(`- ${file}`));
    return false;
  }
  
  return true;
}

// Function to start a process and print its output with a colored prefix
function startProcess(command, args, prefix, color) {
  console.log(`${color}Starting ${prefix}...${colors.reset}`);
  
  // Use shell:true to ensure proper environment variable loading
  const childProcess = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { 
      ...process.env, 
      FORCE_COLOR: "true",
      // Asegurar que estamos en modo desarrollo
      NODE_ENV: "development",
      // Configurar host para acceso externo
      HOST: "0.0.0.0"
    }
  });
  
  let hasStarted = false;
  
  childProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`${color}[${prefix}]${colors.reset} ${line}`);
        
        // Mark as started when we see these patterns
        if ((prefix === 'SERVER' && line.includes('Server started')) ||
            (prefix === 'CLIENT' && line.includes('Local:'))) {
          hasStarted = true;
        }
      }
    });
  });
  
  childProcess.stderr.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
      if (line.trim()) {
        // For Vite's ESLint/TypeScript warnings, use yellow instead of red to differentiate from real errors
        const isWarning = line.includes('warning') || line.includes('Warning');
        const errorColor = isWarning ? colors.yellow : colors.red;
        const errorType = isWarning ? 'WARNING' : 'ERROR';
        console.log(`${errorColor}[${prefix} ${errorType}]${colors.reset} ${line}`);
      }
    });
  });
  
  // Set a timeout to check if process has started
  setTimeout(() => {
    if (!hasStarted && !childProcess.killed) {
      console.log(`${colors.yellow}[${prefix}] Process is taking longer than expected to start. Still waiting...${colors.reset}`);
    }
  }, 10000);
  
  childProcess.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      console.log(`${colors.red}[${prefix}] Process terminated with code ${code}${colors.reset}`);
      
      // Provide helpful diagnostics based on the prefix
      if (prefix === 'SERVER') {
        console.log(`${colors.yellow}Troubleshooting tips for server errors:${colors.reset}`);
        console.log(`1. Check for TypeScript errors in the server code`);
        console.log(`2. Verify that all required environment variables are set`);
        console.log(`3. Check if port ${process.env.PORT || '5000'} is already in use`);
      } else if (prefix === 'CLIENT') {
        console.log(`${colors.yellow}Troubleshooting tips for client errors:${colors.reset}`);
        console.log(`1. Check for TypeScript errors in the client code`);
        console.log(`2. Verify that all required environment variables are set`);
      }
    }
  });
  
  return childProcess;
}

// Importar y ejecutar el resolvedor de alias primero
import('./alias-resolver.mjs')
  .then(() => {
    console.log('Alias resolver ejecutado correctamente, iniciando aplicación...');
    
    if (!checkFiles()) {
      process.exit(1);
    }
    
    // Start application with improved process management
    console.log(`${colors.blue}Starting application in development mode...${colors.reset}`);
    
    // Start server using tsx for TypeScript execution
    const server = startProcess('npx', ['tsx', 'server/index.ts'], 'SERVER', colors.cyan);
    
    // Wait a bit for server to initialize before starting client
    setTimeout(() => {
      // Start client using vite with explicit host configuration
      const client = startProcess('cd', ['client', '&&', 'npx', 'vite', '--host', '0.0.0.0'], 'CLIENT', colors.green);
      
      // Handle clean termination
      process.on('SIGINT', () => {
        console.log('\nStopping processes...');
        server.kill();
        client.kill();
        process.exit(0);
      });
    }, 2000);
    
    // Handle any uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.log(`${colors.red}Uncaught exception:${colors.reset}`, err);
    });
    
    process.on('unhandledRejection', (reason) => {
      console.log(`${colors.red}Unhandled promise rejection:${colors.reset}`, reason);
    });
  })
  .catch(error => {
    console.error(`${colors.red}Error al ejecutar el resolvedor de alias:${colors.reset}`, error);
    console.log(`${colors.yellow}Intentando iniciar la aplicación sin resolver alias...${colors.reset}`);
    import('./start.js');
  });