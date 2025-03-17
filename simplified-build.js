// Simplified build script for Replit environment
// This script skips type checking to speed up the build process

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('\n\x1b[35m=== SIMPLIFIED BUILD FOR PRODUCTION ===\n');

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

// Step 2: Create production Vite config
console.log('\n\x1b[33mStep 2: Creating production Vite config...');
try {
  const viteConfigContent = `
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'firebase'],
          ui: [
            '@radix-ui/react-dialog',
            '@radix-ui/react-popover',
            '@radix-ui/react-toast',
            'lucide-react'
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

  fs.writeFileSync('vite.config.prod.js', viteConfigContent);
  console.log('\x1b[32m✓ Production Vite config created');
} catch (error) {
  console.error('\x1b[31m✗ Failed to create Vite config:', error);
  process.exit(1);
}

// Step 3: Create simple server script
console.log('\n\x1b[33mStep 3: Creating server script...');
try {
  const serverScript = `
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Serve static files from the 'dist' directory
app.use(express.static(path.join(__dirname, 'dist')));

// For all GET requests, send back index.html to let client-side routing handle it
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(\`Server running on port \${PORT}\`);
});
`;

  fs.writeFileSync('server-prod.js', serverScript);
  console.log('\x1b[32m✓ Server script created');
} catch (error) {
  console.error('\x1b[31m✗ Failed to create server script:', error);
  process.exit(1);
}

// Step 4: Ensure Firebase compatibility
console.log('\n\x1b[33mStep 4: Fixing Firebase module resolution issues...');
try {
  // Create a temporary copy of firebase with explicit exports
  const firebasePatchContent = `
// Firebase module patch to resolve ESM/CJS issues
import * as firebaseOriginal from 'firebase/app';
import * as authOriginal from 'firebase/auth';
import * as firestoreOriginal from 'firebase/firestore';
import * as storageOriginal from 'firebase/storage';
import * as analyticsOriginal from 'firebase/analytics';

// Re-export with explicit named exports
export const initializeApp = firebaseOriginal.initializeApp;
export const getApp = firebaseOriginal.getApp;
export const getApps = firebaseOriginal.getApps;
export const deleteApp = firebaseOriginal.deleteApp;

// Auth exports
export const getAuth = authOriginal.getAuth;
export const signInWithEmailAndPassword = authOriginal.signInWithEmailAndPassword;
export const createUserWithEmailAndPassword = authOriginal.createUserWithEmailAndPassword;
export const signOut = authOriginal.signOut;
export const onAuthStateChanged = authOriginal.onAuthStateChanged;

// Firestore exports
export const getFirestore = firestoreOriginal.getFirestore;
export const collection = firestoreOriginal.collection;
export const doc = firestoreOriginal.doc;
export const getDoc = firestoreOriginal.getDoc;
export const getDocs = firestoreOriginal.getDocs;
export const setDoc = firestoreOriginal.setDoc;
export const updateDoc = firestoreOriginal.updateDoc;
export const deleteDoc = firestoreOriginal.deleteDoc;
export const addDoc = firestoreOriginal.addDoc;
export const query = firestoreOriginal.query;
export const where = firestoreOriginal.where;
export const orderBy = firestoreOriginal.orderBy;
export const limit = firestoreOriginal.limit;

// Storage exports
export const getStorage = storageOriginal.getStorage;
export const ref = storageOriginal.ref;
export const uploadBytes = storageOriginal.uploadBytes;
export const getDownloadURL = storageOriginal.getDownloadURL;
export const deleteObject = storageOriginal.deleteObject;

// Analytics exports
export const getAnalytics = analyticsOriginal.getAnalytics;
export const logEvent = analyticsOriginal.logEvent;

// Default export for compatibility
export default firebaseOriginal;
`;

  fs.writeFileSync('src/firebase-patched.js', firebasePatchContent);
  
  // Update all firebase imports in src directory
  console.log('\x1b[34m> Updating Firebase imports in project files\x1b[0m');
  
  // Create a simple fix script
  const fixScript = `
import fs from 'fs';
import path from 'path';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      processDirectory(filePath);
    } else if (/\\.(tsx?|jsx?)$/.test(file)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace firebase imports with our patched version
      if (content.includes("from 'firebase") || content.includes('from "firebase')) {
        content = content.replace(/from ['"]firebase\/app['"]/g, "from '../firebase-patched.js'");
        content = content.replace(/from ['"]firebase\/auth['"]/g, "from '../firebase-patched.js'");
        content = content.replace(/from ['"]firebase\/firestore['"]/g, "from '../firebase-patched.js'");
        content = content.replace(/from ['"]firebase\/storage['"]/g, "from '../firebase-patched.js'");
        content = content.replace(/from ['"]firebase\/analytics['"]/g, "from '../firebase-patched.js'");
        
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}

// Only process the src directory to avoid modifying node_modules
processDirectory('src');
console.log('Firebase imports patched successfully');
`;

  fs.writeFileSync('fix-firebase.js', fixScript);
  execSync('node fix-firebase.js', { stdio: 'inherit' });
  
  console.log('\x1b[32m✓ Firebase compatibility issues fixed');
} catch (error) {
  console.error('\x1b[31m✗ Failed to fix Firebase compatibility:', error);
  console.log('\x1b[33m> Continuing with build without Firebase fix...');
}

// Step 5: Build frontend
console.log('\n\x1b[33mStep 5: Building frontend (skipping type checks)...');
try {
  console.log('\x1b[34m> npx vite build --config vite.config.prod.js\x1b[0m');
  execSync('npx vite build --config vite.config.prod.js', { stdio: 'inherit' });
  console.log('\x1b[32m✓ Frontend built successfully');
} catch (error) {
  console.error('\x1b[31m✗ Frontend build failed:', error);
  process.exit(1);
}

// Step 5: Create start script
console.log('\n\x1b[33mStep 5: Creating production start script...');
try {
  const startScript = `
#!/bin/bash
node server-prod.js
`;

  fs.writeFileSync('start-prod.sh', startScript);
  fs.chmodSync('start-prod.sh', '755'); // Make executable
  console.log('\x1b[32m✓ Start script created');
} catch (error) {
  console.error('\x1b[31m✗ Failed to create start script:', error);
  process.exit(1);
}

console.log('\n\x1b[32m✅ Build completed successfully!');
console.log('\x1b[33mTo start the production server, run: ./start-prod.sh\x1b[0m\n');