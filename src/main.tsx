import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App"; // Importante: Usamos la versión completa de App.tsx
import "./index.css";
import { setupHMRErrorHandler } from "./utils/hmr-error-handler";

// Configurar el manejador de errores de HMR para prevenir el error
// "The user aborted a request" en el timeline
setupHMRErrorHandler();

// Renderizamos la aplicación en el elemento root
// La página home.tsx será accesible a través de la ruta "/"
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
