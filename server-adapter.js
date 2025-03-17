
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Start server with proper TypeScript support
const server = spawn('node', ['--loader', 'ts-node/esm/transpile-only', '--experimental-specifier-resolution=node', 'server/index.ts'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    PORT: '5173',
    NODE_ENV: process.env.NODE_ENV || 'development',
    TS_NODE_PROJECT: './tsconfig.json'
  }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
