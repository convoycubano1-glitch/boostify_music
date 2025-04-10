import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App-simplified"; // Usamos la versión simplificada para diagnóstico
import "./index.css";
import { setupHMRErrorHandler } from "./utils/hmr-error-handler";

// Configurar el manejador de errores de HMR para prevenir el error
// "The user aborted a request" en el timeline
setupHMRErrorHandler();

// Log para identificar la carga correcta del punto de entrada
console.log("main.tsx ejecutándose - usando App simplificado para diagnóstico");

// Renderizamos la aplicación en el elemento root
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
