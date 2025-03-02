/**
 * PiAPI Flux Service
 * 
 * Este servicio proporciona un cliente para la API de PiAPI Flux para generar imágenes
 * con modelos avanzados como Qubico/flux1-dev y variantes.
 */

import axios from 'axios';

/**
 * Enum para los modelos soportados por PiAPI Flux
 */
export enum FluxModel {
  FLUX1_DEV = 'Qubico/flux1-dev',
  FLUX1_SCHNELL = 'Qubico/flux1-schnell',
  FLUX1_DEV_ADVANCED = 'Qubico/flux1-dev-advanced'
}

/**
 * Enum para los tipos de tareas soportados
 */
export enum FluxTaskType {
  TXT2IMG = 'txt2img',
  IMG2IMG = 'img2img',
  TXT2IMG_LORA = 'txt2img-lora',
  IMG2IMG_LORA = 'img2img-lora',
  CONTROLNET_LORA = 'controlnet-lora'
}

/**
 * Tipos de LoRA disponibles
 * Fuentes:
 * 1. XLabs-AI/flux-lora-collection en Hugging Face
 * 2. Varios modelos de Civitai adaptados para Flux
 */
export enum FluxLoraType {
  // Colección básica de XLabs-AI
  ANIME = 'anime',
  ART = 'art',
  DISNEY = 'disney',
  FURRY = 'furry',
  MJV6 = 'mjv6',
  REALISM = 'realism',
  SCENERY = 'scenery',
  
  // Modelos adicionales de Civitai y otras fuentes
  COLLAGE_ARTSTYLE = 'collage-artstyle',
  CREEPYCUTE = 'creepcute',
  CYBERPUNK_ANIME = 'cyberpunk-anime-style',
  DECO_PULSE = 'deco-pulse',
  DEEP_SEA = 'deep-sea-particle-enhencer',
  FAETASTIC = 'faetastic-details',
  FRACTAL = 'fractal-geometry',
  GALACTIXY = 'galactixy-illustrations-style',
  GEOMETRIC_WOMAN = 'geometric-woman',
  GRAPHIC_PORTRAIT = 'graphic-portrait',
  MAT_MILLER = 'mat-miller-art',
  MOEBIUS = 'moebius-style',
  ISOMETRIC = 'ob3d-isometric-3d-room',
  PAPER_QUILLING = 'paper-quilling-and-layering-style'
}

/**
 * Tipos de ControlNet disponibles
 */
export enum FluxControlNetType {
  DEPTH = 'depth',
  SOFT_EDGE = 'soft_edge',
  CANNY = 'canny',
  OPENPOSE = 'openpose'
}

/**
 * Opciones para la configuración de LoRA
 */
export interface LoraSettings {
  lora_type: FluxLoraType;
  lora_strength?: number; // Valor entre 0 y 1
}

/**
 * Opciones para la configuración de ControlNet
 */
export interface ControlNetSettings {
  control_type: FluxControlNetType;
  control_image: string; // URL de la imagen de control
  control_strength?: number; // Valor entre 0 y 1
  return_preprocessed_image?: boolean;
}

/**
 * Opciones para la generación de imágenes con texto
 */
export interface FluxTextToImageOptions {
  prompt: string;
  negative_prompt?: string;
  steps?: number; // Por defecto 28
  guidance_scale?: number; // Por defecto 2.5
  seed?: number;
  width?: number;
  height?: number;
  lora_settings?: LoraSettings[];
  control_net_settings?: ControlNetSettings[];
}

/**
 * Opciones para la generación de imágenes con imagen
 */
export interface FluxImageToImageOptions extends FluxTextToImageOptions {
  image: string; // URL de la imagen de entrada
  strength?: number; // Valor entre 0 y 1
}

/**
 * Respuesta de la API de PiAPI Flux para la creación de tareas
 */
export interface FluxTaskResponse {
  code: number;
  data: {
    task_id: string;
    model: string;
    task_type: string;
    status: string;
    input: any;
    output: any | null;
    meta: {
      account_id: number;
      account_name: string;
      created_at: string;
      started_at: string;
      completed_at: string;
    };
    detail: any | null;
    logs: any[];
    error: {
      code: number;
      message: string;
    };
  };
  message: string;
}

/**
 * Respuesta de estado de tarea de PiAPI Flux
 */
export interface FluxTaskStatusResponse {
  code: number;
  data: {
    task_id: string;
    model: string;
    task_type: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    input: any;
    output: {
      images?: string[];
    } | null;
    meta: {
      account_id: number;
      account_name: string;
      created_at: string;
      started_at: string;
      completed_at: string;
    };
    detail: any | null;
    logs: any[];
    error: {
      code: number;
      message: string;
    };
  };
  message: string;
}

/**
 * Cliente para la API de PiAPI Flux
 */
class FluxService {
  private apiKey: string;
  private baseUrl: string;
  
  constructor() {
    this.apiKey = import.meta.env.VITE_PIAPI_API_KEY || '';
    this.baseUrl = 'https://api.piapi.ai/api/v1';
  }
  
  /**
   * Verifica si la clave API está disponible
   */
  hasApiKey(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 10);
  }
  
  /**
   * Genera imagen a partir de texto
   * @param options Opciones de generación
   * @param model Modelo Flux a utilizar
   * @param taskType Tipo de tarea
   */
  async generateTextToImage(
    options: FluxTextToImageOptions,
    model: FluxModel = FluxModel.FLUX1_DEV,
    taskType: FluxTaskType = FluxTaskType.TXT2IMG
  ): Promise<FluxTaskResponse> {
    const endpoint = `${this.baseUrl}/task`;
    
    try {
      const requestData = {
        model,
        task_type: taskType,
        input: { ...options }
      };
      
      const response = await axios.post(endpoint, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error generando imagen con PiAPI Flux ${model}:`, error);
      throw error;
    }
  }
  
  /**
   * Genera imagen a partir de otra imagen
   * @param options Opciones de generación
   * @param model Modelo Flux a utilizar
   */
  async generateImageToImage(
    options: FluxImageToImageOptions,
    model: FluxModel = FluxModel.FLUX1_DEV,
    taskType: FluxTaskType = FluxTaskType.IMG2IMG
  ): Promise<FluxTaskResponse> {
    const endpoint = `${this.baseUrl}/task`;
    
    try {
      const requestData = {
        model,
        task_type: taskType,
        input: { ...options }
      };
      
      const response = await axios.post(endpoint, requestData, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error generando imagen con PiAPI Flux ${model}:`, error);
      throw error;
    }
  }
  
  /**
   * Verifica el estado de una tarea
   * @param taskId ID de la tarea
   */
  async checkTaskStatus(taskId: string): Promise<FluxTaskStatusResponse> {
    const endpoint = `${this.baseUrl}/task/${taskId}`;
    
    try {
      const response = await axios.get(endpoint, {
        headers: {
          'Accept': 'application/json',
          'X-API-Key': this.apiKey
        }
      });
      
      return response.data;
    } catch (error) {
      console.error('Error verificando estado de tarea en PiAPI Flux:', error);
      throw error;
    }
  }
}

// Exportar una instancia singleton
export const fluxService = new FluxService();

// Verificar si podemos usar la API directamente en el navegador
export function canUseFluxDirectly(): boolean {
  return fluxService.hasApiKey();
}