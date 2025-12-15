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
    displayName: 'Discover',
    description: 'Start your music journey',
    highlight: 'Always free',
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
      { name: 'Community Hub', included: true },
      { name: 'Merch Store', included: true },
      { name: 'Learn Hub', included: true },
      { name: 'BoostifyTV', included: true },
      { name: 'Earn Commissions', included: true },
      { name: 'Artist Hub', included: false },
      { name: 'Spotify Growth', included: false },
      { name: 'Legal Contracts', included: false },
      { name: 'PR Mastery', included: false },
      { name: 'YouTube Mastery', included: false },
      { name: 'Instagram Domination', included: false },
      { name: 'Expert Advisors', included: false },
      { name: 'Label Creator', included: false },
      { name: 'AI Agents', included: false }
    ]
  },
  
  creator: {
    key: 'creator',
    displayName: 'Elevate',
    description: 'Build your artist presence & fanbase',
    highlight: 'Most popular',
    popular: true,
    price: {
      monthly: 59.99,
      yearly: 599.99, // Save $120/year
      yearlyEquivalentMonthly: 49.99
    },
    stripeIds: {
      monthly: 'price_1R0lay2LyFplWimfQxUL6Hn0',
      yearly: 'price_1Sei7X2LyFplWimfMgbnJvPM' // ✅ Elevate Yearly - $599.99/año
    },
    features: [
      { name: 'Everything in Discover', included: true },
      { name: 'Artist Hub', included: true },
      { name: 'Spotify Growth Engine', included: true },
      { name: 'Contract Templates', included: true },
      { name: 'PR Starter Kit', included: true },
      { name: 'News & Events Hub', included: true },
      { name: 'Content Studio', included: true },
      { name: 'Full Community Access', included: true },
      { name: 'Creative Image AI', included: true },
      { name: 'Master Classes', included: true },
      { name: 'Expert Advisors (3/month)', included: true },
      { name: 'YouTube Mastery', included: false },
      { name: 'Instagram Domination', included: false },
      { name: 'Label Creator', included: false }
    ]
  },
  
  professional: {
    key: 'professional',
    displayName: 'Amplify',
    description: 'Scale your sound & reach globally',
    highlight: 'Best value',
    price: {
      monthly: 99.99,
      yearly: 999.99, // Save $200/year
      yearlyEquivalentMonthly: 83.33
    },
    stripeIds: {
      monthly: 'price_1R0laz2LyFplWimfsBd5ASoa',
      yearly: 'price_1Sei7X2LyFplWimfL1qscrKR' // ✅ Amplify Yearly - $999.99/año
    },
    features: [
      { name: 'Everything in Elevate', included: true },
      { name: 'Pro Analytics Engine', included: true },
      { name: 'YouTube Mastery Suite', included: true },
      { name: 'Instagram Domination Suite', included: true },
      { name: 'Career Manager Suite', included: true },
      { name: 'Music Production Lab', included: true },
      { name: 'AI Music Studio (Advanced)', included: true },
      { name: 'Premium Merch Hub', included: true },
      { name: 'Global Language Studio', included: true },
      { name: 'Creative Canvas AI (50/month)', included: true },
      { name: 'Milestone Cards', included: true },
      { name: 'Achievement Badges', included: true },
      { name: 'Network Pro', included: true },
      { name: 'Expert Advisors (10/month)', included: true },
      { name: 'Label Creator', included: false },
      { name: 'AI Agents', included: false }
    ]
  },
  
  enterprise: {
    key: 'enterprise',
    displayName: 'Dominate',
    description: 'Conquer the music industry',
    highlight: 'Maximum power',
    price: {
      monthly: 149.99,
      yearly: 1499.99, // Save $300/year
      yearlyEquivalentMonthly: 124.99
    },
    stripeIds: {
      monthly: 'price_1Sei8R2LyFplWimfXK8dAE06',
      yearly: 'price_1Sei8R2LyFplWimf15fDEJDL' // ✅ Dominate Yearly - $1499.99/año
    },
    features: [
      { name: 'Everything in Amplify', included: true },
      { name: '✨ Virtual Label Empire (10 artists)', included: true },
      { name: '🤖 AI Agent Suite (Unlimited)', included: true },
      { name: '👑 Expert Advisors (Unlimited)', included: true },
      { name: '🎭 Artist Generator Pro', included: true },
      { name: '🌍 Global Ecosystem Hub', included: true },
      { name: '🚀 International Expansion', included: true },
      { name: '🎬 Premium Video Studio (Unlimited)', included: true },
      { name: '📊 Enterprise Analytics', included: true },
      { name: '▶️ YouTube Mastery Unlimited', included: true },
      { name: '📱 Instagram Domination Unlimited', included: true },
      { name: '🎵 Spotify Growth Unlimited', included: true },
      { name: '🎨 Creative Canvas Unlimited', included: true },
      { name: '🎶 AI Music Studio (Unlimited)', included: true },
      { name: '🤝 Enterprise Network', included: true },
      { name: '🎯 VIP Support (24/7)', included: true },
      { name: '⚡ Priority Fast-Track', included: true }
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
