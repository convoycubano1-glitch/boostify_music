/**
 * Script for starting both the server and client
 * Includes improved error handling and process management
 * Updated to work with the current project structure
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
  console.log(`${colors.blue}Starting application in development mode...${colors.reset}`);
  
  const serverFile = findServerEntryPoint();
  console.log(`${colors.cyan}Using server entry point: ${serverFile}${colors.reset}`);
  
  // Start server using tsx or node depending on the file extension
  const isTypeScript = serverFile.endsWith('.ts');
  const serverCommand = isTypeScript ? 'npx tsx' : 'node';
  const server = startProcess(serverCommand, [serverFile], 'SERVER', colors.cyan);
  
  // Wait a bit for server to initialize before starting client
  setTimeout(() => {
    // Check if client directory exists, otherwise assume Vite is configured to serve from root
    const hasClientDir = fs.existsSync(path.resolve(process.cwd(), 'client'));
    const clientCmd = hasClientDir ? 'cd client && npx vite' : 'npx vite';
    
    // Start client using vite
    const client = startProcess(clientCmd, [], 'CLIENT', colors.green);
    
    // Handle clean termination
    process.on('SIGINT', () => {
      console.log('\nStopping processes...');
      server.kill();
      client.kill();
      process.exit(0);
    });
  }, 2000);
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