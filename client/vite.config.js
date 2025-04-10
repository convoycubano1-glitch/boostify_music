// Configuración temporal para permitir todos los hosts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import themePlugin from "@replit/vite-plugin-shadcn-theme-json";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react(), runtimeErrorOverlay(), themePlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      "@db": path.resolve(__dirname, "..", "db"),
    },
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: 'all',
    port: 5173,
    hmr: {
      host: 'localhost',
    },
  },
});