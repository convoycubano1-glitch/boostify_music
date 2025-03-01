import axios from 'axios';
import { 
  freepikService, 
  FreepikModel, 
  FreepikAspectRatio, 
  FreepikBaseOptions,
  FreepikMysticOptions,
  FreepikImagen3Options,
  FreepikClassicOptions,
  FreepikFluxDevOptions,
  FreepikGenerationOptions
} from './freepik-service';

// Import Freepik storage service
import { freepikStorageService } from './freepik-storage-service';

import { 
  GenerateImageParams,
  VideoGenerationParams,
  ImageResult as ImportedImageResult,
  VideoResult as ImportedVideoResult, 
  ApiProvider
} from '../types/model-types';

// Re-export these interfaces so they can be imported from this module
export type ImageResult = ImportedImageResult;
export type VideoResult = ImportedVideoResult;

// Configuración para determinar si usar API directa o proxy de servidor
const useDirectApi = {
  freepik: false, // Usar proxy del servidor debido a restricciones CORS
  fal: false,     // Seguir usando proxy para Fal por ahora
  kling: false,   // Seguir usando proxy para Kling por ahora
  luma: false,    // Seguir usando proxy para Luma por ahora
};

// Verificar si las claves API están disponibles en el cliente
function hasApiKey(provider: string): boolean {
  switch (provider) {
    case 'freepik':
      return !!import.meta.env.VITE_FREEPIK_KEY;
    case 'fal':
      return !!import.meta.env.VITE_FAL_KEY;
    case 'kling':
      return !!import.meta.env.VITE_KLING_API_KEY;
    case 'luma':
      return !!import.meta.env.VITE_LUMA_API_KEY;
    default:
      return false;
  }
}

/**
 * Generate image using Fal.ai through our server proxy
 * @param params Image generation parameters
 * @returns Promise with generated image result
 */
async function generateWithFal(params: Omit<GenerateImageParams, 'apiProvider'>): Promise<ImageResult> {
  try {
    const enhancedPrompt = enhancePrompt(params.prompt);
    
    // Utilizar el proxy del servidor en lugar de llamar directamente a Fal.ai
    const response = await axios.post(
      '/api/proxy/fal/generate-image',
      {
        prompt: enhancedPrompt,
        negativePrompt: params.negativePrompt || 'blurry, bad quality, distorted, disfigured',
        imageSize: params.imageSize || 'medium',
        imageCount: params.imageCount || 1
      }
    );

    if (response.data && response.data.images && response.data.images.length > 0) {
      return {
        url: response.data.images[0],
        provider: 'fal',
        requestId: response.data.request_id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    // Si no hay imágenes pero hay un fallback, utiliza el fallback
    if (response.data && response.data.fallback && response.data.fallback.images) {
      return {
        url: response.data.fallback.images[0],
        provider: 'fal (fallback)',
        requestId: response.data.fallback.request_id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate image with Fal.ai');
  } catch (error) {
    console.error('Error generating image with Fal.ai:', error);
    
    // No usamos fallback automático, solo informamos del error
    console.log('Error en la generación de imagen con Fal.ai, se recomienda usar Freepik directamente');
    throw new Error('Image generation with Fal.ai failed. Please try again with Freepik.');
  }
}

/**
 * Generate image using Freepik API directly or through server proxy
 * @param params Image generation parameters
 * @returns Promise with generated image result
 */
async function generateWithFreepik(params: Omit<GenerateImageParams, 'apiProvider'>): Promise<ImageResult> {
  // Determinar si se debe usar la API directa o el proxy del servidor
  const shouldUseDirectApi = (params.useDirectApi !== undefined) 
    ? params.useDirectApi 
    : (useDirectApi.freepik && hasApiKey('freepik'));

  // Si tenemos la clave API y está configurado para usar API directo
  if (shouldUseDirectApi) {
    try {
      console.log('Using direct Freepik API integration');
      
      // Convertir el aspect_ratio a formato de Freepik
      let aspect_ratio: 'square_1_1' | 'classic_4_3' | 'traditional_3_4' | 'widescreen_16_9' | 
                        'social_story_9_16' | 'smartphone_horizontal_20_9' | 'smartphone_vertical_9_20' | 
                        'standard_3_2' | 'portrait_2_3' | 'horizontal_2_1' | 'vertical_1_2' | 
                        'social_5_4' | 'social_post_4_5' = 'square_1_1'; // Default
      
      if (params.aspectRatio) {
        // Mapeo de formatos comunes
        const aspectRatioMap: Record<string, 'square_1_1' | 'classic_4_3' | 'traditional_3_4' | 'widescreen_16_9' | 
                                           'social_story_9_16' | 'smartphone_horizontal_20_9' | 'smartphone_vertical_9_20' | 
                                           'standard_3_2' | 'portrait_2_3' | 'horizontal_2_1' | 'vertical_1_2' | 
                                           'social_5_4' | 'social_post_4_5'> = {
          '1:1': 'square_1_1',
          '4:3': 'classic_4_3',
          '3:4': 'traditional_3_4',
          '16:9': 'widescreen_16_9',
          '9:16': 'social_story_9_16',
          '3:2': 'standard_3_2',
          '2:3': 'portrait_2_3',
          '2:1': 'horizontal_2_1',
          '1:2': 'vertical_1_2',
          '5:4': 'social_5_4',
          '4:5': 'social_post_4_5'
        };
        
        // Si el formato existe en el mapa, usa ese, de lo contrario usa el default
        if (params.aspectRatio in aspectRatioMap) {
          aspect_ratio = aspectRatioMap[params.aspectRatio as keyof typeof aspectRatioMap];
        }
      }
      
      // Determinar el modelo a utilizar
      const freepikModel = params.freepikModel || FreepikModel.MYSTIC;
      
      // Preparar opciones base para todos los modelos
      const baseOptions = {
        prompt: params.prompt,
        aspect_ratio
      };
      
      // Personalizar opciones según el modelo seleccionado
      let modelOptions;
      
      switch (freepikModel) {
        case FreepikModel.IMAGEN3:
          // Create a correctly typed Imagen3 options object
          const imagen3Options: FreepikImagen3Options = {
            ...baseOptions,
            num_images: params.imageCount || 1,
            // Extract style from prompt if present using style_preset instead of styling object
            style_preset: params.prompt.includes('style: ') ? params.prompt.split('style: ')[1].split(',')[0] : undefined,
            person_generation: 'allow_all',
            safety_settings: 'block_none'
          };
          
          modelOptions = imagen3Options;
          break;
          
        case FreepikModel.CLASSIC:
          // Create correctly typed Classic options object
          const classicOptions: FreepikClassicOptions = {
            ...baseOptions,
            negative_prompt: params.negativePrompt,
            guidance_scale: 1.2,
            num_images: params.imageCount || 1,
            seed: Math.floor(Math.random() * 1000000)
          };
          
          modelOptions = classicOptions;
          break;
          
        case FreepikModel.FLUX_DEV:
          // Make sure resolution value follows type constraints
          const fluxResolution: 'high' | 'medium' | 'low' = 
            params.imageSize === 'large' ? 'high' : 
            params.imageSize === 'small' ? 'low' : 'medium';
            
          // Create correctly typed FluxDev options object
          const fluxDevOptions: FreepikFluxDevOptions = {
            ...baseOptions,
            resolution: fluxResolution,
            // Extract style from prompt if present
            style_preset: params.prompt.includes('style: ') ? params.prompt.split('style: ')[1].split(',')[0] : undefined,
            seed: Math.floor(Math.random() * 100000000) + 1
          };
          
          modelOptions = fluxDevOptions;
          break;
          
        default: // MYSTIC
          // Convert general imageSize to Mystic-specific resolution
          const mysticResolution: '4k' | '2k' = (params.imageSize === 'large') ? '4k' : '2k';
          
          // Ensure engine value is correctly typed
          const mysticEngine: 'automatic' | 'magnific_illusio' | 'magnific_sharpy' | 'magnific_sparkle' = 'automatic';
          
          // Create correctly typed Mystic options object
          const mysticOptions: FreepikMysticOptions = {
            ...baseOptions,
            resolution: mysticResolution,
            realism: true,
            creative_detailing: 33,
            engine: mysticEngine,
            fixed_generation: false,
            filter_nsfw: true
          };
          
          modelOptions = mysticOptions;
      }
      
      // Usar nuestro servicio de cliente directo con el modelo seleccionado
      const response = await freepikService.generateImage(modelOptions, freepikModel);

      // La respuesta de Freepik es asíncrona, devuelve un task_id
      if (response.data && response.data.task_id) {
        // Para la primera llamada, no tenemos URL todavía, así que devolvemos un task_id
        // que se puede usar para verificar el estado más adelante
        const imageResult: ImageResult = {
          url: '', // URL estará vacía inicialmente
          provider: `freepik-${freepikModel}`,
          taskId: response.data.task_id,
          status: 'IN_PROGRESS',
          prompt: params.prompt,
          createdAt: new Date()
        };
        
        // Check if we already have this task ID in Firestore
        const existingImage = await freepikStorageService.findImageByTaskId(response.data.task_id);
        if (existingImage && existingImage.url) {
          console.log('Found existing Freepik image in Firestore for task ID:', response.data.task_id);
          return existingImage;
        }
        
        // No existing image found, store the pending task
        try {
          const firestoreId = await freepikStorageService.saveImage(imageResult);
          return {
            ...imageResult,
            firestoreId
          };
        } catch (storageError) {
          console.error('Error saving Freepik task to Firestore:', storageError);
          return imageResult;
        }
      }

      throw new Error(`Failed to start image generation with Freepik (${freepikModel})`);
    } catch (error) {
      console.error('Error generating image with direct Freepik API:', error);
      // Si falla la API directa, intentamos con el proxy del servidor
      console.log('Falling back to server proxy for Freepik');
    }
  }

  // Si no podemos usar la API directa o falló, usamos el proxy del servidor
  try {
    // Utilizar el proxy del servidor
    const response = await axios.post(
      '/api/proxy/freepik/generate-image',
      {
        prompt: params.prompt,
        negativePrompt: params.negativePrompt || '',
        aspectRatio: params.aspectRatio || '1:1',
        count: params.imageCount || 1
      }
    );

    if (response.data && response.data.images && response.data.images.length > 0) {
      return {
        url: response.data.images[0].url,
        provider: 'freepik',
        requestId: response.data.id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    // Si no hay imágenes pero hay un fallback, utiliza el fallback
    if (response.data && response.data.fallback && response.data.fallback.images) {
      return {
        url: response.data.fallback.images[0].url,
        provider: 'freepik (fallback)',
        requestId: response.data.fallback.id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate image with Freepik');
  } catch (error) {
    console.error('Error generating image with Freepik server proxy:', error);
    // Throw error - no fallback to Unsplash
    throw new Error('Image generation with Freepik failed. Please try again later.');
  }
}

/**
 * Generate image using Kling AI through our server proxy
 * @param params Image generation parameters
 * @returns Promise with generated image result
 */
async function generateWithKling(params: Omit<GenerateImageParams, 'apiProvider'>): Promise<ImageResult> {
  try {
    // Utilizar el proxy del servidor en lugar de llamar directamente a Kling
    const response = await axios.post(
      '/api/proxy/kling/generate-image',
      {
        prompt: params.prompt,
        negative_prompt: params.negativePrompt || '',
        size: params.imageSize || 'medium',
        n: params.imageCount || 1
      }
    );

    if (response.data && response.data.data && response.data.data.length > 0) {
      return {
        url: response.data.data[0].url,
        provider: 'kling',
        requestId: response.data.id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    // Si no hay imágenes pero hay un fallback, utiliza el fallback
    if (response.data && response.data.fallback && response.data.fallback.data) {
      return {
        url: response.data.fallback.data[0].url,
        provider: 'kling (fallback)',
        requestId: response.data.fallback.id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate image with Kling');
  } catch (error) {
    console.error('Error generating image with Kling:', error);
    // No usamos fallback automático, solo informamos del error
    throw new Error('Image generation with Kling failed. Please use Freepik directly for better results.');
  }
}

/**
 * Generate video using Luma API through our server proxy
 * @param params Video generation parameters
 * @returns Promise with generated video result
 */
async function generateVideoWithLuma(params: Omit<VideoGenerationParams, 'apiProvider'>): Promise<VideoResult> {
  try {
    // Utilizar el proxy del servidor en lugar de llamar directamente a Luma
    const response = await axios.post(
      '/api/proxy/luma/generate-video',
      {
        prompt: params.prompt,
        duration: params.duration || 5,
        style: params.style || 'cinematic'
      }
    );

    if (response.data && response.data.id) {
      // Si tenemos respuesta con ID y posiblemente URL
      return {
        url: response.data.output?.url || 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        provider: 'luma',
        requestId: response.data.id,
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    // Si no hay ID pero hay un fallback, utiliza el fallback
    if (response.data && response.data.fallback) {
      return {
        url: response.data.fallback.output?.url || 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
        provider: 'luma (fallback)',
        requestId: response.data.fallback.id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate video with Luma');
  } catch (error) {
    console.error('Error generating video with Luma:', error);
    // Fallback garantizado para demos
    return {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      provider: 'luma (error fallback)',
      prompt: params.prompt,
      createdAt: new Date()
    };
  }
}

/**
 * Generate video using Kling API through our server proxy
 * @param params Video generation parameters
 * @returns Promise with generated video result
 */
async function generateVideoWithKling(params: Omit<VideoGenerationParams, 'apiProvider'>): Promise<VideoResult> {
  try {
    // Utilizar el proxy del servidor en lugar de llamar directamente a Kling
    const response = await axios.post(
      '/api/proxy/kling/generate-video',
      {
        prompt: params.prompt,
        duration: params.duration || 5,
        style: params.style || 'realistic'
      }
    );

    if (response.data && response.data.id) {
      return {
        url: response.data.output?.url || 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        provider: 'kling',
        requestId: response.data.id,
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    // Si no hay ID pero hay un fallback, utiliza el fallback
    if (response.data && response.data.fallback) {
      return {
        url: response.data.fallback.output?.url || 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        provider: 'kling (fallback)',
        requestId: response.data.fallback.id || '',
        prompt: params.prompt,
        createdAt: new Date()
      };
    }

    throw new Error('Failed to generate video with Kling');
  } catch (error) {
    console.error('Error generating video with Kling:', error);
    // Fallback garantizado para demos
    return {
      url: 'https://storage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      provider: 'kling (error fallback)',
      prompt: params.prompt,
      createdAt: new Date()
    };
  }
}

/**
 * Enhance prompt with additional details for better results
 * @param originalPrompt Original prompt from user
 * @returns Enhanced prompt for better generation results
 */
function enhancePrompt(originalPrompt: string): string {
  if (originalPrompt.includes('detailed instructions:')) {
    return originalPrompt;
  }
  
  // Add quality boosters and details if not already present
  return `${originalPrompt}, high quality, detailed, 4k, professional photography, masterpiece`;
}

/**
 * Generate image using specified provider
 * @param params Generation parameters including provider selection
 * @returns Promise with generated image result
 */
/**
 * Generates an image using Freepik exclusively
 * This implementation explicitly uses Freepik as the sole provider
 * and ensures Firestore integration for storage
 * 
 * @param params Generation parameters
 * @returns Promise with the generated image result
 */
export async function generateImage(params: GenerateImageParams): Promise<ImageResult> {
  // Force 'freepik' as the only valid provider
  const freepikParams = {
    ...params,
    apiProvider: 'freepik' as ApiProvider
  };
  
  console.log('Using Freepik exclusively for image generation');
  
  // First check if we already have similar images in Firestore for the same prompt
  try {
    const existingImages = await freepikStorageService.getImages();
    
    // Look for completed images with the same or very similar prompt
    const similarImage = existingImages.find(img => 
      img.status === 'COMPLETED' && 
      img.url && 
      img.prompt && 
      img.prompt.toLowerCase().includes(params.prompt.toLowerCase().slice(0, 15))
    );
    
    if (similarImage) {
      console.log('Found similar existing Freepik image in Firestore:', similarImage);
      return similarImage;
    }
  } catch (error) {
    console.error('Error searching existing images in Firestore:', error);
    // Continue with generation if search fails
  }
  
  // Generate new image with Freepik
  return generateWithFreepik(freepikParams);
}

/**
 * Generate video using specified provider
 * @param params Generation parameters including provider selection
 * @returns Promise with generated video result
 */
export async function generateVideo(params: VideoGenerationParams): Promise<VideoResult> {
  switch (params.apiProvider) {
    case 'luma':
      return generateVideoWithLuma(params);
    case 'kling':
      return generateVideoWithKling(params);
    default:
      return generateVideoWithLuma(params);
  }
}

/**
 * Save generated content to Firestore for later retrieval
 * @param result Generation result (image or video)
 * @param contentType Type of content (image or video)
 * @returns Promise resolving to the ID of the saved record
 */
export async function saveGeneratedContent(
  result: ImageResult | VideoResult, 
  contentType: 'image' | 'video'
): Promise<string> {
  try {
    // Si el resultado ya tiene un ID, simplemente lo devolvemos
    if ('firestoreId' in result && result.firestoreId) {
      return result.firestoreId;
    }
    
    // Usamos las funciones específicas de cada tipo de contenido
    if (contentType === 'image') {
      // Check if this is a Freepik image
      if (result.provider === 'freepik' || result.provider?.startsWith('freepik-')) {
        // Use our specialized Freepik storage service
        console.log('Using dedicated Freepik storage service for image');
        return await freepikStorageService.saveImage(result as ImageResult);
      } else {
        // Use general storage for non-Freepik images (should not happen with our implementation)
        console.warn('Using general storage for non-Freepik image');
        const { saveGeneratedImage } = await import('./generated-images-service');
        return await saveGeneratedImage(result as ImageResult);
      }
    } else {
      // For videos, use the standard video storage
      const { saveGeneratedVideo } = await import('./generated-images-service');
      return await saveGeneratedVideo(result as VideoResult);
    }
  } catch (error) {
    console.error(`Error saving generated ${contentType}:`, error);
    // Devolvemos un ID temporal en caso de error para que la UI siga funcionando
    return `generated-${contentType}-${Date.now()}`;
  }
}

/**
 * Verifica el estado de una tarea asíncrona y obtiene el resultado cuando está listo
 * @param taskId ID de la tarea a verificar
 * @param provider Proveedor de la API utilizada
 * @returns Promise con el resultado de la tarea
 */
export async function checkTaskStatus(taskId: string, provider: string): Promise<ImageResult | VideoResult | null> {
  try {
    // First check in Firestore for Freepik images
    if (provider === 'freepik' || provider.startsWith('freepik-')) {
      // Try to find the existing image in Firestore
      const existingImage = await freepikStorageService.findImageByTaskId(taskId);
      
      // If the image is already completed in Firestore, return it directly
      if (existingImage && existingImage.url && existingImage.status === 'COMPLETED') {
        console.log('Found completed Freepik image in Firestore:', existingImage);
        return existingImage;
      }
    }
    
    // Determinar si se debe usar la API directa o el proxy del servidor
    const shouldUseDirectApi = useDirectApi[provider as keyof typeof useDirectApi] && hasApiKey(provider);

    if (provider === 'freepik' && shouldUseDirectApi) {
      // Usar API directa para Freepik
      const response = await freepikService.checkTaskStatus(taskId);
      
      if (response.data) {
        if (response.data.status === 'COMPLETED' && response.data.generated && response.data.generated.length > 0) {
          // Verificar el formato de los datos generados
          let imageUrl = '';
          if (typeof response.data.generated[0] === 'string') {
            imageUrl = response.data.generated[0];
          } else if (response.data.generated[0] && response.data.generated[0].url) {
            imageUrl = response.data.generated[0].url;
          }
          
          console.log("Freepik direct API URL:", imageUrl);
          
          const completedImage: ImageResult = {
            url: imageUrl,
            provider: 'freepik',
            taskId: taskId,
            status: 'COMPLETED',
            prompt: '',  // No tenemos el prompt en esta respuesta
            createdAt: new Date()
          };
          
          // Store completed image in Firestore for future reference
          try {
            const firestoreId = await freepikStorageService.saveImage(completedImage);
            return {
              ...completedImage,
              firestoreId
            };
          } catch (storageError) {
            console.error('Error saving completed Freepik image to Firestore:', storageError);
            return completedImage;
          }
        } else if (response.data.status === 'FAILED') {
          throw new Error('Task failed at Freepik');
        } else {
          // Todavía en progreso
          return {
            url: '',
            provider: 'freepik (processing)',
            taskId: taskId,
            status: response.data.status,
            prompt: '',
            createdAt: new Date()
          };
        }
      }
    } else {
      // Usar proxy del servidor para otros proveedores o si no hay clave API
      // Determinar el endpoint correcto según el proveedor
      let endpoint;
      if (provider === 'freepik') {
        endpoint = `/api/proxy/freepik/task/${taskId}`;
      } else {
        endpoint = `/api/proxy/${provider}/task-status/${taskId}`;
      }
      console.log(`Verificando estado de tarea con ${provider} usando: ${endpoint}`);
      const response = await axios.get(endpoint);
      
      if (response.data) {
        if (response.data.status === 'COMPLETED' || response.data.status === 'completed') {
          // El formato de la respuesta depende del proveedor
          let result: ImageResult | VideoResult = {
            url: '',
            provider,
            taskId,
            status: 'COMPLETED',
            prompt: '',
            createdAt: new Date()
          };
          
          // Tratar diferentes formatos de respuesta según el proveedor
          if (provider === 'freepik') {
            // Manejo especial para Freepik, que puede tener la respuesta anidada en data
            const freepikData = response.data.data || response.data;
            if (freepikData.generated && freepikData.generated.length > 0) {
              // Si es un string, usarlo directamente
              if (typeof freepikData.generated[0] === 'string') {
                result.url = freepikData.generated[0];
              } 
              // Si es un objeto con url, usar esa propiedad
              else if (freepikData.generated[0] && freepikData.generated[0].url) {
                result.url = freepikData.generated[0].url;
              }
              // Si no se cumple ninguna de las anteriores, usar el valor tal cual (podría ser una URL)
              else if (freepikData.generated[0]) {
                result.url = freepikData.generated[0];
              }
              console.log("Freepik image URL:", result.url);
              
              // If we have a URL, store in Firestore
              if (result.url) {
                // Update completed image status
                result.status = 'COMPLETED';
                
                // Store in Firestore for persistence and future retrieval
                try {
                  const firestoreId = await freepikStorageService.saveImage(result);
                  result.firestoreId = firestoreId;
                } catch (storageError) {
                  console.error('Error saving Freepik proxy image to Firestore:', storageError);
                }
              }
            }
          } else if (provider === 'kling' && response.data.data) {
            result.url = response.data.data[0]?.url || '';
          } else if ((provider === 'luma' || provider === 'kling') && response.data.output) {
            result.url = response.data.output.url || '';
          }
          
          return result;
        } else if (response.data.status === 'FAILED' || response.data.status === 'failed') {
          throw new Error(`Task failed at ${provider}`);
        } else {
          // Todavía en progreso
          return {
            url: '',
            provider: `${provider} (processing)`,
            taskId: taskId,
            status: response.data.status,
            prompt: '',
            createdAt: new Date()
          };
        }
      }
    }
    
    return null;
  } catch (error) {
    console.error(`Error checking task status for ${provider}:`, error);
    return null;
  }
}

/**
 * Multi-platform content generator service
 */
export const multiPlatformGenerator = {
  generateImage,
  generateVideo,
  saveGeneratedContent,
  checkTaskStatus
};