import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    themePlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      "@db": path.resolve(__dirname, "..", "db"),
    },
  },
  envDir: path.resolve(__dirname, ".."), // Load .env from project root
  server: {
    host: '0.0.0.0',
    port: 5000,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
    allowedHosts: [
      'ecb7959a-10a2-43c2-b3de-f9c2a2fb7282-00-5xhhuxyy3b9j.kirk.replit.dev',
      '.replit.dev',
      '.replit.app',
      'localhost',
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    minify: true,
    sourcemap: false,
  }
});