import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { EditorProvider } from "./lib/context/editor-context";
import { AuthProvider } from "./hooks/use-auth";
import ProfessionalEditorPage from "./pages/professional-editor";
import HomePage from "./pages/home";

/**
 * Versión simplificada de App.tsx para desarrollo
 * Incluye rutas básicas para facilitar la navegación
 */
export default function App() {
  // Función simple para envolver componentes
  const withPageWrapper = (Component: React.ComponentType<any>) => {
    return (props: any) => (
      <div className="pb-20">
        <Component {...props} />
      </div>
    );
  };

  // Aplicar el envoltorio a todas las páginas
  const WrappedHomePage = withPageWrapper(HomePage);

  // Aplicar el envoltorio a la página de edición profesional
  const WrappedProfessionalEditorPage = withPageWrapper(ProfessionalEditorPage);
  
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EditorProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Switch>
              {/* Solo la página principal por ahora */}
              <Route path="/" component={WrappedHomePage} />
              <Route path="/home" component={WrappedHomePage} />
              <Route path="/professional-editor" component={WrappedProfessionalEditorPage} />
            </Switch>
          </div>
          <Toaster />
        </EditorProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}