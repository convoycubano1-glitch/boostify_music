import { env } from "../../env";
import { 
  ShotType, 
  SceneRole, 
  CameraMovement, 
  LensType, 
  VisualStyle, 
  LightingType, 
  MusicSection,
  type MusicVideoScene,
  type MusicVideoScript,
  type MusicVideoConcept,
  validateSceneBalance,
  generateVariedShotSequence
} from "../../types/music-video-scene";
import type { DirectorProfile } from "../../data/directors/director-schema";

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
  try {
    console.log("🎨 Mejorando prompt cinematográfico con Gemini backend...");
    
    // Basic validation
    if (!params.shotType || !params.mood || !params.visualStyle) {
      throw new Error("Missing required parameters for prompt generation");
    }
    
    // Generate base prompt text
    const basePrompt = generateVideoPrompt(params);
    
    // Call backend endpoint that uses Gemini
    const response = await fetch("/api/music-video/enhance-prompt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        basePrompt,
        shotType: params.shotType,
        mood: params.mood,
        visualStyle: params.visualStyle
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.warn('Backend prompt enhancement failed, using base prompt:', errorData);
      return basePrompt;
    }

    const data = await response.json();
    
    if (!data.success || !data.enhancedPrompt) {
      console.warn("No enhanced prompt received, using base prompt");
      return basePrompt;
    }

    console.log(`✅ Prompt mejorado con Gemini`);
    return data.enhancedPrompt;
    
  } catch (error) {
    console.error("Error enhancing prompt:", error);
    // Fallback to base prompt
    return generateVideoPrompt(params);
  }
}

export async function generateThreeConceptProposals(
  lyrics: string,
  directorName: string,
  artistReferences?: string[],
  audioDuration?: number
): Promise<MusicVideoConcept[]> {
  try {
    console.log("🎨 Generando 3 propuestas de concepto visual con Gemini...");
    
    // Llamar al endpoint del backend que usa Gemini
    const response = await fetch("/api/music-video/generate-concepts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lyrics,
        directorName,
        characterReference: artistReferences,
        audioDuration
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(`Error generating concepts: ${response.status} - ${errorData.error || errorData.details || 'Unknown error'}`);
    }
    
    const data = await response.json();
    
    if (!data.success || !data.concepts) {
      throw new Error("No concept data received from backend");
    }
    
    console.log("✅ 3 conceptos visuales generados exitosamente con Gemini");
    return data.concepts;
    
  } catch (error) {
    console.error("Error generating concept proposals:", error);
    throw error;
  }
}

/**
 * Genera el concepto visual y narrativo del video musical PRIMERO
 * Este concepto se usa como base para generar un script más coherente
 * 
 * @param lyrics La transcripción de la letra de la canción
 * @param artistReferences Imágenes de referencia del artista para extraer estilo
 * @param audioDuration Duración del audio en segundos
 * @returns Promise con el concepto visual en formato JSON
 */
export async function generateMusicVideoConcept(
  lyrics: string,
  artistReferences?: string[],
  audioDuration?: number
): Promise<MusicVideoConcept | null> {
  try {
    console.log("🎨 Generando concepto visual y narrativo del video...");
    
    const apiKey = env.VITE_OPENROUTER_API_KEY;
    if (!apiKey) {
      console.warn("OpenRouter API key missing - skipping concept generation");
      return null;
    }
    
    const headers = {
      "Authorization": `Bearer ${apiKey.trim()}`,
      "HTTP-Referer": window.location.origin,
      "X-Title": "Boostify Music Video Concept Generator",
      "Content-Type": "application/json"
    };
    
    const prompt = `Based on these lyrics, create a comprehensive visual and narrative concept for a music video:

LYRICS:
${lyrics}

${audioDuration ? `DURATION: ${Math.floor(audioDuration)} seconds` : ''}

${artistReferences && artistReferences.length > 0 ? `NOTE: The artist has ${artistReferences.length} reference images provided. Use these to inform wardrobe and styling consistency.` : ''}

Create a detailed visual concept that includes:
1. A compelling narrative/story concept that ties the entire video together
2. Specific wardrobe details (outfit, colors, accessories, hair/makeup)
3. 2-3 main locations with detailed descriptions
4. A cohesive color palette
5. Recurring visual elements for continuity
6. Key narrative moments throughout the video

Return ONLY valid JSON matching this structure:
{
  "story_concept": "Complete narrative description...",
  "visual_theme": "Main visual theme...",
  "mood_progression": "How the mood evolves...",
  "main_wardrobe": {
    "outfit_description": "Detailed outfit description",
    "colors": ["color1", "color2"],
    "style": "urban/elegant/casual/etc",
    "accessories": ["accessory1", "accessory2"],
    "hair_makeup": "Hair and makeup description"
  },
  "locations": [
    {
      "name": "Location name",
      "description": "Detailed description",
      "mood": "Mood of this location",
      "scenes_usage": "When/how this location is used"
    }
  ],
  "color_palette": {
    "primary_colors": ["color1", "color2"],
    "accent_colors": ["color3"],
    "mood_colors": "Description of color mood"
  },
  "recurring_visual_elements": ["element1", "element2"],
  "key_narrative_moments": [
    {
      "timestamp": "0:30",
      "description": "What happens at this moment"
    }
  ]
}`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages: [
          {
            role: "system",
            content: "You are an expert music video creative director. Create detailed, cohesive visual concepts that ensure consistency throughout the entire video production."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.8,
        max_tokens: 4000,
        response_format: { type: "json_object" }
      })
    });
    
    if (!response.ok) {
      console.error("Error generating concept:", response.status);
      return null;
    }
    
    const data = await response.json();
    const conceptContent = data.choices?.[0]?.message?.content;
    
    if (!conceptContent) {
      console.error("No concept content received");
      return null;
    }
    
    const concept: MusicVideoConcept = JSON.parse(conceptContent);
    console.log("✅ Concepto visual generado exitosamente");
    return concept;
    
  } catch (error) {
    console.error("Error generating music video concept:", error);
    return null;
  }
}

/**
 * Genera un guion detallado para un video musical basado en la transcripción de la letra
 * AHORA USA EL CONCEPTO VISUAL Y PERFIL COMPLETO DEL DIRECTOR como base para mayor coherencia
 * 
 * @param lyrics La transcripción de la letra de la canción
 * @param audioAnalysis Análisis opcional de la pista de audio (beats, segmentos, etc)
 * @param director Perfil COMPLETO del director con todos sus detalles técnicos y estilísticos (DirectorProfile)
 * @param audioDuration Duración del audio en segundos para calcular número de escenas
 * @param editingStyle Estilo de edición seleccionado
 * @param concept Concepto visual generado previamente (opcional pero recomendado)
 * @returns Promise con el guion en formato JSON estructurado
 */
export async function generateMusicVideoScript(
  lyrics: string, 
  audioAnalysis?: any, 
  director?: DirectorProfile,
  audioDuration?: number,
  editingStyle?: { id: string; name: string; description: string; duration: { min: number; max: number } },
  concept?: MusicVideoConcept | null
): Promise<string> {
  try {
    if (!lyrics) {
      throw new Error("No lyrics provided for script generation");
    }
    
    console.log("🎬 Generando script completo del video con Gemini backend...");
    
    // Usar estilo de edición para calcular escenas y duraciones
    const minDuration = editingStyle?.duration.min || 2;
    const maxDuration = editingStyle?.duration.max || 4;
    const avgDuration = (minDuration + maxDuration) / 2;
    
    // Calcular número de escenas basado en duración promedio del estilo
    const calculatedScenes = audioDuration ? Math.ceil(audioDuration / avgDuration) : 12;
    const maxScenes = 40; // Generate 40 scenes for full video
    const targetSceneCount = Math.min(calculatedScenes, maxScenes);
    
    console.log(`🎬 Estilo de edición: ${editingStyle?.name || 'Phrase-based'}`);
    console.log(`⏱️ Duraciones: ${minDuration}s - ${maxDuration}s por escena`);
    console.log(`📊 Escenas calculadas: ${targetSceneCount}`);
    
    // Llamar al endpoint del backend que usa Gemini
    const response = await fetch("/api/music-video/generate-script", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        lyrics,
        concept,
        directorName: director?.name || 'Creative Director',
        audioDuration,
        editingStyle,
        sceneCount: targetSceneCount
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error('Error generando script:', errorData);
      return generarGuionFallback(lyrics, targetSceneCount, audioDuration);
    }

    const data = await response.json();
    
    if (!data.success || !data.script) {
      console.error("No script data received from backend");
      return generarGuionFallback(lyrics, targetSceneCount, audioDuration);
    }

    console.log(`✅ Script generado con ${data.script.scenes?.length || 0} escenas`);
    return JSON.stringify(data.script);
    
  } catch (error) {
    console.error("Error generating music video script:", error);
    const calculatedScenes = Math.ceil((audioDuration || 40) / 4);
    const maxScenes = 40;
    return generarGuionFallback(lyrics, Math.min(calculatedScenes, maxScenes), audioDuration);
  }
}


/**
 * Genera un guion profesional como respaldo cuando la API falla
 * Usa el nuevo schema MusicVideoScene con balance 50/50
 * @param lyrics Letras de la canción
 * @param sceneCount Número exacto de escenas a generar (default: 10)
 * @param audioDuration Duración total del audio en segundos
 */
function generarGuionFallback(
  lyrics: string, 
  sceneCount: number = 10, 
  audioDuration?: number
): string {
  console.log(`🎬 Generando guión fallback con ${sceneCount} escenas (nuevo schema MusicVideoScene)`);
  
  // Dividir las letras en líneas
  const lines = lyrics.split('\n').filter(line => line.trim().length > 0);
  const totalLines = lines.length;
  
  // Generar shot types variados usando el helper
  const shotSequence = generateVariedShotSequence(sceneCount, 2);
  
  // Generar duraciones aleatorias VARIADAS (2-6 segundos)
  const adjustedDurations: number[] = [];
  const minDuration = 2.0;
  const maxDuration = 6.0;
  
  for (let i = 0; i < sceneCount; i++) {
    const duration = minDuration + Math.random() * (maxDuration - minDuration);
    adjustedDurations.push(duration);
  }
  
  console.log(`🎬 Duraciones VARIADAS: min=${Math.min(...adjustedDurations).toFixed(2)}s, max=${Math.max(...adjustedDurations).toFixed(2)}s, promedio=${(adjustedDurations.reduce((s, d) => s + d, 0) / sceneCount).toFixed(2)}s, total=${adjustedDurations.reduce((s, d) => s + d, 0).toFixed(2)}s`);
  
  // Generar exactamente sceneCount escenas
  const scenes: MusicVideoScene[] = [];
  const linesPerScene = Math.max(1, Math.floor(totalLines / sceneCount));
  
  // Acumular start_time correctamente
  let accumulatedTime = 0;
  
  for (let i = 0; i < sceneCount; i++) {
    // Calcular qué líneas de letras corresponden a esta escena
    const startLine = Math.floor((i / sceneCount) * totalLines);
    const endLine = Math.min(Math.floor(((i + 1) / sceneCount) * totalLines), totalLines);
    const sceneLines = lines.slice(startLine, endLine);
    const lyricsText = sceneLines.join(' ').substring(0, 150);
    
    // Determinar tipo de sección musical
    let musicSection: MusicSection = MusicSection.VERSE;
    if (i === 0) musicSection = MusicSection.INTRO;
    else if (i === sceneCount - 1) musicSection = MusicSection.OUTRO;
    else if (i % 3 === 1) musicSection = MusicSection.CHORUS;
    else if (i % 4 === 2) musicSection = MusicSection.BRIDGE;
    
    // Balance 50/50: alternar entre performance y b-roll
    const role: SceneRole = i % 2 === 0 ? SceneRole.PERFORMANCE : SceneRole.BROLL;
    
    // Obtener shot type de la secuencia variada
    const shotType = shotSequence[i];
    
    // Seleccionar movimiento de cámara y lente según energía
    const isHighEnergy = musicSection === MusicSection.CHORUS;
    const cameraMovements = [CameraMovement.HANDHELD, CameraMovement.STEADICAM, CameraMovement.DOLLY, CameraMovement.CRANE, CameraMovement.DRONE];
    const cameraMovement = cameraMovements[i % cameraMovements.length];
    
    const lens = isHighEnergy ? LensType.STANDARD : LensType.PORTRAIT;
    const visualStyle = isHighEnergy ? VisualStyle.VIBRANT : VisualStyle.CINEMATIC;
    const lighting = isHighEnergy ? LightingType.MIXED : LightingType.NATURAL;
    
    // Usar duración aleatoria de la lista generada
    const sceneDuration = adjustedDurations[i];
    const start_time = accumulatedTime;
    
    // Generar descripción según el rol
    let description: string;
    if (role === SceneRole.PERFORMANCE) {
      description = isHighEnergy 
        ? `Artist performing energetically, ${shotType} shot capturing dynamic movement and emotional expression. ${lyricsText}`
        : `Artist performing intimately, ${shotType} shot focusing on emotive lip sync and subtle movements. ${lyricsText}`;
    } else {
      // B-roll: escenas de historia/ambiente
      const brollScenes = [
        `Cinematic ${shotType} of urban landscape with artistic composition`,
        `${shotType} capturing environmental storytelling elements`,
        `Atmospheric ${shotType} of symbolic visual narrative`,
        `${shotType} showcasing contextual setting and mood`,
        `Story-driven ${shotType} with strong visual metaphor`
      ];
      description = brollScenes[i % brollScenes.length] + `. ${lyricsText}`;
    }
    
    // Crear escena con nuevo schema
    const scene: MusicVideoScene = {
      scene_id: `scene-${i + 1}`,
      start_time,
      duration: sceneDuration,
      role,
      shot_type: shotType,
      camera_movement: cameraMovement,
      lens,
      visual_style: visualStyle,
      lighting,
      color_temperature: isHighEnergy ? '5000K' : '3200K',
      description,
      lyrics_segment: lyricsText || `Segmento ${i + 1} de la canción`,
      location: role === SceneRole.PERFORMANCE ? 'performance space' : 'cinematic environment',
      music_section: musicSection,
      status: 'pending'
    };
    
    scenes.push(scene);
    
    // Incrementar el tiempo acumulado con la duración de esta escena
    accumulatedTime += sceneDuration;
  }
  
  // Validar balance 50/50
  const balance = validateSceneBalance(scenes);
  console.log(`✅ Balance de escenas: ${balance.message}`);
  
  // Crear script completo con estadísticas
  const totalDuration = audioDuration || adjustedDurations.reduce((sum, d) => sum + d, 0);
  const script: MusicVideoScript = {
    id: `script-${Date.now()}`,
    title: 'Music Video Script',
    duration: totalDuration,
    scene_count: sceneCount,
    scenes,
    stats: {
      performance_count: scenes.filter(s => s.role === SceneRole.PERFORMANCE).length,
      broll_count: scenes.filter(s => s.role === SceneRole.BROLL).length,
      performance_ratio: balance.performance_ratio,
      shot_type_distribution: scenes.reduce((acc, s) => {
        acc[s.shot_type] = (acc[s.shot_type] || 0) + 1;
        return acc;
      }, {} as Record<ShotType, number>)
    },
    generated_at: Date.now(),
    generation_config: {
      audio_duration: audioDuration || 0,
      audio_transcription: lyrics,
      target_scene_count: sceneCount,
      performance_ratio: 0.5
    }
  };
  
  // Retornar en el formato correcto con la key "scenes"
  return JSON.stringify({ scenes: script.scenes }, null, 2);
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