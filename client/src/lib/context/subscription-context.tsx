/**
 * Contexto para gestionar la información de suscripción del usuario
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { logger } from "../logger";
import { useAuth } from '../../hooks/use-auth';
import { db } from '../firebase';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';

// Tipos de planes disponibles
export type PlanType = 'free' | 'basic' | 'pro' | 'premium';

// Interfaz para los datos de suscripción
export interface Subscription {
  id: string;                 // ID de la suscripción
  userId: string;             // ID del usuario
  plan: PlanType;             // Tipo de plan
  status: 'active' | 'canceled' | 'past_due'; // Estado
  currentPeriodStart: Date;   // Inicio del período actual
  currentPeriodEnd: Date;     // Fin del período actual
  cancelAtPeriodEnd: boolean; // Si se cancelará al final del período
  stripeCustomerId?: string;  // ID de cliente en Stripe
  stripeSubscriptionId?: string; // ID de suscripción en Stripe
  createdAt: Date;            // Fecha de creación
  updatedAt: Date;            // Fecha de última actualización
}

// Interfaz para el contexto de suscripción
interface SubscriptionContextType {
  subscription: Subscription | null;
  currentPlan: PlanType;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  hasAccess: (requiredPlan: PlanType) => boolean;
}

// Crear contexto
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  currentPlan: 'free',
  isLoading: true,
  error: null,
  refreshSubscription: async () => {},
  hasAccess: () => false, // Por defecto, sin acceso
});

/**
 * Proveedor de contexto de suscripción
 */
export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Calcular plan actual basado en el estado de la suscripción
  const currentPlan: PlanType = subscription?.status === 'active' 
    ? subscription.plan 
    : 'free';
  
  // Cargar datos de suscripción cuando cambia el usuario
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const loadSubscription = async () => {
      // Si no hay usuario, vaciar la suscripción
      if (!user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // ADMIN tiene acceso premium automático
        if (user.email === 'convoycubano@gmail.com') {
          setSubscription({
            id: 'admin',
            userId: String(user.id),
            plan: 'premium',
            status: 'active',
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
            cancelAtPeriodEnd: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
          setIsLoading(false);
          return;
        }
        
        // Verificar si existe una suscripción activa para el usuario
        const subscriptionsRef = collection(db, 'subscriptions');
        
        // Usar user.id en lugar de user.uid (Replit Auth usa id, no uid)
        const userId = String(user.id); // Convertir a string para Firestore
        
        // Obtener la primera suscripción activa del usuario
        // En caso real, se usaría una consulta más precisa con Firestore
        const subscriptionDoc = await getDoc(doc(db, 'user_subscriptions', userId));
        
        if (subscriptionDoc.exists()) {
          // Obtener la suscripción activa
          const subscriptionId = subscriptionDoc.data().activeSubscriptionId;
          
          if (subscriptionId) {
            // Configurar listener para actualizaciones en tiempo real
            unsubscribe = onSnapshot(
              doc(db, 'subscriptions', subscriptionId),
              (docSnapshot) => {
                if (docSnapshot.exists()) {
                  const data = docSnapshot.data();
                  
                  setSubscription({
                    id: docSnapshot.id,
                    userId: data.userId,
                    plan: data.plan || 'free',
                    status: data.status || 'active',
                    currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
                    currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
                    cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
                    stripeCustomerId: data.stripeCustomerId,
                    stripeSubscriptionId: data.stripeSubscriptionId,
                    createdAt: data.createdAt?.toDate() || new Date(),
                    updatedAt: data.updatedAt?.toDate() || new Date(),
                  });
                } else {
                  // No hay suscripción activa
                  setSubscription(null);
                }
                
                setIsLoading(false);
              },
              (err) => {
                logger.error('Error al suscribirse a actualizaciones de suscripción:', err);
                setError('Error al cargar datos de suscripción');
                setIsLoading(false);
              }
            );
          } else {
            // No hay suscripción activa
            setSubscription(null);
            setIsLoading(false);
          }
        } else {
          // No hay documento de suscripción para el usuario
          setSubscription(null);
          setIsLoading(false);
        }
      } catch (err: any) {
        logger.error('Error al cargar suscripción:', err);
        setError(err.message || 'Error al cargar datos de suscripción');
        setIsLoading(false);
      }
    };
    
    loadSubscription();
    
    // Limpiar listener al desmontar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);
  
  /**
   * Recargar datos de suscripción bajo demanda
   */
  const refreshSubscription = async (): Promise<void> => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Obtener la suscripción activa del usuario
      const subscriptionDoc = await getDoc(doc(db, 'user_subscriptions', user.uid));
      
      if (subscriptionDoc.exists()) {
        const subscriptionId = subscriptionDoc.data().activeSubscriptionId;
        
        if (subscriptionId) {
          const subscriptionData = await getDoc(doc(db, 'subscriptions', subscriptionId));
          
          if (subscriptionData.exists()) {
            const data = subscriptionData.data();
            
            setSubscription({
              id: subscriptionData.id,
              userId: data.userId,
              plan: data.plan || 'free',
              status: data.status || 'active',
              currentPeriodStart: data.currentPeriodStart?.toDate() || new Date(),
              currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
              cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
              stripeCustomerId: data.stripeCustomerId,
              stripeSubscriptionId: data.stripeSubscriptionId,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            });
          } else {
            setSubscription(null);
          }
        } else {
          setSubscription(null);
        }
      } else {
        setSubscription(null);
      }
    } catch (err: any) {
      logger.error('Error al recargar suscripción:', err);
      setError(err.message || 'Error al recargar datos de suscripción');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Verifica si el plan actual tiene acceso al plan requerido
   * @param requiredPlan Plan requerido para acceder a cierta funcionalidad
   * @returns true si el plan actual permite acceso, false en caso contrario
   */
  const hasAccess = (requiredPlan: PlanType): boolean => {
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
  };

  const value = {
    subscription,
    currentPlan,
    isLoading,
    error,
    refreshSubscription,
    hasAccess,
  };
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

/**
 * Hook para utilizar el contexto de suscripción
 */
export function useSubscription(): SubscriptionContextType {
  const context = useContext(SubscriptionContext);
  
  if (context === undefined) {
    throw new Error('useSubscription debe ser usado dentro de un SubscriptionProvider');
  }
  
  return context;
}