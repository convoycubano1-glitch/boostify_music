import { apiRequest } from '@/lib/query-client';

/**
 * Tipos de planes de suscripción disponibles
 */
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium';

/**
 * Jerarquía de planes para determinar acceso a características
 * Valores numéricos más altos tienen más acceso
 */
export const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  'free': 0,
  'basic': 10,
  'pro': 20,
  'premium': 30
};

/**
 * Estado de la suscripción devuelto por la API
 */
export interface SubscriptionStatus {
  id: string | null;
  plan: string | null;
  currentPlan: SubscriptionPlan;
  status: string | null;
  active: boolean;
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string | null;
  priceId: string | null;
}

/**
 * Obtener el estado actual de la suscripción
 * @returns Promesa con el estado de la suscripción
 */
export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  try {
    const response = await apiRequest('/api/stripe/subscription-status');
    return response;
  } catch (error) {
    console.error('Error al obtener el estado de la suscripción:', error);
    // Devolver un estado predeterminado en caso de error
    return {
      id: null,
      plan: null,
      currentPlan: 'free',
      status: null,
      active: false,
      cancelAtPeriodEnd: false,
      currentPeriodEnd: null,
      priceId: null
    };
  }
}

/**
 * Crear una nueva suscripción
 * @param planId ID del plan a suscribir
 * @returns URL de checkout de Stripe
 */
export async function createSubscription(planId: string): Promise<string> {
  const response = await apiRequest('/api/stripe/create-subscription', {
    method: 'POST',
    data: { planId }
  });
  
  if (!response.success || !response.url) {
    throw new Error(response.message || 'Error al crear la suscripción');
  }
  
  return response.url;
}

/**
 * Actualizar la suscripción actual a un nuevo plan
 * @param planId ID del nuevo plan
 * @returns URL de checkout de Stripe
 */
export async function updateSubscription(planId: string): Promise<string> {
  const response = await apiRequest('/api/stripe/update-subscription', {
    method: 'POST',
    data: { planId }
  });
  
  if (!response.success || !response.url) {
    throw new Error(response.message || 'Error al actualizar la suscripción');
  }
  
  return response.url;
}

/**
 * Cancelar la suscripción actual
 * @returns Resultado de la operación
 */
export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  const response = await apiRequest('/api/stripe/cancel-subscription', {
    method: 'POST'
  });
  
  return {
    success: response.success,
    message: response.message || 'Suscripción cancelada correctamente'
  };
}

/**
 * Verifica si un plan tiene acceso a una característica
 * @param currentPlan Plan actual
 * @param requiredPlan Plan requerido
 * @returns true si tiene acceso
 */
export function canAccessFeature(
  currentPlan: SubscriptionPlan,
  requiredPlan: SubscriptionPlan
): boolean {
  if (!currentPlan || !requiredPlan) {
    return false;
  }
  
  return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Determina el nombre legible del plan para mostrar
 * @param plan Identificador del plan
 * @returns Nombre legible del plan
 */
export function getPlanDisplayName(plan: SubscriptionPlan): string {
  const displayNames: Record<SubscriptionPlan, string> = {
    'free': 'Plan Gratuito',
    'basic': 'Plan Básico',
    'pro': 'Plan Pro',
    'premium': 'Plan Premium'
  };
  
  return displayNames[plan] || 'Plan Desconocido';
}

/**
 * Determina el precio del plan
 * @param plan Identificador del plan
 * @returns Precio mensual del plan
 */
export function getPlanPrice(plan: SubscriptionPlan): number {
  const prices: Record<SubscriptionPlan, number> = {
    'free': 0,
    'basic': 59.99,
    'pro': 99.99,
    'premium': 149.99
  };
  
  return prices[plan] || 0;
}

/**
 * Obtiene las características disponibles para cada plan
 * @returns Mapa de planes con sus características
 */
export function getPlanFeatures(): Record<SubscriptionPlan, string[]> {
  return {
    'free': [
      'Acceso a cursos básicos',
      'Análisis de 1 canción por mes',
      'Compartir en redes sociales'
    ],
    'basic': [
      'Todo lo incluido en el plan Gratuito',
      'Acceso a todos los cursos básicos',
      'Análisis de 5 canciones por mes',
      'Herramientas de producción básicas',
      'Soporte por email'
    ],
    'pro': [
      'Todo lo incluido en el plan Básico',
      'Acceso a cursos avanzados',
      'Análisis ilimitado de canciones',
      'Herramientas de producción avanzadas',
      'Soporte prioritario',
      'Masterización de 3 canciones por mes'
    ],
    'premium': [
      'Todo lo incluido en el plan Pro',
      'Acceso a masterclasses exclusivas',
      'Sesiones 1-a-1 con productores',
      'Distribución de música en plataformas',
      'Masterización ilimitada',
      'Análisis de mercado y audiencia',
      'Soporte 24/7'
    ]
  };
}