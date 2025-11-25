import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/use-auth';
import { useSubscription } from './context/subscription-context';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../components/ui/dialog';
import { Button } from '../components/ui/button';
import { Loader2, Lock, Crown } from 'lucide-react';

interface GlobalAuthGuardProps {
  children: React.ReactNode;
}

// Rutas públicas que no requieren autenticación
const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/login',
  '/signup',
  '/register',
  '/dashboard', // Temporal para debugging auth
  '/pricing',
  '/features',
  '/privacy',
  '/terms',
  '/cookies',
  '/resources',
  '/tips',
  '/guides',
  '/tools',
  '/blog',
  '/artist',
  '/investors',
  '/youtube-views',
];

/**
 * GlobalAuthGuard verifica que el usuario esté autenticado y tenga un plan activo
 * antes de permitir acceso a cualquier funcionalidad de la aplicación.
 * 
 * Reglas:
 * - convoycubano@gmail.com = ADMIN (acceso completo sin restricciones)
 * - Usuario no autenticado = redirigir a login
 * - Usuario autenticado sin plan = mostrar modal de subscripciones
 * - Usuario con plan 'free' o superior = acceso permitido
 */
export function GlobalAuthGuard({ children }: GlobalAuthGuardProps) {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const { currentPlan, isLoading: subscriptionLoading } = useSubscription();
  const [location] = useLocation();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);

  const isLoading = authLoading || subscriptionLoading;
  const isPublicRoute = PUBLIC_ROUTES.some(route => 
    location === route || location.startsWith(route + '/')
  );

  // Verificar si es admin
  const isAdmin = user?.email === 'convoycubano@gmail.com';

  useEffect(() => {
    // No hacer nada si aún está cargando o es ruta pública
    if (isLoading || isPublicRoute) {
      return;
    }

    // Si es admin, permitir acceso completo
    if (isAdmin) {
      setShowAuthModal(false);
      setShowSubscriptionModal(false);
      return;
    }

    // Si no está autenticado, mostrar modal de login
    if (!isAuthenticated) {
      setShowAuthModal(true);
      setShowSubscriptionModal(false);
      return;
    }

    // Si está autenticado pero no tiene plan, mostrar modal de subscripción
    if (isAuthenticated && !currentPlan) {
      setShowAuthModal(false);
      setShowSubscriptionModal(true);
      return;
    }

    // Si tiene plan (incluido 'free'), permitir acceso
    if (currentPlan) {
      setShowAuthModal(false);
      setShowSubscriptionModal(false);
    }
  }, [isLoading, isAuthenticated, currentPlan, isPublicRoute, isAdmin]);

  // Mostrar loading mientras se verifica
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  // Rutas públicas siempre se muestran
  if (isPublicRoute) {
    return <>{children}</>;
  }

  // Admin tiene acceso completo
  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      {children}

      {/* Modal de Subscripción */}
      <Dialog open={showSubscriptionModal} onOpenChange={setShowSubscriptionModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-orange-500" />
              Plan Requerido
            </DialogTitle>
            <DialogDescription>
              Para acceder a las funcionalidades de Boostify, necesitas seleccionar un plan.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Tenemos un plan gratuito que te permite explorar nuestras funcionalidades básicas, 
              o puedes elegir un plan premium para acceso completo.
            </p>
            
            <div className="bg-muted/50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">Plan Gratuito</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>✓ Acceso a funcionalidades básicas</li>
                <li>✓ Generación de imágenes limitada</li>
                <li>✓ Soporte por correo</li>
              </ul>
            </div>
            
            <div className="flex flex-col gap-3">
              <Button 
                onClick={() => window.location.href = '/pricing'}
                className="w-full"
                data-testid="button-view-plans"
              >
                Ver Planes y Seleccionar
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => window.location.href = '/'}
                className="w-full"
                data-testid="button-back-home-2"
              >
                Volver al Inicio
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
