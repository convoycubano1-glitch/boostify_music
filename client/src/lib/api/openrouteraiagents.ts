/**
 * OpenRouter AI Agents API Integration
 * Módulo para interactuar con agentes de IA basados en OpenRouter
 */

// Colecciones de agentes por categoría
export const AGENT_COLLECTIONS = {
  MANAGERS: 'ai-agents-managers',
  MARKETERS: 'ai-agents-marketers',
  COMPOSERS: 'ai-agents-composers',
  SOCIAL_MEDIA: 'ai-agents-social-media',
  MERCHANDISE: 'ai-agents-merchandise'
};

/**
 * Obtiene la lista de agentes de una colección específica
 * @param collectionName Nombre de la colección en Firestore
 * @returns Array de agentes
 */
export async function getAgents(collectionName: string) {
  try {
    // Importamos las funciones de Firestore de forma dinámica
    const { db } = await import('../firebase'); // Cambiado de @/firebase a ruta relativa
    const { collection, getDocs } = await import('firebase/firestore');
    
    // Obtenemos los documentos de la colección
    const querySnapshot = await getDocs(collection(db, collectionName));
    
    // Convertimos los documentos a objetos
    const agents = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return agents;
  } catch (error) {
    console.error(`Error al obtener agentes de ${collectionName}:`, error);
    return [];
  }
}