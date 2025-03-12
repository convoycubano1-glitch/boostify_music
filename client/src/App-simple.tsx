import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { EditorProvider } from "./lib/context/editor-context";
import ProfessionalEditorPage from "./pages/professional-editor";

/**
 * Versión simplificada de App.tsx para desarrollo
 * Solo incluye lo necesario para el editor profesional
 */
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <EditorProvider>
        <div className="min-h-screen bg-background text-foreground">
          <Switch>
            {/* Ruta única al editor profesional */}
            <Route path="/" component={ProfessionalEditorPage} />
          </Switch>
        </div>
        <Toaster />
      </EditorProvider>
    </QueryClientProvider>
  );
}