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
    
    // Fallback: generar imagen desde cero con nano-banana
    logger.warn('[FAL] Intentando fallback con nano-banana (generación)...');
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
 * @param customLyrics - Letras personalizadas (opcional, si no se proporciona se generan automáticamente)
 */
export async function generateArtistSongWithFAL(
  artistName: string,
  songTitle: string,
  genre: string,
  mood?: string,
  artistGender: 'male' | 'female' = 'male',
  customLyrics?: string
): Promise<FalMusicResult> {
  logger.log(`[FAL] 🎵 Generando canción: "${songTitle}" para ${artistName} (${genre}) - Voz: ${artistGender}`);

  // Mapear género musical a características de producción TOP QUALITY
  // Inspirado en los mejores productores: Max Martin, Pharrell, Dr. Dre, etc.
  const genreStyles: Record<string, { 
    style: string; 
    maleVocals: string; 
    femaleVocals: string; 
    themes: string[] 
  }> = {
    'pop': { 
      style: 'Billboard Hot 100 Pop, Max Martin style production, crisp modern synths, punchy drums, catchy melodic hooks, radio-ready mix, pristine vocals, commercial sound', 
      maleVocals: 'clear powerful male tenor vocals, The Weeknd style, smooth falsetto, emotional delivery',
      femaleVocals: 'bright powerful female vocals, Ariana Grande style, crystal clear high notes, expressive delivery',
      themes: ['eternal love', 'dancing all night', 'chasing dreams', 'summer romance', 'unstoppable spirit']
    },
    'hip-hop': { 
      style: 'Platinum Hip-Hop, Metro Boomin production, deep 808 sub-bass, crisp trap hi-hats, hard-hitting kicks, atmospheric pads, stadium ready', 
      maleVocals: 'confident male rapper, Drake flow, melodic trap vocals, smooth delivery with ad-libs',
      femaleVocals: 'fierce female rapper, Megan Thee Stallion energy, powerful flow, commanding presence',
      themes: ['rise to the top', 'luxury lifestyle', 'real recognize real', 'city anthem', 'self-made success']
    },
    'rap': { 
      style: 'Grammy-winning Rap, Dr. Dre quality production, punchy 808s, intricate hi-hat patterns, cinematic strings, west coast vibes, hard-hitting drums', 
      maleVocals: 'aggressive male rapper, Eminem intensity, rapid-fire flow, powerful delivery, lyrical precision',
      femaleVocals: 'fierce female MC, Nicki Minaj versatility, switching flows, confident and bold delivery',
      themes: ['street wisdom', 'overcoming obstacles', 'loyalty above all', 'legendary status', 'raw authenticity']
    },
    'electronic': { 
      style: 'Festival EDM, Swedish House Mafia production, massive synth drops, euphoric builds, pulsing basslines, stadium anthems, professional mastering', 
      maleVocals: 'ethereal male vocals, The Chainsmokers style, processed harmonies, emotional electronic',
      femaleVocals: 'angelic female vocals, Zedd collaborator style, soaring high notes, euphoric delivery',
      themes: ['endless nights', 'electric connection', 'losing ourselves', 'one more time', 'united as one']
    },
    'rock': { 
      style: 'Arena Rock, Rick Rubin production, crushing electric guitars, thunderous drums, powerful bass, anthemic energy, raw emotion, stadium sound', 
      maleVocals: 'powerful male rock vocals, Foo Fighters intensity, raw emotional delivery, soaring melodies',
      femaleVocals: 'fierce female rock vocals, Hayley Williams energy, powerful range, passionate delivery',
      themes: ['breaking chains', 'eternal fire', 'standing tall', 'wild hearts', 'unstoppable force']
    },
    'indie': { 
      style: 'Critically acclaimed Indie, Bon Iver textures, warm acoustic guitars, dreamy reverb, subtle electronic elements, intimate production, emotional depth', 
      maleVocals: 'soft introspective male vocals, Bon Iver falsetto, vulnerable delivery, emotional nuance',
      femaleVocals: 'ethereal female vocals, Phoebe Bridgers intimacy, delicate delivery, haunting beauty',
      themes: ['quiet longing', 'fading memories', 'simple moments', 'bittersweet love', 'autumn feelings']
    },
    'r&b': { 
      style: 'Platinum R&B, Darkchild production, silky smooth bass, lush neo-soul chords, crisp snares, warm atmospheric pads, sensual groove, Grammy quality', 
      maleVocals: 'smooth soulful male vocals, Usher style, falsetto runs, romantic and sensual delivery',
      femaleVocals: 'sultry female R&B vocals, Beyoncé power, melismatic runs, passionate and commanding',
      themes: ['midnight passion', 'undeniable chemistry', 'forever yours', 'heart on fire', 'silk sheets']
    },
    'jazz': { 
      style: 'Blue Note Jazz, sophisticated arrangement, warm piano chords, walking upright bass, brushed drums, brass accents, swing feel, timeless elegance', 
      maleVocals: 'smooth male jazz vocals, Michael Bublé class, sophisticated phrasing, elegant delivery',
      femaleVocals: 'sultry female jazz vocals, Norah Jones warmth, intimate phrasing, smoky elegance',
      themes: ['city lights', 'old fashioned love', 'rainy evenings', 'champagne nights', 'timeless romance']
    },
    'country': { 
      style: 'Nashville Modern Country, premium production, warm acoustic guitar, pedal steel, fiddle accents, authentic storytelling, stadium country, radio-ready', 
      maleVocals: 'authentic male country vocals, Luke Combs warmth, storytelling delivery, heartfelt emotion',
      femaleVocals: 'powerful female country vocals, Carrie Underwood strength, emotional range, genuine delivery',
      themes: ['small town dreams', 'back road memories', 'friday night lights', 'true love story', 'coming home']
    },
    'latin': { 
      style: 'Latin Grammy production, tropical percussion, brass stabs, reggaeton dembow, sensual rhythms, club-ready mix, international appeal, summer anthem', 
      maleVocals: 'passionate male Latin vocals, Bad Bunny style, rhythmic flow, charismatic delivery',
      femaleVocals: 'fiery female Latin vocals, Shakira power, passionate delivery, rhythmic precision',
      themes: ['tropical nights', 'bailando contigo', 'fuego eterno', 'under the stars', 'island paradise']
    },
    'reggaeton': { 
      style: 'Platinum Reggaeton, Tainy production, heavy dembow beat, deep 808 bass, perreo rhythm, club bangers, international hit quality, urban Latino', 
      maleVocals: 'energetic male reggaeton vocals, J Balvin flow, catchy hooks, party energy with swagger',
      femaleVocals: 'fierce female reggaeton vocals, Karol G energy, powerful hooks, commanding presence',
      themes: ['toda la noche', 'perreo intenso', 'mi amor prohibido', 'fiesta sin fin', 'calor del verano']
    },
  };

  const genreData = genreStyles[genre.toLowerCase()] || genreStyles['pop'];
  const songMood = mood || 'energetic';
  
  // Seleccionar tipo de voz según género del artista
  const vocalsStyle = artistGender === 'female' ? genreData.femaleVocals : genreData.maleVocals;

  // Construir prompt de estilo TOP QUALITY (10-300 caracteres)
  const stylePrompt = `${genreData.style}, ${songMood} mood, ${vocalsStyle}`.substring(0, 300);

  // Generar letras si no se proporcionan
  let lyricsPrompt: string;
  
  if (customLyrics) {
    // Usar letras personalizadas, asegurando que tengan tags
    lyricsPrompt = customLyrics.includes('[verse]') || customLyrics.includes('[chorus]') 
      ? customLyrics 
      : `[verse]\n${customLyrics}`;
  } else {
    // Generar letras automáticas basadas en el género y mood - CALIDAD PROFESIONAL
    const theme = genreData.themes[Math.floor(Math.random() * genreData.themes.length)];
    lyricsPrompt = generateLyricsForGenre(artistName, songTitle, genre, songMood, theme, artistGender);
  }

  // Asegurar que las letras cumplen el mínimo de 10 caracteres
  if (lyricsPrompt.length < 10) {
    lyricsPrompt = `[verse]\nThis is the story of ${artistName}\n[chorus]\n${songTitle}, yeah ${songTitle}`;
  }

  logger.log(`[FAL] Estilo: ${stylePrompt}`);
  logger.log(`[FAL] Letras generadas: ${lyricsPrompt.substring(0, 200)}...`);

  return generateMusicWithMiniMax(stylePrompt, lyricsPrompt);
}

/**
 * ============================================================
 * GENERADOR DE LETRAS PROFESIONALES - TOP SONGWRITER QUALITY
 * ============================================================
 * Genera letras de calidad profesional inspiradas en los mejores
 * compositores: Max Martin, Diane Warren, Lin-Manuel Miranda, etc.
 * 
 * @param artistName - Nombre del artista
 * @param songTitle - Título de la canción  
 * @param genre - Género musical
 * @param mood - Estado de ánimo
 * @param theme - Tema de la canción
 * @param artistGender - Género del artista ('male' | 'female')
 */
function generateLyricsForGenre(
  artistName: string,
  songTitle: string,
  genre: string,
  mood: string,
  theme: string,
  artistGender: 'male' | 'female' = 'male'
): string {
  // Templates de letras profesionales por género - Billboard/Grammy quality
  const lyricsTemplates: Record<string, { male: string; female: string }> = {
    'pop': {
      male: `[intro]
Yeah, ${artistName}, let's go

[verse]
I've been running through my mind all night
Searching for the words to make this right
Every heartbeat leads me back to you
And there's nothing that I wouldn't do

[pre-chorus]
We're standing on the edge of something beautiful
This feeling is undeniable

[chorus]
${songTitle}, we're lighting up the sky tonight
${songTitle}, everything just feels so right
We're dancing in the neon glow
And I never want to let you go
${songTitle}, this is where we come alive

[verse]
The city lights are calling out our names
Nothing in this world will be the same
Take my hand and let's escape tonight
Into the stars, we're taking flight

[chorus]
${songTitle}, we're lighting up the sky tonight
${songTitle}, everything just feels so right
We're dancing in the neon glow
And I never want to let you go
${songTitle}, this is where we come alive

[bridge]
When the world tries to bring us down
We'll rise up, we won't make a sound
Just you and me against it all
Together we will never fall

[outro]
${songTitle}, oh ${songTitle}
This is where we come alive`,

      female: `[intro]
${artistName}, yeah

[verse]
Been staring at the ceiling, can't sleep tonight
Thinking about the way you held me tight
Every memory playing on repeat
You're the missing piece that makes me complete

[pre-chorus]
I'm standing at the edge of something magical
This love is unconditional

[chorus]
${songTitle}, we're shining like the stars above
${songTitle}, you're everything I'm dreaming of
We're flying through the midnight sky
With you I feel like I can fly
${songTitle}, this is our moment, this is love

[verse]
The moonlight's painting shadows on the wall
I'm not afraid to give you my all
Take my heart, I'll give you everything
You're the fire, you're my everything

[chorus]
${songTitle}, we're shining like the stars above
${songTitle}, you're everything I'm dreaming of
We're flying through the midnight sky
With you I feel like I can fly
${songTitle}, this is our moment, this is love

[bridge]
When doubts try to tear us apart
I'll hold you closer to my heart
Nothing's gonna stop us now
We made this sacred vow

[outro]
${songTitle}, oh ${songTitle}
This is our moment, this is love`
    },

    'hip-hop': {
      male: `[intro]
Yeah, ${artistName} in the building
Let's get it

[verse]
Started with a vision and a dream in my head
Late nights in the studio, sleeping on the bed
Mama always told me I would make it one day
Now I'm stacking these checks and I'm paving the way

They said I wouldn't make it, look at me now
From the bottom to the top, I showed them how
Every verse I spit is like a work of art
I've been grinding since the start with a lion heart

[chorus]
${songTitle}, that's the movement, that's the wave
${songTitle}, we the ones they couldn't save
From the struggle to the throne, we made a way
${songTitle}, legendary every day

[verse]
Real recognize real, and I see the vision clear
No time for the fake ones, only real ones here
Every step I take is calculated, planned
Building this empire with my own two hands

Success is the revenge, let my haters watch
From the trenches to the top, never gonna stop
${artistName} the name that they'll remember
Every season I deliver, spring through December

[chorus]
${songTitle}, that's the movement, that's the wave
${songTitle}, we the ones they couldn't save
From the struggle to the throne, we made a way
${songTitle}, legendary every day

[bridge]
Pour one up for the ones who ain't make it
Dreams so big, had to go and take it
History in the making, yeah we made it
${songTitle}, yeah we made it`,

      female: `[intro]
${artistName}, yeah
Let them know

[verse]
Queen status, never backing down from the crown
Built this empire up from the ground
Every hater watching, see me winning now
Came from nothing, look at me, look at me now

Boss moves only, never second guessing
Every single day I count my blessings
Stacking paper, yeah I learned my lesson
Independent woman, that's a blessing

[chorus]
${songTitle}, that's the anthem for the queens
${songTitle}, chasing all our wildest dreams
From the bottom now we're running things
${songTitle}, bow down to the queen

[verse]
They tried to dim my light, but I shine brighter
Every obstacle just makes me a fighter
Self-made, self-paid, independent
Every word I say is transcendent

${artistName} the name on everybody's lips
Diamonds dripping, yeah I run the ship
No permission needed, I'm the captain now
Watch me take the throne, I'll show you how

[chorus]
${songTitle}, that's the anthem for the queens
${songTitle}, chasing all our wildest dreams
From the bottom now we're running things
${songTitle}, bow down to the queen

[bridge]
To my ladies holding it down
We run the world, we wear the crown
Unstoppable, unbreakable sound
${songTitle}, queens all around`
    },

    'rap': {
      male: `[intro]
Yo, ${artistName}
Real talk, let me speak

[verse]
I came from the concrete where nothing would grow
They planted doubts but watch me steal the show
Every bar I spit is like a loaded weapon
Teaching lessons that you won't be forgetting

Lyrical assassin, call me the legend
Every syllable measured, every metaphor threaded
From the block to the top, I've been dedicated
Every hater motivated me, now they devastated

[chorus]
${songTitle}, spitting fire, never stop
${songTitle}, coming straight to the top
Every rhyme is like a shot to your dome
${songTitle}, this is how legends are born

[verse]
Real recognize real, I'm the definition
Every verse I write is a lyrical mission
Street smart wisdom combined with ambition
${artistName} on a mission, breaking every restriction

They say talent is given but the grind is chosen
Every word that I spit leaves the competition frozen
From the underground scene to the mainstream flows
Watch me rise like a phoenix, everybody knows

[chorus]
${songTitle}, spitting fire, never stop
${songTitle}, coming straight to the top
Every rhyme is like a shot to your dome
${songTitle}, this is how legends are born

[outro]
${songTitle}, yeah
Legends never die`,

      female: `[intro]
It's ${artistName}
Watch me work

[verse]
Pen in my hand, I'm a lyrical soldier
Every verse I spit the game gets colder
They underestimated, now they looking over
Their shoulder, cause I'm about to take over

Spitting venom with precision and grace
Every punchline hitting, putting you in place
Self-made queen with a killer flow
Watch me steal the show, let everybody know

[chorus]
${songTitle}, female MC running things
${songTitle}, every bar that I bring
They can't stop me, I'm a lyrical queen
${songTitle}, the baddest they've seen

[verse]
From the bedroom to the booth, I've been working
Every late night session, never stop learning
Perfecting my craft while they're out there lurking
Watch me take the crown, yeah I'm really earning

${artistName} spitting facts, no fiction
Every word I say is a deadly conviction
Breaking barriers down with my diction
The future is female, that's my prediction

[chorus]
${songTitle}, female MC running things
${songTitle}, every bar that I bring
They can't stop me, I'm a lyrical queen
${songTitle}, the baddest they've seen`
    },

    'rock': {
      male: `[verse]
Standing on the edge of destruction tonight
Every scar I carry is a badge of pride
They tried to break me but I'm still alive
${artistName} rising with the tide

The flames are burning, I can feel the heat
Every heartbeat sounds like a thundering beat
This is our anthem, feel it in your soul
Rock and roll will never grow old

[chorus]
${songTitle}! We're screaming at the sky
${songTitle}! Tonight we're gonna fly
Breaking every chain that holds us down
${songTitle}! We're wearing the crown

[verse]
Guitar strings bleeding, drums are pounding hard
Every note we play leaves a permanent scar
From the underground clubs to the stadium lights
We're the warriors of the endless nights

No surrender, no retreat tonight
We're the rebels who are born to fight
${artistName} leading the revolution
This is rock and roll absolution

[chorus]
${songTitle}! We're screaming at the sky
${songTitle}! Tonight we're gonna fly
Breaking every chain that holds us down
${songTitle}! We're wearing the crown

[bridge]
When the world is falling apart
We'll light the fire in the dark
Together we are unbreakable
This sound is unforgettable`,

      female: `[verse]
Standing in the fire, I won't burn tonight
Every wound they gave me made me shine so bright
They tried to silence me but hear me roar
${artistName}'s kicking down the door

The thunder's rolling, lightning in my veins
Every single battle broke my chains
This is liberation, feel it in your bones
We're taking back what they have stolen

[chorus]
${songTitle}! We're rising from the ashes
${songTitle}! Breaking down the masses
Nothing's gonna stop us anymore
${songTitle}! This is what we're fighting for

[verse]
Hair flying wild, screaming out my pain
Every single drop of sweat like healing rain
From the garage shows to the arena stage
We're rewriting history, turning the page

Fearless and fierce, we're taking our stand
With my sisters beside me, hand in hand
${artistName} leading the charge tonight
We're the warriors bathed in light

[chorus]
${songTitle}! We're rising from the ashes
${songTitle}! Breaking down the masses
Nothing's gonna stop us anymore
${songTitle}! This is what we're fighting for`
    },

    'r&b': {
      male: `[verse]
Candles burning low, shadows on the wall
Every time I see you, baby, I just fall
The way you move your body drives me crazy
Let me show you love, no ifs or maybes

Your touch is like velvet, your kiss is divine
I wanna spend forever making you mine
${artistName} singing just for you tonight
Under the moonlight, everything feels right

[pre-chorus]
I've been waiting for someone like you
Everything I'm feeling is so true

[chorus]
${songTitle}, you're the one I need
${songTitle}, you're my every dream
Let me hold you close until the sunrise
${songTitle}, baby, you're my paradise

[verse]
Silk sheets tangled, time standing still
Every moment with you gives me chills
The chemistry between us can't be denied
With you, baby, I've got nothing to hide

Your love is the melody, I'm the harmony
Together we're creating pure symphony
${artistName} will always be by your side
In your arms is where I want to reside

[chorus]
${songTitle}, you're the one I need
${songTitle}, you're my every dream
Let me hold you close until the sunrise
${songTitle}, baby, you're my paradise`,

      female: `[verse]
Lying here beneath the chandelier light
Your cologne still lingers through the night
The way you whisper makes my heart skip beats
Every touch of yours feels so complete

I've been searching for a love so true
And then the universe led me to you
${artistName} falling deeper every day
In your embrace I want to stay

[pre-chorus]
Something about you feels like coming home
With you I never feel alone

[chorus]
${songTitle}, this love is like a dream
${songTitle}, you're my everything
Hold me close and never let me go
${songTitle}, this is all I know

[verse]
Champagne bubbles, rose petals on the bed
Every love song reminds me of what you said
The fire burning between us won't fade
In your arms is where I want to stay

Your love is patient, your love is kind
The most beautiful soul I'll ever find
${artistName} giving you all my heart
Nothing in this world will tear us apart

[chorus]
${songTitle}, this love is like a dream
${songTitle}, you're my everything
Hold me close and never let me go
${songTitle}, this is all I know`
    },

    'electronic': {
      male: `[intro]
${artistName}

[verse]
Neon lights pulsing through my veins
Losing myself in the electronic waves
The bass is dropping, feel the frequency
Tonight we're living endlessly

Hands up to the sky, we're reaching for the stars
This moment right here is who we are
The synths are screaming, the crowd is one
Under the lasers, we've just begun

[chorus]
${songTitle}, feel the beat inside your soul
${songTitle}, we're losing all control
The drop is coming, let it take you higher
${songTitle}, we're burning like a fire

[verse]
Euphoria rushing, can't stop this feeling
The music's got us, hearts are healing
Connected by the rhythm, united as one
Dancing till we greet the sun

${artistName} leading this electric night
Everything around us shining bright
The melody is calling out your name
After tonight, nothing's the same

[drop]

[chorus]
${songTitle}, feel the beat inside your soul
${songTitle}, we're losing all control
The drop is coming, let it take you higher
${songTitle}, we're burning like a fire`,

      female: `[intro]
${artistName}

[verse]
Strobe lights dancing on my skin tonight
Every color bleeding into the light
The bass vibrations in my chest
Tonight we give it all, nothing less

Lifting higher, ascending to the sky
With the music we can fly
The frequencies are taking over me
This is pure ecstasy

[chorus]
${songTitle}, surrendering to sound
${songTitle}, we're levitating off the ground
Feel the energy, let it pull you in
${songTitle}, let the night begin

[verse]
Electric pulses racing through the air
Finding freedom everywhere
Connected to the beat, connected to the night
Everything is feeling so right

${artistName} floating in the melody
This is who we're meant to be
The synthesizers calling out our names
Tonight we're burning up in flames

[drop]

[chorus]
${songTitle}, surrendering to sound
${songTitle}, we're levitating off the ground
Feel the energy, let it pull you in
${songTitle}, let the night begin`
    },

    'reggaeton': {
      male: `[intro]
${artistName}, yeah
Dale, dale

[verso]
Llegué a la disco y todo el mundo lo siente
El dembow sonando, moving everybody
Ella me mira con esos ojos calientes
Tonight we're gonna party, party

La noche está joven, el reggaetón prendido
Toda la discoteca se mueve conmigo
${artistName} llegó y todos saben lo que significa
Perreo intenso hasta que amanezca, mami

[coro]
${songTitle}, baila baila baila
${songTitle}, mueve esa cintura
Toda la noche hasta el amanecer
${songTitle}, no vamos a parar

[verso]
El bajo retumba, las luces brillando
Los cuerpos moviéndose, sudor goteando
Esta es la fiesta que todos esperaban
${artistName} en el beat, la discoteca explotando

Con la música en el alma, el ritmo en la piel
Esta noche es nuestra, baby, you know the deal
El dembow controlando cada movimiento
This is the moment, vive el momento

[coro]
${songTitle}, baila baila baila
${songTitle}, mueve esa cintura
Toda la noche hasta el amanecer
${songTitle}, no vamos a parar

[outro]
${songTitle}, dale
${artistName}`,

      female: `[intro]
${artistName}
Escucha esto

[verso]
Llegué al party luciendo increíble
Todos los ojos en mí, soy irresistible
El dembow sonando, siento el calor
Moving my body, soy la sensación

La reina de la noche, nadie me para
Con mi actitud y mi flow asesina
${artistName} dominando el baile
Every single move got them watching, that's fire

[coro]
${songTitle}, yo controlo la pista
${songTitle}, soy la protagonista
Mueve tu cuerpo, sígueme el paso
${songTitle}, vamos a gozar

[verso]
Sexy and confident, así es como soy
Rompiendo la discoteca wherever I go
Las mujeres empoderadas, we run this place
${artistName} con el flow and the grace

El reggaetón me llama, el ritmo me mueve
Toda la noche bailando, el calor se siente
No necesito a nadie, I'm complete alone
Pero si quieres bailar, welcome to my zone

[coro]
${songTitle}, yo controlo la pista
${songTitle}, soy la protagonista
Mueve tu cuerpo, sígueme el paso
${songTitle}, vamos a gozar

[outro]
${songTitle}
${artistName}, la reina del perreo`
    },

    'latin': {
      male: `[intro]
${artistName}
Siente el ritmo

[verso]
Bajo las estrellas del Caribe esta noche
La música latina corriendo por mis venas
El calor de tu mirada me tiene hypnotized
Bailando contigo hasta que salga el sol

Los tambores llamando, la clave sonando
Every beat of the music got me celebrating
${artistName} trayendo ese sabor tropical
Esta noche es mágica, unforgettable

[coro]
${songTitle}, fuego en el corazón
${songTitle}, dame tu amor
Bailamos hasta el amanecer
${songTitle}, contigo quiero estar

[verso]
Tu sonrisa brilla como la luna llena
Cada movimiento tuyo me vuelve loco, nena
La pasión latina burning in our souls
With every step we take, we're losing control

From the beaches of Puerto Rico to Miami nights
${artistName} bringing the vibes so right
El sabor del Caribe running through the track
Once you feel this rhythm, there's no turning back

[coro]
${songTitle}, fuego en el corazón
${songTitle}, dame tu amor
Bailamos hasta el amanecer
${songTitle}, contigo quiero estar`,

      female: `[intro]
${artistName}
Escúchame

[verso]
Soy la llama que enciende la noche entera
Latina de corazón, guerrera verdadera
El ritmo me posee, me dejo llevar
With every single beat I'm ready to fly

Los colores vibrantes, la pasión intensa
Cada canción que canto es mi recompensa
${artistName} bringing the fire tonight
Under the Caribbean stars so bright

[coro]
${songTitle}, soy la reina de este baile
${songTitle}, fuego que no se cae
Con mi sabor latino, I'll set you free
${songTitle}, baila junto a mí

[verso]
La sangre caliente running through my veins
La música latina washing away the pains
From Santo Domingo to the world stage
${artistName} rewriting every page

Latina and proud, that's who I am
Dancing to the beat, living life grand
El corazón del Caribe in every song
With this rhythm we can never go wrong

[coro]
${songTitle}, soy la reina de este baile
${songTitle}, fuego que no se cae
Con mi sabor latino, I'll set you free
${songTitle}, baila junto a mí`
    },

    'indie': {
      male: `[verse]
Autumn leaves are falling past my window pane
I'm sitting here remembering your name
The vinyl's spinning, coffee getting cold
Some feelings never change as we grow old

${artistName} singing to the empty room
Hoping that the melody will reach you soon
Through static and the distance in between
You're still the most beautiful I've seen

[chorus]
${songTitle}, written in the morning light
${songTitle}, lonely Saturday nights
Missing what we had before
${songTitle}, I can't take it anymore

[verse]
Polaroid memories scattered on the floor
Each one takes me back to something more
Your laugh echoing in my hollow chest
Maybe it was us who needed rest

The strings are gentle, the drums are soft
These feelings lift me up aloft
${artistName} searching for the words to say
Hoping you'll come back someday

[chorus]
${songTitle}, written in the morning light
${songTitle}, lonely Saturday nights
Missing what we had before
${songTitle}, I can't take it anymore

[outro]
${songTitle}
I'll be waiting here for you`,

      female: `[verse]
The fairy lights are dimming in my room
I'm wrapped up in the silence and the gloom
Your sweater still smells like you, bittersweet
Every memory playing on repeat

${artistName} humming melancholy tunes
Watching shadows dancing with the moon
The world outside is sleeping but I'm wide awake
Wondering if this heartbreak will break

[chorus]
${songTitle}, whispered in the night
${songTitle}, holding on so tight
To the ghost of what we were before
${songTitle}, I can't fight anymore

[verse]
The tea is cold, the pages of my book unread
All the things I wish that I had said
Your voicemails saved, I listen when I'm blue
Finding tiny pieces of what's true

The guitar's gentle, my voice is raw
Singing about the cracks and every flaw
${artistName} learning to let go
Even when it hurts me so

[chorus]
${songTitle}, whispered in the night
${songTitle}, holding on so tight
To the ghost of what we were before
${songTitle}, I can't fight anymore

[outro]
${songTitle}
Maybe someday I'll be whole`
    },

    'jazz': {
      male: `[verse]
Smoke curling up from the piano keys tonight
The bourbon's amber glowing in the dim spotlight
${artistName} crooning like the legends of old
A story of love that needed to be told

The upright bass is walking, drums are brushing soft
In this old jazz club where time is forgot
Your eyes across the room caught mine just right
Let me take you dancing through the night

[chorus]
${songTitle}, like a melody so sweet
${songTitle}, makes my heart skip a beat
Under the chandelier's golden light
${songTitle}, everything feels right

[verse]
The saxophone is crying tears of joy and pain
Like walking through Manhattan in the rain
Every note I sing is meant for you, my dear
In this moment, there's nothing left to fear

${artistName} pouring out his soul on stage
Writing our love story page by page
The jazz is flowing like fine champagne
With you I've got nothing to explain

[chorus]
${songTitle}, like a melody so sweet
${songTitle}, makes my heart skip a beat
Under the chandelier's golden light
${songTitle}, everything feels right`,

      female: `[verse]
Velvet curtains, smoky atmosphere
${artistName} singing what you need to hear
The piano player knows just what I feel
Every note I sing is oh so real

In this old speakeasy, time stands still
Your smile across the room gives me a thrill
The double bass is humming sweet and low
Let me take you somewhere nice and slow

[chorus]
${songTitle}, like a dream come true
${songTitle}, I'm so lost in you
The spotlight fades to just us two
${songTitle}, falling into you

[verse]
Martini glasses clinking all around
But I only hear your heartbeat's sound
Every standard song I've ever sung
Pales to this love, forever young

${artistName} wrapped in blue velvet night
Everything about this moment feels so right
The jazz quartet is playing just for us
No need to rush, no need to fuss

[chorus]
${songTitle}, like a dream come true
${songTitle}, I'm so lost in you
The spotlight fades to just us two
${songTitle}, falling into you`
    },

    'country': {
      male: `[verse]
Down a dusty back road where I learned to drive
The fireflies are dancing, I feel so alive
My truck radio playing the oldies tonight
${artistName} singing under the starlight

Front porch swinging, sweet tea in my hand
Living life the way that it was planned
Small town dreams and a big open sky
These are the moments that never die

[chorus]
${songTitle}, that's the country way
${songTitle}, where I'm gonna stay
Boots on the ground, hat on my head
${songTitle}, till the day I'm dead

[verse]
Friday night lights at the football game
Nothing in this little town ever stays the same
But the people here are real as it gets
Hard working folks who don't believe in regrets

${artistName} grateful for these roots so deep
The promises that we all keep
From Sunday church to Saturday nights
Living life with all its beautiful lights

[chorus]
${songTitle}, that's the country way
${songTitle}, where I'm gonna stay
Boots on the ground, hat on my head
${songTitle}, till the day I'm dead

[bridge]
Raise your glass to the ones we love
Thank the Lord and the stars above
This is home, this is where I belong
Singing this country song`,

      female: `[verse]
Barefoot in the summer grass tonight
Catching fireflies in the fading light
My mama's apple pie cooling on the sill
${artistName} singing on the hill

The willow tree where we carved our names
Life was simple, love was never games
Wildflower fields stretching far and wide
Nothing left to run from, nothing left to hide

[chorus]
${songTitle}, that's my heart and soul
${songTitle}, making me feel whole
From the river banks to the old church steeple
${songTitle}, songs for the simple people

[verse]
Daddy taught me how to fish and pray
Mama taught me love finds a way
These Tennessee hills raised me right
${artistName} singing through the night

Jeans and boots, that's my style
Love these country roads mile after mile
Simple pleasures, honest living
A grateful heart forever giving

[chorus]
${songTitle}, that's my heart and soul
${songTitle}, making me feel whole
From the river banks to the old church steeple
${songTitle}, songs for the simple people

[bridge]
Here's to the small towns and the real ones
Here's to the daughters and the sons
Living life with grace and pride
Country music as our guide`
    }
  };

  // Seleccionar template según género musical y género del artista
  const genreTemplate = lyricsTemplates[genre.toLowerCase()] || lyricsTemplates['pop'];
  return artistGender === 'female' ? genreTemplate.female : genreTemplate.male;
}

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
      'r&b': 'elegant, smooth, soulful aesthetic',
      'jazz': 'classic, sophisticated, timeless style',
      'latin': 'vibrant, tropical, passionate colors',
      'reggaeton': 'urban latin, flashy, party vibes',
    };

    const style = genreStyles[genre.toLowerCase()] || 'modern music artist aesthetic';

    // Prompts específicos para cada producto con coherencia de marca
    const productPrompts: Record<string, string> = {
      'T-Shirt': `Professional e-commerce photo of a premium black t-shirt with "${artistName} x Boostify" printed design. ${style}. Orange and black color scheme. Front view on pure white background. Studio lighting, 4K quality, commercial product photography.`,
      
      'Hoodie': `Professional product photo of an oversized black hoodie featuring "${artistName} x Boostify" branding. ${style}. Orange accent details on sleeves. Front view, hood up, on white background. Commercial fashion photography, 4K quality.`,
      
      'Cap': `Professional product photo of a black snapback cap with "${artistName} x Boostify" embroidered logo. ${style}. Orange bill accent. 3/4 angle view on white background. Sharp details, commercial photography.`,
      
      'Poster': `Music poster design for "${artistName} x Boostify" collaboration. ${style}. Bold typography, orange and black color palette. Modern graphic design, concert poster aesthetic, 4K quality.`,
      
      'Sticker Pack': `Flat lay of vinyl sticker pack featuring "${artistName} x Boostify" designs. ${style}. Mix of logo stickers in orange, black, white colors. Overhead shot on white background, commercial photography.`,
      
      'Vinyl': `Limited edition vinyl record "${artistName} x Boostify" with orange and black swirl disc. ${style}. Custom album artwork visible on sleeve. Record partially out, dramatic lighting on white background.`
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
    logger.error('[FAL] Error generando merchandise:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.detail || error.message
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
    
    // Fallback a Wan si Grok falla
    logger.warn('[FAL] Intentando fallback con Wan 2.6...');
    return generateVideoFromImageWithWan(imageUrl, prompt, {
      resolution: options.resolution,
      aspectRatio: options.aspectRatio === 'auto' ? '16:9' : options.aspectRatio as any,
      duration: options.duration
    });
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
