/**
 * Rutas para perfil de artista con generación automática de Gemini + Nano Banana
 */
import { Router, Request, Response } from 'express';
import { generateCinematicImage, generateImageWithMultipleFaceReferences, generateImageWithFAL } from '../services/gemini-image-service';
import { generateArtistBiography, type ArtistInfo } from '../services/gemini-profile-service';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia'
});

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
    
    console.log('🎨 Generating profile image with Gemini (with FAL AI fallback)...');
    
    let result;
    
    // Si hay imagen de referencia, usar generación con preservación facial
    if (referenceImage) {
      console.log('👤 Using reference image for facial consistency...');
      const referenceImages = [referenceImage];
      result = await generateImageWithMultipleFaceReferences(basePrompt, referenceImages);
      
      // Si Gemini falla por cuota, intentar con FAL AI
      if (!result.success && (result as any).quotaError) {
        console.log('⚠️ Gemini quota exceeded, trying FAL AI fallback...');
        result = await generateImageWithFAL(basePrompt, referenceImages);
      }
    } else {
      // Sin referencia, usar generación normal
      result = await generateCinematicImage(basePrompt);
      
      // Si Gemini falla por cuota, intentar con FAL AI
      if (!result.success && (result as any).quotaError) {
        console.log('⚠️ Gemini quota exceeded, trying FAL AI fallback...');
        result = await generateImageWithFAL(basePrompt, []);
      }
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
    
    console.log('🎨 Generating banner image with Gemini (with FAL AI fallback)...');
    
    let result;
    
    // Si hay imagen de referencia, usar generación con preservación facial
    if (referenceImage) {
      console.log('👤 Using reference image for facial consistency in banner...');
      const referenceImages = [referenceImage];
      result = await generateImageWithMultipleFaceReferences(basePrompt, referenceImages);
      
      // Si Gemini falla por cuota, intentar con FAL AI
      if (!result.success && (result as any).quotaError) {
        console.log('⚠️ Gemini quota exceeded, trying FAL AI fallback...');
        result = await generateImageWithFAL(basePrompt, referenceImages);
      }
    } else {
      // Sin referencia, usar generación normal
      result = await generateCinematicImage(basePrompt);
      
      // Si Gemini falla por cuota, intentar con FAL AI
      if (!result.success && (result as any).quotaError) {
        console.log('⚠️ Gemini quota exceeded, trying FAL AI fallback...');
        result = await generateImageWithFAL(basePrompt, []);
      }
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

/**
 * Genera imagen de producto de merchandise con Gemini
 */
router.post('/generate-product-image', async (req: Request, res: Response) => {
  try {
    const { productType, artistName, brandImage } = req.body;
    
    if (!productType) {
      return res.status(400).json({
        success: false,
        error: 'Product type is required'
      });
    }
    
    // Crear prompts específicos para productos de colaboración artista x Boostify
    const productPrompts: Record<string, string> = {
      'T-Shirt': `Premium collaboration merchandise: black cotton t-shirt with "${artistName} x Boostify" co-branded design, large artist name on front in bold typography, small orange Boostify logo on chest, modern streetwear aesthetic combining artist's style with orange and black color scheme, front view centered on pure white background, professional e-commerce photography, sharp focus, 4K quality`,
      
      'Hoodie': `High-end collaboration streetwear: oversized hoodie featuring "${artistName} x Boostify" branding, artist name prominently displayed on chest, Boostify logo on sleeve in vibrant orange, dark charcoal or black base color with orange accent details, hood up, kangaroo pocket visible, front facing view, isolated white background, studio lighting, commercial product shot, urban fashion collaboration aesthetic`,
      
      'Cap': `Professional headwear collaboration: premium snapback cap with "${artistName} x Boostify" embroidered on front panel, artist name as main focus with small Boostify logo integrated, black cap with vibrant orange bill and accents, 3/4 angle view showing curved brim and depth, white background, product photography lighting, ultra sharp details, limited edition collaboration piece`,
      
      'Poster': `Music collaboration poster design: framed concert poster featuring "${artistName} x Boostify" at top, bold modern typography combining artist's name with Boostify branding elements, vibrant orange and black color palette, dynamic graphic design with music industry aesthetic, artist's silhouette or abstract representation, 24x36 inches in black gallery frame on white wall, soft ambient lighting, centered composition, professional interior photography`,
      
      'Sticker Pack': `Collaboration merchandise flat lay: set of 10 premium vinyl stickers featuring "${artistName} x Boostify" designs, mix of artist name stickers and Boostify logo variations, vibrant orange, black and white color scheme, arranged in attractive grid pattern, matte finish quality, white background, overhead shot, crisp details, commercial photography, music lifestyle collaboration branding`,
      
      'Vinyl Record': `Limited edition collaboration vinyl: "${artistName} x Boostify" exclusive vinyl record with striking orange and black swirl pattern on disc, custom album artwork featuring both artist name and Boostify branding prominently, modern design combining artist's aesthetic with Boostify's orange/black identity, black sleeve with orange accents visible, record partially out of sleeve, white background, dramatic side lighting, audiophile quality presentation, collector's edition collaboration piece`
    };
    
    const prompt = productPrompts[productType] || 
      `Professional product photography: ${artistName} ${productType} merchandise, clean white background, e-commerce style, centered composition`;
    
    console.log(`🎨 Generating ${productType} product image...`);
    
    let result = await generateCinematicImage(prompt);
    
    // Si Gemini falla, intentar con FAL AI
    if (!result.success && (result as any).quotaError) {
      console.log('⚠️ Gemini quota exceeded, trying FAL AI fallback...');
      result = await generateImageWithFAL(prompt, []);
    }
    
    return res.json(result);
  } catch (error: any) {
    console.error('Error generating product image:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate product image'
    });
  }
});

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
    
    console.log(`💳 Creating Stripe checkout session for ${productName} (${size || 'default size'})...`);
    
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
      success_url: `${req.headers.origin}/artist/${artistName}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/artist/${artistName}?canceled=true`,
      metadata: {
        productId: productId || '',
        artistName: artistName || '',
        size: size || '',
      },
    });
    
    console.log(`✅ Checkout session created: ${session.id}`);
    
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

export default router;
