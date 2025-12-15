/**
 * Rutas para perfil de artista con generación automática de OpenAI + FAL Nano Banana
 */
import { Router, Request, Response } from 'express';
import { generateImageWithNanoBanana, editImageWithNanoBanana, generateMerchandiseImage } from '../services/fal-service';
import { generateArtistBiography, type ArtistInfo } from '../services/openai-profile-service';
import Stripe from 'stripe';
import { db } from '../db';
import { users } from '../db/schema';
import { isNull, and } from 'drizzle-orm';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

const router = Router();

/**
 * Genera imagen de perfil de artista con FAL AI Nano Banana
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
    
    console.log('🎨 Generating profile image with FAL AI Nano Banana...');
    
    let result;
    
    // Si hay imagen de referencia, usar edición con nano-banana
    if (referenceImage) {
      console.log('👤 Using reference image for facial consistency...');
      result = await editImageWithNanoBanana(
        [referenceImage],
        basePrompt,
        { aspectRatio: '1:1' }
      );
    } else {
      // Sin referencia, usar generación normal
      result = await generateImageWithNanoBanana(basePrompt, { aspectRatio: '1:1' });
    }
    
    console.log('🎨 Profile image result:', { success: result.success, hasError: !!result.error, provider: result.provider });
    if (!result.success) {
      console.error('❌ Profile image generation failed:', result.error);
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
 * Genera imagen de banner/portada de artista con FAL AI Nano Banana
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
    
    console.log('🎨 Generating banner image with FAL AI Nano Banana...');
    
    let result;
    
    // Si hay imagen de referencia, usar edición con nano-banana
    if (referenceImage) {
      console.log('👤 Using reference image for facial consistency in banner...');
      result = await editImageWithNanoBanana(
        [referenceImage],
        basePrompt,
        { aspectRatio: '16:9' }
      );
    } else {
      // Sin referencia, usar generación normal
      result = await generateImageWithNanoBanana(basePrompt, { aspectRatio: '16:9' });
    }
    
    console.log('🎨 Banner image result:', { success: result.success, hasError: !!result.error, provider: result.provider });
    if (!result.success) {
      console.error('❌ Banner image generation failed:', result.error);
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
 * Genera biografía de artista con OpenAI
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

/**
 * Genera imagen de producto de merchandise con FAL AI nano-banana/edit
 * Usa la imagen del perfil del artista como base para coherencia visual
 */
router.post('/generate-product-image', async (req: Request, res: Response) => {
  try {
    const { productType, artistName, artistImageUrl, genre } = req.body;
    
    if (!productType) {
      return res.status(400).json({
        success: false,
        error: 'Product type is required'
      });
    }
    
    console.log(`🎨 Generating ${productType} product image with FAL AI nano-banana/edit...`);
    console.log(`   Artist: ${artistName}`);
    console.log(`   Artist Image: ${artistImageUrl ? artistImageUrl.substring(0, 50) + '...' : 'none'}`);
    console.log(`   Genre: ${genre || 'Pop'}`);
    
    // Usar generateMerchandiseImage que usa nano-banana/edit con la imagen del artista
    const falResult = await generateMerchandiseImage(
      artistName || 'Artist',
      productType,
      artistImageUrl || '',
      genre || 'Pop'
    );
    
    if (falResult.success && falResult.imageUrl) {
      console.log(`✅ ${productType} image generated successfully with ${falResult.provider}`);
      return res.json({
        success: true,
        imageUrl: falResult.imageUrl,
        provider: falResult.provider
      });
    }
    
    // Fallback a flux/schnell sin imagen de artista
    console.log('⚠️ nano-banana/edit failed, trying flux/schnell fallback...');
    const fallbackResult = await generateImageWithNanoBanana(
      `Professional product photo of ${artistName} ${productType} merchandise. Orange and black branding. White background, 4K quality.`
    );
    
    if (fallbackResult.success && fallbackResult.imageUrl) {
      return res.json({
        success: true,
        imageUrl: fallbackResult.imageUrl,
        provider: 'fal-flux-schnell-fallback'
      });
    }
    
    // All FAL fallbacks failed - return error
    console.log('❌ All image generation attempts failed');
    return res.status(500).json({
      success: false,
      error: 'All image generation attempts failed'
    });
  } catch (error: any) {
    console.error('Error generating product image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate product image'
    });
  }
});

/**
 * Helper para obtener la URL base según el entorno
 * Igual que en stripe.ts para consistencia
 */
const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return 'https://boostify.replit.app';
  }
  
  if (process.env.REPLIT_DOMAINS) {
    const domains = process.env.REPLIT_DOMAINS.split(',');
    return `https://${domains[0]}`;
  }
  
  const replSlug = process.env.REPL_SLUG;
  const replOwner = process.env.REPL_OWNER;
  
  if (replSlug && replOwner) {
    return `https://${replSlug}.${replOwner}.repl.co`;
  }
  
  return 'http://localhost:5000';
};

/**
 * Crea sesión de checkout de Stripe para comprar producto
 */
router.post('/create-checkout-session', async (req: Request, res: Response) => {
  try {
    const { productName, productPrice, productImage, artistName, productId, size } = req.body;
    
    if (!productName || !productPrice) {
      return res.status(400).json({
        success: false,
        error: 'Product name and price are required'
      });
    }
    
    const BASE_URL = getBaseUrl();
    console.log(`💳 Creating Stripe checkout session for ${productName} (${size || 'default size'})...`);
    console.log(`🔗 Using BASE_URL: ${BASE_URL}`);
    
    // Crear sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${productName}${size ? ` - Size: ${size}` : ''}`,
              description: `${artistName} Official Merchandise`,
              images: productImage ? [productImage] : undefined,
            },
            unit_amount: Math.round(productPrice * 100), // Convertir a centavos
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${BASE_URL}/artist/${artistName}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${BASE_URL}/artist/${artistName}?canceled=true`,
      metadata: {
        productId: productId || '',
        artistName: artistName || '',
        size: size || '',
        type: 'merchandise',
      },
    });
    
    console.log(`✅ Checkout session created: ${session.id}`);
    console.log(`✅ Success URL: ${BASE_URL}/artist/${artistName}?success=true&session_id={CHECKOUT_SESSION_ID}`);
    
    return res.json({
      success: true,
      sessionId: session.id,
      url: session.url,
    });
  } catch (error: any) {
    console.error('Error creating checkout session:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to create checkout session'
    });
  }
});

/**
 * Genera imágenes faltantes para artistas sin profile_image y cover_image
 * POST /api/artist-profile/generate-missing-images
 */
router.post('/generate-missing-images', async (req: Request, res: Response) => {
  try {
    console.log('🎨 Starting to generate missing images for artists...');
    
    // Obtener artistas sin imágenes
    const artistsWithoutImages = await db
      .select()
      .from(users)
      .where(
        and(
          isNull(users.profileImage),
          isNull(users.coverImage)
        )
      );
    
    console.log(`📊 Found ${artistsWithoutImages.length} artists without images`);
    
    const results = [];
    
    for (const artist of artistsWithoutImages) {
      try {
        console.log(`🎨 Generating images for: ${artist.artistName}`);
        
        const genre = artist.genres?.[0] || 'music';
        const biography = artist.biography || 'Professional musician';
        
        // Generar imagen de perfil con FAL nano-banana
        const profilePrompt = `Professional artist profile photo: ${artist.artistName}, ${genre} artist. Modern, professional headshot with artistic lighting. Biography: ${biography.substring(0, 200)}. High quality portrait photography, studio lighting, professional artist photograph, centered composition, clean background, artistic and professional aesthetic.`;
        
        const profileResult = await generateImageWithNanoBanana(profilePrompt, { aspectRatio: '1:1' });
        
        // Generar imagen de banner con FAL nano-banana
        const bannerPrompt = `Professional artist banner cover image: ${artist.artistName}, ${genre} artist. Cinematic, wide-angle composition. Biography: ${biography.substring(0, 200)}. Wide format banner, 16:9 aspect ratio, cinematic lighting, professional music artist aesthetic, vibrant colors, high quality photography, artistic and dynamic composition.`;
        
        const bannerResult = await generateImageWithNanoBanana(bannerPrompt, { aspectRatio: '16:9' });
        
        if (profileResult.success && profileResult.imageUrl && bannerResult.success && bannerResult.imageUrl) {
          // Guardar URLs en PostgreSQL
          await db.update(users)
            .set({
              profileImage: profileResult.imageUrl,
              coverImage: bannerResult.imageUrl,
              updatedAt: new Date()
            })
            .where(users.id === artist.id);
          
          console.log(`✅ Images generated and saved for ${artist.artistName}`);
          results.push({
            artistId: artist.id,
            artistName: artist.artistName,
            success: true,
            profileImage: profileResult.imageUrl,
            coverImage: bannerResult.imageUrl
          });
        } else {
          console.warn(`⚠️ Failed to generate images for ${artist.artistName}`);
          results.push({
            artistId: artist.id,
            artistName: artist.artistName,
            success: false,
            error: 'Image generation failed'
          });
        }
        
        // Pequeño delay entre llamadas
        await new Promise(r => setTimeout(r, 1000));
        
      } catch (error: any) {
        console.error(`❌ Error generating images for ${artist.artistName}:`, error);
        results.push({
          artistId: artist.id,
          artistName: artist.artistName,
          success: false,
          error: error.message
        });
      }
    }
    
    res.json({
      success: true,
      message: `Generated images for ${results.filter(r => r.success).length}/${results.length} artists`,
      results
    });
    
  } catch (error: any) {
    console.error('Error in generate-missing-images:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate missing images'
    });
  }
});

export default router;
