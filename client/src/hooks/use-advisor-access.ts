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
  
  // Inicializar estados una sola vez
  const [state, setState] = useState({
    isLoading: true,
    error: null as string | null,
    hasAccess: false,
    hasReachedLimit: false,
    callsUsed: 0,
    callLimit: 0,
    callsRemaining: 0,
    message: 'Verificando acceso...'
  });

  // Usar useMemo para asegurar que freePlanAdvisors sea consistente
  const normalizedFreePlanAdvisors = useMemo(() => {
    return Array.isArray(freePlanAdvisors) ? freePlanAdvisors : [];
  }, [freePlanAdvisors]);
  
  // Efecto para verificar acceso
  useEffect(() => {
    let isMounted = true;
    
    const checkAccess = async () => {
      try {
        // Si el componente ya no está montado, no seguir
        if (!isMounted) return;
        
        // Actualizar estado de carga
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        
        // Esperar a que la información de suscripción esté disponible
        if (isSubscriptionLoading) return;
        
        // Obtener plan actual
        const plan = currentPlan || 'free';
        
        // Verificar si el asesor está disponible en el plan actual
        const advisorAvailable = advisorCallService.isAdvisorAvailableInPlan(
          advisorId,
          plan,
          normalizedFreePlanAdvisors
        );
        
        try {
          // Verificar límite de llamadas
          const limitCheck = await advisorCallService.hasReachedCallLimit(plan);
          
          if (!isMounted) return;
          
          // Establecer mensaje según el resultado
          let resultMessage = '';
          if (!advisorAvailable) {
            resultMessage = `Este asesor solo está disponible en planes superiores. Actualiza tu suscripción para acceder.`;
          } else if (limitCheck.hasReachedLimit) {
            resultMessage = `Has alcanzado tu límite de ${limitCheck.callLimit} llamadas mensuales. Actualiza tu plan para obtener más.`;
          } else {
            resultMessage = `Tienes ${limitCheck.callsRemaining} llamadas disponibles este mes.`;
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
        } catch (limitError) {
          console.error('Error verificando límite de llamadas:', limitError);
          
          if (!isMounted) return;
          
          // En caso de error al verificar límites, establecer valores por defecto seguros
          setState({
            isLoading: false,
            error: 'Error al verificar límites de llamadas',
            hasAccess: advisorAvailable,
            hasReachedLimit: false,
            callsUsed: 0,
            callLimit: advisorCallService.getMonthlyCallLimit(plan),
            callsRemaining: advisorCallService.getMonthlyCallLimit(plan),
            message: advisorAvailable 
              ? 'Tu asesor está disponible, pero no se pudo verificar el límite de llamadas.' 
              : 'Este asesor no está disponible en tu plan actual.'
          });
        }
      } catch (err: any) {
        console.error('Error verificando acceso a asesor:', err);
        
        if (!isMounted) return;
        
        // Actualizar estado en caso de error
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: err.message || 'Error al verificar acceso',
          message: 'No se pudo verificar tu acceso. Intenta nuevamente.'
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