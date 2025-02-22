import { env } from "@/env";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateCourseContent(prompt: string) {
  try {
    console.log("Starting course content generation with new implementation...");

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${env.VITE_OPENROUTER_API_KEY}`,
        "HTTP-Referer": window.location.origin,
        "X-Title": "Boostify Music Education",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-r1-distill-llama-70b:free",
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
      "duration": 60
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

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", errorData);
      throw new Error(`Error al generar el contenido del curso: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("OpenRouter raw response:", data);

    if (!data.choices?.[0]?.message?.content) {
      console.error("Invalid API response structure:", data);
      throw new Error("Formato de respuesta inválido de la API");
    }

    const content = data.choices[0].message.content;
    console.log("Raw content received:", content);

    try {
      const parsed = JSON.parse(content);

      // Validación estricta de la estructura
      if (typeof parsed.overview !== 'string') {
        throw new Error("El campo 'overview' debe ser un texto");
      }
      if (!Array.isArray(parsed.objectives) || parsed.objectives.length === 0) {
        throw new Error("El campo 'objectives' debe ser un array no vacío");
      }
      if (!Array.isArray(parsed.curriculum) || parsed.curriculum.length === 0) {
        throw new Error("El campo 'curriculum' debe ser un array no vacío");
      }
      if (!Array.isArray(parsed.topics) || parsed.topics.length === 0) {
        throw new Error("El campo 'topics' debe ser un array no vacío");
      }
      if (!Array.isArray(parsed.assignments) || parsed.assignments.length === 0) {
        throw new Error("El campo 'assignments' debe ser un array no vacío");
      }
      if (!Array.isArray(parsed.applications) || parsed.applications.length === 0) {
        throw new Error("El campo 'applications' debe ser un array no vacío");
      }

      // Validar cada lección en el curriculum
      for (const lesson of parsed.curriculum) {
        if (!lesson.title || !lesson.description || typeof lesson.duration !== 'number') {
          throw new Error("Cada lección debe tener título, descripción y duración");
        }
      }

      return parsed;
    } catch (parseError) {
      console.error("JSON parsing/validation error:", parseError);
      console.error("Content that failed validation:", content);
      throw new Error(`Error de validación: ${parseError.message}`);
    }
  } catch (error) {
    console.error("Course generation error:", error);
    throw error;
  }
}