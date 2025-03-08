/**
 * Utilidades para procesamiento y conversión de imágenes
 * 
 * Este módulo proporciona funciones para validar, convertir y optimizar imágenes
 * para cumplir con los requisitos específicos de APIs como Kling.
 */

/**
 * Interfaz para el resultado del procesamiento de imagen
 */
export interface ImageProcessingResult {
  isValid: boolean;
  processedImage?: string;
  width?: number;
  height?: number;
  errorMessage?: string;
}

/**
 * Verifica si una imagen cumple con los requisitos de la API de Kling
 * 
 * @param imageDataUrl URL de datos de la imagen (data URL)
 * @returns Objeto con resultado de validación
 */
export function validateImageForKling(imageDataUrl: string): ImageProcessingResult {
  // Verificar si tenemos una imagen
  if (!imageDataUrl) {
    return {
      isValid: false,
      errorMessage: 'No se proporcionó imagen'
    };
  }

  // Verificar si es una data URL de imagen
  if (!imageDataUrl.startsWith('data:image/')) {
    return {
      isValid: false,
      errorMessage: 'Formato inválido: la imagen debe estar en formato data:image/...'
    };
  }

  // Verificar si es JPEG
  const isJpeg = imageDataUrl.startsWith('data:image/jpeg') || imageDataUrl.startsWith('data:image/jpg');
  if (!isJpeg) {
    return {
      isValid: false,
      errorMessage: 'Solo se aceptan imágenes JPEG. Por favor, convierte la imagen antes de subirla.'
    };
  }

  // Verifica si tiene el formato de encabezado correcto
  if (!imageDataUrl.startsWith('data:image/jpeg;base64,')) {
    // Intentamos normalizar el encabezado
    try {
      const base64Data = imageDataUrl.split(',')[1];
      if (!base64Data) {
        return {
          isValid: false,
          errorMessage: 'Formato inválido: no se pudieron extraer los datos base64'
        };
      }
      
      // Reconstruir con el encabezado correcto
      const normalizedUrl = 'data:image/jpeg;base64,' + base64Data;
      return {
        isValid: true,
        processedImage: normalizedUrl
      };
    } catch (error) {
      console.error('Error al normalizar encabezado:', error);
      return {
        isValid: false,
        errorMessage: 'Error al procesar el formato de la imagen'
      };
    }
  }

  // Si ya tiene el formato correcto
  return {
    isValid: true,
    processedImage: imageDataUrl
  };
}

/**
 * Convierte una imagen a formato JPEG con encabezado específico para Kling
 * 
 * @param imageDataUrl URL de datos de la imagen original (cualquier formato)
 * @returns Promesa con el resultado del procesamiento
 */
export function convertToKlingFormatJpeg(imageDataUrl: string): Promise<ImageProcessingResult> {
  return new Promise((resolve) => {
    // Si no hay imagen o no es una data URL, rechazar
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
      resolve({
        isValid: false,
        errorMessage: 'Imagen inválida'
      });
      return;
    }

    // Si ya es JPEG con el encabezado correcto, verificar solo dimensiones
    if (imageDataUrl.startsWith('data:image/jpeg;base64,')) {
      // Verificar dimensiones
      checkImageDimensions(imageDataUrl)
        .then(result => {
          if (result.isValid) {
            resolve({
              isValid: true,
              processedImage: imageDataUrl,
              width: result.width,
              height: result.height
            });
          } else {
            resolve(result);
          }
        })
        .catch(error => {
          console.error('Error al verificar dimensiones:', error);
          resolve({
            isValid: false,
            errorMessage: 'Error al verificar dimensiones de la imagen'
          });
        });
      return;
    }

    // Para otros formatos, convertir a JPEG
    const img = new Image();
    img.onload = () => {
      try {
        // Obtener dimensiones
        const { width, height } = img;
        
        // Verificar dimensiones según requisitos de Kling
        const shortSide = Math.min(width, height);
        const longSide = Math.max(width, height);
        
        if (shortSide < 512) {
          resolve({
            isValid: false,
            width,
            height,
            errorMessage: `Imagen demasiado pequeña: lado corto ${shortSide}px (mínimo: 512px)`
          });
          return;
        }
        
        if (longSide > 4096) {
          resolve({
            isValid: false,
            width,
            height,
            errorMessage: `Imagen demasiado grande: lado largo ${longSide}px (máximo: 4096px)`
          });
          return;
        }

        // Crear un canvas para convertir la imagen
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        
        // Dibujar la imagen en el canvas
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve({
            isValid: false,
            errorMessage: 'Error al crear contexto de canvas para conversión'
          });
          return;
        }
        
        // Fondo blanco para imágenes con transparencia
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // Dibujar la imagen
        ctx.drawImage(img, 0, 0);
        
        // Convertir a JPEG con formato específico
        // Intentamos calidad 0.92 para balance entre tamaño y calidad
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
        
        // Verificar que el resultado tiene el encabezado correcto
        if (!jpegDataUrl.startsWith('data:image/jpeg;base64,')) {
          resolve({
            isValid: false,
            errorMessage: 'Error al convertir: el resultado no es un JPEG válido'
          });
          return;
        }
        
        // Verificar tamaño (aproximado, la codificación base64 es ~33% más grande)
        const base64Data = jpegDataUrl.split(',')[1] || '';
        const approximateSizeInBytes = (base64Data.length * 3) / 4;
        const approximateSizeInMB = approximateSizeInBytes / (1024 * 1024);
        
        if (approximateSizeInMB > 50) {
          resolve({
            isValid: false,
            errorMessage: `Imagen demasiado grande: ~${approximateSizeInMB.toFixed(2)}MB (máximo: 50MB)`
          });
          return;
        }
        
        // Devolver imagen procesada
        resolve({
          isValid: true,
          processedImage: jpegDataUrl,
          width,
          height
        });
      } catch (error: any) {
        console.error('Error en conversión de imagen:', error);
        resolve({
          isValid: false,
          errorMessage: `Error en conversión: ${error.message || 'Error desconocido'}`
        });
      }
    };
    
    img.onerror = () => {
      resolve({
        isValid: false,
        errorMessage: 'Error al cargar la imagen para conversión'
      });
    };
    
    // Cargar la imagen
    img.src = imageDataUrl;
  });
}

/**
 * Verifica las dimensiones de una imagen
 * 
 * @param imageDataUrl URL de datos de la imagen
 * @returns Promesa con el resultado de la verificación
 */
function checkImageDimensions(imageDataUrl: string): Promise<ImageProcessingResult> {
  return new Promise((resolve) => {
    const img = new Image();
    
    img.onload = () => {
      const { width, height } = img;
      
      // Verificar dimensiones según requisitos de Kling
      const shortSide = Math.min(width, height);
      const longSide = Math.max(width, height);
      
      if (shortSide < 512) {
        resolve({
          isValid: false,
          width,
          height,
          errorMessage: `Imagen demasiado pequeña: lado corto ${shortSide}px (mínimo: 512px)`
        });
        return;
      }
      
      if (longSide > 4096) {
        resolve({
          isValid: false,
          width,
          height,
          errorMessage: `Imagen demasiado grande: lado largo ${longSide}px (máximo: 4096px)`
        });
        return;
      }
      
      // Dimensiones válidas
      resolve({
        isValid: true,
        width,
        height
      });
    };
    
    img.onerror = () => {
      resolve({
        isValid: false,
        errorMessage: 'Error al cargar la imagen para verificar dimensiones'
      });
    };
    
    img.src = imageDataUrl;
  });
}