/**
 * CONSTANTES GLOBALES DE BOOSTIFY MUSIC
 * 
 * Single Source of Truth para configuraciones críticas
 * Actualizado: Diciembre 2025
 */

// ============================================
// ADMINISTRADORES
// ============================================
export const ADMIN_EMAILS = ['convoycubano@gmail.com'];

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email.toLowerCase());
}

// ============================================
// PLANES DE SUSCRIPCIÓN
// ============================================

/**
 * Nomenclatura de Planes:
 * - UI Names: Discover, Elevate, Amplify, Dominate
 * - DB Names: free, creator, professional, enterprise
 * - Legacy Names: free, basic, pro, premium
 */
export const PLAN_NAMES = {
  // Nueva nomenclatura (preferida)
  free: { ui: 'Discover', db: 'free' },
  creator: { ui: 'Elevate', db: 'creator' },
  professional: { ui: 'Amplify', db: 'professional' },
  enterprise: { ui: 'Dominate', db: 'enterprise' },
} as const;

// Mapeo de legacy a nueva nomenclatura
export const LEGACY_PLAN_MAPPING: Record<string, string> = {
  'basic': 'creator',
  'pro': 'professional',
  'premium': 'enterprise',
  'free': 'free',
  'creator': 'creator',
  'professional': 'professional',
  'enterprise': 'enterprise',
};

// Jerarquía de planes (valor numérico)
export const PLAN_HIERARCHY: Record<string, number> = {
  'free': 0,
  'creator': 1,
  'basic': 1,      // Legacy alias
  'professional': 2,
  'pro': 2,        // Legacy alias
  'enterprise': 3,
  'premium': 3,    // Legacy alias
};

/**
 * Normalizar nombre de plan a nomenclatura nueva
 */
export function normalizePlanName(plan: string): string {
  return LEGACY_PLAN_MAPPING[plan] || plan;
}

/**
 * Verificar si un plan tiene acceso a otro
 */
export function hasPlanAccess(currentPlan: string, requiredPlan: string): boolean {
  const normalizedCurrent = normalizePlanName(currentPlan);
  const normalizedRequired = normalizePlanName(requiredPlan);
  
  const currentLevel = PLAN_HIERARCHY[normalizedCurrent] || 0;
  const requiredLevel = PLAN_HIERARCHY[normalizedRequired] || 0;
  
  return currentLevel >= requiredLevel;
}

// ============================================
// STRIPE PRICE IDs
// ============================================
export const STRIPE_PRICE_IDS = {
  // Elevate (creator)
  elevate: {
    monthly: 'price_1R0lay2LyFplWimfQxUL6Hn0',
    yearly: 'price_1Sei7X2LyFplWimfMgbnJvPM',
  },
  creator: {
    monthly: 'price_1R0lay2LyFplWimfQxUL6Hn0',
    yearly: 'price_1Sei7X2LyFplWimfMgbnJvPM',
  },
  
  // Amplify (professional)
  amplify: {
    monthly: 'price_1R0laz2LyFplWimfsBd5ASoa',
    yearly: 'price_1Sei7X2LyFplWimfL1qscrKR',
  },
  professional: {
    monthly: 'price_1R0laz2LyFplWimfsBd5ASoa',
    yearly: 'price_1Sei7X2LyFplWimfL1qscrKR',
  },
  
  // Dominate (enterprise)
  dominate: {
    monthly: 'price_1Sei8R2LyFplWimfXK8dAE06',
    yearly: 'price_1Sei8R2LyFplWimf15fDEJDL',
  },
  enterprise: {
    monthly: 'price_1Sei8R2LyFplWimfXK8dAE06',
    yearly: 'price_1Sei8R2LyFplWimf15fDEJDL',
  },
} as const;

// Mapeo inverso: Price ID -> Plan Name
export const PRICE_ID_TO_PLAN: Record<string, string> = {
  // Monthly
  'price_1R0lay2LyFplWimfQxUL6Hn0': 'creator',
  'price_1R0laz2LyFplWimfsBd5ASoa': 'professional',
  'price_1Sei8R2LyFplWimfXK8dAE06': 'enterprise',
  // Yearly
  'price_1Sei7X2LyFplWimfMgbnJvPM': 'creator',
  'price_1Sei7X2LyFplWimfL1qscrKR': 'professional',
  'price_1Sei8R2LyFplWimf15fDEJDL': 'enterprise',
  // Legacy (mantener por compatibilidad)
  'price_1R0lb12LyFplWimf7JpMynKA': 'enterprise',
};

/**
 * Obtener Price ID de Stripe
 */
export function getStripePriceId(plan: string, interval: 'monthly' | 'yearly'): string | null {
  const normalizedPlan = normalizePlanName(plan);
  const priceConfig = STRIPE_PRICE_IDS[normalizedPlan as keyof typeof STRIPE_PRICE_IDS];
  return priceConfig ? priceConfig[interval] : null;
}

/**
 * Obtener plan desde Price ID
 */
export function getPlanFromPriceId(priceId: string): string {
  return PRICE_ID_TO_PLAN[priceId] || 'free';
}

// ============================================
// PRECIOS DE SUSCRIPCIÓN
// ============================================
export const SUBSCRIPTION_PRICES = {
  discover: { monthly: 0, yearly: 0 },
  elevate: { monthly: 59.99, yearly: 599.99 },
  amplify: { monthly: 99.99, yearly: 999.99 },
  dominate: { monthly: 149.99, yearly: 1499.99 },
} as const;

// ============================================
// URLs DE PRODUCCIÓN
// ============================================
export const PRODUCTION_URL = 'https://boostifymusic.com';
export const APP_NAME = 'Boostify Music';
