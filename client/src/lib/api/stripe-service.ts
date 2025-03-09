/**
 * Servicio para interactuar con la API de Stripe
 * 
 * Este servicio proporciona funciones para interactuar con la API de Stripe,
 * incluyendo la creación de sesiones de checkout, la gestión de suscripciones,
 * la obtención de planes de suscripción, y la obtención de la clave publicable de Stripe.
 */

import { apiRequest } from "@/lib/queryClient";

// Tipos relacionados con Stripe
export interface StripeCheckoutResponse {
  url?: string;
  success: boolean;
  message?: string;
}

// Información del plan de precios
export interface PricePlan {
  priceId: string;
  interval?: 'month' | 'year';
}

// Información sobre planes de suscripción
export interface SubscriptionPlan {
  name: string;
  price: number;
  features: string[];
}

// Respuesta de la API para obtener planes
export interface SubscriptionPlansResponse {
  success: boolean;
  message: string;
  plans: SubscriptionPlan[];
}

/**
 * Obtiene la clave publicable de Stripe del servidor
 * Esta función no requiere autenticación
 * 
 * @returns La clave publicable de Stripe
 */
export async function fetchStripePublicKey(): Promise<string> {
  try {
    // Importante: Usamos fetch directamente y no apiRequest porque esta ruta es pública
    const response = await fetch('/api/stripe/publishable-key');
    const data = await response.json();
    
    if (data.success && data.key) {
      return data.key;
    } else {
      console.error('Error fetching Stripe public key:', data);
      throw new Error('Failed to get Stripe public key');
    }
  } catch (error) {
    console.error('Error fetching Stripe public key:', error);
    throw error;
  }
}

/**
 * Crea una sesión de checkout de Stripe para iniciar un proceso de suscripción
 * Versión 2.0: Usa exclusivamente la API de Stripe para crear sesiones dinámicas
 * 
 * @param priceId El ID del precio/plan al que se quiere suscribir el usuario
 * @returns La URL de la sesión de checkout
 */
export async function createCheckoutSession(priceId: string): Promise<string> {
  try {
    // Mapping de claves de plan a IDs de precio (para soporte de claves por nombre)
    const priceIdMapping: {[key: string]: string} = {
      'basic': 'price_1R0lay2LyFplWimfQxUL6Hn0',  // Plan Basic - $59.99
      'pro': 'price_1R0laz2LyFplWimfsBd5ASoa',    // Plan Pro - $99.99
      'premium': 'price_1R0lb12LyFplWimf7JpMynKA' // Plan Premium - $149.99
    };
    
    // Si se pasó una clave de plan en lugar de un ID, convertirla
    const actualPriceId = priceIdMapping[priceId] || priceId;
    
    console.log(`Creando sesión de checkout para: ${actualPriceId}`);
    
    // Crear una sesión dinámica con la API de Stripe
    const response = await apiRequest({
      url: '/api/stripe/create-subscription',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: { priceId: actualPriceId }
    });
    
    console.log('Respuesta de API de Stripe:', response);
    
    if (response.success && response.url) {
      return response.url;
    } else {
      throw new Error(response.message || 'No se pudo crear la sesión de checkout')
    }
  } catch (error) {
    console.error('Error creating checkout session:', error);
    throw new Error('No se pudo crear la sesión de pago. Por favor, contacta al soporte.');
  }
}

/**
 * Cancela la suscripción activa del usuario
 * 
 * @returns Resultado de la operación
 */
export async function cancelSubscription(): Promise<{success: boolean; message?: string}> {
  try {
    const response = await apiRequest({
      url: '/api/stripe/cancel-subscription',
      method: 'POST'
    });
    
    return response as {success: boolean; message?: string};
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    return {
      success: false,
      message: 'No se pudo cancelar la suscripción'
    };
  }
}

/**
 * Actualiza la suscripción activa del usuario a un nuevo plan
 * 
 * @param priceId El ID del nuevo precio/plan
 * @returns Resultado de la operación o URL para checkout si requiere cambio de método de pago
 */
export async function updateSubscription(priceId: string): Promise<{success: boolean; message?: string; url?: string}> {
  try {
    const response = await apiRequest({
      url: '/api/stripe/update-subscription',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: { priceId }
    });
    
    return response as {success: boolean; message?: string; url?: string};
  } catch (error) {
    console.error('Error updating subscription:', error);
    throw new Error('No se pudo actualizar la suscripción');
  }
}

/**
 * Obtiene los planes de suscripción disponibles
 * Esta función no requiere autenticación ya que utiliza un endpoint público
 * 
 * @returns Lista de planes de suscripción disponibles
 */
export async function fetchSubscriptionPlans(): Promise<SubscriptionPlansResponse> {
  try {
    // Usamos fetch directamente porque esta es una ruta pública
    const response = await fetch('/api/subscription-plans');
    const data = await response.json();
    
    if (data.success && data.plans) {
      return data as SubscriptionPlansResponse;
    } else {
      console.error('Error fetching subscription plans:', data);
      throw new Error('Failed to get subscription plans');
    }
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    throw error;
  }
}