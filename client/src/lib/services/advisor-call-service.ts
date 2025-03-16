/**
 * Servicio para gestionar las llamadas a los asesores IA
 * 
 * Este servicio se encarga de:
 * - Registrar llamadas en Firestore
 * - Obtener historial de llamadas
 * - Verificar límites de llamadas según el plan de suscripción
 */

import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp, 
  DocumentData
} from 'firebase/firestore';
import { db } from '../firebase';
import { LucideIcon } from 'lucide-react';
import { getUserId } from '../auth-helpers';

export interface Advisor {
  id: string;
  name: string;
  title: string;
  description: string;
  icon: LucideIcon;
  phoneNumber?: string;
  color: string;
  animationDelay?: number;
}

export interface AdvisorCall {
  id: string;
  userId: string;
  advisorId: string;
  advisorName: string;
  advisorTitle: string;
  duration: number;
  notes: string;
  topics: string[];
  timestamp: Timestamp;
  status: 'completed' | 'cancelled' | 'failed';
  plan: string;
}

export interface CallHistory {
  calls: AdvisorCall[];
  totalCalls: number;
  totalDuration: number;
}

class AdvisorCallService {
  private readonly COLLECTION_NAME = 'advisor-calls';
  
  /**
   * Obtiene los límites de llamadas mensuales para cada plan
   * @param plan Plan de suscripción (free, basic, pro, premium)
   * @returns Número máximo de llamadas según el plan
   */
  getMonthlyCallLimit(plan: string): number {
    const limits: Record<string, number> = {
      'free': 3,
      'basic': 10,
      'pro': 30,
      'premium': 100
    };
    
    return limits[plan.toLowerCase()] || limits.free;
  }
  
  /**
   * Verifica si un asesor está disponible en un plan específico
   * @param advisorId ID del asesor
   * @param freeTierAdvisors Lista de IDs de asesores disponibles en el plan gratuito
   * @param plan Plan actual del usuario
   * @returns Booleano indicando si el asesor está disponible
   */
  isAdvisorAvailableInPlan(advisorId: string, freeTierAdvisors: string[], plan: string): boolean {
    // Si el asesor está en la lista de asesores gratuitos, está disponible para todos
    if (freeTierAdvisors.includes(advisorId)) {
      return true;
    }
    
    // Para otros asesores, verificar según el plan
    switch (plan.toLowerCase()) {
      case 'premium':
        return true; // Todos los asesores disponibles
      case 'pro':
        return true; // Todos los asesores disponibles
      case 'basic':
        // En el plan básico, solo algunos asesores están disponibles
        return ['publicist', 'creative', 'support'].includes(advisorId);
      case 'free':
      default:
        // En el plan gratuito, solo los asesores específicos están disponibles
        return freeTierAdvisors.includes(advisorId);
    }
  }
  
  /**
   * Registra una llamada a un asesor en Firestore
   * @param advisor Datos del asesor contactado
   * @param duration Duración de la llamada en segundos
   * @param notes Notas tomadas durante la llamada
   * @param topics Temas tratados en la llamada
   * @param status Estado final de la llamada (completada, cancelada, fallida)
   * @param plan Plan del usuario al momento de la llamada
   * @returns ID del documento creado
   */
  async registerCall(
    advisor: Advisor,
    duration: number,
    notes: string = '',
    topics: string[] = [],
    status: 'completed' | 'cancelled' | 'failed' = 'completed',
    plan: string = 'free'
  ): Promise<string> {
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const callData = {
        userId,
        advisorId: advisor.id,
        advisorName: advisor.name,
        advisorTitle: advisor.title,
        duration,
        notes,
        topics,
        timestamp: Timestamp.now(),
        status,
        plan: plan.toLowerCase()
      };
      
      const docRef = await addDoc(collection(db, this.COLLECTION_NAME), callData);
      return docRef.id;
    } catch (error) {
      console.error('Error registering advisor call:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene el historial de llamadas de un usuario
   * @param maxResults Número máximo de resultados a obtener
   * @returns Historial de llamadas con estadísticas
   */
  async getUserCallHistory(maxResults: number = 20): Promise<CallHistory> {
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      const callsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(maxResults)
      );
      
      const snapshot = await getDocs(callsQuery);
      
      // Convertir a array de llamadas
      const calls: AdvisorCall[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          userId: data.userId,
          advisorId: data.advisorId,
          advisorName: data.advisorName,
          advisorTitle: data.advisorTitle,
          duration: data.duration,
          notes: data.notes,
          topics: data.topics || [],
          timestamp: data.timestamp,
          status: data.status,
          plan: data.plan
        };
      });
      
      // Calcular estadísticas
      const totalCalls = calls.length;
      const totalDuration = calls.reduce((sum, call) => sum + call.duration, 0);
      
      return {
        calls,
        totalCalls,
        totalDuration
      };
    } catch (error) {
      console.error('Error getting user call history:', error);
      return {
        calls: [],
        totalCalls: 0,
        totalDuration: 0
      };
    }
  }
  
  /**
   * Obtiene el número de llamadas realizadas en el mes actual
   * @returns Número de llamadas del mes actual
   */
  async getCurrentMonthCallCount(): Promise<number> {
    try {
      const userId = getUserId();
      if (!userId) {
        throw new Error('User not authenticated');
      }
      
      // Calcular el primer día del mes actual
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const firstDayTimestamp = Timestamp.fromDate(firstDayOfMonth);
      
      // Consultar llamadas desde el inicio del mes
      const callsQuery = query(
        collection(db, this.COLLECTION_NAME),
        where('userId', '==', userId),
        where('timestamp', '>=', firstDayTimestamp),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(callsQuery);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting current month call count:', error);
      return 0;
    }
  }
  
  /**
   * Verifica si el usuario ha alcanzado su límite de llamadas mensuales
   * @param plan Plan de suscripción actual
   * @returns Booleano indicando si se alcanzó el límite
   */
  async hasReachedMonthlyLimit(plan: string): Promise<boolean> {
    const currentCount = await this.getCurrentMonthCallCount();
    const limit = this.getMonthlyCallLimit(plan);
    return currentCount >= limit;
  }
}

export const advisorCallService = new AdvisorCallService();