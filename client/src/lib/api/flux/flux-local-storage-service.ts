/**
 * Servicio de almacenamiento local para resultados de Flux API
 * 
 * Este servicio facilita la persistencia de los resultados de la API de Flux en el almacenamiento local.
 * Permite guardar y recuperar imágenes generadas para mostrar un historial.
 */

import { ImageResult } from '@/lib/types/model-types';

// Clave para el almacenamiento local
const FLUX_RESULTS_KEY = 'flux_generation_results';

/**
 * Servicio para gestionar el almacenamiento local de resultados de Flux
 */
class FluxLocalStorageService {
  /**
   * Guarda un resultado de generación en localStorage
   * @param result Resultado a guardar
   */
  saveResult(result: ImageResult): void {
    try {
      // Obtener resultados existentes
      const existingResults = this.getResults();
      
      // Prepender el nuevo resultado al inicio del array
      const updatedResults = [result, ...existingResults];
      
      // Limitar a 20 resultados para evitar ocupar demasiado espacio
      const limitedResults = updatedResults.slice(0, 20);
      
      // Guardar en localStorage
      localStorage.setItem(FLUX_RESULTS_KEY, JSON.stringify(limitedResults));
    } catch (error) {
      console.error('Error al guardar resultado en localStorage:', error);
    }
  }
  
  /**
   * Obtiene todos los resultados guardados
   * @returns Array de resultados
   */
  getResults(): ImageResult[] {
    try {
      const storedResults = localStorage.getItem(FLUX_RESULTS_KEY);
      if (!storedResults) return [];
      
      const parsedResults = JSON.parse(storedResults);
      return Array.isArray(parsedResults) ? parsedResults : [];
    } catch (error) {
      console.error('Error al obtener resultados de localStorage:', error);
      return [];
    }
  }
  
  /**
   * Elimina un resultado específico
   * @param id ID del resultado a eliminar
   */
  deleteResult(id: string): void {
    try {
      const results = this.getResults();
      const filteredResults = results.filter(result => result.id !== id);
      localStorage.setItem(FLUX_RESULTS_KEY, JSON.stringify(filteredResults));
    } catch (error) {
      console.error('Error al eliminar resultado de localStorage:', error);
    }
  }
  
  /**
   * Limpia todos los resultados guardados
   */
  clearAllResults(): void {
    try {
      localStorage.removeItem(FLUX_RESULTS_KEY);
    } catch (error) {
      console.error('Error al limpiar resultados de localStorage:', error);
    }
  }
}

// Exportar una instancia singleton
export const fluxLocalStorageService = new FluxLocalStorageService();