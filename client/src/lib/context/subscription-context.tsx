import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  SubscriptionPlan, 
  SubscriptionStatus, 
  getSubscriptionStatus 
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
}

// Crear el contexto
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: false,
  isError: false,
  user: null,
  refreshSubscription: () => {}
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
  const isLoading = authLoading || (subscriptionLoading && !!authUser);
  
  // Valores para el contexto
  const value: SubscriptionContextType = {
    subscription: subscription || null,
    isLoading,
    isError,
    user,
    refreshSubscription
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