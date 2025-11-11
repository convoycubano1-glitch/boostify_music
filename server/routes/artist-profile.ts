/**
 * Rutas para perfil de artista con generación automática de Gemini + Nano Banana
 */
import { Router, Request, Response } from 'express';
import { generateCinematicImage, generateImageWithMultipleFaceReferences } from '../services/gemini-image-service';
import { generateArtistBiography, type ArtistInfo } from '../services/gemini-profile-service';

const router = Router();

/**
 * Genera imagen de perfil de artista con Gemini 2.5 Flash Image (Nano Banana)
 * Soporta imagen de referencia para preservar identidad facial
 */
router.post('/generate-profile-image', async (req: Request, res: Response) => {
  try {
    const { artistName, genre, style, biography, referenceImage } = req.body;
    
    if (!artistName) {
      return res.status(400).json({
        success: false,
        error: 'Artist name is required'
      });
    }
    
    // Crear prompt optimizado para imagen de perfil
    const basePrompt = `Professional artist profile photo: ${artistName}, ${genre || 'musician'} artist. 
    ${style || 'Modern, professional headshot with artistic lighting'}. 
    ${biography ? `Artist background: ${biography.substring(0, 200)}` : ''}.
    High quality portrait photography, studio lighting, professional artist photograph, 
    centered composition, clean background, artistic and professional aesthetic.`;
    
    console.log('🎨 Generating profile image with Nano Banana (Gemini 2.5 Flash Image)...');
    
    let result;
    
    // Si hay imagen de referencia, usar generación con preservación facial
    if (referenceImage) {
      console.log('👤 Using reference image for facial consistency...');
      const referenceImages = [referenceImage];
      result = await generateImageWithMultipleFaceReferences(basePrompt, referenceImages);
    } else {
      // Sin referencia, usar generación normal
      result = await generateCinematicImage(basePrompt);
    }
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating profile image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate profile image'
    });
  }
});

/**
 * Genera imagen de banner/portada de artista con Gemini 2.5 Flash Image (Nano Banana)
 * Soporta imagen de referencia para incluir al artista en el banner
 */
router.post('/generate-banner-image', async (req: Request, res: Response) => {
  try {
    const { artistName, genre, style, mood, biography, referenceImage } = req.body;
    
    if (!artistName) {
      return res.status(400).json({
        success: false,
        error: 'Artist name is required'
      });
    }
    
    // Crear prompt optimizado para banner
    const basePrompt = `Professional artist banner cover image: ${artistName}, ${genre || 'musician'} artist. 
    ${style || 'Cinematic, wide-angle composition'}. 
    ${mood || 'Energetic and creative atmosphere'}. 
    ${biography ? `Artist style: ${biography.substring(0, 200)}` : ''}.
    Wide format banner, 16:9 aspect ratio, cinematic lighting, professional music artist aesthetic, 
    vibrant colors, high quality photography, artistic and dynamic composition.`;
    
    console.log('🎨 Generating banner image with Nano Banana (Gemini 2.5 Flash Image)...');
    
    let result;
    
    // Si hay imagen de referencia, usar generación con preservación facial
    if (referenceImage) {
      console.log('👤 Using reference image for facial consistency in banner...');
      const referenceImages = [referenceImage];
      result = await generateImageWithMultipleFaceReferences(basePrompt, referenceImages);
    } else {
      // Sin referencia, usar generación normal
      result = await generateCinematicImage(basePrompt);
    }
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating banner image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate banner image'
    });
  }
});

/**
 * Genera biografía de artista con Gemini
 */
router.post('/generate-biography', async (req: Request, res: Response) => {
  try {
    const artistInfo: ArtistInfo = req.body;
    
    if (!artistInfo.name) {
      return res.status(400).json({
        success: false,
        error: 'Artist name is required'
      });
    }
    
    console.log('📝 Generating artist biography...');
    const result = await generateArtistBiography(artistInfo);
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating biography:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate biography'
    });
  }
});

export default router;
