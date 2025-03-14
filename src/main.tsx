import React from "react";
import { createRoot } from "react-dom/client";
import App from "../client/src/App"; // Apuntamos a la versión completa de App
import "./index.css";
import { setupHMRErrorHandler } from "../client/src/utils/hmr-error-handler";

// Configurar el manejador de errores de HMR para prevenir el error
// "The user aborted a request" en el timeline
setupHMRErrorHandler();

// Reemplazamos el enrutador de hash y usamos el enfoque básico
// Esto evitará problemas de reactividad y carga infinita
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);