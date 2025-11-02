import { env } from "../../env";

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
  console.log(`Backing off for ${delay}ms before retry #${retryCount + 1}`);
  await wait(delay);
};

// Function to create a fallback course structure when API calls fail
function createFallbackCourseContent(prompt: string) {
  console.log("Creating fallback course content from prompt:", prompt.substring(0, 100) + "...");
  
  // Extract course title and category from the prompt if possible
  const titleMatch = prompt.match(/Title: "([^"]+)"/i);
  const descriptionMatch = prompt.match(/Description: "([^"]+)"/i);
  const levelMatch = prompt.match(/Level: ([A-Za-z]+)/i);
  const categoryMatch = prompt.match(/Category: ([A-Za-z]+)/i);
  
  const title = titleMatch ? titleMatch[1] : "Music Course";
  const description = descriptionMatch ? descriptionMatch[1] : "Comprehensive music industry course";
  const level = levelMatch ? levelMatch[1] : "Intermediate";
  const category = categoryMatch ? categoryMatch[1] : "Music";
  
  // Create modular structure based on extracted information
  return {
    overview: `A comprehensive ${level.toLowerCase()} level course focusing on ${category.toLowerCase()} in the music industry. ${description}`,
    objectives: [
      `Understand key concepts and principles in ${category}`,
      `Develop practical skills through guided exercises and hands-on projects`,
      `Learn industry best practices and professional techniques for ${category.toLowerCase()}`,
      `Build a professional portfolio demonstrating your ${category.toLowerCase()} skills`
    ],
    curriculum: [
      {
        title: `Introduction to ${title}`,
        description: "A comprehensive introduction to the key concepts covered in this course.",
        estimatedMinutes: 45
      },
      {
        title: `${category} Fundamentals`,
        description: "Master the essential building blocks necessary for success.",
        estimatedMinutes: 60
      },
      {
        title: "Practical Applications",
        description: `Apply your ${category.toLowerCase()} knowledge to real-world scenarios and projects.`,
        estimatedMinutes: 90
      },
      {
        title: `Advanced ${category} Techniques`,
        description: "Take your skills to the next level with advanced concepts and methods.",
        estimatedMinutes: 75
      },
      {
        title: "Professional Development",
        description: `Prepare for success in the ${category.toLowerCase()} industry with career-focused strategies.`,
        estimatedMinutes: 60
      },
      {
        title: "Industry Integration",
        description: "Learn how to position your skills in the current music industry landscape.",
        estimatedMinutes: 90
      },
      {
        title: "Final Project",
        description: "Apply everything you've learned to create a professional portfolio piece.",
        estimatedMinutes: 120
      }
    ],
    topics: [`${category} Fundamentals`, "Best Practices", "Technical Skills", "Industry Standards", "Career Growth", "Portfolio Development"],
    assignments: ["Concept Development", "Technical Exercise", "Research Project", "Creative Application", "Final Portfolio"],
    applications: ["Professional Portfolio Development", `${category} Industry Implementation`, "Creative Collaboration", "Career Advancement"]
  };
}

// Función para generar contenido del curso
export async function generateCourseContent(prompt: string) {
  try {
    console.log("Starting course content generation with OpenRouter (Gemini 2.0)...");
    console.log("Prompt:", prompt.substring(0, 150) + "...");

    // Verificar la presencia de la API key y crear una estructura de respaldo si no está disponible
    if (!env.VITE_OPENROUTER_API_KEY) {
      console.error("OpenRouter API key is missing - using fallback content structure");
      return createFallbackCourseContent(prompt);
    }

    // Obtener la clave API para el curso
    const apiKey = env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OpenRouter API key is empty or undefined - using fallback content structure");
      return createFallbackCourseContent(prompt);
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
      
      // Crear una estructura de respuesta de respaldo en lugar de fallar
      console.log("Generating fallback course content structure");
      return createFallbackCourseContent(prompt);
    }

    // Extracción del contenido con manejo de diferentes estructuras posibles
    let content;
    const firstChoice = data.choices[0];
    
    try {
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

      console.log("Raw content received (first 200 chars):", content.substring(0, 200) + "...");

      // Procesar el contenido - intentar parsear JSON
      let parsed;
      try {
        parsed = typeof content === 'string' ? JSON.parse(content) : content;
      } catch (parseError) {
        console.error("Error parsing JSON content:", parseError);
        console.log("Content that failed parsing (sample):", content.substring(0, 200));
        
        // Intentar extraer JSON del texto si hay { } en el contenido
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            console.log("Attempting to extract JSON from text content");
            parsed = JSON.parse(jsonMatch[0]);
            console.log("Successfully extracted JSON");
          } catch (extractError) {
            console.error("Failed to extract JSON from content:", extractError);
            throw new Error("Could not parse JSON response: " + (parseError as Error).message);
          }
        } else {
          throw new Error("Could not parse JSON response and no JSON found in content");
        }
      }

      // Validar y corregir la estructura para garantizar una estructura válida
      // aunque falten campos o tengan el formato incorrecto
      const validatedContent = {
        overview: typeof parsed.overview === 'string' 
          ? parsed.overview 
          : "A comprehensive course designed to help you succeed in the music industry.",
          
        objectives: Array.isArray(parsed.objectives) && parsed.objectives.length > 0
          ? parsed.objectives
          : ["Learn key concepts", "Develop practical skills", "Master industry techniques"],
          
        curriculum: Array.isArray(parsed.curriculum) && parsed.curriculum.length > 0
          ? parsed.curriculum.map((lesson: any) => ({
              title: lesson.title || "Untitled Lesson",
              description: lesson.description || "No description provided",
              estimatedMinutes: typeof lesson.estimatedMinutes === 'number' ? 
                                lesson.estimatedMinutes : 
                                (parseInt(String(lesson.estimatedMinutes)) || 60)
            }))
          : [
              { title: "Introduction", description: "Course introduction", estimatedMinutes: 45 },
              { title: "Fundamentals", description: "Core concepts", estimatedMinutes: 60 },
              { title: "Practical Applications", description: "Hands-on learning", estimatedMinutes: 90 }
            ],
            
        topics: Array.isArray(parsed.topics) && parsed.topics.length > 0
          ? parsed.topics
          : ["Fundamentals", "Best Practices", "Professional Techniques", "Industry Standards"],
          
        assignments: Array.isArray(parsed.assignments) && parsed.assignments.length > 0
          ? parsed.assignments
          : ["Practice Exercise", "Case Study Analysis", "Final Project"],
          
        applications: Array.isArray(parsed.applications) && parsed.applications.length > 0
          ? parsed.applications
          : ["Professional Portfolio Development", "Industry Implementation"]
      };
      
      console.log("Validated course content structure with curriculum length:", validatedContent.curriculum.length);
      return validatedContent;
    } catch (parseError) {
      console.error("JSON parsing/validation error:", parseError);
      console.error("Content that failed validation:", content);
      throw new Error(`Validation error: ${(parseError as Error).message}`);
    }
  } catch (error) {
    console.error("Course generation error:", error);
    console.log("Using fallback course content generation due to error");
    return createFallbackCourseContent(prompt);
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
      transition: ["cut", "fade", "dissolve", "swipe", "zoom"][i % 5]
    });
  }
  
  return JSON.stringify({ segments }, null, 2);
}

// Additional utility functions
export async function generateVideoPromptWithRetry(params: VideoPromptParams): Promise<string> {
  const maxRetries = 3;
  let retryCount = 0;
  let promptText = "";

  while (retryCount < maxRetries) {
    try {
      console.log(`Attempt ${retryCount + 1}/${maxRetries} to generate prompt`);
      
      // Verify API key
      const apiKey = env.VITE_OPENROUTER_API_KEY;
      if (!apiKey) {
        console.error("OpenRouter API key is missing or undefined. Using direct prompt generation.");
        return generateVideoPrompt(params);
      }
      
      // Basic validation
      if (!params.shotType || !params.mood || !params.visualStyle) {
        throw new Error("Missing required parameters for prompt generation");
      }
      
      const headers = {
        "Authorization": `Bearer ${apiKey.trim()}`,
        "HTTP-Referer": window.location.origin || "https://boostify.music.app",
        "X-Title": "Music Video Creator",
        "Content-Type": "application/json"
      };
      
      // Log for debugging (mask API key)
      console.log("Headers for prompt generation:", {
        Authorization: `Bearer ${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 3)}`,
        "HTTP-Referer": headers["HTTP-Referer"],
        "X-Title": headers["X-Title"]
      });
      
      // Generate base prompt text to send to AI
      promptText = generateVideoPrompt(params);
      
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers,
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001", // Requested model by user
          messages: [
            {
              role: "system",
              content: "You are a professional cinematic prompt engineer. You take basic prompts and transform them into detailed, visually expressive prompts that generate compelling cinematic images. Maintain all the technical specifications from the input prompt but enhance the visual description with clear, evocative details."
            },
            { role: "user", content: promptText }
          ],
          temperature: 0.7,
          max_tokens: 500
        })
      });
      
      let data;
      try {
        // Response is not OK (error)
        if (!response.ok) {
          console.log("Response wasn't OK:", response.status, response.statusText);
          
          if (response.status === 401 || response.status === 403) {
            console.error("Authentication error with OpenRouter API. Check your API key.");
            return promptText;
          }
          
          // Rate limiting - implement backoff
          if (response.status === 429) {
            console.log("Rate limit hit, implementing backoff...");
            await backoff(retryCount);
            retryCount++;
            continue;
          }
          
          throw new Error(`API error: ${response.status} ${response.statusText}`);
        }
        
        data = await response.json();
      } catch (jsonError) {
        try {
          const responseText = await response.text();
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
        
        // Return generic message when no valid response structure
        console.log("No valid response structure available");
        return "Sorry, I couldn't generate a proper response at this time.";
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

/**
 * Genera un guion detallado para un video musical basado en la transcripción de la letra
 * 
 * @param lyrics La transcripción de la letra de la canción
 * @param audioAnalysis Análisis opcional de la pista de audio (beats, segmentos, etc)
 * @param director Información del director para adaptar el estilo cinematográfico
 * @returns Promise con el guion en formato JSON estructurado
 */
export async function generateMusicVideoScript(
  lyrics: string, 
  audioAnalysis?: any, 
  director?: { name: string; specialty: string; style: string }
): Promise<string> {
  try {
    if (!lyrics) {
      throw new Error("No lyrics provided for script generation");
    }
    
    console.log("Generating music video script from lyrics:", lyrics.substring(0, 100) + "...");
    
    // Verificar API key
    const apiKey = env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      console.error("OpenRouter API key missing - using fallback script generation");
      return generarGuionFallback(lyrics);
    }
    
    // Preparar headers para OpenRouter con modelo actualizado a Gemini 2.0 Flash
    const headers = {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Boostify Music Video Generator",
      "Content-Type": "application/json"
    };
    
    // Crear el prompt con la letra y análisis de audio si está disponible
    let userPrompt = `Generate a detailed music video script for these lyrics:\n\n${lyrics}`;
    
    // Agregar información del director si está disponible
    if (director) {
      userPrompt += `\n\nDIRECTOR STYLE ADAPTATION:
This music video will be directed by ${director.name}, known for:
- Specialty: ${director.specialty}
- Visual Style: ${director.style}

IMPORTANT: Adapt the entire script to reflect ${director.name}'s unique cinematic signature. Every scene should embody their characteristic style in:
- Camera choices and movements
- Lighting design
- Visual composition
- Color palette
- Scene transitions
- Overall aesthetic approach`;
    }
    
    if (audioAnalysis) {
      try {
        userPrompt += "\n\nPlease consider this audio analysis information:\n" + 
                     (typeof audioAnalysis === 'string' ? audioAnalysis : JSON.stringify(audioAnalysis, null, 2));
      } catch (e) {
        console.error("Error processing audio analysis:", e);
      }
    }
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001", // Actualizado al modelo solicitado
        messages: [
          {
            role: "system",
            content: `You are a professional music video director. Create a detailed cinematic script for a music video based on song lyrics.

Return a JSON array of scene objects. Each scene MUST follow this EXACT structure:

[
  {
    "scene_id": 1,
    "section": "Intro/Verse/Chorus/Bridge/Outro",
    "title": "Scene title that captures the moment",
    "camera": {
      "type": "camera setup (e.g., 'handheld', 'drone', 'dolly')",
      "lens": "lens specification (e.g., '35mm anamorphic', '50mm')",
      "movement": "detailed camera movement description",
      "framerate": "frame rate (e.g., '24fps', '48fps slow motion')",
      "resolution": "resolution (e.g., '8K RAW', '6K')",
      "stabilization": "stabilization notes"
    },
    "lighting": {
      "source": "primary light source",
      "temperature": "color temperature (e.g., '3100K warm', '5000K cool')",
      "key_light": "key light description",
      "fill_light": "fill light description",
      "back_light": "back light description",
      "atmosphere": "atmospheric effects (fog, haze, particles)"
    },
    "environment": {
      "location": "specific location description",
      "elements": ["array", "of", "environmental", "elements"],
      "color_palette": ["array", "of", "colors"],
      "texture": "texture and visual quality description"
    },
    "performance": {
      "artist_name": "artist/character name",
      "wardrobe": "costume description",
      "action": "what the artist is doing",
      "expression": "emotional expression and body language",
      "symbolism": "symbolic meaning if any"
    },
    "sound": {
      "ambience": "ambient sounds",
      "music": "musical elements in this scene",
      "voice": "key lyrics or dialogue from this scene"
    },
    "emotional_tone": {
      "feeling": "primary emotion of the scene",
      "tempo_visual": "visual tempo (slow, medium, fast)"
    },
    "transition": {
      "in": "how this scene begins (fade in, cut, etc.)",
      "out": "how this scene ends (fade out, cut to, etc.)"
    },
    "production_notes": {
      "notes": "any additional production notes, effects, safety, etc."
    }
  }
]

IMPORTANT GUIDELINES:
- Create 8-12 scenes that cover the entire song structure
- Divide logically: Intro, Verses, Chorus, Bridge, Outro
- Be EXTREMELY specific and cinematic in all descriptions
- Use professional cinematography terminology
- Create a coherent visual narrative with strong symbolism
- Each scene should sync with the lyrics and emotion
- Include detailed camera, lighting, and production specs
- Note: Reference images of the artist may be available for face adaptation during image generation`
          },
          {
            role: "user",
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      console.error("Error en respuesta de OpenRouter:", response.status, response.statusText);
      return generarGuionFallback(lyrics);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      console.error("Respuesta inválida de OpenRouter:", data);
      return generarGuionFallback(lyrics);
    }
    
    const scriptContent = data.choices[0].message.content;
    
    try {
      // Validar que sea JSON válido
      JSON.parse(scriptContent);
      return scriptContent;
    } catch (error) {
      console.error("El script generado no es JSON válido:", error);
      // Intento de extraer JSON si está mezclado con otro texto
      const jsonMatch = scriptContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          JSON.parse(jsonMatch[0]);
          return jsonMatch[0];
        } catch (e) {
          console.error("No se pudo extraer JSON del contenido:", e);
        }
      }
      return generarGuionFallback(lyrics);
    }
  } catch (error) {
    console.error("Error generando guion de video musical:", error);
    return generarGuionFallback(lyrics);
  }
}

/**
 * Genera un guion profesional como respaldo cuando la API falla
 * Usa un análisis básico del texto para determinar características y crear segmentos lógicos
 */
function generarGuionFallback(lyrics: string): string {
  console.log("Generando guion fallback para:", lyrics.substring(0, 100) + "...");
  
  // Dividir las letras en líneas
  const lines = lyrics.split('\n').filter(line => line.trim().length > 0);
  
  // Detectar posible estructura (estrofas, coro, etc.)
  const segments = [];
  let currentSegment = [];
  let segmentType = "intro";
  let segmentIndex = 0;
  
  // Dividir en segmentos lógicos basados en líneas en blanco o patrones repetidos
  for (let i = 0; i < lines.length; i++) {
    currentSegment.push(lines[i]);
    
    // Detectar cambio de segmento por línea en blanco o al acumular 4-5 líneas
    if (i === lines.length - 1 || currentSegment.length >= 4 || lines[i].trim() === "") {
      if (currentSegment.length > 0) {
        const segmentText = currentSegment.join('\n').trim();
        if (segmentText) {
          // Determinar tipo de segmento
          let type = segmentType;
          
          // Intentar detectar si es coro basado en repetición
          if (i > 0 && lines.slice(0, i).some(l => l === lines[i])) {
            type = "chorus";
          } else if (segmentIndex === 0) {
            type = "intro";
          } else if (i === lines.length - 1) {
            type = "outro";
          } else if (segmentIndex % 2 === 0) {
            type = "verse";
          } else {
            type = "chorus";
          }
          
          // Calcular timecodes aproximados (asumiendo 3 minutos / 180 segundos en total)
          const startPercent = segmentIndex / Math.max(1, Math.ceil(lines.length / 4));
          const endPercent = (segmentIndex + 1) / Math.max(1, Math.ceil(lines.length / 4));
          const startSeconds = Math.floor(startPercent * 180);
          const endSeconds = Math.floor(endPercent * 180);
          
          const timecode = `${formatearTiempo(startSeconds)} - ${formatearTiempo(endSeconds)}`;
          
          // Determinar estilo visual basado en palabras clave en el texto
          const keywords = extraerPalabrasClave(segmentText);
          
          segments.push({
            scene_id: segmentIndex + 1,
            section: type.charAt(0).toUpperCase() + type.slice(1),
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} - ${keywords.slice(0, 3).join(', ') || 'Scene'}`,
            camera: {
              type: type === 'chorus' ? 'handheld' : 'dolly',
              lens: type === 'chorus' ? '35mm' : '50mm',
              movement: type === 'chorus' ? 'dynamic tracking following artist' : 'slow push in on artist',
              framerate: '24fps',
              resolution: '6K',
              stabilization: type === 'chorus' ? 'handheld natural movement' : 'smooth stabilized'
            },
            lighting: {
              source: 'natural daylight with artificial fill',
              temperature: type === 'chorus' ? '5000K cool' : '3200K warm',
              key_light: 'soft natural light from window',
              fill_light: 'LED panel with diffusion',
              back_light: 'rim light for separation',
              atmosphere: 'subtle haze for depth'
            },
            environment: {
              location: type === 'chorus' ? 'outdoor urban setting' : 'intimate interior space',
              elements: keywords.length > 0 ? keywords : ['artistic set pieces', 'symbolic objects'],
              color_palette: type === 'chorus' ? ['vibrant', 'saturated', 'energetic'] : ['muted', 'warm', 'intimate'],
              texture: 'cinematic with slight film grain'
            },
            performance: {
              artist_name: 'Artist',
              wardrobe: 'contemporary styled outfit',
              action: type === 'chorus' ? 'energetic performance, engaging camera' : 'emotive lip sync, subtle movements',
              expression: type === 'chorus' ? 'confident and powerful' : 'vulnerable and emotional',
              symbolism: `visual representation of ${keywords.slice(0, 2).join(' and ') || 'the lyrics'}`
            },
            sound: {
              ambience: type === 'chorus' ? 'crowd energy, environmental sounds' : 'quiet atmospheric tones',
              music: type === 'chorus' ? 'full instrumentation, energetic' : 'stripped back, emotional',
              voice: segmentText.substring(0, 100)
            },
            emotional_tone: {
              feeling: type === 'chorus' ? 'energetic and powerful' : 'intimate and reflective',
              tempo_visual: type === 'chorus' ? 'fast' : 'slow'
            },
            transition: {
              in: segmentIndex === 0 ? 'fade in from black' : 'cut from previous scene',
              out: type === 'outro' ? 'fade to black' : (type === 'chorus' ? 'quick cut' : 'smooth dissolve')
            },
            production_notes: {
              notes: `${type} section with ${type === 'chorus' ? 'high energy' : 'emotional depth'} visual treatment`
            }
          });
          
          segmentIndex++;
          currentSegment = [];
        }
      }
    }
  }
  
  // Si no se crearon segmentos (posible error), crear al menos uno
  if (segments.length === 0) {
    segments.push({
      scene_id: 1,
      section: "Full Song",
      title: "Complete Music Video",
      camera: {
        type: 'handheld',
        lens: '35mm',
        movement: 'dynamic movement following artist',
        framerate: '24fps',
        resolution: '6K',
        stabilization: 'natural handheld feel'
      },
      lighting: {
        source: 'natural and artificial mixed',
        temperature: '4000K neutral',
        key_light: 'soft key from 45 degrees',
        fill_light: 'bounce fill',
        back_light: 'rim light for separation',
        atmosphere: 'atmospheric haze'
      },
      environment: {
        location: 'artistic performance space',
        elements: ['symbolic set pieces', 'atmospheric props'],
        color_palette: ['cinematic', 'vibrant', 'contrasted'],
        texture: 'film grain aesthetic'
      },
      performance: {
        artist_name: 'Artist',
        wardrobe: 'artistic performance outfit',
        action: 'dynamic performance throughout',
        expression: 'emotional and engaging',
        symbolism: 'visual storytelling of lyrics'
      },
      sound: {
        ambience: 'atmospheric environmental sounds',
        music: 'full track instrumentation',
        voice: lyrics.substring(0, 100)
      },
      emotional_tone: {
        feeling: 'powerful and emotional',
        tempo_visual: 'medium to fast'
      },
      transition: {
        in: 'fade in from black',
        out: 'fade to black'
      },
      production_notes: {
        notes: 'Fallback scene covering entire song with artistic visual treatment'
      }
    });
  }
  
  // Retornar el array de escenas directamente (nueva estructura)
  return JSON.stringify(segments, null, 2);
  
  function extraerPalabrasClave(texto: string): string[] {
    // Lista de palabras emocionales comunes en canciones
    const palabrasEmocionales = [
      "love", "heart", "soul", "dream", "night", "light", "dark",
      "sky", "pain", "joy", "fire", "water", "earth", "wind",
      "eyes", "hands", "dance", "sing", "fall", "rise", "break",
      "build", "hope", "fear", "life", "death", "star", "sun",
      "moon", "ocean", "river", "mountain", "road", "journey"
    ];
    
    // Determinar posible género musical basado en palabras clave
    type GeneroKey = 'pop' | 'rock' | 'hip-hop' | 'reggaeton' | 'r&b' | 'electrónica' | 'indie';
    type PalabrasGeneroType = {
      [K in GeneroKey]: string[];
    };
    
    const palabrasPorGenero: PalabrasGeneroType = {
      "pop": ["love", "party", "dance", "night", "feeling", "heart"],
      "rock": ["fight", "rebel", "freedom", "power", "wild", "alive"],
      "hip-hop": ["street", "hustle", "real", "flow", "grind", "beat"],
      "reggaeton": ["bailar", "cuerpo", "ritmo", "noche", "fiesta"],
      "r&b": ["soul", "touch", "slow", "feel", "smooth", "baby"],
      "electrónica": ["beat", "night", "high", "sound", "energy", "pulse"],
      "indie": ["dream", "away", "mind", "wonder", "thought", "world"]
    };
    
    // Extraer palabras que coincidan con las listas
    const palabrasEncontradas: string[] = [];
    const palabrasDelTexto = texto.toLowerCase().split(/\s+/);
    
    // Primero palabras emocionales
    for (const palabra of palabrasDelTexto) {
      const palabraLimpia = palabra.replace(/[.,;!?()]/g, '');
      if (palabrasEmocionales.includes(palabraLimpia) && !palabrasEncontradas.includes(palabraLimpia)) {
        palabrasEncontradas.push(palabraLimpia);
      }
    }
    
    // Luego palabras por género
    for (const genero in palabrasPorGenero) {
      for (const palabra of palabrasPorGenero[genero as GeneroKey]) {
        if (texto.toLowerCase().includes(palabra) && !palabrasEncontradas.includes(palabra)) {
          palabrasEncontradas.push(palabra);
        }
      }
    }
    
    // Si no encontramos suficientes, agregar algunas palabras largas del texto
    if (palabrasEncontradas.length < 3) {
      for (const palabra of palabrasDelTexto) {
        const palabraLimpia = palabra.replace(/[.,;!?()]/g, '');
        if (palabraLimpia.length > 5 && !palabrasEncontradas.includes(palabraLimpia)) {
          palabrasEncontradas.push(palabraLimpia);
          if (palabrasEncontradas.length >= 3) break;
        }
      }
    }
    
    return palabrasEncontradas.slice(0, 5); // Limitar a 5 palabras clave
  }
}

function formatearTiempo(segundos: number): string {
  const minutos = Math.floor(segundos / 60);
  const segs = segundos % 60;
  return `${minutos.toString().padStart(2, '0')}:${segs.toString().padStart(2, '0')}`;
}

export async function analyzeImage(imageUrl: string) {
  try {
    // Verificar API key
    const apiKey = env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is missing or undefined');
    }
    
    // Preparar headers para OpenRouter
    const headers = {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Boostify Image Analysis",
      "Content-Type": "application/json"
    };
    
    // Crear el prompt
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: `You are an image analysis expert specialized in music artist branding. Analyze the image URL provided and return a JSON response with this structure:
{
  "style": "Description of overall visual style",
  "colors": ["List of dominant colors"],
  "mood": "Emotional impact/mood of the image",
  "branding": "Analysis of branding effectiveness",
  "recommendations": ["List of specific recommendations to improve the image"]
}`
          },
          {
            role: "user",
            content: `Analyze this image URL: ${imageUrl}`
          }
        ],
        temperature: 0.7,
        max_tokens: 1000,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error("Invalid API response format");
    }
    
    const content = data.choices[0].message.content;
    
    try {
      return JSON.parse(content);
    } catch (error) {
      console.error("Error parsing analysis JSON:", error);
      throw new Error("Invalid JSON format in analysis response");
    }
  } catch (error) {
    console.error("Error analyzing image:", error);
    return {
      style: "Unable to analyze image",
      colors: ["N/A"],
      mood: "N/A",
      branding: "Error analyzing image",
      recommendations: ["Try again with a different image"]
    };
  }
}

export async function transcribeWithAI(audioBase64: string) {
  try {
    const apiKey = env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error('OpenRouter API key is missing or undefined');
    }
    
    const headers = {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Boostify Audio Transcription",
      "Content-Type": "application/json"
    };
    
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: "You are an audio transcription assistant. Transcribe the audio accurately, capturing all spoken words. For music, describe the genre, tempo, instruments and mood."
          },
          {
            role: "user",
            content: `Transcribe this audio: ${audioBase64.substring(0, 100)}...`
          }
        ],
        temperature: 0.3,
        max_tokens: 1500
      })
    });
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message || !data.choices[0].message.content) {
      throw new Error("Invalid API response format");
    }
    
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error during audio transcription:", error);
    return "Error transcribing audio: " + (error instanceof Error ? error.message : "Unknown error");
  }
}