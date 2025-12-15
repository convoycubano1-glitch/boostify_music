import { useAuth } from "../hooks/use-auth";
import { Route } from "wouter";

/**
 * ProtectedRoute - SIMPLIFICADO para no bloquear
 * Siempre renderiza el componente inmediatamente
 * Muestra banner si no hay usuario autenticado
 */
export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: React.ComponentType<any>;
}) {
  const { user } = useAuth();

  // Si hay usuario, renderizar directamente
  if (user) {
    return <Route path={path} component={Component} />;
  }

  // Si no hay usuario, mostrar componente con banner de login
  const WrappedComponent = (props: any) => (
    <div className="relative">
      <div className="sticky top-0 z-50 w-full p-3 bg-gradient-to-r from-blue-500 to-blue-700 text-white text-center">
        <p className="text-sm font-medium">
          Inicia sesión para acceder a todas las funcionalidades. 
          <a href="/auth" className="ml-2 underline font-bold">Iniciar sesión</a>
        </p>
      </div>
      <Component {...props} />
    </div>
  );

  return <Route path={path} component={WrappedComponent} />;
}