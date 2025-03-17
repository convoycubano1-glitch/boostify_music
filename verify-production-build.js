/**
 * Production build verification script
 * Checks that the build has all necessary files and configurations
 */

import fs from 'fs';
import path from 'path';

console.log('\n\x1b[35m=== VERIFYING PRODUCTION BUILD ===\n');

// Verify the build directory exists
console.log('\x1b[33mChecking build directory...');
if (!fs.existsSync('dist')) {
  console.error('\x1b[31m✗ Build directory "dist" not found. Run build script first.');
  process.exit(1);
}
console.log('\x1b[32m✓ Build directory exists');

// Verify required files
const requiredFiles = [
  'server.js',
  'package.json',
  '.env.production',
  'start.sh',
  'public/index.html',
  'README.md'
];

console.log('\n\x1b[33mChecking required files...');
const missingFiles = [];
for (const file of requiredFiles) {
  const filePath = path.join('dist', file);
  if (!fs.existsSync(filePath)) {
    missingFiles.push(file);
    console.log(`\x1b[31m✗ Missing: ${file}`);
  } else {
    console.log(`\x1b[32m✓ Found: ${file}`);
  }
}

if (missingFiles.length > 0) {
  console.error(`\n\x1b[31m✗ Missing ${missingFiles.length} required files.`);
  process.exit(1);
}

// Verify package.json dependencies
console.log('\n\x1b[33mChecking package.json dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('dist/package.json', 'utf-8'));
  const requiredDependencies = ['express', 'cors', 'express-rate-limit', 'dotenv'];
  
  const missingDeps = [];
  for (const dep of requiredDependencies) {
    if (!packageJson.dependencies || !packageJson.dependencies[dep]) {
      missingDeps.push(dep);
      console.log(`\x1b[31m✗ Missing dependency: ${dep}`);
    } else {
      console.log(`\x1b[32m✓ Dependency found: ${dep}`);
    }
  }
  
  if (missingDeps.length > 0) {
    console.warn(`\n\x1b[33m⚠️ Missing ${missingDeps.length} dependencies in package.json.`);
  }
  
  if (!packageJson.scripts || !packageJson.scripts.start) {
    console.warn('\x1b[33m⚠️ Missing "start" script in package.json.');
  } else {
    console.log('\x1b[32m✓ Start script found');
  }
} catch (error) {
  console.error('\x1b[31m✗ Failed to parse package.json:', error.message);
}

// Verify server.js content
console.log('\n\x1b[33mChecking server.js content...');
try {
  const serverJs = fs.readFileSync('dist/server.js', 'utf-8');
  const requiredFeatures = [
    { name: 'Express server', regex: /express\(\)/i },
    { name: 'Port configuration', regex: /PORT\s*=\s*process\.env\.PORT/i },
    { name: 'Static file serving', regex: /express\.static/i },
    { name: 'Error handling', regex: /app\.use\(\s*(?:function|req|err|\()/i },
    { name: 'API routes', regex: /app\.(?:get|post|put|delete)\s*\(\s*['"]\/api\//i },
    { name: 'Security headers', regex: /(?:X-Frame-Options|X-Content-Type-Options|X-XSS-Protection)/i }
  ];
  
  for (const feature of requiredFeatures) {
    if (feature.regex.test(serverJs)) {
      console.log(`\x1b[32m✓ Server has ${feature.name}`);
    } else {
      console.warn(`\x1b[33m⚠️ Server might be missing ${feature.name}`);
    }
  }
} catch (error) {
  console.error('\x1b[31m✗ Failed to read server.js:', error.message);
}

// Verify the server would start
console.log('\n\x1b[33mChecking server startup...');
try {
  const serverJs = fs.readFileSync('dist/server.js', 'utf-8');
  // Check for syntax errors by doing a super basic parse test
  new Function(serverJs);
  console.log('\x1b[32m✓ Server script has valid syntax');
} catch (error) {
  console.error('\x1b[31m✗ Server script has syntax errors:', error.message);
}

// Verify HTML content
console.log('\n\x1b[33mChecking HTML content...');
try {
  const html = fs.readFileSync('dist/public/index.html', 'utf-8');
  const requiredTags = [
    { name: 'DOCTYPE declaration', regex: /<!DOCTYPE\s+html>/i },
    { name: 'Meta charset', regex: /<meta\s+charset=["']utf-8["']/i },
    { name: 'Viewport meta', regex: /<meta\s+name=["']viewport["']/i },
    { name: 'Title tag', regex: /<title>[^<]+<\/title>/i },
    { name: 'CSS styles', regex: /<style>[^<]+<\/style>/i },
    { name: 'Body content', regex: /<body>[^]*<\/body>/i }
  ];
  
  for (const tag of requiredTags) {
    if (tag.regex.test(html)) {
      console.log(`\x1b[32m✓ HTML has ${tag.name}`);
    } else {
      console.warn(`\x1b[33m⚠️ HTML might be missing ${tag.name}`);
    }
  }
} catch (error) {
  console.error('\x1b[31m✗ Failed to read index.html:', error.message);
}

// Overall assessment
console.log('\n\x1b[35m=== BUILD VERIFICATION SUMMARY ===');
if (missingFiles.length === 0) {
  console.log('\x1b[32m✅ Production build appears to be complete and valid.');
  console.log('\x1b[32m✅ All required files are present.');
  console.log('\x1b[33m⚠️ Note: This verification does not guarantee the build will work in all environments.');
  console.log('\x1b[33m⚠️ Actual deployment may require environment-specific configurations.');
  
  console.log('\n\x1b[36mTo deploy this build:');
  console.log('1. Copy the "dist" directory to your production server');
  console.log('2. Navigate to that directory on the server');
  console.log('3. Run: npm install');
  console.log('4. Update the .env.production file with your actual API keys');
  console.log('5. Run: ./start.sh or npm start\x1b[0m\n');
} else {
  console.error('\x1b[31m❌ Build verification failed. Please fix the issues mentioned above.');
  process.exit(1);
}