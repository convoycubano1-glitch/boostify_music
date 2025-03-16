/**
 * Servicio para manejar las llamadas a los asesores AI
 * Gestiona el registro de llamadas, historial y restricciones por suscripción
 */

import { db, auth } from '../../firebase';
import { 
  collection, 
  addDoc, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp, 
  Timestamp,
  DocumentData 
} from 'firebase/firestore';

// Interfaz para los datos de un asesor
export interface Advisor {
  id: string;
  name: string;
  title: string;
  description: string;
  phoneNumber: string;
  color: string;
}

// Interfaz para el registro de una llamada
export interface AdvisorCall {
  id?: string;
  advisorId: string;
  advisorName: string;
  advisorTitle: string;
  userId: string;
  userEmail?: string;
  timestamp: Date | Timestamp;
  duration: number;   // Duración en segundos
  notes?: string;
  topics?: string[];
  plan: string;       // Plan del usuario al momento de la llamada (free, basic, pro, premium)
  status: 'completed' | 'cancelled' | 'failed';
}

// Interfaz para el historial de llamadas
export interface CallHistory {
  calls: AdvisorCall[];
  totalCalls: number;
  callsByAdvisor: Record<string, number>;
  totalDuration: number;
}

// Colección en Firestore
const COLLECTION_NAME = 'advisor_calls';

/**
 * Servicio de llamadas a asesores
 * Proporciona métodos para registrar, consultar y gestionar las llamadas a los asesores IA
 */
class AdvisorCallService {
  /**
   * Registra una nueva llamada a un asesor en Firestore
   * @param advisor El asesor contactado
   * @param duration Duración de la llamada en segundos
   * @param notes Notas opcionales sobre la llamada
   * @param topics Temas tratados en la llamada
   * @param status Estado final de la llamada
   * @param plan Plan del usuario al momento de la llamada
   * @returns El ID del documento creado
   */
  async registerCall(
    advisor: Advisor, 
    duration: number = 0,
    notes: string = '',
    topics: string[] = [],
    status: 'completed' | 'cancelled' | 'failed' = 'completed',
    plan: string = 'free'
  ): Promise<string | null> {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        console.error('No user authenticated');
        return null;
      }
      
      const callData: Omit<AdvisorCall, 'id'> = {
        advisorId: advisor.id,
        advisorName: advisor.name,
        advisorTitle: advisor.title,
        userId: user.uid,
        userEmail: user.email || undefined,
        timestamp: serverTimestamp() as Timestamp,
        duration,
        notes,
        topics,
        status,
        plan
      };
      
      const docRef = await addDoc(collection(db, COLLECTION_NAME), callData);
      console.log(`Call registered with ID: ${docRef.id}`);
      
      return docRef.id;
    } catch (error) {
      console.error('Error registering advisor call:', error);
      return null;
    }
  }
  
  /**
   * Obtiene el historial de llamadas del usuario actual
   * @param limit Límite de resultados (default: 50)
   * @returns Historial de llamadas del usuario
   */
  async getUserCallHistory(resultLimit: number = 50): Promise<CallHistory> {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        console.error('No user authenticated');
        return { calls: [], totalCalls: 0, callsByAdvisor: {}, totalDuration: 0 };
      }
      
      const callsQuery = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', user.uid),
        orderBy('timestamp', 'desc'),
        limit(resultLimit)
      );
      
      const querySnapshot = await getDocs(callsQuery);
      
      // Transformar documentos a objetos AdvisorCall
      const calls: AdvisorCall[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp // Mantener Timestamp para serialización
      } as AdvisorCall));
      
      // Calcular estadísticas
      const callsByAdvisor: Record<string, number> = {};
      let totalDuration = 0;
      
      calls.forEach(call => {
        // Contar llamadas por asesor
        callsByAdvisor[call.advisorId] = (callsByAdvisor[call.advisorId] || 0) + 1;
        
        // Sumar duración total
        totalDuration += call.duration;
      });
      
      return {
        calls,
        totalCalls: calls.length,
        callsByAdvisor,
        totalDuration
      };
    } catch (error) {
      console.error('Error getting user call history:', error);
      return { calls: [], totalCalls: 0, callsByAdvisor: {}, totalDuration: 0 };
    }
  }
  
  /**
   * Verifica si el usuario ha alcanzado el límite de llamadas según su plan
   * @param planId ID del plan del usuario (free, basic, pro, premium)
   * @returns Si el usuario ha alcanzado el límite
   */
  async hasReachedCallLimit(planId: string = 'free'): Promise<boolean> {
    try {
      const user = auth.currentUser;
      
      if (!user) {
        console.error('No user authenticated');
        return true; // Si no hay usuario, considerar que se alcanzó el límite
      }
      
      // Límites de llamadas mensuales por plan
      const monthlyLimits: Record<string, number> = {
        free: 3,      // 3 llamadas al mes en plan gratuito
        basic: 10,    // 10 llamadas al mes en plan básico
        pro: 30,      // 30 llamadas al mes en plan pro
        premium: 100  // 100 llamadas al mes en plan premium
      };
      
      // Si el plan no tiene límite definido, usar el de free
      const limit = monthlyLimits[planId] || monthlyLimits.free;
      
      // Calcular fecha de inicio del mes actual
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startTimestamp = Timestamp.fromDate(startOfMonth);
      
      // Contar llamadas de este mes
      const callsQuery = query(
        collection(db, COLLECTION_NAME),
        where('userId', '==', user.uid),
        where('timestamp', '>=', startTimestamp)
      );
      
      const querySnapshot = await getDocs(callsQuery);
      const monthlyCallCount = querySnapshot.docs.length;
      
      return monthlyCallCount >= limit;
    } catch (error) {
      console.error('Error checking call limit:', error);
      return true; // En caso de error, considerar que se alcanzó el límite
    }
  }
  
  /**
   * Obtiene el límite de llamadas mensuales según el plan
   * @param planId ID del plan
   * @returns Límite de llamadas mensuales
   */
  getMonthlyCallLimit(planId: string = 'free'): number {
    const monthlyLimits: Record<string, number> = {
      free: 3,
      basic: 10,
      pro: 30,
      premium: 100
    };
    
    return monthlyLimits[planId] || monthlyLimits.free;
  }
  
  /**
   * Obtiene estadísticas de uso de los asesores por todos los usuarios
   * Solo disponible para administradores
   * @returns Estadísticas globales de uso
   */
  async getGlobalUsageStats(): Promise<any> {
    try {
      const user = auth.currentUser;
      
      if (!user?.email || user.email !== 'convoycubano@gmail.com') {
        console.error('Unauthorized: Only admin can access global stats');
        return null;
      }
      
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
      
      const calls = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Estadísticas por asesor
      const statsByAdvisor: Record<string, { calls: number, totalDuration: number }> = {};
      
      // Estadísticas por plan
      const statsByPlan: Record<string, { users: Set<string>, calls: number }> = {
        free: { users: new Set(), calls: 0 },
        basic: { users: new Set(), calls: 0 },
        pro: { users: new Set(), calls: 0 },
        premium: { users: new Set(), calls: 0 }
      };
      
      // Calcular estadísticas
      calls.forEach((call: any) => {
        // Estadísticas por asesor
        if (!statsByAdvisor[call.advisorId]) {
          statsByAdvisor[call.advisorId] = { calls: 0, totalDuration: 0 };
        }
        statsByAdvisor[call.advisorId].calls += 1;
        statsByAdvisor[call.advisorId].totalDuration += call.duration || 0;
        
        // Estadísticas por plan
        const plan = call.plan || 'free';
        if (statsByPlan[plan]) {
          statsByPlan[plan].calls += 1;
          statsByPlan[plan].users.add(call.userId);
        }
      });
      
      // Convertir Sets a counts para serialización
      const planStats = Object.entries(statsByPlan).reduce((acc, [plan, data]) => {
        acc[plan] = {
          uniqueUsers: data.users.size,
          totalCalls: data.calls
        };
        return acc;
      }, {} as Record<string, { uniqueUsers: number, totalCalls: number }>);
      
      return {
        totalCalls: calls.length,
        advisorStats: statsByAdvisor,
        planStats
      };
    } catch (error) {
      console.error('Error getting global usage stats:', error);
      return null;
    }
  }
}

// Exportar una instancia del servicio
export const advisorCallService = new AdvisorCallService();