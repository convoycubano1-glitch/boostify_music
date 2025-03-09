import React from 'react';
import { useLocation } from 'wouter';
import { useSubscriptionFeature } from '@/hooks/use-subscription-feature';
import { SubscriptionPlan } from '@/lib/api/subscription-service';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertTriangle, Lock, ArrowRight } from 'lucide-react';

// Propiedades del componente de control de características por suscripción
export interface SubscriptionFeatureProps {
  // Plan mínimo requerido para acceder a esta característica
  requiredPlan: SubscriptionPlan;
  // Contenido a mostrar si el usuario tiene acceso
  children: React.ReactNode;
  // Opcional: título de la función (para mostrar en la vista bloqueada)
  title?: string;
  // Opcional: descripción de la función (para mostrar en la vista bloqueada)
  description?: string;
  // Opcional: si se debe mostrar una vista previa de la característica
  preview?: boolean;
  // Opcional: si se debe mostrar silenciosamente (sin UI de actualización)
  silent?: boolean;
  // Opcional: lista de emails de administradores que siempre tienen acceso
  adminEmails?: string[];
  // Opcional: URL de redirección alternativa
  redirectUrl?: string;
}

/**
 * Componente para restringir características basadas en el plan de suscripción del usuario
 * 
 * Controla el acceso a características específicas de la aplicación basado en
 * el nivel de suscripción del usuario. Si el usuario no tiene el plan requerido,
 * muestra un mensaje de bloqueo con opción de actualizar.
 */
export function SubscriptionFeature({
  requiredPlan,
  children,
  title,
  description,
  preview = false,
  silent = false,
  adminEmails = ['convoycubano@gmail.com'], // El administrador siempre tiene acceso
  redirectUrl
}: SubscriptionFeatureProps) {
  const [, setLocation] = useLocation();
  const {
    hasAccess,
    isLoading,
    upgradeUrl
  } = useSubscriptionFeature(requiredPlan, { adminEmails });
  
  // Función para navegar a otra ruta
  const navigate = (to: string) => setLocation(to);

  // Si está cargando, mostrar un estado de carga
  if (isLoading) {
    return silent ? null : (
      <div className="flex items-center justify-center p-6 min-h-[100px] animate-pulse">
        <div className="h-6 w-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Si el usuario tiene acceso, mostrar el contenido normalmente
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si es silencioso, no mostrar ningún UI de actualización
  if (silent) {
    return null;
  }

  // Si es una vista previa, mostrar el contenido con una capa de bloqueo encima
  if (preview) {
    return (
      <div className="relative overflow-hidden rounded-lg">
        {/* Contenido borroso */}
        <div className="filter blur-sm pointer-events-none">
          {children}
        </div>
        
        {/* Capa de bloqueo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-black/70 text-white">
          <Lock className="h-12 w-12 mb-4 text-yellow-400" />
          <h3 className="text-xl font-bold mb-2">
            {title || `Característica del plan ${requiredPlan.toUpperCase()}`}
          </h3>
          {description && <p className="mb-4 text-white/80">{description}</p>}
          <Button
            onClick={() => navigate(redirectUrl || '/pricing')}
            className="mt-2"
          >
            Mejorar a {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  // Vista bloqueada estándar (no preview, no silent)
  return (
    <Card className="p-6 flex flex-col items-center text-center">
      <AlertTriangle className="h-12 w-12 mb-4 text-amber-500" />
      <h3 className="text-xl font-bold mb-2">
        {title || `Característica disponible en el plan ${requiredPlan}`}
      </h3>
      {description && <p className="mb-4 text-muted-foreground">{description}</p>}
      <Button
        onClick={() => navigate(redirectUrl || '/pricing')}
        className="mt-2"
      >
        Actualizar a {requiredPlan.charAt(0).toUpperCase() + requiredPlan.slice(1)}
        <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Card>
  );
}

export default SubscriptionFeature;