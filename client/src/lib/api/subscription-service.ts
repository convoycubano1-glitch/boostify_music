import { apiRequest } from "@/lib/queryClient";

// Tipos de planes de suscripción
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'premium';

// Estado de la suscripción
export type SubscriptionStatus = 'active' | 'inactive' | 'cancelled' | 'past_due';

// Información completa del plan
export interface SubscriptionPlanInfo {
  id: string;
  name: string;
  price: number; // Precio en USD
  description: string;
  features: string[];
}

// Información detallada de la suscripción
export interface SubscriptionInfo {
  id?: string;
  status: SubscriptionStatus;
  currentPlan: SubscriptionPlan;
  startDate?: string;
  endDate?: string;
  cancelAtPeriodEnd?: boolean;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
}

// Objeto completo para la respuesta del servidor
export interface SubscriptionResponse {
  success: boolean;
  message?: string;
  subscription?: SubscriptionInfo;
}

// Planes disponibles en el sistema
export const SUBSCRIPTION_PLANS: Record<SubscriptionPlan, SubscriptionPlanInfo> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    description: 'Basic tools to start your music career',
    features: [
      'Music dashboard',
      'Profile page',
      'Basic analytics',
      'Community access'
    ]
  },
  basic: {
    id: 'price_1NvZo6Kh0NZdHZoeUGCJzyrR',
    name: 'Basic',
    price: 59.99,
    description: 'Essential tools for emerging artists',
    features: [
      'Everything in Free',
      'Artist dashboard',
      'Social media integration',
      'Basic marketing tools',
      'Education resources'
    ]
  },
  pro: {
    id: 'price_1NvZpKKh0NZdHZoeJOd3cIfR',
    name: 'Pro',
    price: 99.99,
    description: 'Advanced tools for professional artists',
    features: [
      'Everything in Basic',
      'Advanced analytics',
      'Marketing campaigns',
      'Music generation',
      'Image generation',
      'Professional tools'
    ]
  },
  premium: {
    id: 'price_1NvZqAKh0NZdHZoeUGbwEFlb',
    name: 'Premium',
    price: 149.99,
    description: 'Complete solution for industry leaders',
    features: [
      'Everything in Pro',
      'AI video creation',
      'Label services',
      'Advanced AI tools',
      'Investor dashboard',
      'International promotion'
    ]
  }
};

// Jerarquía de planes
const PLAN_HIERARCHY: Record<SubscriptionPlan, number> = {
  free: 0,
  basic: 1,
  pro: 2,
  premium: 3
};

/**
 * Comprueba si un plan cumple o supera el nivel requerido
 * @param currentPlan Plan actual del usuario
 * @param requiredPlan Plan mínimo requerido
 * @returns true si tiene acceso, false en caso contrario
 */
export function hasPlanAccess(currentPlan: SubscriptionPlan, requiredPlan: SubscriptionPlan): boolean {
  return PLAN_HIERARCHY[currentPlan] >= PLAN_HIERARCHY[requiredPlan];
}

/**
 * Obtiene el estado actual de la suscripción
 */
export async function getSubscriptionStatus(): Promise<SubscriptionResponse> {
  try {
    const response = await apiRequest({
      url: '/api/stripe/subscription-status',
      method: 'GET'
    });
    return response as SubscriptionResponse;
  } catch (error) {
    console.error('Error fetching subscription status:', error);
    return {
      success: false,
      message: 'Error retrieving subscription information'
    };
  }
}

/**
 * Crea una sesión de checkout para una nueva suscripción
 * @param planId ID del plan al que suscribirse
 */
export async function createSubscription(planId: string): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const response = await apiRequest({
      url: '/api/stripe/create-subscription',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { priceId: planId }  // Cambiado de planId a priceId para que coincida con el servidor
    });
    return response as { success: boolean; url?: string; message?: string };
  } catch (error) {
    console.error('Error creating subscription:', error);
    return {
      success: false,
      message: 'Error creating subscription session'
    };
  }
}

/**
 * Cancela la suscripción actual
 */
export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  try {
    const response = await apiRequest({
      url: '/api/stripe/cancel-subscription',
      method: 'POST'
    });
    return response as { success: boolean; message: string };
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      message: 'Error cancelling subscription'
    };
  }
}

/**
 * Actualiza la suscripción a un nuevo plan
 * @param newPlanId ID del nuevo plan
 */
export async function updateSubscription(newPlanId: string): Promise<{ success: boolean; url?: string; message?: string }> {
  try {
    const response = await apiRequest({
      url: '/api/stripe/update-subscription',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { priceId: newPlanId }  // Cambiado de planId a priceId para que coincida con el servidor
    });
    return response as { success: boolean; url?: string; message?: string };
  } catch (error) {
    console.error('Error updating subscription:', error);
    return {
      success: false,
      message: 'Error updating subscription'
    };
  }
}