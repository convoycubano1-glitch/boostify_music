
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start server with proper ESM support
const server = spawn('node', ['--loader', 'ts-node/esm', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '5173', // Match the port configuration
    NODE_ENV: process.env.NODE_ENV || 'development'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
