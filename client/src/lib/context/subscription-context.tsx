import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  SubscriptionPlan, 
  SubscriptionStatus, 
  getSubscriptionStatus,
  PLAN_HIERARCHY,
  canAccessFeature
} from '../api/subscription-service';
import { useAuth } from '../../hooks/use-auth';

/**
 * Interface for the simplified user in the subscription context
 */
export interface SubscriptionUser {
  id?: string;
  email?: string;
  displayName?: string;
}

/**
 * Type for the subscription context
 */
export interface SubscriptionContextType {
  // Subscription state
  subscription: SubscriptionStatus | null;
  isLoading: boolean;
  isError: boolean;
  
  // User information
  user: SubscriptionUser | null;
  
  // Actions
  refreshSubscription: () => void;
  
  // Access verification
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
 * Props for the subscription context provider
 */
interface SubscriptionProviderProps {
  children: ReactNode;
}

/**
 * Subscription context provider
 * Handles subscription logic and state updates
 */
export const SubscriptionProvider = ({ children }: SubscriptionProviderProps) => {
  // Get user information from authentication context
  const { user: authUser, isLoading: authLoading } = useAuth();
  
  // State to store user adapted for this context
  const [user, setUser] = useState<SubscriptionUser | null>(null);
  
  // Query to get subscription information
  const {
    data: subscription,
    isLoading: subscriptionLoading,
    isError,
    refetch: refreshSubscription
  } = useQuery({
    queryKey: ['subscription', authUser?.uid],
    queryFn: getSubscriptionStatus,
    enabled: !!authUser?.uid, // Only query if there is an authenticated user
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: true,
  });
  
  // Update user when authentication changes
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
  
  // Combined loading state
  // Force isLoading to false after a time to avoid indefinite loading
  const [forceLoaded, setForceLoaded] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setForceLoaded(true);
    }, 3000); // 3 seconds maximum wait
    
    return () => clearTimeout(timer);
  }, []);
  
  const isLoading = !forceLoaded && (authLoading || (subscriptionLoading && !!authUser));
  
  /**
   * Checks if the user has access to a specific plan
   * @param requiredPlan Plan required for access
   * @returns true if the user has access
   */
  const hasAccess = (requiredPlan: SubscriptionPlan): boolean => {
    // If the user is an administrator, always grant access
    if (user?.email === 'convoycubano@gmail.com') {
      return true;
    }
    
    // If no subscription exists, only allow access to the free plan
    if (!subscription) {
      return requiredPlan === 'free';
    }
    
    // Use the canAccessFeature utility to verify access
    return canAccessFeature(subscription.currentPlan, requiredPlan);
  };
  
  // Values for the context
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
 * Hook to access the subscription context
 */
export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
};

export default SubscriptionContext;