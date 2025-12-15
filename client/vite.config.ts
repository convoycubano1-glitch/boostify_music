import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
  envDir: path.resolve(__dirname, ".."), // Load .env from project root
  server: {
    port: 5000,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      "@db": path.resolve(__dirname, "..", "db"),
    },
  },
  build: {
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress PURE annotation warnings from ox and other libraries
        if (warning.code === 'PURE_ANNOTATION_COMMENT') {
          return;
        }
        // Suppress Rollup external ID warning
        if (warning.code === 'EXTERNAL_NO_INTEROP') {
          return;
        }
        warn(warning);
      },
    },
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
});
