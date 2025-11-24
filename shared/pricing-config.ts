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
 * ✅ Price IDs actualizados - Noviembre 19, 2025
 * Incluye precios mensuales y anuales (16% descuento en anuales)
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
      { name: 'Social Network (Basic)', included: true },
      { name: 'Store Access', included: true },
      { name: 'Education Hub (View)', included: true },
      { name: 'Boostify TV (Access)', included: true },
      { name: 'Affiliates Program', included: true },
      { name: 'Artist Dashboard', included: false },
      { name: 'Spotify Tools', included: false },
      { name: 'Contracts', included: false },
      { name: 'PR Management', included: false },
      { name: 'YouTube Boost', included: false },
      { name: 'Instagram Boost', included: false },
      { name: 'AI Advisors', included: false },
      { name: 'Virtual Record Label', included: false },
      { name: 'AI Agents', included: false }
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
      yearly: 'price_1SUz302LyFplWimfv5MZCNz4' // ✅ Creator Yearly - $604/año
    },
    features: [
      { name: 'Everything in Free', included: true },
      { name: 'Artist Dashboard', included: true },
      { name: 'Spotify Tools', included: true },
      { name: 'Contracts & Legal', included: true },
      { name: 'PR Management', included: true },
      { name: 'News & Events', included: true },
      { name: 'Videos & Blog', included: true },
      { name: 'Social Network (Full)', included: true },
      { name: 'Artist Image Advisor', included: true },
      { name: 'Education Courses', included: true },
      { name: 'AI Advisors (3 calls/month)', included: true },
      { name: 'YouTube Boost', included: false },
      { name: 'Instagram Boost', included: false },
      { name: 'Virtual Record Label', included: false }
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
      yearly: 'price_1SUz302LyFplWimfG5YtbUJ3' // ✅ Professional Yearly - $1,007/año
    },
    features: [
      { name: 'Everything in Creator', included: true },
      { name: 'Analytics Dashboard', included: true },
      { name: 'YouTube Boost (Trends, Optimizer)', included: true },
      { name: 'Instagram Boost (AI Tools, Community)', included: true },
      { name: 'Manager Tools', included: true },
      { name: 'Producer Tools', included: true },
      { name: 'Music Generator (Advanced)', included: true },
      { name: 'Merchandise System', included: true },
      { name: 'Real-time Translator', included: true },
      { name: 'Image Generator (50/month)', included: true },
      { name: 'Smart Cards', included: true },
      { name: 'Achievements System', included: true },
      { name: 'Contacts Management (Advanced)', included: true },
      { name: 'AI Advisors (10 calls/month)', included: true },
      { name: 'Virtual Record Label', included: false },
      { name: 'AI Agents', included: false }
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
      yearly: 'price_1SUz312LyFplWimfQSQLo349' // ✅ Enterprise Yearly - $1,511/año
    },
    features: [
      { name: 'Everything in Professional', included: true },
      { name: 'Virtual Record Label (10 artists)', included: true },
      { name: 'AI Agents (Full Access)', included: true },
      { name: 'AI Advisors (Unlimited calls)', included: true },
      { name: 'Artist Generator (AI)', included: true },
      { name: 'Ecosystem Management', included: true },
      { name: 'Boostify International', included: true },
      { name: 'Music Videos (Premium, Unlimited)', included: true },
      { name: 'Analytics (Enterprise)', included: true },
      { name: 'YouTube Boost (Unlimited)', included: true },
      { name: 'Instagram Boost (Unlimited)', included: true },
      { name: 'Spotify Boost (Unlimited)', included: true },
      { name: 'Image Generator (Unlimited)', included: true },
      { name: 'Music Generator (Unlimited)', included: true },
      { name: 'Contacts (Enterprise)', included: true },
      { name: 'Dedicated Support', included: true },
      { name: 'Priority Processing', included: true }
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
