/**
 * Contexto para gestionar la información de suscripción del usuario
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useAuth } from '../../hooks/use-auth';
import { collection, doc, getDoc, onSnapshot, Firestore } from 'firebase/firestore';
import { db } from '../firebase';

// Definir tipos para el contexto
export interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  stripeCustomerId?: string;
  stripePriceId?: string;
  trialEndDate?: Date;
  createdAt: Date;
}

export interface SubscriptionContextType {
  subscription: Subscription | null;
  isLoading: boolean;
  error: string | null;
  currentPlan: string;
  refreshSubscription: () => Promise<void>;
}

// Crear contexto con valores por defecto
const SubscriptionContext = createContext<SubscriptionContextType>({
  subscription: null,
  isLoading: true,
  error: null,
  currentPlan: 'free',
  refreshSubscription: async () => {},
});

// Proveedor del contexto
export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Plan actual basado en la suscripción
  const currentPlan = subscription?.status === 'active' ? subscription.plan : 'free';
  
  // Efecto para cargar los datos de suscripción cuando el usuario cambia
  useEffect(() => {
    let unsubscribe: (() => void) | null = null;
    
    const loadSubscription = async () => {
      setIsLoading(true);
      setError(null);
      
      if (!user) {
        setSubscription(null);
        setIsLoading(false);
        return;
      }
      
      try {
        // Referencia a la colección de suscripciones
        const subsCollection = collection(db, 'subscriptions');
        const userSubDoc = doc(subsCollection, user.uid);
        
        // Configurar un listener para actualizaciones en tiempo real
        unsubscribe = onSnapshot(
          userSubDoc,
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              // Convertir timestamps a fechas
              const subData: Subscription = {
                id: docSnapshot.id,
                plan: data.plan || 'free',
                status: data.status || 'canceled',
                currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
                cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
                stripeCustomerId: data.stripeCustomerId,
                stripePriceId: data.stripePriceId,
                trialEndDate: data.trialEndDate?.toDate(),
                createdAt: data.createdAt?.toDate() || new Date(),
              };
              setSubscription(subData);
            } else {
              setSubscription(null);
            }
            setIsLoading(false);
          },
          (err) => {
            console.error('Error loading subscription data:', err);
            setError(err.message);
            setIsLoading(false);
          }
        );
      } catch (err: any) {
        console.error('Error setting up subscription listener:', err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    
    loadSubscription();
    
    // Limpiar al desmontar
    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);
  
  // Función para refrescar manualmente los datos de suscripción
  const refreshSubscription = async () => {
    if (!user) {
      setSubscription(null);
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const subsCollection = collection(db, 'subscriptions');
      const userSubDoc = doc(subsCollection, user.uid);
      const docSnapshot = await getDoc(userSubDoc);
      
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        const subData: Subscription = {
          id: docSnapshot.id,
          plan: data.plan || 'free',
          status: data.status || 'canceled',
          currentPeriodEnd: data.currentPeriodEnd?.toDate() || new Date(),
          cancelAtPeriodEnd: data.cancelAtPeriodEnd || false,
          stripeCustomerId: data.stripeCustomerId,
          stripePriceId: data.stripePriceId,
          trialEndDate: data.trialEndDate?.toDate(),
          createdAt: data.createdAt?.toDate() || new Date(),
        };
        setSubscription(subData);
      } else {
        setSubscription(null);
      }
    } catch (err: any) {
      console.error('Error refreshing subscription data:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Valor del contexto
  const value = {
    subscription,
    isLoading,
    error,
    currentPlan,
    refreshSubscription,
  };
  
  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Hook personalizado para usar el contexto
export function useSubscription() {
  return useContext(SubscriptionContext);
}