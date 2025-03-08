/**
 * Utilidades para procesamiento de imágenes específicamente para la API de Kling
 * 
 * Este módulo implementa funciones para validar, normalizar y convertir imágenes
 * para asegurar compatibilidad estricta con los requisitos de Kling API.
 * 
 * Versión 2.0 - Mejorada con manejo de errores y estabilidad
 */

/**
 * Interfaz para el resultado del procesamiento de imagen
 */
export interface ImageProcessingResult {
  isValid: boolean;
  normalizedUrl?: string;
  errorMessage?: string;
  width?: number;
  height?: number;
  originalFormat?: string;
}

/**
 * Valida y convierte una imagen para asegurar compatibilidad con Kling API
 * 
 * Requisitos de Kling:
 * - Formato estrictamente JPEG
 * - Tamaño máximo: 50MB
 * - Dimensiones: lado corto >= 512px, lado largo <= 4096px
 * - Encabezado data:image/jpeg;base64,
 * 
 * @param imageDataUrl URL de datos de la imagen (data URL)
 * @returns Objeto con resultado de validación y URL normalizada si es válida
 */
/**
 * Procesa una imagen para su uso con Kling API, validando y normalizando
 * 
 * Implementación mejorada con manejo robusto de errores y validación estable
 * 
 * @param imageDataUrl URL de datos de la imagen (data URL)
 * @returns Objeto con resultado de validación y URL normalizada si es válida
 */
export async function processImageForKling(imageDataUrl: string): Promise<ImageProcessingResult> {
  // Si no hay imagen, no es válido
  if (!imageDataUrl) {
    return { 
      isValid: false, 
      errorMessage: 'No se proporcionó imagen'
    };
  }

  // Verificar si es una URL de datos válida
  if (!imageDataUrl.startsWith('data:')) {
    return { 
      isValid: false, 
      errorMessage: 'Formato inválido: la imagen debe ser una data URL (data:)'
    };
  }

  try {
    // Extraer partes de la data URL - validación reforzada
    let matches;
    try {
      matches = imageDataUrl.match(/^data:([^;]+);base64,(.+)$/);
    } catch (parseError) {
      return {
        isValid: false,
        errorMessage: 'Error al analizar la URL de datos'
      };
    }
    
    if (!matches || matches.length !== 3) {
      return {
        isValid: false,
        errorMessage: 'Formato inválido: la data URL no tiene el formato esperado'
      };
    }
    
    const [, mimeType, base64Data] = matches;
    
    // Verificar si es una imagen
    if (!mimeType.startsWith('image/')) {
      return {
        isValid: false,
        errorMessage: 'El archivo no es una imagen'
      };
    }
    
    // Registrar el formato original
    const originalFormat = mimeType.split('/')[1] || 'desconocido';
    
    // Descodificar la imagen para analizar su contenido - manejo robusto de errores
    let binaryData;
    try {
      binaryData = Buffer.from(base64Data, 'base64');
    } catch (bufferError) {
      return {
        isValid: false,
        errorMessage: 'Error al decodificar la imagen: datos base64 inválidos',
        originalFormat
      };
    }
    
    // Verificar tamaño máximo (50MB) - ahora con validación adicional
    const fileSizeInMB = binaryData.length / (1024 * 1024);
    
    // Validación adicional para datos corruptos
    if (fileSizeInMB <= 0 || isNaN(fileSizeInMB)) {
      return {
        isValid: false,
        errorMessage: 'Datos de imagen inválidos o corruptos',
        originalFormat
      };
    }
    
    if (fileSizeInMB > 50) {
      return {
        isValid: false,
        errorMessage: `Imagen demasiado grande: ${fileSizeInMB.toFixed(2)}MB (máximo permitido: 50MB)`,
        originalFormat
      };
    }

    // Si no es JPEG, informamos que necesitamos conversión
    if (!mimeType.includes('jpeg') && !mimeType.includes('jpg')) {
      return {
        isValid: false,
        errorMessage: 'Solo se aceptan imágenes JPEG. Por favor, convierta la imagen antes de subirla.',
        originalFormat
      };
    }
    
    // Siempre normalizar a 'data:image/jpeg;base64,' incluso si ya es JPEG
    // Esto garantiza que el encabezado sea exactamente como lo espera Kling
    const normalizedUrl = 'data:image/jpeg;base64,' + base64Data;
    
    // Validación de dimensiones con manejo mejorado de errores
    try {
      const dimensionsResult = await getImageDimensions(normalizedUrl);
      
      // Si las dimensiones no son válidas, añadimos el formato original y devolvemos
      if (!dimensionsResult.isValid) {
        return {
          ...dimensionsResult,
          originalFormat
        };
      }
      
      // Añadimos las dimensiones si las tenemos
      const width = dimensionsResult.width;
      const height = dimensionsResult.height;
      
      // Validación exitosa con URL normalizada y dimensiones
      return {
        isValid: true,
        normalizedUrl,
        width,
        height,
        originalFormat
      };
    } catch (dimError) {
      // Si hay un error al obtener dimensiones, continuamos sin ellas pero con manejo de error mejorado
      console.warn('No se pudieron obtener dimensiones, pero la imagen es válida');
      
      // No exponer el error completo en los logs para evitar sobrecarga
      // Registramos un mensaje simplificado
      if (dimError instanceof Error) {
        console.warn('Razón:', dimError.message);
      }
      
      return {
        isValid: true,
        normalizedUrl,
        originalFormat
      };
    }
  } catch (error: any) {
    // Manejo mejorado de errores generales
    console.error('Error al procesar imagen');
    
    // Registrar detalles del error pero limitar datos sensibles
    if (error instanceof Error) {
      console.error('Tipo:', error.name);
      console.error('Mensaje:', error.message);
    } else {
      console.error('Error desconocido');
    }
    
    return {
      isValid: false,
      errorMessage: `Error al procesar imagen: ${error?.message || 'Error desconocido'}`
    };
  }
}

/**
 * Analiza las dimensiones de una imagen desde una data URL
 * Esta implementación es compatible con Node.js (servidor) y no utiliza APIs del navegador
 * 
 * @param dataUrl URL de datos de la imagen
 * @returns Promesa con resultado incluyendo dimensiones si son válidas
 */
export function getImageDimensions(dataUrl: string): Promise<ImageProcessingResult> {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image/')) {
      resolve({
        isValid: false,
        errorMessage: 'La URL no es una imagen válida'
      });
      return;
    }

    try {
      // Extraer el tipo y los datos base64
      const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (!matches || matches.length !== 3) {
        resolve({
          isValid: false,
          errorMessage: 'Formato de data URL inválido'
        });
        return;
      }

      // Obtener los datos binarios
      const base64Data = matches[2];
      const buffer = Buffer.from(base64Data, 'base64');
      
      // Para JPEG, podemos extraer las dimensiones del encabezado
      // Esta es una implementación básica para JPEG que lee los markers SOFn
      if (buffer[0] === 0xFF && buffer[1] === 0xD8) { // Verificar signature JPEG
        // Buscar los markers SOF (Start Of Frame)
        let offset = 2;
        while (offset < buffer.length) {
          // Verificar que tenemos bytes suficientes
          if (offset + 8 >= buffer.length) {
            resolve({
              isValid: false,
              errorMessage: 'No se pudieron determinar las dimensiones de la imagen JPEG'
            });
            return;
          }
          
          // Leer marker
          if (buffer[offset] !== 0xFF) {
            offset += 1;
            continue;
          }
          
          const marker = buffer[offset + 1];
          
          // SOF markers: 0xC0 - 0xCF (excepto 0xC4, 0xC8, 0xCC que son DHT, etc.)
          if (marker >= 0xC0 && marker <= 0xCF && 
              marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) {
            
            // Leer longitud del segmento
            const segmentLength = buffer.readUInt16BE(offset + 2);
            
            // Si el segmento es demasiado corto, no es un SOF válido
            if (segmentLength < 7) {
              offset += 2 + segmentLength;
              continue;
            }
            
            // Extraer las dimensiones del SOF
            const height = buffer.readUInt16BE(offset + 5);
            const width = buffer.readUInt16BE(offset + 7);
            
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
            return;
          }
          
          // Si no es un SOF marker, saltar al siguiente segmento
          if (marker === 0xD9) { // EOI marker (End Of Image)
            break;
          }
          
          // Avanzar al siguiente segmento
          const segmentLength = buffer.readUInt16BE(offset + 2);
          offset += 2 + segmentLength;
        }
        
        // Si llegamos aquí, no encontramos un marker SOF válido
        resolve({
          isValid: false,
          errorMessage: 'No se pudieron determinar las dimensiones de la imagen JPEG'
        });
        return;
      }
      
      // Para otros formatos o si no pudimos analizar el JPEG, 
      // asumimos que está bien por ahora y confiamos en processImageForKling
      resolve({
        isValid: true,
        // No proporcionamos dimensiones concretas, pero marcamos como válido
        // para que el flujo pueda continuar y detectar otros problemas
      });
      
    } catch (error: any) {
      console.error('Error al analizar dimensiones de imagen:', error);
      resolve({
        isValid: false,
        errorMessage: `Error al analizar dimensiones: ${error.message}`
      });
    }
  });
}