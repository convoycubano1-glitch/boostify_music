import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import App from "./App"; 
import "./index.css";
import { setupHMRErrorHandler } from "./utils/hmr-error-handler";

// Configurar el manejador de errores de HMR para prevenir el error
// "The user aborted a request" en el timeline
setupHMRErrorHandler();

// Crear instancia de QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
      refetchOnWindowFocus: false,
    },
  },
});

// Renderizamos la aplicación con React Query
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);