import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración de Vite específica para producción
export default defineConfig({
  plugins: [react(), themePlugin()],
  resolve: {
    alias: {
      // Asegurar que todos los alias se resuelvan correctamente
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
      // Añadir alias específicos para subdirectorios para mayor precisión
      "@/components": path.resolve(__dirname, "client", "src", "components"),
      "@/lib": path.resolve(__dirname, "client", "src", "lib"),
      "@/hooks": path.resolve(__dirname, "client", "src", "hooks"),
      "@/pages": path.resolve(__dirname, "client", "src", "pages"),
      "@/services": path.resolve(__dirname, "client", "src", "services"),
      "@/utils": path.resolve(__dirname, "client", "src", "utils"),
      "@/context": path.resolve(__dirname, "client", "src", "context"),
      "@/images": path.resolve(__dirname, "client", "src", "images"),
      "@/styles": path.resolve(__dirname, "client", "src", "styles"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    sourcemap: true,
    // Configuración adicional para mejorar la compatibilidad
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      // Mejorar la resolución de importaciones
      input: {
        main: path.resolve(__dirname, "client/index.html"),
      },
      output: {
        // Asegurar que los nombres de chunk sean consistentes
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'wouter',
      '@tanstack/react-query'
    ],
    force: true
  },
});