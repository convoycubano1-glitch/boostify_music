/**
 * Hook personalizado para verificar acceso a asesores basado en el plan de suscripción
 */

import { useState, useEffect, useMemo } from 'react';
import { useSubscription } from '../lib/context/subscription-context';
import { advisorCallService } from '../lib/services/advisor-call-service';

/**
 * Interfaz para el resultado de verificación de acceso
 */
export interface AdvisorAccessResult {
  // Si el usuario tiene acceso al asesor específico
  hasAccess: boolean;
  // Si ha alcanzado el límite de llamadas
  hasReachedLimit: boolean;
  // Número de llamadas utilizadas
  callsUsed: number;
  // Límite total de llamadas
  callLimit: number;
  // Llamadas restantes
  callsRemaining: number;
  // Si está cargando la verificación
  isLoading: boolean;
  // Error si ocurre alguno
  error: string | null;
  // Mensaje descriptivo sobre el acceso
  message: string;
}

// Estado inicial constante para evitar recreaciones
const INITIAL_STATE: AdvisorAccessResult = {
  isLoading: true,
  error: null,
  hasAccess: false,
  hasReachedLimit: false,
  callsUsed: 0,
  callLimit: 0,
  callsRemaining: 0,
  message: 'Checking access...'
};

/**
 * Hook para verificar si un usuario tiene acceso a un asesor específico
 * @param advisorId ID del asesor a verificar
 * @param freePlanAdvisors Lista de IDs de asesores disponibles en plan gratuito
 * @returns Resultado de la verificación de acceso
 */
export function useAdvisorAccess(
  advisorId: string,
  freePlanAdvisors: string[] = []
): AdvisorAccessResult {
  // Obtener información de suscripción
  const { subscription, isLoading: isSubscriptionLoading, currentPlan } = useSubscription();
  
  // Estado único con estado inicial definido fuera de la función
  const [state, setState] = useState<AdvisorAccessResult>(INITIAL_STATE);

  // Usar useMemo para asegurar que freePlanAdvisors sea consistente
  const normalizedFreePlanAdvisors = useMemo(() => {
    return Array.isArray(freePlanAdvisors) ? freePlanAdvisors : [];
  }, [freePlanAdvisors]);
  
  // Efecto para verificar acceso
  useEffect(() => {
    let isMounted = true;
    
    const checkAccess = async () => {
      if (!isMounted) return;
      
      // Actualizar estado de carga
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Si aún estamos cargando la suscripción, esperar
        if (isSubscriptionLoading) return;
        
        // Obtener plan actual
        const plan = currentPlan || 'free';
        
        // Verificar si el asesor está disponible en el plan actual
        const advisorAvailable = advisorCallService.isAdvisorAvailableInPlan(
          advisorId,
          plan,
          normalizedFreePlanAdvisors
        );
        
        // Verificar límite de llamadas y manejar posibles errores
        let limitCheck;
        try {
          limitCheck = await advisorCallService.hasReachedCallLimit(plan);
        } catch (limitError) {
          console.error('Error checking call limits:', limitError);
          
          if (!isMounted) return;
          
          // Usar valores seguros en caso de error
          limitCheck = {
            hasReachedLimit: false,
            callsUsed: 0,
            callLimit: advisorCallService.getMonthlyCallLimit(plan),
            callsRemaining: advisorCallService.getMonthlyCallLimit(plan)
          };
        }
        
        if (!isMounted) return;
        
        // Generar mensaje apropiado según el resultado
        let resultMessage = '';
        if (!advisorAvailable) {
          resultMessage = `This advisor is only available on higher tier plans. Upgrade your subscription to access.`;
        } else if (limitCheck.hasReachedLimit) {
          resultMessage = `You've reached your limit of ${limitCheck.callLimit} monthly calls. Upgrade your plan for more.`;
        } else {
          resultMessage = `You have ${limitCheck.callsRemaining} calls available this month.`;
        }
        
        // Actualizar estado completo
        setState({
          isLoading: false,
          error: null,
          hasAccess: advisorAvailable,
          hasReachedLimit: limitCheck.hasReachedLimit,
          callsUsed: limitCheck.callsUsed,
          callLimit: limitCheck.callLimit,
          callsRemaining: limitCheck.callsRemaining,
          message: resultMessage
        });
      } catch (err: any) {
        console.error('Error verifying advisor access:', err);
        
        if (!isMounted) return;
        
        // Actualizar estado en caso de error general
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || 'Error verifying access',
          message: 'Unable to verify your access. Please try again.'
        }));
      }
    };
    
    // Ejecutar verificación
    checkAccess();
    
    // Limpieza al desmontar
    return () => {
      isMounted = false;
    };
  }, [advisorId, normalizedFreePlanAdvisors, subscription, isSubscriptionLoading, currentPlan]);
  
  return state;
}