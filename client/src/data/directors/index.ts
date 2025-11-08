/**
 * Directores de Videos Musicales con Perfiles Detallados
 * 
 * Este módulo exporta todos los perfiles de directores disponibles.
 * Cada director tiene un JSON completo con su estilo, técnicas, preferencias, etc.
 */

import type { DirectorProfile } from './director-schema';

// Import JSON files
import sofiaRamirezData from './sofia-ramirez.json';
import marcusChenData from './marcus-chen.json';
import isabellaMorettiData from './isabella-moretti.json';

// Export typed director profiles
export const DIRECTORS: DirectorProfile[] = [
  sofiaRamirezData as DirectorProfile,
  marcusChenData as DirectorProfile,
  isabellaMorettiData as DirectorProfile,
];

// Export individual directors for direct access
export const SOFIA_RAMIREZ = sofiaRamirezData as DirectorProfile;
export const MARCUS_CHEN = marcusChenData as DirectorProfile;
export const ISABELLA_MORETTI = isabellaMorettiData as DirectorProfile;

/**
 * Get director by ID
 * @param id Director ID
 * @returns DirectorProfile or undefined
 */
export function getDirectorById(id: string): DirectorProfile | undefined {
  return DIRECTORS.find(director => director.id === id);
}

/**
 * Get director by name
 * @param name Director name
 * @returns DirectorProfile or undefined
 */
export function getDirectorByName(name: string): DirectorProfile | undefined {
  return DIRECTORS.find(director => director.name.toLowerCase() === name.toLowerCase());
}

/**
 * Get all directors
 * @returns Array of all DirectorProfiles
 */
export function getAllDirectors(): DirectorProfile[] {
  return DIRECTORS;
}

// Export types
export type { DirectorProfile };
