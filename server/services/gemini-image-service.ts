/**
 * Servicio de generación de imágenes con Gemini 3.5 Flash Image (Nano Banana Pro)
 * Para crear imágenes cinematográficas de alta calidad para videos musicales
 * Con sistema de fallback automático entre múltiples API keys y modelos
 */
import { GoogleGenAI, Modality } from "@google/genai";
import { logger } from '../utils/logger';
import { storage } from '../firebase';

// Configurar múltiples clientes de Gemini para fallback automático
const apiKeys = [
  process.env.GEMINI_API_KEY,
  process.env.GEMINI_API_KEY2
].filter(key => key && key.length > 0);

const geminiClients = apiKeys.map(key => new GoogleGenAI({ apiKey: key || "" }));

// Cliente principal (para compatibilidad con código legacy)
const ai = geminiClients[0] || new GoogleGenAI({ apiKey: "" });

// Modelos disponibles con fallback automático
const AVAILABLE_MODELS = [
  "gemini-3-pro-image-preview",       // PRIMARY: Nano Banana Pro (Gemini 3 Pro - Nov 2025, Studio Quality 4K)
  "gemini-2.5-flash-image",           // FALLBACK: Nano Banana (Gemini 2.5 - Fast, economical)
  "gemini-2.0-flash-image"            // FALLBACK: Versión anterior compatible
];

/**
 * Obtiene el modelo a usar basado en disponibilidad y fallback automático
 * Intenta con modelos en orden de preferencia
 */
function getImageGenerationModel(): string {
  const preferredModel = process.env.GEMINI_IMAGE_MODEL || AVAILABLE_MODELS[0];
  
  // Si existe variable de entorno que especifique el modelo, usar esa primero
  if (process.env.GEMINI_IMAGE_MODEL) {
    logger.log(`📊 [MODEL] Usando modelo configurado: ${preferredModel}`);
    return preferredModel;
  }
  
  logger.log(`📊 [MODEL] Usando modelo por defecto: ${AVAILABLE_MODELS[0]}`);
  return AVAILABLE_MODELS[0];
}

/**
 * Intenta generar contenido con fallback automático entre API keys Y modelos
 * Si una key/modelo alcanza su límite de cuota (error 429), automáticamente intenta con la siguiente
 */
async function generateContentWithFallback(params: any): Promise<any> {
  let lastError: any = null;
  
  // Intentar fallback de modelos primero
  const modelsToTry = [params.model, ...AVAILABLE_MODELS.filter(m => m !== params.model)];
  
  for (const model of modelsToTry) {
    for (let i = 0; i < geminiClients.length; i++) {
      try {
        logger.log(`🔑 [FALLBACK] API key ${i + 1}/${geminiClients.length}, Modelo: ${model}`);
        const client = geminiClients[i];
        
        // Crear parámetros con el modelo actual
        const currentParams = { ...params, model };
        
        // Agregar timeout de 60 segundos para evitar colgarse indefinidamente
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Gemini API timeout después de 60 segundos')), 60000);
        });
        
        const generationPromise = client.models.generateContent(currentParams);
        
        const response = await Promise.race([generationPromise, timeoutPromise]);
        logger.log(`✅ Generación exitosa con API key ${i + 1}, modelo: ${model}`);
        return response;
      } catch (error: any) {
        lastError = error;
        
        logger.error(`❌ Error con API key ${i + 1}, modelo ${model}:`, error.message);
        
        // Si es error de modelo no disponible o no encontrado, pasar al siguiente modelo
        if (error.message?.includes('not found') || 
            error.message?.includes('model') || 
            error.message?.includes('does not exist') ||
            error.status === 404) {
          logger.warn(`⚠️ Modelo ${model} no disponible en key ${i + 1}, intentando siguiente modelo...`);
          break; // Romper el loop de keys y pasar al siguiente modelo
        }
        
        // Si es error 429 (quota exceeded), intentar con la siguiente key
        if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
          logger.warn(`⚠️ API key ${i + 1} sin cuota disponible con modelo ${model}, intentando siguiente key...`);
          continue;
        }
        
        // Si es timeout, intentar con la siguiente key
        if (error.message?.includes('timeout')) {
          logger.warn(`⏱️ API key ${i + 1} timeout con modelo ${model}, intentando siguiente key...`);
          continue;
        }
        
        // Para otros errores, lanzar inmediatamente
        throw error;
      }
    }
  }
  
  // Si llegamos aquí, todas las keys y modelos fallaron
  logger.error('❌ Todas las API keys, modelos y combinaciones agotaron su cuota o fallaron');
  throw lastError || new Error('Todas las API keys y modelos de Gemini han fallado');
}

export interface CinematicScene {
  id: number;
  scene: string;
  camera: string;
  lighting: string;
  style: string;
  movement: string;
}

export interface ImageGenerationResult {
  success: boolean;
  imageBase64?: string;
  imageUrl?: string;
  error?: string;
  quotaError?: boolean;
  provider?: 'gemini' | 'fal' | 'fal-kontext' | 'unknown';
}

/**
 * Sube una imagen base64 a Firebase Storage y devuelve su URL pública
 * Si Storage falla, retorna como data URL para garantizar que la imagen siempre esté disponible
 * @param base64Data - Datos de la imagen en base64
 * @param mimeType - Tipo MIME de la imagen (default: 'image/png')
 * @param folder - Carpeta donde guardar (default: 'merchandise')
 * @returns URL pública de la imagen en Storage o data URL si falla
 */
async function uploadBase64ToStorage(
  base64Data: string,
  mimeType: string = 'image/png',
  folder: string = 'merchandise'
): Promise<string> {
  try {
    logger.log(`🔍 [STORAGE] Verificando disponibilidad de Firebase Storage...`);
    
    // Verificar que storage esté inicializado
    if (!storage) {
      logger.warn(`⚠️ [STORAGE] Firebase Storage no está inicializado, usando data URL como fallback`);
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      logger.log(`✅ [STORAGE] Usando data URL fallback para imagen`);
      return dataUrl;
    }
    
    logger.log(`✅ [STORAGE] Firebase Storage disponible, intentando subida...`);
    
    // Generar nombre único con timestamp
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = mimeType.split('/')[1] || 'png';
    const fileName = `${folder}/${timestamp}_${randomId}.${extension}`;
    
    logger.log(`📝 [STORAGE] Nombre de archivo: ${fileName}`);
    
    // Convertir base64 a Buffer
    logger.log(`🔄 [STORAGE] Convirtiendo base64 a Buffer...`);
    const imageBuffer = Buffer.from(base64Data, 'base64');
    logger.log(`✅ [STORAGE] Buffer creado: ${imageBuffer.length} bytes`);
    
    // Usar Firebase Admin SDK para subir
    logger.log(`📤 [STORAGE] Obteniendo bucket de Firebase...`);
    const bucket = storage.bucket();
    const file = bucket.file(fileName);
    
    logger.log(`📤 [STORAGE] Subiendo archivo a Storage: ${fileName}`);
    
    // Guardar archivo con metadata - CON TIMEOUT
    const savePromise = file.save(imageBuffer, {
      metadata: {
        contentType: mimeType,
      },
      public: true,
      validation: false,
    });
    
    const saveTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Storage upload timeout después de 30s')), 30000)
    );
    
    await Promise.race([savePromise, saveTimeout]);
    logger.log(`✅ [STORAGE] Archivo guardado exitosamente`);
    
    // Hacer el archivo público y obtener URL
    logger.log(`🔓 [STORAGE] Haciendo archivo público...`);
    const makePublicPromise = file.makePublic();
    const makePublicTimeout = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Make public timeout después de 15s')), 15000)
    );
    
    await Promise.race([makePublicPromise, makePublicTimeout]);
    logger.log(`✅ [STORAGE] Archivo es público`);
    
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    logger.log(`✅ [STORAGE] Imagen subida exitosamente: ${publicUrl.substring(0, 100)}...`);
    
    return publicUrl;
  } catch (storageError: any) {
    logger.error(`❌ [STORAGE] Error subiendo a Firebase Storage:`, {
      message: storageError.message,
      code: storageError.code,
      status: storageError.status
    });
    
    // FALLBACK: Retornar como data URL en lugar de fallar
    logger.warn(`⚠️ [STORAGE] Usando data URL como fallback debido a error de Storage`);
    try {
      const dataUrl = `data:${mimeType};base64,${base64Data}`;
      logger.log(`✅ [STORAGE] Data URL fallback creado exitosamente`);
      return dataUrl;
    } catch (fallbackError: any) {
      logger.error(`❌ [STORAGE] Error crítico - ni Storage ni fallback funcionan:`, fallbackError.message);
      // Último recurso: retornar un data URL vacío para no romper completamente
      throw new Error(`Image upload failed completely: ${storageError.message}`);
    }
  }
}

/**
 * Edita una imagen existente usando Gemini con instrucciones específicas
 * @param imageUrl - URL o base64 de la imagen original
 * @param editInstructions - Instrucciones de cómo editar la imagen
 * @param originalPrompt - Prompt original (opcional)
 * @returns Nueva imagen editada en formato base64
 */
export async function editImageWithGemini(
  imageUrl: string,
  editInstructions: string,
  originalPrompt?: string
): Promise<ImageGenerationResult> {
  try {
    if (geminiClients.length === 0) {
      throw new Error('No hay API keys de Gemini configuradas');
    }

    logger.log('Editando imagen con Gemini:', editInstructions.substring(0, 100) + '...');

    // Convertir la imagen a base64 si es una URL
    let imageBase64 = imageUrl;
    let mimeType = 'image/png';

    if (imageUrl.startsWith('http')) {
      // Descargar la imagen
      const axios = await import('axios');
      const response = await axios.default.get(imageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      imageBase64 = Buffer.from(response.data).toString('base64');
      mimeType = response.headers['content-type'] || 'image/png';
    } else if (imageUrl.startsWith('data:')) {
      // Extraer base64 de data URL
      const matches = imageUrl.match(/^data:([^;]+);base64,(.+)$/);
      if (matches) {
        mimeType = matches[1];
        imageBase64 = matches[2];
      }
    }

    // Construir el prompt de edición
    const editPrompt = `
I have an image that needs to be edited with the following modifications:

${editInstructions}

${originalPrompt ? `Original concept: ${originalPrompt}` : ''}

Please create a new version of this image with these edits applied. Maintain the overall composition and style, but apply the requested changes.
    `.trim();

    // Usar Gemini con imagen de referencia para edición
    const response = await generateContentWithFallback({
      model: getImageGenerationModel(),
      contents: [
        { 
          role: "user", 
          parts: [
            { text: editPrompt },
            {
              inlineData: {
                data: imageBase64,
                mimeType: mimeType
              }
            }
          ] 
        }
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No se recibieron candidatos de la API');
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error('Contenido vacío en la respuesta');
    }

    // Buscar la parte de imagen en la respuesta
    for (const part of content.parts) {
      if (part.text) {
        logger.log('Texto de respuesta:', part.text);
      } else if (part.inlineData && part.inlineData.data) {
        const newImageBase64 = part.inlineData.data;
        logger.log('Imagen editada exitosamente');
        
        return {
          success: true,
          imageBase64: newImageBase64,
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${newImageBase64}`,
          provider: 'gemini'
        };
      }
    }

    throw new Error('No se encontró imagen en la respuesta');
  } catch (error: any) {
    logger.error('Error editando imagen con Gemini:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al editar imagen'
    };
  }
}

/**
 * Genera una imagen usando Gemini 3.5 Flash Image (con fallback a Nano Banana)
 * @param prompt - Descripción detallada de la escena
 * @returns Imagen en formato base64
 */
export async function generateCinematicImage(
  prompt: string
): Promise<ImageGenerationResult> {
  try {
    if (geminiClients.length === 0) {
      throw new Error('No hay API keys de Gemini configuradas');
    }

    logger.log('Generando imagen con Gemini:', prompt.substring(0, 100) + '...');

    // Usar el modelo de generación de imágenes con fallback automático
    const response = await generateContentWithFallback({
      model: getImageGenerationModel(),
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No se recibieron candidatos de la API');
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error('Contenido vacío en la respuesta');
    }

    // Buscar la parte de imagen en la respuesta
    for (const part of content.parts) {
      if (part.text) {
        logger.log('✅ [GEMINI] Texto de respuesta:', part.text.substring(0, 100));
      } else if (part.inlineData && part.inlineData.data) {
        const imageBase64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        logger.log(`✅ [GEMINI] Imagen generada exitosamente (${imageBase64.length} bytes)`);
        
        try {
          logger.log(`📤 [GEMINI] Subiendo imagen a Storage...`);
          // Subir a Firebase Storage y obtener URL pública (con fallback a data URL)
          const imageUrl = await uploadBase64ToStorage(imageBase64, mimeType, 'generated-images');
          
          logger.log(`✅ [GEMINI] Imagen disponible en: ${imageUrl.substring(0, 100)}...`);
          return {
            success: true,
            imageBase64: imageBase64,
            imageUrl: imageUrl,
            provider: 'gemini'
          };
        } catch (uploadError: any) {
          logger.error(`❌ [GEMINI] Error crítico en upload:`, uploadError.message);
          // Último fallback: retornar base64 como data URL
          const dataUrl = `data:${mimeType};base64,${imageBase64}`;
          logger.log(`✅ [GEMINI] Usando data URL directo como fallback final`);
          return {
            success: true,
            imageBase64: imageBase64,
            imageUrl: dataUrl,
            provider: 'gemini'
          };
        }
      }
    }

    throw new Error('No se encontró imagen en la respuesta');
  } catch (error: any) {
    logger.error('❌ [GEMINI] Error generando imagen con Gemini:', error.message);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar imagen'
    };
  }
}

/**
 * Genera imagen a partir de una escena cinematográfica completa
 * Combina todos los parámetros cinematográficos en un prompt optimizado
 */
export async function generateImageFromCinematicScene(
  scene: CinematicScene
): Promise<ImageGenerationResult> {
  // Construir prompt cinematográfico detallado
  const cinematicPrompt = `
Professional cinematic photography for a music video:

Scene: ${scene.scene}

Camera Setup: ${scene.camera}

Lighting: ${scene.lighting}

Visual Style: ${scene.style}

Camera Movement: ${scene.movement}

Create a high-quality, professional music video frame with cinematic composition, perfect lighting, and stunning visual aesthetics. The image should be production-ready for a premium music video.
  `.trim();

  return await generateCinematicImage(cinematicPrompt);
}

/**
 * Genera múltiples imágenes en lote
 */
export async function generateBatchImages(
  scenes: CinematicScene[]
): Promise<Map<number, ImageGenerationResult>> {
  const results = new Map<number, ImageGenerationResult>();
  
  // Generar imágenes secuencialmente para evitar rate limits
  for (const scene of scenes) {
    logger.log(`Generando imagen ${scene.id}/${scenes.length}...`);
    const result = await generateImageFromCinematicScene(scene);
    results.set(scene.id, result);
    
    // Pequeño delay para evitar rate limiting
    if (scenes.indexOf(scene) < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return results;
}

/**
 * Genera una imagen adaptando el rostro de una imagen de referencia
 * Usa image-to-image editing de Gemini para mantener consistencia facial
 */
export async function generateImageWithFaceReference(
  prompt: string,
  referenceImageBase64: string
): Promise<ImageGenerationResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    logger.log('Generando imagen con referencia facial...');

    // Crear el prompt combinado para mantener la cara de la referencia
    const combinedPrompt = `${prompt}

IMPORTANT: Maintain the exact same face, facial features, and person from the reference image. Keep their identity, facial structure, skin tone, and distinctive features identical.`;

    // Usar Gemini con imagen de referencia para edición (con fallback automático)
    const response = await generateContentWithFallback({
      model: getImageGenerationModel(),
      contents: [
        { 
          role: "user", 
          parts: [
            {
              inlineData: {
                data: referenceImageBase64,
                mimeType: "image/jpeg"
              }
            },
            { text: combinedPrompt }
          ] 
        }
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No se recibieron candidatos de la API');
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error('Contenido vacío en la respuesta');
    }

    // Buscar la parte de imagen en la respuesta
    for (const part of content.parts) {
      if (part.text) {
        logger.log('Texto de respuesta:', part.text);
      } else if (part.inlineData && part.inlineData.data) {
        const imageBase64 = part.inlineData.data;
        logger.log('Imagen con rostro adaptado generada exitosamente');
        
        return {
          success: true,
          imageBase64: imageBase64,
          imageUrl: `data:${part.inlineData.mimeType || 'image/png'};base64,${imageBase64}`,
          provider: 'gemini'
        };
      }
    }

    throw new Error('No se encontró imagen en la respuesta');
  } catch (error: any) {
    logger.error('Error generando imagen con referencia facial:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar imagen con rostro'
    };
  }
}

/**
 * Genera múltiples imágenes en lote con referencia facial
 */
export async function generateBatchImagesWithFaceReference(
  scenes: CinematicScene[],
  referenceImageBase64: string
): Promise<Map<number, ImageGenerationResult>> {
  const results = new Map<number, ImageGenerationResult>();
  
  for (const scene of scenes) {
    logger.log(`Generando imagen con rostro ${scene.id}/${scenes.length}...`);
    
    // Construir prompt cinematográfico
    const cinematicPrompt = `
Professional cinematic photography for a music video:

Scene: ${scene.scene}
Camera Setup: ${scene.camera}
Lighting: ${scene.lighting}
Visual Style: ${scene.style}
Camera Movement: ${scene.movement}

Create a high-quality, professional music video frame with cinematic composition.
    `.trim();
    
    const result = await generateImageWithFaceReference(cinematicPrompt, referenceImageBase64);
    results.set(scene.id, result);
    
    // Delay para evitar rate limiting
    if (scenes.indexOf(scene) < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  return results;
}

/**
 * Genera una imagen usando MÚLTIPLES imágenes de referencia (hasta 3)
 * Nano Banana puede usar múltiples referencias para mejor adaptación facial
 */
export async function generateImageWithMultipleFaceReferences(
  prompt: string,
  referenceImagesBase64: string[]
): Promise<ImageGenerationResult> {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY no está configurada');
    }

    if (!referenceImagesBase64 || referenceImagesBase64.length === 0) {
      // Si no hay referencias, usar generación normal
      return await generateCinematicImage(prompt);
    }

    logger.log(`Generando imagen con ${referenceImagesBase64.length} referencias faciales...`);

    // Crear el prompt mejorado para múltiples referencias
    const combinedPrompt = `${prompt}

CRITICAL: Use these ${referenceImagesBase64.length} reference images to maintain facial consistency. The person should have the EXACT same face, features, skin tone, and identity across all generated images. Blend the best features from all reference angles to create a consistent appearance.`;

    // Construir array de parts con todas las imágenes de referencia
    const parts: any[] = [];
    
    // Agregar todas las imágenes de referencia primero
    for (let i = 0; i < Math.min(referenceImagesBase64.length, 3); i++) {
      let base64Data = referenceImagesBase64[i];
      
      logger.log(`🔍 Procesando imagen de referencia ${i + 1}...`);
      
      // Si es una URL, descargar la imagen y convertirla a base64
      if (base64Data.startsWith('http://') || base64Data.startsWith('https://')) {
        logger.log(`📥 Descargando imagen de referencia ${i + 1} desde URL...`);
        try {
          const axios = (await import('axios')).default;
          const response = await axios.get(base64Data, { 
            responseType: 'arraybuffer',
            timeout: 10000 // 10 segundos timeout
          });
          base64Data = Buffer.from(response.data, 'binary').toString('base64');
          logger.log(`✅ Imagen ${i + 1} descargada y convertida a base64`);
        } catch (downloadError: any) {
          logger.error(`❌ Error descargando imagen ${i + 1}:`, downloadError.message);
          // Saltar esta imagen si falla la descarga
          continue;
        }
      } else if (base64Data.startsWith('data:')) {
        // Si es un data URL, extraer solo los datos (quitar el prefijo data:image/...)
        const parts = base64Data.split(',');
        if (parts.length === 2) {
          base64Data = parts[1];
          logger.log(`✅ Imagen ${i + 1} extraída de data URL`);
        } else {
          logger.warn(`⚠️ Data URL inválido para imagen ${i + 1}, usando tal cual`);
        }
      } else {
        logger.log(`✅ Imagen ${i + 1} ya está en base64 puro`);
      }
      
      parts.push({
        inlineData: {
          data: base64Data,
          mimeType: "image/jpeg"
        }
      });
    }
    
    // Agregar el prompt al final
    parts.push({ text: combinedPrompt });

    // Usar Gemini con múltiples imágenes de referencia y fallback automático entre API keys y modelos
    const response = await generateContentWithFallback({
      model: getImageGenerationModel(),
      contents: [
        { 
          role: "user", 
          parts: parts
        }
      ],
      config: {
        responseModalities: [Modality.TEXT, Modality.IMAGE],
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error('No se recibieron candidatos de la API');
    }

    const content = candidates[0].content;
    if (!content || !content.parts) {
      throw new Error('Contenido vacío en la respuesta');
    }

    // Buscar la parte de imagen en la respuesta
    for (const part of content.parts) {
      if (part.text) {
        logger.log(`✅ [MULTI-FACE] Texto de respuesta: ${part.text.substring(0, 100)}`);
      } else if (part.inlineData && part.inlineData.data) {
        const imageBase64 = part.inlineData.data;
        const mimeType = part.inlineData.mimeType || 'image/png';
        logger.log(`✅ [MULTI-FACE] Imagen con rostros generada exitosamente (${imageBase64.length} bytes)`);
        
        try {
          logger.log(`📤 [MULTI-FACE] Subiendo imagen a Storage...`);
          // Subir a Firebase Storage y obtener URL pública (con fallback a data URL)
          const imageUrl = await uploadBase64ToStorage(imageBase64, mimeType, 'generated-images');
          
          logger.log(`✅ [MULTI-FACE] Imagen disponible en: ${imageUrl.substring(0, 100)}...`);
          return {
            success: true,
            imageBase64: imageBase64,
            imageUrl: imageUrl,
            provider: 'gemini'
          };
        } catch (uploadError: any) {
          logger.error(`❌ [MULTI-FACE] Error en upload:`, uploadError.message);
          // Fallback: retornar base64 como data URL
          const dataUrl = `data:${mimeType};base64,${imageBase64}`;
          logger.log(`✅ [MULTI-FACE] Usando data URL directo como fallback`);
          return {
            success: true,
            imageBase64: imageBase64,
            imageUrl: dataUrl,
            provider: 'gemini'
          };
        }
      }
    }

    throw new Error('No se encontró imagen en la respuesta');
  } catch (error: any) {
    logger.error(`❌ [MULTI-FACE] Error generando imagen:`, {
      message: error.message,
      status: error.status
    });
    
    // Detectar error de cuota excedida (429)
    if (error.status === 429 || error.message?.includes('quota') || error.message?.includes('RESOURCE_EXHAUSTED')) {
      return {
        success: false,
        error: 'QUOTA_EXCEEDED',
        quotaError: true
      };
    }
    
    return {
      success: false,
      error: error.message || 'Error desconocido al generar imagen con rostros'
    };
  }
}

/**
 * Genera un poster cinematográfico estilo Hollywood con el rostro del artista
 * CRITICAL: Este poster debe motivar al artista mostrándolo como estrella de su propia película
 */
export async function generateHollywoodStylePoster(
  conceptTitle: string,
  conceptDescription: string,
  artistReferenceImages: string[],
  directorName: string
): Promise<ImageGenerationResult> {
  try {
    logger.log(`🎬 Generando poster Hollywood para concepto: "${conceptTitle}"...`);

    // Crear prompt para poster cinematográfico profesional con layout específico
    const posterPrompt = `Create a professional Hollywood theatrical movie poster with these EXACT specifications:

MOVIE TITLE: "${conceptTitle}"
DIRECTOR: ${directorName}
CONCEPT: ${conceptDescription}

COMPOSITION LAYOUT (CRITICAL - FOLLOW EXACTLY):
1. TOP THIRD: Title text "${conceptTitle}" - Bold, cinematic typography, fully visible within frame
2. MIDDLE: Main character (artist) featured prominently in the story setting
3. BOTTOM: Credits including "Directed by ${directorName}" - Clear, legible text

TEXT POSITIONING RULES (MUST FOLLOW):
- Title text MUST be in the top 25% of the image, completely within frame boundaries
- ALL text elements MUST have high contrast background (dark vignette, glow, or solid overlay)
- Use professional movie poster text placement: centered or slightly upper third
- Credits at bottom MUST be readable with proper spacing from edge (minimum 5% margin)
- NO text should be cut off by image boundaries

VISUAL REQUIREMENTS:
- Feature the artist as the cinematic hero/star (use reference photos for exact facial features)
- Place character in dramatic story context from the concept description
- Professional cinematic lighting with depth and atmosphere
- Hollywood color grading (teal/orange, moody dramatic tones)
- Film grain texture for premium theatrical quality
- Atmospheric background that tells the visual story

TYPOGRAPHY STYLE:
- Bold, impactful title font (like premium movie posters: Trajan Pro, Gotham, or similar)
- Text should have subtle glow/shadow for legibility
- Director credit in elegant smaller font below title or at bottom
- All text integrated naturally into the composition

FORMAT: Vertical theatrical poster (2:3 aspect ratio)
STYLE: Premium Hollywood theatrical release quality, museum-worthy design
MOOD: Epic, inspiring, professional - make the artist feel like a HOLLYWOOD STAR

CRITICAL: This poster should look like it belongs in a movie theater lobby - perfect layout, professional typography, and complete visibility of all text elements within frame boundaries.`;

    const result = await generateImageWithMultipleFaceReferences(posterPrompt, artistReferenceImages);
    
    if (result.success) {
      logger.log(`✅ Poster Hollywood generado exitosamente para "${conceptTitle}"`);
    } else {
      logger.error(`❌ Error generando poster para "${conceptTitle}":`, result.error);
    }

    return result;
  } catch (error: any) {
    logger.error('Error generando poster Hollywood:', error);
    return {
      success: false,
      error: error.message || 'Error desconocido al generar poster'
    };
  }
}

/**
 * Genera múltiples imágenes en lote con MÚLTIPLES referencias faciales
 * Ideal para crear videos musicales con consistencia facial usando hasta 3 fotos del artista
 * USA SEMILLA CONSISTENTE PARA COHERENCIA VISUAL (color, tono, iluminación)
 */
export async function generateBatchImagesWithMultipleFaceReferences(
  scenes: CinematicScene[],
  referenceImagesBase64: string[],
  useFallback: boolean = true
): Promise<Map<number, ImageGenerationResult>> {
  const results = new Map<number, ImageGenerationResult>();
  let quotaExceeded = false;
  
  // 🌱 GENERAR SEMILLA BASE para coherencia visual entre escenas
  // Usar timestamp + random para unicidad, pero consistente dentro de la sesión
  const baseSeed = Math.floor(Date.now() / 1000) + Math.floor(Math.random() * 1000);
  
  logger.log(`🎨 Generando ${scenes.length} escenas con ${referenceImagesBase64.length} referencias faciales`);
  logger.log(`📌 Fallback a FAL AI: ${useFallback ? 'ACTIVADO' : 'DESACTIVADO'}`);
  logger.log(`🌱 Semilla base para coherencia visual: ${baseSeed}`);
  
  for (const scene of scenes) {
    logger.log(`🎬 Generando escena ${scene.id}/${scenes.length}...`);
    
    // Construir prompt cinematográfico detallado
    const cinematicPrompt = `
Professional cinematic photography for a music video:

Scene: ${scene.scene}
Camera Setup: ${scene.camera}
Lighting: ${scene.lighting}
Visual Style: ${scene.style}
Camera Movement: ${scene.movement}

Create a high-quality, professional music video frame with cinematic composition, perfect lighting, and stunning visual aesthetics.
    `.trim();
    
    // Intentar primero con Gemini
    let result = await generateImageWithMultipleFaceReferences(cinematicPrompt, referenceImagesBase64);
    
    // CRÍTICO: Extraer número del scene.id para calcular semilla y key
    // scene.id puede ser "scene-1", "scene-2", etc.
    const sceneIdStr = String(scene.id);
    const sceneNumber = sceneIdStr.includes('scene-') 
      ? parseInt(sceneIdStr.replace('scene-', '')) 
      : parseInt(sceneIdStr);
    
    // Calcular semilla única para esta escena (mantiene coherencia visual)
    const sceneSeed = baseSeed + sceneNumber;
    
    // Si falla y el fallback está activado, intentar con FAL AI
    if (!result.success && useFallback && !quotaExceeded) {
      logger.log(`⚠️ Gemini falló para escena ${scene.id}, intentando con FAL AI...`);
      result = await generateImageWithFAL(cinematicPrompt, referenceImagesBase64, sceneSeed);
      
      if (result.success) {
        logger.log(`✅ Escena ${scene.id} generada exitosamente con FAL AI (fallback)`);
      }
    }
    
    results.set(sceneNumber, result);
    
    // Si se detecta error de cuota, detener la generación
    if ((result as any).quotaError) {
      logger.log(`⚠️ Cuota de API excedida después de generar ${results.size} imágenes. Deteniendo generación.`);
      quotaExceeded = true;
      break;
    }
    
    // Delay para evitar rate limiting (1.5 segundos entre requests)
    if (scenes.indexOf(scene) < scenes.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
  }
  
  if (quotaExceeded) {
    logger.log(`⚠️ Generación detenida por límite de cuota: ${results.size}/${scenes.length} imágenes creadas`);
  } else {
    logger.log(`✅ Generación completada: ${results.size} imágenes creadas`);
  }
  
  return results;
}

/**
 * Genera una imagen usando FAL AI FLUX Kontext [Pro] con referencias faciales
 * MODELO ESPECIALIZADO EN PRESERVAR ROSTROS (85-95% consistencia)
 * USAR IMÁGENES DE REFERENCIA SUBIDAS POR EL USUARIO
 * USA SEMILLA (SEED) PARA COHERENCIA VISUAL
 */
export async function generateImageWithFAL(
  prompt: string,
  referenceImagesBase64: string[],
  seed?: number
): Promise<ImageGenerationResult> {
  try {
    // Importar axios dinámicamente
    const axios = (await import('axios')).default;
    
    // Obtener la API key de FAL
    const FAL_API_KEY = process.env.FAL_API_KEY;
    
    if (!FAL_API_KEY) {
      return {
        success: false,
        error: 'FAL_API_KEY no configurada'
      };
    }
    
    // 👤 CRÍTICO: Mejorar prompt para PRESERVAR IDENTIDAD FACIAL
    // El prompt debe enfocarse en la acción/escena, NO en describir la cara
    const enhancedPrompt = `${prompt}. Maintain exact facial features and identity, professional photography, cinematic lighting, 8k resolution.`;
    
    logger.log(`🎨 Generando con FAL AI FLUX Kontext Pro (${referenceImagesBase64.length} referencias, seed: ${seed || 'auto'})...`);
    
    // CRÍTICO: Decidir modelo según si hay referencias faciales
    let endpoint: string;
    const requestBody: any = {
      prompt: enhancedPrompt,
      num_images: 1,
      enable_safety_checker: false,
      output_format: 'jpeg'
    };
    
    // 🌱 CRÍTICO: Agregar semilla para coherencia visual
    if (seed !== undefined) {
      requestBody.seed = seed;
      logger.log(`🌱 Usando semilla ${seed} para coherencia visual (color, tono, estilo)`);
    }
    
    // 👤 SI HAY REFERENCIAS FACIALES: Usar FLUX Kontext Pro (especializado en preservar rostros)
    if (referenceImagesBase64 && referenceImagesBase64.length > 0) {
      endpoint = 'https://fal.run/fal-ai/flux-pro/kontext';
      
      // Usar la primera imagen de referencia como base
      const referenceImage = referenceImagesBase64[0];
      
      // Convertir base64 a data URI si no lo es ya
      const imageDataUri = referenceImage.startsWith('data:') 
        ? referenceImage 
        : `data:image/jpeg;base64,${referenceImage}`;
      
      requestBody.image_url = imageDataUri;
      
      // PARÁMETROS OPTIMIZADOS PARA PRESERVAR ROSTRO:
      requestBody.guidance_scale = 4.5; // 4.0-5.0 = máxima preservación facial
      requestBody.num_inference_steps = 35; // 35-40 = mejor detalle facial
      
      logger.log(`👤 FLUX Kontext Pro activado - PRESERVACIÓN FACIAL MÁXIMA`);
      logger.log(`✅ guidance_scale: 4.5 (alta preservación)`);
      logger.log(`✅ num_inference_steps: 35 (máxima calidad)`);
      
    } else {
      // SIN REFERENCIAS: Usar FLUX Pro v1.1 estándar
      endpoint = 'https://fal.run/fal-ai/flux-pro/v1.1';
      requestBody.image_size = 'landscape_16_9';
      requestBody.num_inference_steps = 28;
      requestBody.guidance_scale = 3.5;
      
      logger.log(`🎨 FLUX Pro v1.1 - Generación sin referencia facial`);
    }
    
    // Hacer request al endpoint apropiado
    const response = await axios.post(
      endpoint,
      requestBody,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000 // 2 minutos por la mayor calidad
      }
    );
    
    // Verificar si hay imágenes en la respuesta
    if (response.data && response.data.images && response.data.images.length > 0) {
      const tempImageUrl = response.data.images[0].url;
      
      logger.log(`✅ Imagen generada con FAL AI Kontext Pro, descargando y subiendo a Storage...`);
      
      // Descargar imagen temporal de FAL y subirla a Firebase Storage
      const imageResponse = await axios.get(tempImageUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      const imageBase64 = Buffer.from(imageResponse.data).toString('base64');
      const mimeType = imageResponse.headers['content-type'] || 'image/png';
      
      // Subir a Firebase Storage
      const storageUrl = await uploadBase64ToStorage(imageBase64, mimeType, 'generated-images');
      
      return {
        success: true,
        imageUrl: storageUrl,
        provider: 'fal-kontext',
        error: undefined
      };
    }
    
    return {
      success: false,
      error: 'No se generaron imágenes con FAL AI'
    };
    
  } catch (error: any) {
    logger.error('Error generando imagen con FAL AI:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Error al generar imagen con FAL AI'
    };
  }
}
