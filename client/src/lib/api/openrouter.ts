import { env } from "@/env";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
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
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
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

export async function chatWithAI(messages: { role: 'user' | 'assistant' | 'system'; content: string }[]) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Boostify Music Education",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
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

// Nueva función para transcribir audio
export async function transcribeWithAI(audioBase64: string) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Boostify Music Video Creator",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
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

// Nueva función para generar scripts de video
export async function generateVideoScript(prompt: string) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Boostify Music Video Creator",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
        messages: [
          {
            role: "system",
            content: "You are a professional video director. Return only the requested JSON object without any additional text."
          },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
        response_format: { type: "json_object" }
      })
    });

    if (!response.ok) {
      throw new Error(`Error generating script: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Script generation error:", error);
    throw error;
  }
}

// Nueva función para analizar imágenes de referencia
export async function analyzeImage(imageUrl: string) {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Boostify Music Video Creator",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-lite-preview-02-05:free",
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
        temperature: 0.7,
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