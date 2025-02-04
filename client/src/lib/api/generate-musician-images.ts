import { generateCoverArt } from "./fal-ai";

const musicianImagePrompts = [
  // Guitarristas
  "professional portrait photo of a male rock guitarist with long dark hair, professional lighting, studio photography, photorealistic, high quality, 4k, detailed facial features, modern recording studio background",
  "portrait of a female guitarist with short blonde hair in a music studio, professional headshot, soft lighting, vintage guitar, photorealistic, high quality, 4k",
  "portrait of a male jazz guitarist in a sophisticated suit, warm lighting, professional photography, concert hall background, photorealistic, high quality, 4k",

  // Bateristas
  "professional portrait of a male drummer with tattoos, studio lighting, dramatic pose, drum kit in background, photorealistic, high quality, 4k",
  "portrait of an asian female drummer in a modern studio setting, professional photography, dynamic pose, photorealistic, high quality, 4k",
  "portrait photo of a jazz drummer in casual attire, natural lighting, professional headshot, vintage drums, photorealistic, high quality, 4k",

  // Pianistas
  "portrait of a female classical pianist in an elegant dress, concert hall setting, professional lighting, grand piano, photorealistic, high quality, 4k",
  "professional headshot of a male jazz pianist in formal attire, studio photography, moody lighting, photorealistic, high quality, 4k",
  "portrait of a female contemporary pianist in modern attire, artistic lighting, professional photo, modern piano, photorealistic, high quality, 4k",

  // Vocalistas
  "portrait of a female pop singer with long dark hair, studio lighting, professional headshot, microphone stand, photorealistic, high quality, 4k",
  "professional portrait of a male soul singer, dramatic lighting, emotional expression, recording booth background, photorealistic, high quality, 4k",
  "portrait of an asian female jazz singer in elegant attire, stage lighting, professional photo, vintage microphone, photorealistic, high quality, 4k",

  // Productores
  "portrait of a male music producer in a recording studio, professional lighting, mixing console background, photorealistic, high quality, 4k",
  "professional headshot of a female EDM producer with modern style, studio photography, electronic music equipment, photorealistic, high quality, 4k",
  "portrait of a male rock producer in a mixing room, dramatic lighting, professional photo, studio equipment background, photorealistic, high quality, 4k"
];

export async function generateMusicianImages() {
  const images = [];
  const negativePrompt = "deformed, unrealistic, cartoon, anime, illustration, low quality, blurry, distorted, bad anatomy, bad proportions, watermark";

  for (const prompt of musicianImagePrompts) {
    try {
      const result = await generateCoverArt({
        prompt: prompt,
        negativePrompt: negativePrompt,
        style: "professional-photography"
      });

      if (result && result.images && result.images[0]) {
        images.push(result.images[0].url);
      } else {
        console.error("Invalid response format from Fal.ai:", result);
        // Use a placeholder in case of error
        images.push("/assets/musician-placeholder.jpg");
      }

      // Wait a bit between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error("Error generating image:", error);
      // Use a placeholder in case of error
      images.push("/assets/musician-placeholder.jpg");
    }
  }

  return images;
}