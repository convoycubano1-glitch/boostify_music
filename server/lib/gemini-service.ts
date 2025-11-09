import { GoogleGenAI, Modality } from "@google/genai";

// This is using Replit's AI Integrations service, which provides Gemini-compatible API access without requiring your own Gemini API key.
const ai = new GoogleGenAI({
  apiKey: process.env.AI_INTEGRATIONS_GEMINI_API_KEY || "",
  httpOptions: {
    apiVersion: "",
    baseUrl: process.env.AI_INTEGRATIONS_GEMINI_BASE_URL || "",
  },
});

export async function generateArtistBiography(artistName: string, genre: string, style?: string): Promise<string> {
  const prompt = `Generate a compelling, professional biography for a music artist named "${artistName}" in the ${genre} genre. ${style ? `Their style is: ${style}.` : ''} 
  
  The biography should be 2-3 paragraphs, engaging, and highlight their unique artistic vision. Write in third person and make it sound authentic and inspiring. Focus on their musical journey and artistic identity.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  
  return response.text || "";
}

export async function generateArtistImage(artistName: string, style: string, genre: string): Promise<string> {
  const prompt = `Create a professional, artistic portrait image for a music artist named ${artistName}. 
  Genre: ${genre}. 
  Style: ${style}.
  
  The image should be creative, eye-catching, and suitable for a music artist profile. Focus on a modern, professional aesthetic with vibrant colors and artistic flair. Make it visually stunning and memorable.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-image",
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    config: {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    },
  });

  const candidate = response.candidates?.[0];
  const imagePart = candidate?.content?.parts?.find((part: any) => part.inlineData);
  
  if (!imagePart?.inlineData?.data) {
    throw new Error("No image data in response");
  }

  const mimeType = imagePart.inlineData.mimeType || "image/png";
  return `data:${mimeType};base64,${imagePart.inlineData.data}`;
}

export async function generateSongDescription(songTitle: string, artistName: string, genre: string): Promise<string> {
  const prompt = `Write a captivating 1-2 sentence description for a song titled "${songTitle}" by ${artistName}, a ${genre} artist. Make it engaging and highlight what makes this track special.`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  
  return response.text || "";
}

export async function improveText(text: string, purpose: string): Promise<string> {
  const prompt = `Improve the following ${purpose} to make it more engaging, professional, and compelling. Keep the same tone but enhance the quality:\n\n${text}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
  });
  
  return response.text || "";
}
