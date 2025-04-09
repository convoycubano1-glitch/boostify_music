import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Evitar detener la compilación por errores
    reportCompressedSize: false,
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      onwarn(warning, warn) {
        // Ignorar advertencias específicas
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          warning.code === 'CIRCULAR_DEPENDENCY' ||
          warning.message?.includes('use client')
        ) {
          return;
        }
        warn(warning);
      },
    },
  },
  optimizeDeps: {
    exclude: ['@mdx-js/react'],
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
  }
});