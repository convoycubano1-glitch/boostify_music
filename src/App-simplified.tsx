import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { SubscriptionProvider } from "./lib/context/subscription-context";
import { EditorProvider } from "./lib/context/editor-context";
import { ViteHMRErrorHandler } from "./components/improved-websocket-context";
import HomePage from "./pages/home";

/**
 * Versión simplificada del App para diagnóstico
 * Esta versión elimina toda la complejidad de enrutamiento y componentes adicionales
 */
const App = () => {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <ViteHMRErrorHandler />
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SubscriptionProvider>
            <EditorProvider>
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-3xl font-bold mb-6">Boostify Music - Versión Diagnóstico</h1>
                <p className="mb-4">Página simplificada para diagnóstico de errores.</p>
                <div className="p-4 border rounded bg-card">
                  <HomePage />
                </div>
              </div>
              <Toaster />
            </EditorProvider>
          </SubscriptionProvider>
        </AuthProvider>
      </QueryClientProvider>
    </div>
  );
};

export default App;