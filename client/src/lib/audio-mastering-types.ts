/**
 * Tipos compartidos para el sistema de audio mastering
 * Este archivo resuelve dependencias circulares al definir tipos
 * que pueden ser importados sin crear ciclos
 */

import { Timestamp } from "firebase/firestore";

/**
 * Interfaz para las configuraciones de conversión de voz
 */
export interface VoiceConversionSettings {
  conversionStrength?: number;
  modelVolumeMix?: number;
  pitchShift?: number;
  usePreprocessing?: boolean;
  usePostprocessing?: boolean;
}

/**
 * Interfaz para los registros de conversión de voz en Firestore
 */
export interface VoiceConversionRecord {
  id?: string;
  userId: string;
  fileName: string;
  modelId: number;
  modelName?: string;
  originalFileUrl: string;
  resultFileUrl?: string | null;
  createdAt: Timestamp;
  completedAt?: Timestamp | null;
  status: 'pending' | 'processing' | 'running' | 'completed' | 'failed';
  progress?: number;
  duration?: string;
  settings?: VoiceConversionSettings;
}

/**
 * Interfaz para los modelos de voz disponibles
 */
export interface VoiceModel {
  id: number;
  name: string;
  description: string;
  previewUrl?: string;
}

/**
 * Tipo para los datos simulados
 */
export interface MockVoiceData {
  id: string;
  userId: string;
  fileName: string;
  modelId: number;
  modelName: string;
  originalFileUrl: string;
  resultFileUrl: string | null;
  createdAt: Timestamp;
  completedAt: Timestamp | null;
  status: 'pending' | 'processing' | 'running' | 'completed' | 'failed';
  settings: VoiceConversionSettings;
  progress: number;
  duration: string;
}