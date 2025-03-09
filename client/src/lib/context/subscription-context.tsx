import React, { createContext, useContext, useEffect, useState } from 'react';
import { SubscriptionInfo, SubscriptionPlan, getSubscriptionStatus, hasPlanAccess } from '@/lib/api/subscription-service';
import { useAuth } from '@/hooks/use-auth';

export interface SubscriptionContextType {
  isLoading: boolean;
  subscription: SubscriptionInfo | null;
  error: string | null;
  hasAccess: (requiredPlan: SubscriptionPlan) => boolean;
  refreshSubscription: () => Promise<void>;
  currentPlan: SubscriptionPlan;
  status: string;
}

const defaultSubscription: SubscriptionInfo = {
  status: 'active',
  currentPlan: 'free'
};

const SubscriptionContext = createContext<SubscriptionContextType>({
  isLoading: true,
  subscription: defaultSubscription,
  error: null,
  hasAccess: () => false,
  refreshSubscription: async () => {},
  currentPlan: 'free',
  status: 'active'
});

export const useSubscription = () => useContext(SubscriptionContext);

export const SubscriptionProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { user, isLoading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(defaultSubscription);
  const [error, setError] = useState<string | null>(null);

  // Función para validar si el usuario tiene acceso al nivel requerido
  const checkAccess = (requiredPlan: SubscriptionPlan): boolean => {
    // Si no hay usuario, no hay acceso
    if (!user) return false;
    
    // El usuario con email convoycubano@gmail.com siempre tiene acceso (admin)
    if (user.email === 'convoycubano@gmail.com') return true;
    
    // Si no hay subscripción, solo tiene acceso a 'free'
    if (!subscription) return requiredPlan === 'free';
    
    // Verifica si el plan actual del usuario cumple o supera el nivel requerido
    return hasPlanAccess(subscription.currentPlan, requiredPlan);
  };

  // Función para refrescar la información de suscripción
  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(defaultSubscription);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await getSubscriptionStatus();
      if (response.success && response.subscription) {
        setSubscription(response.subscription);
        setError(null);
      } else {
        // Si hay un error en la respuesta pero está autenticado, asignar plan free
        setSubscription(defaultSubscription);
        setError(response.message || 'Error retrieving subscription data');
      }
    } catch (err) {
      console.error('Error fetching subscription:', err);
      // Si hay un error en la petición pero está autenticado, asignar plan free por defecto
      setSubscription(defaultSubscription);
      setError('Error connecting to subscription service');
    } finally {
      setIsLoading(false);
    }
  };

  // Carga inicial de datos
  useEffect(() => {
    if (!authLoading) {
      refreshSubscription();
    }
  }, [user, authLoading]);

  const value: SubscriptionContextType = {
    isLoading,
    subscription,
    error,
    hasAccess: checkAccess,
    refreshSubscription,
    currentPlan: subscription?.currentPlan || 'free',
    status: subscription?.status || 'inactive'
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};