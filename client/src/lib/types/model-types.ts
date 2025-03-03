/**
 * Type definitions for AI model options and parameters
 * This provides a centralized definition for the various model interfaces
 */

import { FreepikModel, FreepikAspectRatio } from '@/lib/api/freepik-service';
import { FluxModel, FluxLoraType, FluxControlNetType, FluxTaskType } from '@/lib/api/flux/flux-service';

/**
 * Base options for Freepik AI image generation requests
 */
export interface FreepikBaseOptions {
  prompt: string;
  aspect_ratio?: FreepikAspectRatio;
}

/**
 * Options specific to the Freepik Mystic AI model
 */
export interface FreepikMysticOptions extends FreepikBaseOptions {
  resolution: '4k' | '2k';
  realism: boolean;
  creative_detailing: number;
  engine: 'automatic' | 'magnific_illusio' | 'magnific_sharpy' | 'magnific_sparkle';
  fixed_generation: boolean;
  filter_nsfw: boolean;
}

/**
 * Options specific to the Freepik Imagen3 AI model
 */
export interface FreepikImagen3Options extends FreepikBaseOptions {
  negative_prompt?: string;
  style_preset?: string;
  num_images?: number;
}

/**
 * Options specific to the Freepik Classic AI model
 */
export interface FreepikClassicOptions extends FreepikBaseOptions {
  negative_prompt?: string;
  guidance_scale: number;
  num_images: number;
  seed: number;
}

/**
 * Options specific to the Freepik FluxDev AI model
 */
export interface FreepikFluxDevOptions extends FreepikBaseOptions {
  resolution: 'high' | 'medium' | 'low';
  style_preset?: string;
  seed?: number;
}

/**
 * Type guard for checking if a value is a valid FreepikModel
 * @param value Value to check
 * @returns Boolean indicating if the value is a valid FreepikModel
 */
export function isValidFreepikModel(value: any): value is FreepikModel {
  return Object.values(FreepikModel).includes(value);
}

/**
 * Type guard for checking if a value is a valid FreepikAspectRatio
 * @param value Value to check
 * @returns Boolean indicating if the value is a valid FreepikAspectRatio
 */
export function isValidFreepikAspectRatio(value: any): value is FreepikAspectRatio {
  const validRatios: FreepikAspectRatio[] = [
    'square_1_1', 'classic_4_3', 'traditional_3_4', 'widescreen_16_9',
    'social_story_9_16', 'smartphone_horizontal_20_9', 'smartphone_vertical_9_20',
    'standard_3_2', 'portrait_2_3', 'horizontal_2_1', 'vertical_1_2',
    'social_5_4', 'social_post_4_5'
  ];
  
  return validRatios.includes(value as FreepikAspectRatio);
}

/**
 * Type guard for Freepik person generation option
 * @param value Value to check
 * @returns Boolean indicating if the value is a valid person generation option
 */
export function isValidPersonGeneration(value: any): value is 'dont_allow' | 'allow_adult' | 'allow_all' {
  return ['dont_allow', 'allow_adult', 'allow_all'].includes(value);
}

/**
 * Type guard for Freepik safety settings option
 * @param value Value to check
 * @returns Boolean indicating if the value is a valid safety settings option
 */
export function isValidSafetySettings(value: any): value is 'block_low_and_above' | 'block_medium_and_above' | 'block_only_high' | 'block_none' {
  return ['block_low_and_above', 'block_medium_and_above', 'block_only_high', 'block_none'].includes(value);
}

/**
 * Type guard for checking if a value is a valid FluxModel
 * @param value Value to check
 * @returns Boolean indicating if the value is a valid FluxModel
 */
export function isValidFluxModel(value: any): value is FluxModel {
  return Object.values(FluxModel).includes(value);
}

/**
 * Type guard for checking if a value is a valid FluxLoraType
 * @param value Value to check
 * @returns Boolean indicating if the value is a valid FluxLoraType
 */
export function isValidFluxLoraType(value: any): value is FluxLoraType {
  return Object.values(FluxLoraType).includes(value);
}

/**
 * Type guard for checking if a value is a valid FluxTaskType
 * @param value Value to check
 * @returns Boolean indicating if the value is a valid FluxTaskType
 */
export function isValidFluxTaskType(value: any): value is FluxTaskType {
  return Object.values(FluxTaskType).includes(value);
}

/**
 * Type definitions for various generation parameters
 */
export interface GenerationOptions {
  prompt: string;
  modelType?: string;
  negativePrompt?: string;
  imageCount?: number;
  imageSize?: string;
}

/**
 * Type for API providers
 */
export type ApiProvider = 'fal' | 'luma' | 'freepik' | 'kling' | 'flux' | 'piapi';

/**
 * Parameters for image generation with specific providers
 */
export interface GenerateImageParams {
  prompt: string;
  apiProvider: ApiProvider;
  negativePrompt?: string;
  aspectRatio?: string;
  imageCount?: number;
  imageSize?: string;
  modelType?: string;
  useDirectApi?: boolean;
  freepikModel?: FreepikModel;
  fluxModel?: FluxModel;
  loraType?: FluxLoraType;
  loraStrength?: number;
  controlNetType?: FluxControlNetType;
  controlNetImage?: string;
  controlNetStrength?: number;
}

/**
 * Opciones para los modelos de generación de video en Hailuo/PiAPI
 * Estos son los modelos disponibles para el endpoint de video_generation
 */
export enum PiapiVideoModel {
  I2V_01 = 'i2v-01',              // Image to Video
  I2V_01_LIVE = 'i2v-01-live',    // Image to Video (live version)
  T2V_01 = 't2v-01',              // Text to Video
  T2V_01_DIRECTOR = 't2v-01-director', // Text to Video con Director Mode
  S2V_01 = 's2v-01'               // Subject Reference Video
}

/**
 * Tipos de movimientos de cámara disponibles para el modelo t2v-01-director
 * Se permiten hasta 3 movimientos por prompt
 */
export enum CameraMovementType {
  // Movimientos básicos
  TRUCK_LEFT = 'Truck left',
  TRUCK_RIGHT = 'Truck right',
  PAN_LEFT = 'Pan left',
  PAN_RIGHT = 'Pan right',
  PUSH_IN = 'Push in',
  PUSH_OUT = 'Push out',
  PEDESTAL_UP = 'Pedestal up',
  PEDESTAL_DOWN = 'Pedestal down',
  TILT_UP = 'Tilt up',
  TILT_DOWN = 'Tilt down',
  ZOOM_IN = 'Zoom in',
  ZOOM_OUT = 'Zoom out',
  SHAKE = 'Shake',
  TRACKING_SHOT = 'Tracking shot',
  // Movimiento especial
  STATIC_SHOT = 'Static shot'  // Es mutuamente exclusivo con otros movimientos
}

/**
 * Parameters for video generation
 */
export interface VideoGenerationParams {
  prompt: string;
  duration?: number;
  style?: string;
  imageCount?: number;
  apiProvider: ApiProvider;
  useDirectApi?: boolean;
  // Parámetros específicos para PiAPI
  piapiModel?: PiapiVideoModel;
  image_url?: string;           // Requerido para modelos i2v-01, i2v-01-live y s2v-01
  cameraMovements?: CameraMovementType[];  // Para t2v-01-director
  expand_prompt?: boolean;      // Si se debe expandir el prompt automáticamente
}

/**
 * Result of image generation operations
 */
export interface ImageResult {
  url: string;
  provider: string;
  requestId?: string;
  taskId?: string;
  status?: string;
  prompt: string;
  createdAt: Date;
  firestoreId?: string; // ID de referencia en Firestore cuando se guarda
}

/**
 * Result of video generation operations
 */
export interface VideoResult {
  url: string;
  provider: string;
  requestId?: string;
  taskId?: string;
  status?: string;
  prompt: string;
  createdAt: Date;
  progress?: number;  // Porcentaje de progreso para tareas asíncronas
  firestoreId?: string; // ID de referencia en Firestore cuando se guarda
}