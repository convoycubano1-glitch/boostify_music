import { generateImageWithFal } from "./fal-ai";
import { saveMusicianImage } from "./musician-images-store";

const musicianImagePrompts = [
  // Guitarristas
  {
    prompt: "professional portrait of a male rock guitarist with long dark hair in a modern recording studio, dramatic lighting, holding an electric guitar, high-end DSLR camera shot, photorealistic, 4k quality, detailed facial features",
    category: "Guitar"
  },
  {
    prompt: "portrait of a female guitarist with short blonde hair in a music studio, soft lighting, holding a vintage acoustic guitar, professional headshot, photorealistic, high quality, 4k",
    category: "Guitar"
  },
  {
    prompt: "portrait of a male jazz guitarist in a sophisticated black suit performing on stage, warm stage lighting, professional photography with a classic Gibson guitar, photorealistic, high quality, 4k",
    category: "Guitar"
  },
  // Bateristas
  {
    prompt: "professional portrait of a male drummer with visible tattoos in a recording studio, dynamic studio lighting, seated at a professional drum kit, photorealistic, high quality, 4k",
    category: "Drums"
  },
  {
    prompt: "portrait of an asian female drummer in a modern studio setting with a Pearl drum kit, professional photography with dynamic lighting, photorealistic, high quality, 4k",
    category: "Drums"
  },
  {
    prompt: "portrait of a jazz drummer in casual attire at a vintage Gretsch drum kit, natural lighting, professional headshot, photorealistic, high quality, 4k",
    category: "Drums"
  },
  // Pianistas
  {
    prompt: "portrait of a female classical pianist in an elegant black dress at a grand piano in a concert hall, professional lighting, photorealistic, high quality, 4k",
    category: "Piano"
  },
  {
    prompt: "professional headshot of a male jazz pianist in formal attire at a Steinway piano, moody studio lighting, photorealistic, high quality, 4k",
    category: "Piano"
  },
  {
    prompt: "portrait of a female contemporary pianist in modern attire at a modern digital piano, artistic lighting, professional photo, photorealistic, high quality, 4k",
    category: "Piano"
  },
  // Vocalistas
  {
    prompt: "portrait of a female pop singer with long dark hair in a recording booth, professional studio lighting, emotional expression, holding a microphone, photorealistic, high quality, 4k",
    category: "Vocals"
  },
  {
    prompt: "professional portrait of a male soul singer performing on stage, dramatic spotlight, passionate expression, vintage microphone, photorealistic, high quality, 4k",
    category: "Vocals"
  },
  {
    prompt: "portrait of an asian female jazz singer in elegant evening dress on stage, warm stage lighting, professional photo with vintage microphone, photorealistic, high quality, 4k",
    category: "Vocals"
  },
  // Productores
  {
    prompt: "portrait of a male music producer in a modern recording studio with mixing console, professional lighting, multiple screens and equipment in background, photorealistic, high quality, 4k",
    category: "Production"
  },
  {
    prompt: "professional headshot of a female EDM producer with modern style in a studio, surrounded by electronic music equipment and synthesizers, photorealistic, high quality, 4k",
    category: "Production"
  },
  {
    prompt: "portrait of a male rock producer in a mixing room, dramatic lighting, professional photo with analog equipment and vintage gear in background, photorealistic, high quality, 4k",
    category: "Production"
  }
];

export async function generateMusicianImages() {
  const images = [];
  const negativePrompt = "deformed, unrealistic, cartoon, anime, illustration, low quality, blurry, distorted, bad anatomy, bad proportions, watermark";

  for (const { prompt, category } of musicianImagePrompts) {
    try {
      console.log(`Generating image for ${category} with prompt: ${prompt.substring(0, 50)}...`);

      const result = await generateImageWithFal({
        prompt,
        negativePrompt,
        imageSize: "landscape_16_9"
      });

      if (result.data && result.data.images && result.data.images[0]) {
        const imageUrl = result.data.images[0].url;
        console.log(`Successfully generated image for ${category}: ${imageUrl}`);
        images.push(imageUrl);

        // Save to Firestore
        await saveMusicianImage({
          url: imageUrl,
          requestId: result.requestId,
          prompt,
          category,
          createdAt: new Date()
        });
        console.log(`Saved ${category} image to Firestore`);

      } else {
        console.error(`Invalid response format from Fal.ai for ${category}:`, result);
        images.push("/assets/musician-placeholder.jpg");
      }

      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Error generating image for ${category}:`, error);
      images.push("/assets/musician-placeholder.jpg");
    }
  }

  return images;
}

// Test function to verify single image generation
export async function testMusicianImageGeneration() {
  try {
    const testPrompt = musicianImagePrompts[0];
    const result = await generateImageWithFal({
      prompt: testPrompt.prompt,
      negativePrompt: "deformed, unrealistic, cartoon, anime, illustration, low quality, blurry",
      imageSize: "landscape_16_9"
    });

    console.log("Test successful, result:", result);
    return result;
  } catch (error) {
    console.error("Test musician image generation failed:", error);
    throw error;
  }
}