import { useAuth } from "../hooks/use-auth";
import { useSubscription } from "./context/subscription-context";
import { SubscriptionPlan } from "./api/subscription-service";
import { Route } from "wouter";
import React from "react";

interface SubscriptionProtectedRouteProps {
  path: string;
  component: React.ComponentType<any>;
  requiredPlan: SubscriptionPlan;
}

/**
 * SubscriptionProtectedRoute - SIMPLIFICADO para no bloquear
 * Siempre renderiza el componente, muestra banner si no tiene acceso
 */
export function SubscriptionProtectedRoute({
  path,
  component: Component,
  requiredPlan
}: SubscriptionProtectedRouteProps) {
  const { user } = useAuth();
  const { hasAccess } = useSubscription();

  // Si el usuario es el administrador, permitir acceso sin verificar suscripción
  const isAdmin = user?.email === 'convoycubano@gmail.com';
  
  // Si es admin o tiene acceso, renderizar directamente
  if (isAdmin || hasAccess(requiredPlan)) {
    return <Route path={path} component={Component} />;
  }

  // Si no tiene acceso, mostrar componente con banner de advertencia
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