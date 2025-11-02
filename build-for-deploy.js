import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = promisify(exec);

async function build() {
  console.log('🚀 Starting production build...');

  try {
    // Clean dist directory
    console.log('📦 Cleaning dist directory...');
    try {
      await fs.rm('dist', { recursive: true, force: true });
    } catch (err) {
      // Ignore if directory doesn't exist
    }
    await fs.mkdir('dist', { recursive: true });
    await fs.mkdir('dist/server', { recursive: true });

    // Build client with Vite
    console.log('⚛️  Building client with Vite...');
    const { stdout: viteOutput, stderr: viteError } = await execPromise('cd client && npx vite build');
    if (viteOutput) console.log(viteOutput);
    if (viteError) console.error(viteError);

    // Copy client build to dist
    console.log('📋 Copying client build to dist...');
    await fs.cp('client/dist', 'dist/client', { recursive: true });

    // Build server with esbuild
    console.log('🔨 Building server with esbuild...');
    const { stdout: serverOutput, stderr: serverError } = await execPromise(
      'npx esbuild server/index.ts --bundle --platform=node --packages=external --outfile=dist/server/index.js --format=esm --sourcemap'
    );
    if (serverOutput) console.log(serverOutput);
    if (serverError) console.error(serverError);

    // Copy server/vite.ts separately (not bundled)
    console.log('📋 Copying additional server files...');
    try {
      await fs.copyFile('server/vite.ts', 'dist/server/vite.js');
    } catch (err) {
      console.log('Note: server/vite.ts not needed in production');
    }

    console.log('✅ Build completed successfully!');
    console.log('📁 Output directory: dist/');
    console.log('   - dist/client/ - Frontend static files');
    console.log('   - dist/server/index.js - Backend server');
    console.log('🚀 Ready for deployment!');

  } catch (error) {
    console.error('❌ Build failed:', error.message);
    if (error.stdout) console.error('stdout:', error.stdout);
    if (error.stderr) console.error('stderr:', error.stderr);
    process.exit(1);
  }
}

build();
