import { useAuth } from "@/hooks/use-auth";
import { useSubscription } from "@/lib/context/subscription-context";
import { SubscriptionPlan } from "@/lib/api/subscription-service";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import React from "react";

interface SubscriptionProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requiredPlan: SubscriptionPlan;
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
  const { isLoading: subscriptionLoading, hasAccess } = useSubscription();
  
  const isLoading = authLoading || subscriptionLoading;

  // Muestra un spinner mientras se cargan los datos
  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-border" />
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
    // Redirige a la página de precios si no tiene la suscripción adecuada
    return (
      <Route path={path}>
        <Redirect to="/pricing?requiredPlan=true" />
      </Route>
    );
  }

  // Si pasa todas las verificaciones, renderiza el componente
  return <Route path={path} component={Component} />;
}