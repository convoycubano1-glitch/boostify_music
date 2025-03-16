/**
 * Hook para verificar el acceso a asesores según el plan de suscripción
 */

import { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { useSubscription } from '../lib/context/subscription-context';
import { advisorCallService } from '../lib/services/advisor-call-service';

interface AdvisorAccessData {
  hasAccess: boolean;
  isLoading: boolean;
  error: string | null;
  hasReachedLimit: boolean;
  callsRemaining: number;
}

/**
 * Hook personalizado para verificar el acceso de un usuario a un asesor específico
 * 
 * @param advisorId ID del asesor a verificar
 * @param freeTierAdvisors Lista de IDs de asesores disponibles en el plan gratuito
 * @returns Objeto con información sobre el acceso
 */
export function useAdvisorAccess(
  advisorId: string,
  freeTierAdvisors: string[] = ['publicist']
): AdvisorAccessData {
  const { user } = useAuth();
  const { subscription } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  const [callsRemaining, setCallsRemaining] = useState(0);
  
  // Determinar el plan actual del usuario
  const userPlan = (subscription?.status === 'active' && subscription.plan)
    ? subscription.plan 
    : 'free';
  
  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        setError(null);
        
        // Valor predeterminado para el plan (free) si el plan es nulo
        const planToUse = userPlan || 'free';
        
        // Verificar si el asesor está disponible según el plan
        const isAvailable = advisorCallService.isAdvisorAvailableInPlan(
          advisorId,
          freeTierAdvisors,
          planToUse
        );
        
        // Verificar si se alcanzó el límite de llamadas mensuales
        const reachedLimit = await advisorCallService.hasReachedMonthlyLimit(planToUse);
        
        // Calcular llamadas restantes
        const usedCalls = await advisorCallService.getCurrentMonthCallCount();
        const maxCalls = advisorCallService.getMonthlyCallLimit(planToUse);
        const remaining = Math.max(0, maxCalls - usedCalls);
        
        // Actualizar estados
        setHasAccess(isAvailable && !reachedLimit);
        setHasReachedLimit(reachedLimit);
        setCallsRemaining(remaining);
      } catch (err: any) {
        console.error('Error checking advisor access:', err);
        setError(err.message || 'Error al verificar acceso al asesor');
        setHasAccess(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, [user, advisorId, freeTierAdvisors, userPlan]);
  
  return {
    hasAccess,
    isLoading,
    error,
    hasReachedLimit,
    callsRemaining
  };
}