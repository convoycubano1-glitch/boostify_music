/**
 * Servicio para interactuar con la API de Stripe
 * 
 * Este servicio proporciona funciones para interactuar con la API de Stripe,
 * incluyendo la creación de sesiones de checkout, la gestión de suscripciones,
 * y la obtención de la clave publicable de Stripe.
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
 * 
 * @param priceId El ID del precio/plan al que se quiere suscribir el usuario
 * @returns La URL de la sesión de checkout
 */
export async function createCheckoutSession(priceId: string): Promise<StripeCheckoutResponse> {
  try {
    const response = await apiRequest({
      url: '/api/stripe/create-subscription',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { priceId }
    });
    
    return response as StripeCheckoutResponse;
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return {
      success: false,
      message: 'No se pudo crear la sesión de pago'
    };
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
 * @returns Resultado de la operación
 */
export async function updateSubscription(priceId: string): Promise<{success: boolean; message?: string}> {
  try {
    const response = await apiRequest({
      url: '/api/stripe/update-subscription',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      data: { priceId }
    });
    
    return response as {success: boolean; message?: string};
  } catch (error) {
    console.error('Error updating subscription:', error);
    return {
      success: false,
      message: 'No se pudo actualizar la suscripción'
    };
  }
}