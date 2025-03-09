import { apiRequest } from '@/lib/api/api-client';

/**
 * Create a new checkout session for a subscription
 * @param token Firebase auth token
 * @param priceId The Stripe price ID for the subscription plan
 * @returns URL to redirect to the checkout
 */
export async function createCheckoutSession(
  token: string,
  priceId: string
): Promise<{ url: string }> {
  try {
    const response = await apiRequest<{ url: string }>('/create-subscription', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ priceId })
    });
    
    return response;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw error;
  }
}

/**
 * Get publishable key for Stripe
 * @returns Stripe publishable key
 */
export async function getStripePublishableKey(): Promise<{ key: string }> {
  try {
    const response = await apiRequest<{ key: string }>('/stripe-publishable-key', {
      method: 'GET'
    });
    
    return response;
  } catch (error) {
    console.error('Error getting Stripe publishable key:', error);
    throw error;
  }
}

/**
 * Get available subscription plans and pricing information
 * @returns List of available plans with details
 */
export async function getSubscriptionPlans(): Promise<SubscriptionPlanDetails[]> {
  try {
    const response = await apiRequest<SubscriptionPlanDetails[]>('/subscription-plans', {
      method: 'GET'
    });
    
    return response;
  } catch (error) {
    console.error('Error getting subscription plans:', error);
    // Return default plans if API fails
    return getDefaultSubscriptionPlans();
  }
}

// Types
export interface SubscriptionPlanDetails {
  id: string;
  name: string;
  priceId: string;
  price: number;
  interval: 'month' | 'year';
  currency: string;
  features: string[];
  popular?: boolean;
  tier: 'free' | 'basic' | 'pro' | 'premium';
}

// Default subscription plans if the API call fails
function getDefaultSubscriptionPlans(): SubscriptionPlanDetails[] {
  return [
    {
      id: 'free-tier',
      name: 'Free',
      priceId: 'price_free',
      price: 0,
      interval: 'month',
      currency: 'USD',
      features: [
        'Basic music tools',
        'Limited AI content generation',
        'Community access',
        'Standard support'
      ],
      tier: 'free'
    },
    {
      id: 'basic-tier',
      name: 'Basic',
      priceId: 'price_basic_monthly',
      price: 59.99,
      interval: 'month',
      currency: 'USD',
      features: [
        'All free features',
        'Expanded AI content generation',
        'Analytics dashboard',
        'Priority support'
      ],
      tier: 'basic'
    },
    {
      id: 'pro-tier',
      name: 'Pro',
      priceId: 'price_pro_monthly',
      price: 99.99,
      interval: 'month',
      currency: 'USD',
      features: [
        'All basic features',
        'Advanced analytics',
        'Promotional tools',
        'Premium support',
        'AI-powered management tools'
      ],
      popular: true,
      tier: 'pro'
    },
    {
      id: 'premium-tier',
      name: 'Premium',
      priceId: 'price_premium_monthly',
      price: 149.99,
      interval: 'month',
      currency: 'USD',
      features: [
        'All pro features',
        'Unlimited AI generation',
        'Custom branding',
        'Dedicated account manager',
        'API access',
        'Advanced tools & features'
      ],
      tier: 'premium'
    }
  ];
}