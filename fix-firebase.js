
import fs from 'fs';
import path from 'path';

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stats = fs.statSync(filePath);
    
    if (stats.isDirectory()) {
      processDirectory(filePath);
    } else if (/\.(tsx?|jsx?)$/.test(file)) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Replace firebase imports with our patched version
      if (content.includes("from 'firebase") || content.includes('from "firebase')) {
        content = content.replace(/from ["']firebase/app["']/g, "from '../firebase-patched.js'");
        content = content.replace(/from ["']firebase/auth["']/g, "from '../firebase-patched.js'");
        content = content.replace(/from ["']firebase/firestore["']/g, "from '../firebase-patched.js'");
        content = content.replace(/from ["']firebase/storage["']/g, "from '../firebase-patched.js'");
        content = content.replace(/from ["']firebase/analytics["']/g, "from '../firebase-patched.js'");
        
        fs.writeFileSync(filePath, content, 'utf8');
      }
    }
  }
}

// Only process the src directory to avoid modifying node_modules
processDirectory('src');
console.log('Firebase imports patched successfully');
