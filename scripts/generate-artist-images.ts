/**
 * Script para generar imágenes de artistas virtuales usando FAL AI
 */
import { generateImageWithFAL } from '../server/services/gemini-image-service';
import { logger } from '../server/utils/logger';

export interface ArtistImageUrls {
  profileUrl: string;
  coverUrl: string;
}

/**
 * Genera imágenes para un artista basándose en su descripción
 * @param description - Descripción física del artista generada por IA
 * @returns URLs de las imágenes generadas (perfil y portada)
 */
export async function generateArtistImages(description: string): Promise<ArtistImageUrls> {
  logger.log(`🎨 Generando imágenes para artista...`);
  logger.log(`📝 Descripción: ${description.substring(0, 100)}...`);

  try {
    // Generar imagen de perfil (primer plano del rostro)
    const profilePrompt = `Professional headshot portrait photo, close-up view. ${description}. Studio lighting, neutral background, looking at camera, photorealistic, 8K, highly detailed.`;
    
    logger.log(`📸 Generando imagen de perfil...`);
    const profileResult = await generateImageWithFAL(profilePrompt, [], undefined);
    
    if (!profileResult.success || !profileResult.imageUrl) {
      throw new Error(profileResult.error || 'Error al generar imagen de perfil');
    }
    
    logger.log(`✅ Imagen de perfil generada: ${profileResult.imageUrl}`);
    
    // Generar imagen de portada (toma completa del cuerpo)
    const coverPrompt = `Full body portrait photo, professional photography. ${description}. Artistic lighting, creative background, dynamic pose, photorealistic, 8K, highly detailed, cinematic.`;
    
    logger.log(`📸 Generando imagen de portada...`);
    const coverResult = await generateImageWithFAL(coverPrompt, [], undefined);
    
    if (!coverResult.success || !coverResult.imageUrl) {
      throw new Error(coverResult.error || 'Error al generar imagen de portada');
    }
    
    logger.log(`✅ Imagen de portada generada: ${coverResult.imageUrl}`);
    
    return {
      profileUrl: profileResult.imageUrl,
      coverUrl: coverResult.imageUrl
    };
    
  } catch (error) {
    logger.error('❌ Error generando imágenes del artista:', error);
    throw error;
  }
}
