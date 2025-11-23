/**
 * API Pricing Configuration
 * Precios actualizados a noviembre 2025
 * Todos los precios en USD por 1K tokens
 */

export interface ModelPricing {
  inputCost: number;      // Costo por 1K input tokens
  outputCost: number;     // Costo por 1K output tokens
  costPer1MTokens?: {     // Alternativa: precio por 1M tokens
    input: number;
    output: number;
  };
}

export const API_PRICING: Record<string, Record<string, ModelPricing>> = {
  openai: {
    'gpt-4': {
      inputCost: 0.03,
      outputCost: 0.06
    },
    'gpt-4-turbo': {
      inputCost: 0.01,
      outputCost: 0.03
    },
    'gpt-4o': {
      inputCost: 0.005,
      outputCost: 0.015
    },
    'gpt-3.5-turbo': {
      inputCost: 0.0005,
      outputCost: 0.0015
    },
    'gpt-3.5-turbo-16k': {
      inputCost: 0.003,
      outputCost: 0.004
    },
    'text-davinci-003': {
      inputCost: 0.02,
      outputCost: 0.02
    },
    'text-embedding-ada-002': {
      inputCost: 0.0001,
      outputCost: 0
    }
  },
  
  gemini: {
    'gemini-2.0-flash': {
      costPer1MTokens: {
        input: 0.075,
        output: 0.3
      }
    },
    'gemini-1.5-pro': {
      costPer1MTokens: {
        input: 1.25,
        output: 5
      }
    },
    'gemini-1.5-flash': {
      costPer1MTokens: {
        input: 0.075,
        output: 0.3
      }
    },
    'gemini-1.0-pro': {
      costPer1MTokens: {
        input: 0.5,
        output: 1.5
      }
    }
  },
  
  anthropic: {
    'claude-3-opus': {
      inputCost: 0.015,
      outputCost: 0.075
    },
    'claude-3-sonnet': {
      inputCost: 0.003,
      outputCost: 0.015
    },
    'claude-3-haiku': {
      inputCost: 0.00025,
      outputCost: 0.00125
    },
    'claude-2.1': {
      inputCost: 0.008,
      outputCost: 0.024
    },
    'claude-2': {
      inputCost: 0.008,
      outputCost: 0.024
    }
  },
  
  fal: {
    // FAL cobra principalmente por inferencia, no por tokens
    // Precios varían según modelo pero usamos aproximaciones
    'fal-ai/flux-pro': {
      inputCost: 0,
      outputCost: 0.005  // ~$0.005 por imagen
    },
    'fal-ai/flux-realism': {
      inputCost: 0,
      outputCost: 0.005
    },
    'fal-ai/stable-diffusion-3-large': {
      inputCost: 0,
      outputCost: 0.003
    },
    'fal-ai/fast-sdxl': {
      inputCost: 0,
      outputCost: 0.002
    },
    'fal-ai/kling-video': {
      inputCost: 0,
      outputCost: 0.1  // Videos son más caros
    }
  },
  
  other: {
    default: {
      inputCost: 0,
      outputCost: 0
    }
  }
};

/**
 * Calcula el costo de una llamada API
 * @param provider - Proveedor de API (openai, gemini, etc)
 * @param model - Modelo específico
 * @param promptTokens - Tokens en la solicitud
 * @param completionTokens - Tokens en la respuesta
 * @returns Costo en USD
 */
export function calculateApiCost(
  provider: string,
  model: string | null | undefined,
  promptTokens: number = 0,
  completionTokens: number = 0
): number {
  try {
    const providerLower = provider.toLowerCase();
    const modelLower = (model || 'default').toLowerCase();
    
    // Obtener pricing del modelo
    let pricing = API_PRICING[providerLower]?.[modelLower];
    
    // Si no existe el modelo específico, buscar fallback
    if (!pricing) {
      // Intentar con nombre parcial
      const providerModels = API_PRICING[providerLower];
      if (providerModels) {
        const foundModel = Object.entries(providerModels).find(
          ([key]) => modelLower.includes(key.toLowerCase()) || key.toLowerCase().includes(modelLower)
        );
        if (foundModel) {
          pricing = foundModel[1];
        }
      }
    }
    
    // Si aún no hay pricing, usar default
    if (!pricing) {
      pricing = API_PRICING.other.default;
    }
    
    // Calcular costo
    let cost = 0;
    
    if (pricing.costPer1MTokens) {
      // Modelo con precios por 1M tokens
      cost = (promptTokens / 1000000) * pricing.costPer1MTokens.input +
             (completionTokens / 1000000) * pricing.costPer1MTokens.output;
    } else {
      // Modelo con precios por 1K tokens
      cost = (promptTokens / 1000) * pricing.inputCost +
             (completionTokens / 1000) * pricing.outputCost;
    }
    
    return parseFloat(cost.toFixed(8));
  } catch (error) {
    console.error('Error calculating API cost:', error);
    return 0;
  }
}

/**
 * Obtiene el pricing para un modelo específico
 */
export function getModelPricing(provider: string, model: string | null): ModelPricing | null {
  const providerLower = provider.toLowerCase();
  const modelLower = (model || 'default').toLowerCase();
  
  return API_PRICING[providerLower]?.[modelLower] || 
         API_PRICING.other.default;
}

/**
 * Formatea el costo para mostrar
 */
export function formatCost(cost: number): string {
  return `$${cost.toFixed(6)}`;
}
