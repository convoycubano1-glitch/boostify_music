import axios from "axios";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Servicio para interactuar con OpenRouter API
 */
export class OpenRouterService {
  /**
   * Genera una respuesta usando OpenRouter API
   * @param prompt El prompt para generar la respuesta
   * @param context Contexto adicional para mejorar la calidad de la respuesta
   * @returns Respuesta generada por el modelo
   */
  async generateResponse(prompt: string, context?: string): Promise<string> {
    try {
      const userPrompt = context 
        ? `${context}\n\n${prompt}`
        : prompt;

      const response = await axios.post(
        API_URL,
        {
          model: "anthropic/claude-3-opus:beta", // Modelo de alta calidad para respuestas más naturales
          messages: [{ role: "user", content: userPrompt }],
          max_tokens: 1000,
          temperature: 0.7 // Balanceado entre creatividad y coherencia
        },
        {
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
            "HTTP-Referer": "https://boostify.music.education",
            "X-Title": "Boostify Music Education"
          }
        }
      );

      if (response.data?.choices?.[0]?.message?.content) {
        return response.data.choices[0].message.content.trim();
      } else {
        throw new Error("No se pudo generar una respuesta válida");
      }
    } catch (error) {
      console.error("Error al generar respuesta con OpenRouter:", error);
      throw new Error("Error al generar respuesta");
    }
  }

  /**
   * Genera un comentario contextualizado como respuesta a una publicación
   * @param postContent Contenido de la publicación
   * @param userData Datos del usuario que generará la respuesta
   * @returns Comentario generado
   */
  async generateContextualResponse(
    postContent: string, 
    userData: { displayName: string; personality: string; interests: string[]; language: string }
  ): Promise<string> {
    const contextPrompt = `Actúa como ${userData.displayName}, respondiendo a esta publicación: "${postContent}".
Tu personalidad es ${userData.personality}.
Tus intereses son ${userData.interests.join(', ')}.
Responde en ${userData.language === 'es' ? 'español' : 'inglés'}.
Mantén la respuesta breve y natural (máximo 150 caracteres).`;

    return this.generateResponse(contextPrompt);
  }
}

// Singleton para usar en toda la aplicación
export const openRouterService = new OpenRouterService();