import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { getSubscriptionStatus, SubscriptionPlan, SubscriptionStatus } from '@/lib/api/subscription-service';
import { getAuth } from 'firebase/auth';

interface SubscriptionContextType {
  subscription: SubscriptionStatus;
  isLoading: boolean;
  error: string | null;
  refreshSubscription: () => Promise<void>;
  hasAccess: (requiredPlan: SubscriptionPlan) => boolean;
}

// Create the context with default values
const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

// Define the plans hierarchy for access control
const planHierarchy: Record<SubscriptionPlan, number> = {
  'free': 0,
  'basic': 1,
  'pro': 2,
  'premium': 3
};

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionStatus>({
    active: false,
    plan: 'free',
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    priceId: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const auth = getAuth();

  // Function to fetch subscription status
  const fetchSubscription = async () => {
    if (!user) {
      setSubscription({
        active: false,
        plan: 'free',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null
      });
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Get the current user's ID token
      const token = await user.getIdToken();
      
      // Fetch subscription status from the server
      const status = await getSubscriptionStatus(token);
      
      setSubscription(status);
    } catch (err) {
      console.error('Error fetching subscription:', err);
      setError('Failed to fetch subscription status. Please try again later.');
      
      // Set to free plan on error
      setSubscription({
        active: false,
        plan: 'free',
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        priceId: null
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to check if user has access to a specific plan
  const hasAccess = (requiredPlan: SubscriptionPlan): boolean => {
    // El administrador siempre tiene acceso completo
    if (user?.email === 'convoycubano@gmail.com') {
      return true;
    }
    
    if (!subscription.active && requiredPlan !== 'free') {
      return false;
    }
    
    const userPlanLevel = planHierarchy[subscription.plan];
    const requiredPlanLevel = planHierarchy[requiredPlan];
    
    return userPlanLevel >= requiredPlanLevel;
  };

  // Fetch subscription when user changes
  useEffect(() => {
    if (!authLoading) {
      fetchSubscription();
    }
  }, [user, authLoading]);

  // Provide context value
  const value: SubscriptionContextType = {
    subscription,
    isLoading,
    error,
    refreshSubscription: fetchSubscription,
    hasAccess
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
}

// Custom hook to use the subscription context
export function useSubscription() {
  const context = useContext(SubscriptionContext);
  
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  
  return context;
}