/**
 * Servicio para gestionar llamadas a asesores IA
 * 
 * Este servicio se encarga de:
 * - Registrar llamadas en Firestore
 * - Obtener historial de llamadas
 * - Verificar límites según plan de suscripción
 */

import { LucideIcon } from 'lucide-react';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { getUserId } from '../auth-helpers';

// Número telefónico central para todas las llamadas a asesores
export const ADVISOR_PHONE_NUMBER = "+1 941 315 9237";

/**
 * Interfaz de Asesor
 */
export interface Advisor {
  id: string;           // ID único del asesor
  name: string;         // Nombre completo
  title: string;        // Cargo o posición
  description: string;  // Descripción de especialidad
  icon: LucideIcon;     // Ícono representativo
  color: string;        // Color distintivo (para UI)
  animationDelay?: number; // Delay para animaciones UI
  phoneNumber?: string; // Número de teléfono (opcional, se usa el global por defecto)
}

/**
 * Interfaz de llamada a asesor
 */
export interface AdvisorCall {
  id?: string;          // ID único de la llamada (generado por Firestore)
  userId: string;       // ID del usuario
  advisorId: string;    // ID del asesor
  advisorName: string;  // Nombre del asesor
  advisorTitle: string; // Cargo del asesor
  phoneNumber: string;  // Número de teléfono usado para la llamada
  duration: number;     // Duración en segundos
  status: 'completed' | 'cancelled' | 'failed'; // Estado de la llamada
  notes?: string;       // Notas del usuario
  topics: string[];     // Temas tratados
  plan: string;         // Plan de suscripción usado
  timestamp: Timestamp; // Fecha y hora
}

/**
 * Clase de servicio para llamadas a asesores
 */
class AdvisorCallService {
  /**
   * Registrar una llamada en Firestore
   * @param advisor Datos del asesor
   * @param duration Duración en segundos
   * @param notes Notas opcionales
   * @param topics Temas tratados
   * @param status Estado de la llamada
   * @param plan Plan de suscripción
   * @returns Promise con el ID del documento creado
   */
  async registerCall(
    advisor: Advisor,
    duration: number,
    notes: string = '',
    topics: string[] = [],
    status: 'completed' | 'cancelled' | 'failed' = 'completed',
    plan: string = 'free'
  ): Promise<string | null> {
    try {
      const userId = getUserId();
      if (!userId) {
        console.error('No hay usuario autenticado para registrar llamada');
        return null;
      }
      
      // Obtener el número de teléfono a usar (por ahora, siempre usar el número central)
      const phoneNumber = ADVISOR_PHONE_NUMBER;
      
      // Crear objeto de llamada
      const callData: Omit<AdvisorCall, 'id'> = {
        userId,
        advisorId: advisor.id,
        advisorName: advisor.name,
        advisorTitle: advisor.title,
        phoneNumber,
        duration,
        status,
        notes,
        topics,
        plan,
        timestamp: serverTimestamp() as Timestamp,
      };
      
      // Guardar en Firestore
      const docRef = await addDoc(collection(db, 'advisor_calls'), callData);
      return docRef.id;
    } catch (error) {
      console.error('Error al registrar llamada:', error);
      throw error;
    }
  }
  
  /**
   * Obtener historial de llamadas del usuario
   * @param maxResults Número máximo de resultados a obtener
   * @returns Promise con historial de llamadas
   */
  async getUserCallHistory(maxResults: number = 100): Promise<{
    calls: AdvisorCall[];
    totalCalls: number;
    totalDuration: number;
  }> {
    try {
      const userId = getUserId();
      if (!userId) {
        console.error('No hay usuario autenticado para obtener historial');
        return { calls: [], totalCalls: 0, totalDuration: 0 };
      }
      
      // Consultar Firestore para obtener llamadas del usuario, ordenadas por fecha descendente
      const q = query(
        collection(db, 'advisor_calls'),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      
      const querySnapshot = await getDocs(q);
      
      // Mapear resultados
      const calls: AdvisorCall[] = [];
      let totalDuration = 0;
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Omit<AdvisorCall, 'id'>;
        const call: AdvisorCall = {
          id: doc.id,
          ...data,
          // Asegurar que phoneNumber esté definido para registros antiguos
          phoneNumber: data.phoneNumber || ADVISOR_PHONE_NUMBER
        };
        calls.push(call);
        
        // Sumar duración total (solo de llamadas completadas)
        if (call.status === 'completed') {
          totalDuration += call.duration;
        }
      });
      
      return {
        calls,
        totalCalls: querySnapshot.size,
        totalDuration,
      };
    } catch (error) {
      console.error('Error al obtener historial de llamadas:', error);
      throw error;
    }
  }
  
  /**
   * Verificar si el usuario ha alcanzado su límite de llamadas
   * @param plan Plan de suscripción del usuario
   * @returns Promise con resultado de verificación
   */
  async hasReachedCallLimit(plan: string = 'free'): Promise<{
    hasReachedLimit: boolean;
    callsUsed: number;
    callLimit: number;
    callsRemaining: number;
  }> {
    try {
      // Obtener límite según plan
      const callLimit = this.getMonthlyCallLimit(plan);
      
      // Obtener historial de llamadas recientes (del último mes)
      const history = await this.getUserCallHistory();
      const callsUsed = history.totalCalls;
      
      // Verificar si ha alcanzado el límite
      const hasReachedLimit = callsUsed >= callLimit;
      const callsRemaining = Math.max(0, callLimit - callsUsed);
      
      return {
        hasReachedLimit,
        callsUsed,
        callLimit,
        callsRemaining,
      };
    } catch (error) {
      console.error('Error al verificar límite de llamadas:', error);
      throw error;
    }
  }
  
  /**
   * Obtener límite mensual de llamadas según el plan
   * @param plan Plan de suscripción
   * @returns Número de llamadas permitidas por mes
   */
  getMonthlyCallLimit(plan: string = 'free'): number {
    switch (plan.toLowerCase()) {
      case 'premium':
        return 100;
      case 'pro':
        return 30;
      case 'basic':
        return 10;
      case 'free':
      default:
        return 3;
    }
  }
  
  /**
   * Verificar si un asesor está disponible en el plan actual
   * @param advisorId ID del asesor
   * @param plan Plan de suscripción
   * @param freePlanAdvisors Lista de IDs de asesores disponibles en plan gratuito
   * @returns Si el asesor está disponible en el plan
   */
  isAdvisorAvailableInPlan(
    advisorId: string,
    plan: string = 'free',
    freePlanAdvisors: string[] = []
  ): boolean {
    // Todos los asesores están disponibles en planes premium y pro
    if (['premium', 'pro'].includes(plan.toLowerCase())) {
      return true;
    }
    
    // Para plan básico, solo algunos asesores están disponibles
    if (plan.toLowerCase() === 'basic') {
      // En este caso, asumimos que los asesores del plan free más algunos adicionales
      const basicPlanAdvisors = [...freePlanAdvisors, 'creative', 'support'];
      return basicPlanAdvisors.includes(advisorId);
    }
    
    // Para plan gratuito, solo los asesores específicamente indicados
    return freePlanAdvisors.includes(advisorId);
  }
  
  /**
   * Obtiene el número de teléfono para un asesor específico
   * 
   * Actualmente se usa un número único para todos, pero en el futuro
   * podría asignarse un número diferente a cada asesor.
   * 
   * @param advisorId ID del asesor o objeto asesor completo
   * @returns Número de teléfono para contactar al asesor
   */
  getAdvisorPhoneNumber(advisorId: string | Advisor): string {
    // Por ahora, siempre devuelve el número central
    return ADVISOR_PHONE_NUMBER;
    
    // En el futuro, podría implementarse así:
    /*
    if (typeof advisorId === 'object') {
      return advisorId.phoneNumber || ADVISOR_PHONE_NUMBER;
    }
    
    // Aquí se podría consultar una base de datos para obtener números específicos
    // Por ahora, devolver el número central para todos
    return ADVISOR_PHONE_NUMBER;
    */
  }
}

export const advisorCallService = new AdvisorCallService();