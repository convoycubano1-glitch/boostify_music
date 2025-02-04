import { generateCoverArt } from "./fal-ai";

const musicianImagePrompts = [
  // Guitarristas
  "professional portrait photo of a male rock guitarist with long dark hair, professional lighting, studio photography",
  "portrait of a female guitarist with short blonde hair in a music studio, professional headshot",
  "portrait of a male jazz guitarist in a sophisticated suit, warm lighting, professional photography",
  
  // Bateristas
  "professional portrait of a male drummer with tattoos, studio lighting, dramatic pose",
  "portrait of an asian female drummer in a modern studio setting, professional photography",
  "portrait photo of a jazz drummer in casual attire, natural lighting, professional headshot",
  
  // Pianistas
  "portrait of a female classical pianist in an elegant dress, concert hall setting, professional lighting",
  "professional headshot of a male jazz pianist in formal attire, studio photography",
  "portrait of a female contemporary pianist in modern attire, artistic lighting, professional photo",
  
  // Vocalistas
  "portrait of a female pop singer with long dark hair, studio lighting, professional headshot",
  "professional portrait of a male soul singer, dramatic lighting, emotional expression",
  "portrait of an asian female jazz singer in elegant attire, stage lighting, professional photo",
  
  // Productores
  "portrait of a male music producer in a recording studio, professional lighting",
  "professional headshot of a female EDM producer with modern style, studio photography",
  "portrait of a male rock producer in a mixing room, dramatic lighting, professional photo"
];

export async function generateMusicianImages() {
  const images = [];
  
  for (const prompt of musicianImagePrompts) {
    try {
      const result = await generateCoverArt({
        prompt: prompt,
        negativePrompt: "deformed, unrealistic, cartoon, anime, illustration, low quality",
        style: "professional-photography"
      });
      
      images.push(result.url);
      
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
