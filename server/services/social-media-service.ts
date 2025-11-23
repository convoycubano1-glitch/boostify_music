/**
 * Social Media Content Generator Service
 * Genera contenido viral para Facebook, Instagram y TikTok usando Gemini
 */
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
});

export interface SocialMediaPost {
  platform: "facebook" | "instagram" | "tiktok";
  caption: string;
  hashtags: string[];
  cta: string;
  viralScore?: number;
}

export interface SocialMediaGeneratorResult {
  success: boolean;
  posts?: SocialMediaPost[];
  error?: string;
}

const VIRAL_THEMES = [
  "Nuevo sencillo dropping pronto 🎵",
  "Tour de conciertos próximamente 🎤",
  "Colaboración exclusiva revelada",
  "Meet & Greet especial para fans",
  "Escúchame en todas las plataformas",
  "Limited edition merch disponible",
  "Detrás de cámaras exclusivo",
  "Doblando géneros musicales",
  "Mi journey musical hasta aquí",
  "Composición de hit en progreso"
];

/**
 * Genera contenido viral para las 3 plataformas
 */
export async function generateSocialMediaContent(
  artistName: string,
  biography: string,
  profileUrl: string
): Promise<SocialMediaGeneratorResult> {
  try {
    const randomTheme = VIRAL_THEMES[Math.floor(Math.random() * VIRAL_THEMES.length)];

    const prompt = `Eres un experto en marketing musical y contenido viral. Basándote en la siguiente información del artista, genera contenido viral optimizado para 3 plataformas diferentes.

ARTISTA: ${artistName}
BIOGRAFÍA: ${biography}
URL PERFIL: ${profileUrl}
TEMA: ${randomTheme}

Genera EXACTAMENTE 3 posts (uno para cada plataforma). Para CADA post responde con este formato JSON exacto (sin markdown):

Para INSTAGRAM (1080x1350):
{
  "platform": "instagram",
  "caption": "[100-300 caracteres, emojis estratégicos, inspiracional/artístico]",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "cta": "Ver perfil de ${artistName}"
}

Para FACEBOOK (1200x628):
{
  "platform": "facebook",
  "caption": "[200-500 caracteres, personal, comunitario, invita conversación]",
  "hashtags": ["tag1", "tag2"],
  "cta": "Visita mi perfil: ${profileUrl}"
}

Para TIKTOK (1080x1920):
{
  "platform": "tiktok",
  "caption": "[80-150 caracteres, energético, trend-friendly, hook viral]",
  "hashtags": ["tag1", "tag2", "tag3"],
  "cta": "Link en bio: ${profileUrl}"
}

REQUISITOS:
- Cada post DEBE ser diferente en tono y mensaje
- Incluir emojis relevantes (Instagram/TikTok especialmente)
- Los hashtags deben ser específicos del artista y virales
- El CTA debe incluir el URL del perfil
- Lenguaje en español
- Posts motivadores y profesionales

Genera los 3 posts ahora en formato JSON válido:`;

    console.log('🎬 Generating social media content with Gemini...');

    const response = await Promise.race([
      ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      }),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 30 seconds')), 30000)
      )
    ]);

    const responseText = response.text?.trim() || "";
    
    if (!responseText) {
      throw new Error('No content generated');
    }

    // Parsear respuesta JSON
    const jsonMatches = responseText.match(/\{[\s\S]*?\}/g) || [];
    
    if (jsonMatches.length < 3) {
      throw new Error(`Expected 3 posts, got ${jsonMatches.length}`);
    }

    const posts: SocialMediaPost[] = [];
    for (let i = 0; i < 3; i++) {
      try {
        const post = JSON.parse(jsonMatches[i]);
        posts.push({
          platform: post.platform,
          caption: post.caption,
          hashtags: post.hashtags || [],
          cta: post.cta,
          viralScore: Math.floor(Math.random() * 40) + 70 // 70-110 score
        });
      } catch (e) {
        console.error(`Failed to parse post ${i}:`, e);
      }
    }

    if (posts.length === 0) {
      throw new Error('Failed to parse any posts');
    }

    console.log('✅ Social media content generated:', posts.length, 'posts');

    return {
      success: true,
      posts
    };

  } catch (error: any) {
    console.error('❌ Error generating social media content:', error.message);
    return {
      success: false,
      error: error.message || 'Failed to generate social media content'
    };
  }
}
