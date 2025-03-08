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
 * Implementación mejorada con manejo robusto de errores y validación estricta
 * para cumplir con los requisitos específicos de Kling API.
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

    // Estricta comprobación del formato JPEG
    if (!mimeType.includes('jpeg') && !mimeType.includes('jpg')) {
      return {
        isValid: false,
        errorMessage: 'Solo se aceptan imágenes JPEG. Por favor, convierta la imagen antes de subirla.',
        originalFormat
      };
    }
    
    // Verificar firma JPEG en los datos binarios
    if (binaryData[0] !== 0xFF || binaryData[1] !== 0xD8) {
      return {
        isValid: false,
        errorMessage: 'La imagen no tiene una firma JPEG válida aunque el mime-type lo indique.',
        originalFormat
      };
    }
    
    // SOLUCIÓN CRÍTICA FINAL: Garantizar imagen JPEG 100% compatible con Kling
    console.log('⚠️ Aplicando solución crítica para compatibilidad con Kling API');
    
    // 1. Verificar EOI (End Of Image marker) para validar estructura JPEG completa
    const hasValidEOI = binaryData.length >= 2 && 
                        binaryData[binaryData.length - 2] === 0xFF && 
                        binaryData[binaryData.length - 1] === 0xD9;
    
    if (!hasValidEOI) {
      console.warn('⚠️ Advertencia: La imagen JPEG no tiene un marcador EOI válido al final - corrigiendo');
      // Añadir marcador EOI si falta
      const newBuffer = Buffer.alloc(binaryData.length + 2);
      binaryData.copy(newBuffer);
      newBuffer[newBuffer.length - 2] = 0xFF;
      newBuffer[newBuffer.length - 1] = 0xD9;
      binaryData = newBuffer;
    }
    
    // 2. Eliminar todos los metadatos y marcadores opcionales JPEG
    // Implementamos una limpieza básica manteniendo solo los markers esenciales
    
    // Crear nuevo buffer limpio
    try {
      // Intentamos quitar marcadores no esenciales
      let cleanBuffer = Buffer.alloc(0);
      let offset = 0;
      
      // Garantizar que empezamos con SOI
      cleanBuffer = Buffer.concat([cleanBuffer, Buffer.from([0xFF, 0xD8])]);
      offset = 2;
      
      // Limpiar marcadores, preservando solo los esenciales
      while (offset < binaryData.length - 1) {
        // Buscar el próximo marcador
        if (binaryData[offset] !== 0xFF) {
          offset++;
          continue;
        }
        
        const marker = binaryData[offset + 1];
        
        // Saltarse EOI (lo añadiremos nosotros al final)
        if (marker === 0xD9) {
          break;
        }
        
        // Para SOF y SOS (partes esenciales)
        if ((marker >= 0xC0 && marker <= 0xCF && marker !== 0xC4 && marker !== 0xC8 && marker !== 0xCC) || 
            marker === 0xDA) {
          
          // Leer longitud del segmento
          if (offset + 3 >= binaryData.length) break;
          
          const segmentLength = (binaryData[offset + 2] << 8) | binaryData[offset + 3];
          
          // Si la longitud está fuera de rango, esto podría estar corrupto
          if (segmentLength < 2 || offset + 2 + segmentLength > binaryData.length) {
            offset += 2;
            continue;
          }
          
          // Extraer segmento completo y añadirlo al buffer limpio
          const segment = binaryData.subarray(offset, offset + 2 + segmentLength);
          cleanBuffer = Buffer.concat([cleanBuffer, segment]);
          
          // Avanzar al siguiente segmento
          offset += 2 + segmentLength;
          
          // Si es SOS (Start of Scan), copiar datos hasta EOI o fin
          if (marker === 0xDA) {
            let endOffset = offset;
            // Buscar EOI o llegar al final
            while (endOffset < binaryData.length - 1) {
              if (binaryData[endOffset] === 0xFF && binaryData[endOffset + 1] === 0xD9) {
                break;
              }
              endOffset++;
            }
            
            // Copiar todos los datos de escaneo
            const scanData = binaryData.subarray(offset, endOffset);
            cleanBuffer = Buffer.concat([cleanBuffer, scanData]);
            
            offset = endOffset;
          }
        } else {
          // Para otros marcadores no esenciales, los saltamos
          if (offset + 3 >= binaryData.length) break;
          
          const segmentLength = (binaryData[offset + 2] << 8) | binaryData[offset + 3];
          
          // Si la longitud es inválida, avanzamos de a poco
          if (segmentLength < 2 || offset + 2 + segmentLength > binaryData.length) {
            offset += 2;
          } else {
            offset += 2 + segmentLength;
          }
        }
      }
      
      // Finalizar con EOI
      cleanBuffer = Buffer.concat([cleanBuffer, Buffer.from([0xFF, 0xD9])]);
      
      // Verificar tamaño mínimo para un JPEG válido
      if (cleanBuffer.length < 150) {
        console.warn('⚠️ La limpieza ha producido un JPEG demasiado pequeño, usando original');
      } else {
        // Usar el buffer limpio
        binaryData = cleanBuffer;
        console.log('✅ Imagen JPEG limpiada correctamente, tamaño final:', binaryData.length);
      }
    } catch (cleanError) {
      console.error('Error al limpiar JPEG, usando original:', cleanError);
    }
    
    // PASO FINAL: Convertir a data URL exactamente con el formato requerido
    const normalizedBase64 = binaryData.toString('base64');
    
    // Usar exactamente el formato que Kling espera, sin espacios ni caracteres extra
    const normalizedUrl = 'data:image/jpeg;base64,' + normalizedBase64;
    
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
      
      // Verificación extra: asegurarse que el contenido JPEG sea válido
      // A veces los errores de formato no se detectan hasta que se accede a dimensiones
      if (!width || !height || width < 1 || height < 1) {
        return {
          isValid: false,
          errorMessage: 'No se pudieron determinar dimensiones válidas, posible JPEG corrupto',
          originalFormat
        };
      }
      
      // Validación exitosa con URL normalizada y dimensiones
      console.log(`Imagen procesada correctamente: JPEG de ${width}x${height} (${fileSizeInMB.toFixed(2)}MB)`);
      
      return {
        isValid: true,
        normalizedUrl,
        width,
        height,
        originalFormat
      };
    } catch (dimError) {
      // Si hay un error al obtener dimensiones, esto es serio cuando queremos garantizar compatibilidad
      // ya que Kling necesita dimensiones específicas
      console.error('Error al obtener dimensiones de la imagen:', 
        dimError instanceof Error ? dimError.message : 'Error desconocido');
      
      return {
        isValid: false,
        errorMessage: 'Error al verificar dimensiones de la imagen JPEG, podría estar corrupta',
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