/**
 * Rutas para perfil de artista con generación automática de Gemini
 */
import { Router, Request, Response } from 'express';
import { generateCinematicImage } from '../services/gemini-image-service';
import { generateArtistBiography, type ArtistInfo } from '../services/gemini-profile-service';

const router = Router();

/**
 * Genera imagen de perfil de artista con Gemini
 */
router.post('/generate-profile-image', async (req: Request, res: Response) => {
  try {
    const { artistName, genre, style } = req.body;
    
    if (!artistName) {
      return res.status(400).json({
        success: false,
        error: 'Artist name is required'
      });
    }
    
    // Crear prompt optimizado para imagen de perfil
    const prompt = `Professional artist profile photo: ${artistName}, ${genre || 'musician'} artist. 
    ${style || 'Modern, professional headshot with artistic lighting'}. 
    High quality portrait photography, studio lighting, professional artist photograph, 
    centered composition, clean background, artistic and professional aesthetic.`;
    
    console.log('🎨 Generating profile image...');
    const result = await generateCinematicImage(prompt);
    
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
 * Genera imagen de banner/portada de artista con Gemini
 */
router.post('/generate-banner-image', async (req: Request, res: Response) => {
  try {
    const { artistName, genre, style, mood } = req.body;
    
    if (!artistName) {
      return res.status(400).json({
        success: false,
        error: 'Artist name is required'
      });
    }
    
    // Crear prompt optimizado para banner
    const prompt = `Professional artist banner cover image: ${artistName}, ${genre || 'musician'} artist. 
    ${style || 'Cinematic, wide-angle composition'}. 
    ${mood || 'Energetic and creative atmosphere'}. 
    Wide format banner, 16:9 aspect ratio, cinematic lighting, professional music artist aesthetic, 
    vibrant colors, high quality photography, artistic and dynamic composition.`;
    
    console.log('🎨 Generating banner image...');
    const result = await generateCinematicImage(prompt);
    
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
