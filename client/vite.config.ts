import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  plugins: [react()],
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
