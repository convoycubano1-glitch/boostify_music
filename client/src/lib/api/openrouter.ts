import { env } from "@/env";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface VideoPromptParams {
  shotType: string;
  cameraFormat: string;
  mood: string;
  visualStyle: string;
  visualIntensity: number;
  narrativeIntensity: number;
  colorPalette: string;
  duration: number;
  directorStyle?: string;
  specialty?: string;
  styleReference?: string;
}

const promptCache = new Map<string, string>();

const generateVideoPrompt = ({
  shotType,
  cameraFormat,
  mood,
  visualStyle,
  visualIntensity,
  narrativeIntensity,
  colorPalette,
  duration,
  directorStyle,
  specialty,
  styleReference
}: VideoPromptParams): string => {
  const cacheKey = JSON.stringify({ shotType, cameraFormat, mood, visualStyle });
  if (promptCache.has(cacheKey)) {
    return promptCache.get(cacheKey)!;
  }

  // Simplified and more specific prompt format
  let prompt = `Generate a detailed cinematic prompt for a ${duration} second shot:

Key Requirements:
1. Shot Type: ${shotType}
2. Camera Format: ${cameraFormat}
3. Mood: ${mood}
4. Visual Style: ${visualStyle} at ${visualIntensity}% intensity
5. Color Scheme: ${colorPalette}
6. Narrative Focus: ${narrativeIntensity}%

Technical Requirements:
- Professional cinematic lighting
- High production value
- Clear composition guidelines`;

  if (directorStyle) {
    prompt += `\n\nDirector's Style: ${directorStyle}`;
  }

  if (specialty) {
    prompt += `\n\nSpecialty Focus: ${specialty}`;
  }

  if (styleReference) {
    prompt += `\n\nVisual Reference: ${styleReference}`;
  }

  prompt += "\n\nProvide a detailed and specific description for generating this shot.";

  promptCache.set(cacheKey, prompt);
  return prompt;
};

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const backoff = async (retryCount: number) => {
  const baseDelay = 3000;
  const maxDelay = 60000;
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  console.log(`Waiting ${delay/1000} seconds before retry ${retryCount + 1}`);
  await wait(delay);
};

export async function generateVideoPromptWithRetry(params: VideoPromptParams): Promise<string> {
  const maxRetries = 5;
  let retryCount = 0;

  // Verificar si la API key está presente antes de realizar cualquier solicitud
  const apiKey = env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OpenRouter API key is missing or undefined. Using fallback prompt generation.");
    return generateVideoPrompt(params); // Usar generación local como fallback
  }

  // Registrar la disponibilidad de la API key (sin mostrar el valor)
  console.log("OpenRouter API key availability check:", !!apiKey);

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1}/${maxRetries} to generate video prompt`);

      const promptText = generateVideoPrompt(params);
      console.log("Generated prompt text:", promptText);

      // Preparar headers con el formato exacto requerido por OpenRouter
      const headers = {
        "Authorization": `Bearer ${apiKey.trim()}`, // Asegurarse de que no haya espacios
        "HTTP-Referer": window.location.origin || "https://boostify.music.app",
        "X-Title": "Music Video Creator",
        "Content-Type": "application/json"
      };

      // Log para debugging (sin exponer la clave completa)
      console.log("OpenRouter request headers:", {
        Authorization: `Bearer ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`,
        "HTTP-Referer": headers["HTTP-Referer"],
        "X-Title": headers["X-Title"]
      });

      // Verificar que la clave de autorización no esté vacía
      if (!headers.Authorization || headers.Authorization === "Bearer " || headers.Authorization === "Bearer undefined") {
        throw new Error("Authorization header is invalid: API key is missing");
      }

      // Realizar la solicitud a la API
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "mistralai/mixtral-8x7b-instruct",
          messages: [
            {
              role: "system",
              content: "You are a professional cinematographer. Generate clear and specific prompts for video scenes. Focus on visual elements and practical details. Respond only with the scene description, no additional text."
            },
            {
              role: "user",
              content: promptText
            }
          ],
          temperature: 0.3,
          max_tokens: 300,
          top_p: 0.9
        })
      });

      // Manejar la respuesta
      const contentType = response.headers.get('content-type') || '';
      let data;
      let responseText;

      // Check for non-JSON responses first
      if (!contentType.includes('application/json')) {
        try {
          responseText = await response.text();
          console.log("Non-JSON response received:", responseText.substring(0, 100) + "...");
          
          // Try to detect if the response is actually JSON despite the header
          if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
            try {
              data = JSON.parse(responseText);
              console.log("Successfully parsed response as JSON despite incorrect content-type");
            } catch (parseError) {
              console.error("Failed to parse as JSON even though it looked like JSON:", parseError);
              // Proceed with text handling flow
            }
          }
          
          // If we couldn't parse as JSON or it's not JSON-like, use the text directly
          if (!data) {
            // For non-JSON responses that are successful, we'll use the text as the content
            if (response.ok) {
              console.log("Using non-JSON text response as content");
              // Create a mimicked JSON structure that matches what we expect
              data = {
                choices: [{
                  message: {
                    content: responseText
                  }
                }]
              };
            }
          }
        } catch (textError) {
          console.error("Error reading response as text:", textError);
          throw new Error(`Unable to read API response: ${(textError as Error).message}`);
        }
      } else {
        // Standard JSON handling
        try {
          data = await response.json();
        } catch (jsonError) {
          console.error("Error parsing API response as JSON:", jsonError);
          
          // Try to get the response as text as a fallback
          try {
            responseText = await response.text();
            console.log("Response couldn't be parsed as JSON. Raw text:", 
                      responseText.substring(0, 100) + "...");
            
            // If the response is actually text we can use, create a mock JSON structure
            if (response.ok && responseText) {
              data = {
                choices: [{
                  message: {
                    content: responseText
                  }
                }]
              };
            } else {
              throw new Error(`Unable to parse API response as JSON: ${(jsonError as Error).message}`);
            }
          } catch (textError) {
            console.error("Error reading response as text after JSON parse failed:", textError);
            throw new Error(`Unable to read API response: ${(textError as Error).message}`);
          }
        }
      }
      
      console.log("API Response:", data);

      if (!response.ok) {
        const errorMessage = data?.error?.message || response.statusText;
        console.error("API Error:", errorMessage);

        if (response.status === 401 || response.status === 403) {
          console.error("Authentication error with OpenRouter API. Check your API key.");
          
          // Después de un error de autenticación, usar el prompt generado localmente
          console.log("Using locally generated prompt instead");
          return `${promptText} (Note: This is a fallback prompt - AI enhancement unavailable)`;
        }
        
        if (response.status === 429) {
          console.log("Rate limit hit, implementing backoff...");
          await backoff(retryCount);
          retryCount++;
          continue;
        }

        throw new Error(`API error: ${response.status} ${errorMessage}`);
      }

      // Validate the response structure
      if (!data || !data.choices) {
        console.error("Invalid response structure (missing choices array):", data);
        
        // If we have text content but not in the expected format, try to use it directly
        if (responseText) {
          console.log("Using raw text response as fallback");
          return responseText;
        }
        
        throw new Error("Invalid API response format: missing choices array");
      }
      
      if (!data.choices[0]?.message?.content) {
        console.error("Invalid response structure (missing message content):", data);
        
        // Try to extract content from alternative response structures
        const alternativeContent = 
          data.choices[0]?.text || // Some APIs use 'text' instead of 'message.content'
          data.choices[0]?.content || // Some use direct 'content'
          (typeof data.choices[0] === 'string' ? data.choices[0] : null); // Some return the string directly
          
        if (alternativeContent) {
          console.log("Using alternative content structure");
          return alternativeContent;
        }
        
        throw new Error("Invalid API response format: missing message content");
      }

      const generatedPrompt = data.choices[0].message.content.trim();
      if (!generatedPrompt) {
        throw new Error("Empty prompt generated");
      }

      // Guardar en caché para futuros usos
      promptCache.set(JSON.stringify(params), generatedPrompt);
      return generatedPrompt;

    } catch (error) {
      console.error(`Error in attempt ${retryCount + 1}:`, error);

      if (retryCount === maxRetries - 1) {
        // En el último intento, intentar usar el cache o el prompt base
        const cacheKey = JSON.stringify(params);
        const cachedPrompt = promptCache.get(cacheKey);
        if (cachedPrompt) {
          console.log("Using cached prompt as fallback");
          return cachedPrompt;
        }

        // Generar un prompt base como último recurso
        const fallbackPrompt = generateVideoPrompt(params);
        console.log("Using fallback prompt generation:", fallbackPrompt.substring(0, 50) + "...");
        return fallbackPrompt;
      }

      await backoff(retryCount);
      retryCount++;
    }
  }

  throw new Error("Failed to generate prompt after all retries");
}

// Resto de las funciones se mantienen igual que en la versión anterior
export async function generateCourseContent(prompt: string) {
  try {
    console.log("Starting course content generation with OpenRouter (Gemini 2.0)...");

    if (!env.VITE_OPENROUTER_API_KEY) {
      console.error("OpenRouter API key is missing");
      throw new Error('OpenRouter API key not configured');
    }

    // Obtener la clave API para el curso
    const apiKey = env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is missing or undefined');
    }
    
    // Preparar los headers correctos para OpenRouter
    const headers = {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "HTTP-Referer": window.location.origin || "https://boostify.music.app",
      "X-Title": "Boostify Music Education",
      "Content-Type": "application/json"
    };
    
    // Log para debugging (sin exponer la clave completa)
    console.log("OpenRouter course generation headers:", {
      Authorization: `Bearer ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`,
      "HTTP-Referer": headers["HTTP-Referer"],
      "X-Title": headers["X-Title"]
    });
    
    // Usar el modelo Gemini 2.0 Flash según lo solicitado por el usuario
    console.log("Using Gemini 2.0 Flash model for course content generation");
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", // Modelo solicitado por el usuario
        messages: [
          {
            role: "system",
            content: `You are a JSON generator for music education courses. You MUST return a valid JSON object with this EXACT structure:
{
  "overview": "course overview text",
  "objectives": ["objective1", "objective2", "objective3"],
  "curriculum": [
    {
      "title": "lesson title",
      "description": "lesson description",
      "estimatedMinutes": 60
    }
  ],
  "topics": ["topic1", "topic2", "topic3"],
  "assignments": ["assignment1", "assignment2"],
  "applications": ["application1", "application2"]
}`
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    console.log("OpenRouter API response status:", response.status);

    // Manejo mejorado de respuestas de la API
    const contentType = response.headers.get('content-type') || '';
    let data;
    let responseText;

    if (!response.ok) {
      try {
        const errorData = await response.json().catch(async () => {
          // Si no podemos obtener JSON, intentamos obtener el texto
          const errorText = await response.text().catch(() => "Unknown error");
          return { error: { message: errorText } };
        });
        console.error("OpenRouter API error:", errorData);
        throw new Error(`Error generating course content: ${response.statusText}. Status: ${response.status}`);
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        throw new Error(`API error (${response.status}): Could not parse error response`);
      }
    }

    // Manejo de posibles respuestas no-JSON
    if (!contentType.includes('application/json')) {
      try {
        responseText = await response.text();
        console.log("Non-JSON response received:", responseText.substring(0, 100) + "...");
        
        // Comprobar si es realmente JSON a pesar del tipo de contenido incorrecto
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          try {
            data = JSON.parse(responseText);
            console.log("Successfully parsed response as JSON despite incorrect content-type");
          } catch (parseError) {
            console.error("Failed to parse as JSON even though it looked like JSON:", parseError);
            throw new Error("API returned invalid JSON response");
          }
        } else {
          throw new Error("API returned non-JSON response: " + responseText.substring(0, 100) + "...");
        }
      } catch (textError) {
        console.error("Error reading response:", textError);
        throw new Error(`Unable to read API response: ${(textError as Error).message}`);
      }
    } else {
      // Manejo estándar de JSON
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing API JSON response:", jsonError);
        throw new Error(`Unable to parse API response as JSON: ${(jsonError as Error).message}`);
      }
    }

    console.log("OpenRouter raw response:", data);

    // Validación de estructura de respuesta con manejo de errores mejorado
    if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0) {
      console.error("Invalid API response structure (missing/empty choices array):", data);
      throw new Error("Invalid API response format: missing choices array");
    }

    // Extracción del contenido con manejo de diferentes estructuras posibles
    let content;
    const firstChoice = data.choices[0];
    
    if (firstChoice.message?.content) {
      content = firstChoice.message.content;
    } else if (firstChoice.text) {
      content = firstChoice.text;
    } else if (firstChoice.content) {
      content = firstChoice.content;
    } else if (typeof firstChoice === 'string') {
      content = firstChoice;
    } else {
      console.error("Cannot extract content from API response:", firstChoice);
      throw new Error("Cannot extract content from API response");
    }

    console.log("Raw content received:", content);

    // Intento de parsear el JSON con manejo de errores robusto
    try {
      // Si el contenido no es un string, intentamos usarlo directamente (podría ser ya un objeto)
      const parsed = typeof content === 'string' ? JSON.parse(content) : content;

      // Strict validation of the structure
      if (typeof parsed.overview !== 'string') {
        throw new Error("'overview' field must be a string");
      }
      if (!Array.isArray(parsed.objectives) || parsed.objectives.length === 0) {
        throw new Error("'objectives' field must be a non-empty array");
      }
      if (!Array.isArray(parsed.curriculum) || parsed.curriculum.length === 0) {
        throw new Error("'curriculum' field must be a non-empty array");
      }
      if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
        throw new Error("'topics' field must be a non-empty array");
      }
      if (!Array.isArray(parsed.assignments) || parsed.assignments.length === 0) {
        throw new Error("'assignments' field must be a non-empty array");
      }
      if (!Array.isArray(parsed.applications) || parsed.applications.length === 0) {
        throw new Error("'applications' field must be a non-empty array");
      }

      // Validate each lesson in the curriculum
      for (const lesson of parsed.curriculum) {
        if (!lesson.title || !lesson.description || typeof lesson.estimatedMinutes !== 'number') {
          throw new Error("Each lesson must have title, description and estimatedMinutes");
        }
      }

      return parsed;
    } catch (parseError) {
      console.error("JSON parsing/validation error:", parseError);
      console.error("Content that failed validation:", content);
      throw new Error(`Validation error: ${(parseError as Error).message}`);
    }
  } catch (error) {
    console.error("Course generation error:", error);
    throw error;
  }
}

export async function chatWithAI(messages: Message[]) {
  try {
    // Obtener la clave API para chat
    const apiKey = env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is missing or undefined');
    }
    
    // Preparar los headers correctos para OpenRouter
    const headers = {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "HTTP-Referer": window.location.origin || "https://boostify.music.app",
      "X-Title": "Music Video Creator",
      "Content-Type": "application/json"
    };
    
    // Log para debugging (sin exponer la clave completa)
    console.log("OpenRouter chat headers:", {
      Authorization: `Bearer ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`,
      "HTTP-Referer": headers["HTTP-Referer"],
      "X-Title": headers["X-Title"]
    });
    
    // Usar el modelo Gemini 2.0 Flash según lo solicitado por el usuario
    console.log("Using Gemini 2.0 Flash model for chat completion");
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", // Modelo solicitado por el usuario
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    // Manejo mejorado de respuestas y errores
    const contentType = response.headers.get('content-type') || '';
    let data;
    let responseText;

    if (!response.ok) {
      try {
        const errorData = await response.json().catch(async () => {
          // Si no podemos obtener JSON, intentamos obtener el texto
          const errorText = await response.text().catch(() => "Unknown error");
          return { error: { message: errorText } };
        });
        console.error("OpenRouter API error:", errorData);
        throw new Error(`Error in AI chat: ${response.statusText}. Status: ${response.status}`);
      } catch (parseError) {
        console.error("Error parsing error response:", parseError);
        throw new Error(`API error (${response.status}): Could not parse error response`);
      }
    }

    // Manejo de posibles respuestas no-JSON
    if (!contentType.includes('application/json')) {
      try {
        responseText = await response.text();
        console.log("Non-JSON response received from chat API:", responseText.substring(0, 100) + "...");
        
        // Comprobar si es realmente JSON a pesar del tipo de contenido incorrecto
        if (responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
          try {
            data = JSON.parse(responseText);
            console.log("Successfully parsed chat response as JSON despite incorrect content-type");
          } catch (parseError) {
            console.error("Failed to parse chat response as JSON:", parseError);
            // Si no se puede analizar como JSON pero la respuesta se ve bien, usamos el texto como respuesta
            return responseText;
          }
        } else {
          // Si no es JSON pero la respuesta tiene contenido, la usamos directamente
          return responseText;
        }
      } catch (textError) {
        console.error("Error reading chat response:", textError);
        throw new Error(`Unable to read API response: ${(textError as Error).message}`);
      }
    } else {
      // Manejo estándar de JSON
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing chat JSON response:", jsonError);
        throw new Error(`Unable to parse API response as JSON: ${(jsonError as Error).message}`);
      }
    }

    // Extraer el contenido con manejo de diferentes estructuras posibles
    if (!data || !data.choices || data.choices.length === 0) {
      console.error("Invalid chat API response structure:", data);
      
      // Si tenemos texto de respuesta, usémoslo como último recurso
      if (responseText) {
        return responseText;
      }
      
      throw new Error("Invalid API response format: missing choices array");
    }

    const firstChoice = data.choices[0];
    
    if (firstChoice.message?.content) {
      return firstChoice.message.content;
    } else if (firstChoice.text) {
      return firstChoice.text;
    } else if (firstChoice.content) {
      return firstChoice.content;
    } else if (typeof firstChoice === 'string') {
      return firstChoice;
    }
    
    console.error("Unexpected chat response format:", firstChoice);
    throw new Error("Cannot extract content from API response");
  } catch (error) {
    console.error('Error in AI chat:', error);
    return `Lo siento, no puedo procesar tu solicitud en este momento debido a un error: ${error instanceof Error ? error.message : 'Error desconocido'}. Por favor, intenta nuevamente más tarde.`;
  }
}

/**
 * Genera un guion para un video musical utilizando IA avanzada
 * @param prompt - Texto que describe la canción y los requisitos del video
 * @returns Una cadena JSON con el guion del video musical
 * @throws Error si hay problemas con la API o el formato de respuesta
 */
export async function generateVideoScript(prompt: string): Promise<string> {
  if (!prompt || typeof prompt !== 'string') {
    throw new Error("El prompt debe ser una cadena de texto válida");
  }

  // Verificar si la API key está presente antes de realizar cualquier solicitud
  const apiKey = env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error("OpenRouter API key is missing or undefined. Using fallback script generation.");
    return generateFallbackVideoScript(prompt);
  }

  console.log("OpenRouter API key availability check:", !!apiKey);

  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log(`Intento ${retryCount + 1}/${maxRetries} para generar guion de video`);

      // Preparar headers con formato exacto para OpenRouter
      const headers = {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": window.location.origin || "https://boostify.music.app",
        "X-Title": "Music Video Creator",
        "Content-Type": "application/json"
      };

      // Log para debugging (sin exponer la clave completa)
      console.log("OpenRouter script headers:", {
        Authorization: `Bearer ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`,
        "HTTP-Referer": headers["HTTP-Referer"],
        "X-Title": headers["X-Title"]
      });

      // Verificar que la clave de autorización no esté vacía
      if (!headers.Authorization || headers.Authorization === "Bearer " || headers.Authorization === "Bearer undefined") {
        throw new Error("Authorization header is invalid: API key is missing");
      }

      // Usar el modelo Gemini 2.0 Flash según lo solicitado por el usuario
      console.log("Using Gemini 2.0 Flash model for video script generation");
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST", 
        headers,
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001", // Modelo solicitado por el usuario
          messages: [
            {
              role: "system",
              content: `Eres un director creativo de videos musicales experto en análisis musical y narrativa visual.
Tu tarea es crear un guion detallado para un video musical siguiendo estas reglas:

1. ANÁLISIS DE LETRA:
- Divide la letra en segmentos narrativos coherentes
- Identifica el tema principal y subtemas
- Analiza el significado y contexto de cada parte
- Extrae las emociones y el tono de cada segmento

2. ANÁLISIS MUSICAL:
- Identifica los instrumentos y elementos musicales
- Describe cómo la música refuerza el mensaje
- Señala cambios en ritmo, intensidad y momentos clave

3. CREACIÓN DE GUION:
- Cada segmento debe tener una conexión directa con una parte específica de la letra
- Las escenas deben visualizar el significado literal y metafórico de la letra
- Los prompts de imagen deben ser detallados y reflejar el contenido exacto
- Las transiciones deben seguir el flujo musical y narrativo

REQUISITOS:
- Máximo 10 segmentos para mantener coherencia
- Cada segmento debe corresponder a una parte específica de la letra
- Los prompts deben ser detallados y específicos para generar imágenes
- La descripción debe explicar la conexión entre la escena y la letra

FORMATO DE RESPUESTA (JSON):
{
  "segments": [
    {
      "id": número,
      "lyrics": "parte específica de la letra para este segmento",
      "musical_elements": "descripción detallada de instrumentos y elementos musicales en este momento",
      "description": "descripción detallada de la escena y cómo se conecta con la letra",
      "imagePrompt": "prompt detallado para generar una imagen que capture el significado de la letra",
      "shotType": "tipo específico de plano que mejor capture la escena",
      "mood": "estado de ánimo basado en la letra y música",
      "transition": "tipo de transición que conecte con el siguiente segmento"
    }
  ]
}`
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        })
      });

      // Manejar la respuesta
      let errorData;
      
      if (!response.ok) {
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: { message: "Failed to parse error response" } };
        }
        console.error("Script generation API Error:", errorData);

        if (response.status === 401 || response.status === 403) {
          console.error("Authentication error with OpenRouter API. Check your API key.");
          return generateFallbackVideoScript(prompt);
        }

        if (response.status === 429) {
          console.log("Rate limit hit, implementing backoff...");
          await backoff(retryCount);
          retryCount++;
          continue;
        }

        throw new Error(`Error generating script: ${response.statusText}`);
      }

      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error("Error parsing API response:", error as Error);
        throw new Error(`Unable to parse API response: ${(error as Error).message}`);
      }
      
      console.log("Script generation response:", data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid API response format");
      }

      const content = data.choices[0].message.content;

      try {
        const parsed = JSON.parse(content);
        if (!parsed.segments || !Array.isArray(parsed.segments)) {
          throw new Error("Invalid script format - missing segments array");
        }

        parsed.segments.forEach((segment: any, index: number) => {
          if (!segment.id || !segment.lyrics || !segment.musical_elements || 
              !segment.description || !segment.imagePrompt || !segment.shotType || 
              !segment.mood || !segment.transition) {
            throw new Error(`Invalid segment format at index ${index}`);
          }
        });

        return content;

      } catch (parseError) {
        console.error("JSON parsing/validation error:", parseError);
        throw new Error("Invalid script format");
      }

    } catch (error) {
      console.error(`Error in attempt ${retryCount + 1}:`, error);

      if (retryCount === maxRetries - 1) {
        if (error instanceof Error && error.message.includes("API key")) {
          return generateFallbackVideoScript(prompt);
        }
        throw error;
      }

      await backoff(retryCount);
      retryCount++;
    }
  }

  // Si todos los intentos fallan, usar la generación de respaldo
  console.warn("Failed all attempts to generate script - using fallback");
  return generateFallbackVideoScript(prompt);
}

/**
 * Genera un guion de video de fallback cuando la API no está disponible
 * @param prompt El prompt original con información de la canción
 * @returns Un JSON string con una estructura básica de guion
 */
function generateFallbackVideoScript(prompt: string): string {
  console.log("Generating fallback video script for:", prompt.substring(0, 100) + "...");
  
  // Extraer posibles líneas de letras del prompt
  const lines = prompt.split('\n');
  const lyricsLines = lines.filter(line => 
    line.length > 10 && 
    !line.includes("http") && 
    !line.includes("Requisitos:") &&
    !line.startsWith("Género:") &&
    !line.startsWith("Estilo:") &&
    !line.startsWith("Mood:") &&
    !line.startsWith("Tema:")
  );
  
  // Crear segmentos dividiendo las letras disponibles
  const totalSegments = Math.min(6, Math.ceil(lyricsLines.length / 2));
  const segments = [];
  
  for (let i = 0; i < totalSegments; i++) {
    const startIndex = Math.floor(i * lyricsLines.length / totalSegments);
    const endIndex = Math.floor((i + 1) * lyricsLines.length / totalSegments);
    const segmentLyrics = lyricsLines.slice(startIndex, endIndex).join(" ");
    
    segments.push({
      id: i + 1,
      lyrics: segmentLyrics || `Segmento ${i + 1} de la canción`,
      musical_elements: "Elementos instrumentales y ritmo base de la canción",
      description: `Escena visual representando el segmento ${i + 1} de la canción, capturando la esencia emocional de este momento.`,
      imagePrompt: `Escena cinematográfica para un video musical con iluminación dramática, enfoque en los detalles emocionales del momento representado por las letras: "${segmentLyrics || 'esta parte de la canción'}"`,
      shotType: ["close-up", "medium shot", "wide shot", "tracking shot", "overhead shot"][i % 5],
      mood: ["emotivo", "enérgico", "melancólico", "introspectivo", "celebratorio"][i % 5],
      transition: ["corte", "fundido", "barrido", "desvanecimiento", "zoom"][i % 5]
    });
  }
  
  return JSON.stringify({ segments });
}

export async function analyzeImage(imageUrl: string) {
  try {
    // Obtener la clave API para análisis de imagen
    const apiKey = env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is missing or undefined');
    }
    
    // Preparar los headers correctos para OpenRouter
    const headers = {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "HTTP-Referer": window.location.origin || "https://boostify.music.app",
      "X-Title": "Music Video Creator",
      "Content-Type": "application/json"
    };
    
    console.log("OpenRouter image analysis API key check:", !!apiKey);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
        messages: [
          {
            role: "system",
            content: "Analyze the provided image and extract its visual style characteristics."
          },
          {
            role: "user",
            content: `Analyze this reference image and describe its visual style, including color palette, mood, and composition: ${imageUrl}`
          }
        ],
        temperature: 0.3,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error("Failed to analyze image");
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "Failed to analyze image";
  } catch (error) {
    console.error("Image analysis error:", error);
    throw error;
  }
}

export async function transcribeWithAI(audioBase64: string) {
  try {
    // Obtener la clave API para transcripción
    const apiKey = env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is missing or undefined');
    }
    
    // Preparar los headers correctos para OpenRouter
    const headers = {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "HTTP-Referer": window.location.origin || "https://boostify.music.app",
      "X-Title": "Music Video Creator",
      "Content-Type": "application/json"
    };
    
    console.log("OpenRouter transcription API key check:", !!apiKey);
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
        messages: [{
          role: "user",
          content: `Please transcribe this audio content into text format. The audio is encoded in base64: ${audioBase64}`
        }],
        temperature: 0.2,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Error in transcription: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Transcription error:", error);
    throw error;
  }
}

/**
 * Genera un guion detallado para un video musical basado en la transcripción de la letra
 * 
 * @param lyrics La transcripción de la letra de la canción
 * @param audioAnalysis Análisis opcional de la pista de audio (beats, segmentos, etc)
 * @returns Promise con el guion en formato JSON estructurado
 */
export async function generateMusicVideoScript(lyrics: string, audioAnalysis?: any): Promise<string> {
  const maxRetries = 3;
  let retryCount = 0;
  
  // Verificar si la API key está presente
  const apiKey = env.VITE_OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error('OpenRouter API key is missing or undefined');
  }
  
  // Preparar headers
  const headers = {
    "Authorization": `Bearer ${apiKey.trim()}`,
    "HTTP-Referer": window.location.origin || "https://boostify.music.app",
    "X-Title": "Music Video Creator - Script Generation",
    "Content-Type": "application/json"
  };
  
  console.log("OpenRouter script generation API key check:", !!apiKey);
  
  // Construcción del prompt con terminología cinematográfica profesional
  const systemPrompt = `Eres un director de vídeos musicales de élite con 20 años de experiencia trabajando con los artistas más destacados de la industria musical. Tu especialidad es analizar letras y producir guiones técnicos profesionales que capturan perfectamente la esencia artística de cada canción, utilizando vocabulario cinematográfico profesional.

Tu tarea es crear un GUION TÉCNICO PROFESIONAL para un video musical basado en esta letra, siguiendo estos principios de producción y usando EXCLUSIVAMENTE terminología cinematográfica profesional:

## 1. ANÁLISIS MUSICAL PROFESIONAL (OBLIGATORIO):
   - Identifica con precisión el género musical específico basado en referencias líricas, temática y estructura
   - Determina la estructura musical exacta (intro-verso-precoro-coro-puente, etc.) con timecodes aproximados
   - Analiza el ritmo, BPM aproximado y cómo influye en el montaje y transiciones visuales
   - Identifica momentos clave para sincronización visual (crescendos, drops, breaks, climax líricos)
   - Detecta referencias a instrumentación específica que pueda visualizarse con efectos técnicos

## 2. ANÁLISIS NARRATIVO Y DIRECCIÓN CINEMATOGRÁFICA:
   - Extrae la premisa narrativa principal y posibles subtramas presentes en la letra
   - Define protagonistas, personajes secundarios y sus arcos dramáticos completos
   - Establece mise-en-scène específica (ambientación, atmósfera) sugerida por la letra
   - Identifica la progresión dramática completa (setup-confrontación-resolución) 
   - Determina motivos visuales recurrentes, metáforas visuales y subtextos simbólicos

## 3. DIRECCIÓN DE FOTOGRAFÍA Y DIRECCIÓN ARTÍSTICA:
   - Propón un tratamiento visual específico con referentes cinematográficos concretos (directores/DPs)
   - Desarrolla una paleta cromática técnica (temperatura de color en Kelvin, LUTs específicos) 
   - Especifica locaciones con descripciones técnicas de iluminación (key light, fill light, backlight)
   - Detalla el tratamiento de postproducción (grading específico, contraste, saturación) según género
   - Sugiere arte, atrezzo, vestuario y caracterización coherente con el concepto estético global

## 4. GUION TÉCNICO DETALLADO POR SECUENCIAS:
   - Divide la canción en secuencias con timecodes exactos (00:00 - 00:00)
   - Estructura cada secuencia en formato de guion técnico profesional con:
     * TIMECODE: [00:00 - 00:00] - PARTE DE LA CANCIÓN: [Intro/Verso/Coro/etc.]
     * LETRA: Transcripción exacta de la porción de letra
     * PLANO: Nomenclatura técnica exacta (PG/PA/PM/PP/PPP/PD) + angulación (picado/contrapicado/cenital)
     * MOVIMIENTO: Descripción técnica precisa (travelling lateral, dolly in, steadicam, drone, etc.)
     * DESCRIPCIÓN: Acción específica visible, blocking actoral, coreografía
     * TRANSICIÓN: Corte seco, fundido, encadenado, match cut, whip pan, etc.

Organiza el guion técnico como un documento profesional en formato estándar de la industria cinematográfica, claramente estructurado y con terminología precisa. NO uses lenguaje informal o descriptivo - utiliza EXCLUSIVAMENTE terminología técnica reconocida en la industria audiovisual profesional.
     * Transiciones profesionales con términos técnicos (J-cut, L-cut, dolly zoom, etc.)
     * Efectos visuales detallados con referencias técnicas específicas
     * Notas de sincronización precisas con la música (beats, drops, crescendos)

Tu análisis debe ser extremadamente detallado, usando terminología profesional de la industria cinematográfica y musical, como si fuera un guion real para producción.

FORMATO DE RESPUESTA (estrictamente en formato JSON):
{
  "análisis_musical": {
    "género": "género musical detectado",
    "estructura": "estructura de la canción (verso-coro-verso, etc.)",
    "elementos_destacados": ["sección de metales", "solo de guitarra", etc.]
  },
  "análisis_narrativo": {
    "tema_principal": "tema central de la canción",
    "arco_emocional": "progresión emocional detectada",
    "mensaje": "mensaje o significado principal"
  },
  "diseño_visual": {
    "estilo": "estilo visual general",
    "paleta_colores": "descripción de la paleta de colores",
    "cinematografía": "enfoque cinematográfico recomendado"
  },
  "segmentos": [
    {
      "id": 1,
      "tipo": "introducción/verso/coro/etc.",
      "tiempo_aproximado": "00:00-00:30",
      "letra": "fragmento exacto de la letra",
      "descripción_visual": "descripción detallada de la escena",
      "tipo_plano": "tipo de plano recomendado",
      "mood": "estado de ánimo de la escena",
      "transición": "tipo de transición a la siguiente escena",
      "elementos_técnicos": "efectos visuales, movimientos de cámara, etc.",
      "notas_musicales": "aspectos musicales importantes para esta escena"
    }
  ]
}`;

  while (retryCount < maxRetries) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "anthropic/claude-3-opus:beta",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Aquí está la letra de la canción para la que necesito crear un guion de video musical:\n\n${lyrics}${audioAnalysis ? `\n\nAnálisis de audio disponible:\n${JSON.stringify(audioAnalysis, null, 2)}` : ''}` }
          ],
          temperature: 0.7,
          max_tokens: 3000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Error desconocido" }));
        throw new Error(`Error en la API: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Formato de respuesta inválido");
      }

      // Verificar que la respuesta sea JSON válido
      const scriptContent = data.choices[0].message.content;
      console.log("Respuesta obtenida del modelo:", scriptContent.substring(0, 100) + "...");
      
      try {
        // Intentar analizar el JSON
        const parsed = JSON.parse(scriptContent);
        
        // Verificar estructura básica
        if (!parsed.segmentos && !parsed.segments && !parsed.análisis_musical && !parsed.análisis_narrativo) {
          console.warn("El guión no tiene la estructura esperada, usando fallback");
          return generarGuionFallback(lyrics);
        }
        
        // Formatear bien el resultado para mostrarlo
        return JSON.stringify(parsed, null, 2);
      } catch (parseError) {
        console.error("La respuesta no es un JSON válido:", parseError);
        
        // Intentar extraer JSON válido si está dentro de la respuesta (por ejemplo, en un bloque de código)
        const jsonRegex = /{[\s\S]*?("segmentos"|"segments"|"análisis_musical"|"análisis_narrativo")[\s\S]*?}/;
        const match = scriptContent.match(jsonRegex);
        
        if (match && match[0]) {
          try {
            // Intentar analizar el JSON extraído
            const extracted = JSON.parse(match[0]);
            console.log("JSON extraído con éxito del texto");
            return JSON.stringify(extracted, null, 2);
          } catch (extractError) {
            console.error("Error al extraer JSON:", extractError);
          }
        }
        
        // Si es un texto que comienza con agradecimiento o explicación, asumimos que necesita formato
        if (scriptContent.trim().startsWith("Gracias") || 
            scriptContent.trim().startsWith("Aquí") ||
            scriptContent.trim().startsWith("He") ||
            scriptContent.trim().startsWith("Este")) {
          
          console.log("Convirtiendo respuesta de texto a formato de guion estructurado");
          
          // Crear un objeto JSON simulado con el contenido de texto
          const formattedResponse = {
            formato: "guion_técnico_profesional",
            análisis_musical: {
              género: "No especificado en respuesta de texto",
              estructura: "No especificada en respuesta de texto",
              elementos_destacados: ["No especificados en respuesta de texto"]
            },
            análisis_narrativo: {
              tema_principal: "No especificado en respuesta de texto",
              arco_emocional: "No especificado en respuesta de texto",
              mensaje: "No especificado en respuesta de texto"
            },
            contenido_original: scriptContent.trim(),
            nota: "Esta respuesta ha sido formateada automáticamente a partir de texto."
          };
          
          return JSON.stringify(formattedResponse, null, 2);
        }
        
        // Si todo falla, usar el generador de fallback
        return generarGuionFallback(lyrics);
      }
    } catch (error) {
      console.error(`Error en intento ${retryCount + 1}:`, error);
      
      if (retryCount === maxRetries - 1) {
        // Último intento fallido, devolver un guion básico como fallback
        return generarGuionFallback(lyrics);
      }
      
      // Implementar backoff exponencial
      await backoff(retryCount);
      retryCount++;
    }
  }
  
  // Como último recurso si agotamos todos los intentos
  return generarGuionFallback(lyrics);
}

/**
 * Genera un guion profesional como respaldo cuando la API falla
 * Usa un análisis básico del texto para determinar características y crear segmentos lógicos
 */
function generarGuionFallback(lyrics: string): string {
  console.log("Generando guion profesional de respaldo, analizando letra:", lyrics.substring(0, 100) + "...");
  
  // Función para extraer palabras clave relevantes de la letra
  function extraerPalabrasClave(texto: string): string[] {
    // Lista de palabras clave comunes en varios géneros musicales
    const palabrasGenero = {
      "pop": ["love", "heart", "dance", "night", "feel", "baby", "dream", "star", "light", "amor", "corazón", "bailar", "noche", "sentir", "sueño", "estrella", "luz"],
      "rock": ["rock", "hard", "fire", "burn", "fight", "rebel", "wild", "soul", "free", "fuego", "lucha", "rebelde", "salvaje", "alma", "libre"],
      "hip-hop": ["street", "flow", "money", "hustle", "beat", "rap", "real", "hood", "game", "calle", "dinero", "ritmo", "verdad", "barrio", "juego"],
      "reggaeton": ["party", "perreo", "flow", "dem", "baby", "shorty", "fiesta", "ritmo", "belleza", "cuerpo", "baila"],
      "r&b": ["soul", "baby", "feel", "love", "smooth", "heart", "night", "touch", "slow", "alma", "sentir", "amor", "corazón", "noche", "tocar", "lento"],
      "electrónica": ["beat", "bass", "drop", "night", "feel", "high", "dream", "dance", "ritmo", "bajo", "noche", "sentir", "sueño", "bailar"],
      "indie": ["heart", "feel", "dream", "soul", "mind", "light", "ocean", "mountain", "corazón", "sentir", "sueño", "alma", "mente", "luz", "océano", "montaña"]
    };
    
    // Normalizar texto: convertir a minúsculas y eliminar signos de puntuación
    const textoNormalizado = texto.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
    const palabras = textoNormalizado.split(/\s+/);
    
    // Definir tipo para palabrasGenero
    type GeneroKey = 'pop' | 'rock' | 'hip-hop' | 'reggaeton' | 'r&b' | 'electrónica' | 'indie';
    type PalabrasGeneroType = {
      [K in GeneroKey]: string[];
    };
    
    // Contar ocurrencias de palabras clave por género
    const conteoGeneros: Record<string, number> = {};
    (Object.keys(palabrasGenero) as GeneroKey[]).forEach(genero => {
      conteoGeneros[genero] = 0;
      palabrasGenero[genero].forEach((palabra: string) => {
        const regex = new RegExp(`\\b${palabra}\\b`, 'gi');
        const coincidencias = (textoNormalizado.match(regex) || []).length;
        conteoGeneros[genero] += coincidencias;
      });
    });
    
    // Determinar el género más probable
    let generoDetectado = "pop"; // Valor por defecto
    let maxCoincidencias = 0;
    
    Object.entries(conteoGeneros).forEach(([genero, coincidencias]) => {
      if (coincidencias > maxCoincidencias) {
        maxCoincidencias = coincidencias;
        generoDetectado = genero;
      }
    });
    
    // Extraer palabras emocionales o descriptivas para el tema
    const palabrasEmocionales = ["love", "hate", "joy", "sad", "happy", "angry", "peace", "war", "hope", "fear", 
                               "amor", "odio", "alegría", "triste", "feliz", "enojado", "paz", "guerra", "esperanza", "miedo"];
    const emocionesDetectadas = palabras.filter(palabra => palabrasEmocionales.includes(palabra));
    
    // Si no hay emociones detectadas específicamente, extraer las palabras más frecuentes
    const frecuenciaPalabras: Record<string, number> = {};
    palabras.forEach(palabra => {
      if (palabra.length > 3) { // Ignorar palabras muy cortas
        frecuenciaPalabras[palabra] = (frecuenciaPalabras[palabra] || 0) + 1;
      }
    });
    
    // Ordenar palabras por frecuencia y tomar las 5 más comunes
    const palabrasFrecuentes = Object.entries(frecuenciaPalabras)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(entry => entry[0]);
    
    // Convertir Set a Array para evitar problemas de iteración
    const emocionesArray = [...emocionesDetectadas];
    return [generoDetectado, ...emocionesArray, ...palabrasFrecuentes];
  }
  
  // Dividir la letra en líneas y filtrar líneas vacías
  const lineas = lyrics.split('\n').filter(linea => linea.trim().length > 0);
  
  // Analizar palabras clave para determinar género y tema
  const palabrasClave = extraerPalabrasClave(lyrics);
  const generoDetectado = palabrasClave[0];
  
  // Mapear el género detectado a un estilo visual y paleta de colores coherente
  const estilosVisualesPorGenero: Record<string, {estilo: string, paleta: string, cinematografia: string}> = {
    "pop": {
      estilo: "brillante y contemporáneo",
      paleta: "colores saturados y vibrantes con alto contraste",
      cinematografia: "planos dinámicos con steady cam y drone shots"
    },
    "rock": {
      estilo: "crudo y energético",
      paleta: "alto contraste con predominio de negros, rojos y azules metálicos",
      cinematografia: "cámara en mano con movimientos bruscos y cortes rápidos"
    },
    "hip-hop": {
      estilo: "urbano con estética callejera",
      paleta: "tonos urbanos con filtro de alto contraste y colores neón en la noche",
      cinematografia: "ángulos bajos, gran angular y transiciones estilizadas"
    },
    "reggaeton": {
      estilo: "sensual y festivo",
      paleta: "colores cálidos y saturados con acentos neón",
      cinematografia: "cámara fluida con movimientos sensuales y ralentizados"
    },
    "r&b": {
      estilo: "íntimo y sofisticado",
      paleta: "tonos suaves con acentos dorados y azules profundos",
      cinematografia: "movimientos lentos y fluidos con enfoque en primeros planos"
    },
    "electrónica": {
      estilo: "futurista y minimalista",
      paleta: "colores neón sobre fondos oscuros con efectos de luz",
      cinematografia: "tomas rápidas sincronizadas con beats y efectos visuales digitales"
    },
    "indie": {
      estilo: "atmosférico y nostálgico",
      paleta: "colores desaturados con tonos vintage y filtros de película",
      cinematografia: "tomas contemplativas y composiciones artísticas"
    }
  };
  
  // Seleccionar estilo visual basado en el género detectado (o usar uno predeterminado)
  const estiloVisual = estilosVisualesPorGenero[generoDetectado] || {
    estilo: "cinematográfico contemporáneo",
    paleta: "contrastada con tonos complementarios",
    cinematografia: "combinación equilibrada de planos estáticos y dinámicos"
  };
  
  // Determinar tema principal y mensaje según las palabras clave
  let temaPrincipal = "Expresión emocional personal";
  let mensaje = "Conexión con experiencias universales";
  
  if (palabrasClave.some(p => ["love", "heart", "amor", "corazón", "baby", "feel", "sentir"].includes(p))) {
    temaPrincipal = "Relación romántica y conexión emocional";
    mensaje = "El poder transformador del amor";
  } else if (palabrasClave.some(p => ["party", "dance", "night", "fiesta", "bailar", "noche"].includes(p))) {
    temaPrincipal = "Celebración y escape a través de la fiesta";
    mensaje = "Vivir el momento presente con intensidad";
  } else if (palabrasClave.some(p => ["fight", "power", "strong", "lucha", "poder", "fuerte"].includes(p))) {
    temaPrincipal = "Superación personal y empoderamiento";
    mensaje = "La fortaleza interior ante la adversidad";
  } else if (palabrasClave.some(p => ["sad", "pain", "triste", "dolor", "lost", "perdido"].includes(p))) {
    temaPrincipal = "Dolor emocional y proceso de sanación";
    mensaje = "Transformación a través del sufrimiento";
  }
  
  // Determinar cuántos segmentos crear (mínimo 4, máximo 10)
  let numSegmentos = Math.min(10, Math.max(4, Math.ceil(lineas.length / 3)));
  
  // Si la letra es muy corta, garantizar un mínimo razonable de segmentos
  if (lyrics.length < 200) numSegmentos = 4;
  else if (lyrics.length > 800) numSegmentos = 10;
  
  // Estimar duración total aproximada basada en la extensión de la letra
  const duracionEstimada = Math.max(180, Math.min(300, lyrics.length / 10));
  const duracionPorSegmento = duracionEstimada / numSegmentos;
  
  // Definir posibles tipos de planos con descripciones profesionales
  const tiposPlano = [
    {
      tipo: "extreme close-up (ECU)",
      desc: "primerísimo primer plano que destaca detalles íntimos",
      tecnica: "lente macro o teleobjetivo de 85-135mm, iluminación lateral para enfatizar texturas"
    },
    {
      tipo: "close-up (CU)",
      desc: "primer plano que captura emociones y expresiones",
      tecnica: "lente 50-85mm con apertura amplia (f/1.8-2.8) para desenfocar el fondo"
    },
    {
      tipo: "medium close-up (MCU)",
      desc: "plano medio corto desde pecho hacia arriba",
      tecnica: "lente 35-50mm, composición con regla de tercios, profundidad de campo media"
    },
    {
      tipo: "medium shot (MS)",
      desc: "plano medio que muestra contexto y lenguaje corporal",
      tecnica: "lente 35mm, altura a nivel de los ojos, espacio para gestos y movimiento"
    },
    {
      tipo: "full shot (FS)",
      desc: "plano entero que muestra la figura completa",
      tecnica: "lente 24-35mm, composición equilibrada con espacio negativo intencional"
    },
    {
      tipo: "wide shot (WS)",
      desc: "plano general que establece el entorno completo",
      tecnica: "gran angular 16-24mm, profundidad de campo amplia, composición con líneas guía"
    },
    {
      tipo: "extreme wide shot (EWS)",
      desc: "plano muy abierto que muestra escala y contexto amplio",
      tecnica: "ultra gran angular o drone, altura elevada, encuadre panorámico"
    },
    {
      tipo: "over-the-shoulder shot (OTS)",
      desc: "toma desde detrás del hombro que muestra perspectiva subjetiva",
      tecnica: "lente 35-50mm, composición en diagonal, enfoque selectivo"
    },
    {
      tipo: "dutch angle",
      desc: "ángulo inclinado que genera tensión e inestabilidad",
      tecnica: "inclinación de 15-30 grados, contrastes fuertes, composición desequilibrada"
    },
    {
      tipo: "dolly shot",
      desc: "movimiento fluido de acercamiento o alejamiento",
      tecnica: "riel dolly o gimbal, movimiento lento constante, enfoque constante en sujeto"
    }
  ];
  
  // Definir transiciones profesionales con términos técnicos
  const transiciones = [
    {
      tipo: "corte directo",
      desc: "transición inmediata entre planos",
      uso: "cambios de ritmo dinámicos, sincronización con beats"
    },
    {
      tipo: "match cut",
      desc: "corte que conecta elementos visuales similares",
      uso: "crear continuidad visual entre escenas distintas"
    },
    {
      tipo: "J-cut",
      desc: "transición donde el audio precede a la imagen",
      uso: "anticipar la siguiente escena y crear tensión"
    },
    {
      tipo: "L-cut",
      desc: "transición donde la imagen cambia pero el audio continúa",
      uso: "mantener la continuidad narrativa entre escenas"
    },
    {
      tipo: "fundido cruzado",
      desc: "superposición gradual entre dos imágenes",
      uso: "transiciones suaves entre secuencias relacionadas"
    },
    {
      tipo: "fundido a negro",
      desc: "desvanecimiento gradual a negro",
      uso: "conclusión de secuencias o cambios mayores de tiempo/espacio"
    },
    {
      tipo: "iris",
      desc: "transición circular que se abre o cierra",
      uso: "enfatizar un elemento o crear efecto vintage"
    },
    {
      tipo: "barrido",
      desc: "movimiento rápido que difumina la imagen",
      uso: "transiciones energéticas entre locaciones distintas"
    },
    {
      tipo: "morphing",
      desc: "transformación fluida de un elemento a otro",
      uso: "transiciones oníricas o simbolismo visual"
    },
    {
      tipo: "smash cut",
      desc: "corte abrupto entre escenas contrastantes",
      uso: "crear impacto y sorpresa, contrastar atmósferas"
    }
  ];
  
  // Estados de ánimo con descripción cinematográfica
  const moods = [
    { mood: "melancólico", desc: "atmósfera contemplativa con iluminación suave y ritmo pausado" },
    { mood: "eufórico", desc: "energía vibrante con movimientos rápidos e iluminación intensa" },
    { mood: "introspectivo", desc: "ambiente íntimo con sombras marcadas y composición minimalista" },
    { mood: "tenso", desc: "atmósfera inquietante con contrastes fuertes y encuadres desbalanceados" },
    { mood: "onírico", desc: "calidad etérea con difusión suave y colores superpuestos" },
    { mood: "nostálgico", desc: "estética vintage con tonos desaturados y texturas analógicas" },
    { mood: "épico", desc: "escala grandiosa con movimientos amplios y profundidad dramática" },
    { mood: "íntimo", desc: "proximidad emocional con planos cercanos y luz envolvente" },
    { mood: "surrealista", desc: "distorsión deliberada con yuxtaposiciones inesperadas y simbolismo" },
    { mood: "visceral", desc: "intensidad física con movimientos bruscos y contrastes extremos" }
  ];
  
  // Crear segmentos avanzados
  const segmentos = [];
  
  for (let i = 0; i < numSegmentos; i++) {
    // Determinar tiempo aproximado
    const tiempoInicio = formatearTiempo(i * duracionPorSegmento);
    const tiempoFin = formatearTiempo((i + 1) * duracionPorSegmento);
    
    // Seleccionar líneas para este segmento
    const inicio = Math.floor(i * lineas.length / numSegmentos);
    const fin = Math.floor((i + 1) * lineas.length / numSegmentos);
    const letraSegmento = lineas.slice(inicio, fin).join(" ");
    
    // Determinar tipo de segmento en base a la posición (estructura musical típica)
    let tipo;
    if (i === 0) tipo = "introducción";
    else if (i === numSegmentos - 1) tipo = "outro";
    else if (i === Math.floor(numSegmentos * 0.25) || i === Math.floor(numSegmentos * 0.75)) tipo = "coro";
    else if (i === Math.floor(numSegmentos * 0.5)) tipo = "puente";
    else tipo = "verso";
    
    // Seleccionar elementos visuales con cierta lógica narrativa según posición
    const indiceProgresivo = Math.floor((i / numSegmentos) * 10) % 10; // 0-9 progresivo según avance
    
    // Al inicio usar planos más abiertos, en el medio más cerrados, y al final variar
    let indicePlano = 0;
    if (i < numSegmentos * 0.3) indicePlano = 6 - Math.floor(i * 3 / numSegmentos); // Más abiertos al inicio (6->3)
    else if (i < numSegmentos * 0.7) indicePlano = 2 + (i % 3); // Más cerrados en medio (2-4)
    else indicePlano = (i % tiposPlano.length); // Variados al final
    
    // Al inicio transiciones más suaves, más dinámicas en el medio, conclusivas al final
    let indiceTransicion = 0;
    if (i < numSegmentos * 0.3) indiceTransicion = i % 3; // Suaves al inicio (0-2)
    else if (i < numSegmentos * 0.7) indiceTransicion = 3 + (i % 4); // Dinámicas en medio (3-6)
    else if (i < numSegmentos * 0.9) indiceTransicion = 7 + (i % 2); // Más dramáticas cerca del final (7-8)
    else indiceTransicion = 5; // Fundido al final
    
    // Mood progresivo según la narrativa de la canción
    const indiceMood = Math.min(9, Math.max(0, Math.floor((i / numSegmentos) * moods.length)));
    
    const planoElegido = tiposPlano[indicePlano];
    const transicionElegida = transiciones[indiceTransicion];
    const moodElegido = moods[indiceMood];
    
    // Crear descripción visual basada en la letra y el tipo de segmento
    let descripcionVisual = "";
    if (tipo === "introducción") {
      descripcionVisual = `${planoElegido.tipo} que establece el contexto visual principal. ${estiloVisual.estilo} con ${moodElegido.desc}. Introducción del personaje/escenario principal con composición equilibrada y movimiento lento revelador.`;
    } else if (tipo === "verso") {
      descripcionVisual = `Secuencia narrativa con ${planoElegido.tipo} que desarrolla la historia. Iluminación que evoluciona de ${moodElegido.mood} a ${moods[(indiceMood+1)%10].mood}. ${planoElegido.tecnica} para mostrar progresión emocional.`;
    } else if (tipo === "coro") {
      descripcionVisual = `Montaje de imágenes impactantes en ${planoElegido.tipo} con ritmo acelerado. Explosión visual con ${estiloVisual.paleta} en su máxima intensidad. Movimientos fluidos y perfecta sincronización con el ritmo.`;
    } else if (tipo === "puente") {
      descripcionVisual = `Cambio dramático de ambiente con ${planoElegido.tipo} que rompe el patrón establecido. ${moodElegido.desc} con contraste visual respecto a las secciones previas. ${planoElegido.tecnica} pero con enfoque experimental.`;
    } else if (tipo === "outro") {
      descripcionVisual = `Resolución visual con ${planoElegido.tipo} que proporciona cierre narrativo. Atmósfera ${moodElegido.mood} con iluminación que sugiere conclusión. ${transicionElegida.tipo} hacia el plano final emblemático.`;
    }
    
    // Elementos técnicos profesionales
    const elementosTecnicos = `${planoElegido.tecnica}. Iluminación: ${moodElegido.mood === "melancólico" || moodElegido.mood === "introspectivo" ? "claroscuro con ratio 1:4" : "contraste medio con ratio 1:2"}. ${tipo === "coro" ? "Steadicam con movimiento fluido" : "Cámara estabilizada en trípode con sutiles paneos"}. Profundidad de campo ${tipo === "verso" ? "amplia" : "reducida"} con apertura ${tipo === "verso" ? "f/8-11" : "f/1.8-4"}.`;
    
    segmentos.push({
      id: i + 1,
      tipo: tipo,
      tiempo_aproximado: `${tiempoInicio}-${tiempoFin}`,
      letra: letraSegmento || `[Sección instrumental - ${tipo}]`,
      descripción_visual: descripcionVisual,
      tipo_plano: planoElegido.tipo,
      mood: moodElegido.mood,
      transición: transicionElegida.tipo,
      elementos_técnicos: elementosTecnicos,
      notas_musicales: tipo === "coro" ? "Sincronización precisa con beats principales, enfatizando kicks y drops" : "Seguir progresión armónica con atención a cambios de intensidad vocal"
    });
  }
  
  // Determinar elementos destacados según el género detectado
  const elementosDestacados = [];
  switch (generoDetectado) {
    case "pop":
      elementosDestacados.push("melodía vocal principal", "hooks repetitivos", "estructura verse-chorus");
      break;
    case "rock":
      elementosDestacados.push("riffs de guitarra", "batería potente", "crescendos dramáticos");
      break;
    case "hip-hop":
      elementosDestacados.push("beats rítmicos", "líneas de bajo marcadas", "patrones vocales rápidos");
      break;
    case "reggaeton":
      elementosDestacados.push("dembow rhythm", "percusión latina", "beats constantes a 90-100 BPM");
      break;
    case "r&b":
      elementosDestacados.push("voces melódicas", "armonías vocales", "melodías suaves de piano/sintetizador");
      break;
    case "electrónica":
      elementosDestacados.push("drops electrónicos", "builds y breaks", "texturas sintéticas");
      break;
    case "indie":
      elementosDestacados.push("instrumentación orgánica", "estructuras no convencionales", "texturas atmosféricas");
      break;
    default:
      elementosDestacados.push("línea vocal principal", "patrones rítmicos", "estructura melódica");
  }
  
  // Crear estructura profesional según el género
  let estructuraMusical = "verse-chorus-verse-chorus-bridge-chorus";
  if (generoDetectado === "hip-hop") estructuraMusical = "intro-verse-hook-verse-hook-bridge-hook-outro";
  else if (generoDetectado === "electrónica") estructuraMusical = "intro-build-drop-breakdown-build-drop-outro";
  else if (generoDetectado === "indie") estructuraMusical = "intro-verse-chorus-verse-bridge-verse-outro";
  
  // Crear el guion completo con mayor profesionalismo
  const guionCompleto = {
    análisis_musical: {
      género: generoDetectado,
      estructura: estructuraMusical,
      elementos_destacados: elementosDestacados
    },
    análisis_narrativo: {
      tema_principal: temaPrincipal,
      arco_emocional: `Evolución desde ${moods[0].mood} hasta ${moods[moods.length-1].mood} con climax en segmento ${Math.floor(numSegmentos * 0.7)}`,
      mensaje: mensaje
    },
    diseño_visual: {
      estilo: estiloVisual.estilo,
      paleta_colores: estiloVisual.paleta,
      cinematografía: estiloVisual.cinematografia
    },
    segmentos: segmentos
  };
  
  return JSON.stringify(guionCompleto, null, 2);
}

// Función auxiliar para formatear el tiempo en formato MM:SS
function formatearTiempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const segs = Math.floor(segundos % 60);
  return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}