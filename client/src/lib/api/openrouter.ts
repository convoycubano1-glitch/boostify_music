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
            content: "You are a music industry education expert. Create detailed course outlines with structured lessons, practical assignments, and industry applications. Return response in a valid JSON format with the following structure: { overview: string, objectives: string[], curriculum: { title: string, description: string, duration: number }[], topics: string[], assignments: string[], applications: string[] }"
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

    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error generating course content:", error);
    throw new Error("Failed to generate course content. Please try again later.");
  }
}