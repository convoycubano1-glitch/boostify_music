import React from 'react';
import { useLocation } from 'wouter';
import { useSubscription } from '@/lib/context/subscription-context';
import { SubscriptionPlan } from '@/lib/api/subscription-service';
import { useToast } from '@/hooks/use-toast';

interface SubscriptionLinkProps {
  href: string;
  children: React.ReactNode;
  requiredPlan?: SubscriptionPlan;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
}

/**
 * Componente simplificado que maneja la validación de suscripción
 * y la navegación condicionada por nivel de acceso
 */
export function SubscriptionLink({
  href,
  children,
  requiredPlan,
  className = "cursor-pointer",
  onClick
}: SubscriptionLinkProps) {
  const { hasAccess } = useSubscription();
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  // Determinar plan requerido según la ruta
  const getPlanForRoute = (route: string): SubscriptionPlan | null => {
    // Rutas premium
    if (
      route.startsWith('/music-video-creator') ||
      route.startsWith('/record-label-services') ||
      route.startsWith('/ai-agents')
    ) {
      return 'premium';
    }
    
    // Rutas pro
    if (
      route.startsWith('/music-generator') ||
      route.startsWith('/artist-image-advisor') ||
      route.startsWith('/analytics') ||
      route.startsWith('/instagram-boost') ||
      route.startsWith('/youtube-views') ||
      route.startsWith('/merchandise')
    ) {
      return 'pro';
    }
    
    // Rutas basic
    if (
      route.startsWith('/spotify') ||
      route.startsWith('/education') ||
      route.startsWith('/contracts')
    ) {
      return 'basic';
    }
    
    // Rutas sin requisito de suscripción
    return null;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Ejecutar onClick personalizado si existe
    if (onClick) {
      onClick(e);
    }
    
    // Determinar plan requerido
    const routePlan = requiredPlan || getPlanForRoute(href);
    
    // Si no requiere suscripción o el usuario tiene acceso, permitir la navegación
    if (!routePlan || hasAccess(routePlan)) {
      setLocation(href);
      return;
    }
    
    // Prevenir navegación por defecto
    e.preventDefault();
    
    // Mostrar mensaje para actualizar suscripción
    toast({
      title: `Se requiere plan ${routePlan.charAt(0).toUpperCase() + routePlan.slice(1)}`,
      description: "Actualiza tu suscripción para acceder a esta característica.",
      variant: "warning",
      action: (
        <button 
          className="bg-primary text-white px-3 py-1 rounded-md"
          onClick={() => setLocation('/pricing')}
        >
          Ver planes
        </button>
      )
    });
  };
  
  return (
    <span className={className} onClick={handleClick}>
      {children}
    </span>
  );
}