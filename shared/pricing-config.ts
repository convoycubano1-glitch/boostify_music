/**
 * Configuración centralizada de planes de suscripción
 * 
 * SINGLE SOURCE OF TRUTH para todos los planes, precios y features
 * Actualizado: Noviembre 2025
 */

export type PlanTier = 'free' | 'creator' | 'professional' | 'enterprise';

export interface PlanConfig {
  key: PlanTier;
  displayName: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
    yearlyEquivalentMonthly: number;
  };
  stripeIds: {
    monthly: string;
    yearly: string;
  };
  features: {
    name: string;
    included: boolean;
  }[];
  popular?: boolean;
  highlight?: string;
}

/**
 * TODO: Actualizar con los Price IDs anuales reales de Stripe
 * Ver STRIPE_PRICE_IDS_GUIDE.md para instrucciones
 */
export const SUBSCRIPTION_PLANS: Record<PlanTier, PlanConfig> = {
  free: {
    key: 'free',
    displayName: 'Free',
    description: 'Explore the basics',
    highlight: 'Try it free',
    price: {
      monthly: 0,
      yearly: 0,
      yearlyEquivalentMonthly: 0
    },
    stripeIds: {
      monthly: '',
      yearly: ''
    },
    features: [
      { name: 'Profile (Basic)', included: true },
      { name: 'Contacts (Limited)', included: true },
      { name: 'Education Hub (View only)', included: true },
      { name: 'Boostify TV (Limited access)', included: true },
      { name: 'Community forum access', included: true },
      { name: 'Music Generator', included: false },
      { name: 'Music Videos', included: false },
      { name: 'AI Agents', included: false },
      { name: 'Artist Image', included: false },
      { name: 'Analytics', included: false },
      { name: 'Merchandise', included: false },
      { name: 'Social Media Boost', included: false }
    ]
  },
  
  creator: {
    key: 'creator',
    displayName: 'Creator',
    description: 'For emerging artists',
    highlight: 'Most popular',
    popular: true,
    price: {
      monthly: 59.99,
      yearly: 604.00, // 16% discount
      yearlyEquivalentMonthly: 50.33
    },
    stripeIds: {
      monthly: 'price_1R0lay2LyFplWimfQxUL6Hn0',
      yearly: 'price_PENDING_CREATOR_YEARLY' // TODO: Reemplazar con Price ID real de Stripe
    },
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Profile (Complete)', included: true },
      { name: 'Contacts (Full access)', included: true },
      { name: 'Music Generator (Basic)', included: true },
      { name: 'Music Videos (Standard)', included: true },
      { name: 'AI Agents (Basic)', included: true },
      { name: 'Artist Image (Basic)', included: true },
      { name: 'Analytics (Basic)', included: true },
      { name: 'Merchandise (Basic)', included: true },
      { name: 'Education Hub (Full access)', included: true },
      { name: 'YouTube Boost', included: false },
      { name: 'Instagram Boost', included: false },
      { name: 'Spotify Boost', included: false }
    ]
  },
  
  professional: {
    key: 'professional',
    displayName: 'Professional',
    description: 'For serious creators',
    highlight: 'Best value',
    price: {
      monthly: 99.99,
      yearly: 1007.00, // 16% discount
      yearlyEquivalentMonthly: 83.92
    },
    stripeIds: {
      monthly: 'price_1R0laz2LyFplWimfsBd5ASoa',
      yearly: 'price_PENDING_PROFESSIONAL_YEARLY' // TODO: Reemplazar con Price ID real de Stripe
    },
    features: [
      { name: 'Everything in Creator', included: true },
      { name: 'Music Generator (Advanced)', included: true },
      { name: 'Music Videos (Pro)', included: true },
      { name: 'AI Agents (Advanced)', included: true },
      { name: 'Artist Image (Pro)', included: true },
      { name: 'Analytics (Advanced)', included: true },
      { name: 'Merchandise (Pro)', included: true },
      { name: 'YouTube Boost (50/month)', included: true },
      { name: 'Instagram Boost (50/month)', included: true },
      { name: 'Spotify Boost (30/month)', included: true },
      { name: 'Email Campaigns (5/month)', included: true },
      { name: 'Priority Support', included: true }
    ]
  },
  
  enterprise: {
    key: 'enterprise',
    displayName: 'Enterprise',
    description: 'For established artists',
    highlight: 'Maximum power',
    price: {
      monthly: 149.99,
      yearly: 1511.00, // 16% discount
      yearlyEquivalentMonthly: 125.92
    },
    stripeIds: {
      monthly: 'price_1R0lb12LyFplWimf7JpMynKA',
      yearly: 'price_PENDING_ENTERPRISE_YEARLY' // TODO: Reemplazar con Price ID real de Stripe
    },
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'Music Generator (Unlimited)', included: true },
      { name: 'Music Videos (Premium)', included: true },
      { name: 'AI Agents (Unlimited)', included: true },
      { name: 'Artist Image (Premium)', included: true },
      { name: 'Analytics (Full)', included: true },
      { name: 'Merchandise (Premium)', included: true },
      { name: 'YouTube Boost (Unlimited)', included: true },
      { name: 'Instagram Boost (Unlimited)', included: true },
      { name: 'Spotify Boost (Unlimited)', included: true },
      { name: 'Email Campaigns (Unlimited)', included: true },
      { name: 'SMS Campaigns (20/month)', included: true },
      { name: 'Dedicated Account Manager', included: true },
      { name: 'Custom Integrations', included: true },
      { name: '24/7 Premium Support', included: true }
    ]
  }
};

/**
 * Helper para obtener configuración de un plan
 */
export function getPlanConfig(tier: PlanTier): PlanConfig {
  return SUBSCRIPTION_PLANS[tier];
}

/**
 * Helper para verificar si un usuario tiene acceso a una feature
 */
export function hasFeatureAccess(currentTier: PlanTier, requiredTier: PlanTier): boolean {
  const tierHierarchy: PlanTier[] = ['free', 'creator', 'professional', 'enterprise'];
  const currentIndex = tierHierarchy.indexOf(currentTier);
  const requiredIndex = tierHierarchy.indexOf(requiredTier);
  
  return currentIndex >= requiredIndex;
}

/**
 * Helper para obtener Price ID de Stripe basado en plan e intervalo
 */
export function getStripePriceId(tier: PlanTier, interval: 'monthly' | 'yearly'): string {
  const plan = SUBSCRIPTION_PLANS[tier];
  return plan.stripeIds[interval];
}

/**
 * Helper para calcular ahorro anual
 */
export function getYearlySavings(tier: PlanTier): number {
  const plan = SUBSCRIPTION_PLANS[tier];
  const monthlyTotal = plan.price.monthly * 12;
  const yearlyPrice = plan.price.yearly;
  return monthlyTotal - yearlyPrice;
}

/**
 * Helper para obtener porcentaje de descuento anual
 */
export function getYearlyDiscountPercentage(tier: PlanTier): number {
  const plan = SUBSCRIPTION_PLANS[tier];
  if (plan.price.yearly === 0) return 0;
  
  const monthlyTotal = plan.price.monthly * 12;
  const yearlyPrice = plan.price.yearly;
  const savings = monthlyTotal - yearlyPrice;
  
  return Math.round((savings / monthlyTotal) * 100);
}
