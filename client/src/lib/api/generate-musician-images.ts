import { fal } from "@fal-ai/client";
import { saveMusicianImage } from "./musician-images-store";

// Configure fal client
fal.config({
  credentials: import.meta.env.VITE_FAL_API_KEY
});

const musicianImagePrompts = [
  // Guitarristas
  {
    prompt: "professional portrait photo of a male rock guitarist with long dark hair in a modern recording studio. Shot with professional lighting, high-end DSLR camera. Photorealistic, 4k quality, detailed facial features. Modern recording studio background with vintage guitars on the wall.",
    category: "Guitar"
  },
  {
    prompt: "portrait of a female guitarist with short blonde hair in a music studio. Professional headshot with soft lighting. Holding a vintage Fender guitar. Photorealistic, high quality, 4k. Warm studio ambiance.",
    category: "Guitar"
  },
  {
    prompt: "portrait of a male jazz guitarist in a sophisticated black suit. Warm stage lighting, professional photography. Concert hall background with a classic Gibson guitar. Photorealistic, high quality, 4k.",
    category: "Guitar"
  },
  // Bateristas
  {
    prompt: "professional portrait of a male drummer with visible tattoos in a recording studio. Dynamic studio lighting, dramatic pose behind a professional drum kit. Photorealistic, high quality, 4k.",
    category: "Drums"
  },
  {
    prompt: "portrait of an asian female drummer in a modern studio setting. Professional photography with dynamic lighting. Seated at a high-end Pearl drum kit. Photorealistic, high quality, 4k.",
    category: "Drums"
  },
  {
    prompt: "portrait of a jazz drummer in casual attire. Natural lighting, professional headshot. Vintage Gretsch drums in the background. Photorealistic, high quality, 4k.",
    category: "Drums"
  },
  // Pianistas
  {
    prompt: "portrait of a female classical pianist in an elegant dress, concert hall setting, professional lighting, grand piano, photorealistic, high quality, 4k",
    category: "Piano"
  },
  {
    prompt: "professional headshot of a male jazz pianist in formal attire, studio photography, moody lighting, photorealistic, high quality, 4k",
    category: "Piano"
  },
  {
    prompt: "portrait of a female contemporary pianist in modern attire, artistic lighting, professional photo, modern piano, photorealistic, high quality, 4k",
    category: "Piano"
  },
    // Vocalistas
  {
    prompt: "portrait of a female pop singer with long dark hair, studio lighting, professional headshot, microphone stand, photorealistic, high quality, 4k",
    category: "Vocals"
  },
  {
    prompt: "professional portrait of a male soul singer, dramatic lighting, emotional expression, recording booth background, photorealistic, high quality, 4k",
    category: "Vocals"
  },
  {
    prompt: "portrait of an asian female jazz singer in elegant attire, stage lighting, professional photo, vintage microphone, photorealistic, high quality, 4k",
    category: "Vocals"
  },
    // Productores
  {
    prompt: "portrait of a male music producer in a recording studio, professional lighting, mixing console background, photorealistic, high quality, 4k",
    category: "Producer"
  },
  {
    prompt: "professional headshot of a female EDM producer with modern style, studio photography, electronic music equipment, photorealistic, high quality, 4k",
    category: "Producer"
  },
  {
    prompt: "portrait of a male rock producer in a mixing room, dramatic lighting, professional photo, studio equipment background, photorealistic, high quality, 4k",
    category: "Producer"
  }
];

export async function generateMusicianImages() {
  const images = [];
  const negativePrompt = "deformed, unrealistic, cartoon, anime, illustration, low quality, blurry, distorted, bad anatomy, bad proportions, watermark";

  for (const { prompt, category } of musicianImagePrompts) {
    try {
      const result = await fal.subscribe("fal-ai/flux-pro", {
        input: {
          prompt,
          negative_prompt: negativePrompt,
          image_size: "landscape_16_9"
        },
        logs: true,
        onQueueUpdate: (update) => {
          if (update.status === "IN_PROGRESS") {
            update.logs.map((log) => log.message).forEach(console.log);
          }
        },
      });

      if (result.data && result.data.images && result.data.images[0]) {
        const imageUrl = result.data.images[0].url;
        images.push(imageUrl);

        // Save to Firestore
        await saveMusicianImage({
          url: imageUrl,
          requestId: result.requestId,
          prompt,
          category,
          createdAt: new Date()
        });

      } else {
        console.error("Invalid response format from Fal.ai:", result);
        images.push("/assets/musician-placeholder.jpg");
      }

      // Wait between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error("Error generating image:", error);
      images.push("/assets/musician-placeholder.jpg");
    }
  }

  return images;
}