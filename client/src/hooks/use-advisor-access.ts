/**
 * Hook personalizado para gestionar el acceso a los asesores según el plan de suscripción
 */

import { useState, useEffect } from 'react';
import { useSubscription } from '../lib/context/subscription-context';
import { advisorCallService } from '../lib/services/advisor-call-service';

export interface AdvisorAccess {
  // Si el usuario tiene acceso a este asesor
  hasAccess: boolean;
  
  // Si se está verificando el acceso
  isLoading: boolean;
  
  // Si el usuario ha alcanzado el límite de llamadas
  hasReachedLimit: boolean;
  
  // Límite de llamadas para el plan actual
  callLimit: number;
  
  // Llamadas restantes este mes
  callsRemaining: number;
  
  // Error en caso de que ocurra
  error: string | null;
}

/**
 * Hook para gestionar el acceso a los asesores según el plan de suscripción
 * @param advisorId ID del asesor que se quiere contactar
 * @param freeAdvisorIds Array de IDs de asesores disponibles en el plan gratuito
 * @returns Objeto con información sobre el acceso del usuario
 */
export function useAdvisorAccess(
  advisorId: string,
  freeAdvisorIds: string[] = ['publicist'] // Por defecto, solo el publicista es gratis
): AdvisorAccess {
  const { subscription, currentPlan } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [callsRemaining, setCallsRemaining] = useState(0);
  const [error, setError] = useState<string | null>(null);
  
  // Determinar si el usuario tiene acceso según su plan
  const isFreeAdvisor = freeAdvisorIds.includes(advisorId);
  
  // Por defecto, los asesores free están disponibles para todos,
  // los demás requieren al menos plan PRO
  const hasSubscriptionAccess = 
    isFreeAdvisor || 
    currentPlan === 'pro' || 
    currentPlan === 'premium';
  
  // Efecto para verificar el límite de llamadas
  useEffect(() => {
    const checkCallLimit = async () => {
      try {
        setIsLoading(true);
        
        // Verificar si el usuario ha alcanzado el límite de llamadas
        const reachedLimit = await advisorCallService.hasReachedCallLimit(currentPlan);
        setHasReachedLimit(reachedLimit);
        
        // Calcular llamadas restantes
        const callHistory = await advisorCallService.getUserCallHistory();
        const limit = advisorCallService.getMonthlyCallLimit(currentPlan);
        const remaining = Math.max(0, limit - callHistory.totalCalls);
        setCallsRemaining(remaining);
        
        setError(null);
      } catch (err: any) {
        console.error("Error checking advisor access:", err);
        setError(err.message || "Error checking advisor access");
      } finally {
        setIsLoading(false);
      }
    };
    
    // Solo verificar límites si el usuario tiene acceso por suscripción
    if (hasSubscriptionAccess) {
      checkCallLimit();
    } else {
      setIsLoading(false);
    }
  }, [advisorId, currentPlan, hasSubscriptionAccess]);
  
  // Combinar acceso de suscripción con límite de llamadas
  const hasAccess = hasSubscriptionAccess && !hasReachedLimit;
  
  // Límite de llamadas para el plan actual
  const callLimit = advisorCallService.getMonthlyCallLimit(currentPlan);
  
  return {
    hasAccess,
    isLoading,
    hasReachedLimit,
    callLimit,
    callsRemaining,
    error
  };
}