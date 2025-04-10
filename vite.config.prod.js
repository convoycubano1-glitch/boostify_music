import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Esta configuración es idéntica a la de desarrollo
// pero optimizada para producción
export default defineConfig({
  plugins: [react(), themePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client', 'src'),
      "@db": path.resolve(__dirname, "db"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    // No minimizar para mantener el código más cercano al desarrollo
    minify: process.env.NO_MINIFY ? false : 'terser',
    // Asegurar que los source maps estén disponibles
    sourcemap: true,
    // Configurar correctamente el directorio de salida
    outDir: process.env.VITE_OUT_DIR || "../dist/public",
    // Permitir sobrescribir
    emptyOutDir: true,
    // Preservar la estructura de módulos para mantener coherencia con desarrollo
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-tabs',
            '@radix-ui/react-avatar',
            '@radix-ui/react-select',
          ],
          'utils-vendor': ['axios', 'zustand', '@tanstack/react-query'],
        },
        // Preservar la estructura de rutas
        preserveModules: false,
      },
    },
    // No eliminar console.logs para preservar el comportamiento de desarrollo
    terserOptions: {
      compress: {
        drop_console: false,
        drop_debugger: false,
      },
    },
  },
});