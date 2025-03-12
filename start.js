
#!/usr/bin/env node

/**
 * Script for starting both the server and client
 * Includes improved error handling and process management
 */

import { spawn } from 'child_process';

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
  const process = spawn(command, args, {
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: true,
    env: { ...process.env, FORCE_COLOR: "true" }
  });
  
  let hasStarted = false;
  
  process.stdout.on('data', (data) => {
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
  
  process.stderr.on('data', (data) => {
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
    if (!hasStarted && !process.killed) {
      console.log(`${colors.yellow}[${prefix}] Process is taking longer than expected to start. Still waiting...${colors.reset}`);
    }
  }, 10000);
  
  process.on('exit', (code) => {
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
  
  return process;
}

// Try to start the server first, then start the client
console.log(`${colors.blue}Starting application in development mode...${colors.reset}`);

// Start server using tsx for TypeScript execution
const server = startProcess('npx', ['tsx', 'server/index.ts'], 'SERVER', colors.cyan);

// Wait a bit for server to initialize before starting client
setTimeout(() => {
  // Start client using vite
  const client = startProcess('cd', ['client', '&&', 'npx', 'vite'], 'CLIENT', colors.green);
  
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
