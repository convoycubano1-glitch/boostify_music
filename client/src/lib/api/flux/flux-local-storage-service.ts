/**
 * Flux Local Storage Service
 * 
 * Este servicio proporciona funcionalidades de almacenamiento local para imágenes
 * generadas con PiAPI Flux. Esto evita problemas de permisos con Firestore.
 */

import { ImageResult } from '../../types/model-types';

// Clave para el almacenamiento de imágenes Flux en localStorage
const FLUX_IMAGES_STORAGE_KEY = 'flux_generated_images';

/**
 * Servicio de almacenamiento local para imágenes generadas por Flux
 */
class FluxLocalStorageService {
  /**
   * Guarda una imagen generada en localStorage
   * @param image Imagen a guardar
   * @returns ID generado para la imagen guardada
   */
  saveImage(image: ImageResult): string {
    try {
      // Cargar imágenes existentes
      const existingImages = this.getImages();
      
      // Generar ID único para esta imagen
      const imageId = `local_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
      
      // Añadir ID a la imagen
      const imageWithId: ImageResult = {
        ...image,
        firestoreId: imageId // Reusamos el mismo campo aunque sea localStorage
      };
      
      // Añadir al inicio del array (las más recientes primero)
      const updatedImages = [imageWithId, ...existingImages];
      
      // Guardar en localStorage
      localStorage.setItem(FLUX_IMAGES_STORAGE_KEY, JSON.stringify(updatedImages));
      
      console.log('Flux image saved to localStorage:', imageId);
      return imageId;
    } catch (error) {
      console.error('Error saving Flux image to localStorage:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene todas las imágenes guardadas en localStorage
   * @returns Array de imágenes guardadas
   */
  getImages(): ImageResult[] {
    try {
      // Intentar obtener desde localStorage
      const storedData = localStorage.getItem(FLUX_IMAGES_STORAGE_KEY);
      
      if (!storedData) {
        return [];
      }
      
      // Parsear los datos guardados
      const parsedData = JSON.parse(storedData);
      
      // Convertir las fechas de string a Date
      return parsedData.map((image: any) => ({
        ...image,
        createdAt: new Date(image.createdAt)
      }));
    } catch (error) {
      console.error('Error getting Flux images from localStorage:', error);
      return [];
    }
  }
  
  /**
   * Busca una imagen por su URL
   * @param url URL de la imagen a buscar
   * @returns La imagen si se encuentra, o null si no existe
   */
  findImageByUrl(url: string): ImageResult | null {
    const images = this.getImages();
    return images.find(image => image.url === url) || null;
  }
  
  /**
   * Busca una imagen por su taskId
   * @param taskId ID de la tarea de Flux
   * @returns La imagen si se encuentra, o null si no existe
   */
  findImageByTaskId(taskId: string): ImageResult | null {
    const images = this.getImages();
    return images.find(image => image.taskId === taskId) || null;
  }
  
  /**
   * Comprueba si una imagen está guardada por su URL
   * @param url URL de la imagen a comprobar
   * @returns true si está guardada, false si no
   */
  isImageSaved(url: string): boolean {
    return this.findImageByUrl(url) !== null;
  }
  
  /**
   * Borra todas las imágenes guardadas en localStorage
   */
  clearAllImages(): void {
    localStorage.removeItem(FLUX_IMAGES_STORAGE_KEY);
  }
}

export const fluxLocalStorageService = new FluxLocalStorageService();