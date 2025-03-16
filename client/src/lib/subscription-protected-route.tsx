import { useAuth } from "../hooks/use-auth";
import { useSubscription, PlanType } from "./context/subscription-context";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React from "react";

interface SubscriptionProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requiredPlan: PlanType; // Cambiado a PlanType para ser consistente con el contexto
}

/**
 * SubscriptionProtectedRoute verifica tanto la autenticación como el nivel de suscripción
 * del usuario antes de permitir el acceso a una ruta.
 * 
 * @param path - La ruta a proteger
 * @param component - El componente a renderizar si se permite el acceso
 * @param requiredPlan - El plan de suscripción mínimo requerido ('free', 'basic', 'pro', 'premium')
 */
export function SubscriptionProtectedRoute({
  path,
  component: Component,
  requiredPlan
}: SubscriptionProtectedRouteProps) {
  const { user, isLoading: authLoading } = useAuth();
  const { isLoading: subscriptionLoading, currentPlan } = useSubscription();
  
  const isLoading = authLoading || subscriptionLoading;

  // Verificar acceso según jerarquía de planes
  const hasAccess = React.useCallback((requiredPlan: PlanType): boolean => {
    // Jerarquía de planes por nivel de acceso
    const planLevels: Record<PlanType, number> = {
      'free': 0,
      'basic': 1,
      'pro': 2,
      'premium': 3
    };

    // Obtener nivel del plan actual y el plan requerido
    const currentLevel = planLevels[currentPlan];
    const requiredLevel = planLevels[requiredPlan];

    // Verificar si el nivel actual es >= al nivel requerido
    return currentLevel >= requiredLevel;
  }, [currentPlan]);

  // Muestra un spinner mientras se cargan los datos pero solo por tiempo limitado
  const [showTimeoutError, setShowTimeoutError] = React.useState(false);
  
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (isLoading) {
        setShowTimeoutError(true);
      }
    }, 5000); // 5 segundos máximo de espera
    
    return () => clearTimeout(timer);
  }, [isLoading]);
  
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border mb-4" />
          
          {showTimeoutError && (
            <div className="text-center max-w-md p-4">
              <p className="text-lg font-medium mb-2">La carga está tardando más de lo esperado</p>
              <p className="text-sm text-muted-foreground mb-4">
                Estamos teniendo dificultades para verificar tu suscripción. 
                Te mostraremos la página pero algunas funciones podrían estar limitadas.
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded bg-primary text-primary-foreground text-sm font-medium"
              >
                Intentar de nuevo
              </button>
            </div>
          )}
        </div>
      </Route>
    );
  }

  // Redirige al login si no hay usuario autenticado
  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }

  // Si el usuario es el administrador, permitir acceso sin verificar suscripción
  if (user.email === 'convoycubano@gmail.com') {
    return <Route path={path} component={Component} />;
  }

  // Verifica el nivel de suscripción
  if (!hasAccess(requiredPlan)) {
    // Renderiza el componente pero con un banner indicando suscripción requerida
    // en lugar de redirigir completamente
    const WrappedComponent = (props: any) => (
      <div className="relative">
        <div className="sticky top-0 z-50 w-full p-2 bg-gradient-to-r from-orange-500 to-orange-700 text-white text-center">
          <p className="text-sm font-medium">
            Esta funcionalidad requiere suscripción {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)} o superior. 
            <a href="/pricing" className="ml-2 underline font-bold">Ver planes</a>
          </p>
        </div>
        <Component {...props} />
      </div>
    );

    return <Route path={path} component={WrappedComponent} />;
  }

  // Si pasa todas las verificaciones, renderiza el componente
  return <Route path={path} component={Component} />;
}