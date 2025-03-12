/**
 * Script for starting both the server and client
 * Includes improved error handling, process management and path alias resolution
 */

import { spawn } from "child_process";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Terminal colors
const colors = {
  reset: "\x1b[0m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
};

/**
 * Ensures alias symlinks are created before starting the app
 */
function setupAliasSymlinks() {
  console.log(`${colors.blue}Setting up path alias symlinks...${colors.reset}`);
  
  // Create node_modules/@
  const nodeModulesDir = path.join(__dirname, "node_modules");
  if (!fs.existsSync(nodeModulesDir)) {
    fs.mkdirSync(nodeModulesDir, { recursive: true });
  }
  
  // Create symlink
  const srcDir = path.join(__dirname, "client", "src");
  const aliasDir = path.join(nodeModulesDir, "@");
  
  try {
    // Remove existing symlink if it exists
    if (fs.existsSync(aliasDir)) {
      fs.unlinkSync(aliasDir);
    }
    
    // Create new symlink
    fs.symlinkSync(srcDir, aliasDir, "dir");
    console.log(`${colors.green}Successfully created symlink: ${aliasDir} -> ${srcDir}${colors.reset}`);
  } catch (error) {
    console.error(`${colors.red}Error creating symlink: ${error.message}${colors.reset}`);
    console.log(`${colors.yellow}Continuing with startup anyway...${colors.reset}`);
  }
}

/**
 * Starts a child process with the given command and args
 * @param {string} command - The command to run
 * @param {string[]} args - Command arguments
 * @param {string} prefix - Log prefix for the process
 * @param {string} color - Color to use for the logs
 */
function startProcess(command, args, prefix, color) {
  console.log(`${color}Starting ${prefix}...${colors.reset}`);
  
  const childProcess = spawn(command, args, {
    stdio: "pipe",
    shell: true,
  });
  
  childProcess.stdout.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.log(`${color}[${prefix}] ${line}${colors.reset}`);
      }
    });
  });
  
  childProcess.stderr.on("data", (data) => {
    const lines = data.toString().trim().split("\n");
    lines.forEach((line) => {
      if (line.trim()) {
        console.error(`${colors.red}[${prefix} ERROR] ${line}${colors.reset}`);
      }
    });
  });
  
  childProcess.on("error", (error) => {
    console.error(`${colors.red}[${prefix}] Process error: ${error.message}${colors.reset}`);
  });
  
  childProcess.on("close", (code) => {
    if (code !== 0) {
      console.error(`${colors.red}[${prefix}] Process exited with code ${code}${colors.reset}`);
    }
  });
  
  return childProcess;
}

// Main function
function main() {
  console.log(`${colors.green}Starting application in development mode...${colors.reset}`);
  
  // Setup alias symlinks
  setupAliasSymlinks();
  
  // Start the server first
  const serverProcess = startProcess("node", ["server/index.ts"], "SERVER", colors.yellow);
  
  // Start client after a small delay to ensure server is running
  setTimeout(() => {
    const clientProcess = startProcess("npx", ["vite", "--host", "0.0.0.0"], "CLIENT", colors.cyan);
    
    // Handle process termination
    process.on("SIGINT", () => {
      console.log(`${colors.yellow}Shutting down processes...${colors.reset}`);
      serverProcess.kill();
      clientProcess.kill();
      process.exit(0);
    });
  }, 500);
}

// Run the main function
main();