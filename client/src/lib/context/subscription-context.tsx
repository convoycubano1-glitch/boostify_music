import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  SubscriptionPlan, 
  SubscriptionStatus, 
  getSubscriptionStatus,
  PLAN_HIERARCHY,
  canAccessFeature
} from '@/lib/api/subscription-service';
import { useAuth } from './auth-context';

/**
 * Interfaz para el usuario simplificado en el contexto de suscripción
 */
export interface SubscriptionUser {
  id?: string;
  email?: string;
  displayName?: string;
}

/**
 * Tipo para el contexto de suscripción
 */
export interface SubscriptionContextType {
  // Estado de suscripción
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  isError: boolean;
  
  // Información del usuario
  user: SubscriptionUser | null;
  
  // Acciones
  refreshSubscription: () => void;
  
  // Verificación de acceso
  hasAccess: (requiredPlan: SubscriptionPlan) => boolean;
}

// Crear el contexto
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: false,
  isError: false,
  user: null,
  refreshSubscription: () => {},
  hasAccess: () => false
});

/**
 * Props para el proveedor del contexto de suscripción
 */
interface SubscriptionProviderProps {
  children: ReactNode;
}

/**
 * Proveedor del contexto de suscripción
 * Maneja la lógica de subscripción y actualización de estado
 */
export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  // Obtener información del usuario del contexto de autenticación
  const { user: authUser, isLoading: authLoading } = useAuth();
  
  // Estado para almacenar usuario adaptado para este contexto
  const [user, setUser] = useState<SubscriptionUser | null>(null);
  
  // Consulta para obtener información de suscripción
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    isError,
    refetch: refreshSubscription
  } = useQuery({
    queryKey: ['subscription', authUser?.uid],
    queryFn: getSubscriptionStatus,
    enabled: !!authUser?.uid, // Solo consultar si hay un usuario autenticado
    staleTime: 5 * 60 * 1000, // 5 minutos
    refetchOnWindowFocus: true,
  });
  
  // Actualizar el usuario cuando cambie la autenticación
  useEffect(() => {
    if (!authLoading && authUser) {
      setUser({
        id: authUser.uid,
        email: authUser.email || undefined,
        displayName: authUser.displayName || undefined
      });
    } else {
      setUser(null);
    }
  }, [authUser, authLoading]);
  
  // Estado de carga combinado
  // Forzamos isLoading a false después de un tiempo para evitar bloqueos indefinidos
  const [forceLoaded, setForceLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 3000); // 3 segundos máximo de espera
    
    return () => clearTimeout(timer);
  }, []);
  
  const isLoading = !forceLoaded && (authLoading || (subscriptionLoading && !!authUser));
  
  /**
   * Verifica si el usuario tiene acceso a un plan específico
   * @param requiredPlan Plan requerido para acceder
   * @returns true si tiene acceso
   */
  const hasAccess = (requiredPlan: SubscriptionPlan): boolean => {
    // Si el usuario es el administrador, siempre tiene acceso
    if (user?.email === 'convoycubano@gmail.com') {
      return true;
    }
    
    // Si no hay suscripción, solo permitir acceso al plan gratuito
    if (!subscription) {
      return requiredPlan === 'free';
    }
    
    // Usar la utilidad canAccessFeature para verificar el acceso
    return canAccessFeature(subscription.currentPlan, requiredPlan);
  };
  
  // Valores para el contexto
  const value: SubscriptionContextType = {
    subscription: subscription || null,
    isLoading,
    isError,
    user,
    refreshSubscription,
    hasAccess
  };
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};

/**
 * Hook para acceder al contexto de suscripción
 */
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error('useSubscription debe utilizarse dentro de un SubscriptionProvider');
  }
  
  return context;
};

export default SubscriptionContext;