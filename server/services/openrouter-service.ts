// Define the OpenRouterResponse interface locally to avoid import issues
interface OpenRouterResponse {
  id: string;
  choices: {
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }[];
  created: number;
  model: string;
  object: string;
  usage: {
    completion_tokens: number;
    prompt_tokens: number;
    total_tokens: number;
  };
}
import fetch from "node-fetch";

/**
 * Servicio para interactuar con la API de OpenRouter para generar respuestas contextuales
 * para los usuarios bot de la red social.
 */
export class OpenRouterService {
  private apiKey: string;
  private baseUrl: string;
  private defaultModel: string;
  private defaultParams: any;

  /**
   * Constructor del servicio OpenRouter
   */
  constructor() {
    this.apiKey = process.env.VITE_OPENROUTER_API_KEY || "";
    this.baseUrl = "https://openrouter.ai/api/v1/chat/completions";
    this.defaultModel = "anthropic/claude-3-haiku";
    this.defaultParams = {
      temperature: 0.7,
      max_tokens: 150,
      top_p: 0.8,
      frequency_penalty: 0.2,
      presence_penalty: 0.1,
    };

    if (!this.apiKey) {
      console.warn("⚠️ OpenRouter API key not found. AI responses won't work correctly.");
    }
  }

  /**
   * Genera una respuesta de IA utilizando el contexto proporcionado
   * @param prompt El mensaje o pregunta para generar la respuesta
   * @param context Contexto adicional (personalidad, intereses, etc.)
   * @param language Idioma preferido (es o en)
   * @returns La respuesta generada por la IA
   */
  async generateResponse(prompt: string, context?: string, language: string = "en"): Promise<string> {
    // Convert null to undefined to avoid type issues
    context = context === null ? undefined : context;
    try {
      if (!this.apiKey) {
        return this.getFallbackResponse(language);
      }

      // Preparar el contexto del sistema
      const systemPrompt = context || 
        `You are a helpful AI assistant who responds in ${language === "es" ? "Spanish" : "English"}.`;
      
      // Configurar los mensajes para la API
      const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ];

      // Realizar la solicitud a OpenRouter
      const response = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`,
          "HTTP-Referer": "https://boostifymusic.com",
          "X-Title": "Boostify Social Network"
        },
        body: JSON.stringify({
          model: this.defaultModel,
          messages,
          ...this.defaultParams
        })
      });

      // Verificar si la respuesta fue exitosa
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`OpenRouter API error (${response.status}): ${errorText}`);
        return this.getFallbackResponse(language);
      }

      // Parsear la respuesta
      const data = await response.json() as OpenRouterResponse;
      const aiResponse = data.choices[0].message.content.trim();
      
      return aiResponse || this.getFallbackResponse(language);
    } catch (error) {
      console.error("Error generating AI response:", error);
      return this.getFallbackResponse(language);
    }
  }

  /**
   * Devuelve una respuesta alternativa en caso de que OpenRouter falle
   */
  private getFallbackResponse(language: string = "en"): string {
    // Respuestas más naturales y variadas según el idioma
    const fallbackResponses = {
      es: [
        "Lo siento, no puedo responder ahora mismo. Intentémoslo más tarde.",
        "Parece que hay un problema técnico. ¿Podemos continuar esta conversación más tarde?",
        "Estoy procesando mucha información en este momento. Dame un momento para pensar.",
        "¡Qué interesante punto de vista! Me gustaría saber más sobre tu experiencia.",
        "Gracias por compartir. ¿Hay algo más en lo que pueda ayudarte?",
        "¡Es una perspectiva muy interesante! He estado pensando mucho en este tema últimamente.",
        "No estoy seguro de estar de acuerdo. En mi experiencia, hay otros factores a considerar.",
        "¡Gracias por compartir esto! He aprendido algo nuevo hoy.",
        "Esto me recuerda a un proyecto similar en el que trabajé recientemente. ¡Los resultados fueron sorprendentes!",
        "Me gustaría añadir que la colaboración es clave en estas situaciones. ¿Qué piensan los demás?",
        "¿Has considerado abordar esto desde un ángulo diferente? A veces eso ayuda.",
        "¡Estoy totalmente de acuerdo con tu punto sobre las técnicas de producción musical!",
        "¡Gran perspectiva! La industria musical está en constante evolución y adaptación.",
        "Ese es un enfoque creativo para resolver este desafío común en la producción musical.",
        "Tengo curiosidad por saber más sobre tus experiencias con esto."
      ],
      en: [
        "I'm sorry, I can't respond right now. Let's try again later.",
        "There seems to be a technical issue. Can we continue this conversation later?",
        "I'm processing a lot of information right now. Give me a moment to think.",
        "What an interesting point of view! I'd like to know more about your experience.",
        "Thanks for sharing. Is there anything else I can help you with?",
        "That's a really interesting perspective! I've been thinking about this topic a lot lately.",
        "I'm not sure I agree with that. In my experience, there are other factors to consider.",
        "Thanks for sharing this! I've learned something new today.",
        "This reminds me of a similar project I worked on recently. The results were surprising!",
        "I'd like to add that collaboration is key in these situations. What do others think?",
        "Have you considered approaching this from a different angle? Sometimes that helps.",
        "I totally agree with your point about music production techniques!",
        "Great insight! The music industry is constantly evolving and adapting.",
        "That's a creative approach to solving this common challenge in music production.",
        "I'm curious to hear more about your experiences with this."
      ]
    };

    // Seleccionar un idioma válido
    const validLanguage = language === "es" ? "es" : "en";
    
    // Devolver una respuesta aleatoria en el idioma seleccionado
    const responses = fallbackResponses[validLanguage];
    const randomIndex = Math.floor(Math.random() * responses.length);
    
    return responses[randomIndex];
  }
}

// Exportar una instancia única del servicio
export const openRouterService = new OpenRouterService();