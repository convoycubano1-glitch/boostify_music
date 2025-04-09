#!/usr/bin/env node

/**
 * Script to verify that the environment is correctly configured
 * for deploying Boostify Music
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

// Basic configuration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Header
console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║             DEPLOYMENT VERIFICATION                      ║
║                 BOOSTIFY MUSIC                           ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);

// Verify critical files
const requiredFiles = [
  { path: 'start-deployment.js', description: 'Main deployment script' },
  { path: 'start-prod.js', description: 'Alternative deployment script' },
  { path: 'deploy.sh', description: 'Shell script for local deployment' },
  { path: 'server/index.ts', description: 'Server entry point' },
  { path: 'client/src/main.tsx', description: 'Client entry point' }
];

console.log(`${colors.blue}[1] Checking critical files...${colors.reset}`);

let allFilesPresent = true;
for (const file of requiredFiles) {
  if (fs.existsSync(path.join(__dirname, file.path))) {
    console.log(`  ${colors.green}✓ ${file.path}${colors.reset} (${file.description})`);
  } else {
    console.log(`  ${colors.red}✗ ${file.path}${colors.reset} (${file.description}) - MISSING!`);
    allFilesPresent = false;
  }
}

if (!allFilesPresent) {
  console.log(`\n${colors.red}❌ Error: Critical files for deployment are missing.${colors.reset}`);
  process.exit(1);
}

// Verify execution permissions
console.log(`\n${colors.blue}[2] Checking execution permissions...${colors.reset}`);

const executableFiles = ['deploy.sh', 'start-deployment.js', 'start-prod.js'];
let allPermissionsCorrect = true;

for (const file of executableFiles) {
  try {
    const filePath = path.join(__dirname, file);
    const stats = fs.statSync(filePath);
    const isExecutable = !!(stats.mode & 0o111);
    
    if (isExecutable) {
      console.log(`  ${colors.green}✓ ${file}${colors.reset} has execution permissions`);
    } else {
      console.log(`  ${colors.yellow}⚠ ${file}${colors.reset} does not have execution permissions`);
      console.log(`    Running: chmod +x ${file}`);
      fs.chmodSync(filePath, stats.mode | 0o111);
      console.log(`  ${colors.green}✓ Permissions fixed for ${file}${colors.reset}`);
    }
  } catch (error) {
    console.log(`  ${colors.red}✗ Error checking permissions for ${file}: ${error.message}${colors.reset}`);
    allPermissionsCorrect = false;
  }
}

// Verify dependencies
console.log(`\n${colors.blue}[3] Checking critical dependencies...${colors.reset}`);

const requiredDependencies = ['tsx', 'ts-node', 'typescript'];
let allDependenciesPresent = true;

for (const dep of requiredDependencies) {
  try {
    const output = execSync(`npm list ${dep} --depth=0 2>/dev/null`).toString();
    if (output.includes(dep)) {
      console.log(`  ${colors.green}✓ ${dep}${colors.reset} is installed`);
    } else {
      console.log(`  ${colors.yellow}⚠ ${dep}${colors.reset} is not installed as a direct dependency`);
      allDependenciesPresent = false;
    }
  } catch (error) {
    console.log(`  ${colors.yellow}⚠ ${dep}${colors.reset} is not installed`);
    allDependenciesPresent = false;
  }
}

if (!allDependenciesPresent) {
  console.log(`  ${colors.yellow}⚠ Some dependencies might need to be installed during deployment.${colors.reset}`);
  console.log(`  ${colors.cyan}ℹ The start-deployment.js script will automatically install missing dependencies.${colors.reset}`);
}

// Show current configuration
console.log(`\n${colors.blue}[4] Current configuration...${colors.reset}`);

const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));

console.log(`  ${colors.cyan}Available scripts:${colors.reset}`);
console.log(`  - npm start: ${packageJson.scripts.start || 'Not defined'}`);
console.log(`  - npm run deploy: ${packageJson.scripts.deploy || 'Not defined'}`);
console.log(`  - npm run build: ${packageJson.scripts.build || 'Not defined'}`);

// Show deployment instructions
console.log(`\n${colors.blue}[5] Deployment instructions:${colors.reset}`);
console.log(`
  ${colors.magenta}Steps to deploy on Replit:${colors.reset}
  1. Click the "Deploy" button at the top of Replit
  2. When asked for a build command, LEAVE IT BLANK
  3. For the start command, type: ${colors.green}node start-deployment.js${colors.reset}
  4. Complete the deployment

  ${colors.magenta}To run locally:${colors.reset}
  - Option 1: ${colors.green}./deploy.sh${colors.reset}
  - Option 2: ${colors.green}node start-deployment.js${colors.reset}
  - Option 3: ${colors.green}node start-prod.js${colors.reset}
`);

// Final result
console.log(`\n${colors.blue}[6] Verification result:${colors.reset}`);

if (allFilesPresent && allPermissionsCorrect) {
  console.log(`
  ${colors.green}✅ VERIFICATION COMPLETE!${colors.reset}
  ${colors.cyan}The environment is ready for Boostify Music deployment.${colors.reset}
  ${colors.cyan}For more details, see:${colors.reset}
  - ${colors.yellow}DEPLOYMENT-STATIC.md${colors.reset} - English guide
  - ${colors.yellow}DEPLOYMENT-SOLUTION.md${colors.reset} - Technical documentation
  `);
} else {
  console.log(`
  ${colors.red}⚠️ INCOMPLETE VERIFICATION${colors.reset}
  ${colors.yellow}There are issues that need to be fixed before deployment.${colors.reset}
  ${colors.yellow}Review the messages above and fix the indicated problems.${colors.reset}
  `);
}

// Final message
console.log(`${colors.cyan}
╔══════════════════════════════════════════════════════════╗
║       VERIFICATION COMPLETED - BOOSTIFY MUSIC            ║
╚══════════════════════════════════════════════════════════╝${colors.reset}
`);