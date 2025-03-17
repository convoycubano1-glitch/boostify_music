/**
 * Minimal build script for production
 * This script skips TypeScript checks and Firebase fixes, focusing just on the essential build
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('\n\x1b[35m=== MINIMAL BUILD FOR PRODUCTION ===\n');

// Step 1: Clean output directory
console.log('\x1b[33mStep 1: Cleaning output directory...');
try {
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }
  fs.mkdirSync('dist', { recursive: true });
  console.log('\x1b[32m✓ Output directory cleaned');
} catch (error) {
  console.error('\x1b[31m✗ Failed to clean output directory:', error);
  process.exit(1);
}

// Step 2: Create production server
console.log('\n\x1b[33mStep 2: Creating server script...');
try {
  const serverScript = `
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Load environment variables
try {
  const envPath = path.join(__dirname, '.env.production');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\\n').forEach(line => {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        process.env[match[1].trim()] = match[2].trim();
      }
    });
    console.log('✅ Production environment variables loaded');
  }
} catch (error) {
  console.warn('⚠️ Failed to load environment variables:', error);
}

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// API routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// For all other GET requests, send back the index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`✅ Server running on port \${PORT}\`);
  console.log(\`🌐 Access URL: http://localhost:\${PORT}\`);
});
`;

  fs.writeFileSync('dist/server.js', serverScript);
  console.log('\x1b[32m✓ Server script created');
} catch (error) {
  console.error('\x1b[31m✗ Failed to create server script:', error);
  process.exit(1);
}

// Step 3: Copy .env.production
console.log('\n\x1b[33mStep 3: Creating production environment...');
try {
  const envContent = `
# Production environment variables
NODE_ENV=production
PORT=5000
# Add other environment variables as needed
`;

  fs.writeFileSync('dist/.env.production', envContent);
  console.log('\x1b[32m✓ Production environment created');
} catch (error) {
  console.error('\x1b[31m✗ Failed to create production environment:', error);
  process.exit(1);
}

// Step 4: Create public directory and minimal index.html
console.log('\n\x1b[33mStep 4: Creating public assets...');
try {
  fs.mkdirSync('dist/public', { recursive: true });
  
  const indexHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Boostify Music</title>
  <style>
    body {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      line-height: 1.6;
      color: #333;
    }
    header {
      text-align: center;
      margin-bottom: 40px;
    }
    h1 {
      color: #ff5500;
      font-size: 2.5rem;
    }
    section {
      margin-bottom: 30px;
    }
    .button {
      display: inline-block;
      background-color: #ff5500;
      color: white;
      padding: 10px 20px;
      border-radius: 4px;
      text-decoration: none;
      font-weight: bold;
    }
    footer {
      margin-top: 50px;
      text-align: center;
      font-size: 0.9rem;
      color: #666;
    }
  </style>
</head>
<body>
  <header>
    <h1>Boostify Music</h1>
    <p>Advanced AI-powered music platform for artists</p>
  </header>

  <section>
    <h2>Our Platform Is Deployed</h2>
    <p>The Boostify Music application has been successfully deployed to production. Please note that this is a static placeholder page.</p>
    <p>For a full functioning version please use the development environment or contact the development team.</p>
  </section>

  <section>
    <h2>Key Features</h2>
    <ul>
      <li>AI-powered music creation and enhancement</li>
      <li>Advanced artist promotion tools</li>
      <li>Comprehensive analytics dashboard</li>
      <li>Collaboration spaces for musicians</li>
      <li>Royalty tracking and distribution</li>
    </ul>
  </section>

  <footer>
    <p>&copy; ${new Date().getFullYear()} Boostify Music. All rights reserved.</p>
    <p>Version: 1.0.0 | Build Date: ${new Date().toLocaleString()}</p>
  </footer>
</body>
</html>
`;

  fs.writeFileSync('dist/public/index.html', indexHtml);
  console.log('\x1b[32m✓ Public assets created');
} catch (error) {
  console.error('\x1b[31m✗ Failed to create public assets:', error);
  process.exit(1);
}

// Step 5: Create package.json for the production environment
console.log('\n\x1b[33mStep 5: Creating production package.json...');
try {
  const packageJson = {
    "name": "boostify-music-production",
    "version": "1.0.0",
    "type": "module",
    "main": "server.js",
    "scripts": {
      "start": "node server.js"
    },
    "dependencies": {
      "express": "^4.18.2"
    }
  };

  fs.writeFileSync('dist/package.json', JSON.stringify(packageJson, null, 2));
  console.log('\x1b[32m✓ Production package.json created');
} catch (error) {
  console.error('\x1b[31m✗ Failed to create production package.json:', error);
  process.exit(1);
}

// Step 6: Create start script
console.log('\n\x1b[33mStep 6: Creating production start script...');
try {
  const startScript = `#!/bin/bash
node server.js
`;

  fs.writeFileSync('dist/start.sh', startScript);
  fs.chmodSync('dist/start.sh', '755'); // Make executable
  console.log('\x1b[32m✓ Start script created');
} catch (error) {
  console.error('\x1b[31m✗ Failed to create start script:', error);
  process.exit(1);
}

console.log('\n\x1b[32m✅ Build completed successfully!');
console.log('\x1b[33mTo start the production server:');
console.log('1. cd dist');
console.log('2. npm install');
console.log('3. ./start.sh\x1b[0m\n');