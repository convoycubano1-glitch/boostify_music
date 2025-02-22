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
            content: "You are a music industry education expert. You MUST return your response in the following exact JSON format:\n{\n  \"overview\": \"string\",\n  \"objectives\": [\"string\"],\n  \"curriculum\": [{\"title\": \"string\", \"description\": \"string\", \"duration\": number}],\n  \"topics\": [\"string\"],\n  \"assignments\": [\"string\"],\n  \"applications\": [\"string\"]\n}\nDo not include any additional text or formatting outside of this JSON structure."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenRouter API error:", errorData);
      throw new Error(`Failed to generate course content: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Course content generated successfully:", data);

    if (!data.choices?.[0]?.message?.content) {
      throw new Error("Invalid response format from OpenRouter API");
    }

    const content = data.choices[0].message.content;
    console.log("Raw content received:", content);

    // Try to parse and validate the JSON structure
    try {
      const parsed = JSON.parse(content);
      if (!parsed.overview || !Array.isArray(parsed.objectives) || !Array.isArray(parsed.curriculum)) {
        throw new Error("Response is missing required fields");
      }
      return content;
    } catch (parseError) {
      console.error("JSON parsing error:", parseError);
      console.error("Received content:", content);
      throw new Error("The generated content is not in valid JSON format");
    }
  } catch (error) {
    console.error("Error generating course content:", error);
    throw error;
  }
}