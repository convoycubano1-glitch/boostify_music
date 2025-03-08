import axios from 'axios';
import { db } from '@/lib/firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp, Timestamp } from 'firebase/firestore';
import { env } from '@/env';

// Función para obtener la clave API de diferentes fuentes
function getAPIKey() {
  if (typeof window !== 'undefined') {
    // Verificar secretos en el navegador
    if (import.meta.env.VITE_OPENROUTER_API_KEY) {
      return import.meta.env.VITE_OPENROUTER_API_KEY;
    }
  }
  
  // Verificar en process.env (útil para desarrollo y entornos Node.js)
  if (process.env.OPENROUTER_API_KEY) {
    return process.env.OPENROUTER_API_KEY;
  }
  
  return null;
}

// Obtenemos la clave API de OpenRouter
const OPEN_ROUTER_API_KEY = getAPIKey();
const OPEN_ROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// Colecciones de Firestore para cada tipo de agente
export const AGENT_COLLECTIONS: Record<string, string> = {
  composer: 'AI_Music_Composer',
  videoDirector: 'Video_Director_AI',
  marketing: 'Strategic_Marketing_AI',
  socialMedia: 'Social_Media_AI',
  merchandiseDesigner: 'Merchandise_Designer_AI',
  manager: 'Manager_AI',
  customerService: 'Customer_Service_AI'
};

export class OpenRouterService {
  private static instance: OpenRouterService;

  private constructor() {
    console.log("OpenRouter Service initialized");
  }

  public static getInstance(): OpenRouterService {
    if (!OpenRouterService.instance) {
      OpenRouterService.instance = new OpenRouterService();
    }
    return OpenRouterService.instance;
  }

  async chatWithAgent(
    prompt: string,
    agentType: string,
    userId: string,
    systemInstruction: string,
    conversationContext?: { role: string; content: string }[]
  ): Promise<{ id: string; response: string; timestamp: Date }> {
    if (!OPEN_ROUTER_API_KEY) {
      throw new Error('OpenRouter API key is not configured correctly');
    }

    try {
      console.log('Sending request to OpenRouter with prompt:', prompt);

      const config = {
        headers: {
          'Authorization': `Bearer ${OPEN_ROUTER_API_KEY.trim()}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'AI Agents Orchestra'
        }
      };

      // Build messages array with conversation context if available
      const messages = [
        { role: 'system', content: systemInstruction }
      ];
      
      // Add conversation context messages if provided
      if (conversationContext && conversationContext.length > 0) {
        messages.push(...conversationContext);
      } else {
        // If no context, just add the current prompt
        messages.push({ role: 'user', content: prompt });
      }
      
      // Ensure the latest user message is included if not already
      if (!conversationContext || 
          conversationContext.length === 0 || 
          conversationContext[conversationContext.length - 1].content !== prompt) {
        messages.push({ role: 'user', content: prompt });
      }
      
      const requestBody = {
        model: 'anthropic/claude-3-sonnet',
        messages: messages,
        temperature: 0.7,
        max_tokens: 2000
      };

      console.log('OpenRouter request config:', config);
      console.log('OpenRouter request body:', requestBody);

      const response = await axios.post(
        OPEN_ROUTER_API_URL,
        requestBody,
        config
      );

      const result = response.data.choices[0].message.content;
      console.log(`OpenRouter response for ${agentType}:`, result);

      try {
        // Determinar la colección de Firestore según el tipo de agente
        const collectionName = AGENT_COLLECTIONS[agentType] || `AI_${agentType}_Agent`;
        
        // Datos comunes para todos los agentes
        const baseData = {
          userId: userId || 'anonymous',
          prompt,
          timestamp: serverTimestamp(),
          created: new Date().toISOString(),
          metadata: {
            model: 'anthropic/claude-3-sonnet',
            temperature: 0.7,
            systemInstruction
          }
        };
        
        // Datos específicos según el tipo de agente
        let specificData = {};
        let logMessage = '';
        
        switch(agentType) {
          case 'videoDirector':
            specificData = {
              script: result,
              format: {
                sections: [
                  'Scene Breakdown',
                  'Visual Direction',
                  'Camera Movements',
                  'Special Effects',
                  'Narrative Elements'
                ],
                version: '1.0'
              }
            };
            logMessage = 'Script saved to Video_Director_AI collection';
            break;
            
          case 'marketing':
            specificData = {
              strategy: result,
              format: {
                sections: [
                  'Campaign Strategy',
                  'Content Calendar',
                  'Budget Allocation',
                  'KPIs and Metrics',
                  'Growth Projections'
                ],
                version: '1.0'
              }
            };
            logMessage = 'Strategy saved to Strategic_Marketing_AI collection';
            break;
            
          case 'socialMedia':
            specificData = {
              content: result,
              format: {
                sections: [
                  'Content Strategy',
                  'Post Schedule',
                  'Hashtag Strategy',
                  'Engagement Tactics',
                  'Performance Metrics'
                ],
                version: '1.0'
              }
            };
            logMessage = 'Content saved to Social_Media_AI collection';
            break;
            
          case 'merchandiseDesigner':
            specificData = {
              design: result,
              format: {
                sections: [
                  'Design Concept',
                  'Product Type',
                  'Color Scheme',
                  'Typography',
                  'Visual Elements',
                  'Placement Details'
                ],
                version: '1.0'
              }
            };
            logMessage = 'Design saved to Merchandise_Designer_AI collection';
            break;
            
          case 'manager':
            specificData = {
              advice: result,
              format: {
                sections: [
                  'Career Analysis',
                  'Industry Insights',
                  'Professional Development',
                  'Networking Strategy',
                  'Action Items'
                ],
                version: '1.0'
              }
            };
            logMessage = 'Advice saved to Manager_AI collection';
            break;
            
          case 'customerService':
            specificData = {
              response: result
            };
            logMessage = 'Conversation saved to Customer_Service_AI collection';
            break;
            
          case 'composer':
            specificData = {
              composition: result,
              format: {
                sections: [
                  'Lyrics',
                  'Musical Structure',
                  'Arrangement',
                  'Instrumentation',
                  'Performance Notes'
                ],
                version: '1.0'
              }
            };
            logMessage = 'Composition saved to AI_Music_Composer collection';
            break;
            
          default:
            specificData = {
              response: result
            };
            logMessage = `Response saved to ${collectionName} collection`;
        }
        
        // Combinar datos base con datos específicos
        const documentData = {
          ...baseData,
          ...specificData
        };
        
        // Guardar en Firestore
        const collectionRef = collection(db, collectionName);
        const docRef = await addDoc(collectionRef, documentData);
        
        console.log(logMessage, `with ID: ${docRef.id}`);
        
      } catch (error) {
        console.error('Error saving to Firestore:', error);
        // No propagamos el error para que no afecte la funcionalidad principal
      }
      
      // Return formatted response with id and timestamp
      return {
        id: Date.now().toString(),
        response: result,
        timestamp: new Date()
      };
    } catch (error: any) {
      console.error(`Error in OpenRouter chat for ${agentType}:`, {
        message: error.message,
        response: error.response?.data
      });
      
      // Crear una respuesta amigable en caso de error
      let errorMessage = "Lo siento, actualmente estoy teniendo problemas para procesar tu solicitud. ";
      
      if (error.response) {
        // Error específico de la API
        if (error.response.status === 401) {
          errorMessage += "Parece que hay un problema con la autenticación de nuestra API. Esto ha sido registrado y nuestro equipo está trabajando en ello.";
        } else if (error.response.status === 429) {
          errorMessage += "Hemos alcanzado el límite de solicitudes a nuestra API. Por favor, inténtalo de nuevo en unos momentos.";
        } else if (error.response.status >= 500) {
          errorMessage += "Los servidores de nuestra AI están experimentando problemas. Por favor, inténtalo de nuevo más tarde.";
        }
      } else if (error.request) {
        // Error de red (sin respuesta)
        errorMessage += "No se pudo establecer conexión con nuestros servicios de IA. Por favor, verifica tu conexión a internet e inténtalo de nuevo.";
      } else {
        // Error general
        errorMessage += "Ha ocurrido un error inesperado. Nuestro equipo ha sido notificado.";
      }
      
      // Devolver una respuesta de error amigable en lugar de lanzar una excepción
      return {
        id: Date.now().toString(),
        response: errorMessage,
        timestamp: new Date()
      };
    }
  }
}

export const openRouterService = OpenRouterService.getInstance();