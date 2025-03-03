import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user, isLoading } = useAuth();
  const [initialCheck, setInitialCheck] = useState(false);
  
  // Esta verificación adicional permite esperar un poco más para asegurarnos
  // de que se complete la autenticación antes de redirigir
  useEffect(() => {
    if (!isLoading) {
      // Si la autenticación ha terminado de cargar, marcar como verificado
      const timeoutId = setTimeout(() => setInitialCheck(true), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [isLoading]);

  // Mostrar el indicador de carga mientras estamos cargando o durante la verificación inicial
  if (isLoading || !initialCheck) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mb-4" />
          <p className="text-orange-500">Verificando autenticación...</p>
        </div>
      </Route>
    );
  }

  // Redirigir solo después de la verificación completa
  if (!user) {
    console.log("Usuario no autenticado, redirigiendo a inicio");
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />
}