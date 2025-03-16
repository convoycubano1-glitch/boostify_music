/**
 * Hook personalizado para verificar acceso a asesores basado en el plan de suscripción
 */

import { useState, useEffect } from 'react';
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
  const { subscription, isLoading: isSubscriptionLoading } = useSubscription();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [limitInfo, setLimitInfo] = useState({
    hasReachedLimit: false,
    callsUsed: 0,
    callLimit: 0,
    callsRemaining: 0
  });
  const [message, setMessage] = useState('Verificando acceso...');

  useEffect(() => {
    const checkAccess = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Esperar a que la información de suscripción esté disponible
        if (isSubscriptionLoading) {
          return;
        }
        
        const plan = subscription?.plan || 'free';
        
        // Verificar si el asesor está disponible en el plan actual
        const advisorAvailable = advisorCallService.isAdvisorAvailableInPlan(
          advisorId,
          plan,
          freePlanAdvisors
        );
        
        // Verificar límite de llamadas
        const limitCheck = await advisorCallService.hasReachedCallLimit(plan);
        
        setHasAccess(advisorAvailable);
        setLimitInfo({
          hasReachedLimit: limitCheck.hasReachedLimit,
          callsUsed: limitCheck.callsUsed,
          callLimit: limitCheck.callLimit,
          callsRemaining: limitCheck.callsRemaining
        });
        
        // Establecer mensaje según el resultado
        if (!advisorAvailable) {
          setMessage(`Este asesor solo está disponible en planes superiores. Actualiza tu suscripción para acceder.`);
        } else if (limitCheck.hasReachedLimit) {
          setMessage(`Has alcanzado tu límite de ${limitCheck.callLimit} llamadas mensuales. Actualiza tu plan para obtener más.`);
        } else {
          setMessage(`Tienes ${limitCheck.callsRemaining} llamadas disponibles este mes.`);
        }
      } catch (err: any) {
        console.error('Error verificando acceso a asesor:', err);
        setError(err.message || 'Error al verificar acceso');
        setMessage('No se pudo verificar tu acceso. Intenta nuevamente.');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAccess();
  }, [advisorId, freePlanAdvisors, subscription, isSubscriptionLoading]);
  
  return {
    hasAccess,
    hasReachedLimit: limitInfo.hasReachedLimit,
    callsUsed: limitInfo.callsUsed,
    callLimit: limitInfo.callLimit,
    callsRemaining: limitInfo.callsRemaining,
    isLoading,
    error,
    message
  };
}