import { env } from "@/env";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function generateCourseContent(prompt: string) {
  try {
    console.log("Starting course content generation...");

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
            content: "You are a music industry education expert. You must ONLY return a valid JSON object with EXACTLY this structure, no additional text or formatting:\n{\n  \"overview\": \"string describing the course overview\",\n  \"objectives\": [\"list of 3-5 learning objectives\"],\n  \"curriculum\": [{\"title\": \"lesson title\", \"description\": \"lesson description\", \"duration\": 60}],\n  \"topics\": [\"list of 5-7 key topics\"],\n  \"assignments\": [\"list of 3-4 practical assignments\"],\n  \"applications\": [\"list of 2-3 industry applications\"]\n}"
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
    console.log("Course content generated successfully:", data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Formato de respuesta inválido de la API de OpenRouter");
    }

    const content = data.choices[0].message.content;
    console.log("Raw content received:", content);

    // Try to parse and validate the JSON structure
    try {
      const parsed = JSON.parse(content);
      if (!parsed.overview || !Array.isArray(parsed.objectives) || !Array.isArray(parsed.curriculum)) {
        console.error("Invalid content structure:", parsed);
        throw new Error("La respuesta no tiene los campos requeridos");
      }
      return parsed;
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Received content:", content);
      throw new Error("El contenido generado no es un JSON válido. Por favor intente nuevamente.");
    }
  } catch (error) {
    console.error("Error generating course content:", error);
    throw error;
  }
}