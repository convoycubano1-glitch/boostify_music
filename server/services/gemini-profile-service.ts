/**
 * Servicio de Gemini para generación de contenido de perfil de artistas
 * Genera biografías profesionales basadas en información del artista
 */
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export interface ArtistInfo {
  name?: string;
  genre?: string;
  location?: string;
  experience?: string;
  achievements?: string;
  influences?: string;
}

export interface BiographyResult {
  success: boolean;
  biography?: string;
  error?: string;
}

export interface GenresResult {
  success: boolean;
  genres?: string[];
  error?: string;
}

/**
 * Genera una biografía profesional de artista usando Gemini
 */
export async function generateArtistBiography(artistInfo: ArtistInfo): Promise<BiographyResult> {
  try {
    const { name, genre, location, experience, achievements, influences } = artistInfo;

    // Construir prompt personalizado
    const prompt = `You are a professional music biographer. Write a compelling, professional artist biography in Spanish (150-200 words) based on the following information:

Artist Name: ${name || 'Unknown Artist'}
Genre: ${genre || 'Various genres'}
Location: ${location || 'Location not specified'}
${experience ? `Experience: ${experience}` : ''}
${achievements ? `Achievements: ${achievements}` : ''}
${influences ? `Influences: ${influences}` : ''}

Guidelines:
- Write in third person
- Make it engaging and professional
- Highlight unique aspects of the artist
- Keep it concise but impactful
- Use a tone that reflects the genre
- Write entirely in Spanish
- DO NOT include title or heading, just the biography text

Generate the biography now:`;

    console.log('🎵 Generating artist biography with Gemini...');
    console.log('📝 Artist info:', JSON.stringify(artistInfo));

    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      )
    ]);

    const biography = response.text?.trim() || "";
    
    if (!biography) {
      throw new Error('No biography text generated');
    }

    console.log('✅ Biography generated successfully:', biography.substring(0, 100) + '...');

    return {
      success: true,
      biography
    };

  } catch (error: any) {
    console.error('❌ Error generating biography:', error.message);
    console.error('Stack:', error.stack);
    return {
      success: false,
      error: error.message || 'Failed to generate biography'
    };
  }
}
