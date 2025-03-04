/**
 * Tipos para la funcionalidad de modelos de voz personalizados
 * Basados en la API de Voice Models de Revocalize
 */

// Enumera los géneros disponibles para los modelos de voz
export type VoiceModelGenre = 
  | 'pop' 
  | 'rock' 
  | 'hip-hop' 
  | 'r&b' 
  | 'country' 
  | 'jazz' 
  | 'classical' 
  | 'electronic' 
  | 'world' 
  | 'other';

// Enumera los tipos de voces disponibles
export type VoiceType = 
  | 'soprano' 
  | 'mezzo-soprano' 
  | 'alto' 
  | 'tenor' 
  | 'baritone' 
  | 'bass';

// Enumera las categorías de edad
export type AgeCategory = 
  | 'child' 
  | 'young adult' 
  | 'adult';

// Define el rango vocal
export interface VocalRange {
  min: string; // Ejemplo: 'C3'
  max: string; // Ejemplo: 'C7'
}

// Define el modelo de voz completo
export interface VoiceModel {
  id: string;
  name: string;
  gender: 'male' | 'female';
  age: AgeCategory;
  description: string;
  base_language: string; // En formato ISO 639-1
  traits: string[];
  genre: VoiceModelGenre;
  voice_type: VoiceType;
  vocal_range: VocalRange;
  isCustom?: boolean;
  isReady?: boolean;
  createdAt?: Date;
  userId?: string;
}

// Tipo para crear un nuevo modelo de voz
export interface NewVoiceModel {
  name: string;
  gender: 'male' | 'female';
  age: AgeCategory;
  description: string;
  base_language: string;
  traits: string[];
  genre: VoiceModelGenre;
  voice_type: VoiceType;
  vocal_range: VocalRange;
}

// Estado de entrenamiento del modelo
export interface TrainingStatus {
  status: 'pending' | 'training' | 'completed' | 'failed';
  model_id: string;
  current_epoch?: number;
  total_epochs?: number;
  error?: string;
  created_at?: Date;
  updated_at?: Date;
}

// Tipo para la respuesta al verificar el estado de una tarea de conversión
export interface VoiceConversionTaskStatus {
  status: 'in_progress' | 'completed' | 'failed';
  input_audio_url?: string;
  output_audio_urls?: string[];
  output_settings?: {
    model: string;
    transpose: number;
    vocal_style?: string;
  };
  error?: string;
}

// Tipo para la solicitud de conversión de audio
export interface VoiceConversionRequest {
  audio_file: File;
  model: string;
  transpose?: number;
  generations_count?: number;
}

// Tipo para la respuesta de la API al convertir audio
export interface VoiceConversionResponse {
  task_id: string;
}