import React from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import { EditorProvider } from "./lib/context/editor-context";
import { AuthProvider } from "./hooks/use-auth";
import ProfessionalEditorPage from "./pages/professional-editor";
import HomePage from "./pages/home";
import DashboardPage from "./pages/dashboard";
import SettingsPage from "./pages/settings";
import PricingPage from "./pages/pricing";
import AccountPage from "./pages/account";
import ArtistDashboardPage from "./pages/artist-dashboard";
import MusicGeneratorPage from "./pages/music-generator";
import ImageGeneratorPage from "./pages/image-generator-simple";
import EducationPage from "./pages/education";
import NotFoundPage from "./pages/not-found";

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
  const WrappedProfessionalEditorPage = withPageWrapper(ProfessionalEditorPage);
  const WrappedDashboardPage = withPageWrapper(DashboardPage);
  const WrappedSettingsPage = withPageWrapper(SettingsPage);
  const WrappedPricingPage = withPageWrapper(PricingPage);
  const WrappedAccountPage = withPageWrapper(AccountPage);
  const WrappedArtistDashboardPage = withPageWrapper(ArtistDashboardPage);
  const WrappedMusicGeneratorPage = withPageWrapper(MusicGeneratorPage);
  const WrappedImageGeneratorPage = withPageWrapper(ImageGeneratorPage);
  const WrappedEducationPage = withPageWrapper(EducationPage);
  const WrappedNotFoundPage = withPageWrapper(NotFoundPage);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <EditorProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Switch>
              {/* Páginas principales */}
              <Route path="/" component={WrappedHomePage} />
              <Route path="/home" component={WrappedHomePage} />
              <Route path="/dashboard" component={WrappedDashboardPage} />
              
              {/* Herramientas creativas */}
              <Route path="/professional-editor" component={WrappedProfessionalEditorPage} />
              <Route path="/artist-dashboard" component={WrappedArtistDashboardPage} />
              <Route path="/music-generator" component={WrappedMusicGeneratorPage} />
              <Route path="/image-generator" component={WrappedImageGeneratorPage} />
              
              {/* Páginas de usuario */}
              <Route path="/account" component={WrappedAccountPage} />
              <Route path="/settings" component={WrappedSettingsPage} />
              <Route path="/pricing" component={WrappedPricingPage} />
              
              {/* Educación */}
              <Route path="/education" component={WrappedEducationPage} />
              
              {/* Página 404 para rutas no encontradas */}
              <Route component={WrappedNotFoundPage} />
            </Switch>
          </div>
          <Toaster />
        </EditorProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}