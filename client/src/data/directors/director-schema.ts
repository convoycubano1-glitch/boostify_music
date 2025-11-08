/**
 * Schema TypeScript para Directores de Videos Musicales
 * Define la estructura completa del perfil de cada director
 */

export interface DirectorProfile {
  // Información básica
  id: string;
  name: string;
  bio: string;
  specialty: string;
  experience: string;
  rating: number;
  
  // Estilo visual
  visual_style: {
    description: string;
    signature_techniques: string[];
    color_palette: {
      primary_colors: string[];
      accent_colors: string[];
      mood: string;
    };
    influences: string[];
  };
  
  // Preferencias de cámara
  camera_preferences: {
    favorite_lenses: string[];
    favorite_shot_types: string[];
    favorite_movements: string[];
    shot_composition: string;
    aspect_ratio: string;
    camera_notes: string;
  };
  
  // Estilo de iluminación
  lighting_style: {
    preferred_lighting: string[];
    color_temperature: string;
    key_techniques: string[];
    mood_lighting: string;
  };
  
  // Estilo de edición
  editing_style: {
    pace: string;
    transitions: string[];
    average_shot_length: string;
    rhythm_approach: string;
  };
  
  // Narrativa y storytelling
  storytelling: {
    narrative_approach: string;
    preferred_themes: string[];
    performance_vs_broll_ratio: string;
    symbolism_level: string;
  };
  
  // Post-producción
  post_production: {
    color_grading_style: string;
    vfx_approach: string;
    preferred_effects: string[];
  };
  
  // Obras icónicas (para referencia)
  iconic_videos: Array<{
    title: string;
    artist: string;
    year: number;
    key_techniques: string[];
  }>;
  
  // Referencias y consejos para el AI
  ai_generation_notes: {
    key_priorities: string[];
    avoid: string[];
    emphasis: string[];
  };
}
