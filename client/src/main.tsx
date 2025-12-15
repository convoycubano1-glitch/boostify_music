import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./i18n/config";
import { setupHMRErrorHandler } from "./utils/hmr-error-handler";
import { ClerkProvider } from "@clerk/clerk-react";

// Clerk Publishable Key - loaded from env or fallback for development
const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || "pk_test_YWNlLW1hZ3BpZS0xOS5jbGVyay5hY2NvdW50cy5kZXYk";

// Configurar el manejador de errores de HMR
setupHMRErrorHandler();

// Reemplazamos el enrutador de hash y usamos el enfoque básico
// Esto evitará problemas de reactividad y carga infinita
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ClerkProvider publishableKey={PUBLISHABLE_KEY} afterSignOutUrl="/">
      <App />
    </ClerkProvider>
  </React.StrictMode>
);
