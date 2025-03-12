
#!/usr/bin/env node

/**
 * Deployment configuration validator
 * This script checks if the deployment settings are properly configured
 */

console.log('🔍 Checking deployment configuration...');

// Check package.json for build and start scripts
try {
  const packageJson = require('../package.json');
  const scripts = packageJson.scripts || {};
  
  if (!scripts.build) {
    console.error('❌ Missing "build" script in package.json');
  } else {
    console.log('✅ Build script found:', scripts.build);
  }
  
  if (!scripts.start) {
    console.error('❌ Missing "start" script in package.json');
  } else {
    console.log('✅ Start script found:', scripts.start);
  }
} catch (error) {
  console.error('❌ Error checking package.json:', error.message);
}

// Check for startup.sh with correct permissions
const fs = require('fs');
try {
  const stats = fs.statSync('./startup.sh');
  const isExecutable = !!(stats.mode & 0o111);
  
  if (!isExecutable) {
    console.error('❌ startup.sh is not executable. Run: chmod +x startup.sh');
  } else {
    console.log('✅ startup.sh is executable');
  }
} catch (error) {
  console.error('❌ startup.sh not found or not accessible');
}

console.log('\n📋 Deployment checklist:');
console.log('1. Set NODE_ENV=production in your deployment environment');
console.log('2. Configure all required secrets in the Deployment Secrets panel');
console.log('3. Make sure you have run "npm run build" at least once locally to test the build');
console.log('4. Ensure your server listens on the port provided by PORT environment variable');

console.log('\n🚀 Run the following command to test your production build locally:');
console.log('NODE_ENV=production npm run build && chmod +x startup.sh && ./startup.sh');
