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

      // Preparar headers con validación adicional
      const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Music Video Creator",
        "Content-Type": "application/json"
      };

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
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error("Error parsing API response:", jsonError);
        throw new Error(`Unable to parse API response: ${jsonError.message}`);
      }
      
      console.log("API Response:", data);

      if (!response.ok) {
        const errorMessage = data.error?.message || response.statusText;
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

      if (!data.choices?.[0]?.message?.content) {
        console.error("Invalid response structure:", data);
        throw new Error("Invalid API response format");
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
    console.log("Starting course content generation with OpenRouter...");

    if (!env.VITE_OPENROUTER_API_KEY) {
      console.error("OpenRouter API key is missing");
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Boostify Music Education",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "cognitivecomputations/dolphin3.0-r1-mistral-24b:free",
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", errorData);
      throw new Error(`Error generating course content: ${response.statusText}. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log("OpenRouter raw response:", data);

    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid API response structure:", data);
      throw new Error("Invalid API response format");
    }

    const content = data.choices[0].message.content;
    console.log("Raw content received:", content);

    try {
      const parsed = JSON.parse(content);

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
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Music Video Creator",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-distill-llama-8b",
        messages,
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      throw new Error(`Error in AI chat: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error('Error in AI chat:', error);
    throw error;
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

      // Preparar headers con validación adicional
      const headers = {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Music Video Creator",
        "Content-Type": "application/json"
      };

      // Verificar que la clave de autorización no esté vacía
      if (!headers.Authorization || headers.Authorization === "Bearer " || headers.Authorization === "Bearer undefined") {
        throw new Error("Authorization header is invalid: API key is missing");
      }

      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "anthropic/claude-3-sonnet",
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
      } catch (jsonError) {
        console.error("Error parsing API response:", jsonError);
        throw new Error(`Unable to parse API response: ${jsonError.message}`);
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
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Music Video Creator",
        "Content-Type": "application/json"
      },
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
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Music Video Creator",
        "Content-Type": "application/json"
      },
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