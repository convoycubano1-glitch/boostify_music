
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Production environment setup
console.log('Starting application in production mode...');

// Set proper port binding for production
process.env.PORT = process.env.PORT || 5173;
process.env.NODE_ENV = 'production';

// Start the server from the compiled output
const server = spawn('node', ['dist/server/index.js'], {
  stdio: 'inherit',
  env: { ...process.env }
});

server.on('error', (err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.kill('SIGTERM');
  process.exit(0);
});
