/**
 * Script para iniciar la aplicación optimizada de Boostify Music
 * Desarrollado específicamente para despliegue en Replit
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

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

// Function to start a process and print its output with a colored prefix
function startProcess(command, args, prefix, color) {
  console.log(`${color}Starting ${prefix}...${colors.reset}`);
  
  // Use shell:true to ensure proper environment variable loading
  const childProcess = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, FORCE_COLOR: "true" }
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

// Detect if server/index.ts exists or find the proper server entry point
function findServerEntryPoint() {
  const possibleServerFiles = [
    'server/index.ts',
    'server/index.js',
    'server.js',
    'server.ts'
  ];
  
  for (const file of possibleServerFiles) {
    if (fs.existsSync(path.resolve(process.cwd(), file))) {
      return file;
    }
  }
  
  // Default if none found
  return 'server/index.ts';
}

// Start the application
function startApplication() {
  console.log(`${colors.blue}Starting optimized application for Replit deployment...${colors.reset}`);
  
  // Verificar si existe el script optimizado
  if (fs.existsSync('./optimized-start.js')) {
    console.log(`${colors.cyan}Usando script de inicio optimizado: optimized-start.js${colors.reset}`);
    
    // Ejecutar directamente el script optimizado
    const server = startProcess('node', ['optimized-start.js'], 'OPTIMIZED-SERVER', colors.cyan);
    
    // Handle clean termination
    process.on('SIGINT', () => {
      console.log('\nStopping processes...');
      server.kill();
      process.exit(0);
    });
  } else {
    console.log(`${colors.red}Script optimizado no encontrado. Ejecutando en modo de compatibilidad...${colors.reset}`);
    
    // Si no existe el script optimizado, usar el servidor básico
    if (fs.existsSync('./server-prod.js')) {
      const server = startProcess('node', ['server-prod.js'], 'SERVER', colors.cyan);
      
      process.on('SIGINT', () => {
        console.log('\nStopping processes...');
        server.kill();
        process.exit(0);
      });
    } else {
      console.log(`${colors.red}No se encuentra ningún script de servidor. Verifica la instalación.${colors.reset}`);
      process.exit(1);
    }
  }
}

// Handle any uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`${colors.red}Uncaught exception:${colors.reset}`, err);
});

process.on('unhandledRejection', (reason) => {
  console.log(`${colors.red}Unhandled promise rejection:${colors.reset}`, reason);
});

// Start the application
startApplication();