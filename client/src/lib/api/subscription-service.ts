import { apiRequest } from '@/lib/api/api-client';

// Define subscription plan types
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium';

// Define the subscription status response type
export interface SubscriptionStatus {
  active: boolean;
  plan: SubscriptionPlan;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  priceId: string | null;
}

/**
 * Get the current subscription status for a user
 * @param token Firebase auth token
 * @returns Subscription status
 */
export async function getSubscriptionStatus(token: string): Promise<SubscriptionStatus> {
  try {
    const response = await apiRequest<SubscriptionStatus>('/subscription-status', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    // Return free plan status on error
    return {
      active: false,
      plan: 'free',
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
      priceId: null
    };
  }
}

/**
 * Cancel the current subscription
 * @param token Firebase auth token
 * @returns Success message
 */
export async function cancelSubscription(token: string): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest<{ success: boolean; message: string }>('/cancel-subscription', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    return response;
  } catch (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }
}

/**
 * Update the current subscription to a new plan
 * @param token Firebase auth token
 * @param priceId The Stripe price ID for the new plan
 * @returns Success message
 */
export async function updateSubscription(
  token: string, 
  priceId: string
): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest<{ success: boolean; message: string }>('/update-subscription', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ priceId })
    });
    
    return response;
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }
}