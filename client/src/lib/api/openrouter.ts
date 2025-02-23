import { env } from "@/env";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Estructura base para un prompt de video musical
interface VideoPromptParams {
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

// Cache para prompts exitosos
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

  // Simplified prompt structure
  let prompt = `Generate a detailed video scene description:
- Shot: ${shotType} using ${cameraFormat}
- Style: ${visualStyle} (${visualIntensity}% intensity)
- Mood: ${mood} with ${colorPalette} colors
- Duration: ${duration} seconds
- Camera: Professional cinematography focusing on composition (${narrativeIntensity}% narrative)`;

  if (directorStyle) {
    prompt += `\n- Director Style: ${directorStyle}`;
  }

  if (specialty) {
    prompt += `\n- Special Focus: ${specialty}`;
  }

  if (styleReference) {
    prompt += `\n- Reference: ${styleReference}`;
  }

  promptCache.set(cacheKey, prompt);
  return prompt;
};

// Implementación de backoff exponencial mejorado
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const backoff = async (retryCount: number) => {
  const baseDelay = 3000; // 3 segundos base
  const maxDelay = 60000; // 60 segundos máximo
  const delay = Math.min(baseDelay * Math.pow(2, retryCount), maxDelay);
  console.log(`Waiting ${delay/1000} seconds before retry ${retryCount + 1}`);
  await wait(delay);
};

// Cola de procesamiento para prompts
const promptQueue: (() => Promise<void>)[] = [];
let isProcessing = false;

const processQueue = async () => {
  if (isProcessing || promptQueue.length === 0) return;

  isProcessing = true;
  while (promptQueue.length > 0) {
    const task = promptQueue.shift()!;
    try {
      await task();
      // Esperar 3 segundos entre tareas
      await wait(3000);
    } catch (error) {
      console.error("Error processing prompt task:", error);
    }
  }
  isProcessing = false;
};

// Función mejorada para generar prompts de video
export async function generateVideoPromptWithRetry(params: VideoPromptParams): Promise<string> {
  return new Promise((resolve, reject) => {
    const task = async () => {
      const maxRetries = 5;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          console.log(`Attempt ${retryCount + 1}/${maxRetries} to generate video prompt`);

          const promptText = generateVideoPrompt(params);
          console.log("Generated prompt text:", promptText);

          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
              "HTTP-Referer": window.location.origin,
              "X-Title": "Music Video Creator",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "mistralai/mixtral-8x7b-instruct", // Using a more stable model
              messages: [
                {
                  role: "system",
                  content: "You are a professional cinematographer. Create detailed prompts for video scenes."
                },
                {
                  role: "user",
                  content: promptText
                }
              ],
              temperature: 0.3, // Lower temperature for more consistent outputs
              max_tokens: 150
            })
          });

          const data = await response.json();
          console.log("API Response:", data);

          if (!response.ok) {
            const errorMessage = data.error?.message || response.statusText;
            console.error("API Error:", errorMessage);

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

          // Guardar en cache si fue exitoso
          const cacheKey = JSON.stringify(params);
          promptCache.set(cacheKey, generatedPrompt);

          resolve(generatedPrompt);
          return;

        } catch (error) {
          console.error(`Error in attempt ${retryCount + 1}:`, error);

          if (retryCount === maxRetries - 1) {
            // En el último intento, intentar usar el cache o el prompt base
            const cacheKey = JSON.stringify(params);
            const cachedPrompt = promptCache.get(cacheKey);
            if (cachedPrompt) {
              console.log("Using cached prompt as fallback");
              resolve(cachedPrompt);
              return;
            }

            // Si no hay cache, usar el prompt base
            const basePrompt = generateVideoPrompt(params);
            resolve(basePrompt);
            return;
          }

          await backoff(retryCount);
          retryCount++;
        }
      }
    };

    promptQueue.push(task);
    processQueue().catch(error => {
      console.error("Error in queue processing:", error);
      reject(error);
    });
  });
}

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
        model: "mistralai/mixtral-8x7b-instruct",
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
        model: "mistralai/mixtral-8x7b-instruct",
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

// También actualizamos las otras funciones para usar el mismo modelo
export async function generateVideoScript(prompt: string, maxRetries = 3) {
  let retryCount = 0;

  while (retryCount < maxRetries) {
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
          model: "mistralai/mixtral-8x7b-instruct",
          messages: [
            {
              role: "system",
              content: "You are a professional video director. Generate a detailed video script in JSON format."
            },
            { role: "user", content: prompt }
          ],
          temperature: 0.3,
          max_tokens: 2000,
          response_format: { type: "json_object" }
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.log("Rate limit hit, implementing backoff...");
          await backoff(retryCount);
          retryCount++;
          continue;
        }
        throw new Error(`Error generating script: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Script generation response:", data);

      if (!data.choices?.[0]?.message?.content) {
        throw new Error("Invalid API response format");
      }

      return data.choices[0].message.content;

    } catch (error) {
      console.error(`Error in attempt ${retryCount + 1}:`, error);

      if (retryCount === maxRetries - 1) {
        throw error;
      }

      await backoff(retryCount);
      retryCount++;
    }
  }
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
        model: "mistralai/mixtral-8x7b-instruct",
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
        model: "mistralai/mixtral-8x7b-instruct",
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