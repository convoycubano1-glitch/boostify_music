/**
 * Servicio FAL AI para generación de imágenes y música
 * 
 * MODELOS PRINCIPALES DE LA PLATAFORMA:
 * 
 * 🎨 GENERACIÓN DE IMÁGENES (Text-to-Image):
 *    - fal-ai/nano-banana-pro: Google's Gemini 2.5 Pro - $0.078/imagen
 *    - 2x más rápido que nano-banana, mejor coherencia visual
 *    - Ideal para videos musicales realistas y orgánicos
 *    - Parámetros: prompt, aspect_ratio, num_images, output_format
 * 
 * ✏️ EDICIÓN DE IMÁGENES (Image-to-Image):
 *    - fal-ai/nano-banana-pro/edit: Edición con coherencia visual PRO - $0.078/imagen
 *    - Mejor respeto al guión y coherencia entre escenas
 *    - Parámetros: prompt, image_urls (ARRAY), aspect_ratio, num_images
 *    - IMPORTANTE: image_urls es ARRAY, no image_url singular
 * 
 * 🎵 GENERACIÓN DE MÚSICA CON LETRAS:
 *    - fal-ai/minimax-music/v2: Canciones completas con voces - $0.03/generación
 *    - Parámetros: prompt (estilo/mood), lyrics_prompt (letras con [verse][chorus])
 *    - Genera canciones de duración completa con voces y letras
 */
import axios from 'axios';
import { logger } from '../utils/logger';
import { storage } from '../firebase';

// Configuración de FAL API
const FAL_API_KEY = process.env.FAL_API_KEY || '';
const FAL_BASE_URL = 'https://fal.run';

/**
 * MODELOS FAL PRINCIPALES - NANO BANANA, GROK IMAGINE VIDEO & MINIMAX MUSIC
 * 
 * WORKFLOW RECOMENDADO PARA MUSIC VIDEOS:
 * 1. Generar imagen con nano-banana (Text-to-Image) - $0.039/imagen
 * 2. Convertir a video con Grok Imagine Video - $0.05/segundo ($0.30/6s video)
 * 3. Editar video con Grok Edit - $0.06/segundo input+output
 * 
 * Imágenes: $0.039 por imagen (~25 imágenes por $1)
 * Videos: $0.05/segundo (~3 videos de 6s por $1)
 * Música: $0.03 por generación (~33 canciones por $1)
 */
export const FAL_MODELS = {
  // ========== IMÁGENES - NANO BANANA PRO ==========
  // Generación Text-to-Image (solo prompt) - PRINCIPAL
  // PRO: 2x más rápido, mejor coherencia visual, más realista ($0.078/imagen)
  IMAGE_GENERATION: 'fal-ai/nano-banana-pro',
  // Edición Image-to-Image (requiere image_urls como ARRAY)
  IMAGE_EDIT: 'fal-ai/nano-banana-pro/edit',
  // Merchandise (alias de edición)
  MERCHANDISE_EDIT: 'fal-ai/nano-banana-pro/edit',
  
  // ========== VIDEO - GROK IMAGINE (xAI) - PRINCIPAL ==========
  // Grok Imagine Video: Image-to-Video de alta calidad con audio
  // Duración: 6 segundos, Resolución: 480p/720p, Incluye audio nativo
  GROK_IMAGE_TO_VIDEO: 'xai/grok-imagine-video/image-to-video',
  // Grok Edit Video: Video-to-Video para ediciones y transformaciones
  // Edita videos existentes con prompts de texto (colorizar, estilizar, etc.)
  GROK_EDIT_VIDEO: 'xai/grok-imagine-video/edit-video',
  
  // ========== VIDEO - FALLBACK ==========
  // Wan 2.6 Image-to-Video: Convierte imágenes estáticas a videos animados
  // Duración: ~5 segundos, resolución 480p/720p
  IMAGE_TO_VIDEO: 'fal-ai/wan/v2.6/image-to-video',
  IMAGE_TO_VIDEO_FALLBACK: 'fal-ai/wan/v2.6/image-to-video',
  
  // ========== MÚSICA ==========
  // MiniMax Music V2: Canciones completas con voces y letras
  // Requiere: prompt (estilo) + lyrics_prompt (letras con [verse][chorus])
  MUSIC_GENERATION: 'fal-ai/minimax-music/v2',
  
  // ========== LEGACY (mantener compatibilidad) ==========
  FLUX_SCHNELL: 'fal-ai/flux/schnell',
  STABLE_AUDIO: 'fal-ai/stable-audio', // Legacy - usar MUSIC_GENERATION
} as const;

// Aspect ratios soportados por nano-banana
export const NANO_BANANA_ASPECT_RATIOS = [
  '21:9', '16:9', '3:2', '4:3', '5:4', '1:1', '4:5', '3:4', '2:3', '9:16'
] as const;

export type NanoBananaAspectRatio = typeof NANO_BANANA_ASPECT_RATIOS[number];

export interface FalImageResult {
  success: boolean;
  imageUrl?: string;
  imageBase64?: string;
  error?: string;
  provider?: 'fal-nano-banana' | 'fal-nano-banana-edit' | 'fal-flux-schnell' | 'fal-flux-dev';
}

export interface FalVideoResult {
  success: boolean;
  videoUrl?: string;
  duration?: number;
  width?: number;
  height?: number;
  fps?: number;
  numFrames?: number;
  error?: string;
  provider?: 'fal-grok-image-to-video' | 'fal-grok-edit-video' | 'fal-wan-image-to-video';
}

export interface FalMusicResult {
  success: boolean;
  audioUrl?: string;
  audioBase64?: string;
  duration?: number;
  lyrics?: string;
  error?: string;
  provider?: 'fal-minimax-music-v2' | 'fal-stable-audio';
}

/**
 * Sube un archivo base64 a Firebase Storage y devuelve su URL pública
 */
async function uploadBase64ToStorage(
  base64Data: string,
  mimeType: string = 'image/png',
  folder: string = 'fal-generated'
): Promise<string> {
  try {
    if (!storage) {
      logger.warn('[FAL] Firebase Storage no disponible, usando data URL');
      return `data:${mimeType};base64,${base64Data}`;
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(7);
    const extension = mimeType.split('/')[1] || 'png';
    const fileName = `${folder}/${timestamp}_${randomId}.${extension}`;

    const imageBuffer = Buffer.from(base64Data, 'base64');
    const bucket = storage.bucket();
    const file = bucket.file(fileName);

    await file.save(imageBuffer, {
      metadata: { contentType: mimeType },
      public: true,
      validation: false,
    });

    await file.makePublic();
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;
    
    logger.log(`[FAL] Archivo subido a Storage: ${publicUrl}`);
    return publicUrl;
  } catch (error: any) {
    logger.error('[FAL] Error subiendo a Storage:', error.message);
    return `data:${mimeType};base64,${base64Data}`;
  }
}

/**
 * Descarga una imagen desde URL y la convierte a base64
 */
async function downloadImageAsBase64(imageUrl: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const base64 = Buffer.from(response.data).toString('base64');
    const mimeType = response.headers['content-type'] || 'image/png';
    return { base64, mimeType };
  } catch (error: any) {
    logger.error('[FAL] Error descargando imagen:', error.message);
    return null;
  }
}

/**
 * ============================================================
 * GENERACIÓN DE IMÁGENES - FAL AI NANO BANANA (Text-to-Image)
 * ============================================================
 * Modelo: fal-ai/nano-banana (Google Gemini 2.5 Flash Image)
 * Precio: $0.039 por imagen
 * 
 * @param prompt - Descripción de la imagen a generar
 * @param options - Opciones adicionales (aspectRatio, numImages, outputFormat)
 */
export async function generateImageWithNanoBanana(
  prompt: string,
  options: {
    aspectRatio?: NanoBananaAspectRatio;
    numImages?: number;
    outputFormat?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<FalImageResult> {
  try {
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }

    logger.log(`[FAL] 🎨 Generando imagen con nano-banana (Text-to-Image)...`);
    logger.log(`[FAL] Prompt: ${prompt.substring(0, 100)}...`);

    // Parámetros según documentación oficial de nano-banana
    const requestBody = {
      prompt: prompt,
      num_images: options.numImages || 1,
      aspect_ratio: options.aspectRatio || '1:1',
      output_format: options.outputFormat || 'png',
    };

    logger.log(`[FAL] Request a nano-banana:`, JSON.stringify(requestBody));

    const response = await axios.post(
      `${FAL_BASE_URL}/${FAL_MODELS.IMAGE_GENERATION}`,
      requestBody,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    if (response.data?.images?.[0]?.url) {
      const tempUrl = response.data.images[0].url;
      logger.log(`[FAL] ✅ Imagen generada con nano-banana`);

      // Descargar y subir a Firebase Storage
      const downloaded = await downloadImageAsBase64(tempUrl);
      if (downloaded) {
        const permanentUrl = await uploadBase64ToStorage(
          downloaded.base64,
          downloaded.mimeType,
          'artist-images'
        );

        return {
          success: true,
          imageUrl: permanentUrl,
          imageBase64: downloaded.base64,
          provider: 'fal-nano-banana'
        };
      }
    }

    throw new Error('No se recibió imagen en la respuesta');
  } catch (error: any) {
    logger.error('[FAL] Error generando imagen con nano-banana:', error.response?.data || error.message);
    
    // 🔧 FALLBACK: Intentar con Gemini cuando FAL falla
    logger.log('[FAL] 🔄 Intentando fallback con Gemini...');
    try {
      const geminiService = await import('./gemini-image-service');
      const geminiResult = await geminiService.generateCinematicImage(prompt, {
        aspectRatio: options.aspectRatio || '1:1'
      });
      
      if (geminiResult.success && geminiResult.imageUrl) {
        logger.log('[FAL] ✅ Fallback Gemini exitoso');
        return {
          success: true,
          imageUrl: geminiResult.imageUrl,
          imageBase64: geminiResult.imageBase64,
          provider: 'gemini-fallback'
        };
      }
    } catch (geminiError: any) {
      logger.error('[FAL] ❌ Fallback Gemini también falló:', geminiError.message);
    }
    
    return {
      success: false,
      error: error.response?.data?.detail || error.message
    };
  }
}

/**
 * ============================================================
 * EDICIÓN DE IMÁGENES - FAL AI NANO BANANA EDIT (Image-to-Image)
 * ============================================================
 * Modelo: fal-ai/nano-banana/edit
 * Precio: $0.039 por imagen
 * 
 * IMPORTANTE: Requiere image_urls como ARRAY, no image_url singular
 * 
 * @param imageUrls - Array de URLs de imágenes a usar como referencia
 * @param editPrompt - Instrucciones de edición
 * @param options - Opciones adicionales (aspectRatio, numImages)
 */
export async function editImageWithNanoBanana(
  imageUrls: string | string[],
  editPrompt: string,
  options: {
    aspectRatio?: NanoBananaAspectRatio;
    numImages?: number;
    outputFormat?: 'jpeg' | 'png' | 'webp';
  } = {}
): Promise<FalImageResult> {
  try {
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }

    logger.log(`[FAL] ✏️ Editando imagen con nano-banana/edit (Image-to-Image)...`);
    logger.log(`[FAL] Prompt: ${editPrompt.substring(0, 100)}...`);

    // Convertir a array si es string único
    const imageUrlsArray = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    
    logger.log(`[FAL] Imágenes de referencia: ${imageUrlsArray.length}`);

    // nano-banana/edit requiere image_urls como ARRAY
    const requestBody = {
      prompt: editPrompt,
      image_urls: imageUrlsArray, // ARRAY de URLs - requisito de nano-banana/edit
      num_images: options.numImages || 1,
      aspect_ratio: options.aspectRatio || 'auto',
      output_format: options.outputFormat || 'png',
    };

    logger.log(`[FAL] Request a nano-banana/edit:`, JSON.stringify(requestBody));

    const response = await axios.post(
      `${FAL_BASE_URL}/${FAL_MODELS.IMAGE_EDIT}`,
      requestBody,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 120000
      }
    );

    if (response.data?.images?.[0]?.url) {
      const tempUrl = response.data.images[0].url;
      logger.log(`[FAL] ✅ Imagen editada con nano-banana/edit`);

      const downloaded = await downloadImageAsBase64(tempUrl);
      if (downloaded) {
        const permanentUrl = await uploadBase64ToStorage(
          downloaded.base64,
          downloaded.mimeType,
          'artist-images-edited'
        );

        return {
          success: true,
          imageUrl: permanentUrl,
          imageBase64: downloaded.base64,
          provider: 'fal-nano-banana-edit'
        };
      }
    }

    throw new Error('No se recibió imagen editada en la respuesta');
  } catch (error: any) {
    logger.error('[FAL] Error editando imagen con nano-banana/edit:', error.response?.data || error.message);
    
    // 🎭 CONSISTENCY FIX: Retry with single reference before falling back without any reference
    const imageUrlsArray = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
    if (imageUrlsArray.length > 1) {
      logger.warn('[FAL] 🔄 Retrying with single reference image (first only)...');
      try {
        const retryResult = await editImageWithNanoBanana(
          [imageUrlsArray[0]], // Use only the first/frontal reference
          editPrompt,
          options
        );
        if (retryResult.success) {
          logger.log('[FAL] ✅ Retry with single reference succeeded');
          return retryResult;
        }
      } catch (retryError: any) {
        logger.warn('[FAL] ❌ Single reference retry also failed:', retryError.message);
      }
    }
    
    // Final fallback: generate without reference (LOGS WARNING for tracking)
    logger.warn('[FAL] ⚠️ FALLBACK: Generating WITHOUT face reference - consistency may be lost');
    return generateImageWithNanoBanana(editPrompt, { 
      aspectRatio: options.aspectRatio || '1:1' 
    });
  }
}

/**
 * Alias para editImageWithNanoBanana - usado por shot-variation-engine
 */
export const generateImageWithEdit = editImageWithNanoBanana;

/**
 * ============================================================
 * GENERACIÓN CON REFERENCIA FACIAL - NANO BANANA EDIT
 * ============================================================
 * Usa nano-banana/edit para mantener consistencia del rostro
 * 
 * @param prompt - Descripción de la imagen a generar
 * @param referenceImageUrl - URL de la imagen de referencia (rostro del artista)
 * @param options - Opciones adicionales
 */
export async function generateImageWithFaceReference(
  prompt: string,
  referenceImageUrl: string,
  options: {
    aspectRatio?: NanoBananaAspectRatio;
  } = {}
): Promise<FalImageResult> {
  try {
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }

    logger.log(`[FAL] 👤 Generando imagen con referencia facial usando nano-banana/edit...`);

    // Verificar que la URL de referencia sea accesible
    if (!referenceImageUrl || referenceImageUrl.includes('placeholder')) {
      logger.warn('[FAL] No hay imagen de referencia válida, usando nano-banana (generación)');
      return generateImageWithNanoBanana(prompt, { aspectRatio: options.aspectRatio || '16:9' });
    }

    // Mejorar prompt para mantener la identidad facial
    const enhancedPrompt = `${prompt}. Maintain exact facial features and identity from the reference image. Same face, same person, same skin tone.`;

    // Usar nano-banana/edit con la imagen de referencia
    return editImageWithNanoBanana(
      [referenceImageUrl],
      enhancedPrompt,
      { aspectRatio: options.aspectRatio || '16:9' }
    );

  } catch (error: any) {
    logger.error('[FAL] Error generando imagen con referencia:', error.response?.data || error.message);
    
    // Fallback: generar sin referencia
    return generateImageWithNanoBanana(prompt, { aspectRatio: options.aspectRatio || '16:9' });
  }
}

/**
 * ============================================================
 * GENERACIÓN DE MÚSICA - FAL AI MINIMAX MUSIC V2
 * ============================================================
 * Modelo: fal-ai/minimax-music/v2
 * Genera canciones completas con voces y letras
 * Precio: $0.03 por generación
 * 
 * @param stylePrompt - Descripción del estilo/género/mood (10-300 caracteres)
 *                      Ejemplo: "Pop, upbeat, energetic, catchy hooks, modern production"
 * @param lyricsPrompt - Letras de la canción con tags (10-3000 caracteres)
 *                       Tags soportados: [verse], [chorus], [bridge], [intro], [outro]
 *                       Ejemplo: "[verse]Walking down the street...\n[chorus]We are the champions..."
 * @param options - Opciones adicionales de audio
 */
export async function generateMusicWithMiniMax(
  stylePrompt: string,
  lyricsPrompt: string,
  options: {
    sampleRate?: 44100 | 32000 | 24000; // Sample rate (default: 44100)
    bitrate?: 32000 | 64000 | 128000 | 256000; // Bitrate (default: 128000)
    format?: 'mp3' | 'wav' | 'flac'; // Formato de salida (default: mp3)
  } = {}
): Promise<FalMusicResult> {
  try {
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }

    logger.log(`[FAL] Generando música con MiniMax Music V2...`);
    logger.log(`[FAL] Estilo: ${stylePrompt.substring(0, 100)}...`);
    logger.log(`[FAL] Letras: ${lyricsPrompt.substring(0, 100)}...`);

    // Validar longitudes según API
    if (stylePrompt.length < 10 || stylePrompt.length > 300) {
      throw new Error('El prompt de estilo debe tener entre 10 y 300 caracteres');
    }
    if (lyricsPrompt.length < 10 || lyricsPrompt.length > 3000) {
      throw new Error('Las letras deben tener entre 10 y 3000 caracteres');
    }

    // Construir request body según API de minimax-music/v2
    const requestBody: any = {
      prompt: stylePrompt,
      lyrics_prompt: lyricsPrompt,
    };

    // Configuración de audio - SIEMPRE usar máxima calidad
    requestBody.audio_setting = {
      sample_rate: options.sampleRate || 44100,
      bitrate: options.bitrate || 256000, // Máximo bitrate disponible
      format: options.format || 'mp3'
    };

    const response = await axios.post(
      `${FAL_BASE_URL}/${FAL_MODELS.MUSIC_GENERATION}`,
      requestBody,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 600000 // 10 minutos para generación de música completa
      }
    );

    // MiniMax Music V2 devuelve audio.url
    const audioUrl = response.data?.audio?.url || response.data?.audio_url;
    if (audioUrl) {
      logger.log(`[FAL] Música generada exitosamente: ${audioUrl}`);

      // Descargar audio y subir a Firebase Storage
      try {
        const audioResponse = await axios.get(audioUrl, {
          responseType: 'arraybuffer',
          timeout: 120000 // 2 minutos para descargar
        });
        const audioBase64 = Buffer.from(audioResponse.data).toString('base64');
        const mimeType = audioResponse.headers['content-type'] || 'audio/mpeg';

        // Subir a Firebase Storage
        const permanentUrl = await uploadBase64ToStorage(
          audioBase64,
          mimeType,
          'artist-music'
        );

        return {
          success: true,
          audioUrl: permanentUrl,
          audioBase64: audioBase64,
          lyrics: lyricsPrompt,
          provider: 'fal-minimax-music-v2'
        };
      } catch (uploadError: any) {
        logger.warn('[FAL] Error subiendo audio a Storage, usando URL temporal:', uploadError.message);
        return {
          success: true,
          audioUrl: audioUrl,
          lyrics: lyricsPrompt,
          provider: 'fal-minimax-music-v2'
        };
      }
    }

    throw new Error('No se recibió audio en la respuesta: ' + JSON.stringify(response.data));
  } catch (error: any) {
    logger.error('[FAL] Error generando música:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message
    };
  }
}

/**
 * Genera imágenes para un artista: perfil y portada
 * Los prompts son coherentes con el género y estilo del artista
 */
export async function generateArtistImagesWithFAL(
  artistDescription: string,
  artistName: string,
  genre: string
): Promise<{ profileUrl: string; coverUrl: string }> {
  logger.log(`[FAL] Generando imágenes para artista: ${artistName} (${genre})`);

  // Mapear género a estética visual coherente
  const genreStyles: Record<string, { visual: string; lighting: string; mood: string }> = {
    'pop': { visual: 'colorful, vibrant, modern', lighting: 'bright studio lighting', mood: 'energetic, youthful' },
    'hip-hop': { visual: 'urban, street style, bold', lighting: 'dramatic shadows', mood: 'confident, powerful' },
    'rap': { visual: 'urban, street style, chains, bold fashion', lighting: 'dramatic neon lighting', mood: 'intense, confident' },
    'electronic': { visual: 'futuristic, neon, cyberpunk', lighting: 'LED lights, neon glow', mood: 'energetic, futuristic' },
    'rock': { visual: 'edgy, leather, dark aesthetic', lighting: 'dramatic concert lighting', mood: 'rebellious, raw' },
    'indie': { visual: 'vintage, artistic, bohemian', lighting: 'natural golden hour', mood: 'dreamy, authentic' },
    'r&b': { visual: 'elegant, sensual, sophisticated', lighting: 'warm moody lighting', mood: 'smooth, soulful' },
    'jazz': { visual: 'classic, sophisticated, timeless', lighting: 'warm ambient lighting', mood: 'elegant, smooth' },
    'country': { visual: 'rustic, authentic, americana', lighting: 'golden sunset lighting', mood: 'warm, genuine' },
    'latin': { visual: 'vibrant, tropical, passionate', lighting: 'warm colorful lighting', mood: 'passionate, lively' },
    'reggaeton': { visual: 'urban latin, flashy, bold', lighting: 'club neon lighting', mood: 'party, energetic' },
  };

  const style = genreStyles[genre.toLowerCase()] || genreStyles['pop'];

  // Generar imagen de perfil coherente con el género
  const profilePrompt = `Professional headshot portrait of a ${genre} music artist. ${artistDescription}. ${style.visual} aesthetic. ${style.lighting}. ${style.mood} expression. Close-up face view, photorealistic, 8K quality, professional photography, sharp focus.`;

  const profileResult = await generateImageWithNanoBanana(profilePrompt, {
    aspectRatio: '1:1'
  });

  if (!profileResult.success) {
    throw new Error(`Error generando perfil: ${profileResult.error}`);
  }

  // Pequeño delay para evitar rate limiting
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Generar imagen de portada coherente con el género
  const coverPrompt = `Cinematic ${genre} music artist photoshoot. ${artistDescription}. ${style.visual} aesthetic. ${style.lighting}. ${style.mood} atmosphere. Full body or medium shot, dynamic pose, professional music artist photography, 8K quality, album cover style.`;

  const coverResult = await generateImageWithNanoBanana(coverPrompt, {
    aspectRatio: '16:9'
  });

  if (!coverResult.success) {
    throw new Error(`Error generando portada: ${coverResult.error}`);
  }

  return {
    profileUrl: profileResult.imageUrl!,
    coverUrl: coverResult.imageUrl!
  };
}

/**
 * ============================================================
 * GENERACIÓN DE CANCIÓN PARA ARTISTA - MINIMAX MUSIC V2
 * ============================================================
 * Genera una canción completa con voces y letras para un artista tokenizado
 * Modelo: fal-ai/minimax-music/v2 - $0.03 por generación
 * Calidad: Bitrate 256kbps (máximo) - Letras profesionales
 * 
 * @param artistName - Nombre del artista
 * @param songTitle - Título de la canción
 * @param genre - Género musical (pop, hip-hop, rap, electronic, rock, etc.)
 * @param mood - Estado de ánimo (energetic, melancholic, upbeat, etc.)
 * @param artistGender - Género del artista: 'male' | 'female' (para tipo de voz)
 * @param customLyrics - Letras personalizadas (opcional, si no se proporciona se generan con AI)
 * @param artistBio - Biografía del artista (opcional, solo para estilo vocal)
 */
export async function generateArtistSongWithFAL(
  artistName: string,
  songTitle: string,
  genre: string,
  mood?: string,
  artistGender: 'male' | 'female' = 'male',
  customLyrics?: string,
  artistBio?: string
): Promise<FalMusicResult> {
  logger.log(`[FAL] 🎵 HIT MACHINE: Generando hit mundial "${songTitle}" para ${artistName} (${genre}) - Voz: ${artistGender}`);

  // Importar el generador de letras con IA
  const { generateHitLyrics, getProductionPrompt } = await import('./ai-lyrics-generator');

  const songMood = mood || 'energetic';
  
  // Mapear tipo de voz según género del artista (para el prompt de producción)
  const vocalStyles: Record<string, { male: string; female: string }> = {
    'pop': { 
      male: 'clear powerful male tenor vocals, smooth falsetto, emotional delivery',
      female: 'bright powerful female vocals, crystal clear high notes, expressive delivery'
    },
    'hip-hop': { 
      male: 'confident male rapper, melodic trap vocals, smooth delivery with ad-libs',
      female: 'fierce female rapper, powerful flow, commanding presence'
    },
    'rap': { 
      male: 'aggressive male rapper, rapid-fire flow, powerful delivery, lyrical precision',
      female: 'fierce female MC, switching flows, confident and bold delivery'
    },
    'electronic': { 
      male: 'ethereal male vocals, processed harmonies, emotional electronic',
      female: 'angelic female vocals, soaring high notes, euphoric delivery'
    },
    'rock': { 
      male: 'powerful male rock vocals, raw emotional delivery, soaring melodies',
      female: 'fierce female rock vocals, powerful range, passionate delivery'
    },
    'indie': { 
      male: 'soft introspective male vocals, falsetto, vulnerable delivery, emotional nuance',
      female: 'ethereal female vocals, delicate delivery, haunting beauty'
    },
    'r&b': { 
      male: 'smooth soulful male vocals, falsetto runs, romantic and sensual delivery',
      female: 'sultry female R&B vocals, melismatic runs, passionate and commanding'
    },
    'jazz': { 
      male: 'smooth male jazz vocals, sophisticated phrasing, elegant delivery',
      female: 'sultry female jazz vocals, intimate phrasing, smoky elegance'
    },
    'country': { 
      male: 'authentic male country vocals, storytelling delivery, heartfelt emotion',
      female: 'powerful female country vocals, emotional range, genuine delivery'
    },
    'latin': { 
      male: 'passionate male Latin vocals, rhythmic flow, charismatic delivery',
      female: 'fiery female Latin vocals, passionate delivery, rhythmic precision'
    },
    'reggaeton': { 
      male: 'energetic male reggaeton vocals, catchy hooks, party energy with swagger',
      female: 'fierce female reggaeton vocals, powerful hooks, commanding presence'
    },
  };

  const vocalStyle = vocalStyles[genre.toLowerCase()]?.[artistGender] || vocalStyles['pop'][artistGender];
  
  let lyricsPrompt: string;
  let stylePrompt: string;
  
  if (customLyrics) {
    // Usar letras personalizadas, asegurando que tengan tags
    lyricsPrompt = customLyrics.includes('[verse]') || customLyrics.includes('[chorus]') 
      ? customLyrics 
      : `[verse]\n${customLyrics}`;
    stylePrompt = `${getProductionPrompt(genre, songMood)}, ${vocalStyle}`.substring(0, 300);
  } else {
    // 🎵 GENERAR LETRAS CON IA - HIT MACHINE
    logger.log(`[FAL] 🤖 Generando letras con AI Hit Machine...`);
    
    try {
      const hitResult = await generateHitLyrics({
        artistName,
        songTitle,
        genre,
        mood: songMood,
        artistGender,
        artistBio // Solo para estilo vocal, NO para contenido
      });
      
      lyricsPrompt = hitResult.lyrics;
      stylePrompt = `${hitResult.productionPrompt}, ${vocalStyle}`.substring(0, 300);
      
      logger.log(`[FAL] ✅ Hit generado - Tema: "${hitResult.theme}"`);
      logger.log(`[FAL] 🎤 Hook: "${hitResult.hookLine.substring(0, 50)}..."`);
    } catch (aiError) {
      logger.warn(`[FAL] ⚠️ AI lyrics failed, using fallback:`, aiError);
      // 🔧 FIX: Si hay customLyrics disponibles (de transcripción previa), usarlas en el fallback
      // Esto asegura que aunque la AI falle, seguimos usando la letra real de la canción
      lyricsPrompt = generateLyricsForGenreFallback(artistName, songTitle, genre, songMood, artistGender, customLyrics);
      stylePrompt = `${getProductionPrompt(genre, songMood)}, ${vocalStyle}`.substring(0, 300);
    }
  }

  // Asegurar que las letras cumplen el mínimo de 10 caracteres
  if (lyricsPrompt.length < 10) {
    lyricsPrompt = `[verse]\nThis is the story of ${artistName}\n[chorus]\n${songTitle}, yeah ${songTitle}`;
  }

  // Truncar letras a 3000 caracteres (límite de MiniMax)
  if (lyricsPrompt.length > 3000) {
    lyricsPrompt = lyricsPrompt.substring(0, 2990) + '\n[outro]';
  }

  logger.log(`[FAL] 🎹 Estilo de producción: ${stylePrompt.substring(0, 100)}...`);
  logger.log(`[FAL] 📝 Letras (${lyricsPrompt.length} chars): ${lyricsPrompt.substring(0, 150)}...`);

  return generateMusicWithMiniMax(stylePrompt, lyricsPrompt);
}

/**
 * Fallback lyrics generator (cuando falla OpenAI)
 * 🔧 FIX: Ahora acepta customLyrics para usar la letra real si existe
 */
function generateLyricsForGenreFallback(
  artistName: string,
  songTitle: string,
  genre: string,
  mood: string,
  artistGender: 'male' | 'female',
  customLyrics?: string // 🔧 Nuevo parámetro opcional
): string {
  // 🔧 Si hay letras personalizadas, formatearlas y usarlas
  if (customLyrics && customLyrics.trim().length > 20) {
    logger.log(`[FAL] 📝 Usando letras personalizadas en fallback (${customLyrics.length} chars)`);
    
    // Asegurar formato básico si no tiene tags
    if (!customLyrics.includes('[verse]') && !customLyrics.includes('[chorus]')) {
      // Dividir la letra en secciones estimadas
      const lines = customLyrics.split('\n').filter(l => l.trim());
      const linesPerSection = Math.ceil(lines.length / 4);
      
      let formatted = `[intro]\n${artistName}\n\n`;
      formatted += `[verse]\n${lines.slice(0, linesPerSection).join('\n')}\n\n`;
      formatted += `[chorus]\n${lines.slice(linesPerSection, linesPerSection * 2).join('\n')}\n\n`;
      formatted += `[verse]\n${lines.slice(linesPerSection * 2, linesPerSection * 3).join('\n')}\n\n`;
      formatted += `[outro]\n${lines.slice(linesPerSection * 3).join('\n') || songTitle}`;
      
      return formatted;
    }
    
    return customLyrics;
  }

  // Fallback genérico si no hay letras personalizadas
  const hooks: Record<string, string[]> = {
    'pop': ['tonight', 'forever', 'one more time', 'never let go'],
    'hip-hop': ['on top', 'made it', 'real ones', 'we up'],
    'rap': ['legend', 'untouchable', 'king', 'history'],
    'electronic': ['feel it', 'higher', 'together', 'let go'],
    'rock': ['we are', 'stand up', 'never back down', 'alive'],
    'r&b': ['all night', 'close to me', 'feel you', 'only you'],
    'reggaeton': ['dale', 'baila', 'toda la noche', 'fuego'],
    'latin': ['corazón', 'bailamos', 'mi amor', 'contigo'],
    'indie': ['remember when', 'quietly', 'fade away', 'stay'],
    'country': ['this town', 'back home', 'friday nights', 'true love'],
    'jazz': ['in your arms', 'dance with me', 'moonlight', 'forever yours']
  };
  
  const hook = hooks[genre.toLowerCase()]?.[Math.floor(Math.random() * 4)] || 'tonight';
  
  return `[intro]
${artistName}

[verse]
In the ${mood} night we come alive
Every moment feels like the first time
Chasing dreams through the city lights
With you everything just feels right

[pre-chorus]
Can you feel it rising up inside
There's no way to hide what we feel tonight

[chorus]
${songTitle}, ${hook}
We're taking over, can't be stopped now
${songTitle}, this is our time
${hook}, we're gonna shine

[verse]
Every heartbeat leads us to this place
Look into my eyes, feel the embrace
Nothing compares to what we share
A connection beyond compare

[chorus]
${songTitle}, ${hook}
We're taking over, can't be stopped now
${songTitle}, this is our time
${hook}, we're gonna shine

[bridge]
When the world tries to bring us down
We'll rise up and wear the crown
Nothing's gonna stop us now
This is ${songTitle}

[outro]
${songTitle}... ${hook}
Yeah, ${artistName}`;
}

// ============================================================
// NOTA: La generación de letras ahora se hace con AI en:
// server/services/ai-lyrics-generator.ts (generateHitLyrics)
// La función generateLyricsForGenreFallback arriba es el fallback
// ============================================================

/**
 * ============================================================
 * GENERACIÓN DE MERCHANDISE - NANO BANANA / NANO BANANA EDIT
 * ============================================================
 * Si hay imagen del artista: usa nano-banana/edit (Image-to-Image)
 * Si no hay imagen: usa nano-banana (Text-to-Image)
 * 
 * @param artistName - Nombre del artista
 * @param productType - Tipo de producto (T-Shirt, Hoodie, Cap, etc.)
 * @param artistImageUrl - URL de imagen del artista (opcional)
 * @param genre - Género musical para estilo visual
 */
export async function generateMerchandiseImage(
  artistName: string,
  productType: string,
  artistImageUrl: string,
  genre: string
): Promise<FalImageResult> {
  try {
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }

    logger.log(`[FAL] 🛍️ Generando merchandise ${productType} para ${artistName}...`);

    // Mapear género a estilo visual para coherencia
    const genreStyles: Record<string, string> = {
      'pop': 'colorful, vibrant, modern pop aesthetic',
      'hip-hop': 'urban streetwear, bold, hip-hop culture',
      'rap': 'urban, street style, trap aesthetic',
      'electronic': 'futuristic, neon, cyberpunk vibes',
      'rock': 'edgy, dark, rock and roll aesthetic',
      'indie': 'vintage, artistic, bohemian style',
      'r&b': 'smooth, elegant, R&B culture',
      'jazz': 'classic, sophisticated, timeless style',
      'latin': 'vibrant, tropical, passionate colors',
      'reggaeton': 'urban latin, flashy, party vibes',
    };

    const style = genreStyles[genre.toLowerCase()] || 'modern music artist aesthetic';

    // Prompts específicos para cada producto con coherencia de marca
    const productPrompts: Record<string, string> = {
      'T-Shirt': `Professional e-commerce photo of a premium black t-shirt with artist logo printed design. ${style}. Orange and black color scheme. Front view on pure white background. Studio lighting, 4K quality, commercial product photography.`,
      
      'Hoodie': `Professional product photo of an oversized black hoodie featuring artist branding. ${style}. Orange accent details on sleeves. Front view, hood up, on white background. Commercial fashion photography, 4K quality.`,
      
      'Cap': `Professional product photo of a black snapback cap with embroidered logo. ${style}. Orange bill accent. 3/4 angle view on white background. Sharp details, commercial photography.`,
      
      'Poster': `Music poster design for artist collaboration. ${style}. Bold typography, orange and black color palette. Modern graphic design, concert poster aesthetic, 4K quality.`,
      
      'Sticker Pack': `Flat lay of vinyl sticker pack featuring artist designs. ${style}. Mix of logo stickers in orange, black, white colors. Overhead shot on white background, commercial photography.`,
      
      'Vinyl': `Limited edition vinyl record with orange and black swirl disc. ${style}. Custom album artwork visible on sleeve. Record partially out, dramatic lighting on white background.`
    };

    const prompt = productPrompts[productType] || 
      `Professional product photo of ${artistName} ${productType} merchandise. ${style}. Orange and black branding. White background, 4K quality.`;

    // ESTRATEGIA: Si hay imagen del artista, usar nano-banana/edit (Image-to-Image)
    // Si no hay imagen, usar nano-banana (Text-to-Image)
    if (artistImageUrl && !artistImageUrl.includes('placeholder')) {
      logger.log(`[FAL] ✏️ Usando nano-banana/edit con imagen del artista`);
      logger.log(`[FAL] Artist image URL: ${artistImageUrl}`);
      
      // Usar editImageWithNanoBanana que maneja todo correctamente
      return editImageWithNanoBanana(
        [artistImageUrl],
        prompt,
        { aspectRatio: '1:1' }
      );
    }

    // Sin imagen del artista: usar nano-banana (generación)
    logger.log(`[FAL] 🎨 Usando nano-banana (generación) para ${productType}`);
    
    const result = await generateImageWithNanoBanana(prompt, { 
      aspectRatio: '1:1'
    });

    // Cambiar carpeta de destino a merchandise
    if (result.success && result.imageBase64) {
      const permanentUrl = await uploadBase64ToStorage(
        result.imageBase64,
        'image/png',
        'merchandise-images'
      );
      return {
        ...result,
        imageUrl: permanentUrl
      };
    }

    return result;
  } catch (error: any) {
    logger.log(`[FAL] ❌ Error generando merchandise: ${error.message}`);
    return {
      success: false,
      imageUrl: '',
      error: error.message
    };
  }
}

/**
 * ============================================================
 * GENERACIÓN COMPLETA DE MERCHANDISE - 6 PRODUCTOS
 * ============================================================
 * Genera los 6 productos de merchandise para un artista:
 * T-Shirt, Hoodie, Cap, Poster, Sticker Pack, Vinyl
 */
export async function generateArtistMerchandise(
  artistName: string,
  artistImageUrl: string,
  genre: string
): Promise<Array<{ type: string; name: string; price: number; imageUrl: string }>> {
  logger.log(`[FAL] 🛍️ Generando 6 productos de merchandise para ${artistName}...`);

  const products = [
    { type: 'T-Shirt', name: `${artistName} x Boostify T-Shirt`, price: 29.99 },
    { type: 'Hoodie', name: `${artistName} x Boostify Hoodie`, price: 59.99 },
    { type: 'Cap', name: `${artistName} x Boostify Cap`, price: 24.99 },
    { type: 'Poster', name: `${artistName} x Boostify Poster`, price: 19.99 },
    { type: 'Sticker Pack', name: `${artistName} x Boostify Stickers`, price: 9.99 },
    { type: 'Vinyl', name: `${artistName} x Boostify Vinyl`, price: 34.99 },
  ];

  const generatedProducts: Array<{ type: string; name: string; price: number; imageUrl: string }> = [];

  for (const product of products) {
    try {
      logger.log(`[FAL] Generando ${product.type}...`);
      
      const result = await generateMerchandiseImage(
        artistName,
        product.type,
        artistImageUrl,
        genre
      );

      if (result.success && result.imageUrl) {
        generatedProducts.push({
          type: product.type,
          name: product.name,
          price: product.price,
          imageUrl: result.imageUrl
        });
        logger.log(`[FAL] ✅ ${product.type} generado`);
      } else {
        // Usar placeholder si falla
        generatedProducts.push({
          type: product.type,
          name: product.name,
          price: product.price,
          imageUrl: `https://storage.googleapis.com/boostify-music/placeholders/${product.type.toLowerCase().replace(' ', '-')}.png`
        });
        logger.warn(`[FAL] ⚠️ ${product.type} usó placeholder`);
      }

      // Pausa para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      logger.error(`[FAL] Error generando ${product.type}:`, error);
      generatedProducts.push({
        type: product.type,
        name: product.name,
        price: product.price,
        imageUrl: `https://storage.googleapis.com/boostify-music/placeholders/${product.type.toLowerCase().replace(' ', '-')}.png`
      });
    }
  }

  logger.log(`[FAL] ✅ Merchandise completado: ${generatedProducts.length} productos`);
  return generatedProducts;
}

// URL para queue de FAL (operaciones que toman tiempo)
const FAL_QUEUE_URL = 'https://queue.fal.run';

/**
 * ============================================================
 * GENERACIÓN DE VIDEO - GROK IMAGINE VIDEO (xAI) - PRINCIPAL
 * ============================================================
 * Modelo: xai/grok-imagine-video/image-to-video
 * Genera videos de alta calidad desde imágenes con audio nativo
 * Precio: $0.05/segundo ($0.30 para video de 6s)
 * 
 * WORKFLOW RECOMENDADO PARA MUSIC VIDEOS:
 * 1. Generar imagen con nano-banana
 * 2. Convertir a video con Grok Imagine
 * 3. Editar/estilizar con Grok Edit Video
 * 
 * @param imageUrl - URL de la imagen a convertir en video
 * @param prompt - Descripción del movimiento/estilo deseado
 * @param options - Opciones: duration (6s), resolution (480p/720p), aspect_ratio
 */
export async function generateVideoWithGrok(
  imageUrl: string,
  prompt: string,
  options: {
    duration?: number; // segundos (default 6)
    resolution?: '480p' | '720p';
    aspectRatio?: 'auto' | '16:9' | '4:3' | '3:2' | '1:1' | '2:3' | '3:4' | '9:16';
  } = {}
): Promise<FalVideoResult> {
  try {
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }

    logger.log(`[FAL] 🎬 Generando video con Grok Imagine Video (xAI)...`);
    logger.log(`[FAL] Image URL: ${imageUrl.substring(0, 80)}...`);
    logger.log(`[FAL] Motion Prompt: ${prompt.substring(0, 100)}...`);

    // Parámetros para xai/grok-imagine-video/image-to-video
    const requestBody = {
      prompt: prompt,
      image_url: imageUrl,
      duration: options.duration || 6, // Default 6 segundos
      resolution: options.resolution || '720p', // Alta calidad por defecto
      aspect_ratio: options.aspectRatio || 'auto'
    };

    logger.log(`[FAL] Request a Grok Imagine:`, JSON.stringify(requestBody));

    // Usar queue para operaciones largas
    const response = await axios.post(
      `${FAL_QUEUE_URL}/${FAL_MODELS.GROK_IMAGE_TO_VIDEO}`,
      requestBody,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000 // 30s para el submit
      }
    );

    // FAL devuelve request_id, status_url y response_url
    const requestId = response.data.request_id;
    const statusUrl = response.data.status_url;
    const responseUrl = response.data.response_url;
    
    logger.log(`[FAL] Grok Request ID: ${requestId}`);

    // Polling para obtener el resultado
    let result = null;
    let attempts = 0;
    const maxAttempts = 120; // 4 minutos max

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000)); // 2 segundos

      const statusResponse = await axios.get(statusUrl, {
        headers: { 'Authorization': `Key ${FAL_API_KEY}` }
      });

      logger.log(`[FAL] Grok Status: ${statusResponse.data.status} (attempt ${attempts + 1})`);

      if (statusResponse.data.status === 'COMPLETED') {
        const resultResponse = await axios.get(responseUrl, {
          headers: { 'Authorization': `Key ${FAL_API_KEY}` }
        });
        result = resultResponse.data;
        break;
      } else if (statusResponse.data.status === 'FAILED') {
        throw new Error(statusResponse.data.error || 'Grok video generation failed');
      }

      attempts++;
    }

    if (!result) {
      throw new Error('Grok video generation timeout');
    }

    // Extraer datos del video
    const videoData = result.video;
    if (!videoData?.url) {
      throw new Error('No se recibió URL de video de Grok');
    }

    logger.log(`[FAL] ✅ Video Grok generado: ${videoData.url.substring(0, 80)}...`);

    // Subir a Firebase Storage para URL permanente
    try {
      const videoResponse = await axios.get(videoData.url, {
        responseType: 'arraybuffer',
        timeout: 120000
      });

      if (storage) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const fileName = `grok-videos/${timestamp}_${randomId}.mp4`;

        const bucket = storage.bucket();
        const file = bucket.file(fileName);

        await file.save(Buffer.from(videoResponse.data), {
          metadata: { contentType: 'video/mp4' },
          public: true,
          validation: false,
        });

        await file.makePublic();
        const permanentUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        logger.log(`[FAL] ✅ Video Grok subido a Storage: ${permanentUrl}`);

        return {
          success: true,
          videoUrl: permanentUrl,
          duration: videoData.duration || options.duration || 6,
          width: videoData.width,
          height: videoData.height,
          fps: videoData.fps,
          numFrames: videoData.num_frames,
          provider: 'fal-grok-image-to-video'
        };
      }
    } catch (uploadError: any) {
      logger.warn(`[FAL] ⚠️ Error subiendo video Grok a Storage: ${uploadError.message}`);
    }

    return {
      success: true,
      videoUrl: videoData.url,
      duration: videoData.duration || options.duration || 6,
      width: videoData.width,
      height: videoData.height,
      fps: videoData.fps,
      numFrames: videoData.num_frames,
      provider: 'fal-grok-image-to-video'
    };

  } catch (error: any) {
    logger.error('[FAL] Error generando video con Grok:', error.message);
    
    // Fallback 1: Intentar con Wan 2.6
    logger.warn('[FAL] 🔄 Intentando fallback con Wan 2.6...');
    try {
      const wanResult = await generateVideoFromImageWithWan(imageUrl, prompt, {
        resolution: options.resolution,
        aspectRatio: options.aspectRatio === 'auto' ? '16:9' : options.aspectRatio as any,
        duration: options.duration
      });
      
      if (wanResult.success) {
        return wanResult;
      }
    } catch (wanError: any) {
      logger.error('[FAL] ❌ Fallback Wan también falló:', wanError.message);
    }
    
    // Fallback 2: Intentar con Gemini Veo 3
    logger.warn('[FAL] 🔄 Intentando fallback con Gemini Veo 3...');
    try {
      const geminiService = await import('./gemini-image-service');
      const veoResult = await geminiService.generateVideoWithGeminiVeo(imageUrl, prompt, {
        duration: options.duration || 5,
        aspectRatio: options.aspectRatio === 'auto' ? '16:9' : options.aspectRatio as any
      });
      
      if (veoResult.success && veoResult.videoUrl) {
        logger.log('[FAL] ✅ Fallback Gemini Veo 3 exitoso');
        return {
          success: true,
          videoUrl: veoResult.videoUrl,
          duration: options.duration || 5,
          provider: 'gemini-veo-3-fallback'
        };
      }
    } catch (veoError: any) {
      logger.error('[FAL] ❌ Fallback Gemini Veo 3 también falló:', veoError.message);
    }
    
    // Si todos fallan, retornar error
    return {
      success: false,
      error: error.message,
      provider: 'fal-grok-image-to-video'
    };
  }
}

/**
 * ============================================================
 * EDICIÓN DE VIDEO - GROK IMAGINE VIDEO EDIT (xAI)
 * ============================================================
 * Modelo: xai/grok-imagine-video/edit-video
 * Edita videos existentes con instrucciones de texto
 * Casos de uso: colorizar, estilizar, transformar
 * Precio: $0.06/segundo (input + output)
 * 
 * @param videoUrl - URL del video a editar (max 8 segundos, 854x480)
 * @param editPrompt - Instrucciones de edición (ej: "Colorize the video", "Add cyberpunk style")
 * @param options - Opciones de resolución
 */
export async function editVideoWithGrok(
  videoUrl: string,
  editPrompt: string,
  options: {
    resolution?: 'auto' | '480p' | '720p';
  } = {}
): Promise<FalVideoResult> {
  try {
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }

    logger.log(`[FAL] ✏️ Editando video con Grok Edit Video (xAI)...`);
    logger.log(`[FAL] Video URL: ${videoUrl.substring(0, 80)}...`);
    logger.log(`[FAL] Edit Prompt: ${editPrompt}`);

    // Parámetros para xai/grok-imagine-video/edit-video
    const requestBody = {
      prompt: editPrompt,
      video_url: videoUrl,
      resolution: options.resolution || 'auto'
    };

    logger.log(`[FAL] Request a Grok Edit:`, JSON.stringify(requestBody));

    // Usar queue para operaciones largas
    const response = await axios.post(
      `${FAL_QUEUE_URL}/${FAL_MODELS.GROK_EDIT_VIDEO}`,
      requestBody,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 30000
      }
    );

    const requestId = response.data.request_id;
    const statusUrl = response.data.status_url;
    const responseUrl = response.data.response_url;

    logger.log(`[FAL] Grok Edit Request ID: ${requestId}`);

    // Polling para obtener el resultado
    let result = null;
    let attempts = 0;
    const maxAttempts = 120;

    while (attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const statusResponse = await axios.get(statusUrl, {
        headers: { 'Authorization': `Key ${FAL_API_KEY}` }
      });

      logger.log(`[FAL] Grok Edit Status: ${statusResponse.data.status} (attempt ${attempts + 1})`);

      if (statusResponse.data.status === 'COMPLETED') {
        const resultResponse = await axios.get(responseUrl, {
          headers: { 'Authorization': `Key ${FAL_API_KEY}` }
        });
        result = resultResponse.data;
        break;
      } else if (statusResponse.data.status === 'FAILED') {
        throw new Error(statusResponse.data.error || 'Grok video edit failed');
      }

      attempts++;
    }

    if (!result) {
      throw new Error('Grok video edit timeout');
    }

    const videoData = result.video;
    if (!videoData?.url) {
      throw new Error('No se recibió URL de video editado de Grok');
    }

    logger.log(`[FAL] ✅ Video editado con Grok: ${videoData.url.substring(0, 80)}...`);

    // Subir a Firebase Storage
    try {
      const videoResponse = await axios.get(videoData.url, {
        responseType: 'arraybuffer',
        timeout: 120000
      });

      if (storage) {
        const timestamp = Date.now();
        const randomId = Math.random().toString(36).substring(7);
        const fileName = `grok-edited-videos/${timestamp}_${randomId}.mp4`;

        const bucket = storage.bucket();
        const file = bucket.file(fileName);

        await file.save(Buffer.from(videoResponse.data), {
          metadata: { contentType: 'video/mp4' },
          public: true,
          validation: false,
        });

        await file.makePublic();
        const permanentUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

        return {
          success: true,
          videoUrl: permanentUrl,
          duration: videoData.duration,
          width: videoData.width,
          height: videoData.height,
          fps: videoData.fps,
          provider: 'fal-grok-edit-video'
        };
      }
    } catch (uploadError: any) {
      logger.warn(`[FAL] ⚠️ Error subiendo video editado a Storage: ${uploadError.message}`);
    }

    return {
      success: true,
      videoUrl: videoData.url,
      duration: videoData.duration,
      width: videoData.width,
      height: videoData.height,
      fps: videoData.fps,
      provider: 'fal-grok-edit-video'
    };

  } catch (error: any) {
    logger.error('[FAL] Error editando video con Grok:', error.message);
    return {
      success: false,
      error: error.message || 'Error editando video con Grok',
      provider: 'fal-grok-edit-video'
    };
  }
}

/**
 * ============================================================
 * WORKFLOW COMPLETO: Imagen → Video con Grok
 * ============================================================
 * Genera imagen con nano-banana y la convierte a video con Grok
 * 
 * @param imagePrompt - Prompt para generar la imagen
 * @param motionPrompt - Prompt para el movimiento del video
 * @param options - Opciones de aspecto ratio, duración, etc.
 */
export async function generateMusicVideoScene(
  imagePrompt: string,
  motionPrompt: string,
  options: {
    aspectRatio?: '16:9' | '9:16' | '1:1';
    duration?: number;
    resolution?: '480p' | '720p';
    editStyle?: string; // Opcional: estilo de post-producción
  } = {}
): Promise<{
  success: boolean;
  imageUrl?: string;
  videoUrl?: string;
  editedVideoUrl?: string;
  error?: string;
}> {
  try {
    logger.log('[FAL] 🎬 Generando escena completa de Music Video...');
    logger.log(`[FAL] Image Prompt: ${imagePrompt.substring(0, 100)}...`);
    logger.log(`[FAL] Motion Prompt: ${motionPrompt.substring(0, 100)}...`);

    // Paso 1: Generar imagen con nano-banana
    const nanoBananaAspect = options.aspectRatio === '9:16' ? '9:16' : 
                             options.aspectRatio === '1:1' ? '1:1' : '16:9';
    
    const imageResult = await generateImageWithNanoBanana(imagePrompt, {
      aspectRatio: nanoBananaAspect as NanoBananaAspectRatio
    });

    if (!imageResult.success || !imageResult.imageUrl) {
      throw new Error(`Error generando imagen: ${imageResult.error}`);
    }

    logger.log(`[FAL] ✅ Imagen generada: ${imageResult.imageUrl.substring(0, 60)}...`);

    // Paso 2: Convertir a video con Grok Imagine
    const videoResult = await generateVideoWithGrok(imageResult.imageUrl, motionPrompt, {
      duration: options.duration || 6,
      resolution: options.resolution || '720p',
      aspectRatio: options.aspectRatio || '16:9'
    });

    if (!videoResult.success || !videoResult.videoUrl) {
      throw new Error(`Error generando video: ${videoResult.error}`);
    }

    logger.log(`[FAL] ✅ Video generado: ${videoResult.videoUrl.substring(0, 60)}...`);

    // Paso 3 (Opcional): Editar/estilizar con Grok Edit
    let editedVideoUrl: string | undefined;
    if (options.editStyle) {
      const editResult = await editVideoWithGrok(videoResult.videoUrl, options.editStyle);
      if (editResult.success && editResult.videoUrl) {
        editedVideoUrl = editResult.videoUrl;
        logger.log(`[FAL] ✅ Video editado: ${editedVideoUrl.substring(0, 60)}...`);
      }
    }

    return {
      success: true,
      imageUrl: imageResult.imageUrl,
      videoUrl: videoResult.videoUrl,
      editedVideoUrl
    };

  } catch (error: any) {
    logger.error('[FAL] Error en workflow de Music Video Scene:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * ============================================================
 * GENERACIÓN DE VIDEO - FAL AI WAN 2.6 (Image-to-Video) - FALLBACK
 * ============================================================
 * Modelo: fal-ai/wan/v2.6/image-to-video
 * Convierte una imagen estática en un video animado
 * Usado como fallback cuando Grok falla
 * 
 * @param imageUrl - URL de la imagen a convertir en video
 * @param prompt - Descripción del movimiento/animación deseada
 * @param options - Opciones adicionales (resolution, duration, etc.)
 */
export async function generateVideoFromImageWithWan(
  imageUrl: string,
  prompt: string,
  options: {
    resolution?: '480p' | '720p';
    aspectRatio?: '16:9' | '9:16' | '1:1';
    duration?: number;
  } = {}
): Promise<FalVideoResult> {
  try {
    if (!FAL_API_KEY) {
      throw new Error('FAL_API_KEY no configurada');
    }

    logger.log(`[FAL] 🎬 Generando video con Wan 2.6 (Fallback)...`);
    logger.log(`[FAL] Image URL: ${imageUrl.substring(0, 80)}...`);

    const requestBody = {
      image_url: imageUrl,
      prompt: prompt,
      negative_prompt: "blurry, distorted, low quality, deformed face, ugly",
      num_frames: options.duration ? options.duration * 8 : 40,
      resolution: options.resolution || '480p',
      aspect_ratio: options.aspectRatio || '1:1',
      seed: Math.floor(Math.random() * 1000000)
    };

    const response = await axios.post(
      `${FAL_BASE_URL}/${FAL_MODELS.IMAGE_TO_VIDEO_FALLBACK}`,
      requestBody,
      {
        headers: {
          'Authorization': `Key ${FAL_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 300000
      }
    );

    let videoUrl = response.data?.video?.url ||
                   response.data?.video_url ||
                   response.data?.output?.video_url;

    if (videoUrl) {
      logger.log(`[FAL] ✅ Video Wan generado: ${videoUrl.substring(0, 80)}...`);

      // Subir a Firebase Storage
      try {
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          timeout: 60000
        });

        if (storage) {
          const timestamp = Date.now();
          const randomId = Math.random().toString(36).substring(7);
          const fileName = `wan-videos/${timestamp}_${randomId}.mp4`;

          const bucket = storage.bucket();
          const file = bucket.file(fileName);

          await file.save(Buffer.from(videoResponse.data), {
            metadata: { contentType: 'video/mp4' },
            public: true,
            validation: false,
          });

          await file.makePublic();
          const permanentUrl = `https://storage.googleapis.com/${bucket.name}/${fileName}`;

          return {
            success: true,
            videoUrl: permanentUrl,
            duration: options.duration || 5,
            provider: 'fal-wan-image-to-video'
          };
        }
      } catch (uploadError: any) {
        logger.warn(`[FAL] ⚠️ Error subiendo video Wan a Storage: ${uploadError.message}`);
      }

      return {
        success: true,
        videoUrl: videoUrl,
        duration: options.duration || 5,
        provider: 'fal-wan-image-to-video'
      };
    }

    throw new Error('No se recibió URL de video en la respuesta de Wan');

  } catch (error: any) {
    logger.error('[FAL] Error generando video con Wan:', error.message);
    return {
      success: false,
      error: error.message,
      provider: 'fal-wan-image-to-video'
    };
  }
}

/**
 * ============================================================
 * GENERACIÓN DE VIDEO - WRAPPER PRINCIPAL
 * ============================================================
 * Usa Grok como primario y Wan como fallback
 * 
 * @param imageUrl - URL de la imagen a convertir en video
 * @param prompt - Descripción del movimiento/animación deseada
 * @param options - Opciones adicionales (resolution, duration, etc.)
 */
export async function generateVideoFromImage(
  imageUrl: string,
  prompt: string,
  options: {
    resolution?: '480p' | '720p';
    aspectRatio?: '16:9' | '9:16' | '1:1';
    duration?: number; // segundos (default 6 para Grok, 5 para Wan)
    useGrok?: boolean; // true por defecto - usa Grok como primario
  } = {}
): Promise<FalVideoResult> {
  // Por defecto usar Grok Imagine Video como primario
  const useGrokPrimary = options.useGrok !== false;
  
  if (useGrokPrimary) {
    logger.log(`[FAL] 🎬 Usando Grok Imagine Video como primario...`);
    return generateVideoWithGrok(imageUrl, prompt, {
      duration: options.duration || 6,
      resolution: options.resolution || '720p',
      aspectRatio: options.aspectRatio || '16:9'
    });
  } else {
    // Fallback directo a Wan
    logger.log(`[FAL] 🎬 Usando Wan 2.6 directamente...`);
    return generateVideoFromImageWithWan(imageUrl, prompt, options);
  }
}

/**
 * Genera prompts de performing específicos por género musical
 * Cada género tiene su estilo artístico y movimientos característicos
 */
function getGenrePerformingPrompt(artistName: string, genre: string): string {
  const genreLower = genre.toLowerCase();
  
  // Prompts de performing artístico específicos por género
  const genrePrompts: Record<string, string> = {
    // 🎸 Rock / Metal
    'rock': `${artistName} performing intensely, headbanging with passion, playing air guitar, dramatic rock star pose, stage lights flashing, powerful energy, rebellious attitude, leather jacket vibes, epic rock concert atmosphere`,
    'metal': `${artistName} performing aggressively, intense headbanging, devil horns gesture, screaming with power, dark dramatic lighting, metal concert energy, fierce expression, flames and smoke atmosphere`,
    'punk': `${artistName} performing with raw energy, jumping and moshing, rebellious punk attitude, DIY aesthetic, aggressive movements, spitting fire, underground club vibes`,
    'alternative': `${artistName} performing with artistic intensity, emotional expressions, dramatic gestures, moody lighting, alternative rock stage presence`,
    
    // 🎤 Hip-Hop / Rap / Trap
    'hip-hop': `${artistName} performing on stage, confident swagger, hand gestures to the crowd, gold chains swinging, dropping bars with attitude, hip-hop dance moves, DJ lights behind, urban concert vibes`,
    'rap': `${artistName} rapping with intensity, mic in hand, aggressive hand gestures, confident posture, trap lights, stage smoke, dropping verses with flow, street credibility`,
    'trap': `${artistName} performing trap music, lean movements, ice dripping, hood up, dark purple lights, smoke effects, bass heavy atmosphere, street king energy`,
    'drill': `${artistName} performing drill, masked up aesthetic, aggressive stance, street energy, dark lighting, menacing but artistic presence`,
    
    // 🎹 Electronic / EDM
    'electronic': `${artistName} DJ performing at festival, hands on mixer, neon lights pulsing, LED screens behind, crowd going wild, euphoric electronic music atmosphere, laser beams`,
    'edm': `${artistName} DJ dropping the beat, massive festival stage, confetti explosion, LED pyramid, hands up moment, peak time energy, electronic dance music euphoria`,
    'house': `${artistName} DJ in underground club, deep house vibes, intimate atmosphere, disco ball reflections, smooth groove movements, sophisticated electronic aesthetic`,
    'techno': `${artistName} performing techno, industrial warehouse setting, strobe lights, hypnotic movements, dark and minimal aesthetic, berlin club vibes`,
    
    // 🎷 Jazz / Blues / Soul
    'jazz': `${artistName} performing jazz, smooth movements, eyes closed feeling the music, saxophone or piano nearby, blue spotlight, smoky jazz club atmosphere, sophisticated elegance`,
    'blues': `${artistName} performing blues with soul, emotional expressions, guitar solo moment, dim warm lighting, intimate blues bar setting, raw emotional performance`,
    'soul': `${artistName} singing with deep emotion, gospel-style gestures, powerful vocal performance, warm golden lights, touching hearts, soul music passion`,
    'r&b': `${artistName} performing R&B sensually, smooth dance moves, romantic lighting, silky movements, seductive stage presence, modern R&B vibes`,
    
    // 🌴 Reggae / Latin
    'reggae': `${artistName} performing reggae, rastafari vibes, peaceful movements, red gold green lights, smoke effects, chill island atmosphere, one love energy`,
    'reggaeton': `${artistName} performing reggaeton, perreo dance moves, latin party energy, neon club lights, sensual movements, puerto rico vibes, dembow rhythm`,
    'latin': `${artistName} performing latin music, passionate dance moves, salsa energy, colorful stage, Latin pride, fiery performance, hispanic celebration`,
    
    // 🎻 Classical / Orchestra
    'classical': `${artistName} conducting orchestra, elegant movements, dramatic gestures, concert hall grandeur, tuxedo formal, symphonic excellence, maestro energy`,
    'opera': `${artistName} performing opera, dramatic theatrical pose, powerful vocal expression, grand stage, spotlight solo, classical magnificence`,
    
    // 🌊 Chill / Ambient
    'lofi': `${artistName} creating lofi beats, relaxed vibe, headphones on, nostalgic aesthetic, anime-style lighting, cozy room atmosphere, study session energy`,
    'ambient': `${artistName} in meditative state, ethereal movements, soft glowing lights, peaceful expression, floating sensation, transcendental atmosphere`,
    'chill': `${artistName} relaxed performance, laid-back vibes, sunset colors, beach atmosphere, acoustic session, warm peaceful energy`,
    
    // 🎵 Pop / Mainstream
    'pop': `${artistName} performing pop concert, energetic dance choreography, colorful stage production, backup dancers, confetti falling, mainstream star energy, arena tour vibes`,
    'k-pop': `${artistName} performing K-pop, precise choreography, synchronized dance, colorful neon aesthetics, perfect styling, idol energy, Korean pop star vibes`,
    'indie': `${artistName} performing indie music, authentic artistic expression, vintage microphone, intimate venue, fairy lights, hipster aesthetic, genuine connection`,
    
    // 🌍 World / Folk
    'folk': `${artistName} performing folk music, acoustic guitar, storytelling expression, campfire atmosphere, rustic setting, authentic roots vibes`,
    'country': `${artistName} performing country, cowboy aesthetic, acoustic guitar, stadium lights, American heartland vibes, storytelling passion`,
    'afrobeat': `${artistName} performing afrobeat, vibrant African dance moves, colorful traditional elements, drums and percussion energy, celebration of culture`,
  };

  // Buscar coincidencia exacta o parcial
  for (const [key, prompt] of Object.entries(genrePrompts)) {
    if (genreLower.includes(key) || key.includes(genreLower)) {
      return prompt;
    }
  }

  // Prompt por defecto para géneros no especificados
  return `${artistName} performing ${genre} music passionately on stage, dynamic artistic movements, professional lighting, concert atmosphere, genuine musical expression, captivating stage presence, artistic performance matching their ${genre} style`;
}

/**
 * Genera un video de loop para el perfil de un artista
 * Crea un performing artístico dinámico basado en el género musical
 * 
 * @param profileImageUrl - URL de la imagen de perfil del artista
 * @param artistName - Nombre del artista (para prompt)
 * @param genre - Género musical (para estilo del performing)
 */
export async function generateArtistProfileVideo(
  profileImageUrl: string,
  artistName: string,
  genre: string = 'pop'
): Promise<FalVideoResult> {
  try {
    logger.log(`[FAL] 🎬 Generando video de performing para ${artistName} (${genre})...`);

    // Obtener prompt de performing específico para el género
    const performingStyle = getGenrePerformingPrompt(artistName, genre);

    // Prompt completo con instrucciones técnicas de video
    const motionPrompt = `${performingStyle}. 
Cinematic quality video, smooth fluid motion, professional music video aesthetic.
Maintain exact facial features and appearance from the image.
Dynamic camera angles, concert-quality lighting effects.
Seamless loop, high production value, artistic music performance.`;

    logger.log(`[FAL] 🎭 Prompt de performing: ${performingStyle.substring(0, 100)}...`);

    const result = await generateVideoFromImage(
      profileImageUrl,
      motionPrompt,
      {
        resolution: '480p', // Óptimo para loop videos de perfil
        aspectRatio: '1:1', // Cuadrado para perfil
        duration: 5 // 5 segundos loop
      }
    );

    if (result.success) {
      logger.log(`[FAL] ✅ Video de performing generado para ${artistName}: ${result.videoUrl?.substring(0, 60)}...`);
    } else {
      logger.warn(`[FAL] ⚠️ No se pudo generar video de performing: ${result.error}`);
    }

    return result;

  } catch (error: any) {
    logger.error(`[FAL] ❌ Error generando video de performing:`, error.message);
    return {
      success: false,
      error: error.message || 'Error generando video de performing',
      provider: 'fal-wan-image-to-video'
    };
  }
}

// Exportar todas las funciones
export default {
  // Imágenes
  generateImageWithNanoBanana,
  editImageWithNanoBanana,
  generateImageWithFaceReference,
  
  // Videos - Grok Imagine (Principal)
  generateVideoWithGrok,
  editVideoWithGrok,
  generateMusicVideoScene,
  
  // Videos - Wan (Fallback)
  generateVideoFromImageWithWan,
  
  // Videos - Wrapper (usa Grok con fallback a Wan)
  generateVideoFromImage,
  generateArtistProfileVideo,
  
  // Música
  generateMusicWithMiniMax,
  generateArtistSongWithFAL,
  
  // Artistas
  generateArtistImagesWithFAL,
  generateMerchandiseImage,
  generateArtistMerchandise,
  
  // Constantes
  FAL_MODELS
};
