
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuración optimizada para producción
export default defineConfig({
  plugins: [react(), themePlugin()],
  resolve: {
    alias: {
      "@db": path.resolve(__dirname, "db"),
      "@": path.resolve(__dirname, "client", "src"),
      "@/components": path.resolve(__dirname, "client", "src", "components"),
      "@/lib": path.resolve(__dirname, "client", "src", "lib"),
      "@/hooks": path.resolve(__dirname, "client", "src", "hooks"),
      "@/pages": path.resolve(__dirname, "client", "src", "pages"),
      "@/styles": path.resolve(__dirname, "client", "src", "styles"),
    },
  },
  root: path.resolve(__dirname, "client"),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    force: true
  },
});
  